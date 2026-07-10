import { getDb } from './src/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

async function inspectDb() {
    try {
        const db = getDb();
        console.log("--- Inspection Start ---");
        
        const uploadRef = doc(db, 'uploads', 'FLPCMZ9Z4C');
        const docSnap = await getDoc(uploadRef);

        console.log("Document 'uploads/FLPCMZ9Z4C' exists:", docSnap.exists());
        if (docSnap.exists()) {
            console.log("Document data:", JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.log("Document 'uploads/FLPCMZ9Z4C' does not exist.");
        }

        console.log("--- Inspection End ---");
        process.exit(0);
    } catch (e: any) {
        console.error("--- Inspection Exception ---");
        console.error("Code:", e.code);
        console.error("Stack:", e.stack);
        process.exit(1);
    }
}
inspectDb();
