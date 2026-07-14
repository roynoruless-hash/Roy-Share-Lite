const fs = require('fs');
console.log(fs.readFileSync('/app/applet/src/pages/VideoTaskPage.tsx', 'utf8').substring(0, 1500));
