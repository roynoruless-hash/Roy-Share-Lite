import { getDb } from './src/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function backfill() {
    const db = getDb();
    const telegramRef = doc(db, 'settings', 'telegram');
    const snap = await getDoc(telegramRef);
    if (snap.exists()) {
        const data = snap.data();
        const extractUsername = (link: string) => {
            if (!link) return "";
            let cleaned = link.replace(/https?:\/\/(t\.me\/|telegram\.me\/)/, '');
            cleaned = cleaned.replace(/^@/, '');
            return cleaned.split('/')[0];
        };
        const updated = {
            ...data,
            channelUsername: data.channelUsername || extractUsername(data.channelLink || ""),
            groupUsername: data.groupUsername || extractUsername(data.groupLink || "")
        };
        await setDoc(telegramRef, updated, { merge: true });
        console.log("Backfilled:", updated);
    }
}
backfill();
