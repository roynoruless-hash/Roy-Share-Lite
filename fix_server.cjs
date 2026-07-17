const fs = require('fs');
let code = fs.readFileSync('src/server_advertiser.ts', 'utf8');

const regex = /app\.get\('\/api\/advertiser\/notifications\/:id', async \(req, res\) => \{[\s\S]*?\}\);/;

const replacement = `app.get('/api/advertiser/notifications/:id', async (req, res) => {
  try {
    const snap = await db.collection('advertiser_notifications')
      .where('advertiserId', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    res.json({ success: true, notifications: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/server_advertiser.ts', code);
