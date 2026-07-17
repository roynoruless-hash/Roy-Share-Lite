import express from "express";
import fs from "fs";
import path from "path";
import { getStorage } from "firebase-admin/storage";
import { db } from "../lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction
} from "firebase/firestore";

const router = express.Router();

// Helper to get Telegram Settings
const getTelegramConfig = async () => {
  try {
    const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
    if (telegramSettingsDoc.exists()) {
      return telegramSettingsDoc.data();
    }
  } catch (err) {
    console.error("Error getting telegram config:", err);
  }
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    channelUsername: "",
    botUsername: "Roysharearn_bot"
  };
};

// Send Telegram Message Helper
const sendTgMessage = async (chatId: string, text: string) => {
  const config = await getTelegramConfig();
  const botToken = config?.botToken;
  if (!botToken) {
    console.error("Bot token not configured. Unable to send Telegram message to:", chatId);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
    });
  } catch (err) {
    console.error("Failed to send telegram message:", err);
  }
};

// Post Giveaway to Telegram Channel Helper
const postGiveawayToChannel = async (giveawayId: string, title: string, description: string, bannerUrl: string, prizeAmount: number, totalWinners: number) => {
  const config = await getTelegramConfig();
  const botToken = config?.botToken;
  let channelId = config?.channelUsername;
  const botUsername = (config?.botUsername || "Roysharearn_bot").replace("@", "");

  if (!botToken || !channelId) {
    console.warn("Bot token or Channel username not configured. Skipping channel post.");
    return false;
  }

  if (typeof channelId === "string" && !channelId.startsWith("@") && !channelId.startsWith("-100") && isNaN(Number(channelId))) {
    channelId = `@${channelId}`;
  }

  try {
    const totalBudget = prizeAmount * totalWinners;
    const caption = `🔥 <b>NEW LUCKY NUMBER GIVEAWAY CAMPAIGN!</b> 🔥\n\n` +
      `🏆 <b>${title}</b>\n\n` +
      `${description || ""}\n\n` +
      `💰 Prize per Winner: <b>₹${prizeAmount}</b>\n` +
      `🎁 Lucky Winners: <b>${totalWinners} Winners</b>\n\n` +
      `👇 Click the button below to reserve your lucky number inside our Telegram Mini App!`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        photo: bannerUrl,
        caption,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                "text": "🎁 Reserve Your Number",
                "url": `https://t.me/${botUsername}?startapp=lucky_${giveawayId}`
              }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    return data.ok;
  } catch (err) {
    console.error("Error posting giveaway to channel:", err);
    return false;
  }
};

// Log Action Helper
const writeAuditLog = async (giveawayId: string, giveawayTitle: string, action: string, details: any = {}) => {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const logData = {
      action,
      giveawayId,
      giveawayTitle,
      timestamp: new Date().toISOString(),
      details
    };
    await setDoc(doc(db, "lucky_number_audit_logs", logId), logData);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

// Image Upload Endpoint
router.post("/upload", express.json({ limit: "15mb" }), async (req: any, res: any) => {
  try {
    const { fileName, fileType, base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: "No file content provided" });
    }

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = path.extname(fileName) || `.${fileType?.split("/")[1] || "png"}`;
    const uniqueFileName = `lucky_giveaway_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Firebase Storage
    try {
      const bucket = getStorage().bucket();
      if (bucket) {
        const fileRef = bucket.file(`lucky_giveaway/${uniqueFileName}`);
        await fileRef.save(buffer, {
          metadata: {
            contentType: fileType || "image/png"
          },
          public: true
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/lucky_giveaway/${uniqueFileName}`;
        return res.json({
          success: true,
          url: publicUrl,
          name: fileName
        });
      }
    } catch (storageError: any) {
      console.warn("Firebase Storage upload failed, falling back to local files:", storageError.message);
    }

    // Local Storage fallback
    const relativeUploadDir = path.join("public", "uploads");
    const distUploadDir = path.join("dist", "uploads");

    if (!fs.existsSync(relativeUploadDir)) {
      fs.mkdirSync(relativeUploadDir, { recursive: true });
    }

    const publicPath = path.join(relativeUploadDir, uniqueFileName);
    fs.writeFileSync(publicPath, buffer);

    if (fs.existsSync("dist")) {
      if (!fs.existsSync(distUploadDir)) {
        fs.mkdirSync(distUploadDir, { recursive: true });
      }
      const distPath = path.join(distUploadDir, uniqueFileName);
      fs.writeFileSync(distPath, buffer);
    }

    const localUrl = `/uploads/${uniqueFileName}`;
    return res.json({
      success: true,
      url: localUrl,
      name: fileName
    });

  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to upload file" });
  }
});

