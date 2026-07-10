
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function createMockUser() {
  await setDoc(doc(db, "users", "ADMIN_PREVIEW"), {
    username: "AdminTester",
    firstName: "Admin",
    lastName: "Tester",
    createdAt: new Date().toISOString(),
    balance: 0
  });
  console.log("Mock user ADMIN_PREVIEW created.");
  process.exit(0);
}

createMockUser();
