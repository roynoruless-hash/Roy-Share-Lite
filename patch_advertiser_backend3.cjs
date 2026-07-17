const fs = require('fs');
let code = fs.readFileSync('src/server_advertiser.ts', 'utf8');

// Append Admin Campaign Approval APIs
const adminApis = `
  // ADMIN API: Approve Campaign
  app.post('/api/admin/advertiser-campaigns/approve', async (req, res) => {
    try {
      const { campaignId } = req.body;
      const docRef = doc(db, 'advertiser_campaigns', campaignId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return res.status(404).json({ error: 'Campaign not found' });
      
      const campaign = docSnap.data();
      
      // Deduct wallet
      const advRef = doc(db, 'advertisers', campaign.advertiserId);
      const advSnap = await getDoc(advRef);
      if (!advSnap.exists()) return res.status(404).json({ error: 'Advertiser not found' });
      
      const advertiser = advSnap.data();
      if (advertiser.balance < campaign.totalAmount) {
        return res.status(400).json({ error: 'Advertiser has insufficient balance' });
      }
      
      await updateDoc(advRef, {
        balance: advertiser.balance - campaign.totalAmount
      });
      
      await updateDoc(docRef, {
        status: 'Running',
        updatedAt: serverTimestamp()
      });
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ADMIN API: Reject Campaign
  app.post('/api/admin/advertiser-campaigns/reject', async (req, res) => {
    try {
      const { campaignId, reason } = req.body;
      const docRef = doc(db, 'advertiser_campaigns', campaignId);
      await updateDoc(docRef, {
        status: 'Rejected',
        rejectReason: reason,
        updatedAt: serverTimestamp()
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ADVERTISER API: Recharge Wallet
  app.post('/api/advertiser/wallet/recharge', async (req, res) => {
    try {
      const { advertiserId, amount } = req.body;
      const advRef = doc(db, 'advertisers', advertiserId);
      const advSnap = await getDoc(advRef);
      if (!advSnap.exists()) return res.status(404).json({ error: 'Advertiser not found' });
      
      const advertiser = advSnap.data();
      await updateDoc(advRef, {
        balance: (advertiser.balance || 0) + amount
      });
      
      res.json({ success: true, newBalance: (advertiser.balance || 0) + amount });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
`;

code = code.replace(/}\s*$/, adminApis);
fs.writeFileSync('src/server_advertiser.ts', code);
console.log('Added admin apis to server_advertiser.ts');
