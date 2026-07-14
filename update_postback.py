import os

file_path = "/app/applet/server.ts"
with open(file_path, "r") as f:
    content = f.read()

# I will replace the block from "app.get("/api/video-tasks/postback"" up to "res.send("OK");  } catch (e: any) {    res.status(500).json({ error: e.message });  }});"
# Actually, it's safer to just look for the start and end and replace the whole block.

# Using a simpler approach: just locate and replace by substring
start_str = 'app.get("/api/video-tasks/postback", async (req, res) => {'
# Find the end of this block, which is the "});" after the catch block
# This is a bit tricky with find()
start_index = content.find(start_str)
end_index = content.find("});", start_index) + 3

# Now construct the new content
# For simplicity, I'll just use the new code string I crafted.

new_handler = """app.get("/api/video-tasks/postback", async (req, res) => {
  try {
    const { token, click_id, id, spot_id, spot, callback_id, transaction_id, txid, signature } = req.query;
    const finalToken = token || click_id || id;
    const spotId = spot_id || spot;
    const callbackId = callback_id || transaction_id || txid;

    if (!finalToken) return res.status(400).json({ error: "Missing token" });
    if (!callbackId) return res.status(400).json({ error: "Missing callback_id" });
    if (!spotId) return res.status(400).json({ error: "Missing spot_id" });
    if (!signature) return res.status(400).json({ error: "Missing signature" });

    const globalConfigSnap = await getDoc(doc(db, "settings", "clickadilla_ads_manager"));
    const globalConfig = globalConfigSnap.exists() ? globalConfigSnap.data() : {};
    
    // HMAC Signature Verification
    const secretKey = globalConfig.callbackSecret || "secret";
    const dataToSign = `${callbackId}:${finalToken}:${spotId}`;
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("hex");
    
    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }
    
    if (globalConfig.spotId && String(spotId) !== String(globalConfig.spotId)) {
      return res.status(400).json({ error: "Invalid Spot ID for this postback" });
    }

    const callbackRef = doc(db, "video_task_callbacks", String(callbackId));
    const callbackSnap = await getDoc(callbackRef);
    if (callbackSnap.exists()) {
      return res.status(400).json({ error: "Duplicate callback ID." });
    }

    const q = query(collection(db, "video_task_sessions"), where("token", "==", finalToken));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: "Session not found" });

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();

    if (sessionData.status === "verified" || sessionData.status === "completed") {
      return res.status(400).json({ error: "Reward already claimed" });
    }

    await setDoc(callbackRef, {
        callbackId: String(callbackId),
        token: finalToken,
        spotId: String(spotId),
        verifiedAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
        status: "verified",
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Postback"
    });

    res.send("OK");
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});"""

new_content = content[:start_index] + new_handler + content[end_index:]
with open(file_path, "w") as f:
    f.write(new_content)
print("Updated handler")
