const fs = require('fs');
let code = fs.readFileSync('src/server_advertiser.ts', 'utf8');

code = code.replace(/\\`/g, '`');
fs.writeFileSync('src/server_advertiser.ts', code);
