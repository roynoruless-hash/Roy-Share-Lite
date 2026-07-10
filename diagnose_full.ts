import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc } from "firebase/firestore";
import config from "./firebase-applet-config.json";

console.log("--- RUNTIME DIAGNOSTIC ---");
console.log("firebaseConfig loaded from file:");
console.log(JSON.stringify(config, null, 2));

const webConfig = {
  apiKey: config.apiKey,
  projectId: config.projectId,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const webApp = initializeApp(webConfig);
const db = initializeFirestore(webApp, {
  experimentalForceLongPolling: true
});

async function test() {
  try {
    console.log("\n--- Attempting getDoc(settings/telegram) ---");
    const d = await getDoc(doc(db, "settings", "telegram"));
    console.log("Result:", d.exists() ? "Exists" : "Does not exist");
    if (d.exists()) {
      console.log("Data:", JSON.stringify(d.data(), null, 2));
    }
    process.exit(0);
  } catch (err: any) {
    console.log("\n--- FULL ERROR ---");
    console.log("Code:", err.code);
    console.log("Message:", err.message);
    console.log("Stack:", err.stack);
    console.log("\n--- Raw Full Error Object ---");
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    process.exit(1);
  }
}
test();
