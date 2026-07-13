const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const sessionStartStr = '// USER: Create session';
const endAnalyticsStr = 'app.get("/api/admin/video-analytics"';
const endIndex = serverCode.indexOf(endAnalyticsStr);

const newSessionAndVerifyCode = `
// USER: Create session
app.post("/api/video-tasks/session", async (req, res) => {
  try {
    const { userId, taskId, fingerprint, userAgent, existingToken, chatId, screenResolution, timezone, language } = req.body;
    if (!userId || !taskId) return res.status(400).json({ error: "Missing required fields" });

    // Validate task
    const taskSnap = await getDoc(doc(db, "video_tasks", taskId));
    if (!taskSnap.exists() || taskSnap.data().status !== "Active") {
      return res.status(400).json({ error: "Invalid or inactive task" });
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Unknown";

    // Resume existing session if page refreshes
    if (existingToken) {
       const q = query(collection(db, "video_task_sessions"), where("token", "==", existingToken), where("status", "==", "pending"));
       const snap = await getDocs(q);
       if (!snap.empty) {
          const sessionDoc = snap.docs[0];
          let refreshes = (sessionDoc.data().refreshes || 0) + 1;
          let riskScore = (sessionDoc.data().riskScore || 0) + 10; // Refresh +10
          let fraudReason = sessionDoc.data().fraudReason || "";
          fraudReason += "Refreshed. ";
          let status = "pending";
          if (refreshes > 3) {
             status = "invalidated";
             fraudReason += "Too many refreshes. ";
          }
          await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { refreshes, riskScore, status, fraudReason, updatedAt: new Date().toISOString() });
          if (status === "invalidated") {
             return res.status(400).json({ error: "Session invalidated due to too many refreshes" });
          }
          return res.json({ token: existingToken, script: taskSnap.data().clickAdillaScript, countdown: taskSnap.data().countdown, resumed: true });
       }
    }

    // Invalidate old pending sessions for this user+task to prevent multi-tab
    const qOld = query(collection(db, "video_task_sessions"), 
      where("userId", "==", String(userId)), 
      where("taskId", "==", taskId), 
      where("status", "==", "pending")
    );
    const oldSnap = await getDocs(qOld);
    for (const d of oldSnap.docs) {
       await updateDoc(doc(db, "video_task_sessions", d.id), { status: "invalidated", fraudReason: "Multiple tabs/sessions", riskScore: (d.data().riskScore || 0) + 30 });
    }

    // Generate unique 64-byte Secure Token
    const token = crypto.randomBytes(64).toString("hex");

    await addDoc(collection(db, "video_task_sessions"), {
      userId: String(userId),
      chatId: String(chatId || "Unknown"),
      taskId,
      token,
      status: "pending",
      createdAt: new Date().toISOString(),
      fingerprint: fingerprint || "missing",
      userAgent: userAgent || "missing",
      screenResolution: screenResolution || "Unknown",
      timezone: timezone || "Unknown",
      language: language || "Unknown",
      ip: ip,
      refreshes: 0,
      riskScore: 0,
      heartbeats: 0,
      focusLossCount: 0,
      devToolsDetected: false,
      automationDetected: false,
      fraudReason: "",
      lastHeartbeat: new Date().toISOString()
    });

    res.json({ token, script: taskSnap.data().clickAdillaScript, countdown: taskSnap.data().countdown });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/video-tasks/heartbeat", async (req, res) => {
  try {
    const { token, userId, taskId, fingerprint, documentHidden, devToolsDetected, automationDetected } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: "Session not found" });

    const sessionDoc = snap.docs[0];
    const data = sessionDoc.data();

    if (data.status !== "pending") return res.json({ success: true }); // Ignore if already processed

    let { heartbeats, focusLossCount, riskScore, fraudReason } = data;
    heartbeats = (heartbeats || 0) + 1;
    
    if (documentHidden) {
      focusLossCount = (focusLossCount || 0) + 1;
      riskScore += 20;
      fraudReason += "Hidden window. ";
    }
    if (devToolsDetected && !data.devToolsDetected) {
      riskScore += 40;
      fraudReason += "DevTools detected. ";
    }
    if (automationDetected && !data.automationDetected) {
      riskScore += 50;
      fraudReason += "Automation detected. ";
    }

    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      heartbeats,
      focusLossCount,
      riskScore,
      fraudReason,
      devToolsDetected: devToolsDetected || data.devToolsDetected,
      automationDetected: automationDetected || data.automationDetected,
      lastHeartbeat: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// S2S Postback for ClickAdilla or other networks
app.get("/api/video-tasks/postback", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);

    if (snap.empty) return res.status(404).json({ error: "Session not found" });

    const sessionDoc = snap.docs[0];
    if (sessionDoc.data().status === "pending") {
      await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
        status: "verified"
      });
    }
    res.send("OK");
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// USER: Verify and Claim
app.post("/api/video-tasks/verify", async (req, res) => {
  try {
    const { userId, taskId, token, fingerprint, scriptLoaded, scriptExecuted } = req.body;
    if (!userId || !taskId || !token) return res.status(400).json({ error: "Missing parameters" });

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token), where("userId", "==", String(userId)), where("taskId", "==", taskId));
    const snap = await getDocs(q);

    if (snap.empty) return res.status(400).json({ error: "Invalid session token" });

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();

    if (sessionData.status === "completed") return res.status(400).json({ error: "Reward already claimed for this session" });
    if (sessionData.status === "invalidated") return res.status(400).json({ error: "Session invalidated: " + (sessionData.fraudReason || "Unknown") });
    if (sessionData.status === "auto_banned") return res.status(400).json({ error: "Session banned due to critical security violations." });

    let riskScore = sessionData.riskScore || 0;
    let fraudReason = sessionData.fraudReason || "";
    const currentIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Unknown";
    
    // Anti IP Change
    if (sessionData.ip !== currentIp) {
       riskScore += 30;
       fraudReason += "IP changed. ";
    }
    // Anti Device Change
    if (sessionData.fingerprint !== fingerprint) return res.status(400).json({ error: "Device fingerprint mismatch. Device change detected." });

    // Fallback Verification Mode Validation
    if (!scriptLoaded || !scriptExecuted) return res.status(400).json({ error: "Ad script failed to load or execute properly." });

    // Check task limits and Watch Timer
    const taskSnap = await getDoc(doc(db, "video_tasks", taskId));
    if (!taskSnap.exists()) return res.status(404).json({ error: "Task not found" });
    const taskData = taskSnap.data();

    const minWatchTimeSecs = parseInt(taskData.countdown) || 0;
    const startTime = new Date(sessionData.createdAt).getTime();
    const now = Date.now();
    const elapsedSecs = (now - startTime) / 1000;

    // Heartbeat check: If we've been watching for X seconds, we expect about X/5 heartbeats.
    // Give some leeway. If expected > 2 and actual == 0, that's bad.
    const expectedHeartbeats = Math.floor(elapsedSecs / 5);
    if (expectedHeartbeats >= 1 && (sessionData.heartbeats || 0) === 0) {
       riskScore += 40;
       fraudReason += "Missing heartbeats. ";
    }

    if (elapsedSecs < minWatchTimeSecs) {
       riskScore += 50; // Too fast
       fraudReason += "Completed too fast. ";
       await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { riskScore, fraudReason });
       return res.status(400).json({ error: "Completed too fast. Minimum watch time not met." });
    }

    // Check Cooldown and Limits
    const adminSettingsSnap = await getDoc(doc(db, "settings", "video_ads_config"));
    const adminSettings = adminSettingsSnap.exists() ? adminSettingsSnap.data() : { maxPerHour: 10, maxPerDay: 50, cooldownSecs: 30 };
    
    const rewardsQ = query(collection(db, "video_rewards"), where("userId", "==", String(userId)), orderBy("completedAt", "desc"));
    const rewardsSnap = await getDocs(rewardsQ);
    const userRewards = rewardsSnap.docs.map(d => d.data());
    
    if (userRewards.length > 0) {
       const lastRewardTime = new Date(userRewards[0].completedAt).getTime();
       if ((now - lastRewardTime) / 1000 < (adminSettings.cooldownSecs || 0)) {
           return res.status(400).json({ error: "Cooldown period active. Please wait before next ad." });
       }
    }

    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = userRewards.filter(r => (r.completedAt || "").startsWith(today)).length;
    if (todayCompletions >= (adminSettings.maxPerDay || 50)) return res.status(400).json({ error: "Daily ad limit reached." });

    const dailyLimit = parseInt(taskData.dailyLimit) || 0;
    if (dailyLimit > 0) {
      const taskTodayCompletions = userRewards.filter(r => (r.completedAt || "").startsWith(today) && r.taskId === taskId).length;
      if (taskTodayCompletions >= dailyLimit) return res.status(400).json({ error: "Daily limit reached for this specific task" });
    }

    let finalStatus = "completed";
    if (riskScore > 80) finalStatus = "auto_banned";
    else if (riskScore > 50) finalStatus = "pending_review";

    const rewardAmount = parseFloat(taskData.rewardAmount) || 0;

    // Mark session
    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      status: finalStatus,
      riskScore,
      fraudReason,
      completedAt: new Date().toISOString()
    });

    if (finalStatus === "auto_banned") {
       return res.status(400).json({ error: "Session automatically banned due to critical security violations." });
    }
    if (finalStatus === "pending_review") {
       return res.status(200).json({ success: true, pendingReview: true, message: "Account flagged for review due to suspicious activity." });
    }

    // Save reward history
    await addDoc(collection(db, "video_rewards"), {
      userId: String(userId),
      taskId,
      token,
      rewardAmount,
      completedAt: new Date().toISOString()
    });

    // Update wallet balance
    const userRef = doc(db, "users", String(userId));
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentBalance = parseFloat(userSnap.data().balance) || 0;
      await updateDoc(userRef, { balance: currentBalance + rewardAmount });
      await addDoc(collection(db, "transactions"), {
        userId: String(userId),
        amount: rewardAmount,
        type: "video_ad_reward",
        description: \`Reward for Video Ad: \${taskData.name}\`,
        status: "completed",
        createdAt: new Date().toISOString(),
        taskId
      });
    }

    const analyticsRef = doc(db, "analytics", "video_ads");
    await setDoc(analyticsRef, { completedAds: increment(1), rewardsPaid: increment(rewardAmount) }, { merge: true });

    res.json({ success: true, reward: rewardAmount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Logs API
app.get("/api/admin/video-logs", async (req, res) => {
  try {
    const q = query(collection(db, "video_task_sessions"), orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/video-logs-action", async (req, res) => {
  try {
    const { sessionId, action } = req.body;
    // Basic admin check should go here
    const sessionRef = doc(db, "video_task_sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) return res.status(404).json({ error: "Session not found" });

    const sessionData = sessionSnap.data();
    if (action === "approve" && sessionData.status === "pending_review") {
      // Need task data
      const taskSnap = await getDoc(doc(db, "video_tasks", sessionData.taskId));
      const rewardAmount = taskSnap.exists() ? parseFloat(taskSnap.data().rewardAmount) || 0 : 0;
      
      await updateDoc(sessionRef, { status: "completed", fraudReason: sessionData.fraudReason + " [Admin Approved]", completedAt: new Date().toISOString() });
      
      // Credit user
      const userRef = doc(db, "users", String(sessionData.userId));
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentBalance = parseFloat(userSnap.data().balance) || 0;
        await updateDoc(userRef, { balance: currentBalance + rewardAmount });
        await addDoc(collection(db, "transactions"), {
          userId: String(sessionData.userId),
          amount: rewardAmount,
          type: "video_ad_reward",
          description: \`Admin Approved Reward: \${taskSnap.data()?.name || "Unknown"}\`,
          status: "completed",
          createdAt: new Date().toISOString(),
          taskId: sessionData.taskId
        });
      }
      res.json({ success: true, status: "completed" });
    } else if (action === "reject") {
      await updateDoc(sessionRef, { status: "rejected", fraudReason: sessionData.fraudReason + " [Admin Rejected]" });
      res.json({ success: true, status: "rejected" });
    } else if (action === "ban") {
      await updateDoc(sessionRef, { status: "auto_banned", fraudReason: sessionData.fraudReason + " [Admin Banned]" });
      res.json({ success: true, status: "auto_banned" });
    } else {
      res.status(400).json({ error: "Invalid action or status" });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
`;

const startIndex = serverCode.indexOf(sessionStartStr);
if (startIndex !== -1 && endIndex !== -1) {
  const newCode = serverCode.substring(0, startIndex) + newSessionAndVerifyCode + '\n' + serverCode.substring(endIndex);
  fs.writeFileSync('server.ts', newCode);
  console.log('Successfully patched server.ts');
} else {
  console.error('Could not find markers to patch server.ts');
}

