const { execSync } = require('child_process');
const fs = require('fs');

let success = false;
let iterations = 0;
while (!success && iterations < 20) {
  iterations++;
  try {
    execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'pipe' });
    console.log("ESBuild succeeded!");
    success = true;
  } catch (error) {
    const output = error.stderr ? error.stderr.toString() : error.message;
    const match = output.match(/server\.ts:(\d+):(\d+):/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
      
      console.log(`Fixing error at line ${lineNum}`);
      // Usually it's an unterminated string literal. We can try to append \n to the end of the previous line and join it with the current line.
      // Wait, if it's an unterminated string, the newline is literal.
      // So lineNum is the line that has the start of the string, and it ends abruptly at the newline.
      // We can just join lineNum - 1 and lineNum with "\\n".
      
      lines[lineNum - 1] = lines[lineNum - 1] + "\\n" + lines[lineNum];
      lines.splice(lineNum, 1);
      
      fs.writeFileSync('server.ts', lines.join('\n'));
    } else {
      console.error("Could not parse error:", output);
      break;
    }
  }
}
