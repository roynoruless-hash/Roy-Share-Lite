const fs = require('fs');
let code = fs.readFileSync('src/routes/splitOrSteal.ts', 'utf8');

const submitDecisionRegex = /router\.post\("\/submit-decision", async \(req, res\) => \{[\s\S]*?\}\);\n/;
const newSubmitDecision = `router.post("/submit-decision", async (req, res) => {
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
`;

code = code.replace(submitDecisionRegex, newSubmitDecision);

fs.writeFileSync('src/routes/splitOrSteal.ts', code);
console.log("Replaced submit-decision");
