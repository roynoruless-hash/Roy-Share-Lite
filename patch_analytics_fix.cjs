const fs = require('fs');
let code = fs.readFileSync('src/pages/LinkAnalyticsPage.tsx', 'utf8');

code = code.replace(
  `const records = snap.docs.map(d => d.data());`,
  `const records = snap.docs.map(d => d.data()).filter(d => d.type === "view");`
);

fs.writeFileSync('src/pages/LinkAnalyticsPage.tsx', code);
console.log("Patched LinkAnalyticsPage");
