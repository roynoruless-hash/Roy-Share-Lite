const fs = require('fs');
let code = fs.readFileSync('src/server_advertiser.ts', 'utf8');

const notifHelper = `
async function sendAdvertiserNotification(advertiserId: string, type: string, message: string) {
  try {
    // 1. Mini App Notification (Firestore)
    await addDoc(collection(db, 'advertiser_notifications'), {
      advertiserId,
      type,
      message,
      read: false,
      createdAt: serverTimestamp()
    });

    // 2. Fetch Advertiser details
    const advSnap = await getDoc(doc(db, 'advertisers', advertiserId));
    if (advSnap.exists()) {
      const adv = advSnap.data();
      
      // 3. Mock Email Notification
      console.log(\`[Email Notification to \${adv.email}]: \${message}\`);
      
      // 4. Mock Telegram Notification (we only have username, actual bot needs chat_id)
      if (adv.telegramUsername) {
        console.log(\`[Telegram Notification to @\${adv.telegramUsername}]: \${message}\`);
      }
    }
  } catch (err) {
    console.error("Failed to send notification", err);
  }
}

// ADVERTISER API: Get Notifications
app.get('/api/advertiser/:id/notifications', async (req, res) => {
  try {
    const q = query(
      collection(db, 'advertiser_notifications'), 
      where('advertiserId', '==', req.params.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    res.json({ success: true, notifications: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;

if (!code.includes("sendAdvertiserNotification")) {
  code = code.replace(/app\.post\('\/api\/admin\/advertiser-campaigns\/approve'/, notifHelper + "\n  app.post('/api/admin/advertiser-campaigns/approve'");
  
  // Now patch approve API to use it
  code = code.replace(
    /await updateDoc\(docRef, \{\n\s*status: 'Running',\n\s*updatedAt: serverTimestamp\(\)\n\s*\}\);/g,
    `await updateDoc(docRef, { status: 'Running', updatedAt: serverTimestamp() });
      await sendAdvertiserNotification(campaign.advertiserId, 'campaign_approved', \`Your campaign "\${campaign.title}" has been approved and is now live.\`);`
  );

  // Patch reject API
  code = code.replace(
    /await updateDoc\(docRef, \{\n\s*status: 'Rejected',\n\s*rejectReason: reason,\n\s*updatedAt: serverTimestamp\(\)\n\s*\}\);/g,
    `await updateDoc(docRef, { status: 'Rejected', rejectReason: reason, updatedAt: serverTimestamp() });
      const advSnap = await getDoc(docRef);
      const advData = advSnap.data();
      if (advData) {
        await sendAdvertiserNotification(advData.advertiserId, 'campaign_rejected', \`Your campaign has been rejected. Reason: \${reason}\`);
      }`
  );
  
  fs.writeFileSync('src/server_advertiser.ts', code);
  console.log("Patched notifications in server_advertiser.ts");
}
