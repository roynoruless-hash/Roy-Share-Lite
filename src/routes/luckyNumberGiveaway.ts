import express from "express";
import fs from "fs";
import path from "path";
import { getStorage } from "firebase-admin/storage";
import { db } from "../lib/firebase";
import { parseInKolkata } from "../lib/dateUtils";
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

// Helper to split prize amount among total winners randomly such that sum is exactly prizeAmount and all are positive integers
function splitPrizeBudget(totalAmount: number, numWinners: number): number[] {
  if (numWinners <= 0) return [];
  if (numWinners === 1) return [totalAmount];
  
  const remaining = totalAmount - numWinners;
  if (remaining < 0) {
    const allocations = Array(numWinners).fill(1);
    return allocations;
  }
  
  const cuts: number[] = [];
  for (let i = 0; i < numWinners - 1; i++) {
    cuts.push(Math.floor(Math.random() * (remaining + 1)));
  }
  cuts.sort((a, b) => a - b);
  
  const allocations: number[] = [];
  let prev = 0;
  for (let i = 0; i < numWinners - 1; i++) {
    allocations.push(1 + (cuts[i] - prev));
    prev = cuts[i];
  }
  allocations.push(1 + (remaining - prev));
  
  return allocations;
}

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
    const caption = `🔥 <b>NEW LUCKY NUMBER GIVEAWAY CAMPAIGN!</b> 🔥\n\n` +
      `🏆 <b>${title}</b>\n\n` +
      `${description || ""}\n\n` +
      `💰 Total Prize Budget: <b>₹${prizeAmount}</b>\n` +
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

    const limit = Number(campaign.entryLimitPerUser || 1);

    // Run transaction to reserve the number and verify user duplicate check
    const result = await runTransaction(db, async (transaction) => {
      // 1. Check user stats for entry limits
      const statsRef = doc(db, "lucky_number_user_stats", `${giveawayId}_${telegramId}`);
      const statsSnap = await transaction.get(statsRef);
      
      let userNumbers: any[] = [];
      if (statsSnap.exists()) {
        userNumbers = statsSnap.data().numbers || [];
      }

      // Filter active (either Confirmed, Winner, or PendingAd within 60s)
      const nowMs = Date.now();
      const activeNumbers = userNumbers.filter((n: any) => {
        if (n.status === "Confirmed" || n.status === "Winner" || n.status === "Approved") return true;
        if (n.status === "PendingAd") {
          const resTime = new Date(n.reservedAt).getTime();
          return nowMs - resTime < 60000;
        }
        return false;
      });

      if (activeNumbers.length >= limit) {
        throw new Error(`You have already reserved the maximum of ${limit} number(s) for this giveaway!`);
      }

      const alreadyHasThisNum = activeNumbers.some((n: any) => Number(n.number) === num);
      if (alreadyHasThisNum) {
        throw new Error(`You have already chosen the number ${num}!`);
      }

      // 2. Check if this specific number is already reserved globally
      const entriesCollRef = collection(db, "lucky_number_entries");
      const numberDocId = `${giveawayId}_num_${num}`;
      const numberEntryRef = doc(entriesCollRef, numberDocId);
      const numberEntrySnap = await transaction.get(numberEntryRef);

      if (numberEntrySnap.exists()) {
        const entry = numberEntrySnap.data();
        if (entry.telegramId !== String(telegramId)) {
          if (entry.status === "Confirmed" || entry.status === "Winner" || entry.status === "Approved") {
            throw new Error("This number has already been selected. Please choose another number.");
          }
          if (entry.status === "PendingAd") {
            const reservedAt = new Date(entry.reservedAt).getTime();
            if (nowMs - reservedAt < 60000) {
              throw new Error("This number is temporarily locked by another user watching an ad. Please choose another number.");
            }
          }
        }
      }

      // Create reservation data
      const entryData = {
        campaignId: giveawayId,
        telegramId: String(telegramId),
        username: username || "",
        firstName: firstName || "",
        selectedNumber: num,
        reservedAt: new Date().toISOString(),
        status: "PendingAd"
      };

      // Set global number entry
      transaction.set(numberEntryRef, entryData);

      // Set user-specific entry for this number
      const userNumEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}_${num}`);
      transaction.set(userNumEntryRef, entryData);

      // Legacy support for single entry view listens
      if (limit === 1) {
        const legacyUserEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}`);
        transaction.set(legacyUserEntryRef, entryData);
      }

      // Save/Update user stats
      const cleanNumbers = userNumbers.filter((n: any) => {
        // Keep confirmed/winners, or pending that haven't timed out
        if (n.status === "Confirmed" || n.status === "Winner" || n.status === "Approved") return true;
        const resTime = new Date(n.reservedAt).getTime();
        return nowMs - resTime < 60000;
      });

      cleanNumbers.push({
        number: num,
        status: "PendingAd",
        reservedAt: new Date().toISOString()
      });

      transaction.set(statsRef, {
        campaignId: giveawayId,
        telegramId: String(telegramId),
        numbers: cleanNumbers,
        entryCount: cleanNumbers.length,
        updatedAt: new Date().toISOString()
      }, { merge: true });

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
    const { giveawayId, telegramId, selectedNumber } = req.body;

    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const statsRef = doc(db, "lucky_number_user_stats", `${giveawayId}_${telegramId}`);
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      return res.status(400).json({ success: false, error: "No pending reservation found. Please select a number first." });
    }

    const statsData = statsSnap.data();
    const userNumbers = statsData.numbers || [];
    
    // Find the target PendingAd entry
    const targetIndex = userNumbers.findIndex((n: any) => {
      if (n.status !== "PendingAd") return false;
      if (selectedNumber !== undefined && Number(selectedNumber) !== Number(n.number)) return false;
      return true;
    });

    if (targetIndex === -1) {
      return res.status(400).json({ success: false, error: "No pending reservation found. Please select a number first." });
    }

    const targetEntry = userNumbers[targetIndex];
    const num = Number(targetEntry.number);

    // Verify timeout (60 seconds)
    const reservedAt = new Date(targetEntry.reservedAt).getTime();
    if (Date.now() - reservedAt > 60000) {
      // Clear timed out reservation
      const updatedNumbers = userNumbers.filter((_: any, idx: number) => idx !== targetIndex);
      await setDoc(statsRef, { numbers: updatedNumbers, entryCount: updatedNumbers.length }, { merge: true });
      
      const entriesCollRef = collection(db, "lucky_number_entries");
      await deleteDoc(doc(entriesCollRef, `${giveawayId}_num_${num}`));
      await deleteDoc(doc(entriesCollRef, `${giveawayId}_user_${telegramId}_${num}`));
      await deleteDoc(doc(entriesCollRef, `${giveawayId}_user_${telegramId}`));

      return res.status(400).json({ success: false, error: "Your session timed out. Please choose your number again." });
    }

    // Confirm selection permanently
    userNumbers[targetIndex] = {
      ...targetEntry,
      status: "Confirmed",
      confirmedAt: new Date().toISOString()
    };

    await setDoc(statsRef, { numbers: userNumbers, entryCount: userNumbers.length }, { merge: true });

    const entriesCollRef = collection(db, "lucky_number_entries");
    const confirmTime = new Date().toISOString();
    const updatePayload = {
      status: "Confirmed",
      entryTime: confirmTime,
    };

    const batch = writeBatch(db);
    batch.update(doc(entriesCollRef, `${giveawayId}_num_${num}`), updatePayload);
    batch.update(doc(entriesCollRef, `${giveawayId}_user_${telegramId}_${num}`), updatePayload);
    
    // Also update legacy if it exists or is applicable
    const legacyUserEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}`);
    const legacyUserEntrySnap = await getDoc(legacyUserEntryRef);
    if (legacyUserEntrySnap.exists() && legacyUserEntrySnap.data().selectedNumber === num) {
      batch.update(legacyUserEntryRef, updatePayload);
    }

    await batch.commit();

    // Write Audit Log
    await writeAuditLog(giveawayId, "Lucky Number Giveaway", "Number Reserved Permanently", {
      telegramId,
      selectedNumber: num,
      username: statsData.username || ""
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
    const { giveawayId, telegramId, selectedNumber } = req.body;

    if (!giveawayId || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    const statsRef = doc(db, "lucky_number_user_stats", `${giveawayId}_${telegramId}`);
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      return res.json({ success: true });
    }

    const statsData = statsSnap.data();
    const userNumbers = statsData.numbers || [];

    // Find target PendingAd entry
    const targetIndex = userNumbers.findIndex((n: any) => {
      if (n.status !== "PendingAd") return false;
      if (selectedNumber !== undefined && Number(selectedNumber) !== Number(n.number)) return false;
      return true;
    });

    if (targetIndex !== -1) {
      const targetEntry = userNumbers[targetIndex];
      const num = Number(targetEntry.number);

      // Remove from numbers array
      const updatedNumbers = userNumbers.filter((_: any, idx: number) => idx !== targetIndex);
      await setDoc(statsRef, { numbers: updatedNumbers, entryCount: updatedNumbers.length }, { merge: true });

      const entriesCollRef = collection(db, "lucky_number_entries");
      const batch = writeBatch(db);
      batch.delete(doc(entriesCollRef, `${giveawayId}_num_${num}`));
      batch.delete(doc(entriesCollRef, `${giveawayId}_user_${telegramId}_${num}`));
      
      // Legacy cleanup if matching
      const legacyUserEntryRef = doc(entriesCollRef, `${giveawayId}_user_${telegramId}`);
      const legacySnap = await getDoc(legacyUserEntryRef);
      if (legacySnap.exists() && legacySnap.data().selectedNumber === num) {
        batch.delete(legacyUserEntryRef);
      }

      await batch.commit();
      console.log(`[LuckyNumber] Released reservation for user ${telegramId} on number ${num}`);
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
      autoPostChannel,
      entryLimitPerUser,
      startTime,
      endTime,
      autoResult,
      rewardAdsEnabled
    } = req.body;
    
    if (!title || !bannerUrl || !prizeAmount || !totalWinners || !numberRange) {
      return res.status(400).json({ success: false, error: "Missing required giveaway configurations" });
    }

    if (Number(prizeAmount) < Number(totalWinners)) {
      return res.status(400).json({ success: false, error: `Prize Amount (₹${prizeAmount}) must be at least equal to Total Winners (${totalWinners}) so every winner receives a positive amount of at least ₹1.` });
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

    let prizeAllocations = null;

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
      entryLimitPerUser: Number(entryLimitPerUser || 1),
      startTime: startTime || null,
      endTime: endTime || null,
      autoResult: autoResult === true || autoResult === "true",
      rewardAdsEnabled: rewardAdsEnabled !== false && rewardAdsEnabled !== "false"
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
        campaignData.drawnWinners = exData.drawnWinners || null;
        
        if (exData.prizeAmount === Number(prizeAmount) && exData.totalWinners === Number(totalWinners)) {
          prizeAllocations = exData.prizeAllocations || null;
        }
      }
    }

    if (!prizeAllocations) {
      prizeAllocations = splitPrizeBudget(Number(prizeAmount), Number(totalWinners));
    }
    campaignData.prizeAllocations = prizeAllocations;

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
    const { giveawayId, winnerIndex } = req.body;
    if (!giveawayId || winnerIndex === undefined) {
      return res.status(400).json({ success: false, error: "Missing giveawayId or winnerIndex" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    const idx = Number(winnerIndex);
    if (idx < 0 || idx >= campaign.totalWinners) {
      return res.status(400).json({ success: false, error: "Invalid winnerIndex" });
    }

    let prizeAllocations = campaign.prizeAllocations;
    if (!prizeAllocations || prizeAllocations.length !== campaign.totalWinners) {
      prizeAllocations = splitPrizeBudget(Number(campaign.prizeAmount), Number(campaign.totalWinners));
      await updateDoc(campaignDocRef, { prizeAllocations });
    }

    const allocatedPrize = prizeAllocations[idx];

    const drawnWinnersList = campaign.drawnWinners || [];
    const excludedNumbers = drawnWinnersList
      .filter((w: any) => w && w.status !== "Rejected")
      .map((w: any) => Number(w.selectedNumber));
    const excludedTgIds = drawnWinnersList
      .filter((w: any) => w && w.status !== "Rejected")
      .map((w: any) => String(w.telegramId));

    // Fetch all confirmed entries
    const qEntries = query(
      collection(db, "lucky_number_entries"), 
      where("campaignId", "==", giveawayId),
      where("status", "==", "Confirmed")
    );
    const entriesSnap = await getDocs(qEntries);
    const entries = entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(e => !excludedNumbers.includes(Number(e.selectedNumber)) && !excludedTgIds.includes(String(e.telegramId)));

    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No available confirmed entries found to pick a winner from." });
    }

    // Pick a random confirmed entry
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerEntry = entries[randomIndex];

    const newWinnerObj = {
      winnerIndex: idx,
      telegramId: winnerEntry.telegramId,
      selectedNumber: Number(winnerEntry.selectedNumber),
      name: winnerEntry.firstName || "Anonymous User",
      username: winnerEntry.username || "",
      status: "Pending",
      allocatedPrize: allocatedPrize,
      drawConfirmedAt: new Date().toISOString()
    };

    const updatedDrawnWinners = [...drawnWinnersList];
    updatedDrawnWinners[idx] = newWinnerObj;

    await updateDoc(campaignDocRef, {
      drawnWinners: updatedDrawnWinners,
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
    await writeAuditLog(giveawayId, campaign.title, `Winner #${idx + 1} Drawn`, {
      telegramId: winnerEntry.telegramId,
      number: winnerEntry.selectedNumber,
      name: winnerEntry.firstName,
      allocatedPrize
    });

    return res.json({
      success: true,
      message: `Winner #${idx + 1} drawn successfully!`,
      winner: newWinnerObj
    });

  } catch (err: any) {
    console.error("Draw winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to draw winner" });
  }
});