// enroll user in Lucky Draw Campaign (kept for backward compatibility with the other page)
router.post("/lucky-draw/enroll", async (req: any, res: any) => {
  try {
    const { campaignId, telegramId } = req.body;
    if (!campaignId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing campaignId or telegramId" });
    }

    const campaignDocRef = doc(db, "lucky_draws", campaignId);
    const campaignDoc = await getDoc(campaignDocRef);
    if (!campaignDoc.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found." });
    }

    const campaign = campaignDoc.data();
    const userDocRef = doc(db, "users", String(telegramId));
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return res.status(404).json({ success: false, error: "User profile not found." });
    }

    const u = userDoc.data();
    const participantId = `${campaignId}_${telegramId}`;
    const participantRef = doc(db, "lucky_draw_participants", participantId);
    
    await setDoc(participantRef, {
      campaignId,
      telegramId: String(telegramId),
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.enteredName || "Anonymous User",
      username: u.username || "no_username",
      joinedAt: new Date().toISOString(),
      isEligible: true,
      eligibilityReasons: []
    });

    // Send telegram notification
    const msgText = `🎉 <b>You have successfully joined the Lucky Draw!</b>\n\n` +
      `Campaign: <b>${campaign.title}</b>\n` +
      `Status: <b>Enrolled 🍀</b>\n\n` +
      `We will notify you instantly if you are randomly selected as a winner!`;
    await sendTgMessage(String(telegramId), msgText);

    return res.json({ success: true, message: "Successfully enrolled in this Lucky Draw!" });
  } catch (err: any) {
    console.error("Lucky Draw enroll error:", err);
    return res.status(500).json({ success: false, error: err.message || "Enrollment failed." });
  }
});

