const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('app.get("/api/admin/youtube-tasks/config"'));
if (match > -1) {
  console.log(lines.slice(match, match + 50).join('\n'));
} else {
  console.log("Not found");
}
