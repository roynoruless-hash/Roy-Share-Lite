const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/fetchGoogleDriveAccounts\(\);\s+return \(\) => \{/, 'fetchGoogleDriveAccounts();\n    }\n\n    return () => {');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Fixed bracket 2");
