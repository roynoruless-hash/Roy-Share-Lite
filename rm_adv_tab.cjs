const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const advTabStart = `{false && activeTab === "📢 Advertisement Settings" && (`;
const advTabStartIndex = code.indexOf(advTabStart);

const endMarker = `{/* Full Ad Preview Modal removed */}`;
const endMarkerIndex = code.indexOf(endMarker);

if (advTabStartIndex !== -1 && endMarkerIndex !== -1) {
    code = code.substring(0, advTabStartIndex) + code.substring(endMarkerIndex);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
    console.log("Removed Advertisement Settings tab successfully.");
} else {
    console.log("Could not find start or end:", advTabStartIndex, endMarkerIndex);
}