// Approve Winner (Credit Wallet automatically, mark complete, notify)
router.post("/approve-winner", async (req: any, res: any) => {
  try {
    const { giveawayId, winnerIndex } = req.body;
    if (!giveawayId || winnerIndex === undefined) {
      return res.status(400).json({ success: false, error: "Missing giveawayId or winnerIndex" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    const idx = Number(winnerIndex);
    const drawnWinnersList = campaign.drawnWinners || [];
    const winnerObj = drawnWinnersList[idx];

    if (!winnerObj || winnerObj.status !== "Pending") {
      return res.status(400).json({ success: false, error: "No pending winner to approve at this index." });
    }

    const prizeAmt = Number(winnerObj.allocatedPrize);

    // 1. Transaction to Credit Wallet
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", String(winnerObj.telegramId));
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error(`User profile for Telegram ID ${winnerObj.telegramId} not found. Cannot credit wallet.`);
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
        targetUserId: String(winnerObj.telegramId),
        action: "add_balance",
        amount: prizeAmt,
        reason: `Prize payout for Lucky Number Giveaway: ${campaign.title} (Winner #${idx + 1})`,
        createdAt: new Date()
      });
    });

    // 2. Update Entry documents
    const batch = writeBatch(db);
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerObj.telegramId}`), {
      status: "Winner",
      paymentStatus: "Paid",
      rewardAmount: prizeAmt,
      paidAt: new Date().toISOString()
    });
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${winnerObj.selectedNumber}`), {
      status: "Winner",
      paymentStatus: "Paid",
      rewardAmount: prizeAmt,
      paidAt: new Date().toISOString()
    });
    await batch.commit();

    // 3. Update the winner object in drawnWinners
    const updatedDrawnWinners = [...drawnWinnersList];
    updatedDrawnWinners[idx] = {
      ...winnerObj,
      status: "Approved",
      paidAt: new Date().toISOString()
    };

    // Check if ALL winners have been processed (Approved or Rejected)
    const allApprovedCount = updatedDrawnWinners.filter((w: any) => w && w.status === "Approved").length;
    const isCompleted = allApprovedCount === campaign.totalWinners;

    const updateFields: any = {
      drawnWinners: updatedDrawnWinners,
    };

    if (String(campaign.winnerId) === String(winnerObj.telegramId)) {
      updateFields.winnerStatus = "Approved";
    }

    if (isCompleted) {
      updateFields.status = "Completed";
      updateFields.winnersDrawn = true;
    }

    await updateDoc(campaignDocRef, updateFields);

    // 4. Send Bot confirmation message
    const botMsg = `🏆 <b>CONGRATULATIONS! You Won!</b> 🏆\n\n` +
      `You are the lucky winner of our Lucky Number Giveaway campaign: <b>${campaign.title}</b>!\n\n` +
      `💰 Winning Amount: <b>₹${prizeAmt}</b>\n` +
      `🍀 Your Lucky Number: <b>${winnerObj.selectedNumber}</b>\n\n` +
      `<b>₹${prizeAmt}</b> has been credited instantly to your Roy Share Wallet. You can withdraw it or check your balance anytime inside the app! 🎉`;
    
    await sendTgMessage(String(winnerObj.telegramId), botMsg);

    // Audit Log
    await writeAuditLog(giveawayId, campaign.title, `Winner #${idx + 1} Approved`, {
      telegramId: winnerObj.telegramId,
      number: winnerObj.selectedNumber,
      amount: prizeAmt
    });

    return res.json({ success: true, message: `Winner #${idx + 1} approved successfully!` });

  } catch (err: any) {
    console.error("Approve winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to approve winner" });
  }
});

