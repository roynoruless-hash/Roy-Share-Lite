const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

const stack = [];
for(let i=1868; i<9700; i++){
  const line = lines[i] || '';
  // basic stripping
  let cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  
  for(let j=0; j<cleanLine.length; j++) {
    const c = cleanLine[j];
    if(c === '{') {
      stack.push(i + 1);
    }
    else if(c === '}') {
      if(stack.length > 0) stack.pop();
    }
  }
}
console.log("Unmatched left braces at lines:", stack);
