const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');
let d = 0;
for(let i=2720; i<=3155; i++){
  const l = lines[i];
  d += (l.match(/<div/g)||[]).length;
  d -= (l.match(/<\/div>/g)||[]).length;
}
console.log("Bonus depth:", d);
