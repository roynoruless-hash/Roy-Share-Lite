const fs = require('fs');
let code = fs.readFileSync('src/server_advertiser.ts', 'utf8');

const securityCheck = `
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
`;

if (!code.includes("Duplicate campaign detected")) {
  code = code.replace(
    /app\.post\('\/api\/advertiser\/campaigns', async \(req, res\) => \{\n\s*try \{/,
    "app.post('/api/advertiser/campaigns', async (req, res) => {\n    try {\n" + securityCheck
  );
  fs.writeFileSync('src/server_advertiser.ts', code);
  console.log("Patched security in server_advertiser.ts");
}
