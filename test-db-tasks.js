import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const c3 = await getDocs(collection(db, "tasks"));
  c3.docs.forEach(doc => {
    const d = doc.data();
    console.log(doc.id, JSON.stringify(d, null, 2));
  });
  process.exit(0);
}
run();
