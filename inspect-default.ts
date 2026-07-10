import { getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function inspectDefault() {
    try {
        initializeApp();
        const app = getApp();
        const db = getFirestore(app); 
        
        console.log("--- Inspection Start (Default DB) ---");
        
        const collections = await db.listCollections();
        console.log("Collections:", collections.map(c => c.id));

        console.log("--- Inspection End ---");
    } catch (e: any) {
        console.error("--- Inspection Exception (Default DB) ---");
        console.error("Code:", e.code);
        console.error("Details:", e.details);
    }
}
inspectDefault();
