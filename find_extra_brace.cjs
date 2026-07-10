const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

let count = 0; // count of braces INSIDE the expression `{loading ?`
// Let's start right after `{loading ? (`
let started = false;
for(let i=1896; i<9696; i++){
  const line = lines[i] || '';
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '').replace(/`[^`]*`/g, "``");
  
  if (!started && cleanLine.includes('{loading')) {
    started = true;
    // count after {loading
    const idx = cleanLine.indexOf('{loading');
    for(let j=idx+1; j<cleanLine.length; j++) {
      if(cleanLine[j] === '{') count++;
      else if(cleanLine[j] === '}') {
        count--;
        if (count < 0) console.log(`Dropped below 0 at line ${i+1}`);
      }
    }
    continue;
  }
  
  if (started) {
    for(let j=0; j<cleanLine.length; j++) {
      if(cleanLine[j] === '{') count++;
      else if(cleanLine[j] === '}') {
        count--;
        if (count < 0) {
          console.log(`Dropped below 0 at line ${i+1} col ${j}`);
          count = 0; // reset to keep finding
        }
      }
    }
  }
}
console.log("Final count before line 9696:", count);
