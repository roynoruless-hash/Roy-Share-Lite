const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');

let divDepth = 0;
for (let i = 1869; i < 9700; i++) {
  const line = lines[i];
  if (!line) continue;
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  
  const opens = (cleanLine.match(/<div/g) || []).length;
  const closes = (cleanLine.match(/<\/div>/g) || []).length;
  divDepth += opens - closes;
  
  if (divDepth < 0) {
    console.log(`Negative div depth at line ${i+1}`);
    break;
  }
}
console.log(`Final div depth: ${divDepth}`);