// Reserve Lucky Number (Temporary Reservation)
router.post("/reserve-number", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId, username, firstName, selectedNumber } = req.body;
    
    if (!giveawayId || !telegramId || !selectedNumber) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const num = Number(selectedNumber);

    // Get campaign details
    const campaignDoc = await getDoc(doc(db, "lucky_number_campaigns", giveawayId));
    if (!campaignDoc.exists()) {
      return res.status(404).json({ success: false, error: "Lucky Number Campaign not found" });
    }

    const campaign = campaignDoc.data();
    if (campaign.status !== "Live") {
      return res.status(400).json({ success: false, error: "This campaign is not active or has already closed." });
    }

    // Check selected number bounds
    const minNum = Number(campaign.minNumber || 1);
    const maxNum = Number(campaign.maxNumber || 100);
    if (num < minNum || num > maxNum) {
      return res.status(400).json({ success: false, error: `Invalid number. Choose between ${minNum} and ${maxNum}.` });
    }

    // Run transaction to reserve the number and verify user duplicate check
    const result = await runTransaction(db, async (transaction) => {
      // 1. Check if user already has an active selection on this campaign
      const entriesCollRef = collection(db, "lucky_number_entries");
      const userEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}`);
      const userEntrySnap = await transaction.get(userEntryRef);
      if (userEntrySnap.exists()) {
        const uEntry = userEntrySnap.data();
        if (uEntry.status === "Confirmed" || uEntry.status === "Winner" || uEntry.status === "Approved") {
          throw new Error("You have already selected a number for this giveaway! One number per Telegram account only.");
        }
      }

      // 2. Check if this specific number is already reserved by another user
      const numberDocId = `${giveawayId}_num_${num}`;
      const numberEntryRef = doc(entriesCollRef, numberDocId);
      const numberEntrySnap = await transaction.get(numberEntryRef);

      if (numberEntrySnap.exists()) {
        const entry = numberEntrySnap.data();
        if (entry.telegramId !== String(telegramId)) {
          if (entry.status === "Confirmed" || entry.status === "Winner" || entry.status === "Approved" || entry.status === "Rejected") {
            throw new Error("This number has already been selected. Please choose another number.");
          }
          if (entry.status === "PendingAd") {
            const reservedAt = new Date(entry.reservedAt).getTime();
            if (Date.now() - reservedAt < 60000) {
              throw new Error("This number is temporarily locked by another user watching an ad. Please choose another number.");
            }
          }
        }
      }

      // Number is available. Create/Overwrite both documents inside the transaction!
      // To ensure "One User = One Number" fast check AND "Unique Number" constraint:
      // We will write the document with ID = numberDocId to represent the number reservation.
      // We also write the document with ID = userEntryRef to represent user reservation.
      
      const entryData = {
        campaignId: giveawayId,
        telegramId: String(telegramId),
        username: username || "",
        firstName: firstName || "",
        selectedNumber: num,
        reservedAt: new Date().toISOString(),
        status: "PendingAd"
      };

      transaction.set(numberEntryRef, entryData);
      transaction.set(userEntryRef, entryData);

      return { success: true };
    });

    return res.json(result);

  } catch (err: any) {
    console.error("Reserve number error:", err);
    return res.status(400).json({ success: false, error: err.message || "Failed to reserve number." });
  }
});

// Confirm Number Selection (Permanently confirmed after successful ad completion)
router.post("/confirm-number", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId } = req.body;

    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const entriesCollRef = collection(db, "lucky_number_entries");
    
    // We need to find the user's active reservation
    const userEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}`);
    const userEntrySnap = await getDoc(userEntryRef);

    if (!userEntrySnap.exists()) {
      return res.status(400).json({ success: false, error: "No pending reservation found. Please select a number first." });
    }

    const entry = userEntrySnap.data();
    if (entry.status !== "PendingAd") {
      return res.status(400).json({ success: false, error: "This reservation is already confirmed or invalid." });
    }

    // Verify it hasn't timed out (60 seconds)
    const reservedAt = new Date(entry.reservedAt).getTime();
    if (Date.now() - reservedAt > 60000) {
      // Clear timed out reservation
      await deleteDoc(userEntryRef);
      await deleteDoc(doc(entriesCollRef, `${giveawayId}_num_${entry.selectedNumber}`));
      return res.status(400).json({ success: false, error: "Your session timed out. Please choose your number again." });
    }

    // Confirm selection permanently
    const confirmTime = new Date().toISOString();
    const updatePayload = {
      status: "Confirmed",
      entryTime: confirmTime,
    };

    const batch = writeBatch(db);
    batch.update(userEntryRef, updatePayload);
    batch.update(doc(entriesCollRef, `${giveawayId}_num_${entry.selectedNumber}`), updatePayload);
    await batch.commit();

    // Write Audit Log
    await writeAuditLog(giveawayId, "Lucky Number Giveaway", "Number Reserved Permanently", {
      telegramId,
      selectedNumber: entry.selectedNumber,
      username: entry.username
    });

    return res.json({ success: true, message: "Number reserved permanently! Participation confirmed." });

  } catch (err: any) {
    console.error("Confirm number error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to confirm number selection" });
  }
});

