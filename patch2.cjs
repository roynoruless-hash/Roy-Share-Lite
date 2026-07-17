const fs = require('fs');
let code = fs.readFileSync('src/components/YouTubeTasksAdmin.tsx', 'utf8');

// replace the tab rendering
const marker = '{activeTab === "Dashboard" && <Dashboard />}';
if (code.includes(marker)) {
  const replacement = `      {activeTab === "Dashboard" && <Dashboard />}
      {activeTab === "Approved" && <ApprovedReview />}
      {activeTab === "Rejected" && <RejectedReview />}
      {activeTab === "User History" && <UserHistory />}`;
  code = code.replace(marker, replacement);
  fs.writeFileSync('src/components/YouTubeTasksAdmin.tsx', code);
  console.log("Patched rendering");
} else {
  console.log("Not found");
}
