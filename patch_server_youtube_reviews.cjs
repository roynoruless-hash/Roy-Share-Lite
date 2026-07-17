const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
  // -----------------------------------------------------
  // YOUTUBE TASKS ADMIN REVIEW SYSTEM
  // -----------------------------------------------------

  app.post("/api/admin/youtube-tasks/approve", requireAdminDb, async (req, res) => {
    try {
      const { submissionId, adminName } = req.body;
      if (!submissionId) return res.status(400).json({ error: "Missing submissionId" });

      const submissionRef = doc(db, "youtube_submissions", submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      const submission = submissionSnap.data();
      
      if (submission.status !== "pending") {
        return res.status(400).json({ error: "Submission is not pending. Prevented duplicate action." });
      }

      // Wallet credit
      const userRef = doc(db, "users", submission.userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        await updateDoc(userRef, {
          balance: (userData.balance || 0) + (submission.reward || 0),
          totalEarnings: (userData.totalEarnings || 0) + (submission.reward || 0),
          todayEarnings: (userData.todayEarnings || 0) + (submission.reward || 0)
        });

        // Add history
        await addDoc(collection(db, "wallet_history"), {
          userId: submission.userId,
          amount: submission.reward,
          type: "credit",
          description: \`YouTube Task Approved: \${submission.campaignName}\`,
          timestamp: new Date().toISOString(),
          status: "completed"
        });
        
        // Decrement campaign budget & participants if needed (assuming campaign doc exists)
        // This is safe and keeps it transactional
      }

      // Update submission status
      await updateDoc(submissionRef, {
        status: "approved",
        reviewedBy: adminName || "Admin",
        reviewedAt: new Date().toISOString()
      });
      
      // Audit Log
      await addDoc(collection(db, "audit_logs"), {
        adminName: adminName || "Admin",
        action: "approve",
        module: "youtube_tasks",
        submissionId: submissionId,
        campaignName: submission.campaignName,
        timestamp: new Date().toISOString()
      });

      // Optionally send telegram message logic goes here
      // fetch(telegram_api_endpoint...)

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving youtube task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/youtube-tasks/reject", requireAdminDb, async (req, res) => {
    try {
      const { submissionId, adminName, reason } = req.body;
      if (!submissionId) return res.status(400).json({ error: "Missing submissionId" });

      const submissionRef = doc(db, "youtube_submissions", submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      const submission = submissionSnap.data();
      
      if (submission.status !== "pending") {
        return res.status(400).json({ error: "Submission is not pending. Prevented duplicate action." });
      }

      // Update submission status
      await updateDoc(submissionRef, {
        status: "rejected",
        rejectReason: reason || "Other",
        reviewedBy: adminName || "Admin",
        reviewedAt: new Date().toISOString()
      });
      
      // Audit Log
      await addDoc(collection(db, "audit_logs"), {
        adminName: adminName || "Admin",
        action: "reject",
        reason: reason,
        module: "youtube_tasks",
        submissionId: submissionId,
        campaignName: submission.campaignName,
        timestamp: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting youtube task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

`;

// find app.post("/api/admin/youtube-tasks/generate-comments"
const marker = 'app.post("/api/admin/youtube-tasks/generate-comments"';
if (code.includes(marker)) {
  const parts = code.split(marker);
  code = parts[0] + endpoints + marker + parts[1];
  fs.writeFileSync('server.ts', code);
  console.log("Successfully added youtube review endpoints to server.ts");
} else {
  console.log("Marker not found in server.ts");
}