// Release Number (If ad is closed or failed)
router.post("/release-number", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId } = req.body;

    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const entriesCollRef = collection(db, "lucky_number_entries");
    const userEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}`);
    const userEntrySnap = await getDoc(userEntryRef);

    if (userEntrySnap.exists()) {
      const entry = userEntrySnap.data();
      if (entry.status === "PendingAd") {
        const batch = writeBatch(db);
        batch.delete(userEntryRef);
        batch.delete(doc(entriesCollRef, `${giveawayId}_num_${entry.selectedNumber}`));
        await batch.commit();
        console.log(`[LuckyNumber] Released reservation for user ${telegramId} on number ${entry.selectedNumber}`);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Release number error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to release reservation" });
  }
});

// Create or Update Campaign
router.post("/save-giveaway", async (req: any, res: any) => {
  try {
    const { 
      id, 
      title, 
      description, 
      bannerUrl, 
      prizeAmount, 
      totalWinners, 
      numberRange, 
      minNumber, 
      maxNumber, 
      adsType, 
      numberVisibility, 
      status,
      autoPostChannel
    } = req.body;
    
    if (!title || !bannerUrl || !prizeAmount || !totalWinners || !numberRange) {
      return res.status(400).json({ success: false, error: "Missing required giveaway configurations" });
    }

    const giveawayId = id || `campaign_${Date.now()}`;
    const isNew = !id;

    const minNum = numberRange === "Manual" ? Number(minNumber || 1) : 1;
    let maxNum = 100;
    if (numberRange === "1-50") maxNum = 50;
    else if (numberRange === "1-100") maxNum = 100;
    else if (numberRange === "1-200") maxNum = 200;
    else if (numberRange === "1-300") maxNum = 300;
    else if (numberRange === "1-500") maxNum = 500;
    else if (numberRange === "1-600") maxNum = 600;
    else if (numberRange === "Manual") maxNum = Number(maxNumber || 100);

    const campaignData: any = {
      title,
      description: description || "",
      bannerUrl,
      prizeAmount: Number(prizeAmount),
      totalWinners: Number(totalWinners),
      numberRange,
      minNumber: minNum,
      maxNumber: maxNum,
      adsType: adsType || "Reward",
      numberVisibility: numberVisibility || "Show Remaining Numbers",
      status: status || "Draft",
      createdAt: new Date().toISOString(),
      winnersDrawn: false,
    };

    if (!isNew) {
      const existingDoc = await getDoc(doc(db, "lucky_number_campaigns", giveawayId));
      if (existingDoc.exists()) {
        const exData = existingDoc.data();
        campaignData.createdAt = exData.createdAt || campaignData.createdAt;
        campaignData.winnersDrawn = exData.winnersDrawn !== undefined ? exData.winnersDrawn : false;
        campaignData.winnerId = exData.winnerId || null;
        campaignData.winnerNumber = exData.winnerNumber || null;
        campaignData.winnerName = exData.winnerName || null;
        campaignData.winnerUsername = exData.winnerUsername || null;
        campaignData.winnerStatus = exData.winnerStatus || null;
      }
    }

    await setDoc(doc(db, "lucky_number_campaigns", giveawayId), campaignData, { merge: true });

    // Write Audit Log
    await writeAuditLog(giveawayId, title, isNew ? "Giveaway Created" : "Giveaway Updated", campaignData);

    // Auto post to channel if requested and status is "Live"
    let channelPostSuccess = false;
    if (autoPostChannel && status === "Live") {
      channelPostSuccess = await postGiveawayToChannel(giveawayId, title, description, bannerUrl, Number(prizeAmount), Number(totalWinners));
    }

    return res.json({ 
      success: true, 
      id: giveawayId, 
      message: isNew ? "Campaign created successfully!" : "Campaign updated successfully!",
      channelPostSuccess
    });

  } catch (err: any) {
    console.error("Save giveaway error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to save giveaway." });
  }
});

// Draw Winner
router.post("/draw-winner", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();

    // Fetch all confirmed entries
    const qEntries = query(
      collection(db, "lucky_number_entries"), 
      where("campaignId", "==", giveawayId),
      where("status", "==", "Confirmed")
    );
    const entriesSnap = await getDocs(qEntries);
    const entries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No confirmed entries found to pick a winner from." });
    }

    // Pick a random confirmed entry
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerEntry = entries[randomIndex];

    // Save winner details as Pending verification in campaign document
    await updateDoc(campaignDocRef, {
      winnerId: winnerEntry.telegramId,
      winnerNumber: winnerEntry.selectedNumber,
      winnerName: winnerEntry.firstName || "Anonymous User",
      winnerUsername: winnerEntry.username || "",
      winnerStatus: "Pending",
      status: "Drawing Winners"
    });

    // Update entries status (both User & Number entries) to Winner
    const batch = writeBatch(db);
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerEntry.telegramId}`), {
      status: "Winner",
      drawConfirmedAt: new Date().toISOString()
    });
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${winnerEntry.selectedNumber}`), {
      status: "Winner",
      drawConfirmedAt: new Date().toISOString()
    });
    await batch.commit();

    // Write Audit Log
    await writeAuditLog(giveawayId, campaign.title, "Winner Drawn", {
      telegramId: winnerEntry.telegramId,
      number: winnerEntry.selectedNumber,
      name: winnerEntry.firstName
    });

    return res.json({
      success: true,
      message: "Winner drawn successfully!",
      winner: {
        telegramId: winnerEntry.telegramId,
        number: winnerEntry.selectedNumber,
        name: winnerEntry.firstName,
        username: winnerEntry.username
      }
    });

  } catch (err: any) {
    console.error("Draw winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to draw winner" });
  }
});

// Approve Winner (Credit Wallet automatically, mark complete, notify)
router.post("/approve-winner", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    if (!campaign.winnerId || campaign.winnerStatus !== "Pending") {
      return res.status(400).json({ success: false, error: "No pending winner to approve." });
    }

    const prizeAmt = Number(campaign.prizeAmount || 100);

    // 1. Transaction to Credit Wallet
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", String(campaign.winnerId));
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error(`User profile for Telegram ID ${campaign.winnerId} not found. Cannot credit wallet.`);
      }

      const userData = userSnap.data();
      const currentBalance = Number(userData.balance || 0);
      const newBalance = currentBalance + prizeAmt;

      const fileEarnings = Number(userData.fileEarnings || 0);
      const linkEarnings = Number(userData.linkEarnings || 0);
      const referralEarnings = Number(userData.referralEarnings || 0);
      const bonusBalance = Number(userData.bonusBalance || 0);
      const rewardBalance = Number(userData.rewardBalance || 0);
      const withdrawnAmount = Number(userData.withdrawnAmount || userData.totalWithdrawn || 0);
      const pendingWithdrawals = Number(userData.pendingWithdrawals || 0);

      const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + newBalance - withdrawnAmount - pendingWithdrawals;

      transaction.update(userRef, {
        balance: newBalance,
        availableBalance: availableBalance
      });

      // Log transaction to activityLogs
      const logRef = doc(collection(db, "activityLogs"));
      transaction.set(logRef, {
        adminId: "admin",
        targetUserId: String(campaign.winnerId),
        action: "add_balance",
        amount: prizeAmt,
        reason: `Prize payout for Lucky Number Giveaway: ${campaign.title}`,
        createdAt: new Date()
      });
    });

    // 2. Update Entry documents
    const batch = writeBatch(db);
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${campaign.winnerId}`), {
      status: "Winner",
      paymentStatus: "Paid",
      rewardAmount: prizeAmt,
      paidAt: new Date().toISOString()
    });
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${campaign.winnerNumber}`), {
      status: "Winner",
      paymentStatus: "Paid",
      rewardAmount: prizeAmt,
      paidAt: new Date().toISOString()
    });
    await batch.commit();

    // 3. Update campaign document
    await updateDoc(campaignDocRef, {
      winnerStatus: "Approved",
      status: "Completed",
      winnersDrawn: true
    });

    // 4. Send Bot confirmation message
    const botMsg = `🏆 <b>CONGRATULATIONS! You Won!</b> 🏆\n\n` +
      `You are the lucky winner of our Lucky Number Giveaway campaign: <b>${campaign.title}</b>!\n\n` +
      `💰 Winning Amount: <b>₹${prizeAmt}</b>\n` +
      `🍀 Your Lucky Number: <b>${campaign.winnerNumber}</b>\n\n` +
      `<b>₹${prizeAmt}</b> has been credited instantly to your Roy Share Wallet. You can withdraw it or check your balance anytime inside the app! 🎉`;
    
    await sendTgMessage(String(campaign.winnerId), botMsg);

    // Audit Log
    await writeAuditLog(giveawayId, campaign.title, "Winner Approved", {
      telegramId: campaign.winnerId,
      number: campaign.winnerNumber,
      amount: prizeAmt
    });

    return res.json({ success: true, message: "Winner approved! Wallet credited and notification sent successfully." });

  } catch (err: any) {
    console.error("Approve winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to approve winner" });
  }
});

// Reject Winner (Reject drawn winner, clear winner fields)
router.post("/reject-winner", async (req: any, res: any) => {
  try {
    const { giveawayId, reason } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    if (!campaign.winnerId) {
      return res.status(400).json({ success: false, error: "No winner drawn to reject." });
    }

    const winnerId = campaign.winnerId;

    // Update entries to Rejected
    const batch = writeBatch(db);
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerId}`), {
      status: "Rejected",
      paymentStatus: "Rejected",
      rejectionReason: reason || "Verification failed"
    });
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${campaign.winnerNumber}`), {
      status: "Rejected",
      paymentStatus: "Rejected",
      rejectionReason: reason || "Verification failed"
    });
    await batch.commit();

    // Update campaign document to reflect rejection
    await updateDoc(campaignDocRef, {
      winnerStatus: "Rejected",
    });

    // Send Rejection Bot message
    const botMsg = `❌ <b>Your Lucky Number Giveaway entry has been rejected.</b>\n\n` +
      `Campaign: <b>${campaign.title}</b>\n` +
      `Reason: <i>${reason || "Violation of campaign rules / verification failed."}</i>`;
    await sendTgMessage(String(winnerId), botMsg);

    // Write Audit Log
    await writeAuditLog(giveawayId, campaign.title, "Winner Rejected", {
      telegramId: winnerId,
      reason
    });

    return res.json({ success: true, message: "Winner successfully rejected." });

  } catch (err: any) {
    console.error("Reject winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reject winner" });
  }
});

// Redraw Winner (Picks a different random Confirmed participant)
router.post("/redraw-winner", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    const oldWinnerId = campaign.winnerId;

    // If there was a previous winner, mark their entry as Confirmed again (if they weren't rejected)
    if (oldWinnerId && campaign.winnerStatus !== "Rejected") {
      const batch = writeBatch(db);
      batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${oldWinnerId}`), { status: "Confirmed" });
      batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${campaign.winnerNumber}`), { status: "Confirmed" });
      await batch.commit();
    }

    // Fetch all confirmed entries EXCEPT the old winner (if they were rejected)
    const qEntries = query(
      collection(db, "lucky_number_entries"),
      where("campaignId", "==", giveawayId),
      where("status", "==", "Confirmed")
    );
    const entriesSnap = await getDocs(qEntries);
    const entries = entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(e => e.telegramId !== oldWinnerId);

    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No other confirmed entries found to redraw a winner." });
    }

    // Pick new random winner
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerEntry = entries[randomIndex];

    // Save winner details as Pending verification in campaign document
    await updateDoc(campaignDocRef, {
      winnerId: winnerEntry.telegramId,
      winnerNumber: winnerEntry.selectedNumber,
      winnerName: winnerEntry.firstName || "Anonymous User",
      winnerUsername: winnerEntry.username || "",
      winnerStatus: "Pending"
    });

    // Update individual entry status to Winner
    const batch = writeBatch(db);
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerEntry.telegramId}`), {
      status: "Winner",
      drawConfirmedAt: new Date().toISOString()
    });
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${winnerEntry.selectedNumber}`), {
      status: "Winner",
      drawConfirmedAt: new Date().toISOString()
    });
    await batch.commit();

    // Write Audit Log
    await writeAuditLog(giveawayId, campaign.title, "Winner Redrawn", {
      oldWinnerTelegramId: oldWinnerId,
      newWinnerTelegramId: winnerEntry.telegramId,
      number: winnerEntry.selectedNumber
    });

    return res.json({
      success: true,
      message: "Winner redrawn successfully!",
      winner: {
        telegramId: winnerEntry.telegramId,
        number: winnerEntry.selectedNumber,
        name: winnerEntry.firstName,
        username: winnerEntry.username
      }
    });

  } catch (err: any) {
    console.error("Redraw winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to redraw winner" });
  }
});

// Reset Campaign (Clear winner data, put everyone back to Confirmed)
router.post("/reset-giveaway", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();

    // Reset entries back to Confirmed
    const entriesQuery = query(collection(db, "lucky_number_entries"), where("campaignId", "==", giveawayId));
    const entriesSnap = await getDocs(entriesQuery);
    const batch = writeBatch(db);

    for (const docSnap of entriesSnap.docs) {
      const entry = docSnap.data();
      if (entry.status !== "PendingAd") {
        batch.update(doc(db, "lucky_number_entries", docSnap.id), {
          status: "Confirmed",
          rewardAmount: 0,
          paymentStatus: "Pending"
        });
      }
    }

    // Reset campaign state back to Live
    batch.update(campaignDocRef, {
      status: "Live",
      winnersDrawn: false,
      winnerId: null,
      winnerNumber: null,
      winnerName: null,
      winnerUsername: null,
      winnerStatus: null,
    });

    await batch.commit();

    // Audit Log
    await writeAuditLog(giveawayId, campaign.title, "Giveaway Reset", {
      previousStatus: campaign.status
    });

    return res.json({
      success: true,
      message: "Lucky Board successfully reset! All winner states cleared back to Confirmed."
    });

  } catch (err: any) {
    console.error("Reset campaign error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reset campaign" });
  }
});

// Client Log Dispatcher
router.post("/log-action", async (req: any, res: any) => {
  try {
    const { giveawayId, giveawayTitle, action, details } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: "Missing action to log" });
    }

    await writeAuditLog(giveawayId || "general", giveawayTitle || "System", action, details || {});
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error writing log action:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch Audit Logs
router.get("/audit-logs/:giveawayId", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.params;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const q = query(collection(db, "lucky_number_audit_logs"), where("giveawayId", "==", giveawayId));
    const snap = await getDocs(q);
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ success: true, logs });
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Detailed Analytics
router.get("/analytics/:giveawayId", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.params;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const campaignSnap = await getDoc(doc(db, "lucky_number_campaigns", giveawayId));
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();

    // Fetch entries
    const qEntries = query(collection(db, "lucky_number_entries"), where("campaignId", "==", giveawayId));
    const entriesSnap = await getDocs(qEntries);
    const entries = entriesSnap.docs.map(d => d.data());

    // Analytics breakdowns (only count user entries to avoid duplicates)
    const userEntries = entries.filter((e: any) => e.status !== "PendingAd" && entriesSnap.docs.find(d => d.id.includes("user_")));

    const totalEntries = entries.filter(e => e.status !== "PendingAd").length / 2; // division because of duplicates
    const confirmedEntries = entries.filter(e => e.status === "Confirmed").length / 2;
    const pendingAdEntries = entries.filter(e => e.status === "PendingAd").length / 2;
    const winnerEntries = entries.filter(e => e.status === "Winner").length / 2;
    const approvedEntries = entries.filter(e => e.status === "Winner" && e.paymentStatus === "Paid").length / 2;
    const rejectedEntries = entries.filter(e => e.status === "Rejected").length / 2;

    const distributedBudget = approvedEntries * Number(campaign.prizeAmount || 100);
    const totalBudget = Number(campaign.totalWinners || 10) * Number(campaign.prizeAmount || 100);
    const remainingBudget = Math.max(0, totalBudget - distributedBudget);

    const usersSnap = await getDocs(collection(db, "users"));
    const totalSystemUsers = Math.max(1, usersSnap.size);
    const participationRate = Number(((confirmedEntries / totalSystemUsers) * 100).toFixed(1));

    return res.json({
      success: true,
      analytics: {
        totalEntries,
        confirmedEntries,
        pendingAdEntries,
        winnerEntries,
        approvedEntries,
        rejectedEntries,
        remainingBudget,
        distributedBudget,
        participationRate
      }
    });

  } catch (err: any) {
    console.error("Analytics error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to retrieve analytics" });
  }
});

export default router;
