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
  Timestamp
} from "firebase/firestore";
import { parseInKolkata, getGiveawayTimingStatus } from "../lib/dateUtils";

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

// 2. Submit Entry to UPI Giveaway
router.post("/submit-entry", async (req: any, res: any) => {
  try {
    const { giveawayId, telegramId, username, firstName, upiId, qrUrl, qrPath } = req.body;
    
    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing giveawayId or telegramId" });
    }

    // Check if giveaway exists
    const giveawayDoc = await getDoc(doc(db, "upi_giveaways", giveawayId));
    if (!giveawayDoc.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway not found" });
    }

    const giveaway = giveawayDoc.data();
    
    // Validate status and dates using getGiveawayTimingStatus
    const timingStatus = getGiveawayTimingStatus({ id: giveawayDoc.id, ...giveaway });
    if (timingStatus.status !== "Active") {
      return res.status(400).json({ success: false, error: timingStatus.message });
    }

    // Check Duplicate Telegram ID & accounts for SAME giveaway (Always active to prevent multi-entries)
    const qTelegramId = query(
      collection(db, "upi_giveaway_entries"), 
      where("giveawayId", "==", giveawayId), 
      where("telegramId", "==", String(telegramId))
    );
    const snapTelegramId = await getDocs(qTelegramId);
    if (!snapTelegramId.empty) {
      return res.status(400).json({ success: false, error: "Multiple entries are not allowed! You have already submitted an entry for this giveaway." });
    }

    if (username) {
      const qUsername = query(
        collection(db, "upi_giveaway_entries"),
        where("giveawayId", "==", giveawayId),
        where("username", "==", String(username))
      );
      const snapUsername = await getDocs(qUsername);
      if (!snapUsername.empty) {
        return res.status(400).json({ success: false, error: "Duplicate Telegram account detected! An entry with this Telegram username is already registered." });
      }
    }

    // Check if UPI ID is already used to flag warnings
    let isDuplicateUpi = false;
    if (upiId && upiId.trim()) {
      const qUpi = query(
        collection(db, "upi_giveaway_entries"),
        where("giveawayId", "==", giveawayId),
        where("upiId", "==", upiId.trim())
      );
      const snapUpi = await getDocs(qUpi);
      if (!snapUpi.empty) {
        isDuplicateUpi = true;
      }
    }

    const userDocRef = doc(db, "users", String(telegramId));
    const userDoc = await getDoc(userDocRef);
    const isSb = userDoc.exists() && userDoc.data()?.shadowBanned === true;

    // Store entry
    const entryId = `${giveawayId}_${telegramId}`;
    const entryData = {
      giveawayId,
      telegramId: String(telegramId),
      username: username || "",
      firstName: firstName || "",
      upiId: upiId || "",
      qrUrl: qrUrl || "",
      qrPath: qrPath || "",
      entryTime: new Date().toISOString(),
      status: "Pending", // Pending, Winner, Not Selected, Rejected
      rewardAmount: 0,
      paymentStatus: "Pending", // Pending, Paid, Rejected
      isDuplicateUpi,
      shadow_banned: isSb
    };

    await setDoc(doc(db, "upi_giveaway_entries", entryId), entryData);

    // Increase Trust Score for Giveaway Participation (+5)
    adjustTrustScore(String(telegramId), 5, "Giveaway Participation").catch(() => {});

    // Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Entry Submitted", {
      telegramId: String(telegramId),
      username,
      firstName,
      isDuplicateUpi
    });

    // Send confirmation bot message
    const messageText = `✅ <b>Your UPI Giveaway entry has been received successfully.</b>\n\n` +
      `Giveaway: <b>${giveaway.title}</b>\n` +
      `Status: <b>Enrolled 🍀</b>\n\n` +
      `Please wait for the live results. If you are randomly drawn as a winner, we will notify you automatically! Good luck! 🍀`;
    
    await sendTgMessage(String(telegramId), messageText);

    return res.json({ success: true, message: "Entry submitted successfully!" });

  } catch (err: any) {
    console.error("UPI Giveaway entry error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to submit entry" });
  }
});

