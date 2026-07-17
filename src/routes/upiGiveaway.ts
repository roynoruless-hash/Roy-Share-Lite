import express from "express";
import fs from "fs";
import path from "path";
import { getStorage } from "firebase-admin/storage";
import { db } from "../lib/firebase";
import { adjustTrustScore } from "../lib/trustScore";
import { evaluateReward } from "../lib/economy";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  runTransaction
} from "firebase/firestore";
import { parseInKolkata, getGiveawayStatus } from "../lib/dateUtils";

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
const postGiveawayToChannel = async (giveawayId: string, title: string, description: string, bannerUrl: string, totalBudget: number, totalWinners: number) => {
  const config = await getTelegramConfig();
  const botToken = config?.botToken;
  let channelId = config?.channelUsername;
  const botUsername = (config?.botUsername || "Roysharearn_bot").replace("@", "");

  if (!botToken || !channelId) {
    console.warn("Bot token or Channel username not configured. Skipping channel post.");
    return false;
  }

  // Ensure channelId starts with @ if it's a text username and doesn't start with it
  if (typeof channelId === "string" && !channelId.startsWith("@") && !channelId.startsWith("-100") && isNaN(Number(channelId))) {
    channelId = `@${channelId}`;
  }

  try {
    const caption = `🔥 <b>NEW UPI GIVEAWAY CAMPAIGN!</b> 🔥\n\n` +
      `🏆 <b>${title}</b>\n\n` +
      `${description || ""}\n\n` +
      `💰 Total Budget: <b>₹${totalBudget}</b>\n` +
      `🎁 Lucky Winners: <b>${totalWinners} Winners</b>\n\n` +
      `👇 Click the button below to participate inside our Telegram Mini App!`;

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
                "text": "🎁 Participate Now",
                "url": `https://t.me/${botUsername}?startapp=upi_${giveawayId}`
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
    await setDoc(doc(db, "upi_giveaway_audit_logs", logId), logData);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

// 1. File Upload with Firebase Storage and Local File Fallback
router.post("/upload", express.json({ limit: "15mb" }), async (req: any, res: any) => {
  try {
    const { fileName, fileType, base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: "No file content provided" });
    }

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = path.extname(fileName) || `.${fileType?.split("/")[1] || "png"}`;
    const uniqueFileName = `giveaway_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Try Firebase Storage first
    try {
      const bucket = getStorage().bucket();
      if (bucket) {
        const fileRef = bucket.file(`upi_giveaway/${uniqueFileName}`);
        await fileRef.save(buffer, {
          metadata: {
            contentType: fileType || "image/png"
          },
          public: true
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/upi_giveaway/${uniqueFileName}`;
        return res.json({
          success: true,
          url: publicUrl,
          name: fileName
        });
      }
    } catch (storageError: any) {
      console.warn("Firebase Storage upload failed, falling back to local files:", storageError.message);
    }

    // Fallback: Local upload
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
    console.error("UPI Giveaway upload error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to upload file" });
  }
});

