const { execSync } = require('child_process');
try {
  execSync('npm run lint > lint_output.txt 2>&1');
} catch (e) {}
console.log("Lint check done");