// 3. Create or Update Giveaway Campaign
router.post("/save-giveaway", async (req: any, res: any) => {
  try {
    const { id, title, description, bannerUrl, totalBudget, totalWinners, minReward, maxReward, startDate, endDate, status, entryRules, autoPostChannel } = req.body;
    
    if (!title || !bannerUrl || !totalBudget || !totalWinners || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "Missing required giveaway configurations" });
    }

    const giveawayId = id || `giveaway_${Date.now()}`;
    const isNew = !id;

    // Check constraints
    if (minReward * totalWinners > totalBudget) {
      return res.status(400).json({ success: false, error: `Budget is too low! ₹${totalBudget} budget is insufficient for ${totalWinners} winners with ₹${minReward} minimum payout each. Minimum budget required is ₹${minReward * totalWinners}.` });
    }

    const giveawayData = {
      title,
      description: description || "",
      bannerUrl,
      totalBudget: Number(totalBudget),
      totalWinners: Number(totalWinners),
      minReward: Number(minReward),
      maxReward: Number(maxReward),
      startDate: Timestamp.fromDate(parseInKolkata(startDate)),
      endDate: Timestamp.fromDate(parseInKolkata(endDate)),
      status: status || "Draft",
      entryRules: entryRules || {
        telegramLoginRequired: true,
        channelVerificationRequired: true,
        groupVerificationRequired: true,
        oneEntryPerTelegramAccount: true,
        allowUpiId: true,
        allowQrUpload: true,
        warnDuplicateUpi: true
      },
      createdAt: new Date().toISOString(),
      winnersDrawn: false,
      previewWinners: []
    };

    // If updating, preserve existing draw outcomes
    if (!isNew) {
      const existingDoc = await getDoc(doc(db, "upi_giveaways", giveawayId));
      if (existingDoc.exists()) {
        const exData = existingDoc.data();
        giveawayData.createdAt = exData.createdAt || giveawayData.createdAt;
        giveawayData.winnersDrawn = exData.winnersDrawn || false;
        giveawayData.previewWinners = exData.previewWinners || [];
      }
    }

    await setDoc(doc(db, "upi_giveaways", giveawayId), giveawayData, { merge: true });

    // Write Audit Log
    await writeAuditLog(giveawayId, title, isNew ? "Giveaway Created" : "Giveaway Updated", giveawayData);

    // Auto post to channel if requested and status is "Live"
    let channelPostSuccess = false;
    if (autoPostChannel && status === "Live") {
      channelPostSuccess = await postGiveawayToChannel(giveawayId, title, description, bannerUrl, Number(totalBudget), Number(totalWinners));
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

// 4. Generate Winner Preview (Temporary, unlimited regeneration)
router.post("/preview-winners", async (req: any, res: any) => {
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
    if (giveaway.winnersDrawn) {
      return res.status(400).json({ success: false, error: "Winners have already been locked and confirmed for this giveaway!" });
    }

    // Fetch all entries that are NOT explicitly rejected
    const entriesQuery = query(collection(db, "upi_giveaway_entries"), where("giveawayId", "==", giveawayId));
    const entriesSnap = await getDocs(entriesQuery);
    const entries = entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter((e: any) => e.status !== "Rejected");

    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No entries found to pick winners from." });
    }

    const totalWinnersToSelect = Math.min(giveaway.totalWinners, entries.length);
    const totalBudget = giveaway.totalBudget;
    const minReward = giveaway.minReward;
    const maxReward = giveaway.maxReward;

    // Shuffle entries using standard Fisher-Yates
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedWinners = shuffled.slice(0, totalWinnersToSelect);
    let remainingBudget = totalBudget;
    const previewList: any[] = [];

    // Assign rewards with dynamic recalculation & bounds protection
    for (let i = 0; i < selectedWinners.length; i++) {
      const winner = selectedWinners[i];
      const positionsLeft = selectedWinners.length - i;

      // Ensure minimum safety for future winners
      const reserveForOthers = (positionsLeft - 1) * minReward;
      const maxAllowedByBudget = remainingBudget - reserveForOthers;

      const upperLimit = Math.min(maxReward, maxAllowedByBudget);
      const lowerLimit = Math.min(minReward, upperLimit);

      let reward = minReward;
      if (upperLimit > lowerLimit) {
        reward = Math.floor(Math.random() * (upperLimit - lowerLimit + 1)) + lowerLimit;
      } else {
        reward = lowerLimit;
      }

      remainingBudget -= reward;
      previewList.push({
        id: winner.id,
        telegramId: winner.telegramId,
        username: winner.username,
        firstName: winner.firstName,
        upiId: winner.upiId,
        qrUrl: winner.qrUrl,
        entryTime: winner.entryTime,
        rewardAmount: reward,
        isDuplicateUpi: winner.isDuplicateUpi || false
      });
    }

    // Save temporary preview winners list to giveaway document
    await updateDoc(giveawayDocRef, {
      previewWinners: previewList,
      status: "Drawing Winners"
    });

    // Write Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Preview Generated", {
      winnersCount: previewList.length,
      totalDistributed: totalBudget - remainingBudget,
      remainingBudget
    });

    return res.json({
      success: true,
      message: "Preview winners list generated!",
      winners: previewList
    });

  } catch (err: any) {
    console.error("Preview winners error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to generate winners preview" });
  }
});

