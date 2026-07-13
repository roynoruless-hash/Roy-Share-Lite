const fs = require('fs');
let code = fs.readFileSync('src/pages/MiniAppHome.tsx', 'utf8');

code = code.replace('import VideoTaskPage from "./VideoTaskPage";\\nimport { Video } from "lucide-react";\\n', '');
const finalImports = `import VideoTaskPage from "./VideoTaskPage";\nimport { Video } from "lucide-react";\n`;
code = finalImports + code;

fs.writeFileSync('src/pages/MiniAppHome.tsx', code);
