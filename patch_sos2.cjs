const fs = require('fs');
let code = fs.readFileSync('src/routes/splitOrSteal.ts', 'utf8');

const processResultRegex = /router\.post\("\/process-result", async \(req, res\) => \{[\s\S]*?\}\);\n/;

const newProcessResult = `router.post("/process-result", async (req, res) => {
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

      // Populate back for clients to see
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
      } else {
        // Both steal = 0
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
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});
`;

code = code.replace(processResultRegex, newProcessResult);
fs.writeFileSync('src/routes/splitOrSteal.ts', code);
console.log("Replaced process-result");