// 5. Confirm Winners Permanently
router.post("/confirm-winners", async (req: any, res: any) => {
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
    if (giveaway.winnersDrawn) {
      return res.status(400).json({ success: false, error: "Winners have already been confirmed and locked." });
    }

    const previewList = giveaway.previewWinners || [];
    if (previewList.length === 0) {
      return res.status(400).json({ success: false, error: "No winner preview has been generated yet. Please generate a preview first." });
    }

    // Save winner statuses to entry collection
    const batch = writeBatch(db);

    // Retrieve all entries to mark non-winners
    const entriesQuery = query(collection(db, "upi_giveaway_entries"), where("giveawayId", "==", giveawayId));
    const entriesSnap = await getDocs(entriesQuery);
    const allEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const winnerIds = new Set(previewList.map((w: any) => w.id));

    // Update each entry
    for (const entry of allEntries) {
      if (entry.status === "Rejected") continue; // keep rejected

      const entryRef = doc(db, "upi_giveaway_entries", entry.id);
      if (winnerIds.has(entry.id)) {
        const winDetails = previewList.find((w: any) => w.id === entry.id);
        batch.update(entryRef, {
          status: "Winner",
          rewardAmount: Number(winDetails.rewardAmount),
          paymentStatus: "Pending",
          drawConfirmedAt: new Date().toISOString()
        });
      } else {
        batch.update(entryRef, {
          status: "Not Selected",
          rewardAmount: 0
        });
      }
    }

    // Set Giveaway state as Completed
    batch.update(giveawayDocRef, {
      status: "Completed",
      winnersDrawn: true
    });

    await batch.commit();

    // Write Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Winners Confirmed", {
      winnersCount: previewList.length,
      winners: previewList.map((w: any) => ({ name: w.firstName, reward: w.rewardAmount }))
    });

    // Notify Winners Automatically
    for (const winner of previewList) {
      const messageText = `🏆 <b>CONGRATULATIONS! You Won!</b> 🏆\n\n` +
        `You have been drawn as a lucky winner of <b>${giveaway.title}</b>!\n\n` +
        `💰 Winning Amount: <b>₹${winner.rewardAmount}</b>\n` +
        `🎁 Payout Method: <b>UPI / QR</b>\n\n` +
        `Our team is verifying and processing the payment. You will receive a direct notification once the reward is approved! Thank you for participating. 🎉`;
      
      await sendTgMessage(winner.telegramId, messageText);
    }

    return res.json({
      success: true,
      message: `Winners successfully locked & confirmed! ${previewList.length} winner notifications dispatched via bot.`
    });

  } catch (err: any) {
    console.error("Confirm winners error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to confirm winners list" });
  }
});

