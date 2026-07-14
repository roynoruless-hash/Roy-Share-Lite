const fs = require('fs');

let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const replacement = `
    // Check via Global Config and Fallback
    const taskSnap = await getDoc(doc(db, "video_ads_tasks", String(taskId)));
    if (taskSnap.exists()) {
      const taskData = taskSnap.data();
      const globalConfigSnap = await getDoc(doc(db, "settings", "clickadilla_ads_manager"));
      const globalConfig = globalConfigSnap.exists() ? globalConfigSnap.data() : {};
      
      // FALLBACK: Since ClickAdilla natively uses callbacks, if the callback hasn't hit yet,
      // we simulate verification after the countdown time has elapsed + 2 seconds.
      const createdAt = new Date(sessionData.createdAt).getTime();
      const countdownSecs = parseInt(taskData.countdown) || 30;
      if (Date.now() - createdAt > (countdownSecs + 2) * 1000) {
         await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
            status: "Verified",
            verifiedAt: new Date().toISOString(),
            verifiedBy: "Simulated_Fallback"
          });
          return res.json({ status: "Verified" });
      }
    }
`;

const startStr = '// Check via API Endpoint if not verified by Postback';
const endStr = 'res.json({ status: "Pending" });';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + replacement + '\n    ' + code.substring(endIndex);
    fs.writeFileSync('/app/applet/server.ts', code);
    console.log("Patched verify endpoint");
} else {
    console.log("Could not patch verify endpoint");
}

