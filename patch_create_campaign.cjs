const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvertiserPanel/CreateCampaign.tsx', 'utf8');

if (!code.includes("platform: 'youtube'")) {
  code = code.replace(
    'const payload = {',
    'const payload = {\n        platform: "youtube",'
  );
  fs.writeFileSync('src/pages/AdvertiserPanel/CreateCampaign.tsx', code);
  console.log("Patched CreateCampaign for platform generic.");
}
