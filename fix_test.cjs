const fs = require('fs');
let content = fs.readFileSync('e2e_video_task.cjs', 'utf8');
content = content.replace('console.log("=== STARTING PRODUCTION VALIDATION ===\\n");', `console.log("=== STARTING PRODUCTION VALIDATION ===\\n");
  console.log("0. Creating Mock User...");
  await request("POST", "/api/test/create-user", { userId: testUserId });
  console.log(\`✅ Mock User Created (ID: \${testUserId})\\n\`);
`);
fs.writeFileSync('e2e_video_task.cjs', content);