// Reject Winner (Reject drawn winner, clear winner fields)
router.post("/reject-winner", async (req: any, res: any) => {
  try {
    const { giveawayId, winnerIndex, reason } = req.body;
    if (!giveawayId || winnerIndex === undefined) {
      return res.status(400).json({ success: false, error: "Missing giveawayId or winnerIndex" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    const idx = Number(winnerIndex);
    const drawnWinnersList = campaign.drawnWinners || [];
    const winnerObj = drawnWinnersList[idx];

    if (!winnerObj) {
      return res.status(400).json({ success: false, error: "No winner drawn at this index to reject." });
    }

    const winnerId = winnerObj.telegramId;

    // Update entries to Rejected
    const batch = writeBatch(db);
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerId}`), {
      status: "Rejected",
      paymentStatus: "Rejected",
      rejectionReason: reason || "Verification failed"
    });
    batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${winnerObj.selectedNumber}`), {
      status: "Rejected",
      paymentStatus: "Rejected",
      rejectionReason: reason || "Verification failed"
    });
    await batch.commit();

    // Update the winner object in drawnWinners to Rejected
    const updatedDrawnWinners = [...drawnWinnersList];
    updatedDrawnWinners[idx] = {
      ...winnerObj,
      status: "Rejected",
      rejectionReason: reason || "Verification failed"
    };

    const updateFields: any = {
      drawnWinners: updatedDrawnWinners
    };

    if (String(campaign.winnerId) === String(winnerId)) {
      updateFields.winnerStatus = "Rejected";
    }

    await updateDoc(campaignDocRef, updateFields);

    // Send Rejection Bot message
    const botMsg = `❌ <b>Your Lucky Number Giveaway entry has been rejected.</b>\n\n` +
      `Campaign: <b>${campaign.title}</b>\n` +
      `Reason: <i>${reason || "Violation of campaign rules / verification failed."}</i>`;
    await sendTgMessage(String(winnerId), botMsg);

    // Write Audit Log
    await writeAuditLog(giveawayId, campaign.title, `Winner #${idx + 1} Rejected`, {
      telegramId: winnerId,
      reason
    });

    return res.json({ success: true, message: `Winner #${idx + 1} successfully rejected.` });

  } catch (err: any) {
    console.error("Reject winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reject winner" });
  }
});

