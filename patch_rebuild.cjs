const fs = require('fs');
let code = fs.readFileSync('/tmp/sos.ts', 'utf8');

const processResultRegex = /router\.post\("\/process-result"[\s\S]*$/;

const tailCode = `router.post("/process-result", async (req, res) => {
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
      return \`\${m.senderId === match.player2.publicCode ? "AI" : "Opponent"}: \${m.text}\`
    }).join("\\n");
    if (!chatHistory) chatHistory = "No messages yet.";

    const prompt = \`You are playing 'Split or Steal'. Your personality is: \${match.player2.personality}. Your goal is to convince the opponent you will Split, or whatever fits your personality. Keep it very short (1 sentence), like a real chat. NEVER reveal you are an AI. If the opponent asks if you are AI, deny it naturally.
Current chat history:
\${chatHistory}
Reply with only your next message text:\`;

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
          await fetch(\`http://127.0.0.1:3000/api/split-or-steal/process-result\`, {
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
`;

code = code.replace(processResultRegex, tailCode);
fs.writeFileSync('src/routes/splitOrSteal.ts', code);
console.log("Successfully rebuilt tail of splitOrSteal.ts");
