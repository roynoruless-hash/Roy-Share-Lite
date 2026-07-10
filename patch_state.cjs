const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const \[loading, setLoading\] = useState\(true\);/,
  `const [loading, setLoading] = useState(false);`
);
code = code.replace(
  /const \[data, setData\] = useState<any>\(null\);/,
  `const [data, setData] = useState<any>({ overview: { totalUsers: 1, totalUploads: 1, totalLinks: 1, totalEarnings: 0, totalWithdrawals: 1, totalBonusClaims: 1, totalRewardClaims: 1, totalReferrals: 1, openTickets: 0, totalAnnouncements: 1 }, today: { newUsersToday: 0, uploadsToday: 0, linksToday: 0, rewardsClaimedToday: 0, bonusClaimsToday: 0, withdrawalsToday: 0 }, activities: [], health: { firestore: "Online", telegram: "Online", web: "Online", rewards: "Online", bonus: "Online" } });`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Patched states");
