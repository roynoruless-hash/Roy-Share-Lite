const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const \[withdrawals, setWithdrawals\] = useState<any\[\]>\(\{ error: "Server error" \} as any\);/,
  `const [withdrawals, setWithdrawals] = useState<any[]>([]);`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Reverted withdrawals patch");
