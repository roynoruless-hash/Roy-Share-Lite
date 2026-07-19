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
function decryptId(text: any) {
  if (!text || typeof text !== "string") return "";
  try {
    const textParts = text.split(":");
    if (textParts.length < 2) return text;
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

          console.log(`[SERVER LOG] Match Created: matchId=${matchId}, player1=${myQueue.publicCode}, player2=${opponent.publicCode}`);
          console.log(`[SERVER LOG] Chat Started: matchId=${matchId}`);

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

          console.log(`[SERVER LOG] Match Created: matchId=${matchId}, player1=${myQueue.publicCode}, player2=RS_AI_OPPONENT`);
          console.log(`[SERVER LOG] Chat Started: matchId=${matchId}`);

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

// STRICT SERVER-SIDE STATE MACHINE DEFINITIONS
const ALLOWED_STATES = [
  "WAITING", "MATCHED", "DISCUSSION", "DECISION_PENDING",
  "PLAYER_SUBMITTED", "AI_SUBMITTED", "READY_TO_RESOLVE",
  "RESOLVING", "REVEALING", "COMPLETED", "CANCELLED"
] as const;

type AllowedState = typeof ALLOWED_STATES[number];

const STATE_TRANSITIONS: Record<AllowedState, AllowedState[]> = {
  WAITING: ["MATCHED", "CANCELLED"],
  MATCHED: ["DISCUSSION", "CANCELLED"],
  DISCUSSION: ["DECISION_PENDING", "PLAYER_SUBMITTED", "READY_TO_RESOLVE", "REVEALING", "COMPLETED", "CANCELLED"],
  DECISION_PENDING: ["PLAYER_SUBMITTED", "AI_SUBMITTED", "READY_TO_RESOLVE", "REVEALING", "COMPLETED", "CANCELLED"],
  PLAYER_SUBMITTED: ["READY_TO_RESOLVE", "REVEALING", "COMPLETED", "CANCELLED"],
  AI_SUBMITTED: ["READY_TO_RESOLVE", "REVEALING", "COMPLETED", "CANCELLED"],
  READY_TO_RESOLVE: ["RESOLVING", "REVEALING", "COMPLETED", "CANCELLED"],
  RESOLVING: ["REVEALING", "COMPLETED", "CANCELLED"],
  REVEALING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

function isValidTransition(from: string, to: string): boolean {
  const f = from.toUpperCase() as AllowedState;
  const t = to.toUpperCase() as AllowedState;
  if (!ALLOWED_STATES.includes(f) || !ALLOWED_STATES.includes(t)) return false;
  return STATE_TRANSITIONS[f].includes(t);
}

// ROBUST UNIFIED RESOLVER Helper to ensure exactly-once execution and eliminate loopback fetches
async function resolveMatchInternal(matchId: string): Promise<{ success: boolean; processed: boolean; message?: string }> {
  const db = getDb();
  console.log(`[SERVER LOG] Resolve Started: matchId=${matchId}`);

  let processed = false;
  try {
    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "sos_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");
      const match = matchSnap.data();

      const currentStatus = (match.status || "").toUpperCase();
      if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED" || match.resultProcessed) {
        processed = true;
        return;
      }

      // Transition to RESOLVING immediately inside transaction to block any concurrent execution
      t.update(matchRef, { status: "RESOLVING" });

      const p1 = match.player1;
      const p2 = match.player2;
      const now = Date.now();

      const decRef = doc(db, "sos_decisions", matchId);
      const decSnap = await t.get(decRef);
      const decData = decSnap.exists() ? decSnap.data() : { player1Decision: null, player2Decision: null };

      // Ensure decisions are never missing or blocked
      let p1Decision = decData.player1Decision;
      let p2Decision = decData.player2Decision;

      if (!p1Decision) {
        p1Decision = "split";
        console.log(`[SERVER LOG] Player 1 decision missing, defaulted to split for match ${matchId}`);
      }

      if (!p2Decision) {
        if (p2.isAI) {
          const p = p2.personality;
          if (p === "greedy") p2Decision = "steal";
          else if (p === "honest") p2Decision = "split";
          else if (p === "random") p2Decision = Math.random() > 0.5 ? "split" : "steal";
          else if (p === "smart") p2Decision = Math.random() > 0.3 ? "split" : "steal";
          else p2Decision = "split";
          console.log(`[SERVER LOG] AI Decision Saved (Fallback): matchId=${matchId}, aiCode=${p2.publicCode}, decision=${p2Decision}`);
        } else {
          p2Decision = "split";
          console.log(`[SERVER LOG] Player 2 decision missing, defaulted to split for match ${matchId}`);
        }
      }

      decData.player1Decision = p1Decision;
      decData.player2Decision = p2Decision;
      t.set(decRef, decData, { merge: true });

      p1.decision = p1Decision;
      p2.decision = p2Decision;

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

      t.update(matchRef, { 
        status: "COMPLETED", 
        p1Win, 
        p2Win, 
        player1: p1, 
        player2: p2,
        resultProcessed: true,
        resolvedAt: now
      });
      console.log(`[SERVER LOG] Firestore Updated: matchId=${matchId}, status=COMPLETED`);

      if (p1Win > 0) {
        const u1Id = decryptId(p1.encTelegramId || p1.telegramId);
        const u1Ref = doc(db, "users", u1Id);
        const u1Snap = await t.get(u1Ref);
        if (u1Snap.exists()) {
          t.update(u1Ref, { balance: (u1Snap.data().balance || 0) + p1Win });
          t.set(doc(collection(db, "transactions")), {
            userId: u1Id,
            amount: p1Win,
            type: "credit",
            description: "Split or Steal Win",
            timestamp: serverTimestamp(),
            status: "completed"
          });
          console.log(`[SERVER LOG] Wallet Credited: matchId=${matchId}, userId=${u1Id}, amount=${p1Win}`);
        }
      }

      if (p2Win > 0 && !p2.isAI) {
        const u2Id = decryptId(p2.encTelegramId || p2.telegramId);
        const u2Ref = doc(db, "users", u2Id);
        const u2Snap = await t.get(u2Ref);
        if (u2Snap.exists()) {
          t.update(u2Ref, { balance: (u2Snap.data().balance || 0) + p2Win });
          t.set(doc(collection(db, "transactions")), {
            userId: u2Id,
            amount: p2Win,
            type: "credit",
            description: "Split or Steal Win",
            timestamp: serverTimestamp(),
            status: "completed"
          });
          console.log(`[SERVER LOG] Wallet Credited: matchId=${matchId}, userId=${u2Id}, amount=${p2Win}`);
        }
      }

      // Cleanup queue
      t.delete(doc(db, "sos_queue", decryptId(p1.encTelegramId || p1.telegramId)));
      if (!p2.isAI) {
        t.delete(doc(db, "sos_queue", decryptId(p2.encTelegramId || p2.telegramId)));
      }
      processed = true;
    });

    console.log(`[SERVER LOG] Match Resolved: matchId=${matchId}`);
    console.log(`[SERVER LOG] Reveal Complete: matchId=${matchId}`);
    console.log(`[SERVER LOG] Reveal Published: matchId=${matchId}`);
    console.log(`[SERVER LOG] Match Completed: matchId=${matchId}`);
    return { success: true, processed };
  } catch (error: any) {
    console.error(`[SERVER LOG] Error in resolveMatchInternal for ${matchId}:`, error);
    return { success: false, processed: false, message: error.message };
  }
}

