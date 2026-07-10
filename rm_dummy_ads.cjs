const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const startStr = `  // AD SETTINGS DUMMY`;
const startIndex = code.indexOf(startStr);
if (startIndex !== -1) {
    const endStr = `  const handleDisconnectGoogleDrive`;
    const endIndex = code.indexOf(endStr);
    if (endIndex !== -1) {
         code = code.substring(0, startIndex) + code.substring(endIndex);
         fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
         console.log("Removed dummy ad settings.");
    }
} else {
    console.log("Could not find startStr");
}
