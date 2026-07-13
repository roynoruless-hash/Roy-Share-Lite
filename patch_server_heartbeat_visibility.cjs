const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `
    let { heartbeats, focusLossCount, riskScore, fraudReason } = data;
    heartbeats = (heartbeats || 0) + 1;
    
    if (documentHidden) {
      focusLossCount = (focusLossCount || 0) + 1;
      riskScore += 20;
      fraudReason += "Hidden window. ";
    }
`;

const newLogic = `
    let { heartbeats, focusLossCount, riskScore, fraudReason } = data;
    heartbeats = (heartbeats || 0) + 1;
    
    if (documentHidden) {
      focusLossCount = (focusLossCount || 0) + 1;
      riskScore += 20;
      fraudReason += "Hidden window. ";
    }

    let currentStatus = data.status;
    if (focusLossCount > 6) { // 30+ seconds hidden
      currentStatus = "invalidated";
      fraudReason += "Hidden for too long. ";
    }
`;

code = code.replace(oldLogic, newLogic);

// We also need to update the save object to include status
const oldSave = `
    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      heartbeats,
      focusLossCount,
      riskScore,
      fraudReason,
      devToolsDetected: devToolsDetected || data.devToolsDetected,
      automationDetected: automationDetected || data.automationDetected,
      lastHeartbeat: new Date().toISOString()
    });
`;

const newSave = `
    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      status: currentStatus,
      heartbeats,
      focusLossCount,
      riskScore,
      fraudReason,
      devToolsDetected: devToolsDetected || data.devToolsDetected,
      automationDetected: automationDetected || data.automationDetected,
      lastHeartbeat: new Date().toISOString()
    });
`;
code = code.replace(oldSave, newSave);

fs.writeFileSync('server.ts', code);
console.log("Server heartbeat logic updated.");
