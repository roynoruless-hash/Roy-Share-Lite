import fs from "fs";

let content = fs.readFileSync("src/routes/splitOrSteal.ts", "utf8");

if (!content.includes('router.post("/cron/cleanup"')) {
  const cleanupCode = `
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
`;
  content += cleanupCode;
  fs.writeFileSync("src/routes/splitOrSteal.ts", content);
  console.log("Cleanup endpoint added!");
}
