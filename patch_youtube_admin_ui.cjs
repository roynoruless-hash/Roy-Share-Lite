const fs = require('fs');
let code = fs.readFileSync('src/components/YouTubeTasksAdmin.tsx', 'utf8');

// replace Pending Review with Pending Review, Approved, Rejected, User History
code = code.replace(
  '"Analytics",\n    "Pending Review"',
  '"Analytics",\n    "Pending Review",\n    "Approved",\n    "Rejected",\n    "User History"'
);

// add import for review systems
const importReview = `import { PendingReview, ApprovedReview, RejectedReview, UserHistory } from './YouTubeTasksReviewAdmin';\n`;
code = importReview + code;

// find PendingReview and remove it
const pendingReviewMarker = 'function PendingReview() {';
const indexPending = code.indexOf(pendingReviewMarker);
if (indexPending > -1) {
  // slice to end of function
  const endMarker = '  );\n}';
  const indexEnd = code.indexOf(endMarker, indexPending);
  if (indexEnd > -1) {
    code = code.slice(0, indexPending) + code.slice(indexEnd + endMarker.length);
  }
}

// In the switch/if block, handle new tabs
const returnMarker = 'return (\n    <div className="space-y-6">';
// Wait, the main render is inside YouTubeTasksAdmin
// Let's find the closing tag of the tabs area
// <div className="flex flex-wrap gap-2">
const contentAreaStr = `
      {activeTab === "Dashboard" && <Dashboard />}
      {activeTab === "API & Google Login" && <ApiAndGoogleLogin />}
      {activeTab === "Campaigns" && <Campaigns />}
      {activeTab === "AI Comments" && <AiComments />}
      {activeTab === "Reward Settings" && <RewardSettings />}
      {activeTab === "Budget" && <Budget />}
      {activeTab === "Analytics" && <Analytics />}
`;
// Let's check how the active tabs are rendered.
