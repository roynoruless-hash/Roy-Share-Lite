const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const targetStr = `app.get("/api/admin/video-analytics", async (req, res) => {
  try {
    // Simple aggregation
    const sessionsSnap = await getDocs(collection(db, "video_task_sessions"));
    const rewardsSnap = await getDocs(collection(db, "video_rewards"));
    const tasksSnap = await getDocs(collection(db, "video_tasks"));

    const sessions = sessionsSnap.docs.map(d => d.data());
    const rewards = rewardsSnap.docs.map(d => d.data());
    const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const totalViews = sessions.length;
    const completedAds = rewards.length;
    const failedAds = totalViews - completedAds;

    const rewardsPaid = rewards.reduce((sum, r) => sum + (parseFloat(r.rewardAmount) || 0), 0);

    // Estimated revenue based on tasks' CPM
    let estimatedRevenue = 0;
    rewards.forEach(r => {
      const task = tasks.find(t => t.id === r.taskId);
      if (task && task.cpm && task.viewsPerCpm) {
        estimatedRevenue += (parseFloat(task.cpm) / parseFloat(task.viewsPerCpm));
      }
    });

    const profit = estimatedRevenue - rewardsPaid;

    res.json({
      totalViews,
      completedAds,
      failedAds,
      rewardsPaid: rewardsPaid.toFixed(2),
      estimatedRevenue: estimatedRevenue.toFixed(2),
      profit: profit.toFixed(2)
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});`;

const replacement = `app.get("/api/admin/video-analytics", async (req, res) => {
  try {
    const sessionsSnap = await getDocs(collection(db, "video_task_sessions"));
    const rewardsSnap = await getDocs(collection(db, "video_rewards"));
    const tasksSnap = await getDocs(collection(db, "video_tasks"));

    const sessions = sessionsSnap.docs.map(d => d.data());
    const rewards = rewardsSnap.docs.map(d => d.data());
    const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const totalViews = sessions.length;
    const verifiedViews = rewards.length;
    const pendingVerification = sessions.filter(s => s.status === "Pending").length;
    const completedUsers = new Set(rewards.map(r => r.userId)).size;

    const totalRewardPaid = rewards.reduce((sum, r) => sum + (parseFloat(r.rewardAmount) || 0), 0);
    const totalRevenue = rewards.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);
    const platformProfit = totalRevenue - totalRewardPaid;

    let avgCpm = 0;
    if (tasks.length > 0) {
      avgCpm = tasks.reduce((sum, t) => sum + (parseFloat(t.cpm) || 0), 0) / tasks.length;
    }

    res.json({
      totalViews,
      verifiedViews,
      pendingVerification,
      completedUsers,
      totalRevenue,
      totalRewardPaid,
      platformProfit,
      avgCpm
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('/app/applet/server.ts', code);
console.log("Updated analytics in server.ts");
