const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// Broadcasts (Not Telegram)
server = server.replace(/app\.get\("\/api\/admin\/broadcasts"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/broadcasts"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/broadcasts\/improve"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/broadcasts\/self-test"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.delete\("\/api\/admin\/broadcasts\/:id"[\s\S]*?\}\);\n/g, '');

// Youtube Tasks
server = server.replace(/app\.get\("\/api\/admin\/youtube-tasks\/config"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/youtube-tasks\/config"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/youtube-tasks\/approve"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/youtube-tasks\/reject"[\s\S]*?\}\);\n/g, '');
server = server.replace(/app\.post\("\/api\/admin\/youtube-tasks\/generate-comments"[\s\S]*?\}\);\n/g, '');

fs.writeFileSync('server.ts', server);
console.log("server.ts updated.");
