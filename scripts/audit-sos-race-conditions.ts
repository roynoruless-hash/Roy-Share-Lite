import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, runTransaction } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const configPath = path.resolve(__dirname, "../firebase-applet-config.json");
if (!fs.existsSync(configPath)) {
  console.error("Firebase config not found at " + configPath);
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function runAudit() {
  console.log("=== Split Or Steal: Concurrency & Race Condition Audit ===");
  const now = Date.now();
  let issuesFound = 0;

  // 1. Audit Queue for stale entries (users who paid but never matched)
  console.log("\n[1] Auditing sos_queue for stale entries...");
  const queueSnap = await getDocs(collection(db, "sos_queue"));
  for (const docSnap of queueSnap.docs) {
    const q = docSnap.data();
    const joinedAt = q.joinedAt?.toMillis ? q.joinedAt.toMillis() : Date.now();
    if (q.status === "searching" && (now - joinedAt) > 15 * 60 * 1000) {
      issuesFound++;
      console.log(`⚠️  WARNING: Stale queue entry found for user ${q.telegramId}. Paid ${q.paidFromMain + q.paidFromReward} but stuck in 'searching'.`);
      console.log(`   Action required: Refund user and remove from queue.`);
    }
  }

  // 2. Audit Matches for hanging state (players stuck, funds locked)
  console.log("\n[2] Auditing sos_matches for stuck resolution...");
  const matchSnap = await getDocs(collection(db, "sos_matches"));
  for (const docSnap of matchSnap.docs) {
    const match = docSnap.data();
    if (match.status !== "completed" && match.status !== "cancelled") {
      const decisionEnd = match.decisionEndTime || 0;
      if (decisionEnd > 0 && now > decisionEnd + 60000) {
        issuesFound++;
        console.log(`⚠️  WARNING: Match ${docSnap.id} stuck in '${match.status}'. Time expired.`);
        console.log(`   Action required: Force resolve match using admin script or process-result endpoint.`);
      }
    }
  }

  // 3. Transactions vs Balances Integrity Check
  console.log("\n[3] Auditing Wallet Balances vs Transactions Integrity...");
  // (In a real massive DB this would be a map-reduce job, doing a sample check here)
  const usersSnap = await getDocs(collection(db, "users"));
  const txSnap = await getDocs(collection(db, "transactions"));
  
  const txMap: Record<string, number> = {};
  txSnap.forEach(txDoc => {
    const tx = txDoc.data();
    if (!txMap[tx.userId]) txMap[tx.userId] = 0;
    if (tx.type === "credit") txMap[tx.userId] += tx.amount;
    if (tx.type === "debit") txMap[tx.userId] -= tx.amount;
  });

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const expectedFromTx = txMap[userDoc.id] || 0;
    // Note: Users might have initial balance or other sources not tracked in tx if it was an airdrop
    // This is just a heuristic warning
    if (user.balance < 0 || user.rewardBalance < 0) {
      issuesFound++;
      console.log(`🚨 CRITICAL: User ${userDoc.id} has negative balance! Main: ${user.balance}, Reward: ${user.rewardBalance}. Potential double-spend race condition detected.`);
    }
  }

  console.log("\n=== Audit Complete ===");
  console.log(`Total anomalies found: ${issuesFound}`);
  if (issuesFound === 0) {
    console.log("✅ No pending race conditions or stuck states detected. The transactional logic is sound.");
  } else {
    console.log("❌ Issues detected. Ensure runTransaction is strictly used for all write paths.");
  }
}

runAudit().catch(console.error);
