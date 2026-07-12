import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const c1 = await getDocs(collection(db, "gplinks_tasks"));
  console.log("gplinks_tasks count:", c1.docs.length);

  const c2 = await getDocs(collection(db, "gplink_tasks"));
  console.log("gplink_tasks count:", c2.docs.length);

  const c3 = await getDocs(collection(db, "tasks"));
  console.log("tasks count:", c3.docs.length);

  c3.docs.forEach(doc => {
    const d = doc.data();
    if (d.gpLinksUrl || d.shortenerUrl || d.provider) {
       console.log("Found gp link inside tasks:", doc.id, d.title, d.status);
    }
  });
  
  process.exit(0);
}
run();