// 6. Reset Draw & Re-Open Giveaway
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

    // Reset entries back to Pending
    const entriesQuery = query(collection(db, "upi_giveaway_entries"), where("giveawayId", "==", giveawayId));
    const entriesSnap = await getDocs(entriesQuery);
    const batch = writeBatch(db);

    for (const docSnap of entriesSnap.docs) {
      batch.update(doc(db, "upi_giveaway_entries", docSnap.id), {
        status: "Pending",
        rewardAmount: 0,
        paymentStatus: "Pending"
      });
    }

    // Reset giveaway state back to Live
    batch.update(giveawayDocRef, {
      status: "Live",
      winnersDrawn: false,
      previewWinners: []
    });

    await batch.commit();

    // Audit Log
    await writeAuditLog(giveawayId, giveaway.title, "Giveaway Reset", {
      previousStatus: giveaway.status
    });

    return res.json({
      success: true,
      message: "Giveaway successfully reset! All entry states cleared back to Pending."
    });

  } catch (err: any) {
    console.error("Reset giveaway error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reset giveaway" });
  }
});

// 7. Mark Winner as Paid (Approve Payment)
router.post("/mark-as-paid", async (req: any, res: any) => {
  try {
    const { entryId } = req.body;
    if (!entryId) {
      return res.status(400).json({ success: false, error: "Missing entryId" });
    }

    const entryRef = doc(db, "upi_giveaway_entries", entryId);
    const entrySnap = await getDoc(entryRef);
    if (!entrySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway entry not found" });
    }

    const entry = entrySnap.data();
    if (entry.status !== "Winner") {
      return res.status(400).json({ success: false, error: "This entry is not a selected winner." });
    }

    if (entry.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, error: "This winner has already been marked as paid." });
    }

    const rawRewardAmount = Number(entry.rewardAmount) || 0;

    // Evaluate Giveaway Reward via Economy Protection & Smart Reward Engine
    const economyEval = await evaluateReward(String(entry.telegramId), rawRewardAmount, "giveaway");
    if (!economyEval.allowed) {
      return res.status(400).json({ success: false, error: economyEval.message || "Daily budget limit reached. Cannot approve payment." });
    }

    const finalRewardAmount = economyEval.finalAmount;
    const isPendingGiveaway = economyEval.isPending;

    // Update payment status
    await updateDoc(entryRef, {
      paymentStatus: isPendingGiveaway ? "Pending Review" : "Paid",
      rewardAmount: finalRewardAmount,
      paidAt: new Date().toISOString()
    });

    if (isPendingGiveaway) {
      return res.json({
        success: true,
        message: "⏳ This payment has been placed in Pending Review under the Economy Protection check pipeline."
      });
    }

    const isSb = entry.shadow_banned === true;
    if (isSb) {
      await addDoc(collection(db, "shadow_blocked_rewards"), {
        userId: String(entry.telegramId),
        username: entry.username || entry.firstName || "no_username",
        amount: Number(entry.rewardAmount),
        type: "upi_giveaway_reward",
        createdAt: new Date().toISOString()
      });
    }

    const giveawaySnap = await getDoc(doc(db, "upi_giveaways", entry.giveawayId));
    const giveawayTitle = giveawaySnap.exists() ? giveawaySnap.data()?.title : "UPI Giveaway";

    // Write Audit Log
    await writeAuditLog(entry.giveawayId, giveawayTitle, "Payment Approved", {
      entryId,
      firstName: entry.firstName,
      telegramId: entry.telegramId,
      rewardAmount: entry.rewardAmount
    });

    // Send success bot message as strictly specified:
    const messageText = `🎉 <b>Congratulations!</b>\n\n` +
      `Your RoyShare UPI Giveaway reward has been approved.\n\n` +
      `<b>Winning Amount:</b>\n` +
      `₹${entry.rewardAmount}\n\n` +
      `Thank you for participating!`;
    
    await sendTgMessage(entry.telegramId, messageText);

    return res.json({ success: true, message: "Winner marked as Paid and notified!" });

  } catch (err: any) {
    console.error("UPI Giveaway payment status update error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to update payment status" });
  }
});