// Redraw Winner (Picks a different random Confirmed participant for a specific winnerIndex)
router.post("/redraw-winner", async (req: any, res: any) => {
  try {
    const { giveawayId, winnerIndex } = req.body;
    if (!giveawayId || winnerIndex === undefined) {
      return res.status(400).json({ success: false, error: "Missing giveawayId or winnerIndex" });
    }

    const campaignDocRef = doc(db, "lucky_number_campaigns", giveawayId);
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = campaignSnap.data();
    const idx = Number(winnerIndex);
    const drawnWinnersList = campaign.drawnWinners || [];
    const oldWinnerObj = drawnWinnersList[idx];

    if (!oldWinnerObj) {
      return res.status(400).json({ success: false, error: "No winner exists at this index to redraw." });
    }

    const oldWinnerId = oldWinnerObj.telegramId;

    // If there was a previous winner, mark their entry as Confirmed again (if they weren't rejected)
    if (oldWinnerId && oldWinnerObj.status !== "Rejected") {
      const batch = writeBatch(db);
      batch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${oldWinnerId}`), { status: "Confirmed" });
      batch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${oldWinnerObj.selectedNumber}`), { status: "Confirmed" });
      await batch.commit();
    }

    // Identify already drawn/confirmed numbers/users from OTHER slots to exclude them!
    const otherDrawnWinners = drawnWinnersList.filter((w: any, wIdx: number) => w && wIdx !== idx && w.status !== "Rejected");
    const excludedNumbers = otherDrawnWinners.map((w: any) => Number(w.selectedNumber));
    const excludedTgIds = otherDrawnWinners.map((w: any) => String(w.telegramId));

    // Also exclude the old winner who is being replaced by this redraw
    excludedTgIds.push(String(oldWinnerId));

    // Fetch all confirmed entries
    const qEntries = query(
      collection(db, "lucky_number_entries"),
      where("campaignId", "==", giveawayId),
      where("status", "==", "Confirmed")
    );
    const entriesSnap = await getDocs(qEntries);
    const entries = entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(e => !excludedNumbers.includes(Number(e.selectedNumber)) && !excludedTgIds.includes(String(e.telegramId)));

    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No other confirmed entries found to redraw this winner." });
    }

    // Pick new random winner
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerEntry = entries[randomIndex];

    // Maintain consistent prize pool! Uses the same allocated prize amount for this slot!
    const allocatedPrize = oldWinnerObj.allocatedPrize;

    const newWinnerObj = {
      winnerIndex: idx,
      telegramId: winnerEntry.telegramId,
      selectedNumber: Number(winnerEntry.selectedNumber),
      name: winnerEntry.firstName || "Anonymous User",
      username: winnerEntry.username || "",
      status: "Pending",
      allocatedPrize: allocatedPrize,
      drawConfirmedAt: new Date().toISOString()
    };

    // Update drawnWinners array
    const updatedDrawnWinners = [...drawnWinnersList];
    updatedDrawnWinners[idx] = newWinnerObj;

    // Update campaign document
    await updateDoc(campaignDocRef, {
      drawnWinners: updatedDrawnWinners,
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
    await writeAuditLog(giveawayId, campaign.title, `Winner #${idx + 1} Redrawn`, {
      oldWinnerTelegramId: oldWinnerId,
      newWinnerTelegramId: winnerEntry.telegramId,
      number: winnerEntry.selectedNumber,
      allocatedPrize
    });

    return res.json({
      success: true,
      message: `Winner #${idx + 1} redrawn successfully!`,
      winner: newWinnerObj
    });

  } catch (err: any) {
    console.error("Redraw winner error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to redraw winner" });
  }
});

