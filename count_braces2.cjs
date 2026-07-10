const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');
let count = 0;
for(let i=1868; i<9695; i++){
  const line = lines[i] || '';
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '').replace(/`[^`]*`/g, "``");
  for(const c of cleanLine) {
    if(c === '{') count++;
    else if(c === '}') count--;
  }
}
console.log("Brace diff:", count);
