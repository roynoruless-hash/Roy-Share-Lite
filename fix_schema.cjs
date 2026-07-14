const fs = require('fs');

let adminCode = fs.readFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', 'utf8');
adminCode = adminCode.replace(/editingTask\.name/g, 'editingTask.taskName');
adminCode = adminCode.replace(/task\.name/g, 'task.taskName');
adminCode = adminCode.replace(/rewardAmount/g, 'rewardPerView');
adminCode = adminCode.replace(/editingTask\.clickAdillaScript/g, 'editingTask.clickadillaScript');

fs.writeFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', adminCode);

let serverCode = fs.readFileSync('/app/applet/server.ts', 'utf8');
serverCode = serverCode.replace(/task\.name/g, 'task.taskName');
serverCode = serverCode.replace(/taskData\.name/g, 'taskData.taskName');
serverCode = serverCode.replace(/taskData\.rewardAmount/g, 'taskData.rewardPerView');
serverCode = serverCode.replace(/taskData\.clickAdillaScript/g, 'taskData.clickadillaScript');
serverCode = serverCode.replace(/r\.rewardAmount/g, 'r.rewardPerView');
fs.writeFileSync('/app/applet/server.ts', serverCode);

let pageCode = fs.readFileSync('/app/applet/src/pages/VideoTaskPage.tsx', 'utf8');
pageCode = pageCode.replace(/task\.name/g, 'task.taskName');
pageCode = pageCode.replace(/task\.rewardAmount/g, 'task.rewardPerView');
pageCode = pageCode.replace(/task\.clickAdillaScript/g, 'task.clickadillaScript');
fs.writeFileSync('/app/applet/src/pages/VideoTaskPage.tsx', pageCode);

let cardCode = fs.readFileSync('/app/applet/src/components/VideoTaskCard.tsx', 'utf8');
cardCode = cardCode.replace(/task\.name/g, 'task.taskName');
cardCode = cardCode.replace(/task\.rewardAmount/g, 'task.rewardPerView');
fs.writeFileSync('/app/applet/src/components/VideoTaskCard.tsx', cardCode);

console.log("Schema fixed");
