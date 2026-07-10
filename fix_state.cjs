const fs = require('fs');

const missingVars = `activePageTab
adForm
aiAnalyzing
aiAnnouncing
aiGenMessage
aiGenSettings
aiPreviewRewards
aiReplying
analyticsLinkId
announcementForm
announcements
announcementsError
announcementsLoading
bonusHistory
bonusHistoryLoading
bonusSearch
bonusSettings
bonusSettingsLoading
bonusView
dailyBonusStats
dailyBonusStatsLoading
generatingAI
googleDriveAccounts
googleDriveError
googleDriveLoading
modalAction
modalInput
selectedTicket
selectedUser
selectedUserIds
selectedWithdrawal
settingsTab
shortenerSubTab
smartLinkForm
smartLinks
smartLinkSearch
smartLinksError
smartLinksLoading
supportSettings
supportSettingsLoading
systemSettings
systemSettingsLoading
taskForm
taskLogs
taskLogsLoading
tasks
tasksError
tasksLoading
taskView
tickets
ticketSearch
ticketsError
ticketsLoading
ticketStatusFilter
users
userSearch
userShortenerSettings
userShortenerSettingsLoading
userShortenerSettingsSaving
usersLoading
userView
verifiedTasks
verifiedTasksLoading
verifiedTasksSearch
withdrawals
withdrawalsError
withdrawalsLoading`.split('\n');

let stateDecls = "";
for (const v of missingVars) {
    if (v.endsWith("Loading") || v.endsWith("Saving") || v.startsWith("is") || v.startsWith("ai") || v.startsWith("generating")) {
        stateDecls += `  const [${v}, set${v[0].toUpperCase() + v.slice(1)}] = useState(false);\n`;
    } else if (v.endsWith("Error") || v.endsWith("Search") || v.endsWith("Message") || v.endsWith("Filter") || v.endsWith("Tab") || v.endsWith("Id") || v.endsWith("Action") || v.endsWith("Input") || v.endsWith("View")) {
        stateDecls += `  const [${v}, set${v[0].toUpperCase() + v.slice(1)}] = useState("");\n`;
    } else if (v === "systemSettings" || v === "supportSettings" || v === "bonusSettings" || v === "adForm" || v === "announcementForm" || v === "taskForm" || v === "smartLinkForm" || v === "selectedTicket" || v === "selectedUser" || v === "selectedWithdrawal" || v === "userShortenerSettings" || v === "dailyBonusStats") {
        stateDecls += `  const [${v}, set${v[0].toUpperCase() + v.slice(1)}] = useState<any>(null);\n`;
    } else if (v === "selectedUserIds") {
        stateDecls += `  const [${v}, set${v[0].toUpperCase() + v.slice(1)}] = useState<string[]>([]);\n`;
    } else {
        stateDecls += `  const [${v}, set${v[0].toUpperCase() + v.slice(1)}] = useState<any[]>([]);\n`;
    }
}

stateDecls += `
  const fetchGoogleDriveAccounts = async () => {
    setGoogleDriveLoading(true);
    setGoogleDriveError("");
    try {
      const res = await fetch(\`\${API_BASE}/api/admin/google-drive-accounts\`);
      if (!res.ok) throw new Error("Failed to fetch Google Drive accounts");
      const json = await res.json();
      setGoogleDriveAccounts(json);
    } catch (err: any) {
      setGoogleDriveError(err.message);
    } finally {
      setGoogleDriveLoading(false);
    }
  };
`;

let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
code = code.replace(
  /const \[currentTime, setCurrentTime\] = useState\(new Date\(\)\);/,
  `const [currentTime, setCurrentTime] = useState(new Date());\n${stateDecls}`
);
code = `import LinkAnalyticsPage from "./LinkAnalyticsPage";\n` + code;
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("State and functions restored");
