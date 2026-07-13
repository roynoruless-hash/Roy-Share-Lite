// GET dedicated browser watch page
app.get("/watch/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).send("<h1>Missing session token</h1>");

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);

    if (snap.empty) return res.status(404).send("<h1>Session not found</h1>");

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();
    const taskId = sessionData.taskId;

    const taskSnap = await getDoc(doc(db, "video_tasks", taskId));
    if (!taskSnap.exists()) return res.status(404).send("<h1>Video task not found</h1>");
    
    const taskData = taskSnap.data();
    
    const minWatchTimeSecs = parseInt(taskData.countdown) || 30;
    const clickAdillaScript = taskData.clickAdillaScript || "";
    
    const estimatedHiddenTimeSecs = (sessionData.focusLossCount || 0) * 5;
    const elapsedActiveSecs = Math.max(0, (sessionData.heartbeats || 0) * 5 - estimatedHiddenTimeSecs);

    const escapeHTML = (str) => {
      return (str || "").toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Watch Video Ad - RoyShare</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #0b0f19; }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-slate-950">
  
  <header class="max-w-2xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/60 mb-6">
    <div class="flex items-center gap-2">
      <span class="text-xl font-black tracking-tight text-blue-500">ROY<span class="text-white">SHARE</span></span>
      <span class="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Ad Network</span>
    </div>
    <div class="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
      <i class="fa-solid fa-shield-halved text-emerald-400"></i> Secure Session
    </div>
  </header>

  <main id="app-data"
        data-token="${escapeHTML(token)}"
        data-user-id="${escapeHTML(sessionData.userId)}"
        data-task-id="${escapeHTML(taskId)}"
        data-required-seconds="${minWatchTimeSecs}"
        data-elapsed-active-secs="${elapsedActiveSecs}"
        data-focus-loss-count="${sessionData.focusLossCount || 0}"
        class="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-6">
    
    <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
      
      <div class="flex justify-between items-start gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-lg md:text-xl font-extrabold text-white leading-snug truncate">${escapeHTML(taskData.name)}</h1>
          <p class="text-xs text-slate-400 mt-1">${escapeHTML(taskData.description) || "Watch this short video advertisement to earn your reward."}</p>
        </div>
        <div class="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-2xl text-right shrink-0 shadow-inner">
          <p class="text-[9px] uppercase tracking-widest font-black">REWARD</p>
          <p class="font-extrabold text-base">₹${taskData.rewardAmount}</p>
        </div>
      </div>

      <div id="status-container" class="mt-6 p-5 bg-slate-950 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[140px]">
        <div id="timer-box" class="w-16 h-16 rounded-full bg-blue-950/40 border-4 border-blue-500 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-500/10 mb-2">
          ${Math.max(0, minWatchTimeSecs - elapsedActiveSecs)}
        </div>
        <div id="status-text" class="text-sm text-slate-300 font-medium mt-1">Please watch the advertisement below. Keep this page visible.</div>
        
        <div class="w-full max-w-xs bg-slate-800 rounded-full h-2 mt-4 overflow-hidden relative border border-slate-700/30">
          <div id="progress-bar" class="bg-blue-500 h-full w-0 transition-all duration-1000 ease-linear"></div>
        </div>
        <div class="flex justify-between w-full max-w-xs mt-2 text-[10px] text-slate-400">
          <span id="progress-percentage">0% completed</span>
          <span id="est-remaining">Estimated remaining: ${Math.max(0, minWatchTimeSecs - elapsedActiveSecs)}s</span>
        </div>
      </div>
    </div>

    <!-- Ad Wrapper -->
    <div class="bg-slate-950 rounded-3xl border border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[280px] shadow-2xl relative overflow-hidden">
      <!-- Native HTML Injection for Ad Network Verification -->
      <div id="ad-container" class="w-full h-full min-h-[180px] flex items-center justify-center relative z-10 overflow-hidden">
        ${clickAdillaScript}
      </div>
    </div>
  </main>

  <footer class="max-w-2xl mx-auto w-full text-center py-6 border-t border-slate-800/40 mt-8 text-xs text-slate-500 flex flex-col gap-1">
    <p>RoyShare Security Protection & anti-fraud verification engines are active.</p>
  </footer>

  <script>
    // Client-side script strictly separate from server template rendering
    document.addEventListener("DOMContentLoaded", function() {
      const appData = document.getElementById("app-data").dataset;
      const token = appData.token;
      const userId = appData.userId;
      const taskId = appData.taskId;
      const requiredSeconds = parseInt(appData.requiredSeconds, 10);
      const elapsedActiveSecs = parseInt(appData.elapsedActiveSecs, 10);
      
      let timeLeft = Math.max(0, requiredSeconds - elapsedActiveSecs);
      let isVerified = false;
      let heartbeatsSent = 0;
      let currentWatchTime = elapsedActiveSecs;
      
      const timerBox = document.getElementById("timer-box");
      const statusText = document.getElementById("status-text");
      const progressBar = document.getElementById("progress-bar");
      
      const timerInterval = setInterval(() => {
        if (document.hidden) return;
        if (timeLeft > 0 && !isVerified) {
          timeLeft--;
          currentWatchTime++;
          if (timerBox) timerBox.innerText = timeLeft;
          if (document.getElementById("est-remaining")) document.getElementById("est-remaining").innerText = "Estimated remaining: " + timeLeft + "s";
          
          if (progressBar) {
            const percent = Math.min(100, (currentWatchTime / requiredSeconds) * 100);
            progressBar.style.width = percent + "%";
            if (document.getElementById("progress-percentage")) document.getElementById("progress-percentage").innerText = Math.floor(percent) + "% completed";
          }
        }
      }, 1000);

      const heartbeatInterval = setInterval(async () => {
        if (isVerified) return;
        heartbeatsSent++;
        
        try {
          const res = await fetch("/api/video-tasks/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token, userId, taskId, fingerprint: "BROWSER_ENV",
              documentHidden: document.hidden,
              devToolsDetected: false, automationDetected: false,
              scriptLoaded: true, scriptExecuted: true,
              scriptLoadTime: 0, failureReason: ""
            })
          });
          
          if (!res.ok) throw new Error("Heartbeat failed");
          
          const statusRes = await fetch("/api/video-tasks/session-status?token=" + encodeURIComponent(token));
          const statusData = await statusRes.json();
          
          if (statusData.status === "verified" || statusData.status === "completed" || statusData.status === "claimed") {
            isVerified = true;
            clearInterval(timerInterval);
            clearInterval(heartbeatInterval);
            
            const container = document.getElementById("status-container");
            if (container) {
              container.innerHTML = 
                '<div class="w-16 h-16 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10">' +
                  '<i class="fa-solid fa-check text-2xl text-emerald-400"></i>' +
                '</div>' +
                '<h2 class="text-lg font-black text-white">✅ Ad Verified Successfully</h2>' +
                '<p class="text-xs text-slate-400 mt-1 max-w-sm">Your ad session is complete. Return to the RoyShare Mini App to instantly claim your reward.</p>' +
                '<button onclick="window.close()" class="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95">' +
                  'Return to RoyShare' +
                '</button>';
            }
          } else if (statusData.status === "invalidated") {
            isVerified = true;
            clearInterval(timerInterval);
            clearInterval(heartbeatInterval);
            const container = document.getElementById("status-container");
            if (container) {
              container.innerHTML = 
                '<div class="w-16 h-16 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-3">' +
                  '<i class="fa-solid fa-triangle-exclamation text-2xl text-red-400"></i>' +
                '</div>' +
                '<h2 class="text-base font-extrabold text-white">Session Invalidated</h2>' +
                '<p class="text-xs text-slate-400 mt-1">' + (statusData.reason || "Verification checks failed. Please try again.") + '</p>';
            }
          }
        } catch (err) {
          console.error("Heartbeat sync error:", err);
        }
      }, 5000);
    });
  </script>
</body>
</html>`);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

