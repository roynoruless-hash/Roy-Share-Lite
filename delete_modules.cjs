const fs = require('fs');

// --- 1. Modify src/pages/AdminDashboard.tsx ---
let adminDashboard = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Remove imports
adminDashboard = adminDashboard.replace(/import AIModeration from "\.\.\/components\/Admin\/AIModeration";\n?/g, '');
adminDashboard = adminDashboard.replace(/import ReputationSystem from "\.\.\/components\/Admin\/ReputationSystem";\n?/g, '');
adminDashboard = adminDashboard.replace(/import AuditCenter from "\.\.\/components\/Admin\/AuditCenter";\n?/g, '');
adminDashboard = adminDashboard.replace(/import YouTubeTasksAdmin from "\.\.\/components\/YouTubeTasksAdmin";\n?/g, '');

// Remove tabs from array
adminDashboard = adminDashboard.replace(/\s*"📺 YouTube Tasks",/g, '');
adminDashboard = adminDashboard.replace(/\s*"📢 Broadcast",/g, '');
adminDashboard = adminDashboard.replace(/\s*"🛡️ AI Moderation",/g, '');
adminDashboard = adminDashboard.replace(/\s*"⭐ Reputation",/g, '');
adminDashboard = adminDashboard.replace(/\s*"📋 Audit Center",/g, '');

// Remove activeTab conditions for the deleted tabs
adminDashboard = adminDashboard.replace(/\{\s*activeTab === "📺 YouTube Tasks" && \([\s\S]*?<YouTubeTasksAdmin \/>\s*\)\s*\}/g, '');
adminDashboard = adminDashboard.replace(/\{\s*activeTab === "🛡️ AI Moderation" && <AIModeration \/>\s*\}/g, '');
adminDashboard = adminDashboard.replace(/\{\s*activeTab === "⭐ Reputation" && <ReputationSystem \/>\s*\}/g, '');
adminDashboard = adminDashboard.replace(/\{\s*activeTab === "📋 Audit Center" && <AuditCenter \/>\s*\}/g, '');

// The Broadcast tab in AdminDashboard is large. Let's find its start and end.
// Look for `{activeTab === "📢 Broadcast" && (`
const broadcastTabRegex = /\{\s*activeTab === "📢 Broadcast" && \([\s\S]*?\}\s*\{\s*activeTab === "📢 Telegram Broadcast Center"/;
if (broadcastTabRegex.test(adminDashboard)) {
  adminDashboard = adminDashboard.replace(broadcastTabRegex, '{activeTab === "📢 Telegram Broadcast Center"');
} else {
  console.log("Could not find Broadcast tab content to remove in AdminDashboard.tsx");
}

// Remove Broadcast states and functions
adminDashboard = adminDashboard.replace(/\s*const \[broadcasts, setBroadcasts\] = useState.*?;\n/g, '\n');
adminDashboard = adminDashboard.replace(/\s*const \[broadcastsLoading, setBroadcastsLoading\] = useState.*?;\n/g, '\n');
adminDashboard = adminDashboard.replace(/\s*const \[broadcastTab, setBroadcastTab\] = useState.*?;\n/g, '\n');
adminDashboard = adminDashboard.replace(/\s*const \[broadcastForm, setBroadcastForm\] = useState\(\{[\s\S]*?\}\);\n/g, '\n');
adminDashboard = adminDashboard.replace(/\s*const \[broadcastStats, setBroadcastStats\] = useState<any>\(null\);\n/g, '\n');

// Also remove `fetchBroadcasts` and `sendBroadcast` functions
adminDashboard = adminDashboard.replace(/\s*const fetchBroadcasts = async \(\) => \{[\s\S]*?setBroadcastsLoading\(false\);\n  \};\n/g, '\n');
adminDashboard = adminDashboard.replace(/\s*const sendBroadcast = async \(status: string\) => \{[\s\S]*?setBroadcastsLoading\(false\);\n  \};\n/g, '\n');

// Also remove else if (activeTab === "📢 Broadcast") { ... } inside useEffect if it exists
adminDashboard = adminDashboard.replace(/\s*\} else if \(activeTab === "📢 Broadcast"\) \{[\s\S]*?\}/g, '');

fs.writeFileSync('src/pages/AdminDashboard.tsx', adminDashboard);
console.log("AdminDashboard updated.");

// --- 2. Modify src/pages/MiniAppHome.tsx ---
let miniAppHome = fs.readFileSync('src/pages/MiniAppHome.tsx', 'utf8');
miniAppHome = miniAppHome.replace(/import YouTubeTasksPage from "\.\/YouTubeTasksPage";\n?/g, '');
miniAppHome = miniAppHome.replace(/\s*\{\s*id: "youtube-tasks".*?\},/g, '');
miniAppHome = miniAppHome.replace(/\s*if \(currentView === "youtube-tasks"\) \{[\s\S]*?return <YouTubeTasksPage onBack=\{\(\) => setCurrentView\("home"\)\} \/>;\n  \}/g, '');
miniAppHome = miniAppHome.replace(/\s*if \(id === "youtube-tasks"\) \{\s*setCurrentView\("youtube-tasks"\);\s*return;\s*\}/g, '');
fs.writeFileSync('src/pages/MiniAppHome.tsx', miniAppHome);
console.log("MiniAppHome updated.");

// --- 3. Modify src/pages/DashboardPage.tsx ---
let dashboardPage = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');
dashboardPage = dashboardPage.replace(/\s*<ActionButton title="YouTube Tasks" icon=\{Youtube\} color="bg-red-600" onClick=\{\(\) => onNavigate\?\.\("youtube-tasks"\)\} delay=\{0\.4\} \/>/g, '');
// Also if `Youtube` is imported from lucide-react and unused, let it be (eslint will complain, but we'll run a quick sed later or ignore).
fs.writeFileSync('src/pages/DashboardPage.tsx', dashboardPage);
console.log("DashboardPage updated.");

