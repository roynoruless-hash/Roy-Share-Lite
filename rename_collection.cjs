const fs = require('fs');

// server.ts
let serverCode = fs.readFileSync('/app/applet/server.ts', 'utf8');
serverCode = serverCode.replace(/"video_tasks"/g, '"video_ads_tasks"');
fs.writeFileSync('/app/applet/server.ts', serverCode);

// frontend
const filesToUpdate = [
  '/app/applet/src/components/VideoAdsAdminView.tsx',
  '/app/applet/src/pages/VideoTaskPage.tsx',
  '/app/applet/src/components/VideoTaskCard.tsx',
];

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, 'utf8');
  // Just in case it has hardcoded references, though mostly it calls the API
  fs.writeFileSync(file, content);
}
console.log("Renamed collection to video_ads_tasks");
