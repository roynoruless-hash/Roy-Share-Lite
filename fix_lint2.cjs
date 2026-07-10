const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/const \[aiGenMessage, setAiGenMessage\] = useState\(false\);/, 'const [aiGenMessage, setAiGenMessage] = useState<any>(null);');
code = code.replace(/const \[activePageTab, setActivePageTab\] = useState\(""\);/, 'const [activePageTab, setActivePageTab] = useState<number>(1);');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Lint issues fixed 2");