// Enroll User in Lucky Draw Campaign
router.post("/lucky-draw/enroll", async (req: any, res: any) => {
  try {
    const { campaignId, telegramId } = req.body;
    console.log(`[LuckyDraw Enroll API] Received request for campaignId: ${campaignId}, telegramId: ${telegramId}`);

    if (!campaignId || !telegramId) {
      console.log(`[LuckyDraw Enroll API] Error: Missing campaignId or telegramId`);
      return res.status(400).json({ success: false, error: "Missing campaignId or telegramId" });
    }

    // 1. Fetch Lucky Draw Campaign
    const campaignDocRef = doc(db, "lucky_draws", campaignId);
    const campaignDoc = await getDoc(campaignDocRef);
    if (!campaignDoc.exists()) {
      console.log(`[LuckyDraw Enroll API] Error: Lucky Draw Campaign not found for ID: ${campaignId}`);
      return res.status(404).json({ success: false, error: "Lucky Draw campaign not found." });
    }

    const campaign = campaignDoc.data();

    // 2. Validate using getGiveawayStatus
    const currentStatus = getGiveawayStatus({ id: campaignId, ...campaign });
    console.log(`[LuckyDraw Enroll API] Campaign current status evaluated as: ${currentStatus}`);
    if (currentStatus !== "LIVE") {
      console.log(`[LuckyDraw Enroll API] Error: Lucky Draw Campaign is not active. Status: ${currentStatus}`);
      return res.status(400).json({ success: false, error: "This Lucky Draw campaign is not live or has already closed." });
    }

    // 3. Fetch User
    const userDocRef = doc(db, "users", String(telegramId));
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.log(`[LuckyDraw Enroll API] Error: User not found in database for Telegram ID: ${telegramId}`);
      return res.status(404).json({ success: false, error: "User profile not found. Please log in through Telegram." });
    }

    const u = userDoc.data();
    console.log(`[LuckyDraw Enroll API] Found user profile:`, {
      telegramId,
      username: u.username,
      firstName: u.firstName,
      membershipVerified: u.membershipVerified,
      referrals: u.referrals || 0,
      tasksCompleted: u.tasksCompleted || 0,
    });

    // 4. Verify Eligibility Rules
    const rules = campaign.rules || {};
    const reasons: string[] = [];

    // Rule: Require Telegram Channel Membership
    if (rules.requireTgChannel && !u.membershipVerified) {
      console.log(`[LuckyDraw Enroll API] Rule failed: requireTgChannel`);
      reasons.push("You must join our official Telegram Channel to participate.");
    }

    // Rule: Require Telegram Group Membership
    if (rules.requireTgGroup && !u.membershipVerified) {
      console.log(`[LuckyDraw Enroll API] Rule failed: requireTgGroup`);
      reasons.push("You must join our official Telegram Group to participate.");
    }

    // Rule: Minimum Referrals
    const minRefs = Number(rules.minReferrals || 0);
    const userRefs = Number(u.referrals || 0);
    if (minRefs > 0 && userRefs < minRefs) {
      console.log(`[LuckyDraw Enroll API] Rule failed: minReferrals. Required: ${minRefs}, Has: ${userRefs}`);
      reasons.push(`Minimum of ${minRefs} referrals required (you have ${userRefs}).`);
    }

    // Rule: Minimum Tasks Completed
    const minTasks = Number(rules.minRewardTasks || 0);
    const userTasks = Number(u.tasksCompleted || 0);
    if (minTasks > 0 && userTasks < minTasks) {
      console.log(`[LuckyDraw Enroll API] Rule failed: minRewardTasks. Required: ${minTasks}, Has: ${userTasks}`);
      reasons.push(`Minimum of ${minTasks} reward tasks completed required (you have ${userTasks}).`);
    }

    // Rule: Account Verification
    if (rules.requireAccountVerification && !u.verified) {
      console.log(`[LuckyDraw Enroll API] Rule failed: requireAccountVerification`);
      reasons.push("Your account must be fully verified by our team.");
    }

    // Rule: Wallet Connected
    if (rules.requireWalletConnected && !(u.walletAddress || u.isWalletConnected)) {
      console.log(`[LuckyDraw Enroll API] Rule failed: requireWalletConnected`);
      reasons.push("You must connect your withdrawal wallet address.");
    }

    // Rule: Mobile Verified
    if (rules.requireMobileVerification && !(u.phone || u.isMobileVerified)) {
      console.log(`[LuckyDraw Enroll API] Rule failed: requireMobileVerification`);
      reasons.push("Your phone number must be verified.");
    }

    // Rule: Email Verified
    if (rules.requireEmailVerification && !(u.email || u.isEmailVerified)) {
      console.log(`[LuckyDraw Enroll API] Rule failed: requireEmailVerification`);
      reasons.push("Your email address must be verified.");
    }

    if (reasons.length > 0) {
      console.log(`[LuckyDraw Enroll API] User is not eligible. Reasons:`, reasons);
      return res.status(400).json({ success: false, error: reasons.join(" ") });
    }

    // 5. Register participant
    const participantId = `${campaignId}_${telegramId}`;
    const participantRef = doc(db, "lucky_draw_participants", participantId);
    
    await setDoc(participantRef, {
      campaignId,
      telegramId: String(telegramId),
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.enteredName || "Anonymous User",
      username: u.username || "no_username",
      joinedAt: new Date().toISOString(),
      referralCount: userRefs,
      rewardTasksCompleted: userTasks,
      isVerified: !!u.verified,
      isWalletConnected: !!(u.walletAddress || u.isWalletConnected),
      isMobileVerified: !!(u.phone || u.isMobileVerified),
      isEmailVerified: !!(u.email || u.isEmailVerified),
      isEligible: true,
      eligibilityReasons: []
    });

    console.log(`[LuckyDraw Enroll API] Successfully enrolled user in Lucky Draw. Participant doc created.`);

    // Send Telegram Confirmation Message
    const messageText = `🎉 <b>You have successfully joined the Lucky Draw!</b>\n\n` +
      `Campaign: <b>${campaign.title}</b>\n` +
      `Status: <b>Enrolled 🍀</b>\n\n` +
      `We will notify you instantly if you are randomly selected as a winner! Good luck! 🍀`;
    
    await sendTgMessage(String(telegramId), messageText);

    return res.json({ success: true, message: "Successfully enrolled in this Lucky Draw!" });

  } catch (err: any) {
    console.error("[LuckyDraw Enroll API] Critical Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to enroll in Lucky Draw" });
  }
});

