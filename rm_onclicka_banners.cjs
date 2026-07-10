const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/        onclickaBanners: \[\],\n/g, '');
code = code.replace(/        onclickaBanners: globalSettings.onclickaBanners \?\? \[\],\n/g, '');
code = code.replace(/          onclickaBanners: data.onclickaBanners \?\? \[\]\n/g, '');

fs.writeFileSync('server.ts', code);
console.log("Removed onclickaBanners from server.ts");
