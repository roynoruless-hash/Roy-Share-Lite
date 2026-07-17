const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix 1: join(",") + "\n";
code = code.replace(/join\(\",\"\)\ \+\ \"[\r\n]+\"/g, 'join(",") + "\\n"');

// Fix 2: EZMob comment
code = code.replace(/const comment = '[\r\n]+    <!-- EZMob Site Validation Code: EZMTNDAFBDSCOTJPM5F -->[\r\n]  '/g, "const comment = '\\n    <!-- EZMob Site Validation Code: EZMTNDAFBDSCOTJPM5F -->\\n  '");

fs.writeFileSync('server.ts', code);
