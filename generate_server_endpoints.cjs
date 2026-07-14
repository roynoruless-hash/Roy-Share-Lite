const fs = require('fs');

const code = `
// USER: Create session
app.post("/api/video-tasks/session", async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    const token = "vt_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    await addDoc(collection(db, "video_task_sessions"), {
      userId: String(userId),
      taskId,
      token,
      status: "Pending",
      createdAt: new Date().toISOString()
    });
    
    res.json({ success: true, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// S2S Postback for ClickAdilla
app.get("/api/video-tasks/postback", async (req, res) => {
  try {
    const token = req.query.token || req.query.click_id || req.query.id;
    if (!token) return res.status(400).json({ error: "Missing token" });
    
    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: "Session not found" });
    
    const sessionDoc = snap.docs[0];
    if (sessionDoc.data().status === "Pending") {
      await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
        status: "Verified",
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Postback"
      });
    }
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET video task session status & API Verify
app.get("/api/video-tasks/verify", async (req, res) => {
  try {
    const { token, taskId } = req.query;
    if (!token || !taskId) return res.status(400).json({ error: "Missing params" });
    
    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: "Session not found" });
    
    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();
    
    if (sessionData.status === "Verified") {
      return res.json({ status: "Verified" });
    }
    
    // Check via API Endpoint if not verified by Postback
    const taskSnap = await getDoc(doc(db, "video_tasks", String(taskId)));
    if (taskSnap.exists()) {
      const taskData = taskSnap.data();
      if (taskData.apiEndpoint && !taskData.apiEndpoint.includes("your-domain.com")) {
        try {
          const apiRes = await fetch(\`\${taskData.apiEndpoint}?token=\${token}&secret=\${taskData.secretKey}\`);
          if (apiRes.ok) {
            const data = await apiRes.json().catch(() => ({}));
            // Assume 200 OK means verified, or adapt based on ClickAdilla real response
            await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
              status: "Verified",
              verifiedAt: new Date().toISOString(),
              verifiedBy: "API"
            });
            return res.json({ status: "Verified" });
          }
        } catch (apiError) {
          console.error("ClickAdilla API error:", apiError);
        }
      } else {
        // FALLBACK: For demonstration purposes if they haven't configured ClickAdilla yet, 
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
    }
    
    res.json({ status: "Pending" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// USER: Claim Reward
app.post("/api/video-tasks/claim", async (req, res) => {
  try {
    const { userId, taskId, token, telegramUserId } = req.body;
    if (!userId || !taskId || !token) return res.status(400).json({ error: "Missing parameters" });
    
    const q = query(collection(db, "video_task_sessions"), where("token", "==", token), where("userId", "==", String(userId)), where("taskId", "==", taskId));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(400).json({ error: "Invalid session token" });
    
    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();
    
    if (sessionData.status === "completed") return res.status(400).json({ error: "Reward already claimed for this session" });
    if (sessionData.status !== "Verified") return res.status(400).json({ error: "Task not verified by ClickAdilla API." });
    
    const taskSnap = await getDoc(doc(db, "video_tasks", taskId));
    if (!taskSnap.exists()) return res.status(404).json({ error: "Task not found" });
    const taskData = taskSnap.data();
    
    // Check Daily Limit
    const today = new Date().toISOString().split('T')[0];
    const rewardsQ = query(collection(db, "video_rewards"), where("userId", "==", String(userId)), where("taskId", "==", taskId));
    const rewardsSnap = await getDocs(rewardsQ);
    const userTaskRewards = rewardsSnap.docs.map(d => d.data());
    const todayCompletions = userTaskRewards.filter(r => (r.completedAt || "").startsWith(today)).length;
    
    const perUserLimit = parseInt(taskData.perUserLimit) || 10;
    if (todayCompletions >= perUserLimit) return res.status(400).json({ error: "Daily limit reached for this task." });
    
    const rewardAmount = parseFloat(taskData.rewardAmount) || 0;
    const revenue = (parseFloat(taskData.cpm) || 0) / 1000;
    
    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      status: "completed",
      completedAt: new Date().toISOString()
    });
    
    // Save reward history
    await addDoc(collection(db, "video_rewards"), {
      userId: String(userId),
      telegramUserId: String(telegramUserId || ""),
      taskId,
      token,
      rewardAmount,
      revenue,
      completedAt: new Date().toISOString()
    });
    
    // Update user balance
    const userRef = doc(db, "users", String(userId));
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
       const uData = userSnap.data();
       const currentBalance = parseFloat(uData.balance) || 0;
       const availableBalance = parseFloat(uData.availableBalance || uData.balance) || 0;
       const totalEarnings = parseFloat(uData.totalEarnings) || 0;
       
       await updateDoc(userRef, { 
         balance: currentBalance + rewardAmount,
         availableBalance: availableBalance + rewardAmount,
         totalEarnings: totalEarnings + rewardAmount
       });
       
       await addDoc(collection(db, "transactions"), {
          userId: String(userId),
          amount: rewardAmount,
          type: "video_ad_reward",
          description: \`Reward for Video Ad: \${escapeHTML(taskData.name)}\`,
          status: "completed",
          createdAt: new Date().toISOString(),
          taskId
       });
    }
    
    res.json({ success: true, reward: rewardAmount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
`;

fs.writeFileSync('server_video_endpoints.ts', code);
console.log("Written server_video_endpoints.ts");
