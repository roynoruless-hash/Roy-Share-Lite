const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `
    if (elapsedSecs < minWatchTimeSecs) {
       riskScore += 50; // Too fast
       fraudReason += "Completed too fast. ";
       await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { riskScore, fraudReason });
       return res.status(400).json({ error: "Completed too fast. Minimum watch time not met." });
    }
`;

const newCheck = `
    // Calculate estimated active time based on heartbeats
    // If heartbeats are missing, active time is assumed to be ONLY the heartbeats we received * 5 seconds
    const maxPossibleActiveTime = (sessionData.heartbeats || 0) * 5;
    const estimatedHiddenTime = (sessionData.focusLossCount || 0) * 5;
    const activeWatchSecs = Math.min(elapsedSecs, maxPossibleActiveTime) - estimatedHiddenTime;

    if (activeWatchSecs < minWatchTimeSecs - 5) { // Allow 5 seconds leeway
       riskScore += 50;
       fraudReason += "Completed too fast or hidden. ";
       await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { riskScore, fraudReason });
       return res.status(400).json({ error: "Minimum active watch time not met. Please keep the window open." });
    }
`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('server.ts', code);
console.log("Server watch time logic patched.");