// 2. Lucky Number Giveaway: Reserve Number (Temporary Reservation)
router.post("/reserve-number", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId, username, firstName, selectedNumber } = req.body;
    
    if (!giveawayId || !telegramId || !selectedNumber) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const num = Number(selectedNumber);

    // Get giveaway details
    const giveawayDoc = await getDoc(doc(db, "upi_giveaways", giveawayId));
    if (!giveawayDoc.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawayDoc.data();
    const currentStatus = getGiveawayStatus({ id: giveawayDoc.id, ...giveaway });
    if (currentStatus !== "LIVE") {
      return res.status(400).json({ success: false, error: "This giveaway is not active or has already closed." });
    }

    // Verify selected number bounds
    const minNum = Number(giveaway.minNumber || 1);
    const maxNum = Number(giveaway.maxNumber || 100);
    if (num < minNum || num > maxNum) {
      return res.status(400).json({ success: false, error: `Invalid number. Choose between ${minNum} and ${maxNum}.` });
    }

    // Transaction to safely reserve the number and verify user duplicate check
    const result = await runTransaction(db, async (transaction) => {
      // Check if user already has an entry for this giveaway
      const userEntryRef = doc(db, "upi_giveaway_entries", `${giveawayId}_${telegramId}`);
      const userEntrySnap = await transaction.get(userEntryRef);
      if (userEntrySnap.exists()) {
        const uEntry = userEntrySnap.data();
        if (uEntry.status === "Confirmed" || uEntry.status === "Winner" || uEntry.status === "Approved") {
          throw new Error("You have already selected a number for this giveaway! One number per Telegram account only.");
        }
      }

      // Check if this specific number is already reserved by another user
      const entriesQuery = query(
        collection(db, "upi_giveaway_entries"),
        where("giveawayId", "==", giveawayId),
        where("selectedNumber", "==", num)
      );
      
      const entriesSnap = await getDocs(entriesQuery);
      for (const d of entriesSnap.docs) {
        const entry = d.data();
        // Ignore current user's own document
        if (entry.telegramId === String(telegramId)) continue;

        if (entry.status === "Confirmed" || entry.status === "Winner" || entry.status === "Approved" || entry.status === "Rejected") {
          throw new Error("This number has already been selected. Please choose another number.");
        }
        
        if (entry.status === "PendingAd") {
          // Check if PendingAd is active (less than 60s ago)
          const reservedAt = new Date(entry.reservedAt).getTime();
          const now = Date.now();
          if (now - reservedAt < 60000) {
            throw new Error("This number is temporarily locked by another user watching an ad. Please choose another number.");
          }
        }
      }

      // Number is available, reserve it
      transaction.set(userEntryRef, {
        giveawayId,
        telegramId: String(telegramId),
        username: username || "",
        firstName: firstName || "",
        selectedNumber: num,
        reservedAt: new Date().toISOString(),
        status: "PendingAd", // temporary reservation
      }, { merge: true });

      return { success: true };
    });

    return res.json(result);

  } catch (err: any) {
    console.error("Reserve number error:", err);
    return res.status(400).json({ success: false, error: err.message || "Failed to reserve number." });
  }
});

