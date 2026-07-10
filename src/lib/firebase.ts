import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const app = initializeApp(config);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export function getDb() {
  return db;
}