// Auto draw trigger (locks entries, draws and automatically approves winners if autoResult is ON)
router.post("/auto-draw-trigger", async (req: any, res: any) => {
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
    if (campaign.status !== "Live") {
      return res.json({ success: true, message: "Campaign is already locked/completed." });
    }

    // Parse the end date-time to verify countdown has finished
    const endVal = campaign.endTime ? `${campaign.endDate}T${campaign.endTime}` : campaign.endDate;
    if (!endVal) {
      return res.status(400).json({ success: false, error: "No end time set on this campaign." });
    }

    const parsedEnd = parseInKolkata(endVal);
    if (Date.now() < parsedEnd.getTime()) {
      return res.status(400).json({ success: false, error: "Countdown has not reached zero yet." });
    }

    // Determine status update: if autoResult is enabled, mark "Drawing Winners", else mark "Ended"
    const autoResult = campaign.autoResult === true;
    const nextStatus = autoResult ? "Drawing Winners" : "Ended";
    await updateDoc(campaignDocRef, { status: nextStatus });

    if (!autoResult) {
      // Just lock the entries and let the admin draw manually
      await writeAuditLog(giveawayId, campaign.title, "Campaign Ended", { status: "Ended", reason: "Countdown reached zero, manual draw required" });
      return res.json({ success: true, message: "Giveaway ended. Awaiting manual winner selection." });
    }

    // Auto Result is ON: Auto pick and credit the winners!
    const totalWinners = Number(campaign.totalWinners || 1);
    let prizeAllocations = campaign.prizeAllocations;
    if (!prizeAllocations || prizeAllocations.length !== totalWinners) {
      prizeAllocations = splitPrizeBudget(Number(campaign.prizeAmount), totalWinners);
    }

    // Fetch confirmed entries (only filter those that are _num_ to avoid duplicates)
    const qEntries = query(
      collection(db, "lucky_number_entries"),
      where("campaignId", "==", giveawayId),
      where("status", "==", "Confirmed")
    );
    const entriesSnap = await getDocs(qEntries);
    const confirmedEntries = entriesSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(e => e.id.includes("_num_"));

    if (confirmedEntries.length === 0) {
      // No one participated, transition directly to Completed
      await updateDoc(campaignDocRef, {
        status: "Completed",
        winnersDrawn: true,
        drawnWinners: []
      });
      await writeAuditLog(giveawayId, campaign.title, "Auto Draw Complete (No Entries)", {});
      return res.json({ success: true, message: "No entries were found. Campaign ended with no winners." });
    }

    // Shuffle entries randomly to select winners
    const shuffled = [...confirmedEntries].sort(() => Math.random() - 0.5);
    const winnersCount = Math.min(totalWinners, shuffled.length);

    const drawnWinnersList: any[] = [];

    // Select each winner, credit wallet, and log activity
    for (let i = 0; i < winnersCount; i++) {
      const winnerEntry = shuffled[i];
      const allocatedPrize = prizeAllocations[i] || Math.floor(campaign.prizeAmount / totalWinners);

      // Create the Winner Object
      const winnerObj = {
        winnerIndex: i,
        telegramId: winnerEntry.telegramId,
        selectedNumber: Number(winnerEntry.selectedNumber),
        name: winnerEntry.firstName || "Anonymous User",
        username: winnerEntry.username || "",
        status: "Approved", // Auto approved
        allocatedPrize,
        drawConfirmedAt: new Date().toISOString(),
        paidAt: new Date().toISOString()
      };
      drawnWinnersList.push(winnerObj);

      // Crediting wallet using standard user transaction logic
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, "users", String(winnerEntry.telegramId));
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            console.error(`[AutoDraw] User profile not found for Telegram ID ${winnerEntry.telegramId}`);
            return;
          }

          const userData = userSnap.data();
          const currentBalance = Number(userData.balance || 0);
          const newBalance = currentBalance + allocatedPrize;

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

          // Log transaction
          const logRef = doc(collection(db, "activityLogs"));
          transaction.set(logRef, {
            adminId: "system",
            targetUserId: String(winnerEntry.telegramId),
            action: "add_balance",
            amount: allocatedPrize,
            reason: `Prize payout for Lucky Number Giveaway: ${campaign.title} (Winner #${i + 1})`,
            createdAt: new Date()
          });
        });

        // Update Entry Documents in Firestore (using standard writeBatch)
        const entryBatch = writeBatch(db);
        entryBatch.update(doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerEntry.telegramId}_${winnerEntry.selectedNumber}`), {
          status: "Winner",
          paymentStatus: "Paid",
          rewardAmount: allocatedPrize,
          paidAt: new Date().toISOString()
        });
        entryBatch.update(doc(db, "lucky_number_entries", `${giveawayId}_num_${winnerEntry.selectedNumber}`), {
          status: "Winner",
          paymentStatus: "Paid",
          rewardAmount: allocatedPrize,
          paidAt: new Date().toISOString()
        });
        
        // Update legacy entry document if it exists
        const legacyUserEntryRef = doc(db, "lucky_number_entries", `${giveawayId}_user_${winnerEntry.telegramId}`);
        const legacyUserEntrySnap = await getDoc(legacyUserEntryRef);
        if (legacyUserEntrySnap.exists() && legacyUserEntrySnap.data().selectedNumber === winnerEntry.selectedNumber) {
          entryBatch.update(legacyUserEntryRef, {
            status: "Winner",
            paymentStatus: "Paid",
            rewardAmount: allocatedPrize,
            paidAt: new Date().toISOString()
          });
        }

        await entryBatch.commit();

        // Send Telegram notification message
        const botMsg = `🏆 <b>CONGRATULATIONS! You Won!</b> 🏆\n\n` +
          `You are the lucky winner of our Lucky Number Giveaway campaign: <b>${campaign.title}</b>!\n\n` +
          `💰 Winning Amount: <b>₹${allocatedPrize}</b>\n` +
          `🍀 Your Lucky Number: <b>${winnerEntry.selectedNumber}</b>\n\n` +
          `<b>₹${allocatedPrize}</b> has been credited instantly to your Roy Share Wallet. You can withdraw it or check your balance anytime inside the app! 🎉`;
        
        await sendTgMessage(String(winnerEntry.telegramId), botMsg);

      } catch (err: any) {
        console.error(`Failed to credit wallet for winner ${winnerEntry.telegramId} in auto-draw:`, err);
      }
    }

    // Complete the campaign
    await updateDoc(campaignDocRef, {
      drawnWinners: drawnWinnersList,
      winnersDrawn: true,
      status: "Completed",
      winnerId: drawnWinnersList[0]?.telegramId || null,
      winnerNumber: drawnWinnersList[0]?.selectedNumber || null,
      winnerName: drawnWinnersList[0]?.name || null,
      winnerUsername: drawnWinnersList[0]?.username || null,
      winnerStatus: "Approved"
    });

    // Write Audit Log
    await writeAuditLog(giveawayId, campaign.title, "Auto Draw Campaign Completed", {
      winnersCount,
      drawnWinners: drawnWinnersList.map(w => ({ telegramId: w.telegramId, num: w.selectedNumber, prize: w.allocatedPrize }))
    });

    return res.json({
      success: true,
      message: "Giveaway auto-draw completed successfully!",
      winners: drawnWinnersList
    });

  } catch (err: any) {
    console.error("Auto draw trigger error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to trigger auto draw" });
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
      drawnWinners: null,
      prizeAllocations: null,
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

    const distributedBudget = (campaign.drawnWinners || [])
      .filter((w: any) => w && w.status === "Approved")
      .reduce((sum: number, w: any) => sum + Number(w.allocatedPrize || 0), 0);
    
    const totalBudget = Number(campaign.prizeAmount || 0);
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