// 3. Confirm Number (Permanently confirmed after successful ad completion)
router.post("/confirm-number", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId } = req.body;

    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const entryId = `${giveawayId}_${telegramId}`;
    const entryRef = doc(db, "upi_giveaway_entries", entryId);
    const entrySnap = await getDoc(entryRef);

    if (!entrySnap.exists()) {
      return res.status(400).json({ success: false, error: "No pending reservation found. Please select a number first." });
    }

    const entry = entrySnap.data();
    if (entry.status !== "PendingAd") {
      return res.status(400).json({ success: false, error: "This reservation is already confirmed or invalid." });
    }

    // Verify it hasn't timed out (60 seconds)
    const reservedAt = new Date(entry.reservedAt).getTime();
    const now = Date.now();
    if (now - reservedAt > 60000) {
      // Delete old timed out reservation
      await deleteDoc(entryRef);
      return res.status(400).json({ success: false, error: "Your session timed out. Please choose your number again." });
    }

    // Confirm selection permanently
    await updateDoc(entryRef, {
      status: "Confirmed",
      entryTime: new Date().toISOString(),
    });

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

// 4. Release Number (If ad is closed or failed)
router.post("/release-number", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId } = req.body;

    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const entryId = `${giveawayId}_${telegramId}`;
    const entryRef = doc(db, "upi_giveaway_entries", entryId);
    const entrySnap = await getDoc(entryRef);

    if (entrySnap.exists()) {
      const entry = entrySnap.data();
      if (entry.status === "PendingAd") {
        await deleteDoc(entryRef);
        console.log(`[LuckyNumber] Released reservation for user ${telegramId} on number ${entry.selectedNumber}`);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Release number error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to release reservation" });
  }
});

// 5. Create or Update Lucky Number Giveaway Campaign
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
      endDate, 
      status,
      autoPostChannel
    } = req.body;
    
    if (!title || !bannerUrl || !prizeAmount || !totalWinners || !endDate || !numberRange) {
      return res.status(400).json({ success: false, error: "Missing required giveaway configurations" });
    }

    const giveawayId = id || `giveaway_${Date.now()}`;
    const isNew = !id;

    const minNum = numberRange === "Manual Range" ? Number(minNumber || 1) : 1;
    let maxNum = 100;
    if (numberRange === "1 to 50") maxNum = 50;
    else if (numberRange === "1 to 100") maxNum = 100;
    else if (numberRange === "1 to 200") maxNum = 200;
    else if (numberRange === "1 to 300") maxNum = 300;
    else if (numberRange === "1 to 500") maxNum = 500;
    else if (numberRange === "1 to 600") maxNum = 600;
    else if (numberRange === "Manual Range") maxNum = Number(maxNumber || 100);

    const totalBudget = Number(prizeAmount) * Number(totalWinners);

    const giveawayData: any = {
      title,
      description: description || "",
      bannerUrl,
      prizeAmount: Number(prizeAmount),
      totalBudget: totalBudget, // stored for backward compatibility
      totalWinners: Number(totalWinners),
      numberRange,
      minNumber: minNum,
      maxNumber: maxNum,
      adsgramType: adsType || "Reward", // for backward compatibility/Adsgram Settings
      adsType: adsType || "Reward",
      numberVisibility: numberVisibility || "Show Remaining Numbers",
      endDate: Timestamp.fromDate(parseInKolkata(endDate)),
      status: status || "Draft",
      createdAt: new Date().toISOString(),
      winnersDrawn: false,
    };

    // If updating, preserve existing draw outcomes
    if (!isNew) {
      const existingDoc = await getDoc(doc(db, "upi_giveaways", giveawayId));
      if (existingDoc.exists()) {
        const exData = existingDoc.data();
        giveawayData.createdAt = exData.createdAt || giveawayData.createdAt;
        giveawayData.winnersDrawn = exData.winnersDrawn !== undefined ? exData.winnersDrawn : false;
        giveawayData.winnerId = exData.winnerId || null;
        giveawayData.winnerNumber = exData.winnerNumber || null;
        giveawayData.winnerName = exData.winnerName || null;
        giveawayData.winnerUsername = exData.winnerUsername || null;
        giveawayData.winnerStatus = exData.winnerStatus || null;
      }
    }

    await setDoc(doc(db, "upi_giveaways", giveawayId), giveawayData, { merge: true });

    // Write Audit Log
    await writeAuditLog(giveawayId, title, isNew ? "Giveaway Created" : "Giveaway Updated", giveawayData);

    // Auto post to channel if requested and status is "Live"
    let channelPostSuccess = false;
    if (autoPostChannel && status === "Live") {
      channelPostSuccess = await postGiveawayToChannel(giveawayId, title, description, bannerUrl, totalBudget, Number(totalWinners));
    }

    return res.json({ 
      success: true, 
      id: giveawayId, 
      message: isNew ? "Giveaway created successfully!" : "Giveaway updated successfully!",
      channelPostSuccess
    });

  } catch (err: any) {
    console.error("Save giveaway error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to save giveaway." });
  }
});

