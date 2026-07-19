import express from "express";
import { getDb } from "../lib/firebase";
import { doc, getDoc, runTransaction, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";

const router = express.Router();
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" }
});
const chatLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 5,
  message: { success: false, message: "Chat too fast" }
});
router.use(apiLimiter);



function encryptId(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function decryptId(text: string) {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift() as string, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text; // fallback for unencrypted
  }
}

function getPublicCode(telegramId: string) {
  const hash = crypto.createHash("sha256").update(String(telegramId)).digest("hex");
  return "RS" + hash.substring(0, 5).toUpperCase();
}

router.post("/join", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    const settingsSnap = await getDoc(doc(db, "settings", "sos"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { enabled: true, entryFee: 5 };

    if (!settings || settings.enabled === false) {
      return res.status(400).json({ success: false, message: "Game is currently disabled." });
    }

    const entryFee = settings.entryFee || 5;

    let newBalance = 0;

    await runTransaction(db, async (t) => {
      const queueRef = doc(db, "sos_queue", String(telegramId));
      const queueSnap = await t.get(queueRef);
      if (queueSnap.exists()) {
        throw new Error("You are already in a queue or match.");
      }

      const userRef = doc(db, "users", String(telegramId));
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      const totalBalance = (userData.balance || 0) + (userData.rewardBalance || 0);
      if (totalBalance < entryFee) {
        throw new Error("Insufficient Balance");
      }

      let deductFromReward = 0;
      let deductFromMain = 0;
      if (userData.rewardBalance >= entryFee) {
        deductFromReward = entryFee;
      } else {
        deductFromReward = userData.rewardBalance || 0;
        deductFromMain = entryFee - deductFromReward;
      }

      t.update(userRef, {
        rewardBalance: Math.max(0, (userData.rewardBalance || 0) - deductFromReward),
        balance: Math.max(0, (userData.balance || 0) - deductFromMain)
      });
      newBalance = totalBalance - entryFee;

      t.set(queueRef, {
        telegramId: String(telegramId),
        publicCode: getPublicCode(telegramId),
        joinedAt: serverTimestamp(),
        status: "searching",
        matchId: null,
        paidFromReward: deductFromReward,
        paidFromMain: deductFromMain
      });

      const txRef = doc(collection(db, "transactions"));
      t.set(txRef, {
        userId: String(telegramId),
        amount: entryFee,
        type: "debit",
        description: "Split or Steal Entry Fee",
        timestamp: serverTimestamp(),
        status: "completed"
      });
    });

    res.json({ success: true, newBalance, publicCode: getPublicCode(telegramId) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/matchmake", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    const myQueueRef = doc(db, "sos_queue", String(telegramId));
    const myQueueSnap = await getDoc(myQueueRef);
    if (!myQueueSnap.exists()) return res.json({ success: false, status: "not_in_queue" });
    
    const myQueue = myQueueSnap.data();
    if (myQueue.status === "matched" && myQueue.matchId) {
      return res.json({ success: true, status: "matched", matchId: myQueue.matchId });
    }

    const queueQuery = query(collection(db, "sos_queue"), where("status", "==", "searching"));
    const queueSnaps = await getDocs(queueQuery);
    
    let opponent = null;
    for (const docSnap of queueSnaps.docs) {
      if (docSnap.id !== String(telegramId)) {
        opponent = { id: docSnap.id, ...docSnap.data() };
        break;
      }
    }

    const settingsSnap = await getDoc(doc(db, "settings", "sos"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { aiEnabled: false, humanWaitTime: 15, discussionTimer: 60 };

    if (opponent) {
      let matchId = null;
      await runTransaction(db, async (t) => {
        const tOpponentSnap = await t.get(doc(db, "sos_queue", opponent.id));
        const tMySnap = await t.get(myQueueRef);
        
        if (tOpponentSnap.data()?.status === "searching" && tMySnap.data()?.status === "searching") {
          const matchRef = doc(collection(db, "sos_matches"));
          matchId = matchRef.id;
          
          t.set(matchRef, {
            id: matchId,
            status: "discussion",
            discussionEndTime: Date.now() + (settings.discussionTimer || 60) * 1000,
            decisionEndTime: Date.now() + ((settings.discussionTimer || 60) + (settings.decisionTimer || 15)) * 1000,
            prizePool: settings.prizePool || 20,
            entryFee: settings.entryFee || 5,
            player1: { encTelegramId: encryptId(String(telegramId)), publicCode: myQueue.publicCode, decision: null, isAI: false, submittedAt: null },
            player2: { encTelegramId: encryptId(opponent.telegramId), publicCode: opponent.publicCode, decision: null, isAI: false, submittedAt: null },
            createdAt: serverTimestamp()
          });

          t.update(myQueueRef, { status: "matched", matchId });
          t.update(doc(db, "sos_queue", opponent.id), { status: "matched", matchId });
        }
      });

      if (matchId) {
        return res.json({ success: true, status: "matched", matchId });
      }
    }

    const joinedAt = myQueue.joinedAt?.toDate() || new Date();
    const waitTime = (Date.now() - joinedAt.getTime()) / 1000;

    if (settings.aiEnabled && waitTime > (settings.humanWaitTime || 15)) {
      let matchId = null;
      await runTransaction(db, async (t) => {
        const tMySnap = await t.get(myQueueRef);
        if (tMySnap.data()?.status === "searching") {
          const matchRef = doc(collection(db, "sos_matches"));
          matchId = matchRef.id;
          
          const aiPersonalities = settings.aiPersonalities || ["honest", "greedy", "smart", "confused", "silent", "random"];
          const aiPersonality = aiPersonalities[Math.floor(Math.random() * aiPersonalities.length)];

          const aiId = "AI_" + Date.now();
          t.set(matchRef, {
            id: matchId,
            status: "discussion",
            discussionEndTime: Date.now() + (settings.discussionTimer || 60) * 1000,
            decisionEndTime: Date.now() + ((settings.discussionTimer || 60) + (settings.decisionTimer || 15)) * 1000,
            prizePool: settings.prizePool || 20,
            entryFee: settings.entryFee || 5,
            player1: { telegramId: String(telegramId), publicCode: myQueue.publicCode, decision: null, isAI: false, submittedAt: null },
            player2: { encTelegramId: encryptId(aiId), publicCode: "RS" + Math.floor(Math.random()*90000+10000), decision: null, isAI: true, personality: aiPersonality, submittedAt: null },
            createdAt: serverTimestamp()
          });

          t.update(myQueueRef, { status: "matched", matchId });
        }
      });
      if (matchId) {
        return res.json({ success: true, status: "matched", matchId });
      }
    }

    return res.json({ success: true, status: "searching" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cancel-queue", async (req, res) => {
  try {
    const { telegramId } = req.body;
    const db = getDb();
    let refunded = false;

    await runTransaction(db, async (t) => {
      const qRef = doc(db, "sos_queue", String(telegramId));
      const qSnap = await t.get(qRef);
      if (!qSnap.exists()) return;

      if (qSnap.data().status === "searching") {
        const queueData = qSnap.data();
        const userRef = doc(db, "users", String(telegramId));
        const userSnap = await t.get(userRef);
        if (userSnap.exists()) {
          const paidFromReward = queueData.paidFromReward || 0;
          const paidFromMain = queueData.paidFromMain || 0;
          const totalRefund = paidFromReward + paidFromMain;

          t.update(userRef, {
            balance: (userSnap.data().balance || 0) + paidFromMain,
            rewardBalance: (userSnap.data().rewardBalance || 0) + paidFromReward
          });
          
          if (totalRefund > 0) {
            t.set(doc(collection(db, "transactions")), {
              userId: String(telegramId),
              amount: totalRefund,
              type: "credit",
              description: "Split or Steal Refund",
              timestamp: serverTimestamp(),
              status: "completed"
            });
          }
          refunded = true;
        }
        t.delete(qRef);
      }
    });

    res.json({ success: true, refunded });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/submit-decision", async (req, res) => {
  try {
    const { telegramId, matchId, decision } = req.body;
    if (!telegramId || !matchId || !decision) return res.status(400).json({ success: false });
    if (decision !== "split" && decision !== "steal") return res.status(400).json({ success: false, message: "Invalid decision" });

    const db = getDb();
    let resultCalculated = false;

    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "sos_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");

      const match = matchSnap.data();
      const isPlayer1 = decryptId(match.player1.encTelegramId || match.player1.telegramId) === String(telegramId);
      const isPlayer2 = decryptId(match.player2.encTelegramId || match.player2.telegramId) === String(telegramId);

      if (!isPlayer1 && !isPlayer2) throw new Error("Not part of match");

      if (match.status === "completed" || match.status === "cancelled" || match.status === "revealing") {
        return; // already processed
      }

      const decRef = doc(db, "sos_decisions", matchId);
      const decSnap = await t.get(decRef);
      const decData = decSnap.exists() ? decSnap.data() : { player1Decision: null, player2Decision: null };

      if (isPlayer1 && decData.player1Decision) return;
      if (isPlayer2 && decData.player2Decision) return;

      if (isPlayer1) decData.player1Decision = decision;
      if (isPlayer2) decData.player2Decision = decision;

      if (match.player2.isAI && !decData.player2Decision) {
        const p = match.player2.personality;
        let aiDecision = "split";
        if (p === "greedy") aiDecision = "steal";
        else if (p === "honest") aiDecision = "split";
        else if (p === "random") aiDecision = Math.random() > 0.5 ? "split" : "steal";
        else if (p === "smart") aiDecision = Math.random() > 0.3 ? "split" : "steal";
        decData.player2Decision = aiDecision;
      }

      t.set(decRef, decData, { merge: true });

      const updates: any = {};
      if (isPlayer1) updates.player1Submitted = true;
      if (isPlayer2 || match.player2.isAI) updates.player2Submitted = true;

      const p1Decided = decData.player1Decision != null;
      const p2Decided = decData.player2Decision != null;

      if (p1Decided && p2Decided) {
        updates.status = "revealing";
        resultCalculated = true;
      }

      if (Object.keys(updates).length > 0) {
        t.update(matchRef, updates);
      }
    });

    res.json({ success: true, resultCalculated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.post("/process-result", async (req, res) => {
  try {
    const { matchId } = req.body;
    const db = getDb();

    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "sos_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");
      const match = matchSnap.data();

      if (match.status === "completed" || match.status === "cancelled") return;
      
      const p1 = match.player1;
      const p2 = match.player2;

      const now = Date.now();
      const isTimeout = match.decisionEndTime && now > (match.decisionEndTime + 5000);

      if (match.status !== "revealing" && !isTimeout) {
        throw new Error("Match not ready to process");
      }

      const decRef = doc(db, "sos_decisions", matchId);
      const decSnap = await t.get(decRef);
      const decData = decSnap.exists() ? decSnap.data() : { player1Decision: null, player2Decision: null };

      if (isTimeout && match.status !== "revealing") {
          if (!decData.player1Decision) decData.player1Decision = "split";
          if (!decData.player2Decision) decData.player2Decision = "split";
      }

      p1.decision = decData.player1Decision;
      p2.decision = decData.player2Decision;

      const prizePool = match.prizePool || 20;
      
      let p1Win = 0;
      let p2Win = 0;

      if (p1.decision === "split" && p2.decision === "split") {
        p1Win = prizePool / 2;
        p2Win = prizePool / 2;
      } else if (p1.decision === "steal" && p2.decision === "split") {
        p1Win = prizePool;
      } else if (p1.decision === "split" && p2.decision === "steal") {
        p2Win = prizePool;
      }

      t.update(matchRef, { status: "completed", p1Win, p2Win, player1: p1, player2: p2 });

      if (p1Win > 0) {
        const u1Ref = doc(db, "users", decryptId(p1.encTelegramId || p1.telegramId));
        const u1Snap = await t.get(u1Ref);
        if (u1Snap.exists()) {
          t.update(u1Ref, { balance: (u1Snap.data().balance || 0) + p1Win });
          t.set(doc(collection(db, "transactions")), {
            userId: decryptId(p1.encTelegramId || p1.telegramId),
            amount: p1Win,
            type: "credit",
            description: "Split or Steal Win",
            timestamp: serverTimestamp(),
            status: "completed"
          });
        }
      }

      if (p2Win > 0 && !p2.isAI) {
        const u2Ref = doc(db, "users", decryptId(p2.encTelegramId || p2.telegramId));
        const u2Snap = await t.get(u2Ref);
        if (u2Snap.exists()) {
          t.update(u2Ref, { balance: (u2Snap.data().balance || 0) + p2Win });
          t.set(doc(collection(db, "transactions")), {
            userId: decryptId(p2.encTelegramId || p2.telegramId),
            amount: p2Win,
            type: "credit",
            description: "Split or Steal Win",
            timestamp: serverTimestamp(),
            status: "completed"
          });
        }
      }
      
      // Cleanup queue
      t.delete(doc(db, "sos_queue", decryptId(p1.encTelegramId || p1.telegramId)));
      if (!p2.isAI) {
        t.delete(doc(db, "sos_queue", decryptId(p2.encTelegramId || p2.telegramId)));
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

let lastAiProcessMap = new Map();
router.post("/ai-poll", async (req, res) => {
  try {
    const { matchId } = req.body;
    
    // throttle
    const now = Date.now();
    const last = lastAiProcessMap.get(matchId) || 0;
    if (now - last < 5000) {
      return res.json({ success: true, skipped: true });
    }
    lastAiProcessMap.set(matchId, now);

    const db = getDb();
    const matchSnap = await getDoc(doc(db, "sos_matches", matchId));
    if (!matchSnap.exists()) return res.json({ success: false });
    
    const match = matchSnap.data();
    if (match.status !== "discussion" || !match.player2.isAI) {
        return res.json({ success: true });
    }

    const msgsQuery = query(collection(db, "sos_messages"), where("matchId", "==", matchId));
    const msgsSnap = await getDocs(msgsQuery);
    
    // sort and build chat history
    let msgs: any[] = [];
    msgsSnap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
    msgs.sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
    
    const lastMsg = msgs[msgs.length - 1];
    
    // if last message is from AI, 80% chance it doesn't double-text
    if (lastMsg && lastMsg.senderId === match.player2.publicCode && Math.random() < 0.8) {
      return res.json({ success: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ success: true });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let chatHistory = msgs.map(m => {
      return `${m.senderId === match.player2.publicCode ? "AI" : "Opponent"}: ${m.text}`
    }).join("\n");
    if (!chatHistory) chatHistory = "No messages yet.";

    const prompt = `You are playing 'Split or Steal'. Your personality is: ${match.player2.personality}. Your goal is to convince the opponent you will Split, or whatever fits your personality. Keep it very short (1 sentence), like a real chat. NEVER reveal you are an AI. If the opponent asks if you are AI, deny it naturally.
Current chat history:
${chatHistory}
Reply with only your next message text:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const aiText = response.text?.trim() || "Let's split.";

    await addDoc(collection(db, "sos_messages"), {
      matchId,
      senderId: match.player2.publicCode,
      text: aiText,
      timestamp: serverTimestamp(),
      isAI: true
    });

    res.json({ success: true, aiMessage: aiText });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/chat", chatLimiter, async (req, res) => {
  try {
    const { telegramId, matchId, text } = req.body;
    if (!telegramId || !matchId || !text || typeof text !== "string") return res.status(400).json({ success: false, message: "Invalid payload" });
    
    const sanitizedText = sanitizeHtml(text.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    }).substring(0, 100);

    if (!sanitizedText) return res.status(400).json({ success: false, message: "Empty message" });

    const db = getDb();
    
    const matchSnap = await getDoc(doc(db, "sos_matches", matchId));
    if (!matchSnap.exists()) return res.status(404).json({ success: false });
    
    const match = matchSnap.data();
    if (match.status !== "discussion") return res.status(400).json({ success: false, message: "Not in discussion" });
    
    let isPlayer1 = decryptId(match.player1.encTelegramId || match.player1.telegramId) === String(telegramId);
    let isPlayer2 = decryptId(match.player2.encTelegramId || match.player2.telegramId) === String(telegramId);
    
    if (!isPlayer1 && !isPlayer2) return res.status(403).json({ success: false });
    
    const publicCode = isPlayer1 ? match.player1.publicCode : match.player2.publicCode;
    
    await addDoc(collection(db, "sos_messages"), {
      matchId,
      senderId: publicCode,
      text: sanitizedText,
      timestamp: serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/cron/cleanup", async (req, res) => {
  try {
    const db = getDb();
    const now = Date.now();
    let cleanedQueues = 0;
    let cleanedMatches = 0;

    // 1. Stale Queues (older than 10 mins)
    const queueSnap = await getDocs(collection(db, "sos_queue"));
    for (const docSnap of queueSnap.docs) {
      const q = docSnap.data();
      const joinedAt = q.joinedAt?.toMillis ? q.joinedAt.toMillis() : now;
      if (q.status === "searching" && (now - joinedAt) > 10 * 60 * 1000) {
        await runTransaction(db, async (t) => {
          const qRef = doc(db, "sos_queue", docSnap.id);
          const currentQ = await t.get(qRef);
          if (!currentQ.exists() || currentQ.data().status !== "searching") return;
          
          const userRef = doc(db, "users", q.telegramId);
          const userSnap = await t.get(userRef);
          if (userSnap.exists()) {
            const paidFromReward = q.paidFromReward || 0;
            const paidFromMain = q.paidFromMain || 0;
            const totalRefund = paidFromReward + paidFromMain;
            
            t.update(userRef, {
              balance: (userSnap.data().balance || 0) + paidFromMain,
              rewardBalance: (userSnap.data().rewardBalance || 0) + paidFromReward
            });

            if (totalRefund > 0) {
              t.set(doc(collection(db, "transactions")), {
                userId: String(q.telegramId),
                amount: totalRefund,
                type: "credit",
                description: "Split or Steal Refund (Timeout)",
                timestamp: serverTimestamp(),
                status: "completed"
              });
            }
          }
          t.delete(qRef);
          cleanedQueues++;
        });
      }
    }

    // 2. Stuck Matches
    const matchSnap = await getDocs(collection(db, "sos_matches"));
    for (const docSnap of matchSnap.docs) {
      const match = docSnap.data();
      if (match.status !== "completed" && match.status !== "cancelled") {
        const decisionEnd = match.decisionEndTime || 0;
        if (decisionEnd > 0 && now > decisionEnd + 15000) {
          // Force process
          await fetch(`http://127.0.0.1:3000/api/split-or-steal/process-result`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: docSnap.id })
          }).catch(() => {});
          cleanedMatches++;
        }
      }
    }

    res.json({ success: true, cleanedQueues, cleanedMatches });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