router.post("/submit-decision", async (req, res) => {
  try {
    const { telegramId, matchId, decision, adCompleted } = req.body;
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

      const currentStatus = (match.status || "").toUpperCase();
      if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED" || currentStatus === "REVEALING" || currentStatus === "RESOLVING") {
        return; // already processed
      }

      const decRef = doc(db, "sos_decisions", matchId);
      const decSnap = await t.get(decRef);
      const decData = decSnap.exists() ? decSnap.data() : { player1Decision: null, player2Decision: null };

      if (isPlayer1 && decData.player1Decision) return;
      if (isPlayer2 && decData.player2Decision) return;

      if (isPlayer1) decData.player1Decision = decision;
      if (isPlayer2) decData.player2Decision = decision;

      const playerCode = isPlayer1 ? match.player1.publicCode : match.player2.publicCode;
      
      if (adCompleted) {
        console.log(`[SERVER LOG] Reward Ad Completed: matchId=${matchId}, playerCode=${playerCode}`);
      }
      console.log(`[SERVER LOG] Player Decision Saved: matchId=${matchId}, playerCode=${playerCode}, decision=${decision}`);

      if (match.player2.isAI && !decData.player2Decision) {
        const p = match.player2.personality;
        let aiDecision = "split";
        if (p === "greedy") aiDecision = "steal";
        else if (p === "honest") aiDecision = "split";
        else if (p === "random") aiDecision = Math.random() > 0.5 ? "split" : "steal";
        else if (p === "smart") aiDecision = Math.random() > 0.3 ? "split" : "steal";
        decData.player2Decision = aiDecision;
        console.log(`[SERVER LOG] AI Decision Saved: matchId=${matchId}, aiCode=${match.player2.publicCode}, decision=${aiDecision}`);
      }

      t.set(decRef, decData, { merge: true });

      const p1Submitted = isPlayer1 ? true : !!match.player1Submitted;
      const p2Submitted = (isPlayer2 || match.player2.isAI) ? true : !!match.player2Submitted;

      const p1Decided = decData.player1Decision != null;
      const p2Decided = decData.player2Decision != null;

      let nextStatus: AllowedState = "PLAYER_SUBMITTED";
      if (p1Decided && p2Decided) {
        nextStatus = "REVEALING";
        resultCalculated = true;
      }

      const updates: any = {
        status: nextStatus,
        player1Submitted: p1Submitted,
        player2Submitted: p2Submitted
      };

      if (nextStatus === "REVEALING") {
        updates.revealingStartedAt = Date.now();
      }

      // Enforce State Machine Validation
      if (isValidTransition(currentStatus, nextStatus)) {
        t.update(matchRef, updates);
        console.log(`[SERVER LOG] Firestore Updated: matchId=${matchId}, status=${nextStatus}`);
      } else {
        console.warn(`[SERVER LOG] Blocked invalid state transition from ${currentStatus} to ${nextStatus} for match ${matchId}`);
      }
    });

    res.json({ success: true, resultCalculated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/process-result", async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ success: false, message: "Missing matchId" });

  const result = await resolveMatchInternal(matchId);
  if (result.success) {
    res.json({ success: true, processed: result.processed });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

// Proactive Recovery Endpoint
router.post("/recover", async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ success: false, message: "Missing matchId" });

  try {
    const db = getDb();
    const matchRef = doc(db, "sos_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      return res.json({ success: false, status: "CANCELLED", message: "Match not found" });
    }

    const match = matchSnap.data();
    const statusUpper = (match.status || "").toUpperCase();

    // 1. If completed or cancelled, return result immediately
    if (statusUpper === "COMPLETED" || statusUpper === "CANCELLED" || match.resultProcessed) {
      return res.json({ success: true, status: statusUpper });
    }

    // 2. If invalid (missing crucial players data), cancel safely
    if (!match.player1 || !match.player2) {
      console.warn(`[SERVER LOG] Stuck Match ${matchId} is structurally invalid. Cancelling safely...`);
      await updateDoc(matchRef, { status: "CANCELLED", cancelledReason: "Invalid Match Structure" }).catch(console.error);
      return res.json({ success: true, status: "CANCELLED" });
    }

    const now = Date.now();
    const isRevealing = statusUpper === "REVEALING";
    const revealingElapsed = match.revealingStartedAt ? (now - match.revealingStartedAt) : 0;

    const isTimeout = match.decisionEndTime && now > (match.decisionEndTime + 5000);
    const isRevealingTimeout = isRevealing && (revealingElapsed > 5000 || !match.revealingStartedAt);

    // 3. If broken/stuck in revealing (elapsed > 5s) or timed out, force resolve
    if (isRevealingTimeout || isTimeout) {
      console.log(`[SERVER LOG] Recovery triggered for stuck match ${matchId}. Status: ${match.status}. Force completing...`);
      const result = await resolveMatchInternal(matchId);
      if (result.success) {
        return res.json({ success: true, status: "COMPLETED", recovered: true });
      } else {
        // Fallback recovery if transaction fails: force cancel to avoid infinite loading
        console.error(`[SERVER LOG] resolveMatchInternal failed during recovery for match ${matchId}: ${result.message}. Force-cancelling match...`);
        await updateDoc(matchRef, { 
          status: "CANCELLED", 
          cancelledReason: "Recovery Failure: " + (result.message || "Unknown error")
        }).catch(console.error);
        return res.json({ success: true, status: "CANCELLED", recovered: false, error: result.message });
      }
    }

    res.json({ success: true, status: statusUpper });
  } catch (error: any) {
    console.error(`[SERVER LOG] Error in /recover for match ${matchId}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ad Refund / Cancel Endpoint
router.post("/refund-match", async (req, res) => {
  try {
    const { telegramId, matchId } = req.body;
    if (!telegramId || !matchId) return res.status(400).json({ success: false, message: "Missing params" });

    const db = getDb();
    let refunded = false;

    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "sos_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) return;

      const match = matchSnap.data();
      if (match.status === "completed" || match.status === "cancelled") return;

      const isP1 = decryptId(match.player1.encTelegramId || match.player1.telegramId) === String(telegramId);
      const isP2 = decryptId(match.player2.encTelegramId || match.player2.telegramId) === String(telegramId);

      if (!isP1 && !isP2) return;

      t.update(matchRef, { status: "cancelled", cancelledReason: "Ad Playback Failure / Refund Policy" });

      const entryFee = match.entryFee || 5;

      const refundPlayer = async (p: any) => {
        if (p.isAI) return;
        const pId = decryptId(p.encTelegramId || p.telegramId);
        const uRef = doc(db, "users", pId);
        const uSnap = await t.get(uRef);
        if (uSnap.exists()) {
          t.update(uRef, {
            balance: (uSnap.data().balance || 0) + entryFee
          });
          t.set(doc(collection(db, "transactions")), {
            userId: pId,
            amount: entryFee,
            type: "credit",
            description: "Split or Steal Refund (Ad Failure)",
            timestamp: serverTimestamp(),
            status: "completed"
          });
          console.log(`[SERVER LOG] Wallet Credited (Refund): matchId=${matchId}, userId=${pId}, amount=${entryFee}`);
        }
      };

      await refundPlayer(match.player1);
      await refundPlayer(match.player2);

      t.delete(doc(db, "sos_queue", decryptId(match.player1.encTelegramId || match.player1.telegramId)));
      if (!match.player2.isAI) {
        t.delete(doc(db, "sos_queue", decryptId(match.player2.encTelegramId || match.player2.telegramId)));
      }

      refunded = true;
    });

    if (refunded) {
      console.log(`[SERVER LOG] Match Closed (Refund): matchId=${matchId}`);
    }

    res.json({ success: true, refunded });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PERSONALITY_FALLBACKS: Record<string, string[]> = {
  honest: [
    "Hey! I really think we should split. Let's both win!",
    "I'm 100% going with split. It's the best option.",
    "Let's be cool and split the prize pool.",
    "Cooperation is key. I promise I will split.",
    "Split is the only way where both of us get rewarded. Let's do it!"
  ],
  greedy: [
    "Yeah, splitting is totally the move here. Hands down.",
    "I'm clicking split, you click split too!",
    "Trust me, let's play safe and split the pool.",
    "Let's make this quick, split is the standard win-win.",
    "Cooperate and split. It's better than getting zero, right?"
  ],
  smart: [
    "Mathematically speaking, splitting guarantees mutual payout. Let's do that.",
    "If we both split, we get a solid payout. Let's cooperate.",
    "Cooperating is the dominant strategy here. I will split.",
    "Let's secure the 50/50 split rather than risking everything.",
    "Split sounds like the logical choice for both of us."
  ],
  random: [
    "Yo! Split or Steal?",
    "Split sounds good to me, how about you?",
    "Let's go with split! It's a nice day to win some coins.",
    "Handshake or the devil? I'll go with handshake (split)!",
    "Let's cooperate. Split is fun!"
  ],
  confused: [
    "Wait, how does this game work again? Should we split?",
    "Is split the handshake one?",
    "I'll go with split, I guess.",
    "Hey! I'm new to this, but let's split the prize."
  ],
  silent: [
    "...",
    "Yeah...",
    "Ok"
  ]
};

let lastAiProcessMap = new Map();
router.post("/ai-poll", async (req, res) => {
  try {
    const { matchId } = req.body;
    
    // Throttle polls to once every 2 seconds
    const now = Date.now();
    const last = lastAiProcessMap.get(matchId) || 0;
    if (now - last < 2000) {
      return res.json({ success: true, skipped: true, reason: "throttled" });
    }
    lastAiProcessMap.set(matchId, now);

    const db = getDb();
    const matchRef = doc(db, "sos_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) return res.json({ success: false });
    
    const match = matchSnap.data();
    if (match.status !== "discussion" || !match.player2.isAI) {
      return res.json({ success: true, skipped: true, reason: "match_not_active_or_not_ai" });
    }

    // Lock check: if already typing, skip duplicate generation
    if (match.player2Typing) {
      return res.json({ success: true, skipped: true, reason: "already_typing" });
    }

    const msgsQuery = query(collection(db, "sos_messages"), where("matchId", "==", matchId));
    const msgsSnap = await getDocs(msgsQuery);
    
    // Sort in memory by timestamp
    let msgs: any[] = [];
    msgsSnap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
    msgs.sort((a, b) => {
      const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return tA - tB;
    });
    
    const lastMsg = msgs[msgs.length - 1];
    
    // Decide if AI should speak:
    // 1. Chat history is empty (AI initiates conversation)
    // 2. Last message is from human player (AI replies)
    let shouldSpeak = false;
    if (msgs.length === 0) {
      shouldSpeak = true;
    } else if (lastMsg && lastMsg.senderId !== match.player2.publicCode) {
      shouldSpeak = true;
    }

    if (!shouldSpeak) {
      return res.json({ success: true, skipped: true, reason: "not_my_turn" });
    }

    // Set typing state to true and sleep for a realistic duration
    await updateDoc(matchRef, { player2Typing: true });
    
    const delayMs = Math.floor(Math.random() * 2000) + 1500; // 1.5s to 3.5s delay
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Re-verify match status is still active after delay
    const reMatchSnap = await getDoc(matchRef);
    if (!reMatchSnap.exists() || reMatchSnap.data().status !== "discussion") {
      await updateDoc(matchRef, { player2Typing: false });
      return res.json({ success: true, skipped: true, reason: "discussion_ended_during_typing" });
    }

    let aiText = "";

    // Generate message using Gemini API, with a reliable custom fallback if it fails or if key is missing
    if (process.env.GEMINI_API_KEY) {
      try {
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
        
        aiText = response.text?.trim() || "";
        // Strip any wrapping quotes
        if (aiText.startsWith('"') && aiText.endsWith('"')) {
          aiText = aiText.slice(1, -1);
        }
      } catch (geminiErr) {
        console.error("Gemini API error during Split or Steal AI generation:", geminiErr);
      }
    }

    // Fallback logic
    if (!aiText) {
      const pGroup = match.player2.personality || "random";
      const pool = PERSONALITY_FALLBACKS[pGroup] || PERSONALITY_FALLBACKS["random"];
      aiText = pool[Math.floor(Math.random() * pool.length)];
    }

    // Save the AI message
    await addDoc(collection(db, "sos_messages"), {
      matchId,
      senderId: match.player2.publicCode,
      text: aiText,
      timestamp: serverTimestamp(),
      isAI: true
    });

    // Remove typing state
    await updateDoc(matchRef, { player2Typing: false });

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
      const statusUpper = (match.status || "").toUpperCase();
      if (statusUpper !== "COMPLETED" && statusUpper !== "CANCELLED") {
        const isRevealing = statusUpper === "REVEALING";
        const revealingStarted = match.revealingStartedAt || 0;
        const decisionEnd = match.decisionEndTime || 0;

        const isRevealingTimeout = isRevealing && (revealingStarted > 0 && now > revealingStarted + 5000);
        const isDecisionTimeout = decisionEnd > 0 && now > decisionEnd + 15000;

        if (isRevealingTimeout || isDecisionTimeout) {
          // Force process directly using the database handler
          await resolveMatchInternal(docSnap.id).catch(console.error);
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
