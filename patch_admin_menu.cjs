const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add tabs to the array
const tabsString = `              "🛡 Security Center",
              "🛡️ Economy Protection",
              "🛡 Fraud Investigation Center",
              "🛡️ AI Moderation",
              "⭐ Reputation",
              "📋 Audit Center",
              "🏆 Rewards & Leaderboard",`;

code = code.replace(
  /"🛡 Security Center",\s*"🛡️ Economy Protection",\s*"🛡 Fraud Investigation Center",/,
  tabsString
);

// 2. Add imports
const imports = `import AIModeration from "../components/Admin/AIModeration";
import ReputationSystem from "../components/Admin/ReputationSystem";
import AuditCenter from "../components/Admin/AuditCenter";
import RewardsLeaderboard from "../components/Admin/RewardsLeaderboard";
`;
code = code.replace(/import buildInfo from "\.\.\/build-info\.json";/, "import buildInfo from '../build-info.json';\n" + imports);

// 3. Add component rendering
const renderComponents = `
          {activeTab === "🛡️ AI Moderation" && <AIModeration />}
          {activeTab === "⭐ Reputation" && <ReputationSystem />}
          {activeTab === "📋 Audit Center" && <AuditCenter />}
          {activeTab === "🏆 Rewards & Leaderboard" && <RewardsLeaderboard />}
`;

code = code.replace(
  /\{activeTab === "🛡 Fraud Investigation Center" && \(\s*<FraudInvestigationCenter \/>\s*\)\}/,
  `{activeTab === "🛡 Fraud Investigation Center" && <FraudInvestigationCenter />}` + renderComponents
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Admin menu patched");
