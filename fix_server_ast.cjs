const fs = require('fs');

const lines = fs.readFileSync('server.ts', 'utf8').split('\n');

const filtered = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const num = i + 1;
  if (num === 6463) skip = true;
  if (num === 6608) skip = false;
  
  if (num === 7045) skip = true;
  if (num === 7156) skip = false;
  
  if (num === 13019) skip = true;
  if (num === 13173) skip = false;

  if (!skip) {
    filtered.push(lines[i]);
  }
}

fs.writeFileSync('server.ts', filtered.join('\n'));
