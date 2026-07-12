const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `      // 1. Fetch task
      const taskRef = doc(db, "gplinks_tasks", taskId);
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        return res.status(404).json({ error: "This task campaign does not exist." });
      }`,
  `      // 1. Fetch task
      let taskRef = doc(db, "gplinks_tasks", taskId);
      let taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        taskRef = doc(db, "tasks", taskId);
        taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) {
          return res.status(404).json({ error: "This task campaign does not exist." });
        }
      }`
);

code = code.replace(
  `if (tData.status !== "Active") {
        return res.status(400).json({ error: "This campaign is not active." });
      }`,
  `if (tData.status !== "Active" && tData.status !== "🟢 Active" && !String(tData.status || "").toLowerCase().includes("active")) {
        return res.status(400).json({ error: "This campaign is not active." });
      }`
);

fs.writeFileSync('server.ts', code);
