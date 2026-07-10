const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');
const stack = [];
for(let i=1868; i<9700; i++){
  const line = lines[i] || '';
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '').replace(/`[^`]*`/g, "``");
  for(let j=0; j<cleanLine.length; j++) {
    const c = cleanLine[j];
    if(c === '(') { stack.push(i + 1); }
    else if(c === ')') {
       if (stack.length > 0) stack.pop();
       else console.log("Unmatched closing paren at line", i+1);
    }
  }
}
console.log("Unclosed parens at lines:", stack);
