const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

let depth = 0;
for (let i = 1868; i < 9700; i++) {
  const line = lines[i] || '';
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  
  const opens = (cleanLine.match(/<>/g) || []).length;
  const closes = (cleanLine.match(/<\/>/g) || []).length;
  depth += opens - closes;
  if (opens > 0 || closes > 0) {
    console.log(`Line ${i+1}: +${opens} -${closes} => depth ${depth}`);
  }
}
console.log("Fragment depth:", depth);