// 6. Draw Winner (Select a random participant from Confirmed status)
router.post("/draw-winner", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const giveawayDocRef = doc(db, "upi_giveaways", giveawayId);
    const giveawaySnap = await getDoc(giveawayDocRef);
    if (!giveawaySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawaySnap.data();

    // Fetch all entries with status "Confirmed"
    const entriesQuery = query(
      collection(db, "upi_giveaway_entries"), 
      where("giveawayId", "==", giveawayId),
      where("status", "==", "Confirmed")
    );
    const entriesSnap = await getDocs(entriesQuery);
    const entries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No confirmed entries found to pick a winner from." });
    }

    // Pick a random confirmed entry
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerEntry = entries[randomIndex];

    // Save winner details as Pending verification in giveaway document
    await updateDoc(giveawayDocRef, {
      winnerId: winnerEntry.telegramId,
      winnerNumber: winnerEntry.selectedNumber,
      winnerName: winnerEntry.firstName || "Anonymous User",
      winnerUsername: winnerEntry.username || "",
      winnerStatus: "Pending",
      status: "Drawing Winners"
    });

    // Update individual entry status to Winner
    await updateDoc(doc(db, "upi_giveaway_entries", winnerEntry.id), {
      status: "Winner",
      drawConfirmedAt: new Date().toISOString()
    });

    // Write Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Winner Drawn", {
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

// 7. Approve Winner (Credit Wallet automatically, mark complete, notify)
router.post("/approve-winner", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const giveawayDocRef = doc(db, "upi_giveaways", giveawayId);
    const giveawaySnap = await getDoc(giveawayDocRef);
    if (!giveawaySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawaySnap.data();
    if (!giveaway.winnerId || giveaway.winnerStatus !== "Pending") {
      return res.status(400).json({ success: false, error: "No pending winner to approve." });
    }

    const prizeAmt = Number(giveaway.prizeAmount || 100);

    // 1. Transaction to Credit Wallet
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", String(giveaway.winnerId));
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error(`User profile for Telegram ID ${giveaway.winnerId} not found. Cannot credit wallet.`);
      }

      const userData = userSnap.data();
      const currentBalance = Number(userData.balance || 0);
      const newBalance = currentBalance + prizeAmt;

      // Recalculate available balance
      const fileEarnings = Number(userData.fileEarnings || 0);
      const linkEarnings = Number(userData.linkEarnings || 0);
      const referralEarnings = Number(userData.referralEarnings || 0);
      const bonusBalance = Number(userData.bonusBalance || 0);
      const rewardBalance = Number(userData.rewardBalance || 0);
      const withdrawnAmount = Number(userData.withdrawnAmount || userData.totalWithdrawn || 0);
      const pendingWithdrawals = Number(userData.pendingWithdrawals || 0);

      const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + newBalance - withdrawnAmount - pendingWithdrawals;

      // Update user wallet
      transaction.update(userRef, {
        balance: newBalance,
        availableBalance: availableBalance
      });

      // Log transaction to activityLogs
      const logRef = doc(collection(db, "activityLogs"));
      transaction.set(logRef, {
        adminId: "admin",
        targetUserId: String(giveaway.winnerId),
        action: "add_balance",
        amount: prizeAmt,
        reason: `Prize payout for Lucky Number Giveaway: ${giveaway.title}`,
        createdAt: new Date()
      });
    });

    // 2. Update Entry document
    const entryId = `${giveawayId}_${giveaway.winnerId}`;
    await updateDoc(doc(db, "upi_giveaway_entries", entryId), {
      status: "Winner",
      paymentStatus: "Paid",
      rewardAmount: prizeAmt,
      paidAt: new Date().toISOString()
    });

    // 3. Update giveaway document
    await updateDoc(giveawayDocRef, {
      winnerStatus: "Approved",
      status: "Completed",
      winnersDrawn: true
    });

    // 4. Send Bot confirmation message
    const botMsg = `🏆 <b>CONGRATULATIONS! You Won!</b> 🏆\n\n` +
      `You are the lucky winner of our Lucky Number Giveaway campaign: <b>${giveaway.title}</b>!\n\n` +
      `💰 Winning Amount: <b>₹${prizeAmt}</b>\n` +
      `🍀 Your Lucky Number: <b>${giveaway.winnerNumber}</b>\n\n` +
      `<b>₹${prizeAmt}</b> has been credited instantly to your Roy Share Wallet. You can withdraw it or check your balance anytime inside the app! 🎉`;
    
    await sendTgMessage(String(giveaway.winnerId), botMsg);

    // Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Winner Approved", {
      telegramId: giveaway.winnerId,
      number: giveaway.winnerNumber,
      amount: prizeAmt
    });

    return res.json({ success: true, message: "Winner approved! Wallet credited and notification sent successfully." });

  } catch (err: any) {
    console.error("Approve winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to approve winner" });
  }
});

