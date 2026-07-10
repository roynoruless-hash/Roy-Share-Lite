const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

for (let i = 1868; i < 9700; i++) {
  const line = lines[i] || '';
  let inString = false;
  let stringChar = '';
  
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    // skip strings
    if (inString) {
      if (c === stringChar && line[j-1] !== '\\') inString = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      continue;
    }
  }
}
// This is getting too complex to write quickly. I'll just use TS API to find the unclosed tag!