// 8. Reject Payment / Entry
router.post("/reject-payment", async (req: any, res: any) => {
  try {
    const { entryId, reason } = req.body;
    if (!entryId) {
      return res.status(400).json({ success: false, error: "Missing entryId" });
    }

    const entryRef = doc(db, "upi_giveaway_entries", entryId);
    const entrySnap = await getDoc(entryRef);
    if (!entrySnap.exists()) {
      return res.status(404).json({ success: false, error: "Giveaway entry not found" });
    }

    const entry = entrySnap.data();

    // Update status to Rejected
    await updateDoc(entryRef, {
      status: "Rejected",
      paymentStatus: "Rejected",
      rejectionReason: reason || "Violation of rules / suspicious duplicate entry"
    });

    const giveawaySnap = await getDoc(doc(db, "upi_giveaways", entry.giveawayId));
    const giveawayTitle = giveawaySnap.exists() ? giveawaySnap.data()?.title : "UPI Giveaway";

    // Write Audit Log
    await writeAuditLog(entry.giveawayId, giveawayTitle, "Payment Rejected", {
      entryId,
      firstName: entry.firstName,
      telegramId: entry.telegramId,
      reason: reason || "Suspicious / Duplicate entry rules validation failure"
    });

    // Send Bot Rejection message
    const messageText = `❌ <b>Your entry has been rejected.</b>\n\n` +
      `Giveaway: <b>${giveawayTitle}</b>\n` +
      `Reason: <i>${reason || "Rule violations or suspicious activities detected."}</i>\n\n` +
      `If you think this is a mistake, please reach out to Customer Support.`;
    
    await sendTgMessage(entry.telegramId, messageText);

    return res.json({ success: true, message: "Winner entry rejected successfully." });

  } catch (err: any) {
    console.error("UPI Giveaway reject error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reject entry." });
  }
});

// 9. Client Log Dispatcher (For actions like Export Downloaded)
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

// 10. Fetch Audit Logs for Admin Manager
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

// 11. Detailed Analytics
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
    const verifiedEntries = entries.filter(e => e.status !== "Rejected").length;
    const rejectedEntries = entries.filter(e => e.status === "Rejected").length;

    const previewWinnersCount = giveaway.previewWinners?.length || 0;
    const confirmedWinnersCount = entries.filter(e => e.status === "Winner").length;
    const paidWinnersCount = entries.filter(e => e.status === "Winner" && e.paymentStatus === "Paid").length;

    // Budget math
    let distributedBudget = 0;
    if (giveaway.winnersDrawn) {
      // confirmed
      distributedBudget = entries
        .filter(e => e.status === "Winner")
        .reduce((sum, w) => sum + Number(w.rewardAmount || 0), 0);
    } else {
      // previewed
      distributedBudget = (giveaway.previewWinners || [])
        .reduce((sum: number, w: any) => sum + Number(w.rewardAmount || 0), 0);
    }

    const remainingBudget = Math.max(0, giveaway.totalBudget - distributedBudget);

    // Fetch total system users to calculate actual participation rate
    const usersSnap = await getDocs(collection(db, "users"));
    const totalSystemUsers = Math.max(1, usersSnap.size);

    // Rate = totalEntries / totalSystemUsers
    const participationRate = Number(((totalEntries / totalSystemUsers) * 100).toFixed(1));

    return res.json({
      success: true,
      analytics: {
        totalEntries,
        verifiedEntries,
        rejectedEntries,
        previewWinners: previewWinnersCount,
        confirmedWinners: confirmedWinnersCount,
        paidWinners: paidWinnersCount,
        remainingBudget,
        distributedBudget,
        participationRate
      }
    });

  } catch (err: any) {
    console.error("UPI Giveaway analytics error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to retrieve analytics" });
  }
});

export default router;
