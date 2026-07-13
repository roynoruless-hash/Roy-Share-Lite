const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const sessionStartStr = 'app.post("/api/video-tasks/session"';
const verifyStartStr = 'app.post("/api/video-tasks/verify"';
// End of verify is just before "app.get("/api/admin/video-analytics"" or similar

// We'll replace by regex or substring
const newSessionAndVerifyCode = `
// USER: Create session
app.post("/api/video-tasks/session", async (req, res) => {
  try {
    const { userId, taskId, fingerprint, userAgent, existingToken } = req.body;
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
          let status = "pending";
          if (refreshes > 3) {
             status = "invalidated";
          }
          await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { refreshes, riskScore, status, updatedAt: new Date().toISOString() });
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
       await updateDoc(doc(db, "video_task_sessions", d.id), { status: "invalidated", reason: "Multiple tabs/sessions", riskScore: (d.data().riskScore || 0) + 30 });
    }

    // Generate unique 64-byte Secure Token
    const token = crypto.randomBytes(64).toString("hex");

    await addDoc(collection(db, "video_task_sessions"), {
      userId: String(userId),
      taskId,
      token,
      status: "pending",
      createdAt: new Date().toISOString(),
      fingerprint: fingerprint || "missing",
      userAgent: userAgent || "missing",
      ip: ip,
      refreshes: 0,
      riskScore: 0
    });

    res.json({ token, script: taskSnap.data().clickAdillaScript, countdown: taskSnap.data().countdown });
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

    if (snap.empty) {
      return res.status(404).json({ error: "Session not found" });
    }

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

    // Find session
    const q = query(collection(db, "video_task_sessions"), where("token", "==", token), where("userId", "==", String(userId)), where("taskId", "==", taskId));
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(400).json({ error: "Invalid session token" });
    }

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();

    if (sessionData.status === "completed") {
      return res.status(400).json({ error: "Reward already claimed for this session" });
    }
    if (sessionData.status === "invalidated") {
      return res.status(400).json({ error: "Session invalidated: " + (sessionData.reason || "Unknown") });
    }

    let riskScore = sessionData.riskScore || 0;
    let fraudReason = "";

    const currentIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Unknown";
    
    // Anti IP Change
    if (sessionData.ip !== currentIp) {
       riskScore += 30; // IP Change
       fraudReason += "IP changed. ";
    }

    // Anti Device Change
    if (sessionData.fingerprint !== fingerprint) {
       return res.status(400).json({ error: "Device fingerprint mismatch. Device change detected." });
    }

    // Script validation (Fallback Mode)
    if (!scriptLoaded || !scriptExecuted) {
       return res.status(400).json({ error: "Ad script failed to load or execute properly." });
    }

    // Check task limits and Watch Timer
    const taskSnap = await getDoc(doc(db, "video_tasks", taskId));
    if (!taskSnap.exists()) return res.status(404).json({ error: "Task not found" });
    const taskData = taskSnap.data();

    // Anti Fast Complete
    const minWatchTimeSecs = parseInt(taskData.countdown) || 0;
    const startTime = new Date(sessionData.createdAt).getTime();
    const now = Date.now();
    const elapsedSecs = (now - startTime) / 1000;

    if (elapsedSecs < minWatchTimeSecs) {
       riskScore += 50; // Too fast
       fraudReason += "Completed too fast. ";
       await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { riskScore, fraudReason });
       return res.status(400).json({ error: "Completed too fast. Minimum watch time not met." });
    }

    // Rate Limits (Settings are currently hardcoded or fetched, let's mock the fetch for admin settings)
    // Cooldown, Max per hour, Max per day
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
    if (todayCompletions >= (adminSettings.maxPerDay || 50)) {
       return res.status(400).json({ error: "Daily ad limit reached." });
    }

    const dailyLimit = parseInt(taskData.dailyLimit) || 0;
    if (dailyLimit > 0) {
      const taskTodayCompletions = userRewards.filter(r => (r.completedAt || "").startsWith(today) && r.taskId === taskId).length;
      if (taskTodayCompletions >= dailyLimit) {
        return res.status(400).json({ error: "Daily limit reached for this specific task" });
      }
    }

    // Check S2S status or allow Fallback
    // If status is still pending (meaning S2S didn't fire), we allow it as fallback, but rely on risk score.
    // In strict S2S mode, we'd reject here if status !== 'verified'.
    // But this is the "Fallback Verification Mode".

    let finalStatus = "completed";
    if (riskScore > 50) {
       finalStatus = "pending_review";
    }

    const rewardAmount = parseFloat(taskData.rewardAmount) || 0;

    // Mark session
    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      status: finalStatus,
      riskScore,
      fraudReason,
      completedAt: new Date().toISOString()
    });

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
      await updateDoc(userRef, {
        balance: currentBalance + rewardAmount
      });
      
      // Store transaction
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

    // Update Analytics
    const analyticsRef = doc(db, "analytics", "video_ads");
    await setDoc(analyticsRef, {
      completedAds: increment(1),
      rewardsPaid: increment(rewardAmount)
    }, { merge: true });

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
`;

const startIndex = serverCode.indexOf(sessionStartStr);
const endAnalyticsStr = 'app.get("/api/admin/video-analytics"';
const endIndex = serverCode.indexOf(endAnalyticsStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = serverCode.substring(0, startIndex) + newSessionAndVerifyCode + '\n' + serverCode.substring(endIndex);
  fs.writeFileSync('server.ts', newCode);
  console.log('Successfully patched server.ts');
} else {
  console.error('Could not find markers to patch server.ts');
}

