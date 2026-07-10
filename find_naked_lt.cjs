const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

for (let i = 1869; i < 9700; i++) {
  const line = lines[i] || '';
  // match < followed by space or something that is not a tag name or /
  if (/<[^\/a-zA-Z]/.test(line)) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
}
