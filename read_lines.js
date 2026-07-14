const fs = require('fs');
const readline = require('readline');

async function getLines(filePath, startLine, endLine) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  const lines = [];
  for await (const line of rl) {
    lineNum++;
    if (lineNum >= startLine && lineNum <= endLine) {
      lines.push(`${lineNum}: ${line}`);
    }
    if (lineNum > endLine) {
      break;
    }
  }
  fs.writeFileSync('lines_output.txt', lines.join('\n'));
  console.log("Extracted lines successfully!");
}

const args = process.argv.slice(2);
const start = parseInt(args[0]) || 1;
const end = parseInt(args[1]) || 100;
getLines('server.ts', start, end);
