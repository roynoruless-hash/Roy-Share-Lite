const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');
let d = 0;
for(let i = 2720; i < 3154; i++){
  const l = lines[i].replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  const prev = d;
  d += (l.match(/<div/g)||[]).length;
  d -= (l.match(/<\/div>/g)||[]).length;
  if(d !== prev) console.log(`Line ${i+1}: depth is now ${d}`);
}
