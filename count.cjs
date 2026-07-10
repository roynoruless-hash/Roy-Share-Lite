const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');
let count = 0;
for (let i = 1868; i < lines.length; i++) {
  const line = lines[i];
  // naive string/comment strip
  let cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  for (const c of cleanLine) {
    if (c === '{') count++;
    else if (c === '}') count--;
  }
  if (count === 0 && i > 1869) {
    console.log(`Count reached 0 at line ${i + 1}: ${line.trim()}`);
  }
}
