const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');

const stack = [];
for (let i = 1869; i < 9700; i++) {
  const line = lines[i] || '';
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '');
  
  let pos = 0;
  while (true) {
    const openIdx = cleanLine.indexOf('<div', pos);
    const closeIdx = cleanLine.indexOf('</div', pos);
    
    if (openIdx === -1 && closeIdx === -1) break;
    
    if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
      stack.push(i + 1);
      pos = openIdx + 4;
    } else if (closeIdx !== -1) {
      stack.pop();
      pos = closeIdx + 5;
    }
  }
}
console.log(`Unclosed divs at lines: ${stack.join(', ')}`);
