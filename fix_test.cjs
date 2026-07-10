const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');
let d = 0;
for(let i=1868; i<=9694; i++){
  const l = lines[i] || '';
  const cleanLine = l.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  
  // match <div ... > but not <div ... />
  const opens = (cleanLine.match(/<div[^>]*?(?<!\/)>/g) || []).length;
  const closes = (cleanLine.match(/<\/div>/g) || []).length;
  d += opens - closes;
}
console.log("Depth up to 9695 (index 9694):", d);
