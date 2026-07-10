import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function diagnose() {
    console.log("--- Diagnostic Start ---");
    try {
        console.log("Process GOOGLE_CLOUD_PROJECT:", process.env.GOOGLE_CLOUD_PROJECT);
        console.log("Process GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
        
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

        if (getApps().length === 0) {
            let credential;
            const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
            const serviceAccountFilePath = path.join(process.cwd(), "firebase-service-account.json");

            if (serviceAccountEnv) {
                console.log("Using FIREBASE_SERVICE_ACCOUNT env");
                credential = cert(JSON.parse(serviceAccountEnv));
            } else if (fs.existsSync(serviceAccountFilePath)) {
                console.log("Using firebase-service-account.json file");
                credential = cert(JSON.parse(fs.readFileSync(serviceAccountFilePath, "utf8")));
            }

            const appOptions: any = {
                projectId: config.projectId
            };
            if (credential) {
                appOptions.credential = credential;
            }

            initializeApp(appOptions);
        }

        const app = getApp();
        console.log("App projectId:", app.options.projectId);
        
        const db = getFirestore();
        console.log("Fetching settings/telegram...");
        const docSnap = await db.collection("settings").doc("telegram").get();
        console.log("Doc exists:", docSnap.exists);
        if (docSnap.exists) {
            console.log("Doc data:", JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.log("Doc 'settings/telegram' does not exist.");
        }
        
    } catch (e: any) {
        console.error("Diagnostic error:", e.message || e);
    }
    console.log("--- Diagnostic End ---");
}
diagnose();

