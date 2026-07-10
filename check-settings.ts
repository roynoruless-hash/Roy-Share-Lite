
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";

// Load config from firebase-applet-config.json
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function checkSettings() {
  const tgSnap = await getDoc(doc(db, "settings", "telegram"));
  if (tgSnap.exists()) {
    console.log("Telegram Settings:", JSON.stringify(tgSnap.data(), null, 2));
  } else {
    console.log("Telegram Settings not found.");
  }
  process.exit(0);
}

checkSettings();