// 8. Reject Winner (Reject drawn winner, clear winner fields)
router.post("/reject-winner", async (req: any, res: any) => {
  try {
    const { giveawayId, reason } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const giveawayDocRef = doc(db, "upi_giveaways", giveawayId);
    const giveawaySnap = await getDoc(giveawayDocRef);
    if (!giveawaySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawaySnap.data();
    if (!giveaway.winnerId) {
      return res.status(400).json({ success: false, error: "No winner drawn to reject." });
    }

    const winnerId = giveaway.winnerId;

    // Update entry to Rejected
    const entryId = `${giveawayId}_${winnerId}`;
    await updateDoc(doc(db, "upi_giveaway_entries", entryId), {
      status: "Rejected",
      paymentStatus: "Rejected",
      rejectionReason: reason || "Verification failed / Rule violation"
    });

    // Update giveaway document to reflect rejection
    await updateDoc(giveawayDocRef, {
      winnerStatus: "Rejected",
    });

    // Send Rejection Bot message
    const botMsg = `❌ <b>Your Lucky Number Giveaway entry has been rejected.</b>\n\n` +
      `Giveaway: <b>${giveaway.title}</b>\n` +
      `Reason: <i>${reason || "Violation of campaign rules / verification failed."}</i>`;
    await sendTgMessage(String(winnerId), botMsg);

    // Write Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Winner Rejected", {
      telegramId: winnerId,
      reason
    });

    return res.json({ success: true, message: "Winner successfully rejected." });

  } catch (err: any) {
    console.error("Reject winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reject winner" });
  }
});

