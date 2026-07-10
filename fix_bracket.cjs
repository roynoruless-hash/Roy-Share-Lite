const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  `} else if (activeTab === "📥 Google Drive Accounts") {
      fetchGoogleDriveAccounts();
      
    return () => {`,
  `} else if (activeTab === "📥 Google Drive Accounts") {
      fetchGoogleDriveAccounts();
    }
      
    return () => {`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Fixed bracket");
