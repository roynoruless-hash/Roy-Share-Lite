const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const pendingCount = withdrawals\.filter\(\(w\) => w\.status === "Pending"\)\.length;/g,
  `
  let pendingCount = 0, approvedCount = 0, paidCount = 0, rejectedCount = 0;
  try {
    pendingCount = (withdrawals || []).filter((w) => w.status === "Pending").length;
    approvedCount = (withdrawals || []).filter((w) => w.status === "Approved").length;
    paidCount = (withdrawals || []).filter((w) => w.status === "Paid").length;
    rejectedCount = (withdrawals || []).filter((w) => w.status === "Rejected").length;
  } catch (e) {
    console.error("Error calculating withdrawal counts:", e);
  }
  `
);
code = code.replace(/const approvedCount = withdrawals\.filter\([\s\S]*?\)\.length;/g, "");
code = code.replace(/const paidCount = withdrawals\.filter\(\(w\) => w\.status === "Paid"\)\.length;/g, "");
code = code.replace(/const rejectedCount = withdrawals\.filter\([\s\S]*?\)\.length;/g, "");

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Patched withdrawals filter");
