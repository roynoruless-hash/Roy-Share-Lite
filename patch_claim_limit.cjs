const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const replacement = `
    const perUserLimit = parseInt(taskData.perUserLimit) || 10;
    if (todayCompletions >= perUserLimit) return res.status(400).json({ error: "Daily limit reached for this task." });
    
    // Check Global Daily Limit
    const globalDailyLimit = parseInt(taskData.dailyLimit) || 0;
    if (globalDailyLimit > 0) {
      const globalRewardsQ = query(collection(db, "video_rewards"), where("taskId", "==", taskId));
      const globalRewardsSnap = await getDocs(globalRewardsQ);
      const globalTodayCompletions = globalRewardsSnap.docs.filter(d => (d.data().completedAt || "").startsWith(today)).length;
      if (globalTodayCompletions >= globalDailyLimit) {
        return res.status(400).json({ error: "Overall daily limit reached for this task." });
      }
    }
`;

code = code.replace(`
    const perUserLimit = parseInt(taskData.perUserLimit) || 10;
    if (todayCompletions >= perUserLimit) return res.status(400).json({ error: "Daily limit reached for this task." });`, replacement);

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Added global daily limit check");
