import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import config from "../../firebase-applet-config.json";

const app = initializeApp(config);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export function getDb() {
  return db;
}

export const storage = getStorage(app);
