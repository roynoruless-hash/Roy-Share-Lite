const fs = require('fs');
const cp = require('child_process');

const orig = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = orig.split('\n');

// we want to test removing chunks inside the data block (lines 1910 to 9680)
function test(start, end) {
  const newLines = [...lines.slice(0, start), ...lines.slice(end)];
  fs.writeFileSync('temp.tsx', newLines.join('\n'));
  try {
    cp.execSync('npx prettier temp.tsx', {stdio: 'ignore'});
    return true; // parsed successfully!
  } catch(e) {
    return false; // still failed
  }
}

// Let's test removing half of the data block
const m = Math.floor((1910 + 9680) / 2);
console.log("Removing 1910 to", m, ":", test(1910, m) ? "Fixed!" : "Still fails");
console.log("Removing", m, "to 9680:", test(m, 9680) ? "Fixed!" : "Still fails");

