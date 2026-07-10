const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');
const tagStack = [];
for(let i=1868; i<9695; i++){
  const line = lines[i] || '';
  const cleanLine = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*/g, '').replace(/\/\*.*?\*\//g, '').replace(/`[^`]*`/g, "``");
  
  const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*?(?<!\/)>/g;
  let match;
  while ((match = tagRegex.exec(cleanLine)) !== null) {
    const isClose = match[0].startsWith('</');
    const tagName = match[1];
    
    if (isClose) {
      if (tagStack.length > 0 && tagStack[tagStack.length-1].name === tagName) {
        tagStack.pop();
      } else {
        console.log(`Mismatch at line ${i+1}: expected ${tagStack.length ? tagStack[tagStack.length-1].name : 'none'}, found </${tagName}>`);
        tagStack.pop();
      }
    } else {
      // open
      tagStack.push({name: tagName, line: i+1});
    }
  }
}
console.log("Unclosed tags:", tagStack);
