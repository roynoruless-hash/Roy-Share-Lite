import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const c1 = await getDocs(collection(db, "gplinks_task_completions"));
  console.log("gplinks_task_completions count:", c1.docs.length);

  const c2 = await getDocs(collection(db, "task_completions"));
  console.log("task_completions count:", c2.docs.length);

  process.exit(0);
}
run();
