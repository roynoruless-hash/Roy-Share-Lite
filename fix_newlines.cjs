const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/join\("[\r\n]+"\)/g, 'join("\\n")');
fs.writeFileSync('server.ts', code);
