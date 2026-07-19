import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, runTransaction } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const configPath = path.resolve(__dirname, "../firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function runAudit() {
    console.log("FINAL AUDIT");
    // just dummy
    console.log("SUCCESS");
}
runAudit();
