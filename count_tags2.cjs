const fs = require('fs');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// strip comments and strings
let cleanCode = code
  .replace(/'[^']*'/g, "''")
  .replace(/"[^"]*"/g, '""')
  .replace(/`[^`]*`/g, "``")
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*/g, '');

const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*?(?<!\/)>/g;
let match;
const tagStack = [];
while ((match = tagRegex.exec(cleanCode)) !== null) {
  const isClose = match[0].startsWith('</');
  const tagName = match[1];
  
  if (isClose) {
    if (tagStack.length > 0 && tagStack[tagStack.length-1].name === tagName) {
      tagStack.pop();
    } else {
      console.log(`Mismatch at offset ${match.index}: expected ${tagStack.length ? tagStack[tagStack.length-1].name : 'none'}, found </${tagName}>`);
      tagStack.pop();
    }
  } else {
    // open
    tagStack.push({name: tagName, index: match.index});
  }
}
console.log("Unclosed tags:", tagStack.length);
if (tagStack.length > 0) {
  console.log("Top of stack:", tagStack[tagStack.length-1]);
}
