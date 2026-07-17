import express from 'express';
import { collection, doc, getDoc, setDoc, getDocs, query, where, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

export function setupAdvertiserRoutes(app: express.Express, db: any) {
  // Authentication / Registration for Advertiser
  app.post('/api/advertiser/register', async (req, res) => {
    try {
      const { email, password, companyName, fullName, mobile, telegram, country, gst, website } = req.body;
      // In a real scenario, use Firebase Auth to create user. 
      // For now, we mock it by creating a document in "advertisers" collection.
      
      // Let's create a dummy advertiser doc
      const advId = 'adv_' + Date.now();
      const advRef = doc(db, 'advertisers', advId);
      await setDoc(advRef, {
        email,
        companyName,
        fullName,
        mobile,
        telegram,
        country,
        gst: gst || "",
        website: website || "",
        balance: 0,
        status: 'active',
        createdAt: serverTimestamp()
      });

      res.json({ success: true, advertiserId: advId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/advertiser/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const q = query(collection(db, 'advertisers'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        res.json({ success: true, advertiser: { id: docSnap.id, ...docSnap.data() } });
      } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch advertiser campaigns
  app.get('/api/advertiser/:id/campaigns', async (req, res) => {
    try {
      const { id } = req.params;
      const q = query(collection(db, 'advertiser_campaigns'), where('advertiserId', '==', id));
      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, campaigns });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create Campaign
  app.post('/api/advertiser/campaigns', async (req, res) => {
    try {

    // SECURITY & FRAUD PROTECTION
    const existingQ = query(collection(db, 'advertiser_campaigns'), where('videoUrl', '==', req.body.videoUrl), where('status', 'in', ['Waiting Admin Approval', 'Running']));
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Duplicate campaign detected for this video URL.' });
    }
    
    // Rate Limiting (max 5 campaigns per day for an advertiser - simple mock logic)
    const rateLimitQ = query(collection(db, 'advertiser_campaigns'), where('advertiserId', '==', req.body.advertiserId));
    const rateLimitSnap = await getDocs(rateLimitQ);
    if (rateLimitSnap.size > 20) {
      // Mocking 24hr check by total count limit for simplicity
      return res.status(429).json({ error: 'Rate limit exceeded. Too many campaigns.' });
    }

      const data = req.body;
      const docRef = await addDoc(collection(db, 'advertiser_campaigns'), {
        ...data,
        status: 'Waiting Admin Approval',
        createdAt: serverTimestamp()
      });
      res.json({ success: true, campaignId: docRef.id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI categorization
  app.post('/api/advertiser/ai-categorize', async (req, res) => {
    try {
      const { title, description } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Categorize the following YouTube video into exactly ONE of these categories: Gaming, Study, Technology, Finance, Music, Motivation, Comedy, Entertainment, Education, Sports, News, Business, Lifestyle, Travel, Health. Return ONLY the category name.\n\nTitle: ${title}\nDescription: ${description}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      res.json({ success: true, category: response.text.trim() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Generate Comments
  app.post('/api/advertiser/ai-comments', async (req, res) => {
    try {
      const { title, description, count } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate ${count || 20} unique, realistic, and positive YouTube comments for a video titled "${title}". Return ONLY a JSON array of strings. Example: ["Great video!", "Loved this so much"]`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      let comments = [];
      try {
        comments = JSON.parse(response.text || "[]");
      } catch (e) {
        comments = [];
      }
      res.json({ success: true, comments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ADMIN API: Approve Campaign
  
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
      console.log(`[Email Notification to ${adv.email}]: ${message}`);
      
      // 4. Mock Telegram Notification (we only have username, actual bot needs chat_id)
      if (adv.telegramUsername) {
        console.log(`[Telegram Notification to @${adv.telegramUsername}]: ${message}`);
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
      db.collection('something').orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    res.json({ success: true, notifications: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
      
      await updateDoc(docRef, { status: 'Running', updatedAt: serverTimestamp() });
      await sendAdvertiserNotification(campaign.advertiserId, 'campaign_approved', `Your campaign "${campaign.title}" has been approved and is now live.`);
      
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
      await updateDoc(docRef, { status: 'Rejected', rejectReason: reason, updatedAt: serverTimestamp() });
      const advSnap = await getDoc(docRef);
      const advData = advSnap.data();
      if (advData) {
        await sendAdvertiserNotification(advData.advertiserId, 'campaign_rejected', `Your campaign has been rejected. Reason: ${reason}`);
      }
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
