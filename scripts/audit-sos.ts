import { getDb } from "../src/lib/firebase";
import { collection, getDocs, doc, runTransaction, query, where } from "firebase/firestore";

async function auditSos() {
  console.log("Starting Split Or Steal Audit...");
  const db = getDb();
  
  // 1. Check for stuck queues
  const queueSnap = await getDocs(collection(db, "sos_queue"));
  let stuckQueues = 0;
  const now = Date.now();
  queueSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.status === "searching") {
      const joinedAt = data.joinedAt?.toMillis() || 0;
      if (now - joinedAt > 10 * 60 * 1000) {
        stuckQueues++;
        console.log(`Stuck queue found for user: ${data.telegramId}`);
      }
    }
  });

  // 2. Check for stuck matches
  const matchSnap = await getDocs(collection(db, "sos_matches"));
  let stuckMatches = 0;
  matchSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.status !== "completed" && data.status !== "cancelled") {
      const decisionEnd = data.decisionEndTime || 0;
      if (decisionEnd > 0 && now > decisionEnd + 60000) {
        stuckMatches++;
        console.log(`Stuck match found: ${docSnap.id} (Status: ${data.status})`);
      }
    }
  });

  console.log(`Audit Complete.`);
  console.log(`- Stuck Queues: ${stuckQueues}`);
  console.log(`- Stuck Matches: ${stuckMatches}`);
}

auditSos().catch(console.error);
