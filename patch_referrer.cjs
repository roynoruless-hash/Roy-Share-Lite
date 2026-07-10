const fs = require('fs');
let code = fs.readFileSync('src/components/MultiPageEngine.tsx', 'utf8');

code = code.replace(
  `            id,
            browser,
            device,
            country`,
  `            id,
            browser,
            device,
            country,
            referrer: document.referrer || "Direct"`
);

fs.writeFileSync('src/components/MultiPageEngine.tsx', code);

let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  `const { type, id, browser, device, country } = req.body;`,
  `const { type, id, browser, device, country, referrer } = req.body;`
);

serverCode = serverCode.replace(
  `        country,
        device,
        browser,
        createdAt: new Date().toISOString()`,
  `        country,
        device,
        browser,
        referrer: referrer || "Direct",
        createdAt: new Date().toISOString()`
);

fs.writeFileSync('server.ts', serverCode);
console.log("Patched referrer");
