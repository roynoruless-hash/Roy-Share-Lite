const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /pendingCount = \(withdrawals \|\| \[\]\)\.filter\(\(w\) => w\.status === "Pending"\)\.length;/g,
  `pendingCount = (Array.isArray(withdrawals) ? withdrawals : []).filter((w) => w.status === "Pending").length;`
);
code = code.replace(
  /approvedCount = \(withdrawals \|\| \[\]\)\.filter\(\(w\) => w\.status === "Approved"\)\.length;/g,
  `approvedCount = (Array.isArray(withdrawals) ? withdrawals : []).filter((w) => w.status === "Approved").length;`
);
code = code.replace(
  /paidCount = \(withdrawals \|\| \[\]\)\.filter\(\(w\) => w\.status === "Paid"\)\.length;/g,
  `paidCount = (Array.isArray(withdrawals) ? withdrawals : []).filter((w) => w.status === "Paid").length;`
);
code = code.replace(
  /rejectedCount = \(withdrawals \|\| \[\]\)\.filter\(\(w\) => w\.status === "Rejected"\)\.length;/g,
  `rejectedCount = (Array.isArray(withdrawals) ? withdrawals : []).filter((w) => w.status === "Rejected").length;`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Array checks added");
