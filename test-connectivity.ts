import { getDb } from './src/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

async function testConnectivity() {
    try {
        const db = getDb();
        const testDocRef = doc(db, 'settings', 'test');

        console.log("--- Creating document 'settings/test' ---");
        await setDoc(testDocRef, {
            status: "ok",
            time: serverTimestamp()
        });
        console.log("Created successfully.");

        console.log("\n--- Reading document 'settings/test' ---");
        const docSnap = await getDoc(testDocRef);

        if (docSnap.exists()) {
            console.log("Read successfully.");
            console.log("Data:", docSnap.data());
        } else {
            console.log("Document does not exist after write.");
        }
    } catch (err: any) {
        console.error("\n--- TEST FAILED ---");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
    }
}

testConnectivity();
