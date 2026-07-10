import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-v27cYZ49JxWGqaRk54jPnxdhfWEV7Jc",
  authDomain: "royshare.firebaseapp.com",
  projectId: "royshare",
  storageBucket: "royshare.firebasestorage.app",
  messagingSenderId: "907172493226",
  appId: "1:907172493226:web:820327f970d2ea73c99dd3",
  measurementId: "G-D9XXBL87MM"
};

console.log("--- STARTUP DIAGNOSTIC ---");
console.log("process.env.GOOGLE_CLOUD_PROJECT:", process.env.GOOGLE_CLOUD_PROJECT);
console.log("process.env.GCLOUD_PROJECT:", process.env.GCLOUD_PROJECT);
console.log("process.env.FIREBASE_CONFIG:", process.env.FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("App Options Project ID:", app.options.projectId);
console.log("Firestore Path: database default");

async function runTests() {
  try {
    console.log("\n--- RUNNING TESTS ---");
    
    // 1. Read settings/telegram
    console.log("Reading settings/telegram...");
    const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
    console.log("Read result:", settingsDoc.exists() ? settingsDoc.data() : "Document does not exist.");
    
    // 2. Write test document
    console.log("Writing test document...");
    await setDoc(doc(db, "test", "demo"), { timestamp: Date.now() });
    console.log("Write success.");
    
    // 3. Read test document
    console.log("Reading test document...");
    const testDoc = await getDoc(doc(db, "test", "demo"));
    console.log("Read test result:", testDoc.data());
    
  } catch (error) {
    console.error("\nTEST FAILED:", error);
  }
}

runTests();