// 9. Redraw Winner (Picks a different random Confirmed participant)
router.post("/redraw-winner", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const giveawayDocRef = doc(db, "upi_giveaways", giveawayId);
    const giveawaySnap = await getDoc(giveawayDocRef);
    if (!giveawaySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawaySnap.data();
    const oldWinnerId = giveaway.winnerId;

    // If there was a previous winner, mark their entry as Confirmed again (if they weren't rejected)
    // so they are put back in the pool, unless they were rejected.
    if (oldWinnerId && giveaway.winnerStatus !== "Rejected") {
      await updateDoc(doc(db, "upi_giveaway_entries", `${giveawayId}_${oldWinnerId}`), {
        status: "Confirmed"
      });
    }

    // Fetch all confirmed entries EXCEPT the old winner (if they were rejected)
    const qEntries = query(
      collection(db, "upi_giveaway_entries"),
      where("giveawayId", "==", giveawayId),
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

    // Save winner details as Pending verification in giveaway document
    await updateDoc(giveawayDocRef, {
      winnerId: winnerEntry.telegramId,
      winnerNumber: winnerEntry.selectedNumber,
      winnerName: winnerEntry.firstName || "Anonymous User",
      winnerUsername: winnerEntry.username || "",
      winnerStatus: "Pending"
    });

    // Update individual entry status to Winner
    await updateDoc(doc(db, "upi_giveaway_entries", winnerEntry.id), {
      status: "Winner",
      drawConfirmedAt: new Date().toISOString()
    });

    // Write Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Winner Redrawn", {
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

// 10. Reset Giveaway (Clear winner data, put everyone back to Confirmed)
router.post("/reset-giveaway", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.body;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const giveawayDocRef = doc(db, "upi_giveaways", giveawayId);
    const giveawaySnap = await getDoc(giveawayDocRef);
    if (!giveawaySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawaySnap.data();

    // Reset entries back to Confirmed
    const entriesQuery = query(collection(db, "upi_giveaway_entries"), where("giveawayId", "==", giveawayId));
    const entriesSnap = await getDocs(entriesQuery);
    const batch = writeBatch(db);

    for (const docSnap of entriesSnap.docs) {
      const entry = docSnap.data();
      if (entry.status !== "PendingAd") {
        batch.update(doc(db, "upi_giveaway_entries", docSnap.id), {
          status: "Confirmed",
          rewardAmount: 0,
          paymentStatus: "Pending"
        });
      }
    }

    // Reset giveaway state back to Live
    batch.update(giveawayDocRef, {
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
    await writeAuditLog(giveawayId, giveaway.title, "Giveaway Reset", {
      previousStatus: giveaway.status
    });

    return res.json({
      success: true,
      message: "Giveaway successfully reset! All winner states cleared back to Confirmed."
    });

  } catch (err: any) {
    console.error("Reset giveaway error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reset giveaway" });
  }
});

// 11. Client Log Dispatcher (For actions like Export Downloaded)
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

// 12. Fetch Audit Logs for Admin Manager
router.get("/audit-logs/:giveawayId", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.params;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const q = query(collection(db, "upi_giveaway_audit_logs"), where("giveawayId", "==", giveawayId));
    const snap = await getDocs(q);
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort descending by timestamp
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ success: true, logs });
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Detailed Analytics for Lucky Number Giveaway
router.get("/analytics/:giveawayId", async (req: any, res: any) => {
  try {
    const { giveawayId } = req.params;
    if (!giveawayId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId" });
    }

    const giveawaySnap = await getDoc(doc(db, "upi_giveaways", giveawayId));
    if (!giveawaySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawaySnap.data();

    // Fetch entries
    const entriesQuery = query(collection(db, "upi_giveaway_entries"), where("giveawayId", "==", giveawayId));
    const entriesSnap = await getDocs(entriesQuery);
    const entries = entriesSnap.docs.map(d => d.data());

    // Analytics breakdowns
    const totalEntries = entries.length;
    const confirmedEntries = entries.filter(e => e.status === "Confirmed").length;
    const pendingAdEntries = entries.filter(e => e.status === "PendingAd").length;
    const winnerEntries = entries.filter(e => e.status === "Winner").length;
    const approvedEntries = entries.filter(e => e.status === "Winner" && e.paymentStatus === "Paid").length;
    const rejectedEntries = entries.filter(e => e.status === "Rejected").length;

    // Budget math
    const distributedBudget = approvedEntries * Number(giveaway.prizeAmount || 100);
    const totalBudget = Number(giveaway.totalWinners || 10) * Number(giveaway.prizeAmount || 100);
    const remainingBudget = Math.max(0, totalBudget - distributedBudget);

    // Fetch total system users to calculate actual participation rate
    const usersSnap = await getDocs(collection(db, "users"));
    const totalSystemUsers = Math.max(1, usersSnap.size);

    // Rate = confirmedEntries / totalSystemUsers
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
    console.error("Giveaway analytics error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to retrieve analytics" });
  }
});

export default router;
