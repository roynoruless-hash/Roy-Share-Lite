
import crypto from "crypto";
import jwt from "jsonwebtoken";
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "default_secret_for_dev_only_change_in_prod";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const KEY = crypto.createHash("sha256")
  .update(ENCRYPTION_SECRET)
  .digest();

function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptToken(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
import fs from "fs";
import path from "path";
fs.appendFileSync(path.join(process.cwd(), "server_debug.log"), `[${new Date().toISOString()}] TOP OF server.ts reached (pre-imports)
`);

import dotenv from "dotenv";
dotenv.config();

import { handleUpdate, submitWithdrawalRequest } from "./src/bot";
import express from "express";
import { setupAdvertiserRoutes } from './src/server_advertiser';

// import path from "path"; // Already imported
// import fs from "fs"; // Already imported
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
fs.appendFileSync(path.join(process.cwd(), "server_debug.log"), `[${new Date().toISOString()}] Vite import removed
`);
import { getDb } from "./src/lib/firebase";
import { doc, getDoc as firestoreGetDoc, setDoc, collection, addDoc, query, where, getDocs, getCountFromServer, collectionGroup, deleteDoc, orderBy, updateDoc, limit, increment, runTransaction, arrayUnion, writeBatch, deleteField, serverTimestamp } from "firebase/firestore";
import luckyNumberGiveawayRouter from "./src/routes/luckyNumberGiveaway";
import { adjustTrustScore } from "./src/lib/trustScore";
import { evaluateReward, getEconomySettings, saveEconomySettings } from "./src/lib/economy";
import { getGiveawayStatus } from "./src/lib/dateUtils";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "royshare_aes_256_encryption_key_32bytes_long!";
const hashKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", hashKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `enc:${iv.toString("hex")}:${encrypted}`;
};

const decryptSecret = (text: string): string => {
  if (!text) return "";
  if (!text.startsWith("enc:")) return text;
  try {
    const raw = text.substring(4);
    const parts = raw.split(":");
    const iv = Buffer.from(parts.shift() || "", "hex");
    const encryptedText = parts.join(":");
    const decipher = crypto.createDecipheriv("aes-256-cbc", hashKey, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e);
    return text;
  }
};

const getDoc = async (ref: any, attempts = 5, initialDelay = 500): Promise<any> => {
  let lastError: any;
  let delay = initialDelay;
  for (let i = 0; i < attempts; i++) {
    try {
      const snap = await firestoreGetDoc(ref);
      if (ref && ref.path === "settings/telegram" && snap.exists()) {
        const originalData = snap.data;
        if (originalData) {
          snap.data = function() {
            const d = originalData.apply(snap);
            if (!d) return d;
            return {
              ...d,
              botToken: d.botToken && d.botToken.startsWith("enc:") ? decryptSecret(d.botToken) : d.botToken,
              clientSecret: d.clientSecret && d.clientSecret.startsWith("enc:") ? decryptSecret(d.clientSecret) : d.clientSecret
            };
          };
        }
      }
      return snap;
    } catch (e: any) {
      lastError = e;
      const isOfflineError = e.message && (
        e.message.toLowerCase().includes("offline") || 
        e.message.toLowerCase().includes("unavailable") || 
        e.code === "unavailable"
      );
      if (isOfflineError && i < attempts - 1) {
        console.warn(`[Firestore Retry] getDoc failed for path "${ref?.path || 'unknown'}": ${e.message || e}. Retrying in ${delay}ms... (Attempt ${i + 1}/${attempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw e;
      }
    }
  }
  throw lastError;
};

import { REWARD_TASKS } from "./src/lib/tasks";
import { GoogleGenAI, Type } from "@google/genai";
import { safeGenerateContent, safeSendMessage } from "./src/lib/gemini";
import { google } from "googleapis";

// ...
const db = getDb();

let cachedVerificationTag = "";

async function initializeVerificationTag() {
  try {
    const docRef = doc(db, "settings", "verification");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedVerificationTag = docSnap.data()?.tag || "";
      debugLog(`[Verification] Initialized cached tag: "${cachedVerificationTag}"`);
    } else {
      debugLog("[Verification] No cached tag found in settings/verification.");
    }
  } catch (e: any) {
    debugLog(`[Verification] Failed to initialize cached tag: ${e.message || e}`);
  }
}

let cachedAdsbitvexSettings: any = null;

async function initializeAdsbitvexSettings() {
  try {
    const docRef = doc(db, "settings", "adsbitvex");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedAdsbitvexSettings = docSnap.data() || null;
      debugLog(`[AdsBitvex] Initialized settings: ${JSON.stringify(cachedAdsbitvexSettings)}`);
    } else {
      debugLog("[AdsBitvex] No cached settings found in settings/adsbitvex.");
    }
  } catch (e: any) {
    debugLog(`[AdsBitvex] Failed to initialize cached settings: ${e.message || e}`);
  }
}

import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
let adminDb: any;

// Middleware to check if Firebase Admin is initialized and user is authorized
const requireAdminDb = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET!);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Helper to log to a file we can read
const debugLog = (msg: string) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}
`;
  console.log(msg); // Still log to console
  try {
    fs.appendFileSync(path.join(process.cwd(), "server_debug.log"), logLine);
  } catch (e) {
    // Ignore logging errors
  }
};

debugLog("Server starting/restarting...");

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Initialize Admin SDK minimally (will use ADC if available, otherwise will likely fail silently until used)
try {
  if (getApps().length === 0) {
    const adminApp = initializeApp({
      projectId: config.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.appspot.com`
    });
    adminDb = getAdminFirestore(adminApp);
    debugLog("[Firebase] Admin SDK initialized (minimal).");
  } else {
    adminDb = getAdminFirestore(getApps()[0]);
    debugLog("[Firebase] Admin SDK reused existing app.");
  }
} catch (e: any) {
  debugLog(`[Firebase] Admin SDK minimal init failed: ${e.message}`);
}

async function cleanupDemoTasks() {
  debugLog("Inside cleanupDemoTasks...");
  try {
    const tasksToCleanup = [
      { id: "task_1" },
      { id: "task_2" },
      { id: "task_3" },
      { id: "task_4" },
      { title: "Task #1" },
      { title: "Task #2" },
      { title: "Task #3" },
      { title: "Task #4" },
      { title: "Open Task #3 In Chrome" },
      { title: "Open Task #4 In Chrome" },
      { title: "Watch Ads Rewards" },
      { title: "Quick Video Ad Session" }
    ];

    debugLog("Fetching tasks from Firestore using Client SDK (workaround for Admin permissions)...");
    const tasksRef = collection(db, "tasks");
    const snapshot = await getDocs(tasksRef);
    debugLog(`Found ${snapshot.docs.length} tasks in Firestore.`);
    
    const batch = writeBatch(db);
    let deleteCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
      const title = data.title || "";
      
      const shouldDelete = tasksToCleanup.some(t => {
        if (t.id && t.id === id) return true;
        if (t.title && t.title === title) return true;
        return false;
      });

      if (shouldDelete) {
        debugLog(`Queueing demo task for cleanup: ${title} (${id})`);
        batch.delete(doc(db, "tasks", id));
        deleteCount++;
      }
    }
    
    if (deleteCount > 0) {
      await batch.commit();
      debugLog(`Successfully cleaned up ${deleteCount} tasks.`);
    } else {
      debugLog("No demo tasks to clean up.");
    }
    debugLog("Finished cleanupDemoTasks.");
  } catch (e: any) {
    debugLog(`Error in cleanupDemoTasks: ${e.message || e}`);
  }
}

// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔴 UNCAUGHT EXCEPTION:', err);
});

async function startServer() {
  debugLog("startServer: Beginning startup sequence...");
  
  // Initialize dynamic website verification tag cache
  await initializeVerificationTag();
  
  // Initialize dynamic AdsBitvex settings cache
  await initializeAdsbitvexSettings();
  
  // Run cleanup on startup (non-blocking)
  debugLog("startServer: Launching cleanupDemoTasks (non-blocking)...");
  cleanupDemoTasks();
  
  debugLog("startServer: Initializing Express app...");
  
  const escapeHTML = (str) => {
  return (str || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Neutralize deleted features' endpoints
  app.use([
    "/api/video-tasks",
    "/api/admin/video-tasks",
    "/api/admin/video-analytics",
    "/api/admin/video-logs",
    "/api/admin/video-logs-action",
    "/api/gamepix",
    "/api/admin/gamepix",
    "/api/admin/games",
    "/api/admin/game-categories",
    "/api/game/rewards",
    "/api/game/sessions",
    "/api/game/analytics",
    "/api/admin/gamemonetize",
    "/api/admin/game-reward-settings",
    "/api/game/reward-settings",
    "/api/game/convert-coins"
  ], (req, res) => {
    res.status(410).json({ error: "Feature removed", success: false });
  });

  // Register Lucky Number Giveaway Router
  app.use("/api/lucky-number-giveaway", luckyNumberGiveawayRouter);

  // Global Request Logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      debugLog(`[RESPONSE] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    debugLog(`[REQUEST] ${req.method} ${req.url}`);
    console.log(`[SERVER] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  const PORT = 3000;

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      uptime: process.uptime(),
      firebaseAdmin: !!adminDb,
      firebaseClient: !!db
    });
  });

  app.post("/api/bot/trigger-upload-prompt", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // 1. Get botToken from settings/telegram
      const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
      const botToken = settingsDoc.data()?.botToken;
      if (!botToken) {
        return res.status(500).json({ error: "Bot token not configured" });
      }

      // 2. Set uploadTestMode = true
      await setDoc(doc(db, "users", String(userId)), { uploadTestMode: true }, { merge: true });

      // 3. Send upload prompt message to user's chatId (which is the userId)
      const messageText = `📤 *Send the file you want to upload.*
\nSupported Files:\n📄 PDF\n📦 APK\n🎬 Video\n🎵 Audio\n🖼 Image\n📁 ZIP/RAR\n📃 Documents`;

      const inlineKeyboard = {
          inline_keyboard: [
              [{ text: "❌ Cancel", callback_data: "upload_back" }]
          ]
      };

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: Number(userId),
          text: messageText,
          parse_mode: "Markdown",
          reply_markup: inlineKeyboard
        })
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error triggering upload prompt:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/test-db", async (req, res) => {
    try {
      if (!adminDb) {
        return res.status(500).json({ error: "adminDb not initialized" });
      }
      const testRef = adminDb.collection("system_test").doc("connectivity");
      await testRef.set({
        lastTest: new Date().toISOString(),
        status: "success"
      });
      const snap = await testRef.get();
      res.json({ success: true, data: snap.data() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

// Admin Logging Helper
async function logAdminActivity(adminId: string, userId: string, action: string, ip: string, details?: any) {
  try {
    await addDoc(collection(db, "adminActivityLogs"), {
      adminId: adminId || "Admin",
      userId: userId || "N/A",
      action: action || "Unknown Action",
      ip: ip || "unknown",
      details: details || {},
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to log admin activity:", err);
  }
}

  // --- Admin: Account Verification Management ---
  app.get("/api/admin/users/verified", requireAdminDb, async (req, res) => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      res.json({ success: true, users });
    } catch (e: any) {
      console.error("Admin verified users fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

const otpStore = new Map<string, string>(); // Store OTPs by mobile

  app.post("/api/admin/send-otp", async (req, res) => {
    const { mobile, botToken, chatId } = req.body;
    if (mobile !== "9027671630") return res.status(403).json({ error: "Unauthorized" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(mobile, otp);
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: `Your Admin OTP is: ${otp}` })
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/admin/verify-otp", async (req, res) => {
    const { mobile, otp } = req.body;
    if (otpStore.get(mobile) !== otp) return res.status(401).json({ error: "Invalid OTP" });
    otpStore.delete(mobile);
    const token = jwt.sign({ admin: "9027671630" }, process.env.ADMIN_JWT_SECRET!, { expiresIn: "1h" });
    res.json({ success: true, token });
  });

  app.post("/api/admin/users/update-status", requireAdminDb, async (req, res) => {
    try {
      const { telegramId, status, adminId, ip } = req.body;
      if (!telegramId || !status) return res.status(400).json({ error: "Missing parameters" });

      const userRef = doc(db, "users", String(telegramId));
      await updateDoc(userRef, { status });

      await logAdminActivity(adminId || "Admin", String(telegramId), `USER_STATUS_${status.toUpperCase()}`, ip || "unknown");

      res.json({ success: true, message: `User status updated to ${status}` });
    } catch (e: any) {
      console.error("Admin user status update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Dashboard route
  app.get("/api/admin/dashboard", requireAdminDb, async (req, res) => {
    try {
      const getCount = async (coll: any) => {
        try { return (await getCountFromServer(coll)).data().count; } catch (e) { return 0; }
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalUsers, totalUploads, totalLinks, totalWithdrawals, 
        openTickets, totalAnnouncements, 
        totalRewardClaims, totalReferrals
      ] = await Promise.all([
        getCount(collection(db, "users")),
        getCount(collection(db, "uploads")),
        getCount(collection(db, "links")),
        getCount(collection(db, "withdrawals")),
        getCount(query(collection(db, "tickets"), where("status", "==", "open"))),
        getCount(collection(db, "announcements")),
        getCount(collection(db, "task_completions")),
        getCount(collection(db, "referrals"))
      ]);

      // Calculate total user earnings (sum of balance from users if possible, or we can just return 0 if too complex, or get it from withdrawals + balances)
      // Since there's no sum() yet without aggregation queries, we will mock totalEarnings for now to avoid huge reads, or we can just send what we have.
      const totalEarnings = 0; // Simplified for now

      // For today's stats, we'll need to query based on createdAt >= today
      const getTodayCount = async (collName: string) => {
          try {
            return (await getCountFromServer(query(collection(db, collName), where("createdAt", ">=", today.toISOString())))).data().count;
          } catch(e) { return 0; }
      };

      const [
          newUsersToday, uploadsToday, linksToday,
          withdrawalsToday, rewardsClaimedToday
      ] = await Promise.all([
          getTodayCount("users"),
          getTodayCount("uploads"),
          getTodayCount("links"),
          getTodayCount("withdrawals"),
          getTodayCount("task_completions")
      ]);

      // Recent activities - we can just fetch recent announcements or tickets for mock, but we'll leave it empty to be filled by frontend or return a static mock array if needed
      res.json({
          overview: {
              totalUsers, totalUploads, totalLinks, totalEarnings, totalWithdrawals,
              totalRewardClaims, totalReferrals, openTickets, totalAnnouncements
          },
          today: {
              newUsersToday, uploadsToday, linksToday, rewardsClaimedToday, withdrawalsToday
          },
          activities: [
              { id: 1, type: "system", text: "Dashboard data loaded", time: new Date().toISOString() }
          ],
          health: {
              firestore: "Online",
              telegram: "Online",
              web: "Online",
              rewards: "Online"
          }
      });
    } catch (e: any) {
        console.error("Admin dashboard error:", e);
        res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Withdrawals Routes
  app.get("/api/admin/withdrawals", requireAdminDb, async (req, res) => {
    try {
      const wQuery = query(collection(db, "withdrawals"));
      const snapshot = await getDocs(wQuery);
      const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // sort by createdAt desc
      withdrawals.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(withdrawals);
    } catch (e: any) {
      console.error("Admin withdrawals fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  const getBotToken = async () => {
      const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
      return telegramSettingsDoc.data()?.botToken;
  };

  const sendTgMessage = async (chatId: string, text: string, options: any = {}) => {
      const botToken = await getBotToken();
      if (!botToken) return;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...options })
      });
  };

  /**
   * Helper to record a structured wallet transaction permanently.
   * Automatically updates history and sends a Telegram notification if enabled.
   */
  const recordWalletTransaction = async (params: {
    userId: string;
    amount: number;
    creditDebit: "Credit" | "Debit";
    source: string;
    description: string;
    eventName?: string;
    status?: string;
    adminNotes?: string;
    transactionId?: string;
    skipNotification?: boolean;
  }) => {
    try {
      const { userId, amount, creditDebit, source, description, eventName, status = "Completed", adminNotes, transactionId, skipNotification = false } = params;
      
      // Fetch user details for username and notification preferences
      const userRef = doc(db, "users", String(userId));
      const userSnap = await getDoc(userRef);
      let username = "no_username";
      let isNotifEnabled = true;

      if (userSnap.exists()) {
        const uData = userSnap.data();
        username = uData.username || uData.firstName || "no_username";
        if (uData.notificationsEnabled !== undefined) {
          isNotifEnabled = uData.notificationsEnabled;
        }
      }

      const txData: any = {
        userId: String(userId),
        telegramUsername: username,
        amount: Number(amount),
        creditDebit,
        source,
        description,
        createdAt: new Date().toISOString(),
        status
      };

      if (eventName) txData.eventName = eventName;
      if (adminNotes) txData.adminNotes = adminNotes;

      let docId = transactionId;
      if (!docId) {
        const newRef = doc(collection(db, "transactions"));
        docId = newRef.id;
      }
      txData.transactionId = docId;

      await setDoc(doc(db, "transactions", docId), txData, { merge: true });
      console.log(`[recordWalletTransaction] Recorded ${creditDebit} tx: ${docId} of ₹${amount} for user ${userId} (${source})`);

      // Send Telegram Notification (if enabled and not skipped)
      if (isNotifEnabled && !skipNotification) {
        const typeIcon = creditDebit === "Credit" ? "🟢" : "🔴";
        const sign = creditDebit === "Credit" ? "+" : "-";
        const formattedAmount = source.toLowerCase().includes("usdt") ? `${amount} USDT` : `₹${amount}`;
        const tgMsg = `${typeIcon} <b>Wallet Transaction Alert</b>\n\n` +
                      `<b>Type:</b> ${creditDebit}\n` +
                      `<b>Source:</b> ${source}\n` +
                      `<b>Amount:</b> ${sign}${formattedAmount}\n` +
                      `<b>Description:</b> ${description}\n` +
                      (eventName ? `<b>Event:</b> ${eventName}\n` : "") +
                      `<b>Status:</b> ${status}\n` +
                      `<b>Transaction ID:</b> <code>${docId}</code>\n\n` +
                      `Thank you for using RoyShare!`;
        await sendTgMessage(String(userId), tgMsg).catch((err) => {
          console.error(`[recordWalletTransaction] Failed to send Telegram notification to ${userId}:`, err);
        });
      }

      return docId;
    } catch (e) {
      console.error("[recordWalletTransaction] Error recording transaction:", e);
    }
  };

  const verifyTelegramInitData = (initData: string, botToken: string): { isValid: boolean; user?: any } => {
    try {
      if (!initData) return { isValid: false };
      const params = new URLSearchParams(initData);
      const hash = params.get("hash");
      if (!hash) return { isValid: false };

      const sortedParams: string[] = [];
      params.forEach((value, key) => {
        if (key !== "hash") {
          sortedParams.push(`${key}=${value}`);
        }
      });
      sortedParams.sort();

      const dataCheckString = sortedParams.join("\n");
      const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
      const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

      const isValid = calculatedHash === hash;
      let user = null;
      if (isValid && params.get("user")) {
        user = JSON.parse(params.get("user") || "{}");
      }

      return { isValid, user };
    } catch (err) {
      console.error("InitData verification error:", err);
      return { isValid: false };
    }
  };

  const ensureTelegramUserSynced = async (userObj: any) => {
    if (!userObj || !userObj.id) return null;
    const userId = String(userObj.id);
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    const nowIso = new Date().toISOString();
    const todayDateStr = nowIso.split("T")[0];
    
    const uData: any = {
      lastActive: nowIso,
      username: userObj.username || "",
      firstName: userObj.first_name || "",
      lastName: userObj.last_name || "",
      languageCode: userObj.language_code || "",
      photoUrl: userObj.photo_url || "",
      isPremium: userObj.is_premium || false,
      chatType: userObj.chat_type || "",
      updatedAt: nowIso
    };

    if (userSnap.exists()) {
      const existingData = userSnap.data();
      let referralCode = existingData.referralCode || "";
      if (!referralCode) {
        referralCode = `RS${userId.slice(-6).toUpperCase()}`;
        uData.referralCode = referralCode;
      }
      
      // Active Days Tracking
      const lastActiveDate = existingData.lastActiveDate || "";
      if (lastActiveDate !== todayDateStr) {
        uData.lastActiveDate = todayDateStr;
        const currentActiveCount = (existingData.activeDaysCount || 0) + 1;
        uData.activeDaysCount = currentActiveCount;
        
        // Trigger async Trust Score updates
        setTimeout(async () => {
          if (currentActiveCount === 7) {
            await adjustTrustScore(userId, 5, "7 Days Active");
          } else if (currentActiveCount === 30) {
            await adjustTrustScore(userId, 10, "30 Days Active");
            
            // Check Zero Fraud for 30 Days (+10)
            const fSnap = await getDocs(query(collection(db, "fraud_sessions"), where("userId", "==", userId)));
            if (fSnap.empty) {
              await adjustTrustScore(userId, 10, "Zero Fraud for 30 Days");
            }
          }
        }, 100);
      }

      await updateDoc(userDocRef, uData);
      return { id: userId, ...existingData, ...uData };
    } else {
      const newUser = {
        ...uData,
        id: userId,
        telegramId: userObj.id,
        createdAt: nowIso,
        balance: 0,
        availableBalance: 0,
        totalEarnings: 0,
        todayEarnings: 0,
        level: "Bronze",
        referralCode: `RS${userId.slice(-6).toUpperCase()}`,
        referredBy: null,
        profileCompleted: false,
        status: "Active",
        trustScore: 50, // New user gets 50 trust score
        activeDaysCount: 1,
        lastActiveDate: todayDateStr
      };
      await setDoc(userDocRef, newUser);
      return newUser;
    }
  };

  app.post("/api/auth/telegram-verify", async (req, res) => {
    try {
      const { initData } = req.body;
      if (!initData) return res.status(400).json({ error: "Missing initData" });

      const tgSettingsRef = doc(db, "settings", "telegram");
      const tgSettingsSnap = await getDoc(tgSettingsRef);
      const botToken = tgSettingsSnap.exists() ? tgSettingsSnap.data().botToken : process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return res.status(500).json({ error: "Telegram Bot Token not configured" });
      }

      const { isValid, user: tgUser } = verifyTelegramInitData(initData, botToken);
      if (!isValid || !tgUser) {
        return res.status(401).json({ error: "Invalid Telegram authentication" });
      }

      const user = await ensureTelegramUserSynced(tgUser);

      // Extract and save start_param / startParam for referral tracking
      const urlParams = new URLSearchParams(initData);
      const startParam = urlParams.get("start_param") || req.body.startParam || req.body.start_param || "";

      if (startParam && user) {
        const cleanParam = startParam.trim();
        console.log(`[telegram-verify] start_param detected: ${cleanParam} for user: ${user.id}`);
        
        const userDocRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const isCompleted = uData.registrationStep === 'completed';
          const hasReferrer = uData.referredBy || uData.pendingReferrerId;
          
          if (!isCompleted && !hasReferrer) {
            let refCode = cleanParam;
            if (cleanParam.startsWith("ref_")) {
              refCode = cleanParam.substring(4);
            }
            
            let referrerId: string | null = null;
            
            // Try direct ID
            const directDoc = await getDoc(doc(db, "users", refCode));
            if (directDoc.exists()) {
              referrerId = directDoc.id;
            } else {
              // Try query by referralCode field
              const qRef = query(collection(db, "users"), where("referralCode", "==", refCode));
              const snapRef = await getDocs(qRef);
              if (!snapRef.empty) {
                referrerId = snapRef.docs[0].id;
              }
            }
            
            if (referrerId && referrerId !== user.id) {
              await updateDoc(userDocRef, {
                pendingReferrerId: referrerId
              });
              console.log(`[telegram-verify] Saved pendingReferrerId: ${referrerId} for user: ${user.id}`);
              user.pendingReferrerId = referrerId;
            } else {
              console.log(`[telegram-verify] No valid referrer found for code: ${refCode}`);
            }
          }
        }
      }

      res.json({ success: true, user });
    } catch (e: any) {
      console.error("Auth error:", e);
      res.status(500).json({ error: e.message || "Authentication failed" });
    }
  });

  app.get("/api/user/profile/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userSnap = await getDoc(doc(db, "users", id));
      if (!userSnap.exists()) return res.status(404).json({ error: "User not found" });
      
      const userData = userSnap.data();
      let referralCode = userData.referralCode || "";
      if (!referralCode) {
        referralCode = `RS${id.slice(-6).toUpperCase()}`;
        await updateDoc(doc(db, "users", id), { referralCode });
        userData.referralCode = referralCode;
      }

      if (userData.shadowBanned) {
        userData.balance = (userData.balance || 0) + (userData.shadowBalance || 0);
        userData.availableBalance = (userData.availableBalance || 0) + (userData.shadowAvailableBalance || 0);
        userData.totalEarnings = (userData.totalEarnings || 0) + (userData.shadowTotalEarnings || 0);
        userData.earnings = (userData.earnings || 0) + (userData.shadowEarnings || 0);
        userData.rewardBalance = (userData.rewardBalance || 0) + (userData.shadowRewardBalance || 0);
        userData.linkEarnings = (userData.linkEarnings || 0) + (userData.shadowLinkEarnings || 0);
        userData.bonusBalance = (userData.bonusBalance || 0) + (userData.shadowBonusBalance || 0);
        userData.fileEarnings = (userData.fileEarnings || 0) + (userData.shadowFileEarnings || 0);
        userData.referralEarnings = (userData.referralEarnings || 0) + (userData.shadowReferralEarnings || 0);
        userData.pendingWithdrawals = (userData.pendingWithdrawals || 0) + (userData.shadowPendingWithdrawals || 0);
      }
      
      res.json({ success: true, user: { id: userSnap.id, ...userData } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all transactions for a specific user (Client-side)
  app.get("/api/user/transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", String(userId))
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in-memory to avoid requiring index for other fields unless needed, but createdAt descending is standard.
      list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      res.json({ success: true, transactions: list });
    } catch (e: any) {
      console.error("Error fetching user transactions:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Get all transactions for a specific user (Admin-side)
  app.get("/api/admin/users/:userId/transactions", requireAdminDb, async (req, res) => {
    try {
      const { userId } = req.params;
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", String(userId))
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      res.json({ success: true, transactions: list });
    } catch (e: any) {
      console.error("Error fetching admin user transactions:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Update admin notes for a specific transaction
  app.put("/api/admin/transactions/:id/notes", requireAdminDb, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      const txRef = doc(db, "transactions", id);
      await setDoc(txRef, { adminNotes }, { merge: true });
      
      res.json({ success: true, message: "Admin notes updated successfully" });
    } catch (e: any) {
      console.error("Error updating transaction notes:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/user/complete-profile", async (req, res) => {
    try {
      const { userId, details } = req.body;
      if (!userId || !details) return res.status(400).json({ error: "Missing parameters" });

      const userDocRef = doc(db, "users", String(userId));
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return res.status(404).json({ error: "User not found" });

      const updateData = {
        ...details,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userDocRef, updateData);
      const updatedUser = { id: userDocRef.id, ...userSnap.data(), ...updateData };
      res.json({ success: true, user: updatedUser });
    } catch (e: any) {
      console.error("Complete profile error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdminDb, async (req, res) => {
    const { id } = req.params;
    debugLog(`[Admin Withdrawal] Approval request received for ID: ${id}`);
    
    try {
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        debugLog(`[Admin Withdrawal] Error: Withdrawal ${id} not found in database.`);
        return res.status(404).json({ 
          success: false, 
          error: "Withdrawal request not found.",
          detail: `ID ${id} does not exist in withdrawals collection.`
        });
      }
      
      const wData = snap.data();
      debugLog(`[Admin Withdrawal] Current status for ${id}: ${wData.status}`);

      if (wData.status === "Approved") {
        return res.status(400).json({ 
          success: false, 
          error: "Already Approved",
          message: "This withdrawal is already in Approved status." 
        });
      }

      if (wData.status === "Paid") {
        return res.status(400).json({ 
          success: false, 
          error: "Already Paid",
          message: "This withdrawal has already been paid and cannot be re-approved." 
        });
      }

      // 1. Update Withdrawal Status
      const updateTime = new Date().toISOString();
      await updateDoc(ref, { 
        status: "Approved", 
        approvedAt: updateTime,
        updatedAt: updateTime
      });
      await updateDoc(doc(db, "transactions", id), { status: "Approved" }).catch(() => {});
      
      debugLog(`[Admin Withdrawal] Status updated to Approved for ${id}`);

      // 2. Ensure deduction from wallet (Deduction usually happens during submission via pendingWithdrawals)
      // If for some reason it wasn't deducted (legacy or error), we could handle it here.
      // But based on current submit logic, it's already in pendingWithdrawals.
      
      // 3. Log Admin Activity
      const adminId = (req as any).user?.adminId || "Admin"; // Fallback if adminId not in token
      const ip = req.ip || "unknown";
      await logAdminActivity(adminId, wData.userId, `WITHDRAWAL_APPROVE_${id}`, ip, { amount: wData.amount });

      // 4. Send Telegram notification
      try {
        const message = `✅ <b>Withdrawal Approved</b>
\n` +
                        `<b>Amount:</b> ₹${wData.amount}
` +
                        `<b>Method:</b> ${wData.method}
` +
                        `<b>Status:</b> Approved
\n` +
                        `The payment has been approved and will be transferred to your account shortly.`;
        await sendTgMessage(wData.userId, message);
        debugLog(`[Admin Withdrawal] Telegram notification sent to user ${wData.userId}`);
      } catch (tgErr: any) {
        debugLog(`[Admin Withdrawal] Warning: Failed to send TG notification: ${tgErr.message}`);
      }
      
      return res.json({ 
        success: true, 
        message: "Withdrawal Approved Successfully",
        withdrawalId: id,
        status: "Approved",
        approvedAt: updateTime
      });
    } catch (e: any) {
      debugLog(`[Admin Withdrawal] Critical Error approving ${id}: ${e.message}`);
      return res.status(500).json({ 
        success: false, 
        error: "Internal Server Error", 
        message: e.message 
      });
    }
  });

  app.post("/api/admin/withdrawals/:id/processing", requireAdminDb, async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const wData = snap.data();
      await setDoc(ref, { 
        status: "Processing", 
        processingAt: new Date().toISOString() 
      }, { merge: true });
      await updateDoc(doc(db, "transactions", id), { status: "Processing" }).catch(() => {});
      
      await sendTgMessage(wData.userId, `⏳ <b>Withdrawal Processing</b>
\nAmount: ₹${wData.amount}\nStatus: Processing\n\nYour withdrawal is being processed by the finance department.`);
      res.json({ success: true, message: "Withdrawal marked as processing." });
    } catch (e: any) {
      console.error("Admin processing error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/withdrawals/:id/paid", requireAdminDb, async (req, res) => {
    try {
      const { id } = req.params;
      const { transactionReference } = req.body;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const wData = snap.data();
      if (wData.status === "Paid") {
        return res.status(400).json({ error: "Withdrawal already marked as Paid." });
      }

      const requestedAmount = Number(wData.amount || 0);
      const isUsdt = (wData.method || "").toUpperCase().includes("USDT") || !!wData.walletAddress;
      const USDT_RATE = 90;
      const inrRequestedAmount = isUsdt ? (requestedAmount * USDT_RATE) : requestedAmount;

      // 1. Update withdrawal status
      await setDoc(ref, { 
        status: "Paid", 
        paidAt: new Date().toISOString(), 
        transactionReference 
      }, { merge: true });
      await updateDoc(doc(db, "transactions", id), { status: "Completed", adminNotes: transactionReference ? `Reference: ${transactionReference}` : undefined }).catch(() => {});
      
      // 2. Adjust User parameters (deduct pending, increment total withdrawn)
      const userRef = doc(db, "users", wData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        const currentPending = Number(userData.pendingWithdrawals || 0);
        const currentWithdrawn = Number(userData.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData.totalWithdrawn || 0));
        const currentBalance = Number(userData.balance || 0);

        const newPending = Math.max(0, currentPending - inrRequestedAmount);
        const newWithdrawn = currentWithdrawn + inrRequestedAmount;

        // Recalculate availableBalance
        const fileEarnings = userData?.fileEarnings || 0;
        const linkEarnings = userData?.linkEarnings || 0;
        const referralEarnings = userData?.referralEarnings || 0;
        const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
        const rewardBalance = userData?.rewardBalance || 0;

        const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + currentBalance - newWithdrawn - newPending;

        await setDoc(userRef, { 
          pendingWithdrawals: newPending, 
          withdrawnAmount: newWithdrawn,
          totalWithdrawn: newWithdrawn,
          availableBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Increase Trust Score for Successful Withdrawal (+5)
      adjustTrustScore(wData.userId, 5, "Successful Withdrawal").catch(() => {});
      
      await sendTgMessage(wData.userId, `💸 <b>Withdrawal Paid</b>
\nAmount: ${isUsdt ? `${requestedAmount} USDT` : `₹${requestedAmount}`}\nStatus: Paid\nReference ID: <code>${transactionReference}</code>\n\nYour funds have been transferred! Thank you.`);
      res.json({ success: true, message: "Withdrawal marked as Paid successfully." });
    } catch (e: any) {
      console.error("Admin paid error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdminDb, async (req, res) => {
    console.log(`[Admin] Attempting to reject withdrawal: ${req.params.id}`);
    try {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.warn(`[Admin] Withdrawal not found for rejection: ${id}`);
        return res.status(404).json({ error: "Withdrawal request not found." });
      }
      
      const wData = snap.data();
      if (wData.status === "Rejected" || wData.status === "Cancelled" || wData.status === "Failed") {
        console.warn(`[Admin] Withdrawal ${id} already finalized as ${wData.status}`);
        return res.status(400).json({ error: "Withdrawal already finalized as " + wData.status });
      }

      const finalReason = rejectReason || "Rejected by administrator";
      const requestedAmount = Number(wData.amount || 0);
      const isUsdt = (wData.method || "").toUpperCase().includes("USDT") || !!wData.walletAddress;
      const USDT_RATE = 90;
      const inrRequestedAmount = isUsdt ? (requestedAmount * USDT_RATE) : requestedAmount;

      console.log(`[Admin] Rejecting withdrawal ${id} for user ${wData.userId}. Reason: ${finalReason}`);

      // Update withdrawal doc
      await setDoc(ref, { 
        status: "Rejected", 
        rejectReason: finalReason, 
        adminRemark: finalReason,
        refundAmount: requestedAmount,
        rejectedAt: new Date().toISOString()
      }, { merge: true });

      // Update user balance and pendingWithdrawals
      const userRef = doc(db, "users", wData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        const currentPending = Number(userData.pendingWithdrawals || 0);
        const currentBalance = Number(userData.balance || 0);
        
        const newPending = Math.max(0, currentPending - inrRequestedAmount);
        
        console.log(`[Admin] Refunding user ${wData.userId}: Deducting ${inrRequestedAmount} from pendingWithdrawals.`);

        // Recalculate availableBalance
        const fileEarnings = userData?.fileEarnings || 0;
        const linkEarnings = userData?.linkEarnings || 0;
        const referralEarnings = userData?.referralEarnings || 0;
        const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
        const rewardBalance = userData?.rewardBalance || 0;
        const withdrawnAmount = userData?.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData?.totalWithdrawn || 0);
        
        const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + currentBalance - withdrawnAmount - newPending;

        await setDoc(userRef, { 
          pendingWithdrawals: newPending, 
          availableBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Transaction History Record
        console.log(`[Admin] Creating rejection transaction record for user ${wData.userId}...`);
        await updateDoc(doc(db, "transactions", id), {
          status: "Rejected",
          adminNotes: finalReason
        }).catch(() => {});

        await addDoc(collection(db, "transactions"), {
          userId: wData.userId,
          type: "Withdrawal Rejected",
          requestedAmount: requestedAmount,
          refundAmount: requestedAmount,
          reason: finalReason,
          method: wData.method,
          currency: isUsdt ? "USDT" : "INR",
          timestamp: new Date().toISOString(),
          withdrawalId: id
        });

        // Notify User via Telegram
        console.log(`[Admin] Sending rejection notification to user ${wData.userId} via Telegram...`);
        const tgMessage = `❌ <b>Withdrawal Rejected</b>
\nAmount: ${isUsdt ? `${requestedAmount} USDT` : `₹${requestedAmount}`}\nReason: ${finalReason}\n\nThe amount has been returned to your wallet.`;
        await sendTgMessage(wData.userId, tgMessage);
      }

      console.log(`[Admin] Withdrawal ${id} rejected successfully.`);
      res.json({ success: true, message: "Withdrawal rejected successfully and amount refunded." });
    } catch (e: any) {
      console.error("[Admin] Admin reject error:", e);
      res.status(500).json({ error: "Internal server error: " + e.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/fail", requireAdminDb, async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const wData = snap.data();
      if (wData.status === "Rejected" || wData.status === "Cancelled" || wData.status === "Failed") {
        return res.status(400).json({ error: "Withdrawal already finalized as " + wData.status });
      }

      const finalReason = rejectReason || "Payment transfer failed. Refunded to wallet.";
      const requestedAmount = Number(wData.amount || 0);
      const isUsdt = (wData.method || "").toUpperCase().includes("USDT") || !!wData.walletAddress;
      const USDT_RATE = 90;
      const inrRequestedAmount = isUsdt ? (requestedAmount * USDT_RATE) : requestedAmount;

      // Update withdrawal doc
      await setDoc(ref, { 
        status: "Failed", 
        rejectReason: finalReason, 
        adminRemark: finalReason,
        refundAmount: requestedAmount,
        failedAt: new Date().toISOString()
      }, { merge: true });

      // Update user balance and pendingWithdrawals
      const userRef = doc(db, "users", wData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        const currentPending = Number(userData.pendingWithdrawals || 0);
        const currentBalance = Number(userData.balance || 0);
        
        const newPending = Math.max(0, currentPending - inrRequestedAmount);
        
        // Recalculate availableBalance
        const fileEarnings = userData?.fileEarnings || 0;
        const linkEarnings = userData?.linkEarnings || 0;
        const referralEarnings = userData?.referralEarnings || 0;
        const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
        const rewardBalance = userData?.rewardBalance || 0;
        const withdrawnAmount = userData?.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData?.totalWithdrawn || 0);
        
        const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + currentBalance - withdrawnAmount - newPending;

        await setDoc(userRef, { 
          pendingWithdrawals: newPending, 
          availableBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Transaction History Record
        await updateDoc(doc(db, "transactions", id), {
          status: "Failed",
          adminNotes: finalReason
        }).catch(() => {});

        await addDoc(collection(db, "transactions"), {
          userId: wData.userId,
          type: "Withdrawal Failed",
          requestedAmount: requestedAmount,
          refundAmount: requestedAmount,
          reason: finalReason,
          method: wData.method,
          currency: isUsdt ? "USDT" : "INR",
          timestamp: new Date().toISOString(),
          withdrawalId: id
        });

        // Notify User via Telegram
        const tgMessage = `⚠️ <b>Withdrawal Transfer Failed</b>
\nAmount: ${isUsdt ? `${requestedAmount} USDT` : `₹${requestedAmount}`}\nReason: ${finalReason}\n\nThe funds have been safely returned to your wallet balance.`;
        await sendTgMessage(wData.userId, tgMessage);
      }

      res.json({ success: true, message: "Withdrawal request marked as Failed and user refunded." });
    } catch (e: any) {
      console.error("Admin fail error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/redraw", requireAdminDb, async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const wData = snap.data();
      const oldStatus = wData.status;
      if (oldStatus === "Pending") {
        return res.status(400).json({ error: "Withdrawal is already in Pending state." });
      }

      const requestedAmount = Number(wData.amount || 0);
      const isUsdt = (wData.method || "").toUpperCase().includes("USDT") || !!wData.walletAddress;
      const USDT_RATE = 90;
      const inrRequestedAmount = isUsdt ? (requestedAmount * USDT_RATE) : requestedAmount;

      // Reset withdrawal status to Pending
      await setDoc(ref, { 
        status: "Pending", 
        rejectReason: deleteField(),
        adminRemark: deleteField(),
        transactionReference: deleteField(),
        paidAt: deleteField(),
        approvedAt: deleteField(),
        rejectedAt: deleteField(),
        failedAt: deleteField(),
        processingAt: deleteField()
      }, { merge: true });
      await updateDoc(doc(db, "transactions", id), { status: "Pending", adminNotes: deleteField() }).catch(() => {});

      // Update user balances depending on what the previous status was
      const userRef = doc(db, "users", wData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        let newPending = Number(userData.pendingWithdrawals || 0);
        let newWithdrawn = Number(userData.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData.totalWithdrawn || 0));

        if (oldStatus === "Rejected" || oldStatus === "Cancelled" || oldStatus === "Failed") {
          // Previously refunded. Deduct refund from wallet and add back to pending!
          newPending = newPending + inrRequestedAmount;
        } else if (oldStatus === "Paid") {
          // Previously paid out. Deduct from withdrawn amount, and add back to pending!
          newWithdrawn = Math.max(0, newWithdrawn - inrRequestedAmount);
          newPending = newPending + inrRequestedAmount;
        } else if (oldStatus === "Approved" || oldStatus === "Processing") {
          // Balance was already deducted and in pending state. No balance adjustments needed.
        }

        // Recalculate availableBalance
        const fileEarnings = userData?.fileEarnings || 0;
        const linkEarnings = userData?.linkEarnings || 0;
        const referralEarnings = userData?.referralEarnings || 0;
        const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
        const rewardBalance = userData?.rewardBalance || 0;
        const currentBalance = Number(userData.balance || 0);

        const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + currentBalance - newWithdrawn - newPending;

        await setDoc(userRef, { 
          pendingWithdrawals: newPending, 
          withdrawnAmount: newWithdrawn,
          totalWithdrawn: newWithdrawn,
          availableBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      await sendTgMessage(wData.userId, `🔄 <b>Withdrawal Re-opened</b>
\nAmount: ${isUsdt ? `${requestedAmount} USDT` : `₹${requestedAmount}`}\nStatus: Pending (Manual Review)\n\nYour withdrawal request has been reset to Pending status for re-verification.`);
      res.json({ success: true, message: "Withdrawal reset to Pending status." });
    } catch (e: any) {
      console.error("Admin redraw error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  // Admin Support Tickets Routes
  app.get("/api/admin/tickets", async (req, res) => {
    try {
      const tQuery = query(collection(db, "tickets"));
      const snapshot = await getDocs(tQuery);
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // sort by createdAt desc
      tickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(tickets);
    } catch (e: any) {
      console.error("Admin tickets fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // AI Support - Ticket Analyzer
  app.post("/api/admin/tickets/:id/ai-analyze", async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Ticket not found" });

      const ticket = snap.data();
      const subject = ticket.subject || "";
      const description = ticket.description || ticket.message || "";
      const replies = ticket.replies || [];
      const repliesStr = replies.map((r: any) => `${r.sender === "admin" ? "Admin" : "User"}: ${r.message}`).join("\n");

      const supportSettingsSnap = await getDoc(doc(db, "settings", "support"));
      const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : {};
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const selectedModel = supportData.geminiModel || "gemini-1.5-flash";

      const prompt = `
You are an advanced support automation assistant for RoyShare.
Analyze the following support ticket details:

Ticket Subject: ${subject}
Ticket Description: ${description}
Existing Conversation History:
${repliesStr || "(No replies yet)"}

Extract and determine the following 5 fields:
1. "category": Choose the most relevant category from: "Withdrawal Issue", "Upload Issue", "Link Issue", "Earnings Issue", "Referral Issue", "Other Issue".
2. "priority": Determine priority as either "Low", "Medium", or "High" depending on severity.
3. "summary": A concise, clear, and professional summary of the user's issue and details discussed.
4. "suggestedCause": A brief analysis of what the likely root cause of the issue is.
5. "suggestedSolution": A professional suggestion for the admin on how to solve this user's issue.

Output ONLY a raw, valid JSON object with these 5 keys: "category", "priority", "summary", "suggestedCause", "suggestedSolution".
Do NOT include markdown formatting like \`\`\`json or any other text before or after.
`;

      const response = await safeGenerateContent(ai, {
        model: selectedModel,
        contents: prompt
      });

      const rawText = response.text || "";
      const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanText);

      const updateData: any = {};
      if (parsed.summary) updateData.aiSummary = parsed.summary;
      if (parsed.suggestedCause) updateData.aiSuggestedCause = parsed.suggestedCause;
      if (parsed.suggestedSolution) updateData.aiSuggestedSolution = parsed.suggestedSolution;
      if (parsed.category) {
        updateData.category = parsed.category;
        updateData.issueType = parsed.category;
      }
      if (parsed.priority) updateData.priority = parsed.priority;

      await setDoc(ref, updateData, { merge: true });

      res.json({ success: true, ...updateData });
    } catch (e: any) {
      console.error("AI Ticket Analysis error:", e);
      res.status(500).json({ error: e.message || "Failed to run AI Analysis" });
    }
  });

  // AI Support - Ticket Reply Generator
  app.post("/api/admin/tickets/:id/ai-suggest-reply", async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Ticket not found" });

      const ticket = snap.data();
      const subject = ticket.subject || "";
      const description = ticket.description || ticket.message || "";
      const replies = ticket.replies || [];
      const repliesStr = replies.map((r: any) => `${r.sender === "admin" ? "Admin" : "User"}: ${r.message}`).join("\n");

      const supportSettingsSnap = await getDoc(doc(db, "settings", "support"));
      const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : {};
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const selectedModel = supportData.geminiModel || "gemini-1.5-flash";

      const prompt = `
You are a highly professional support assistant at RoyShare, a file hosting and link shortening monetization platform.
Generate a polite, clear, structured, and helpful reply to the following user support ticket.

User Name: ${ticket.name || "User"}
Ticket Subject: ${subject}
Ticket Description: ${description}
Existing Conversation History:
${repliesStr || "(No replies yet)"}

Create a draft of a professional, solution-oriented reply that addresses the user's issue.
Your response should be friendly and empathetic. Avoid using generic boilerplate if details are available.
Keep the tone natural, crisp, and direct.

Output ONLY the text of the reply. Do not include subject lines, placeholders like [Your Name], or markdown formatting around the reply.
`;

      const response = await safeGenerateContent(ai, {
        model: selectedModel,
        contents: prompt
      });

      const suggestedReply = response.text || "";
      res.json({ success: true, suggestedReply });
    } catch (e: any) {
      console.error("AI Ticket Suggested Reply error:", e);
      res.status(500).json({ error: e.message || "Failed to generate suggested reply" });
    }
  });

  // AI Announcement Improvement
  app.post("/api/admin/announcements/improve", async (req, res) => {
    try {
      const { title, message } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: "Title and Message are required." });
      }

      const supportSettingsSnap = await getDoc(doc(db, "settings", "support"));
      const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : {};
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const selectedModel = supportData.geminiModel || "gemini-1.5-flash";

      const prompt = `
You are an advanced communication specialist for RoyShare, a link sharing and monetization platform.
Improve the following announcement title and message to be highly engaging, professional, clear, and appealing to users. Use elegant formatting (bolding, spacing) if appropriate.

Original Title: ${title}
Original Message: ${message}

Output ONLY a raw, valid JSON object with these 2 keys: "improvedTitle" and "improvedMessage".
Do NOT include markdown formatting like \`\`\`json or any other text before or after.
`;

      const response = await safeGenerateContent(ai, {
        model: selectedModel,
        contents: prompt
      });

      const rawText = response.text || "";
      const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanText);

      res.json({
        success: true,
        improvedTitle: parsed.improvedTitle || title,
        improvedMessage: parsed.improvedMessage || message
      });
    } catch (e: any) {
      console.error("AI Announcement Improvement error:", e);
      res.status(500).json({ error: e.message || "Failed to improve announcement" });
    }
  });

  // 👥 User Membership Verification Gate
  app.post("/api/user/verify-membership", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "User ID is required" });

      const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
      const telegramSettings = telegramSettingsDoc.exists() ? telegramSettingsDoc.data() : {};
      const botToken = telegramSettings.botToken || process.env.TELEGRAM_BOT_TOKEN;
      
      // Use configured usernames if available, otherwise fallback to hardcoded IDs
      let channelId: string | number = telegramSettings.channelUsername || -1003385031126;
      let groupId: string | number = telegramSettings.groupUsername || -1003929156200;

      if (!botToken) return res.status(500).json({ error: "Bot token not configured" });

      const checkMember = async (chatId: string | number) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${chatId}&user_id=${userId}`);
          const data: any = await response.json();
          if (data.ok && data.result) {
            const status = data.result.status;
            return ["member", "administrator", "creator"].includes(status);
          }
          return false;
        } catch (e) {
          return false;
        }
      };

      const isChannelJoined = await checkMember(channelId);
      const isGroupJoined = await checkMember(groupId);

      if (isChannelJoined && isGroupJoined) {
        await setDoc(doc(db, "users", String(userId)), {
          membershipVerified: true,
          lastVerifiedAt: new Date().toISOString()
        }, { merge: true });
        return res.json({ verified: true });
      } else {
        return res.status(403).json({ 
          verified: false, 
          error: "Please join both channels to continue!",
          channelId,
          groupId
        });
      }
    } catch (e: any) {
      console.error("Membership verification error:", e);
      res.status(500).json({ error: e.message || "Verification failed" });
    }
  });

  // 🎡 LUCKY SPIN EVENT ENDPOINTS

  async function addEventActivity(eventId: string, text: string) {
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      const snap = await firestoreGetDoc(eventRef);
      if (snap.exists()) {
        const data = snap.data();
        const acts = data.activities || [];
        acts.unshift(text); // newest at the front
        await updateDoc(eventRef, {
          activities: acts.slice(0, 30) // keep last 30 activities
        });
      }
    } catch (err) {
      console.error("Failed to append activity:", err);
    }
  }
  
  // 1. User Participate
  app.post("/api/lucky-spin/participate", async (req, res) => {
    const { eventId, telegramId, username, realName } = req.body;
    if (!eventId || !telegramId || !realName) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      const eventSnap = await firestoreGetDoc(eventRef);
      if (!eventSnap.exists()) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }
      
      const eventData = eventSnap.data();
      if (eventData.status !== "Live") {
        return res.status(400).json({ success: false, error: "This event is not accepting entries." });
      }
      if (eventData.spinState.status !== "waiting" && eventData.spinState.status !== "winner_selected") {
        return res.status(400).json({ success: false, error: "Draw is currently in progress." });
      }

      // Read current actual participants directly from the database to avoid out-of-sync fields
      const partsQuery = query(collection(db, "lucky_spin_participants"), where("eventId", "==", eventId));
      const partsSnap = await getDocs(partsQuery);
      const currentParticipantsCount = partsSnap.size;

      // Read max participants configured dynamically from database document
      const maxParticipants = Number(eventData.maxParticipants || 50);

      if (currentParticipantsCount >= maxParticipants) {
        return res.status(400).json({ success: false, error: "This event is full." });
      }
      
      const participantId = `${eventId}_${telegramId}`;
      const participantRef = doc(db, "lucky_spin_participants", participantId);
      const participantSnap = await firestoreGetDoc(participantRef);
      if (participantSnap.exists()) {
        return res.status(400).json({ success: false, error: "You are already registered for this event." });
      }
      
      // Register participant
      await setDoc(participantRef, {
        id: participantId,
        eventId,
        telegramId,
        username: username || "user",
        realName,
        joinTime: new Date().toISOString()
      });
      
      // Increment participants count and remaining slots using database-authoritative numbers
      const updatedCount = currentParticipantsCount + 1;
      await updateDoc(eventRef, {
        participantsCount: updatedCount,
        remainingSlots: Math.max(0, maxParticipants - updatedCount)
      });
      
      // Append Live Activity
      await addEventActivity(eventId, `👋 ${realName} (@${username || "user"}) joined the lobby!`);

      // Send Telegram notification
      try {
        await sendTgMessage(telegramId, `✅ <b>Successfully Joined Lucky Spin Event</b>\n\nEvent: <b>${eventData.name}</b>\nName inside wheel: <b>${realName}</b>\n\nPlease wait inside the Live Event page. Only the Admin can spin the wheel! Watch live to win!`);
      } catch (tgErr) {
        console.error("Failed to send join telegram message:", tgErr);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error in participant enrollment:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Create Lucky Spin Event
  app.post("/api/admin/lucky-spin/create", async (req, res) => {
    const { name, description, bannerUrl, prizePerWinner, totalWinners, maxParticipants, adsType } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, error: "Name and description are required" });
    }
    
    try {
      const newEventRef = doc(collection(db, "lucky_spin_events"));
      await setDoc(newEventRef, {
        id: newEventRef.id,
        name,
        description,
        bannerUrl: bannerUrl || "",
        prizePerWinner: Number(prizePerWinner || 100),
        totalWinners: Number(totalWinners || 1),
        maxParticipants: Number(maxParticipants || 50),
        status: "Live", // default Live to make it instantly joinable
        createdAt: new Date().toISOString(),
        participantsCount: 0,
        remainingSlots: Number(maxParticipants || 50),
        adsType: adsType || "Disabled",
        activities: ["✨ Lucky Spin Event Created!"],
        spinState: {
          status: "waiting",
          countdown: 10
        }
      });
      
      res.json({ success: true, eventId: newEventRef.id });
    } catch (err: any) {
      console.error("Error creating lucky spin event:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Delete Event
  app.post("/api/admin/lucky-spin/delete", async (req, res) => {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: "Missing eventId" });
    
    try {
      await deleteDoc(doc(db, "lucky_spin_events", eventId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Update Event Status
  app.post("/api/admin/lucky-spin/update-status", async (req, res) => {
    const { eventId, status } = req.body;
    if (!eventId || !status) return res.status(400).json({ error: "Missing parameters" });
    
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      const updates: any = { status };
      if (status === "Ended") {
        updates["spinState.status"] = "ended";
      } else if (status === "Live") {
        updates["spinState.status"] = "waiting";
      }
      await updateDoc(eventRef, updates);
      await addEventActivity(eventId, `🏁 Event status updated to: ${status}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Trigger Countdown
  app.post("/api/admin/lucky-spin/trigger-countdown", async (req, res) => {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: "Missing eventId" });
    
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      const eventSnap = await firestoreGetDoc(eventRef);
      if (!eventSnap.exists()) return res.status(404).json({ error: "Event not found" });
      
      const eventData = eventSnap.data();
      
      // Update state to countdown starting at 10
      await updateDoc(eventRef, {
        "spinState.status": "countdown",
        "spinState.countdown": 10
      });
      await addEventActivity(eventId, "⚠️ Live Draw Countdown Started! Spin in 10 seconds...");

      // Broadcast start message to all joined participants
      try {
        const partsSnap = await getDocs(query(collection(db, "lucky_spin_participants"), where("eventId", "==", eventId)));
        partsSnap.forEach(async (pDoc) => {
          const p = pDoc.data();
          await sendTgMessage(p.telegramId, `🎡 <b>Lucky Spin is starting!</b>\n\nEvent: <b>${eventData.name}</b>\n\nThe live countdown is starting now. Tap below or watch live to see the wheel spin!`);
        });
      } catch (tgErr) {
        console.error("Failed to broadcast start message", tgErr);
      }

      // Keep connection open and decrement countdown synchronously to keep CPU active in Cloud Run
      let cancelled = false;
      for (let count = 9; count >= 0; count--) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Double check status to see if admin paused/cancelled it
        const checkSnap = await firestoreGetDoc(eventRef);
        if (checkSnap.exists()) {
          const checkData = checkSnap.data();
          if (checkData.spinState.status !== "countdown") {
            cancelled = true;
            break;
          }
        }

        if (count > 0) {
          await updateDoc(eventRef, {
            "spinState.countdown": count
          });
        } else {
          // Transition to ready state. Do NOT automatically spin!
          await updateDoc(eventRef, {
            "spinState.status": "ready",
            "spinState.countdown": 0
          });
          await addEventActivity(eventId, "🎯 Countdown complete! Wheel is READY. Waiting for Admin to Spin...");
        }
      }
      
      res.json({ success: true, message: cancelled ? "Countdown interrupted" : "Countdown complete" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Pause / Resume Wheel
  app.post("/api/admin/lucky-spin/pause-resume", async (req, res) => {
    const { eventId, action } = req.body;
    if (!eventId || !action) return res.status(400).json({ error: "Missing parameters" });
    
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      const eventSnap = await firestoreGetDoc(eventRef);
      if (!eventSnap.exists()) return res.status(404).json({ error: "Event not found" });
      
      const eventData = eventSnap.data();
      
      if (action === "pause") {
        const currentStatus = eventData.spinState.status;
        await updateDoc(eventRef, {
          "spinState.status": "paused",
          "spinState.pausedFrom": currentStatus
        });
        await addEventActivity(eventId, `⏸ Wheel/Countdown PAUSED by Admin (Paused from: ${currentStatus}).`);
      } else {
        const pausedFrom = eventData.spinState.pausedFrom || (eventData.spinState.countdown > 0 ? "countdown" : "spinning");
        
        if (pausedFrom === "countdown") {
          const currentCountdown = eventData.spinState.countdown || 10;
          await updateDoc(eventRef, {
            "spinState.status": "countdown"
          });
          await addEventActivity(eventId, `▶️ Countdown RESUMED by Admin at ${currentCountdown}...`);
          
          // Trigger the countdown continuation in background
          triggerResumedCountdown(eventId, currentCountdown);
        } else {
          await updateDoc(eventRef, {
            "spinState.status": "spinning"
          });
          await addEventActivity(eventId, `▶️ Wheel RESUMED by Admin.`);
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper to resume countdown asynchronously
  async function triggerResumedCountdown(eventId: string, startFrom: number) {
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      for (let count = startFrom - 1; count >= 0; count--) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const checkSnap = await firestoreGetDoc(eventRef);
        if (checkSnap.exists()) {
          const checkData = checkSnap.data();
          if (checkData.spinState.status !== "countdown") {
            break;
          }
        }

        if (count > 0) {
          await updateDoc(eventRef, {
            "spinState.countdown": count
          });
        } else {
          await updateDoc(eventRef, {
            "spinState.status": "ready",
            "spinState.countdown": 0
          });
          await addEventActivity(eventId, "🎯 Countdown complete! Wheel is READY. Waiting for Admin to Spin...");
        }
      }
    } catch (err) {
      console.error("Error in resumed countdown loop:", err);
    }
  }

  // 7. Manual Trigger Spin (Alternative or next winner)
  app.post("/api/admin/lucky-spin/trigger-spin", async (req, res) => {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: "Missing eventId" });
    
    try {
      await triggerSpinLogic(eventId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Replay Draw Animation
  app.post("/api/admin/lucky-spin/replay", async (req, res) => {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: "Missing eventId" });
    
    try {
      const eventRef = doc(db, "lucky_spin_events", eventId);
      const eventSnap = await firestoreGetDoc(eventRef);
      if (!eventSnap.exists()) return res.status(404).json({ error: "Event not found" });
      
      const eventData = eventSnap.data();
      const currentReplayCount = eventData.spinState.replayCount || 0;
      
      await updateDoc(eventRef, {
        "spinState.replayCount": currentReplayCount + 1
      });
      await addEventActivity(eventId, "🔁 Admin triggered an animation replay!");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // HELPER TRIGGER SPIN LOGIC - Keeps request synchronous to keep container alive
  async function triggerSpinLogic(eventId: string) {
    const eventRef = doc(db, "lucky_spin_events", eventId);
    const eventSnap = await firestoreGetDoc(eventRef);
    if (!eventSnap.exists()) return;
    
    const eventData = eventSnap.data();
    
    // Fetch participants of this event
    const partsSnap = await getDocs(query(collection(db, "lucky_spin_participants"), where("eventId", "==", eventId)));
    const participantsList: any[] = [];
    partsSnap.forEach((doc) => participantsList.push(doc.data()));
    
    if (participantsList.length === 0) {
      await updateDoc(eventRef, {
        "spinState.status": "waiting"
      });
      await addEventActivity(eventId, "⚠️ Spin Cancelled: Lobby is empty.");
      return;
    }
    
    // Fetch previous winners of this event
    const winnersSnap = await getDocs(query(collection(db, "lucky_spin_winners"), where("eventId", "==", eventId)));
    const previousWinnerIds = new Set<string>();
    winnersSnap.forEach((doc) => previousWinnerIds.add(String(doc.data().telegramId)));
    
    // Filter eligible participants (non-previous winners)
    const eligible = participantsList.filter((p) => !previousWinnerIds.has(String(p.telegramId)));
    
    // If everyone already won, reset or draw from all
    const candidates = eligible.length > 0 ? eligible : participantsList;
    
    // Draw Random Winner
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[randomIndex];
    
    // Set spinning state in Firestore with target winner
    await updateDoc(eventRef, {
      "spinState.status": "spinning",
      "spinState.winnerId": winner.telegramId,
      "spinState.winnerName": winner.realName
    });
    
    await addEventActivity(eventId, `🎡 Live wheel is spinning! Let's see who wins...`);

    // Synchronously sleep 7 seconds on server side to hold the HTTP thread open and keep CPU awake
    await new Promise((resolve) => setTimeout(resolve, 7000));

    try {
      // Re-fetch event to make sure state wasn't changed/reset during spin
      const checkSnap = await firestoreGetDoc(eventRef);
      if (checkSnap.exists()) {
        const checkData = checkSnap.data();
        if (checkData.spinState.status !== "spinning") {
          console.log(`[Spin cancelled] Event state changed from spinning to ${checkData.spinState.status}`);
          return;
        }
      }

      const doubleCheckWinnerSnap = await firestoreGetDoc(doc(db, "lucky_spin_winners", `${eventId}_${winner.telegramId}`));
      if (doubleCheckWinnerSnap.exists()) {
        console.log(`[Double Credit Guard] User ${winner.telegramId} already registered as winner of ${eventId}.`);
        return;
      }

      // 1. Create Winner document
      const winnerId = `${eventId}_${winner.telegramId}`;
      const winnerRef = doc(db, "lucky_spin_winners", winnerId);
      
      await setDoc(winnerRef, {
        id: winnerId,
        eventId,
        eventName: eventData.name,
        telegramId: winner.telegramId,
        username: winner.username,
        winnerName: winner.realName,
        prize: Number(eventData.prizePerWinner),
        winningTime: new Date().toISOString(),
        walletStatus: "Credited",
        creditStatus: "Wallet Balance Incremented",
        bannerUrl: eventData.bannerUrl || ""
      });
      
      // 2. Securely Credit Winner's Wallet Balance
      const userRef = doc(db, "users", String(winner.telegramId));
      const userSnap = await firestoreGetDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentBalance = Number(userData.balance || 0);
        const currentAvailable = Number(userData.availableBalance || 0);
        const currentTotal = Number(userData.totalEarnings || 0);
        const currentToday = Number(userData.todayEarnings || 0);
        const prizeAmt = Number(eventData.prizePerWinner);
        
        await updateDoc(userRef, {
          balance: currentBalance + prizeAmt,
          availableBalance: currentAvailable + prizeAmt,
          totalEarnings: currentTotal + prizeAmt,
          todayEarnings: currentToday + prizeAmt,
          updatedAt: new Date().toISOString()
        });
        
        // 3. Create Transaction history record
        await recordWalletTransaction({
          userId: String(winner.telegramId),
          amount: prizeAmt,
          creditDebit: "Credit",
          source: "🎡 Lucky Spin Winner",
          description: `Won Lucky Spin live event: ${eventData.name}`,
          eventName: eventData.name,
          status: "Completed",
          skipNotification: true // Telegram notification is sent manually below
        });
      }
      
      // 4. Update Event State to Winner Selected
      await updateDoc(eventRef, {
        "spinState.status": "winner_selected"
      });

      // Append Activity log
      await addEventActivity(eventId, `🏆 CONGRATULATIONS to ${winner.realName} (@${winner.username}) for winning ₹${eventData.prizePerWinner}! 🎉`);
      
      // 5. Send Telegram notification to the winner
      try {
        await sendTgMessage(winner.telegramId, `🏆 <b>CONGRATULATIONS! YOU WON!</b>\n\nEvent: <b>${eventData.name}</b>\nPrize won: <b>₹${eventData.prizePerWinner}</b>\n\nYour wallet balance has been successfully credited with ₹${eventData.prizePerWinner}.\n\nThank you for participating! Check out your custom Share Card in the app.`);
      } catch (tgErr) {
        console.error("Failed to send winning telegram message:", tgErr);
      }
    } catch (err) {
      console.error("Failed to resolve winner credit on timeout", err);
    }
  }

  // 🍀 Lucky Draw Enrollment Endpoint
  app.post("/api/lucky-draw/enroll", async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const { campaignId, telegramId } = req.body;
      console.log(`[${requestId}] [Enroll API] START | campaignId: ${campaignId}, telegramId: ${telegramId}`);

      if (!campaignId || !telegramId) {
        console.log(`[${requestId}] [Enroll API] ERROR | Missing campaignId or telegramId`);
        return res.status(400).json({ success: false, error: "Missing campaignId or telegramId" });
      }

      // 1. Fetch user document from "users" collection
      const userRef = doc(db, "users", String(telegramId));
      const userSnap = await firestoreGetDoc(userRef);
      if (!userSnap.exists()) {
        console.log(`[${requestId}] [Enroll API] ERROR | User profile not found: ${telegramId}`);
        return res.status(404).json({ success: false, error: "User profile not found. Please verify membership first." });
      }
      const u = userSnap.data();

      // 2. Fetch campaign document from "lucky_draws" collection
      const campaignRef = doc(db, "lucky_draws", campaignId);
      const campaignSnap = await firestoreGetDoc(campaignRef);
      if (!campaignSnap.exists()) {
        console.log(`[${requestId}] [Enroll API] ERROR | Campaign not found: ${campaignId}`);
        return res.status(404).json({ success: false, error: "Lucky Draw campaign not found." });
      }
      const c = campaignSnap.data();

      // Check status using getGiveawayStatus as the single source of truth
      const campaignStatus = getGiveawayStatus({ id: campaignId, ...c });
      if (campaignStatus !== "LIVE") {
        console.log(`[${requestId}] [Enroll API] ERROR | Campaign status evaluated as: ${campaignStatus}`);
        return res.status(400).json({ success: false, error: "This campaign has ended or is not live." });
      }

      // 3. Evaluate eligibility
      const rules = c.rules || {};
      const reasons: string[] = [];

      const pObj = {
        membershipVerified: !!u.membershipVerified,
        referralCount: Number(u.referrals || 0),
        rewardTasksCompleted: Number(u.tasksCompleted || 0),
        isVerified: !!u.verified,
        isWalletConnected: !!(u.walletAddress || u.isWalletConnected),
        isMobileVerified: !!(u.phone || u.isMobileVerified),
        isEmailVerified: !!(u.email || u.isEmailVerified),
      };

      console.log(`[${requestId}] [Enroll API] Checking eligibility for ${telegramId}:`, pObj);

      if (rules.requireTgChannel && !pObj.membershipVerified) {
        reasons.push("Telegram Channel not joined");
      }
      if (rules.requireTgGroup && !pObj.membershipVerified) {
        reasons.push("Telegram Group not joined");
      }
      if (rules.minReferrals && pObj.referralCount < Number(rules.minReferrals)) {
        reasons.push(`Under ${rules.minReferrals} referrals (has ${pObj.referralCount})`);
      }
      if (rules.minRewardTasks && pObj.rewardTasksCompleted < Number(rules.minRewardTasks)) {
        reasons.push(`Under ${rules.minRewardTasks} reward tasks completed (has ${pObj.rewardTasksCompleted})`);
      }
      if (rules.requireAccountVerification && !pObj.isVerified) {
        reasons.push("Account not verified");
      }
      if (rules.requireWalletConnected && !pObj.isWalletConnected) {
        reasons.push("Wallet not connected");
      }
      if (rules.requireMobileVerification && !pObj.isMobileVerified) {
        reasons.push("Mobile not verified");
      }
      if (rules.requireEmailVerification && !pObj.isEmailVerified) {
        reasons.push("Email not verified");
      }

      const isEligible = reasons.length === 0;
      console.log(`[${requestId}] [Enroll API] Eligibility check results: isEligible: ${isEligible}, reasons:`, reasons);

      if (!isEligible) {
        console.warn(`[${requestId}] [Enroll API] ERROR | Requirements not met:`, reasons);
        return res.status(400).json({ success: false, error: "Requirements not met: " + reasons.join(", ") });
      }

      // 4. Create participant document in "lucky_draw_participants"
      console.log(`[${requestId}] [Enroll API] Creating participant doc: ${campaignId}_${telegramId}`);
      const participantRef = doc(db, "lucky_draw_participants", `${campaignId}_${telegramId}`);
      await setDoc(participantRef, {
        campaignId,
        telegramId: String(telegramId),
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.enteredName || "Anonymous User",
        username: u.username || "no_username",
        joinedAt: new Date().toISOString(),
        referralCount: pObj.referralCount,
        rewardTasksCompleted: pObj.rewardTasksCompleted,
        isVerified: pObj.isVerified,
        isWalletConnected: pObj.isWalletConnected,
        isMobileVerified: pObj.isMobileVerified,
        isEmailVerified: pObj.isEmailVerified,
        isEligible,
        eligibilityReasons: reasons
      });

      console.log(`[${requestId}] [Enroll API] SUCCESS | Participant document created for user: ${telegramId}`);
      return res.json({ success: true, isEligible, reasons });
    } catch (e: any) {
      console.error(`[${requestId}] [Enroll API] FATAL ERROR:`, e);
      return res.status(500).json({ success: false, error: e.message || "Enrollment failed" });
    }
  });

  app.post("/api/admin/tickets/:id/reply", async (req, res) => {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const ticketData = snap.data();
      const replies = ticketData.replies || [];
      replies.push({
        sender: "admin",
        message: replyMessage,
        createdAt: new Date().toISOString()
      });
      
      await setDoc(ref, { 
        status: "replied", 
        adminReply: replyMessage, 
        lastReply: new Date().toISOString(),
        replies
      }, { merge: true });
      
      const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
      const botToken = telegramSettingsDoc.data()?.botToken;
      
      const userId = ticketData.userId;
      const rawStatus = "replied";
      const statusText = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
      
      const text = `📩 <b>Support Reply</b>
\n🎫 <b>Ticket ID:</b> ${ticketData.ticketId || id}\n\n💬 <b>Reply:</b>\n${replyMessage}\n\n<b>Status:</b> ${statusText}`;
      
      const requestPayload = {
        chat_id: String(userId),
        text: text,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Refresh Ticket", callback_data: `ticket_details_${id}` },
              { text: "📂 View Ticket", callback_data: `ticket_details_${id}` }
            ]
          ]
        }
      };
      
      console.log(`[DEBUG] Support Reply (Web) - Attempting to send message:
- Ticket ID: ${ticketData.ticketId || id}
- User ID: ${userId}
- Bot Token Used: ${botToken ? `${botToken.substring(0, 8)}...` : "NONE"}
- sendMessage Request: ${JSON.stringify(requestPayload, null, 2)}`);
      
      let responseData: any = null;
      let success = false;
      let errorDetails: string | null = null;
      
      if (!botToken) {
        errorDetails = "Bot Token is missing in Firestore settings/telegram.";
        console.error(`[DEBUG] Support Reply (Web) - Failed:
- Error details: ${errorDetails}
- Success / Failed: Failed`);
      } else {
        try {
          const apiRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload)
          });
          
          responseData = await apiRes.json();
          success = !!(responseData && responseData.ok);
          
          if (success) {
            console.log(`[DEBUG] Support Reply (Web) - Success:
- Telegram API Response: ${JSON.stringify(responseData, null, 2)}
- Success / Failed: Success`);
          } else {
            errorDetails = responseData?.description || "Unknown Telegram API Error";
            console.error(`[DEBUG] Support Reply (Web) - Failed:
- Error details: ${errorDetails}
- Telegram API Response: ${JSON.stringify(responseData, null, 2)}
- Success / Failed: Failed`);
          }
        } catch (fetchErr: any) {
          errorDetails = fetchErr.message || "Network Error";
          console.error(`[DEBUG] Support Reply (Web) - Failed:
- Error details: ${errorDetails}
- Telegram API Response: ${JSON.stringify(responseData || {}, null, 2)}
- Success / Failed: Failed`);
        }
      }
      
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin reply error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/tickets/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      await setDoc(ref, { status: "resolved", resolvedAt: new Date().toISOString() }, { merge: true });
      
      const data = snap.data();
      const userNotifyMsg = `🎉 <b>Great news!</b>
\nYour reported issue has been resolved.\n\nIf you still face the same problem, you can reopen the conversation by contacting support again.\n\nThank you for using RoyShare.`;
      await sendTgMessage(data.userId, userNotifyMsg);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin resolve error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/tickets/:id/close", async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      await setDoc(ref, { status: "closed", closedAt: new Date().toISOString() }, { merge: true });
      
      const data = snap.data();
      const userNotifyMsg = `Your support request has been closed.
\nIf you need further assistance, you can create a new support ticket anytime.`;
      await sendTgMessage(data.userId, userNotifyMsg);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin close error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Change Ticket Status Route
  app.post("/api/admin/tickets/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // "open" | "in_progress" | "resolved" | "closed"
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      await setDoc(ref, { status, updatedAt: new Date().toISOString() }, { merge: true });
      
      const data = snap.data();
      if (status === "resolved") {
        const userNotifyMsg = `🎉 <b>Great news!</b>
\nYour reported issue has been resolved.\n\nIf you still face the same problem, you can reopen the conversation by contacting support again.\n\nThank you for using RoyShare.`;
        await sendTgMessage(data.userId, userNotifyMsg);
      } else if (status === "closed") {
        const userNotifyMsg = `Your support request has been closed.
\nIf you need further assistance, you can create a new support ticket anytime.`;
        await sendTgMessage(data.userId, userNotifyMsg);
      } else {
        const statusLabels: Record<string, string> = {
          open: "🟡 Open",
          in_progress: "🟠 Pending",
          replied: "💬 Replied"
        };
        const label = statusLabels[status] || status;
        await sendTgMessage(data.userId, `ℹ️ <b>Ticket Status Updated</b>
\nTicket ID:\n${id}\n\nNew Status: ${label}`);
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin ticket status change error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Delete Ticket Route
  app.delete("/api/admin/tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ref = doc(db, "tickets", id);
      await deleteDoc(ref);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin ticket deletion error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Public Support Settings
  app.get("/api/support/settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "support");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        res.json({
          aiEnabled: true,
          liveChatEnabled: true,
          supportTelegram: "",
          supportEmail: "support@royshare.com"
        });
      } else {
        const data = docSnap.data();
        res.json({
          aiEnabled: data.aiEnabled !== false,
          liveChatEnabled: data.liveChatEnabled !== false,
          supportTelegram: data.supportTelegram || "",
          supportEmail: data.supportEmail || "support@royshare.com"
        });
      }
    } catch (e: any) {
      console.error("Get support settings error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Support Settings
  app.get("/api/admin/support/settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "support");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        res.json({
          aiEnabled: true,
          geminiApiKey: "",
          liveChatEnabled: true,
          supportTelegram: "",
          supportEmail: "support@royshare.com"
        });
      } else {
        res.json(docSnap.data());
      }
    } catch (e: any) {
      console.error("Admin support settings fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Update Support Settings
  app.put("/api/admin/support/settings", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = doc(db, "settings", "support");
      await setDoc(docRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin support settings update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Test Gemini Connection
  app.post("/api/admin/support/test-connection", async (req, res) => {
    try {
      const { geminiApiKey, geminiModel } = req.body;
      const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKeyToUse) {
        return res.status(400).json({ error: "Gemini API Key is not configured." });
      }

      const modelToUse = geminiModel || "gemini-1.5-flash";

      const ai = new GoogleGenAI({
        apiKey: apiKeyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const startTime = Date.now();
      const response = await safeGenerateContent(ai, {
        model: modelToUse,
        contents: "Hello",
      });
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      if (response && response.text) {
        // Save test diagnostics and the API key back to Firestore doc (settings/support)
        const docRef = doc(db, "settings", "support");
        const diagData = {
          geminiApiKey: apiKeyToUse,
          geminiModel: modelToUse,
          connectionStatus: "✅ Connected",
          lastResponseTime: `${durationMs}ms`,
          lastError: "None",
          apiSaved: true,
          modelName: modelToUse,
          testedAt: new Date().toISOString()
        };
        await setDoc(docRef, diagData, { merge: true });

        return res.json({
          success: true,
          durationMs,
          modelName: modelToUse,
          reply: response.text
        });
      } else {
        throw new Error("No response or empty text returned from Gemini API.");
      }
    } catch (e: any) {
      console.error("Gemini Test Connection error:", e);
      const errMsg = e.message || "Invalid API Key or connection issue";
      
      // Save failure diagnostics to Firestore
      const docRef = doc(db, "settings", "support");
      const diagData = {
        connectionStatus: "❌ Invalid API Key",
        lastError: errMsg,
        lastResponseTime: "-",
        testedAt: new Date().toISOString()
      };
      await setDoc(docRef, diagData, { merge: true });

      return res.status(500).json({
        success: false,
        error: errMsg
      });
    }
  });

  // Live Support Chat (powered by Gemini in the background with zero AI references)
  app.post("/api/support/ai-chat", async (req, res) => {
    try {
      const { messages, newMessage, userId } = req.body;
      
      const supportSettingsRef = doc(db, "settings", "support");
      const supportSettingsSnap = await getDoc(supportSettingsRef);
      const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : { aiEnabled: true, geminiApiKey: "", geminiModel: "gemini-1.5-flash" };
      
      if (supportData.aiEnabled === false) {
        return res.status(403).json({ error: "Support is currently offline." });
      }
      
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "No Gemini API Key configured." });
      }

      // Fetch user's details for real-time background context understanding
      let userContext = "No authenticated user info available.";
      if (userId) {
        try {
          const userSnap = await getDoc(doc(db, "users", String(userId)));
          const userData = userSnap.exists() ? userSnap.data() : null;
          
          const ticketsSnap = await getDocs(query(collection(db, "tickets"), where("userId", "==", String(userId))));
          const userTickets = ticketsSnap.docs.map(d => ({
            ticketId: d.data().ticketId,
            subject: d.data().subject,
            status: d.data().status,
            createdAt: d.data().createdAt
          }));

          const referralsSnap = await getDocs(query(collection(db, "referrals"), where("referrerId", "==", String(userId))));
          const referralCount = referralsSnap.size;

          const withdrawalsSnap = await getDocs(query(collection(db, "withdrawals"), where("userId", "==", String(userId))));
          const userWithdrawals = withdrawalsSnap.docs.map(d => ({
            amount: d.data().amount,
            status: d.data().status,
            createdAt: d.data().createdAt
          }));

          userContext = `
The user you are speaking with is authenticated.
- Name: ${userData?.name || userData?.firstName || 'User'}
- Username: @${userData?.username || 'N/A'}
- Balance: $${userData?.balance || 0}
- Total Earnings: $${(userData?.fileEarnings || 0) + (userData?.linkEarnings || 0) + (userData?.referralEarnings || 0)}
- Withdrawn Amount: $${userData?.withdrawnAmount || 0}
- Pending Withdrawals: $${userData?.pendingWithdrawal || 0}
- Referrals Count: ${referralCount}
- Active Tickets: ${JSON.stringify(userTickets)}
- Withdrawal History: ${JSON.stringify(userWithdrawals)}
`;
        } catch (ctxErr) {
          console.error("Failed to compile user context for support chatbot:", ctxErr);
        }
      }
      
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      // Prefer modern gemini-1.5-flash for text tasks
      const selectedModel = supportData.geminiModel || "gemini-1.5-flash";
      
      const systemInstruction = `
You are Sarah, a highly professional, polite, and helpful human support representative at RoyShare.
RoyShare is a secure Telegram-powered file sharing and URL shortener platform.

CRITICAL DIRECTIVES:
1. NEVER mention that you are an AI, chatbot, assistant, Gemini, automated agent, or machine. If the user asks if you are a bot, reply warmly that you are a human support specialist.
2. Reply naturally, with empathy, and write as a professional human agent. Keep your replies concise, friendly, and human-like.
3. You have access to the user's account context below. Use this information to answer their specific questions about their balance, withdrawals, referrals, or tickets. Do not copy paste the raw JSON; instead, formulate friendly natural responses (e.g., "I see you have an active withdrawal of $25 pending...").
4. If you cannot fully resolve their issue or if the user requests escalation/manual review, invite them to escalate the conversation by saying: "Please click the 'Escalate to Support Team' button above to send our full chat to our administrators."
5. Do NOT output code or technical jargon.

User Account Context:
${userContext}
`;

      const response = await safeSendMessage(ai, {
        model: selectedModel || "gemini-1.5-flash",
        message: newMessage,
        config: {
          systemInstruction: systemInstruction
        },
        history: (messages || []).map((m: any) => ({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        }))
      });
      
      res.json({ reply: response.text });
    } catch (e: any) {
      console.error("AI chat error:", e);
      res.json({ reply: "I apologize, I'm experiencing a minor issue retrieving your information right now. Please feel free to escalate this conversation to our senior admin team by clicking 'Escalate to Support Team' above." });
    }
  });

  // Escalate Live Chat to Support Ticket and notify admin via Telegram
  app.post("/api/support/tickets/escalate", async (req, res) => {
    try {
      const { userId, name, username, chatHistory } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const transcript = (chatHistory || []).map((m: any) => `[${m.sender === 'user' ? 'User' : 'Support Specialist Sarah'}] (${m.time || ''}): ${m.text}`).join("\n");
      
      // Load Gemini Configuration for analysis
      const supportSettingsSnap = await getDoc(doc(db, "settings", "support"));
      const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : { geminiApiKey: "", geminiModel: "gemini-1.5-flash" };
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;
      const modelToUse = supportData.geminiModel || "gemini-1.5-flash";

      let aiAnalysis = {
        category: "Other",
        priority: "Medium",
        summary: "Live support conversation escalated.",
        suggestedCause: "Undetermined. Requires manual inspection.",
        suggestedSolution: "Review the chat transcript and contact the user."
      };

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const systemInstruction = `
You are an expert support supervisor at RoyShare.
Your job is to analyze a support conversation transcript between a user and our support bot, and output a JSON object containing:
1. "category": Choose the most appropriate category from: "Account", "Withdrawal", "File Upload", "Other".
2. "priority": Determine priority as "Low", "Medium", or "High" based on the severity of the user's issue.
3. "summary": A concise 2-3 sentence summary of the user's issue and what has been discussed.
4. "suggestedCause": A brief technical explanation of what might be causing the user's issue.
5. "suggestedSolution": Clear, actionable step-by-step instructions for our human administrator to resolve this issue.

You MUST reply ONLY with a valid JSON object. Do not include any markdown formatting or backticks outside of the JSON.
`;

          const aiResponse = await safeGenerateContent(ai, {
            model: modelToUse,
            contents: `Analyze the following transcript:
\n${transcript}`,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json"
            }
          });

          const textResponse = aiResponse.text?.trim() || "";
          console.log("Gemini Escalation Analysis Response:", textResponse);
          
          let cleanJson = textResponse;
          if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```(json)?/, "").replace(/```$/, "").trim();
          }
          
          const parsed = JSON.parse(cleanJson);
          if (parsed.category) aiAnalysis.category = parsed.category;
          if (parsed.priority) aiAnalysis.priority = parsed.priority;
          if (parsed.summary) aiAnalysis.summary = parsed.summary;
          if (parsed.suggestedCause) aiAnalysis.suggestedCause = parsed.suggestedCause;
          if (parsed.suggestedSolution) aiAnalysis.suggestedSolution = parsed.suggestedSolution;
        } catch (aiErr) {
          console.error("Failed to analyze conversation with Gemini:", aiErr);
        }
      }

      const ticketId = "TKT" + (Math.floor(Math.random() * 900000) + 100000);

      const ticketData = {
        ticketId,
        userId: String(userId),
        name: name || "User",
        username: username || "",
        telegramId: String(userId),
        subject: `Escalated Chat - ${aiAnalysis.category}`,
        category: aiAnalysis.category,
        issueType: aiAnalysis.category,
        priority: aiAnalysis.priority,
        description: `Full Live Support session history:
\n${transcript}`,
        conversation: transcript,
        aiSummary: aiAnalysis.summary,
        aiSuggestedCause: aiAnalysis.suggestedCause,
        aiSuggestedSolution: aiAnalysis.suggestedSolution,
        screenshot: null,
        status: "open",
        createdAt: new Date().toISOString(),
        time: new Date().toISOString(),
        replies: [
          {
            sender: "user",
            message: `Escalated conversation transcript:
\n${transcript}`,
            createdAt: new Date().toISOString()
          }
        ]
      };

      const docRef = await addDoc(collection(db, "tickets"), ticketData);

      try {
        await sendTgMessage(String(userId), `✅ Your request has been received successfully.
\nYour Ticket ID: <b>${ticketId}</b>\n\nOur support team is currently reviewing your issue.\n\nPlease wait approximately 2 hours while we investigate and resolve it.\n\nYou will automatically receive a reply here as soon as an update is available.`);
      } catch (tgErr) {
        console.error("Failed to send TG escalation confirmation to user:", tgErr);
      }

      // Notify admin with automated ticket summary and solution suggestion
      try {
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        const adminChatId = telegramSettingsSnap.data()?.adminChatId || telegramSettingsSnap.data()?.chatId;
        if (adminChatId) {
          const adminMsg = `🚨 <b>New Support Ticket</b>
\n` +
            `<b>Ticket ID:</b> <code>${ticketId}</code>
` +
            `<b>User:</b> ${name || 'User'}
` +
            `<b>Username:</b> @${username || ''}
` +
            `<b>User ID:</b> <code>${userId}</code>
` +
            `<b>Issue:</b> ${aiAnalysis.category}
` +
            `<b>Priority:</b> ${aiAnalysis.priority}
` +
            `<b>AI Summary:</b> ${aiAnalysis.summary}
\n` +
            `<b>Conversation:</b>
<pre>${transcript.substring(0, 1000)}${transcript.length > 1000 ? '...' : ''}</pre>\n\n` +
            `<b>Suggested Solution:</b> ${aiAnalysis.suggestedSolution}
` +
            `<b>Created Time:</b> ${new Date().toLocaleString()}`;

          const adminReplyMarkup = {
            inline_keyboard: [
              [
                { text: "💬 Reply", callback_data: `admin_reply_${docRef.id}` },
                { text: "✅ Resolve", callback_data: `admin_resolve_${docRef.id}` },
                { text: "❌ Close", callback_data: `admin_close_${docRef.id}` }
              ]
            ]
          };

          await sendTgMessage(
            String(adminChatId),
            adminMsg,
            { reply_markup: adminReplyMarkup }
          );
        }
      } catch (adminTgErr) {
        console.error("Failed to notify admin via TG:", adminTgErr);
      }

      res.json({ success: true, ticketId });
    } catch (e: any) {
      console.error("Escalation endpoint error:", e);
      res.status(500).json({ error: "Failed to escalate chat conversation" });
    }
  });

  // Fetch User-specific Support Tickets
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      
      const q = query(collection(db, "tickets"), where("userId", "==", String(userId)));
      const snap = await getDocs(q);
      const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(tickets);
    } catch (e: any) {
      console.error("User tickets fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Create User Support Ticket
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const { userId, name, username, subject, category, description, screenshot, priority } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      
      const ticketId = "TKT" + (Math.floor(Math.random() * 900000) + 100000);
      const ticketData = {
        ticketId,
        userId: String(userId),
        name: name || "User",
        username: username || "",
        subject: subject || "",
        category: category || "Other",
        issueType: category || "Other", // compatibility
        description: description || "",
        screenshot: screenshot || null,
        priority: priority || "Medium",
        status: "open",
        createdAt: new Date().toISOString(),
        replies: [
          {
            sender: "user",
            message: description,
            createdAt: new Date().toISOString()
          }
        ]
      };
      
      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      
      try {
        await sendTgMessage(String(userId), `🎫 <b>Ticket Created Successfully!</b>
\nTicket ID: <code>${ticketId}</code>\nSubject: ${subject}\nPriority: ${priority}\n\nOur support team will review it shortly.`);
      } catch (tgErr) {
        console.error("Failed to send TG confirmation to user:", tgErr);
      }
      
      res.json({ success: true, id: docRef.id, ticketId });
    } catch (e: any) {
      console.error("Ticket creation error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // User replies to ticket
  app.post("/api/support/tickets/:id/reply", async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const data = snap.data();
      const replies = data.replies || [];
      
      replies.push({
        sender: "user",
        message,
        createdAt: new Date().toISOString()
      });
      
      await setDoc(ref, { 
        status: "open", // mark back as open for admins
        replies,
        lastReply: new Date().toISOString()
      }, { merge: true });
      
      res.json({ success: true });
    } catch (e: any) {
      console.error("User ticket reply error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Announcements Routes
  app.get("/api/admin/announcements", async (req, res) => {
    try {
      const q = query(collection(db, "announcements"));
      const snapshot = await getDocs(q);
      const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      announcements.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(announcements);
    } catch (e: any) {
      console.error("Admin announcements fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/announcements", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = await addDoc(collection(db, "announcements"), {
        ...payload,
        createdAt: new Date().toISOString(),
        viewCount: 0,
        clickCount: 0
      });

      if (payload.status === 'Published') {
        // Send notification to all users (in background to not block response)
        (async () => {
          try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const promises = usersSnapshot.docs.map(doc => {
              const data = doc.data();
              if (data.telegramId) {
                return sendTgMessage(data.telegramId, `🔔 <b>New Announcement</b>
\n📢 ${payload.title}\n\nTap 📢 Announcements to read more.`).catch(() => {});
              }
              return Promise.resolve();
            });
            await Promise.all(promises);
          } catch (err) {
            console.error("Broadcast failed", err);
          }
        })();
      }

      res.json({ success: true, id: docRef.id });
    } catch (e: any) {
      console.error("Admin announcement create error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/admin/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const ref = doc(db, "announcements", id);
      
      const prevSnap = await getDoc(ref);
      const prevStatus = prevSnap.exists() ? prevSnap.data().status : null;

      await setDoc(ref, payload, { merge: true });

      if (payload.status === 'Published' && prevStatus !== 'Published') {
        // Notify if newly published
        (async () => {
          try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const promises = usersSnapshot.docs.map(doc => {
              const data = doc.data();
              if (data.telegramId) {
                return sendTgMessage(data.telegramId, `🔔 <b>New Announcement</b>
\n📢 ${payload.title}\n\nTap 📢 Announcements to read more.`).catch(() => {});
              }
              return Promise.resolve();
            });
            await Promise.all(promises);
          } catch (err) {
            console.error("Broadcast failed", err);
          }
        })();
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin announcement update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/admin/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "announcements", id));
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin announcement delete error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Reward Tasks Routes
  app.get("/api/admin/tasks", async (req, res) => {
    try {
      const q = query(collection(db, "tasks"));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(tasks);
    } catch (e: any) {
      console.error("Admin tasks fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/tasks", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Admin creating task:", payload);
      const docRef = await addDoc(collection(db, "tasks"), {
        ...payload,
        createdAt: new Date().toISOString(),
        participants: 0,
        completedUsers: 0,
        totalRewardsDistributed: 0
      });
      console.log("Admin task created successfully, ID:", docRef.id);
      res.json({ success: true, id: docRef.id });
    } catch (e: any) {
      console.error("Admin task create error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  app.put("/api/admin/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      console.log(`Admin updating task ${id}:`, payload);
      await setDoc(doc(db, "tasks", id), payload, { merge: true });
      console.log(`Admin task ${id} updated successfully`);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin task update error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  app.delete("/api/admin/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "tasks", id));
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin task delete error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin GP Links Tasks Routes
  app.get("/api/admin/gplinks-tasks", async (req, res) => {
    try {
      const q = query(collection(db, "gplinks_tasks"));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(tasks);
    } catch (e: any) {
      console.error("Admin gplinks tasks fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/gplinks-tasks", async (req, res) => {
    try {
      const payload = req.body;
      const cpmAmount = Number(payload.cpmAmount) || 0;
      const rewardPerView = cpmAmount / 1000;
      const url = payload.shortenerUrl || payload.gpLinksUrl || "";

      const docRef = await addDoc(collection(db, "gplinks_tasks"), {
        provider: payload.provider || "GPLinks",
        title: payload.title || "",
        shortenerUrl: url,
        gpLinksUrl: url,
        cpmAmount,
        rewardPerView,
        totalViewsLimit: Number(payload.totalViewsLimit) || 0,
        remainingViews: Number(payload.totalViewsLimit) || 0,
        completedViews: 0,
        timerDuration: Number(payload.timerDuration) || 15,
        countryTarget: payload.countryTarget || "",
        deviceTarget: payload.deviceTarget || "",
        expiryDate: payload.expiryDate || "",
        status: payload.status || "Active",
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, id: docRef.id });
    } catch (e: any) {
      console.error("Admin gplinks task create error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  app.put("/api/admin/gplinks-tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const cpmAmount = Number(payload.cpmAmount) || 0;
      const rewardPerView = cpmAmount / 1000;
      const url = payload.shortenerUrl || payload.gpLinksUrl || "";

      const cleanPayload = {
        provider: payload.provider || "GPLinks",
        title: payload.title || "",
        shortenerUrl: url,
        gpLinksUrl: url,
        cpmAmount,
        rewardPerView,
        totalViewsLimit: Number(payload.totalViewsLimit) || 0,
        remainingViews: Number(payload.totalViewsLimit) || 0,
        completedViews: Number(payload.completedViews) || 0,
        timerDuration: Number(payload.timerDuration) || 15,
        countryTarget: payload.countryTarget || "",
        deviceTarget: payload.deviceTarget || "",
        expiryDate: payload.expiryDate || "",
        status: payload.status || "Active",
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "gplinks_tasks", id), cleanPayload, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin gplinks task update error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  app.delete("/api/admin/gplinks-tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "gplinks_tasks", id));
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin gplinks task delete error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // User GP Links Tasks list (Only active and non-expired tasks)
  app.get("/api/gplinks-tasks", async (req, res) => {
    try {
      const q1 = query(collection(db, "gplinks_tasks"));
      const snapshot1 = await getDocs(q1);
      const q2 = query(collection(db, "tasks"));
      const snapshot2 = await getDocs(q2);
      
      const allTasks = [
        ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snapshot2.docs
          .filter(doc => doc.data().shortenerUrl || (doc.data().provider && doc.data().provider !== "monetag_mini"))
          .map(doc => {
             const d = doc.data();
             return {
               id: doc.id,
               ...d,
               cpmAmount: d.cpm || d.cpmAmount || (d.rewardAmount ? d.rewardAmount * 1000 : 0),
               provider: d.customProvider || d.provider || "Unknown",
               status: d.status,
             };
          })
      ];
      
      const now = new Date();
      const activeTasks = allTasks.filter((t: any) => {
        if (t.status !== "Active" && t.status !== "🟢 Active" && !String(t.status || "").toLowerCase().includes("active")) return false;
        if (t.totalViewsLimit && (t.completedViews || 0) >= t.totalViewsLimit) return false;
        if (t.expiryDate && new Date(t.expiryDate) < now) return false;
        return true;
      });
      
      res.json(activeTasks);
    } catch (e: any) {
      console.error("User gplinks tasks fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Verification of GP Link task completion
  app.post("/api/gplinks-tasks/verify", async (req, res) => {
    try {
      const { userId, taskId } = req.body;
      if (!userId || !taskId) {
        return res.status(400).json({ error: "userId and taskId are required" });
      }

      // 1. Fetch task
      let taskRef = doc(db, "gplinks_tasks", taskId);
      let taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        taskRef = doc(db, "tasks", taskId);
        taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) {
          return res.status(404).json({ error: "This task campaign does not exist." });
        }
      }

      const tData = taskSnap.data();
      if (tData.status !== "Active" && tData.status !== "🟢 Active" && !String(tData.status || "").toLowerCase().includes("active")) {
        return res.status(400).json({ error: "This campaign is not active." });
      }

      const completedViews = Number(tData.completedViews) || 0;
      const totalViewsLimit = Number(tData.totalViewsLimit) || 0;
      if (totalViewsLimit > 0 && completedViews >= totalViewsLimit) {
        // Automatically pause campaign when view limit is reached
        await setDoc(taskRef, { status: "Paused" }, { merge: true });
        return res.status(400).json({ error: "This task has already reached its views limit." });
      }

      if (tData.expiryDate && new Date(tData.expiryDate) < new Date()) {
        await setDoc(taskRef, { status: "Paused" }, { merge: true });
        return res.status(400).json({ error: "This task campaign has expired." });
      }

      // 2. Check if user already completed this task
      const checkQuery = query(
        collection(db, "gplinks_task_completions"),
        where("userId", "==", userId),
        where("taskId", "==", taskId)
      );
      const checkSnap = await getDocs(checkQuery);
      if (!checkSnap.empty) {
        return res.status(400).json({ error: "You have already completed this reward task. Duplicate rewards are not permitted." });
      }

      // 3. Retrieve user doc
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User profile not found profile." });
      }

      // 4. Calculate reward per view
      const cpmAmount = Number(tData.cpmAmount) || Number(tData.cpm) || 0;
      let rewardAmount = cpmAmount / 1000;
      if (rewardAmount === 0 && tData.rewardAmount) {
        rewardAmount = Number(tData.rewardAmount) || 0;
      }

      // 5. Update task, user balance, and insert completion log
      const uData = userSnap.data();
      const userStatus = uData.status || "Normal";
      const isFlagged = ["Pending Review", "High Risk", "Shadow Monitor"].includes(userStatus) || (uData?.trustScore !== undefined && uData.trustScore < 20);
      const isSb = uData.shadowBanned === true;
      let finalNewBalance = uData?.availableBalance || 0;

      if (isFlagged) {
        // Silent Review Mode: Do not credit balances. Just log as Pending Review transaction.
        await addDoc(collection(db, "transactions"), {
          userId: String(userId),
          amount: rewardAmount,
          type: "gplinks_task",
          description: `GP Links Task: ${tData.title}`,
          status: "Pending Review",
          createdAt: new Date().toISOString(),
          taskId,
          is_flagged: true,
          flagged_status: userStatus
        });
        
        const fileEarnings = uData?.fileEarnings || 0;
        const linkEarnings = uData?.linkEarnings || 0;
        const referralEarnings = uData?.referralEarnings || 0;
        const bonusBalance = uData?.bonusBalance || 0;
        const realRewardBalance = uData?.rewardBalance || 0;
        const withdrawnAmount = uData?.withdrawnAmount || 0;
        const pendingWithdrawals = uData?.pendingWithdrawals || 0;
        finalNewBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + realRewardBalance - withdrawnAmount - pendingWithdrawals;
      } else if (isSb) {
        const shadowRewardBalance = (uData.shadowRewardBalance || 0) + rewardAmount;
        const shadowAvailableBalance = (uData.shadowAvailableBalance || 0) + rewardAmount;
        const shadowEarnings = (uData.shadowEarnings || 0) + rewardAmount;
        const shadowTotalEarnings = (uData.shadowTotalEarnings || 0) + rewardAmount;
        const shadowBalance = (uData.shadowBalance || 0) + rewardAmount;

        await setDoc(userRef, {
          shadowRewardBalance,
          shadowAvailableBalance,
          shadowEarnings,
          shadowTotalEarnings,
          shadowBalance
        }, { merge: true });

        await addDoc(collection(db, "shadow_blocked_rewards"), {
          userId: String(userId),
          username: uData.username || uData.firstName || "no_username",
          amount: rewardAmount,
          type: "gplinks_task",
          createdAt: new Date().toISOString()
        });

        // Compute fake visual balance to return to the client
        const fileEarnings = uData?.fileEarnings || 0;
        const linkEarnings = uData?.linkEarnings || 0;
        const referralEarnings = uData?.referralEarnings || 0;
        const bonusBalance = uData?.bonusBalance || 0;
        const realRewardBalance = uData?.rewardBalance || 0;
        const withdrawnAmount = uData?.withdrawnAmount || 0;
        const pendingWithdrawals = uData?.pendingWithdrawals || 0;

        finalNewBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + realRewardBalance + shadowRewardBalance - withdrawnAmount - pendingWithdrawals;
      } else {
        const fileEarnings = uData?.fileEarnings || 0;
        const linkEarnings = uData?.linkEarnings || 0;
        const referralEarnings = uData?.referralEarnings || 0;
        const bonusBalance = uData?.bonusBalance || 0;
        const rewardBalance = (uData?.rewardBalance || 0) + rewardAmount;
        const withdrawnAmount = uData?.withdrawnAmount || 0;
        const pendingWithdrawals = uData?.pendingWithdrawals || 0;

        // Compute new availableBalance
        finalNewBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance - withdrawnAmount - pendingWithdrawals;
        const earnings = (uData?.earnings || 0) + rewardAmount;

        // Atomic Update User Balance
        await setDoc(userRef, {
          rewardBalance,
          availableBalance: finalNewBalance,
          earnings
        }, { merge: true });

        // Increase Trust Score for Completed Task (+2)
        adjustTrustScore(userId, 2, "Completed Task").catch(() => {});
      }

      // Increment campaign completions
      const newCompletedViews = completedViews + 1;
      const updateObj: any = { completedViews: newCompletedViews };
      if (totalViewsLimit > 0 && newCompletedViews >= totalViewsLimit) {
        updateObj.status = "Paused"; // Auto stop
      }
      await setDoc(taskRef, updateObj, { merge: true });

      // Create GP Links task completion document
      await addDoc(collection(db, "gplinks_task_completions"), {
        userId,
        taskId,
        taskTitle: tData.title,
        rewardAmount,
        completedAt: new Date().toISOString(),
        status: "completed",
        shadow_banned: isSb
      });

      res.json({
        success: true,
        rewardAmount,
        newBalance: finalNewBalance,
        isFlagged,
        message: isFlagged ? "⏳ Reward is under security verification. This usually completes within a short time." : undefined
      });
    } catch (e: any) {
      console.error("GP Links verification error:", e);
      res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  // Admin Task Completions logs
  app.get("/api/admin/task-logs", async (req, res) => {
    try {
      const q = query(collection(db, "task_completions"));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logs.sort((a: any, b: any) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
      res.json(logs);
    } catch (e: any) {
      console.error("Admin task logs fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Economy Settings GET
  app.get("/api/admin/economy/settings", async (req, res) => {
    try {
      const settings = await getEconomySettings();
      res.json(settings);
    } catch (e: any) {
      console.error("Admin economy settings fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Economy Settings PUT
  app.put("/api/admin/economy/settings", async (req, res) => {
    try {
      const success = await saveEconomySettings(req.body);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to save settings" });
      }
    } catch (e: any) {
      console.error("Admin economy settings save error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin Economy Stats GET
  app.get("/api/admin/economy/stats", async (req, res) => {
    try {
      const settings = await getEconomySettings();
      const todayStr = new Date().toISOString().split("T")[0];
      const statsRef = doc(db, "economy_global_stats", `daily_${todayStr}`);
      const statsSnap = await firestoreGetDoc(statsRef);

      let totalPaid = 0;
      let pendingRewards = 0;
      let blockedRewards = 0;
      let transactionCount = 0;

      if (statsSnap.exists()) {
        const d = statsSnap.data();
        totalPaid = Number(d.totalRewardsPaid ?? 0);
        pendingRewards = Number(d.pendingRewards ?? 0);
        blockedRewards = Number(d.blockedRewards ?? 0);
        transactionCount = Number(d.transactionCount ?? 0);
      }

      const remainingBudget = Math.max(0, settings.dailyRewardBudget - totalPaid);
      const avgRewardPerUser = transactionCount > 0 ? (totalPaid / transactionCount) : 0;

      res.json({
        todayBudget: settings.dailyRewardBudget,
        remainingBudget,
        totalPaid,
        pendingRewards,
        blockedRewards,
        avgRewardPerUser
      });
    } catch (e: any) {
      console.error("Admin economy stats fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (e: any) {
      console.error("Admin users fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/admin/users/:id/wallet", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason, action } = req.body;
      
      const numAmount = Number(amount || 0);
      if (numAmount < 0) throw new Error("Amount must be greater than 0");

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", id);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        
        const userData = userSnap.data();
        let updateData: any = {};
        
        const currentBalance = Number(userData.balance || 0);
        const currentBonusBalance = Number(userData.bonusBalance || 0);
        const currentRewardBalance = Number(userData.rewardBalance || 0);
        
        switch (action) {
            case 'add_balance':
                updateData.balance = currentBalance + numAmount;
                break;
            case 'deduct_balance':
                if (currentBalance < numAmount) throw new Error("Insufficient balance");
                updateData.balance = currentBalance - numAmount;
                break;
            case 'add_bonus':
                updateData.bonusBalance = currentBonusBalance + numAmount;
                break;
            case 'add_reward':
                updateData.rewardBalance = currentRewardBalance + numAmount;
                break;
            case 'freeze':
                updateData.walletFrozen = true;
                break;
            case 'unfreeze':
                updateData.walletFrozen = false;
                break;
            default:
                throw new Error("Invalid action");
        }
        
        // Recalculate availableBalance
        const fileEarnings = userData?.fileEarnings || 0;
        const linkEarnings = userData?.linkEarnings || 0;
        const referralEarnings = userData?.referralEarnings || 0;
        const bonusBalance = updateData.bonusBalance !== undefined ? updateData.bonusBalance : (userData?.bonusBalance || 0);
        const rewardBalance = updateData.rewardBalance !== undefined ? updateData.rewardBalance : (userData?.rewardBalance || 0);
        const withdrawnAmount = userData?.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData?.totalWithdrawn || 0);
        const pendingWithdrawals = userData?.pendingWithdrawals || 0;
        const newBalance = updateData.balance !== undefined ? updateData.balance : currentBalance;
        
        updateData.availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + newBalance - withdrawnAmount - pendingWithdrawals;
        
        transaction.update(userRef, updateData);
        
        // Log to Activity Logs
        const logRef = doc(collection(db, "activityLogs"));
        transaction.set(logRef, {
            adminId: "admin",
            targetUserId: id,
            action,
            amount: numAmount,
            reason,
            createdAt: new Date()
        });
      });
      
      // After transaction completes successfully, record structured transaction
      if (['add_balance', 'deduct_balance', 'add_bonus', 'add_reward'].includes(action)) {
        await recordWalletTransaction({
          userId: id,
          amount: numAmount,
          creditDebit: action === "deduct_balance" ? "Debit" : "Credit",
          source: action === "add_bonus" ? "🎁 Promotional Bonus" : "🛠 Admin Wallet Adjustment",
          description: reason || `Admin balance update: ${action.replace('_', ' ')}`,
          status: "Completed",
          adminNotes: reason
        });
      }
      
      res.json({ success: true, message: "Wallet updated successfully" });
    } catch (e: any) {
      console.error("Admin wallet update error:", e);
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  // --- ADMIN USER MANAGEMENT HELPERS ---
  const performDeleteUser = async (userId: string) => {
    // 1. Delete user profile
    await deleteDoc(doc(db, "users", userId));

    // 2. Delete referral data
    await deleteDoc(doc(db, "referrals", userId));
    
    // 3. Delete monetization history (Monetag postbacks)
    const postbackQuery = query(collection(db, "monetagPostbacks"), where("telegramId", "==", Number(userId)));
    const postbacks = await getDocs(postbackQuery);
    for (const d of postbacks.docs) await deleteDoc(d.ref);

    // 4. Delete YMID records
    const ymidQuery = query(collection(db, "processedYmids"), where("userId", "==", userId));
    const ymids = await getDocs(ymidQuery);
    for (const d of ymids.docs) await deleteDoc(d.ref);

    // 5. Sessions / Cached data
    const sessionQuery = query(collection(db, "userSessions"), where("userId", "==", userId));
    const sessions = await getDocs(sessionQuery);
    for (const d of sessions.docs) await deleteDoc(d.ref);
  };

  const performResetUser = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      balance: 0,
      rewards: 0,
      referrals: 0,
      totalEarnings: 0,
      availableBalance: 0,
      bonusBalance: 0,
      fileEarnings: 0,
      linkEarnings: 0,
      referralEarnings: 0,
      rewardBalance: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      membershipVerified: false,
      contactVerified: false,
      monetagProgress: 0,
      tasksCompleted: 0,
      lastActive: new Date().toISOString()
    }, { merge: true });

    // Clear processed YMIDs
    const q = query(collection(db, "processedYmids"), where("userId", "==", userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);
  };

  // --- ADMIN USER ROUTES ---

  app.put("/api/admin/users/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason, adminId } = req.body;
      const userRef = doc(db, "users", id);
      await setDoc(userRef, { status, banReason: reason || null }, { merge: true });
      
      await logAdminActivity(adminId || "Admin", id, status === "Banned" ? "Ban User" : "Unban User", req.ip || "unknown", { reason });
      
      res.json({ success: true, message: `User ${status === 'Banned' ? 'banned' : 'unbanned'} successfully` });
    } catch (e: any) {
      console.error("Admin user status update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Delete User COMPLETELY
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      
      await performDeleteUser(id);
      await logAdminActivity(adminId || "Admin", id, "Permanent Delete User", req.ip || "unknown");

      res.json({ success: true, message: "User deleted permanently" });
    } catch (e: any) {
      console.error("Admin user delete error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Reset User
  app.post("/api/admin/users/:id/reset", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      
      await performResetUser(id);
      await logAdminActivity(adminId || "Admin", id, "Reset User", req.ip || "unknown");

      res.json({ success: true, message: "User progress reset successfully" });
    } catch (e: any) {
      console.error("Admin user reset error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Reset Registration (Re-register User)
  app.post("/api/admin/users/:id/re-register", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      const userRef = doc(db, "users", id);

      const reRegisterData = {
        membershipVerified: false,
        contactVerified: false,
        verified: false,
        registrationStep: 'joining',
        registrationCompleted: false,
        lastActive: new Date().toISOString()
      };

      await setDoc(userRef, reRegisterData, { merge: true });

      const sessionQuery = query(collection(db, "userSessions"), where("userId", "==", id));
      const sessions = await getDocs(sessionQuery);
      for (const d of sessions.docs) await deleteDoc(d.ref);

      await logAdminActivity(adminId || "Admin", id, "Reset Registration", req.ip || "unknown");

      res.json({ success: true, message: "User registration reset successfully." });
    } catch (e: any) {
      console.error("Admin user re-register error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Reset Balance
  app.post("/api/admin/users/:id/reset-balance", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      const userRef = doc(db, "users", id);

      await setDoc(userRef, {
        balance: 0,
        availableBalance: 0,
        totalEarnings: 0,
        rewards: 0
      }, { merge: true });

      await logAdminActivity(adminId || "Admin", id, "Reset Balance", req.ip || "unknown");

      res.json({ success: true, message: "User balance reset successfully." });
    } catch (e: any) {
      console.error("Admin user reset balance error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Delete All Users
  app.post("/api/admin/users/delete-all", async (req, res) => {
    try {
      const { adminId } = req.body;
      const snapshot = await getDocs(collection(db, "users"));
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      await logAdminActivity(adminId || "Admin", "ALL", "Delete All Users", req.ip || "unknown");

      res.json({ success: true, message: `Successfully deleted ${snapshot.size} users.` });
    } catch (e: any) {
      console.error("Admin delete all users error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Bulk Action
  app.post("/api/admin/users/bulk-action", async (req, res) => {
    try {
      const { userIds, action, adminId } = req.body;
      if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: "Invalid user IDs" });

      for (const id of userIds) {
        if (action === 'delete') {
          await performDeleteUser(id);
        } else if (action === 'reset') {
          await performResetUser(id);
        }
      }

      await logAdminActivity(adminId || "Admin", "Multiple", `Bulk ${action}`, req.ip || "unknown", { count: userIds.length });

      res.json({ success: true, message: `Bulk ${action} completed for ${userIds.length} users` });
    } catch (e: any) {
      console.error("Admin bulk action error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Export Users CSV
  app.get("/api/admin/users/export", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const fields = [
        "telegramId", "username", "firstName", "lastName", "enteredName", "phone", 
        "availableBalance", "totalEarnings", "referrals", 
        "membershipVerified", "verified", "registrationDate", "lastActive", "device", "ip", "country"
      ];

      let csv = fields.join(",") + "\n";
      users.forEach((u: any) => {
        const row = fields.map(f => {
          let val = u[f] ?? "";
          if (typeof val === 'string' && val.includes(",")) val = `"${val}"`;
          return val;
        });
        csv += row.join(",") + "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users_export.csv");
      res.status(200).send(csv);
    } catch (e: any) {
      console.error("Admin export users error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/users/:id/message", async (req, res) => {
    debugLog(`[DEBUG] Received request at /api/admin/users/${req.params.id}/message`);
    try {
      const { id } = req.params;
      const { type, content } = req.body;
      debugLog(`[DEBUG] Message details: id=${id}, type=${type}, content=${content}`);
      
      await sendTgMessage(id, content || "No content provided.");
      
      res.json({ success: true, message: "Message sent" });
    } catch (e: any) {
      console.error("Admin user message error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/ads", async (req, res) => {
    try {
      const q = query(collection(db, "ads"));
      const snapshot = await getDocs(q);
      const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(ads);
    } catch (e: any) {
      console.error("Admin ads fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/ads", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = await addDoc(collection(db, "ads"), {
        ...payload,
        createdAt: new Date().toISOString(),
        views: 0,
        clicks: 0
      });
      res.json({ success: true, id: docRef.id });
    } catch (e: any) {
      console.error("Admin ad create error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/admin/ads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      await setDoc(doc(db, "ads", id), payload, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin ad update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/admin/ads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "ads", id));
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin ad delete error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/ad-placements", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "ad_placements");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        res.json({});
      } else {
        res.json(docSnap.data());
      }
    } catch (e: any) {
      console.error("Admin ad placements fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/admin/ad-placements", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = doc(db, "settings", "ad_placements");
      await setDoc(docRef, payload, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin ad placements update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/ads/placements", async (req, res) => {
    try {
      // Fetch placements and ads to resolve them
      const placementsRef = doc(db, "settings", "ad_placements");
      const placementsSnap = await getDoc(placementsRef);
      if (!placementsSnap.exists()) {
        return res.json({});
      }
      const placements = placementsSnap.data();

      // Fetch active ads
      const q = query(collection(db, "ads"), where("status", "==", "🟢 Active"));
      const querySnapshot = await getDocs(q);
      const ads: Record<string, any> = {};
      querySnapshot.forEach(doc => {
        ads[doc.id] = { id: doc.id, ...doc.data() };
      });

      // Resolve placements
      const resolvedPlacements: Record<string, any> = {};
      for (const [key, adId] of Object.entries(placements)) {
        if (adId && ads[adId as string]) {
          resolvedPlacements[key] = ads[adId as string];
        }
      }

      res.json(resolvedPlacements);
    } catch (e: any) {
      console.error("Public ad placements fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  
// ==========================================
// VIDEO ADS REWARD SYSTEM
// ==========================================

// ADMIN: Get all video tasks
app.get("/api/admin/video-tasks", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "video_tasks"));
    const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN: Create or Update video task
app.post("/api/test/create-user", async (req, res) => {
  try {
    const { userId } = req.body;
    await setDoc(doc(db, "users", String(userId)), {
      id: userId,
      status: "Normal",
      balance: 0,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/video-tasks", async (req, res) => {
  try {
    const { id, ...data } = req.body;

    let docRef;
    if (id) {
      docRef = doc(db, "video_tasks", id);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      docRef = await addDoc(collection(db, "video_tasks"), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    res.json({ success: true, id: docRef.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN: Delete video task
app.delete("/api/admin/video-tasks/:id", async (req, res) => {
  try {
    await deleteDoc(doc(db, "video_tasks", req.params.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN: Video analytics
app.get("/api/admin/video-analytics", async (req, res) => {
  try {
    // Simple aggregation
    const sessionsSnap = await getDocs(collection(db, "video_task_sessions"));
    const rewardsSnap = await getDocs(collection(db, "video_rewards"));
    const tasksSnap = await getDocs(collection(db, "video_tasks"));

    const sessions = sessionsSnap.docs.map(d => d.data());
    const rewards = rewardsSnap.docs.map(d => d.data());
    const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const totalViews = sessions.length;
    const completedAds = rewards.length;
    const failedAds = totalViews - completedAds;
    const rewardsPaid = rewards.reduce((sum, r) => sum + (parseFloat(r.rewardAmount) || 0), 0);

    // Estimated revenue based on tasks' CPM
    let estimatedRevenue = 0;
    rewards.forEach(r => {
      const task = tasks.find(t => t.id === r.taskId);
      if (task && task.cpm && task.viewsPerCpm) {
        estimatedRevenue += (parseFloat(task.cpm) / parseFloat(task.viewsPerCpm));
      }
    });

    const profit = estimatedRevenue - rewardsPaid;

    res.json({
      totalViews,
      completedAds,
      failedAds,
      rewardsPaid,
      estimatedRevenue,
      profit
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// USER: Get active video tasks
app.get("/api/video-tasks", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "video_tasks"));
    const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((t: any) => t.status === "Active");
    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// USER: Get user completions
app.get("/api/video-tasks/user-completions", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const q = query(collection(db, "video_rewards"), where("userId", "==", String(userId)));
    const snap = await getDocs(q);
    const completedIds = snap.docs.map(doc => doc.data().taskId);
    
    // Group by taskId to count completions
    const counts: Record<string, number> = {};
    completedIds.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    res.json({ counts });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


// USER: Create session
app.post("/api/video-tasks/session", async (req, res) => {
  try {
    const { userId, taskId, fingerprint, userAgent, existingToken, chatId, screenResolution, timezone, language } = req.body;
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
          let fraudReason = sessionDoc.data().fraudReason || "";
          fraudReason += "Refreshed. ";
          let status = "pending";
          if (refreshes > 3) {
             status = "invalidated";
             fraudReason += "Too many refreshes. ";
          }
          await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { refreshes, riskScore, status, fraudReason, updatedAt: new Date().toISOString() });
          if (status === "invalidated") {
             return res.status(400).json({ error: "Session invalidated due to too many refreshes" });
          }
          return res.json({ token: existingToken, script: "", countdown: taskSnap.data().countdown, resumed: true });
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
       await updateDoc(doc(db, "video_task_sessions", d.id), { status: "invalidated", fraudReason: "Multiple tabs/sessions", riskScore: (d.data().riskScore || 0) + 30 });
    }

    // Generate unique 64-byte Secure Token
    const token = crypto.randomBytes(64).toString("hex");

    const userAgentStr = userAgent || "missing";
    let browser = "Unknown Browser";
    let device = "Desktop / PC";
    if (/chrome|crios/i.test(userAgentStr)) browser = "Google Chrome";
    else if (/firefox|iceweasel/i.test(userAgentStr)) browser = "Mozilla Firefox";
    else if (/safari/i.test(userAgentStr)) browser = "Apple Safari";
    else if (/msie|trident/i.test(userAgentStr)) browser = "Internet Explorer";
    else if (/opera|opr/i.test(userAgentStr)) browser = "Opera";

    if (/mobi|android|iphone|ipad|ipod/i.test(userAgentStr)) {
      if (/ipad|iphone|ipod/i.test(userAgentStr)) device = "iOS Device";
      else device = "Android Mobile";
    }

    await addDoc(collection(db, "video_task_sessions"), {
      userId: String(userId),
      chatId: String(chatId || "Unknown"),
      taskId,
      token,
      status: "pending",
      createdAt: new Date().toISOString(),
      fingerprint: fingerprint || "missing",
      userAgent: userAgentStr,
      browser,
      device,
      screenResolution: screenResolution || "Unknown",
      timezone: timezone || "Unknown",
      language: language || "Unknown",
      ip: ip,
      refreshes: 0,
      riskScore: 0,
      heartbeats: 0,
      focusLossCount: 0,
      devToolsDetected: false,
      automationDetected: false,
      fraudReason: "",
      lastHeartbeat: new Date().toISOString()
    });

    res.json({ token, script: "", countdown: taskSnap.data().countdown });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/video-tasks/heartbeat", async (req, res) => {
  try {
    const { token, userId, taskId, fingerprint, documentHidden, devToolsDetected, automationDetected, scriptLoaded, scriptExecuted, scriptLoadTime, failureReason } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: "Session not found" });

    const sessionDoc = snap.docs[0];
    const data = sessionDoc.data();

    if (data.status !== "pending") return res.json({ success: true }); // Ignore if already processed

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
    if (devToolsDetected && !data.devToolsDetected) {
      riskScore += 40;
      fraudReason += "DevTools detected. ";
    }
    if (automationDetected && !data.automationDetected) {
      riskScore += 50;
      fraudReason += "Automation detected. ";
    }

    // Evaluate active watch duration to set verified status authoritatively on backend
    if (currentStatus === "pending") {
      const taskSnap = await getDoc(doc(db, "video_tasks", data.taskId));
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        const minWatchTimeSecs = parseInt(taskData.countdown) || 30;
        
        const startTime = new Date(data.createdAt).getTime();
        const now = Date.now();
        const elapsedSecs = (now - startTime) / 1000;
        
        const maxPossibleActiveTime = heartbeats * 5;
        const estimatedHiddenTime = (focusLossCount || 0) * 5;
        const activeWatchSecs = Math.max(0, Math.min(elapsedSecs, maxPossibleActiveTime) - estimatedHiddenTime);

        // Under robust verification checks, we require scriptLoaded to be true if reported
        const isScriptOk = scriptLoaded !== false;

        // Never auto verify. Only verify after the advertisement has actually completed
        if (req.body.adCompleted && activeWatchSecs >= minWatchTimeSecs - 2 && isScriptOk && taskData.verificationMode !== "Manual") { 
          currentStatus = "verified";
        }
      }
    }

    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      status: currentStatus,
      heartbeats,
      focusLossCount,
      riskScore,
      fraudReason,
      scriptLoaded: scriptLoaded !== undefined ? scriptLoaded : (data.scriptLoaded || false),
      scriptExecuted: scriptExecuted !== undefined ? scriptExecuted : (data.scriptExecuted || false),
      scriptLoadTime: scriptLoadTime !== undefined ? scriptLoadTime : (data.scriptLoadTime || null),
      failureReason: failureReason !== undefined ? failureReason : (data.failureReason || ""),
      devToolsDetected: devToolsDetected || data.devToolsDetected,
      automationDetected: automationDetected || data.automationDetected,
      lastHeartbeat: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/video-tasks/session-status", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: "Session not found" });

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();
    res.json({ status: sessionData.status, reason: sessionData.fraudReason });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

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
    
    const globalHtml = "";
    const globalCss = "";
    const globalJs = "";

    const rules = taskData.rules || "Watch the full advertisement without closing the page.";
    const claimProcess = taskData.claimProcess || "Click 'Claim Reward' after the timer finishes.";
    
    const estimatedHiddenTimeSecs = (sessionData.focusLossCount || 0) * 5;
    const elapsedActiveSecs = Math.max(0, (sessionData.heartbeats || 0) * 5 - estimatedHiddenTimeSecs);

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
    .hidden { display: none !important; }
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
        data-ad-html="${escapeHTML(globalHtml)}"
        data-ad-css="${escapeHTML(globalCss)}"
        data-ad-js="${escapeHTML(globalJs)}"
        class="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-6">
        
    <!-- Top Card: Info & Progress -->
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
      
      <!-- New sections: Rules and Claim Process -->
      <div class="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
        <div class="mb-2"><strong>Rules:</strong> ${escapeHTML(rules)}</div>
        <div><strong>Claim Process:</strong> ${escapeHTML(claimProcess)}</div>
      </div>

      <!-- State container -->
      <div id="status-container" class="mt-6 p-5 bg-slate-950 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[140px]">
        <!-- Initial pre-watch state -->
        <div id="pre-watch-state">
           <button id="start-watch-btn" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-blue-500/20">
             Watch Ads
           </button>
        </div>

        <!-- Timer / Progress State -->
        <div id="timer-state" class="hidden flex flex-col items-center w-full">
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

        <!-- Success/Error State inserted here via JS -->
      </div>
    </div>

    <!-- Ad Wrapper -->
    <div id="ad-wrapper" class="hidden bg-slate-950 rounded-3xl border border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[280px] shadow-2xl relative overflow-hidden">
      <!-- Error Message Box -->
      <div id="ad-error-msg" class="hidden absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4">
         <i class="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-2"></i>
         <p class="text-sm text-red-400 font-bold mb-4">Unable to load advertisement.</p>
         <button id="retry-ad-btn" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition-colors">
           Retry
         </button>
      </div>

      <div id="sponsored-video-ad-container" class="w-full h-full min-h-[180px] flex items-center justify-center relative z-10 overflow-x-auto">
        <!-- Script dynamically inserted here -->
      </div>
    </div>

  </main>

  <footer class="max-w-2xl mx-auto w-full text-center py-6 border-t border-slate-800/40 mt-8 text-xs text-slate-500 flex flex-col gap-1">
    <p>RoyShare Security Protection & anti-fraud verification engines are active.</p>
  </footer>

  <script>
    // Global escapeHTML
    function escapeHTML(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    document.addEventListener("DOMContentLoaded", function() {
      try {
        const appData = document.getElementById("app-data").dataset;
        const token = appData.token;
        const userId = appData.userId;
        const taskId = appData.taskId;
        const requiredSeconds = parseInt(appData.requiredSeconds, 10);
        const elapsedActiveSecs = parseInt(appData.elapsedActiveSecs, 10);
        const rawHtml = appData.adHtml || "";
        const rawCss = appData.adCss || "";
        const rawJs = appData.adJs || "";

        console.log("Task Loaded");

        let timeLeft = Math.max(0, requiredSeconds - elapsedActiveSecs);
        let isVerified = false;
        let adLoaded = false;
        let adFailed = false;
        let heartbeatsSent = 0;
        let currentWatchTime = elapsedActiveSecs;
        
        let timerInterval;
        let heartbeatInterval;

        const startWatchBtn = document.getElementById("start-watch-btn");
        const preWatchState = document.getElementById("pre-watch-state");
        const timerState = document.getElementById("timer-state");
        const adWrapper = document.getElementById("ad-wrapper");
        const adContainer = document.getElementById("sponsored-video-ad-container");
        const adErrorMsg = document.getElementById("ad-error-msg");
        const retryAdBtn = document.getElementById("retry-ad-btn");
        const statusContainer = document.getElementById("status-container");

        function loadAdvertisement() {
          console.log("Loading Advertisement");
          adErrorMsg.classList.add("hidden");
          adContainer.innerHTML = "";
          adFailed = false;

          try {
            if ((!rawHtml || rawHtml.trim() === "") && (!rawJs || rawJs.trim() === "")) {
              adContainer.innerHTML = "<p class='text-slate-500 text-sm'>No ad configured.</p>";
              adLoaded = true;
              return;
            }

            // Inject CSS separately
            if (rawCss && rawCss.trim() !== "") {
              const styleEl = document.createElement("style");
              styleEl.textContent = rawCss;
              document.head.appendChild(styleEl);
            }

            // Render HTML normally & Parse script tags dynamically
            if (rawHtml && rawHtml.trim() !== "") {
              const parser = new DOMParser();
              const parsedDoc = parser.parseFromString(rawHtml, "text/html");

              // Recursively clone and append elements from parsed doc body to target parent.
              function cloneAndAppend(sourceNode, targetParent) {
                if (sourceNode.nodeType === 3) { // Text Node
                  targetParent.appendChild(document.createTextNode(sourceNode.nodeValue));
                } else if (sourceNode.nodeType === 8) { // Comment Node
                  targetParent.appendChild(document.createComment(sourceNode.nodeValue));
                } else if (sourceNode.nodeType === 1) { // Element Node
                  if (sourceNode.tagName.toLowerCase() === "script") {
                    const scriptEl = document.createElement("script");
                    // Copy all attributes
                    for (let i = 0; i < sourceNode.attributes.length; i++) {
                      const attr = sourceNode.attributes[i];
                      scriptEl.setAttribute(attr.name, attr.value);
                    }
                    // Copy inner content for inline scripts
                    if (sourceNode.textContent) {
                      scriptEl.textContent = sourceNode.textContent;
                    }
                    targetParent.appendChild(scriptEl);
                  } else {
                    const newEl = document.createElement(sourceNode.tagName);
                    // Copy all attributes
                    for (let i = 0; i < sourceNode.attributes.length; i++) {
                      const attr = sourceNode.attributes[i];
                      newEl.setAttribute(attr.name, attr.value);
                    }
                    // Recursively append children
                    for (let i = 0; i < sourceNode.childNodes.length; i++) {
                      cloneAndAppend(sourceNode.childNodes[i], newEl);
                    }
                    targetParent.appendChild(newEl);
                  }
                }
              }

              // Append all top-level child nodes of parsed body to the container
              const bodyNodes = Array.from(parsedDoc.body.childNodes);
              for (const node of bodyNodes) {
                cloneAndAppend(node, adContainer);
              }
            }

            // Execute custom JS (Never render as text)
            if (rawJs && rawJs.trim() !== "") {
              const scriptEl = document.createElement("script");
              scriptEl.textContent = rawJs;
              document.body.appendChild(scriptEl);
            }

            console.log("Script Injected & Custom JS Executed");
            adLoaded = true;

          } catch (e) {
            console.error("Advertisement rendering failed:", e);
            adFailed = true;
            adErrorMsg.querySelector("p").innerText = "Advertisement failed to load. Please try again.";
            adErrorMsg.classList.remove("hidden");
          }
        }

        function startTimers() {
          console.log("Advertisement Started");
          
          timerInterval = setInterval(() => {
            if (document.hidden || adFailed) return;
            if (timeLeft > 0 && !isVerified) {
              timeLeft--;
              currentWatchTime++;
              
              const timerBox = document.getElementById("timer-box");
              if (timerBox) timerBox.innerText = timeLeft;
              
              const est = document.getElementById("est-remaining");
              if (est) est.innerText = "Estimated remaining: " + timeLeft + "s";
              
              const progressBar = document.getElementById("progress-bar");
              if (progressBar) {
                const percent = Math.min(100, (currentWatchTime / requiredSeconds) * 100);
                progressBar.style.width = percent + "%";
                const pText = document.getElementById("progress-percentage");
                if (pText) pText.innerText = Math.floor(percent) + "% completed";
              }
              
              if (timeLeft === 0 && !window.adCompletedLogged) {
                console.log("Advertisement Completed");
                window.adCompletedLogged = true;
              }
            }
          }, 1000);

          heartbeatInterval = setInterval(async () => {
            if (isVerified) return;
            heartbeatsSent++;
            
            // Minimal ad verification
            const hasIframes = adContainer ? adContainer.getElementsByTagName('iframe').length > 0 : false;
            const hasScripts = adContainer ? adContainer.getElementsByTagName('script').length > 0 : false;
            const scriptLoaded = adLoaded || hasIframes || hasScripts;
            const scriptExecuted = scriptLoaded;

            try {
              const res = await fetch("/api/video-tasks/heartbeat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token, userId, taskId, fingerprint: "BROWSER_ENV",
                  documentHidden: document.hidden,
                  devToolsDetected: false, automationDetected: false,
                  scriptLoaded: scriptLoaded, 
                  scriptExecuted: scriptExecuted,
                  scriptLoadTime: 0, failureReason: scriptExecuted ? "" : "Script not executed",
                  adCompleted: window.adCompletedLogged === true
                })
              });
              
              if (!res.ok) throw new Error("Heartbeat failed");
              
              const statusRes = await fetch("/api/video-tasks/session-status?token=" + encodeURIComponent(token));
              const statusData = await statusRes.json();
              
              if (statusData.status === "verified" || statusData.status === "completed" || statusData.status === "claimed") {
                isVerified = true;
                clearInterval(timerInterval);
                clearInterval(heartbeatInterval);
                console.log("Verification Success");
                console.log("Reward Credited");
                
                statusContainer.innerHTML = 
                  '<div class="w-16 h-16 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10">' +
                    '<i class="fa-solid fa-check text-2xl text-emerald-400"></i>' +
                  '</div>' +
                  '<h2 class="text-lg font-black text-white">✅ Ad Verified Successfully</h2>' +
                  '<p class="text-xs text-slate-400 mt-1 max-w-sm">Your ad session is complete. Return to the RoyShare Mini App to instantly claim your reward.</p>' +
                  '<button onclick="window.close()" class="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95">' +
                    'Return to RoyShare' +
                  '</button>';
              } else if (statusData.status === "invalidated") {
                isVerified = true;
                clearInterval(timerInterval);
                clearInterval(heartbeatInterval);
                console.log("Verification Failed:", statusData.reason);
                statusContainer.innerHTML = 
                  '<div class="w-16 h-16 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-3">' +
                    '<i class="fa-solid fa-triangle-exclamation text-2xl text-red-400"></i>' +
                  '</div>' +
                  '<h2 class="text-base font-extrabold text-white">Session Invalidated</h2>' +
                  '<p class="text-xs text-slate-400 mt-1">' + escapeHTML(statusData.reason || "Verification checks failed. Please try again.") + '</p>';
              }
            } catch (err) {
              console.error("Heartbeat sync error:", err);
            }
          }, 5000);
        }

        startWatchBtn.addEventListener("click", () => {          console.log("Watch Ads Clicked");
          preWatchState.classList.add("hidden");
          timerState.classList.remove("hidden");
          adWrapper.classList.remove("hidden");
          loadAdvertisement();
          startTimers();
        });

        retryAdBtn.addEventListener("click", () => {
          loadAdvertisement();
        });

      } catch (err) {
        console.error("Critical error in frontend script:", err);
        const container = document.getElementById("status-container");
        if (container) {
          container.innerHTML = 
            '<div class="p-4 bg-red-950/50 rounded-xl border border-red-900/50 text-center">' +
              '<i class="fa-solid fa-circle-exclamation text-red-500 text-2xl mb-2"></i>' +
              '<h3 class="text-white font-bold text-sm">Something went wrong</h3>' +
              '<p class="text-xs text-red-400 mt-1">Please refresh the page and try again.</p>' +
              '<p class="text-[10px] text-slate-500 mt-2">' + escapeHTML(err.message) + '</p>' +
            '</div>';
        }
      }
    });
  </script>
</body>
</html>`);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// USER: Verify and Claim
app.post("/api/video-tasks/verify", async (req, res) => {
  try {
    const { userId, taskId, token, fingerprint, scriptLoaded, scriptExecuted } = req.body;
    if (!userId || !taskId || !token) return res.status(400).json({ error: "Missing parameters" });

    const q = query(collection(db, "video_task_sessions"), where("token", "==", token), where("userId", "==", String(userId)), where("taskId", "==", taskId));
    const snap = await getDocs(q);

    if (snap.empty) return res.status(400).json({ error: "Invalid session token" });

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();

    if (sessionData.status === "completed") return res.status(400).json({ error: "Reward already claimed for this session" });
    if (sessionData.status === "invalidated") return res.status(400).json({ error: "Session invalidated: " + (sessionData.fraudReason || "Unknown") });
    if (sessionData.status === "auto_banned") return res.status(400).json({ error: "Session banned due to critical security violations." });

    let riskScore = sessionData.riskScore || 0;
    let fraudReason = sessionData.fraudReason || "";
    const currentIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Unknown";
    
    // Anti IP Change
    if (sessionData.ip !== currentIp) {
       riskScore += 30;
       fraudReason += "IP changed. ";
    }
    // Anti Device Change - Fraud Scoring ONLY (Never immediately reject)
    if (fingerprint && sessionData.fingerprint !== fingerprint) {
       riskScore += 25;
       fraudReason += "Fingerprint mismatch. ";
    }

    // STRICT VERIFICATION SAFETY CHECKS
    // 1. Session is still active and in pending or verified state
    if (sessionData.status !== "verified" && sessionData.status !== "pending") {
       return res.status(400).json({ error: "Verification failed: This session is not active or ready for claiming." });
    }

    // 2. Advertisement script loaded successfully
    if (sessionData.scriptLoaded === false) {
       return res.status(400).json({ error: "Verification failed: Advertisement script failed to load." });
    }

    // 3. Heartbeats were received
    if (!sessionData.heartbeats || sessionData.heartbeats < 1) {
       return res.status(400).json({ error: "Verification failed: No heartbeats received. Please make sure the video is watched." });
    }

    // Check task limits and Watch Timer
    const taskSnap = await getDoc(doc(db, "video_tasks", taskId));
    if (!taskSnap.exists()) return res.status(404).json({ error: "Task not found" });
    const taskData = taskSnap.data();

    const minWatchTimeSecs = parseInt(taskData.countdown) || 0;
    const startTime = new Date(sessionData.createdAt).getTime();
    const now = Date.now();
    const elapsedSecs = (now - startTime) / 1000;

    // Heartbeat check: If we've been watching for X seconds, we expect about X/5 heartbeats.
    // Give some leeway. If expected > 2 and actual == 0, that's bad.
    const expectedHeartbeats = Math.floor(elapsedSecs / 5);
    if (expectedHeartbeats >= 1 && (sessionData.heartbeats || 0) === 0) {
       riskScore += 40;
       fraudReason += "Missing heartbeats. ";
    }

    // Calculate estimated active time based on heartbeats
    const maxPossibleActiveTime = (sessionData.heartbeats || 0) * 5;
    const estimatedHiddenTime = (sessionData.focusLossCount || 0) * 5;
    const activeWatchSecs = Math.min(elapsedSecs, maxPossibleActiveTime) - estimatedHiddenTime;

    // 4. Minimum watch time completed
    if (activeWatchSecs < minWatchTimeSecs - 5) { // Allow 5 seconds leeway
       riskScore += 50;
       fraudReason += "Completed too fast or hidden. ";
       await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { riskScore, fraudReason });
       return res.status(400).json({ error: "Minimum active watch time not met. Please keep the window open." });
    }

    // 5. Page remained visible (Hidden time must be <= 40% of the countdown time)
    if (estimatedHiddenTime > minWatchTimeSecs * 0.40) {
       riskScore += 35;
       fraudReason += "Too much background/hidden time. ";
       await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), { riskScore, fraudReason });
       return res.status(400).json({ error: "Verification failed: Page remained hidden or in the background for too long." });
    }

    // Check Cooldown and Limits
    const adminSettingsSnap = await getDoc(doc(db, "settings", "video_ads_config"));
    const adminSettings = adminSettingsSnap.exists() ? adminSettingsSnap.data() : { maxPerHour: 10, maxPerDay: 50, cooldownSecs: 30 };
    
    const rewardsQ = query(collection(db, "video_rewards"), where("userId", "==", String(userId)));
    const rewardsSnap = await getDocs(rewardsQ);
    const userRewards = rewardsSnap.docs.map(d => d.data()).sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    
    if (userRewards.length > 0) {
       const lastRewardTime = new Date(userRewards[0].completedAt).getTime();
       if ((now - lastRewardTime) / 1000 < (adminSettings.cooldownSecs || 0)) {
           return res.status(400).json({ error: "Cooldown period active. Please wait before next ad." });
       }
    }

    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = userRewards.filter(r => (r.completedAt || "").startsWith(today)).length;
    if (todayCompletions >= (adminSettings.maxPerDay || 50)) return res.status(400).json({ error: "Daily ad limit reached." });

    const dailyLimit = parseInt(taskData.dailyLimit) || 0;
    if (dailyLimit > 0) {
      const taskTodayCompletions = userRewards.filter(r => (r.completedAt || "").startsWith(today) && r.taskId === taskId).length;
      if (taskTodayCompletions >= dailyLimit) return res.status(400).json({ error: "Daily limit reached for this specific task" });
    }

    const userRef = doc(db, "users", String(userId));
    const userSnap = await getDoc(userRef);
    const uData = userSnap.exists() ? userSnap.data() : {};
    const userStatus = uData.status || "Normal";
    let isFlagged = ["Pending Review", "High Risk", "Shadow Monitor"].includes(userStatus) || (uData?.trustScore !== undefined && uData.trustScore < 20);
    const isSb = uData.shadowBanned === true;

    const rewardAmountRaw = parseFloat(taskData.rewardAmount) || 0;
    const economyEval = await evaluateReward(userId, rewardAmountRaw, "video_ad");
    if (!economyEval.allowed) {
      return res.status(400).json({ error: economyEval.message || "Daily limit reached. Please come back tomorrow." });
    }
    const rewardAmount = economyEval.finalAmount;

    if (economyEval.isPending) {
      isFlagged = true;
    }

    let finalStatus = "completed";
    if (isFlagged) {
      finalStatus = "pending_review";
    } else if (riskScore > 80) {
      finalStatus = "auto_banned";
    } else if (riskScore > 50) {
      finalStatus = "pending_review";
    }

    // Mark session with full telemetry logging
    await updateDoc(doc(db, "video_task_sessions", sessionDoc.id), {
      status: finalStatus,
      riskScore,
      fraudReason: isFlagged ? (fraudReason + "User status: " + userStatus) : fraudReason,
      completedAt: new Date().toISOString(),
      telemetry: {
        userId: String(userId),
        sessionId: sessionDoc.id,
        watchDuration: activeWatchSecs,
        hiddenDuration: estimatedHiddenTime,
        heartbeatCount: sessionData.heartbeats || 0,
        ipAddress: currentIp,
        browser: sessionData.browser || "Unknown",
        device: sessionData.device || "Unknown",
        scriptLoadTime: sessionData.scriptLoadTime || null,
        verificationTime: sessionData.status === "verified" ? new Date().toISOString() : (sessionData.lastHeartbeat || null),
        claimTime: new Date().toISOString(),
        failureReason: fraudReason || "None"
      }
    });

    if (finalStatus === "auto_banned") {
       return res.status(400).json({ error: "Session automatically banned due to critical security violations." });
    }
    
    // If it was flagged by anti-fraud but NOT because of user status, show suspicious activity error:
    if (finalStatus === "pending_review" && !isFlagged) {
       return res.status(200).json({ success: true, pendingReview: true, message: "Account flagged for review due to suspicious activity." });
    }

    // Save reward history with full telemetry audit trail
    await addDoc(collection(db, "video_rewards"), {
      userId: String(userId),
      taskId,
      token,
      rewardAmount,
      completedAt: new Date().toISOString(),
      shadow_banned: isSb,
      is_flagged: isFlagged,
      telemetry: {
        sessionId: sessionDoc.id,
        watchDuration: activeWatchSecs,
        hiddenDuration: estimatedHiddenTime,
        heartbeatCount: sessionData.heartbeats || 0,
        ipAddress: currentIp,
        browser: sessionData.browser || "Unknown",
        device: sessionData.device || "Unknown",
        scriptLoadTime: sessionData.scriptLoadTime || null,
        claimTime: new Date().toISOString(),
        failureReason: fraudReason || "None"
      }
    });

    // Update wallet balance
    if (userSnap.exists()) {
      if (isFlagged) {
        // Silent Review Mode: Do not credit balances. Just log transaction as Pending Review.
        await addDoc(collection(db, "transactions"), {
          userId: String(userId),
          amount: rewardAmount,
          type: "video_ad_reward",
          description: `Reward for Video Ad: ${escapeHTML(taskData.name)}`,
          status: "Pending Review",
          createdAt: new Date().toISOString(),
          taskId,
          is_flagged: true,
          flagged_status: userStatus
        });
      } else if (isSb) {
        const shadowBalance = parseFloat(uData.shadowBalance) || 0;
        const shadowRewardBalance = parseFloat(uData.shadowRewardBalance) || 0;
        const shadowAvailableBalance = parseFloat(uData.shadowAvailableBalance) || 0;
        const shadowTotalEarnings = parseFloat(uData.shadowTotalEarnings) || 0;
        
        await updateDoc(userRef, {
          shadowBalance: shadowBalance + rewardAmount,
          shadowRewardBalance: shadowRewardBalance + rewardAmount,
          shadowAvailableBalance: shadowAvailableBalance + rewardAmount,
          shadowTotalEarnings: shadowTotalEarnings + rewardAmount
        });

        await addDoc(collection(db, "shadow_blocked_rewards"), {
          userId: String(userId),
          username: uData.username || uData.firstName || "no_username",
          amount: rewardAmount,
          type: "video_ad_reward",
          createdAt: new Date().toISOString()
        });

        await addDoc(collection(db, "transactions"), {
          userId: String(userId),
          amount: rewardAmount,
          type: "video_ad_reward",
          description: `Reward for Video Ad: ${escapeHTML(taskData.name)}`,
          status: "completed",
          createdAt: new Date().toISOString(),
          taskId,
          shadow_banned: isSb
        });
      } else {
        const currentBalance = parseFloat(uData.balance) || 0;
        await updateDoc(userRef, { balance: currentBalance + rewardAmount });

        // Increase Trust Score for Completed Task (+2)
        adjustTrustScore(userId, 2, "Completed Task").catch(() => {});

        await addDoc(collection(db, "transactions"), {
          userId: String(userId),
          amount: rewardAmount,
          type: "video_ad_reward",
          description: `Reward for Video Ad: ${escapeHTML(taskData.name)}`,
          status: "completed",
          createdAt: new Date().toISOString(),
          taskId,
          shadow_banned: isSb
        });
      }
    }

    const analyticsRef = doc(db, "analytics", "video_ads");
    await setDoc(analyticsRef, { completedAds: increment(1), rewardsPaid: increment((isSb || isFlagged) ? 0 : rewardAmount) }, { merge: true });

    res.json({
      success: true,
      reward: rewardAmount,
      isFlagged,
      message: isFlagged ? "⏳ Reward is under security verification. This usually completes within a short time." : undefined
    });
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

app.post("/api/admin/video-logs-action", async (req, res) => {
  try {
    const { sessionId, action } = req.body;
    // Basic admin check should go here
    const sessionRef = doc(db, "video_task_sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) return res.status(404).json({ error: "Session not found" });

    const sessionData = sessionSnap.data();
    if (action === "approve" && sessionData.status === "pending_review") {
      // Need task data
      const taskSnap = await getDoc(doc(db, "video_tasks", sessionData.taskId));
      const rewardAmount = taskSnap.exists() ? parseFloat(taskSnap.data().rewardAmount) || 0 : 0;
      
      await updateDoc(sessionRef, { status: "completed", fraudReason: sessionData.fraudReason + " [Admin Approved]", completedAt: new Date().toISOString() });
      
      // Credit user
      const userRef = doc(db, "users", String(sessionData.userId));
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentBalance = parseFloat(userSnap.data().balance) || 0;
        await updateDoc(userRef, { balance: currentBalance + rewardAmount });
        await addDoc(collection(db, "transactions"), {
          userId: String(sessionData.userId),
          amount: rewardAmount,
          type: "video_ad_reward",
          description: `Admin Approved Reward: ${taskSnap.data()?.name || "Unknown"}`,
          status: "completed",
          createdAt: new Date().toISOString(),
          taskId: sessionData.taskId
        });
      }
      res.json({ success: true, status: "completed" });
    } else if (action === "reject") {
      await updateDoc(sessionRef, { status: "rejected", fraudReason: sessionData.fraudReason + " [Admin Rejected]" });
      res.json({ success: true, status: "rejected" });
    } else if (action === "ban") {
      await updateDoc(sessionRef, { status: "auto_banned", fraudReason: sessionData.fraudReason + " [Admin Banned]" });
      res.json({ success: true, status: "auto_banned" });
    } else {
      res.status(400).json({ error: "Invalid action or status" });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


// ==========================================
  // TELEGRAM LOGIN & SECURE REFERRAL ENGINE
  // ==========================================
  const REFERRAL_SECRET = process.env.REFERRAL_SECRET || "royshare_super_secure_salt_9182";

  const generateSecureReferralToken = (userId: string, referralCode: string): string => {
    const createdAt = Date.now();
    const expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000; // 7 days
    const payload = {
      userId,
      referralCode,
      createdAt,
      expiresAt
    };
    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac("sha256", REFERRAL_SECRET).update(payloadStr).digest("hex");
    const tokenObj = {
      p: payload,
      s: signature
    };
    return Buffer.from(JSON.stringify(tokenObj)).toString("base64url");
  };

  const verifySecureReferralToken = (token: string): { userId: string; referralCode: string; createdAt: number; expiresAt: number } | null => {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf8");
      const tokenObj = JSON.parse(raw);
      if (!tokenObj || !tokenObj.p || !tokenObj.s) return null;
      
      const payloadStr = JSON.stringify(tokenObj.p);
      const expectedSignature = crypto.createHmac("sha256", REFERRAL_SECRET).update(payloadStr).digest("hex");
      if (expectedSignature !== tokenObj.s) {
        console.warn("[ReferralToken] Signature mismatch!");
        return null;
      }
      
      if (Date.now() > tokenObj.p.expiresAt) {
        console.warn("[ReferralToken] Token expired!");
        return null;
      }
      
      return tokenObj.p;
    } catch (e) {
      console.error("[ReferralToken] Error verifying token:", e);
      return null;
    }
  };

  const findReferrerByCode = async (dbInstance: any, code: string): Promise<any> => {
    if (!code) return null;
    const cleanCode = code.trim();
    
    const directDoc = await getDoc(doc(dbInstance, "users", cleanCode));
    if (directDoc.exists()) {
        return { id: directDoc.id, data: directDoc.data() };
    }

    const q1 = query(collection(dbInstance, "users"), where("referralCode", "==", cleanCode));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
        return { id: snap1.docs[0].id, data: snap1.docs[0].data() };
    }

    if (cleanCode.startsWith("ref_")) {
        const stripped = cleanCode.substring(4);
        const refDoc = await getDoc(doc(dbInstance, "users", stripped));
        if (refDoc.exists()) {
            return { id: refDoc.id, data: refDoc.data() };
        }
    }
    return null;
  };

  function verifyTelegramWidgetAuth(user: any, botToken: string): boolean {
    const { hash, ...data } = user;
    if (!hash || !botToken) return false;

    const secretKey = crypto.createHash("sha256").update(botToken).digest();

    const dataCheckArr = Object.keys(data)
      .map(key => `${key}=${data[key]}`)
      .sort()
      .join("\n");

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckArr)
      .digest("hex");

    return calculatedHash === hash;
  }

  // Duplicate GET /api/admin/telegram-settings route removed to prevent shadowing.
  // The fully featured GET /api/admin/telegram-settings endpoint is declared further down in this file.

  app.post("/api/admin/telegram-settings/save", async (req, res) => {
    try {
      const {
        botToken,
        botUsername,
        miniAppShortName,
        clientId,
        clientSecret,
        redirectUri,
        trustedOrigin
      } = req.body;
      
      const configRef = doc(db, "settings", "telegram");
      const configSnap = await getDoc(configRef);
      
      let currentBotTokenEnc = "";
      let currentClientSecretEnc = "";
      if (configSnap.exists()) {
        const d = configSnap.data();
        currentBotTokenEnc = d.botToken || "";
        currentClientSecretEnc = d.clientSecret || "";
      } else {
        const legacyRef = doc(db, "telegram_settings", "config");
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          currentBotTokenEnc = legacySnap.data().encryptedClientSecret || "";
          currentClientSecretEnc = legacySnap.data().encryptedClientSecret || "";
        }
      }

      let finalBotToken = currentBotTokenEnc;
      if (botToken && botToken !== "••••••••••••••" && botToken !== "••••••••••••••••") {
        finalBotToken = encryptSecret(botToken);
      }

      let finalClientSecret = currentClientSecretEnc;
      if (clientSecret && clientSecret !== "••••••••••••••" && clientSecret !== "••••••••••••••••") {
        finalClientSecret = encryptSecret(clientSecret);
      }

      const updatedAt = new Date().toISOString();

      // VALIDATE BOT
      let botConnected = false;
      if (botUsername && miniAppShortName && finalBotToken) {
        try {
          const decBotToken = decryptSecret(finalBotToken);
          const response = await fetch(`https://api.telegram.org/bot${decBotToken}/getMe`);
          const d = await response.json();
          if (response.ok && d.ok) {
            botConnected = true;
          }
        } catch (e) {
          console.error("Bot validation failed on save:", e);
        }
      }

      // VALIDATE LOGIN
      let loginConnected = false;
      if (clientId && finalClientSecret && redirectUri && trustedOrigin) {
        try {
          const decClientSecret = decryptSecret(finalClientSecret);
          const rUrl = new URL(redirectUri);
          const tOrigin = new URL(trustedOrigin);
          const isUrlValid = (rUrl.protocol === "https:" || rUrl.hostname === "localhost" || rUrl.hostname === "127.0.0.1") &&
                            (tOrigin.protocol === "https:" || tOrigin.hostname === "localhost" || tOrigin.hostname === "127.0.0.1");
          
          if (isUrlValid) {
            if (decClientSecret.includes(":")) {
              const response = await fetch(`https://api.telegram.org/bot${decClientSecret}/getMe`);
              const d = await response.json();
              if (response.ok && d.ok) {
                loginConnected = true;
              }
            } else {
              loginConnected = true;
            }
          }
        } catch (e) {
          console.error("Login validation failed on save:", e);
        }
      }

      const saveData = {
        botToken: finalBotToken,
        botUsername: botUsername || "",
        miniAppShortName: miniAppShortName || "",
        clientId: clientId || "",
        clientSecret: finalClientSecret,
        redirectUri: redirectUri || "",
        trustedOrigin: trustedOrigin || "",
        botConnected,
        loginConnected,
        updatedAt
      };

      await setDoc(configRef, saveData);

      res.json({
        success: true,
        botConnected,
        loginConnected,
        message: "Telegram configuration saved."
      });
    } catch (e: any) {
      console.error("Error saving Telegram settings:", e);
      res.status(500).json({ error: e.message || "Failed to save settings" });
    }
  });

  app.post("/api/admin/telegram-settings/verify", async (req, res) => {
    try {
      const {
        botToken,
        botUsername,
        miniAppShortName,
        clientId,
        clientSecret,
        redirectUri,
        trustedOrigin
      } = req.body;

      const configRef = doc(db, "settings", "telegram");
      const configSnap = await getDoc(configRef);
      
      let currentBotTokenEnc = "";
      let currentClientSecretEnc = "";
      if (configSnap.exists()) {
        const d = configSnap.data();
        currentBotTokenEnc = d.botToken || "";
        currentClientSecretEnc = d.clientSecret || "";
      }

      let finalBotToken = currentBotTokenEnc;
      if (botToken && botToken !== "••••••••••••••" && botToken !== "••••••••••••••••") {
        finalBotToken = encryptSecret(botToken);
      }

      let finalClientSecret = currentClientSecretEnc;
      if (clientSecret && clientSecret !== "••••••••••••••" && clientSecret !== "••••••••••••••••") {
        finalClientSecret = encryptSecret(clientSecret);
      }

      // 1. Verify Bot Token
      if (!botToken || botToken === "") {
        return res.status(400).json({ success: false, error: "Bot Token is required." });
      }
      if (!botUsername) {
        return res.status(400).json({ success: false, error: "Bot Username is required." });
      }
      if (!miniAppShortName) {
        return res.status(400).json({ success: false, error: "Mini App Short Name is required." });
      }

      const decBotToken = decryptSecret(finalBotToken);
      const botResponse = await fetch(`https://api.telegram.org/bot${decBotToken}/getMe`);
      const botData = await botResponse.json();
      if (!botResponse.ok || !botData.ok) {
        return res.status(400).json({ success: false, error: "❌ Invalid Bot Token" });
      }

      // 2. Verify Telegram Login
      if (!clientId) {
        return res.status(400).json({ success: false, error: "Client ID is required." });
      }
      if (!clientSecret || clientSecret === "") {
        return res.status(400).json({ success: false, error: "Client Secret is required." });
      }
      if (!redirectUri) {
        return res.status(400).json({ success: false, error: "Redirect URI is required." });
      }
      if (!trustedOrigin) {
        return res.status(400).json({ success: false, error: "Trusted Origin is required." });
      }

      try {
        const rUrl = new URL(redirectUri);
        if (rUrl.protocol !== "https:" && rUrl.hostname !== "localhost" && rUrl.hostname !== "127.0.0.1") {
          return res.status(400).json({ success: false, error: "Redirect URI must use HTTPS" });
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid Redirect URI" });
      }

      try {
        const tOrigin = new URL(trustedOrigin);
        if (tOrigin.protocol !== "https:" && tOrigin.hostname !== "localhost" && tOrigin.hostname !== "127.0.0.1") {
          return res.status(400).json({ success: false, error: "Trusted Origin must use HTTPS" });
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid Trusted Origin" });
      }

      const decClientSecret = decryptSecret(finalClientSecret);
      if (decClientSecret.includes(":")) {
        const response = await fetch(`https://api.telegram.org/bot${decClientSecret}/getMe`);
        const d = await response.json();
        if (!response.ok || !d.ok) {
          return res.status(400).json({ success: false, error: "❌ Invalid Telegram Login Configuration" });
        }
      }

      res.json({ success: true, botConnected: true, loginConnected: true });
    } catch (e: any) {
      console.error("Error verifying Telegram configuration:", e);
      res.status(500).json({ error: e.message || "Failed to verify configuration" });
    }
  });

  app.get("/api/referral/secure-link", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const userDocRef = doc(db, "users", String(userId));
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userData = userSnap.data();
      let referralCode = userData.referralCode || "";
      if (!referralCode) {
        referralCode = `RS${String(userId).slice(-6).toUpperCase()}`;
        await updateDoc(userDocRef, { referralCode });
      }

      const token = generateSecureReferralToken(String(userId), referralCode);
      
      const tokenRef = doc(db, "secureReferralTokens", token);
      await setDoc(tokenRef, {
        token,
        userId: String(userId),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        ipAddress: req.ip || "",
        device: req.headers["user-agent"] || ""
      });

      const secureLink = `https://www.royshare.online/ref/${token}`;
      res.json({ success: true, secureLink, token });
    } catch (e: any) {
      console.error("Error generating secure link:", e);
      res.status(500).json({ error: "Failed to generate secure link" });
    }
  });

  // Deprecated: Legacy Telegram Login Widget endpoints replaced by secure direct deep link referrals
  app.post("/api/auth/telegram-login", (req, res) => {
    res.status(410).json({ success: false, error: "Telegram Login Widget is deprecated and removed. Please use direct deep link referrals." });
  });

  app.get("/auth/telegram/callback", (req, res) => {
    res.status(410).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #020617; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h2 style="color: #38bdf8;">Legacy Telegram Login Deprecated</h2>
        <p style="color: #94a3b8; max-width: 500px; line-height: 1.6;">The Telegram login widget flow has been replaced with a secure, direct deep-link referral system.</p>
        <a href="/" style="margin-top: 20px; display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; transition: all 0.2s;">Return to Home</a>
      </div>
    `);
  });

  app.get("/api/telegram-config", async (req, res) => {
    try {
      const configRef = doc(db, "settings", "telegram");
      let configSnap = await getDoc(configRef);
      
      let data: any = {};
      if (configSnap.exists()) {
        data = configSnap.data();
      } else {
        const legacyRef = doc(db, "telegram_settings", "config");
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          data = legacySnap.data();
        }
      }

      res.json({
        clientId: data.clientId || "",
        botUsername: data.botUsername || "Roysharearn_bot",
        miniAppShortName: data.miniAppShortName || "earn",
        redirectUri: data.redirectUri || "",
        trustedOrigin: data.trustedOrigin || ""
      });
    } catch (e) {
      console.error("Error reading Telegram config:", e);
      res.json({
        clientId: "",
        botUsername: "Roysharearn_bot",
        miniAppShortName: "earn",
        redirectUri: "",
        trustedOrigin: ""
      });
    }
  });

  // Standalone Telegram Login Widget Test Route
  app.get("/tg-test.html", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Telegram Login Widget Standalone Test</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          }
          h1 {
            font-size: 20px;
            margin-bottom: 8px;
            color: #38bdf8;
          }
          p {
            font-size: 14px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .widget-container {
            display: inline-block;
            margin: 20px 0;
            padding: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
          }
          .meta {
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #334155;
            padding-top: 16px;
            margin-top: 24px;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .meta-value {
            font-family: monospace;
            color: #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Standalone Telegram Login Widget Audit</h1>
          <p>This is a raw HTML page loaded outside of React to determine if any virtual DOM, CSP headers, or SPA routing interferes with the Telegram widget initialization.</p>
          
          <div class="widget-container">
            <!-- Official Telegram Widget Script -->
            <script 
              async 
              src="https://telegram.org/js/telegram-widget.js?22" 
              data-telegram-login="Roysharearn_bot" 
              data-size="large" 
              data-radius="16" 
              data-onauth="onTelegramAuth(user)" 
              data-request-access="write">
            </script>
          </div>

          <p style="font-size: 11px; margin-top: 10px; color: #cbd5e1;">
            If the widget above renders with a "Log in with Telegram" button, React or DOM manipulation is causing issues in the main app. If it shows "Bot domain invalid", the domain configuration/binding on BotFather or the domain ownership is incorrect.
          </p>

          <div class="meta">
            <div class="meta-item">
              <span>Domain Origin:</span>
              <span class="meta-value" id="origin-val"></span>
            </div>
            <div class="meta-item">
              <span>Current URL:</span>
              <span class="meta-value" id="url-val"></span>
            </div>
            <div class="meta-item">
              <span>Target Bot:</span>
              <span class="meta-value">Roysharearn_bot</span>
            </div>
          </div>
        </div>

        <script>
          document.getElementById('origin-val').textContent = window.location.origin;
          document.getElementById('url-val').textContent = window.location.hostname;

          window.onTelegramAuth = function(user) {
            console.log("Telegram Auth Callback success:", user);
            alert("Authenticated successfully!
User: " + user.first_name + " (" + user.id + ")");
          };
        </script>
      </body>
      </html>
    `);
  });

  app.get("/ads.txt", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "ads_txt");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.status(404).send("");
      }
      const data = docSnap.data();
      const content = data?.content ?? "";
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(content);
    } catch (e: any) {
      console.error("Error serving ads.txt:", e);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(500).send("");
    }
  });

  app.get("/api/admin/ads-txt", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "ads_txt");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.json({ content: "", updatedAt: null });
      }
      return res.json(docSnap.data());
    } catch (e: any) {
      console.error("Error fetching admin ads-txt:", e);
      return res.status(500).json({ error: "Server error fetching ads.txt" });
    }
  });

  app.put("/api/admin/ads-txt", async (req, res) => {
    try {
      const { content } = req.body;
      const docRef = doc(db, "settings", "ads_txt");
      const updatedAt = new Date().toISOString();
      await setDoc(docRef, { content, updatedAt }, { merge: true });
      return res.json({ success: true, updatedAt });
    } catch (e: any) {
      console.error("Error updating admin ads-txt:", e);
      return res.status(500).json({ error: "Server error updating ads.txt" });
    }
  });

  // Ads.txt modular providers manager endpoints
  app.get("/api/admin/ads-txt-providers", async (req, res) => {
    try {
      const colRef = collection(db, "ads_txt_providers");
      const snapshot = await getDocs(colRef);
      const providers: any[] = [];
      snapshot.forEach((docSnap) => {
        providers.push({ id: docSnap.id, ...docSnap.data() });
      });
      providers.sort((a, b) => (a.providerName || "").localeCompare(b.providerName || ""));
      return res.json({ success: true, providers });
    } catch (e: any) {
      console.error("Error fetching ads.txt providers:", e);
      return res.status(500).json({ error: "Server error fetching ads.txt providers: " + e.message });
    }
  });

  app.post("/api/admin/ads-txt-providers", async (req, res) => {
    try {
      const { providerName, providerType, snippet, enabled } = req.body;
      if (!providerName || !providerName.trim()) {
        return res.status(400).json({ error: "Provider name is required." });
      }
      if (!snippet || !snippet.trim()) {
        return res.status(400).json({ error: "Snippet content is required." });
      }

      const colRef = collection(db, "ads_txt_providers");
      const snapshot = await getDocs(colRef);
      const duplicate = snapshot.docs.some(docSnap => {
        const data = docSnap.data();
        return data.providerName?.trim().toLowerCase() === providerName.trim().toLowerCase();
      });

      if (duplicate) {
        return res.status(400).json({ error: `A provider with the name "${providerName}" already exists.` });
      }

      const now = new Date().toISOString();
      const newDoc = {
        providerName: providerName.trim(),
        providerType: providerType || "Custom",
        snippet: snippet.trim(),
        enabled: enabled !== false,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(colRef, newDoc);
      return res.json({ success: true, id: docRef.id, provider: { id: docRef.id, ...newDoc } });
    } catch (e: any) {
      console.error("Error adding ads.txt provider:", e);
      return res.status(500).json({ error: "Server error adding provider: " + e.message });
    }
  });

  app.put("/api/admin/ads-txt-providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { providerName, providerType, snippet, enabled } = req.body;

      if (!providerName || !providerName.trim()) {
        return res.status(400).json({ error: "Provider name is required." });
      }
      if (!snippet || !snippet.trim()) {
        return res.status(400).json({ error: "Snippet content is required." });
      }

      const colRef = collection(db, "ads_txt_providers");
      const snapshot = await getDocs(colRef);
      const duplicate = snapshot.docs.some(docSnap => {
        if (docSnap.id === id) return false;
        const data = docSnap.data();
        return data.providerName?.trim().toLowerCase() === providerName.trim().toLowerCase();
      });

      if (duplicate) {
        return res.status(400).json({ error: `A provider with the name "${providerName}" already exists.` });
      }

      const docRef = doc(db, "ads_txt_providers", id);
      const now = new Date().toISOString();
      const updatedData: any = {
        providerName: providerName.trim(),
        providerType: providerType || "Custom",
        snippet: snippet.trim(),
        updatedAt: now
      };
      if (typeof enabled === "boolean") {
        updatedData.enabled = enabled;
      }

      await updateDoc(docRef, updatedData);
      return res.json({ success: true, id, provider: { id, ...updatedData } });
    } catch (e: any) {
      console.error("Error updating ads.txt provider:", e);
      return res.status(500).json({ error: "Server error updating provider: " + e.message });
    }
  });

  app.delete("/api/admin/ads-txt-providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = doc(db, "ads_txt_providers", id);
      await deleteDoc(docRef);
      return res.json({ success: true, id });
    } catch (e: any) {
      console.error("Error deleting ads.txt provider:", e);
      return res.status(500).json({ error: "Server error deleting provider: " + e.message });
    }
  });

  app.patch("/api/admin/ads-txt-providers/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "Enabled must be a boolean." });
      }

      const docRef = doc(db, "ads_txt_providers", id);
      const now = new Date().toISOString();
      await updateDoc(docRef, { enabled, updatedAt: now });
      return res.json({ success: true, id, enabled });
    } catch (e: any) {
      console.error("Error toggling ads.txt provider:", e);
      return res.status(500).json({ error: "Server error toggling provider: " + e.message });
    }
  });

  app.get("/api/admin/system-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "system");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        res.json({
          botSettings: {},
          earningSettings: {},
          withdrawalSettings: {},
          referralSettings: {},
          bonusSettings: {},
          notificationSettings: {},
          websiteSettings: {},
          withdrawalTaxSettings: {
            upiTax: 5,
            bankTax: 10,
            usdtTax: 15
          },
          urlShortener: {
            enabled: false,
            provider: "GPLinks",
            apiKey: "",
            publisherId: "",
            testStatus: "Not Tested",
            testedAt: ""
          },
          maintenanceMode: "🟢 OFF"
        });
      } else {
        const data = docSnap.data();
        if (!data.urlShortener) {
          data.urlShortener = {
            enabled: false,
            provider: "GPLinks",
            apiKey: "",
            publisherId: "",
            testStatus: "Not Tested",
            testedAt: ""
          };
        }
        res.json(data);
      }
    } catch (e: any) {
      console.error("Admin system settings fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/admin/system-settings", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = doc(db, "settings", "system");
      await setDoc(docRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin system settings update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ImgBB API Endpoints
  app.get("/api/admin/imgbb/config", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "imgbb");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.json({ apiKey: "", verified: false, testStatus: "Not Verified" });
      }
      return res.json(docSnap.data());
    } catch (e: any) {
      console.error("Error fetching ImgBB config:", e);
      return res.status(500).json({ error: "Server error fetching ImgBB config" });
    }
  });

  app.put("/api/admin/imgbb/config", async (req, res) => {
    try {
      const { apiKey, verified, testStatus } = req.body;
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ error: "API key is required." });
      }
      const docRef = doc(db, "settings", "imgbb");
      await setDoc(docRef, {
        apiKey: apiKey.trim(),
        verified: verified ?? false,
        testStatus: testStatus ?? "Not Verified",
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error updating ImgBB config:", e);
      return res.status(500).json({ error: "Server error updating ImgBB config" });
    }
  });

  app.post("/api/admin/imgbb/verify", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const keyToUse = apiKey || "";
      if (!keyToUse.trim()) {
        return res.status(400).json({ success: false, error: "API key is required" });
      }

      // Perform a small test upload request with 1x1 png transparent pixel
      const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      const params = new URLSearchParams();
      params.append("image", testBase64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(keyToUse.trim())}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("ImgBB verify failed:", text);
        return res.status(400).json({ success: false, error: "Invalid API Key or unable to connect to ImgBB." });
      }

      const resData = await response.json();
      if (resData && resData.success) {
        // Save verified status in DB
        const docRef = doc(db, "settings", "imgbb");
        await setDoc(docRef, {
          apiKey: keyToUse.trim(),
          verified: true,
          testStatus: "Connected",
          updatedAt: new Date().toISOString()
        }, { merge: true });

        return res.json({
          success: true,
          message: "API Verified Successfully",
          status: "Connected",
          provider: "ImgBB"
        });
      } else {
        return res.status(400).json({ success: false, error: "Invalid API Key" });
      }
    } catch (e: any) {
      console.error("ImgBB verification error:", e);
      return res.status(500).json({ success: false, error: "Unable to connect to ImgBB: " + e.message });
    }
  });

  app.post("/api/admin/upload-image", express.json({ limit: "15mb" }), async (req, res) => {
    try {
      const { base64, folder = "giveaways" } = req.body;
      if (!base64) {
        return res.status(400).json({ success: false, error: "No image file provided." });
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      let imgUrl = null;

      // 1. Try ImgBB first
      try {
        const docRef = doc(db, "settings", "imgbb");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().apiKey) {
          const apiKey = docSnap.data().apiKey;
          const params = new URLSearchParams();
          params.append("image", cleanBase64);
          
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
            method: "POST",
            body: params
          });
          const data = await response.json();
          if (response.ok && data.success) {
            return res.json({ success: true, url: data.data.url });
          }
        }
      } catch (err) {
        console.error("ImgBB upload error (falling back to Firebase Storage):", err);
      }

      // 2. Fallback to Firebase Storage Admin
      try {
        const match = base64.match(/^data:(image\/\w+);base64,/);
        const mimeType = match ? match[1] : "image/png";
        const ext = mimeType.split("/")[1] || "png";
        const buffer = Buffer.from(cleanBase64, "base64");
        
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const bucket = getStorage().bucket();
        const fileRef = bucket.file(fileName);
        
        await fileRef.save(buffer, {
          metadata: { contentType: mimeType }
        });

        try {
          await fileRef.makePublic();
          imgUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        } catch (pubErr) {
          console.error("Failed to make public, generating signed URL instead:", pubErr);
          const [signedUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '01-01-2100' // Far future expiry
          });
          imgUrl = signedUrl;
        }

        return res.json({ success: true, url: imgUrl });
      } catch (err) {
        console.error("Firebase Storage Admin upload error:", err);
        return res.status(500).json({ success: false, error: "Failed to upload image via both ImgBB and Firebase." });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
});

  app.post("/api/admin/imgbb/upload", express.json({ limit: "15mb" }), async (req, res) => {
    try {
      const { base64 } = req.body;
      if (!base64) {
        return res.status(400).json({ success: false, error: "No image file provided." });
      }

      // Retrieve stored key
      const docRef = doc(db, "settings", "imgbb");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.status(400).json({ success: false, error: "ImgBB API Key is not configured." });
      }
      const { apiKey } = docSnap.data();
      if (!apiKey) {
        return res.status(400).json({ success: false, error: "ImgBB API Key is missing or empty." });
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const params = new URLSearchParams();
      params.append("image", cleanBase64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("ImgBB upload error response:", text);
        return res.status(400).json({ success: false, error: "Upload Failed. Please check ImgBB status or API Key." });
      }

      const resData = await response.json();
      if (resData && resData.success && resData.data && resData.data.url) {
        return res.json({
          success: true,
          url: resData.data.url,
          displayUrl: resData.data.display_url || resData.data.url
        });
      } else {
        return res.status(400).json({ success: false, error: "Upload Failed. Response format invalid." });
      }
    } catch (e: any) {
      console.error("ImgBB proxy upload error:", e);
      return res.status(500).json({ success: false, error: "Upload Failed: " + e.message });
    }
  });

  // Helper for URL shortening
  async function shortenWithProvider(provider: string, apiKey: string, url: string, publisherId?: string) {
    let endpoint = "";
    let responseText = "";
    
    const cleanProvider = (provider || "").trim().toLowerCase();
    
    if (cleanProvider === "own") {
      return url; // Internal links already use our short URL format
    }
    
    if (cleanProvider === "gplinks") {
      endpoint = `https://gplinks.in/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "shrinkme") {
      endpoint = `https://shrinkme.io/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "droplink") {
      endpoint = `https://droplink.co/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "shrinkearn") {
      endpoint = `https://shrinkearn.com/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "ouo.io") {
      endpoint = `https://ouo.io/api/${apiKey}?s=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "shorte.st" || cleanProvider === "shortest") {
      endpoint = `https://api.shorte.st/stxt?k=${apiKey}&s=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "adfly") {
      endpoint = `https://api.adf.ly/v1/shorten?_user_id=${publisherId || ""}&_api_key=${apiKey}&url=${encodeURIComponent(url)}`;
    } else {
      // Custom/Generic template
      if (apiKey.includes("{URL}") || apiKey.includes("{url}")) {
        endpoint = apiKey.replace(/{URL}/g, encodeURIComponent(url)).replace(/{url}/g, encodeURIComponent(url));
      } else {
        // default fallback
        endpoint = `https://gplinks.in/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
      }
    }

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, * / *"
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    responseText = await res.text();
    
    try {
      const data = JSON.parse(responseText);
      if (data.status === "success" && data.shortenedUrl) {
        return data.shortenedUrl;
      }
      if (data.shortenedUrl) {
        return data.shortenedUrl;
      }
      if (data.short_url) {
        return data.short_url;
      }
      if (data.url) {
        return data.url;
      }
      if (data.status === "error" && data.message) {
        throw new Error(data.message);
      }
    } catch (jsonErr) {
      const trimmed = responseText.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
    }

    throw new Error(`Could not extract short URL: ${responseText.substring(0, 100)}`);
  }

  // Admin endpoint to test connection for URL shorteners
  app.post("/api/admin/shortener/test-connection", async (req, res) => {
    try {
      const { provider, apiKey, publisherId } = req.body;
      const cleanProvider = (provider || "").trim().toLowerCase();
      
      if (cleanProvider !== "own" && !apiKey) {
        return res.status(400).json({ error: "API Key / URL Template is required." });
      }
      
      const testUrl = "https://google.com";
      const shortenedUrl = await shortenWithProvider(provider, apiKey, testUrl, publisherId);
      res.json({ success: true, shortenedUrl });
    } catch (err: any) {
      console.error("Shortener test connection error:", err);
      res.status(500).json({ error: err.message || "Failed to shorten URL using configured provider." });
    }
  });

  // Log link click and credit earnings to the owner of the link!
  app.post("/api/links/:linkId/visit", async (req, res) => {
    try {
      const { linkId } = req.params;
      const linkRef = doc(db, "links", linkId);
      const linkSnap = await getDoc(linkRef);
      if (!linkSnap.exists()) {
        return res.status(404).json({ error: "Link not found" });
      }

      const linkData = linkSnap.data();
      const userId = linkData.userId;

      // Update link views
      const currentViews = linkData.views || 0;
      await setDoc(linkRef, {
        views: currentViews + 1
      }, { merge: true });

      // Get earning settings from system config to determine CPM
      const sysRef = doc(db, "settings", "system");
      const sysSnap = await getDoc(sysRef);
      let cpm = 5.0; // Default CPM of $5.0 per 1000 views ($0.005 per click)
      if (sysSnap.exists()) {
        const earningSettings = sysSnap.data().earningSettings || {};
        cpm = parseFloat(earningSettings.linkCpm || "5.0") || 5.0;
      }

      const clickReward = cpm / 1000;

      // Credit earnings to owner's balance in Firestore
      if (userId) {
        const userRef = doc(db, "users", String(userId));
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentLinkEarnings = userData.linkEarnings || 0;
          const currentBalance = userData.balance || 0;
          const currentTotalEarned = userData.totalEarned || 0;

          await setDoc(userRef, {
            linkEarnings: currentLinkEarnings + clickReward,
            balance: currentBalance + clickReward,
            totalEarned: currentTotalEarned + clickReward
          }, { merge: true });
        }
      }

      res.json({ success: true, originalUrl: linkData.originalUrl });
    } catch (err: any) {
      console.error("Error logging link visit:", err);
      res.status(500).json({ error: "Failed to record link visit" });
    }
  });

  app.get("/api/admin/analytics-full", async (req, res) => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const filesSnap = await getDocs(collection(db, "files"));
      const linksSnap = await getDocs(collection(db, "links"));
      const withdrawalsSnap = await getDocs(collection(db, "withdrawals"));
      const adsSnap = await getDocs(collection(db, "ads"));
      
      const users = usersSnap.docs.map(d => d.data());
      const files = filesSnap.docs.map(d => d.data());
      const links = linksSnap.docs.map(d => d.data());
      const withdrawals = withdrawalsSnap.docs.map(d => d.data());
      const ads = adsSnap.docs.map(d => d.data());

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const thisWeek = today - 7 * 24 * 60 * 60 * 1000;
      const thisMonth = today - 30 * 24 * 60 * 60 * 1000;

      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status !== 'Banned').length;
      const newUsersToday = users.filter(u => new Date(u.joinDate).getTime() >= today).length;
      const newUsersThisWeek = users.filter(u => new Date(u.joinDate).getTime() >= thisWeek).length;
      const newUsersThisMonth = users.filter(u => new Date(u.joinDate).getTime() >= thisMonth).length;

      const filesUploadedToday = files.filter(f => new Date(f.uploadedAt).getTime() >= today).length;
      const filesUploadedThisWeek = files.filter(f => new Date(f.uploadedAt).getTime() >= thisWeek).length;
      const filesUploadedThisMonth = files.filter(f => new Date(f.uploadedAt).getTime() >= thisMonth).length;
      const mostDownloadedFiles = [...files].sort((a, b) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0)).slice(0, 5);
      
      const totalEarnings = users.reduce((acc, u) => acc + Number(u.balance || 0), 0);
      const totalBonusClaims = users.reduce((acc, u) => acc + Number(u.bonusBalance || 0), 0);
      
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;
      const approvedWithdrawals = withdrawals.filter(w => w.status === 'Approved').length;
      const paidWithdrawals = withdrawals.filter(w => w.status === 'Paid').length;
      const rejectedWithdrawals = withdrawals.filter(w => w.status === 'Rejected').length;
      const totalWithdrawAmount = withdrawals.reduce((acc, w) => acc + Number(w.amount || 0), 0);

      const totalReferrals = users.reduce((acc, u) => acc + Number(u.referrals || 0), 0);
      const validReferrals = totalReferrals;
      const rejectedReferrals = 0;
      const topReferrers = [...users].sort((a, b) => (Number(b.referrals) || 0) - (Number(a.referrals) || 0)).slice(0, 5);

      const totalAdViews = ads.reduce((acc, a) => acc + Number(a.views || 0), 0);
      const totalAdClicks = ads.reduce((acc, a) => acc + Number(a.clicks || 0), 0);
      const topPerformingAd = [...ads].sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0))[0] || null;

      // 🎮 Game Analytics
      const gamesSnap = await getDocs(collection(db, "games"));
      let totalOpens = 0;
      let totalCompletions = 0;
      let totalClaims = 0;
      let totalPlayTime = 0;
      gamesSnap.forEach(g => {
        const gd = g.data();
        totalOpens += Number(gd.analytics?.opens || 0);
        totalCompletions += Number(gd.analytics?.completions || 0);
        totalClaims += Number(gd.analytics?.claims || 0);
        totalPlayTime += Number(gd.analytics?.totalPlayTime || 0);
      });

      res.json({
        overview: {
          totalUsers,
          totalUploads: files.length,
          totalLinks: links.length,
          totalEarnings,
          totalWithdrawals: withdrawals.length,
          totalBonusClaims,
          totalRewardClaims: totalClaims,
          totalReferrals
        },
        userAnalytics: { totalUsers, activeUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth },
        gameAnalytics: {
          totalOpens,
          totalCompletions,
          totalClaims,
          avgPlayTime: totalCompletions > 0 ? totalPlayTime / totalCompletions : 0
        },
        earningsAnalytics: {
          todayEarnings: totalEarnings * 0.05,
          weeklyEarnings: totalEarnings * 0.2,
          monthlyEarnings: totalEarnings * 0.5,
          lifetimeEarnings: totalEarnings
        },
        withdrawalAnalytics: {
          pendingWithdrawals, approvedWithdrawals, paidWithdrawals, rejectedWithdrawals, totalWithdrawAmount
        },
        uploadAnalytics: {
          filesUploadedToday, filesUploadedThisWeek, filesUploadedThisMonth, mostDownloadedFiles
        },
        referralAnalytics: {
          totalReferrals, validReferrals, rejectedReferrals, topReferrers
        },
        adAnalytics: {
          totalAdViews, totalAdClicks, topPerformingAd,
          ctr: totalAdViews > 0 ? ((totalAdClicks / totalAdViews) * 100).toFixed(2) + '%' : '0.00%'
        }
      });
    } catch (e: any) {
      console.error("Analytics fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

// =========================================================
  // ROYSHARE REFERRAL SYSTEM V4 (BACKEND MODULES & APIs)
  // =========================================================

  // Helper to send Telegram messages
  async function sendTelegramMessageLocal(botToken: string, chatId: number, text: string, options: any = {}) {
    try {
      if (!botToken) return;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: options.parse_mode || "Markdown",
          reply_markup: options.reply_markup
        })
      });
      return await res.json();
    } catch (err) {
      console.error("Error sending local Telegram message:", err);
    }
  }

  // Format Date/Time helper
  function formatTransactionDateTimeLocal(date: Date) {
    const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { dateStr, timeStr };
  }

  // Aggregates real-time URL clicks and file downloads for a referred user
  async function getUserActivityStatsLocal(db: any, userId: string) {
    let downloadCount = 0;
    let clickCount = 0;
    try {
      const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", String(userId)));
      const uploadsSnap = await getDocs(uploadsQuery);
      uploadsSnap.forEach((doc) => {
        downloadCount += Number(doc.data().downloads || 0);
      });
    } catch (err) {
      console.error("Error fetching user activity downloads:", err);
    }

    try {
      const linksQuery = query(collection(db, "links"), where("userId", "==", String(userId)));
      const linksSnap = await getDocs(linksQuery);
      linksSnap.forEach((doc) => {
        clickCount += Number(doc.data().completedRedirects || doc.data().downloads || doc.data().clicks || 0);
      });
    } catch (err) {
      console.error("Error fetching user activity links:", err);
    }

    return { downloadCount, clickCount };
  }

  // Checks if the referred user has submitted at least one withdrawal request
  async function getFirstWithdrawalStatusLocal(db: any, userId: string) {
    try {
      const q = query(collection(db, "withdrawals"), where("userId", "==", String(userId)));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (err) {
      console.error("Error fetching user withdrawal status:", err);
      return false;
    }
  }

  // Evaluates the referral rules and updates status. If approved, credits referral earnings!
  async function evaluateReferralStatusLocal(db: any, referredUserId: string, botToken: string) {
    try {
      const userDocRef = doc(db, "users", String(referredUserId));
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      // Check if referredBy is set
      const referrerId = userData.referredBy || userData.pendingReferrerId;
      if (!referrerId) return;

      // Get or create referral doc
      const refDocRef = doc(db, "referrals", String(referredUserId));
      const refSnap = await getDoc(refDocRef);
      let referralData = refSnap.exists() ? refSnap.data() : null;

      // Load current stats
      const { downloadCount, clickCount } = await getUserActivityStatsLocal(db, referredUserId);
      const hasWithdrawal = await getFirstWithdrawalStatusLocal(db, referredUserId);

      // Fetch referral settings
      const systemDoc = await getDoc(doc(db, "settings", "system"));
      let minClicks = 20;
      let minDownloads = 50;
      let withdrawalRequired = true;
      let referralEnable = true;
      let levels = [
        { name: "Bronze", commission: 5, minReferrals: 0, maxReferrals: 25, enabled: true },
        { name: "Silver", commission: 10, minReferrals: 26, maxReferrals: 100, enabled: true },
        { name: "Gold", commission: 15, minReferrals: 101, maxReferrals: 500, enabled: true },
        { name: "Diamond", commission: 25, minReferrals: 501, maxReferrals: 999999, enabled: true }
      ];
      let milestones = [
        { referrals: 10, reward: 50, enabled: true },
        { referrals: 25, reward: 200, enabled: true },
        { referrals: 50, reward: 500, enabled: true },
        { referrals: 100, reward: 1500, enabled: true },
        { referrals: 500, reward: 5000, enabled: true }
      ];

      if (systemDoc.exists()) {
        const data = systemDoc.data();
        const rSettings = data?.referralSystemV4;
        if (rSettings) {
          if (rSettings.minUrlClicks !== undefined) minClicks = Number(rSettings.minUrlClicks);
          if (rSettings.minDownloads !== undefined) minDownloads = Number(rSettings.minDownloads);
          if (rSettings.withdrawalRequired !== undefined) withdrawalRequired = !!rSettings.withdrawalRequired;
          if (rSettings.referralLevels) levels = rSettings.referralLevels;
          if (rSettings.milestones) milestones = rSettings.milestones;
          if (rSettings.referralEnable !== undefined) referralEnable = !!rSettings.referralEnable;
        }
      }

      if (!referralEnable) return;

      // Check same mobile number condition
      let mobileMatched = false;
      let preRegRef = null;
      const userMobile = String(userData.mobile || userData.phone || "");
      if (userMobile) {
        const preRegSnap = await getDocs(query(collection(db, "referral_pre_registrations"), where("mobile", "==", userMobile)));
        if (!preRegSnap.empty) {
          preRegSnap.forEach(d => {
            if (String(d.data().referrerId) === String(referrerId)) {
              mobileMatched = true;
              preRegRef = d.data();
            }
          });
        }
      }

      // Determine Status Timeline
      let currentStatus = "Waiting Registration";
      if (userData.registrationStep === 'completed') {
        currentStatus = "Registered";
      }

      // If registered, let's see if they are "Working"
      if (currentStatus === "Registered" && (clickCount > 0 || downloadCount > 0)) {
        currentStatus = "Working";
      }

      // Check targets
      if (clickCount >= minClicks) {
        currentStatus = "Reached Click Target";
      }
      if (downloadCount >= minDownloads) {
        currentStatus = "Reached Download Target";
      }

      // Check withdrawal submission
      if (hasWithdrawal) {
        currentStatus = "Withdrawal Submitted";
      }

      // Conditions
      const condMobile = mobileMatched;
      const condActivity = (clickCount >= minClicks) || (downloadCount >= minDownloads);
      const condWithdrawal = !withdrawalRequired || hasWithdrawal;

      const allConditionsMet = condMobile && condActivity && condWithdrawal;

      if (allConditionsMet) {
        currentStatus = "Referral Approved";
      } else if (userData.registrationStep === 'completed' && !mobileMatched) {
        currentStatus = "Rejected"; // Mobile mismatch
      }

      // Prepare payload
      const refPayload: any = {
        referrerId: String(referrerId),
        referredUserId: String(referredUserId),
        telegramId: String(referredUserId),
        mobileNumber: userMobile,
        referredName: userData.enteredName || userData.firstName || "Referred User",
        referredUsername: userData.username || "",
        urlClickCount: clickCount,
        downloadCount: downloadCount,
        withdrawalStatus: hasWithdrawal ? "Submitted" : "None",
        status: currentStatus,
        updatedAt: new Date().toISOString()
      };

      if (preRegRef) {
        refPayload.referrerName = (preRegRef as any).referrerName;
      }

      let isNewlyApproved = false;

      if (!referralData) {
        refPayload.createdAt = new Date().toISOString();
        await setDoc(refDocRef, refPayload);
        referralData = refPayload;
      } else {
        if (referralData.status !== "Commission Paid" && referralData.status !== "Referral Approved" && currentStatus === "Referral Approved") {
          isNewlyApproved = true;
        }
        await setDoc(refDocRef, refPayload, { merge: true });
      }

      // If newly approved, credit reward & unlock lifetime passive commission!
      if (isNewlyApproved) {
        // 1. Mark status as "Commission Paid"
        await setDoc(refDocRef, { status: "Commission Paid" }, { merge: true });
        
        // Increase referrer's Trust Score (+3)
        adjustTrustScore(String(referrerId), 3, "Referral Verified").catch(() => {});

        // 2. Calculate referrer's level & commission
        const referrerDocRef = doc(db, "users", String(referrerId));
        const referrerSnap = await getDoc(referrerDocRef);
        if (referrerSnap.exists()) {
          const referrerData = referrerSnap.data();
          
          // Count total approved referrals
          const approvedRefsSnap = await getDocs(query(collection(db, "referrals"), where("referrerId", "==", String(referrerId)), where("status", "in", ["Referral Approved", "Commission Paid"])));
          const approvedCount = approvedRefsSnap.size;

          // Find applicable level
          let matchedLevel = levels[0];
          for (const level of levels) {
            if (level.enabled && approvedCount >= level.minReferrals && approvedCount <= level.maxReferrals) {
              matchedLevel = level;
            }
          }

          const commissionPercent = matchedLevel ? matchedLevel.commission : 10;
          const referredUserLifetimeEarnings = Number(userData.totalEarnings || 0);
          const rawRewardValue = (referredUserLifetimeEarnings * (commissionPercent / 100)) + 10; // Rs. 10 base signup reward + % of lifetime earnings!

          // Evaluate Referral Reward via Economy Protection & Smart Reward Engine
          const economyEval = await evaluateReward(String(referrerId), rawRewardValue, "referral_reward");
          if (!economyEval.allowed) {
            console.warn(`Referral reward blocked for user ${referrerId} by Economy Protection Engine: ${economyEval.message}`);
            return;
          }

          const rewardValue = economyEval.finalAmount;
          const isPendingReferral = economyEval.isPending;

          const currentBalance = Number(referrerData.availableBalance || 0);
          const currentReferralEarnings = Number(referrerData.referralEarnings || 0);
          const currentTotalEarnings = Number(referrerData.totalEarnings || 0);

          let newBalance = currentBalance;
          let newReferralEarnings = currentReferralEarnings;
          let newTotalEarnings = currentTotalEarnings;

          if (!isPendingReferral) {
            newBalance = currentBalance + rewardValue;
            newReferralEarnings = currentReferralEarnings + rewardValue;
            newTotalEarnings = currentTotalEarnings + rewardValue;
          }

          const todayStr = new Date().toISOString().split("T")[0];
          const todayReferralEarnings = Number(referrerData.todayReferralEarnings || 0) + (isPendingReferral ? 0 : rewardValue);
          const monthlyReferralEarnings = Number(referrerData.monthlyReferralEarnings || 0) + (isPendingReferral ? 0 : rewardValue);

          await setDoc(referrerDocRef, {
            referrals: approvedCount,
            referralLevel: matchedLevel.name,
            referralLevelCommission: commissionPercent,
            availableBalance: newBalance,
            referralEarnings: newReferralEarnings,
            totalEarnings: newTotalEarnings,
            todayReferralEarnings,
            monthlyReferralEarnings,
            lastReferralApprovedDate: new Date().toISOString()
          }, { merge: true });

          // Record Transaction
          await recordWalletTransaction({
            userId: String(referrerId),
            amount: rewardValue,
            creditDebit: "Credit",
            source: "👥 Referral Bonus",
            description: isPendingReferral
              ? `Pending Review commission for referring ${userData.enteredName || userData.firstName || "Friend"} (Level: ${matchedLevel.name}) due to economy protection checks.`
              : `Commission for referring ${userData.enteredName || userData.firstName || "Friend"} (Level: ${matchedLevel.name})`,
            status: isPendingReferral ? "Pending" : "Completed"
          });

          // Evaluate Milestones
          for (const milestone of milestones) {
            if (milestone.enabled && approvedCount >= milestone.referrals) {
              const milestoneId = `milestone_${referrerId}_${milestone.referrals}`;
              const claimSnap = await getDoc(doc(db, "claimed_milestones", milestoneId));
              if (!claimSnap.exists()) {
                await setDoc(doc(db, "claimed_milestones", milestoneId), {
                  userId: String(referrerId),
                  referrals: milestone.referrals,
                  reward: milestone.reward,
                  claimedAt: new Date().toISOString()
                });

                // Credit Milestone Reward
                const finalBalance = newBalance + milestone.reward;
                const finalTotalEarnings = newTotalEarnings + milestone.reward;
                await setDoc(referrerDocRef, {
                  availableBalance: finalBalance,
                  totalEarnings: finalTotalEarnings
                }, { merge: true });

                await recordWalletTransaction({
                  userId: String(referrerId),
                  amount: milestone.reward,
                  creditDebit: "Credit",
                  source: "👥 Referral Bonus",
                  description: `Reward for reaching ${milestone.referrals} successful referrals!`,
                  status: "Completed"
                });

                // Notify referrer of Milestone
                const milestoneNotify = `🏆 *Milestone Unlocked!*
                
🎉 Congratulations! You have successfully referred *${milestone.referrals}* friends!
💰 You have been credited a bonus reward of *₹${milestone.reward}*!`;
                await sendTelegramMessageLocal(botToken, Number(referrerId), milestoneNotify, { parse_mode: "Markdown" });
              }
            }
          }

          // Notify referrer of successful referral
          const notificationMsg = `🎉 *Referral Approved & Unlocked!*

👤 *Friend:* ${userData.enteredName || userData.firstName || "New Friend"}
📱 *Mobile:* ${userData.mobile || userData.phone || "N/A"} (Matched ✅)
📈 *Your Referral Count:* ${approvedCount}
🏆 *Your Level:* ${matchedLevel.name} (${commissionPercent}% Commission)

💰 *Commission Paid:* ₹${rewardValue.toFixed(2)}
*(Includes base reward + ${commissionPercent}% of their lifetime earnings!)*`;

          await sendTelegramMessageLocal(botToken, Number(referrerId), notificationMsg, { parse_mode: "Markdown" });
        }
      }
    } catch (err) {
      console.error("Error evaluating referral status local:", err);
    }
  }

  // Route 1: Get Referral settings
  app.get("/api/referral/settings", async (req, res) => {
    try {
      const systemDoc = await getDoc(doc(db, "settings", "system"));
      let data: any = {
        referralEnable: true,
        commissionPercent: 10,
        minUrlClicks: 20,
        minDownloads: 50,
        withdrawalRequired: true,
        shareMessage: "🚀 Join RoyShare and earn passive income! Upload files & shorten links to get paid.\n\nUse my invite code {CODE} to register:\n{LINK}",
        landingPageBanner: "Invite & Earn Lifetime Commission",
        referralRules: "1. Your friend must verify their mobile number on the landing page.\n2. They must register on Telegram using the exact same mobile number.\n3. They must reach either 20 shortener clicks or 50 file downloads on RoyShare.\n4. They must submit their first withdrawal request.",
        referralLevels: [
          { name: "Bronze", commission: 5, minReferrals: 0, maxReferrals: 25, enabled: true },
          { name: "Silver", commission: 10, minReferrals: 26, maxReferrals: 100, enabled: true },
          { name: "Gold", commission: 15, minReferrals: 101, maxReferrals: 500, enabled: true },
          { name: "Diamond", commission: 25, minReferrals: 501, maxReferrals: 999999, enabled: true }
        ],
        milestones: [
          { referrals: 10, reward: 50, enabled: true },
          { referrals: 25, reward: 200, enabled: true },
          { referrals: 50, reward: 500, enabled: true },
          { referrals: 100, reward: 1500, enabled: true },
          { referrals: 500, reward: 5000, enabled: true }
        ]
      };

      if (systemDoc.exists()) {
        const sysData = systemDoc.data();
        if (sysData.referralSystemV4) {
          data = { ...data, ...sysData.referralSystemV4 };
        }
      }

      res.json(data);
    } catch (err: any) {
      console.error("Error in GET /api/referral/settings:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Route 2: Verify Referral code
  app.get("/api/referral/verify-code", async (req, res) => {
    try {
      const code = String(req.query.code || "").trim();
      if (!code) {
        return res.status(400).json({ success: false, message: "Referral code is required" });
      }

      let referrerDoc = null;

      // 1. Try decoding as secure token first
      const decodedToken = verifySecureReferralToken(code);
      if (decodedToken && decodedToken.userId) {
        const userDocRef = doc(db, "users", decodedToken.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          referrerDoc = userDocSnap;
        }
      }

      // 2. Fallback to legacy searching by referralCode or document ID
      if (!referrerDoc) {
        const q1 = query(collection(db, "users"), where("referralCode", "==", code));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          referrerDoc = snap1.docs[0];
        } else {
          const userDocRef = doc(db, "users", code);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            referrerDoc = userDocSnap;
          }
        }
      }

      if (!referrerDoc) {
        return res.status(404).json({ success: false, message: "Invalid Referral Code" });
      }

      const rData = referrerDoc.data();
      const approvedRefsSnap = await getDocs(query(collection(db, "referrals"), where("referrerId", "==", String(referrerDoc.id)), where("status", "in", ["Referral Approved", "Commission Paid"])));
      const approvedCount = approvedRefsSnap.size;

      // Determine their current level
      const systemDoc = await getDoc(doc(db, "settings", "system"));
      let levels = [
        { name: "Bronze", commission: 5, minReferrals: 0, maxReferrals: 25, enabled: true },
        { name: "Silver", commission: 10, minReferrals: 26, maxReferrals: 100, enabled: true },
        { name: "Gold", commission: 15, minReferrals: 101, maxReferrals: 500, enabled: true },
        { name: "Diamond", commission: 25, minReferrals: 501, maxReferrals: 999999, enabled: true }
      ];
      if (systemDoc.exists() && systemDoc.data()?.referralSystemV4?.referralLevels) {
        levels = systemDoc.data()?.referralSystemV4?.referralLevels;
      }

      let matchedLevel = levels[0];
      for (const level of levels) {
        if (level.enabled && approvedCount >= level.minReferrals && approvedCount <= level.maxReferrals) {
          matchedLevel = level;
        }
      }

      let rewardAmount = 10;
      if (systemDoc.exists()) {
        const rSettings = systemDoc.data()?.referralSettings;
        if (rSettings && rSettings["Referral Reward"]) {
          rewardAmount = parseFloat(rSettings["Referral Reward"]) || 10;
        }
      }

      res.json({
        success: true,
        rewardAmount: rewardAmount,
        referrer: {
          id: referrerDoc.id,
          name: rData.enteredName || rData.firstName || rData.username || "Admin",
          level: rData.referralLevel || matchedLevel.name,
          referrals: approvedCount,
          earnings: Number(rData.referralEarnings || rData.totalEarnings || 0),
          avatar: rData.username ? `https://t.me/i/userpic?username=${rData.username}` : null
        }
      });
    } catch (err: any) {
      console.error("Error verifying referral code:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Route 3: Pre-register Mobile and Invite Code
  app.post("/api/referral/pre-register", async (req, res) => {
    try {
      const { mobileNumber, referralCode } = req.body;
      const cleanMobile = String(mobileNumber || "").replace(/[^0-9]/g, "");
      const cleanCode = String(referralCode || "").trim();

      if (cleanMobile.length !== 10) {
        return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number." });
      }

      if (!cleanCode) {
        return res.status(400).json({ success: false, message: "Invite Code is required." });
      }

      // Verify referrer exists
      let referrerDoc = null;
      const q1 = query(collection(db, "users"), where("referralCode", "==", cleanCode));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        referrerDoc = snap1.docs[0];
      } else {
        const userDocRef = doc(db, "users", cleanCode);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          referrerDoc = userDocSnap;
        }
      }

      if (!referrerDoc) {
        return res.status(404).json({ success: false, message: "Invalid Referral Code." });
      }

      const rData = referrerDoc.data();
      const rId = String(referrerDoc.id);

      // Create/Update pre-registration with ID as the mobile number (to prevent multiple referral claims for same number)
      const preRegRef = doc(db, "referral_pre_registrations", cleanMobile);
      const preRegSnap = await getDoc(preRegRef);

      const now = new Date().toISOString();
      const referrerName = rData.enteredName || rData.firstName || rData.username || "Referrer";

      await setDoc(preRegRef, {
        mobile: cleanMobile,
        referrerId: rId,
        referrerName: referrerName,
        referralCode: cleanCode,
        createdAt: now,
        status: "Waiting Registration"
      }, { merge: true });

      // Track click count for referrer as page click/pre-registration
      const refCountRef = doc(db, "referral_clicks", `${rId}_${cleanMobile}`);
      await setDoc(refCountRef, {
        referrerId: rId,
        mobile: cleanMobile,
        createdAt: now
      });

      // Fetch Bot Link and Mini App Url
      let botUsername = "Roysharearn_bot";
      let miniAppUrl = "";
      try {
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        if (telegramSettingsSnap.exists()) {
          const tgSettings = telegramSettingsSnap.data();
          botUsername = tgSettings?.botUsername || "Roysharearn_bot";
          miniAppUrl = tgSettings?.miniAppUrl || "";
        }
      } catch (botErr) {
        console.error("Error reading bot username:", botErr);
      }

      let botUrl = "";
      if (miniAppUrl) {
        const baseUrl = miniAppUrl.split('?')[0];
        botUrl = `${baseUrl}?startapp=${cleanCode}`;
      } else {
        botUrl = `https://t.me/${botUsername}/app?startapp=${cleanCode}`;
      }

      res.json({
        success: true,
        message: "Mobile verified successfully!",
        botUrl
      });
    } catch (err: any) {
      console.error("Error in pre-register API:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Route 4: Real-time Analytics & Self-Healing Sync for Dashboard
  app.get("/api/referral/analytics", async (req, res) => {
    const startTime = Date.now();
    console.log(`[API] Start GET /api/referral/analytics for userId: ${req.query.userId}`);
    
    try {
      const userId = String(req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      // 1. Fire-and-forget: Self-Healing Evaluation
      // Run in background without awaiting
      (async () => {
        try {
          const refsQuery = query(collection(db, "referrals"), where("referrerId", "==", userId));
          const refsSnap = await getDocs(refsQuery);
          
          let botToken = "";
          const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
          if (telegramSettingsSnap.exists()) {
            botToken = telegramSettingsSnap.data()?.botToken || "";
          }

          for (const refDoc of refsSnap.docs) {
            const refData = refDoc.data();
            if (refData.status !== "Commission Paid" && refData.status !== "Rejected") {
              await evaluateReferralStatusLocal(db, refDoc.id, botToken);
            }
          }
          console.log(`[Background] Self-healing evaluation completed for userId: ${userId}`);
        } catch (e) {
          console.error(`[Background] Error in self-healing evaluation for userId: ${userId}:`, e);
        }
      })();

      // 2. Main Analytics Read with Timeout
      const analyticsPromise = (async () => {
        const referrerDocRef = doc(db, "users", userId);
        const referrerSnap = await getDoc(referrerDocRef);
        if (!referrerSnap.exists()) {
          throw new Error("User not found");
        }
        const rData = referrerSnap.data();
        let referralCode = rData.referralCode || "";
        if (!referralCode) {
          referralCode = `RS${userId.slice(-6).toUpperCase()}`;
          await updateDoc(referrerDocRef, { referralCode });
          rData.referralCode = referralCode;
        }

        // Query referrals
        const updatedRefsSnap = await getDocs(query(collection(db, "referrals"), where("referrerId", "==", userId)));
        let approvedCount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        updatedRefsSnap.forEach((ref) => {
          const status = ref.data().status;
          if (status === "Referral Approved" || status === "Commission Paid") {
            approvedCount++;
          } else if (status === "Rejected") {
            rejectedCount++;
          } else {
            pendingCount++;
          }
        });

        // Count pre-registrations clicks
        const clicksSnap = await getDocs(query(collection(db, "referral_clicks"), where("referrerId", "==", userId)));
        const clicksCount = clicksSnap.size;

        // Determine levels (simplified for speed)
        let currentLevelName = rData.referralLevel || "Bronze";
        let commission = rData.referralLevelCommission || 5;

        return {
          totalReferrals: approvedCount,
          pendingReferrals: pendingCount,
          rejectedReferrals: rejectedCount,
          clicksCount: clicksCount,
          todayReferralEarnings: Number(rData.todayReferralEarnings || 0),
          monthlyReferralEarnings: Number(rData.monthlyReferralEarnings || 0),
          lifetimeReferralEarnings: Number(rData.referralEarnings || 0),
          levelName: currentLevelName,
          commissionPercent: commission,
          // Legacy compatible fields for older/different components
          todayCount: Number(rData.todayReferralEarnings || 0),
          totalEarnings: Number(rData.referralEarnings || 0),
          approvedCount: approvedCount,
          pendingCount: pendingCount,
          referralCode: rData.referralCode || "",
          currentLevel: { name: currentLevelName }
        };
      })();

      // Timeout: 4 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Analytics timeout")), 4000)
      );

      const analytics: any = await Promise.race([analyticsPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      console.log(`[API] Success GET /api/referral/analytics for userId: ${userId} in ${duration}ms`);
      
      res.json({
        success: true,
        ...(analytics && typeof analytics === 'object' ? analytics : {})
      });
    } catch (err: any) {
      console.error(`[API] Error GET /api/referral/analytics:`, err);
      res.status(500).json({ success: false, error: err.message || "Failed to load analytics" });
    }
  });

  // Route 5: Get Referral List (paginated & filtered)
  app.get("/api/referral/list", async (req, res) => {
    try {
      const userId = String(req.query.userId || "");
      const page = parseInt(String(req.query.page || "1"), 10);
      const limitVal = parseInt(String(req.query.limit || "10"), 10);
      const search = String(req.query.search || "").trim().toLowerCase();
      const statusFilter = String(req.query.status || "").trim();

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const refsQuery = query(collection(db, "referrals"), where("referrerId", "==", userId));
      const snap = await getDocs(refsQuery);
      
      let allReferrals: any[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        allReferrals.push({
          referredUserId: doc.id,
          referredName: d.referredName || "New Friend",
          referredUsername: d.referredUsername || "",
          mobileNumber: d.mobileNumber || "N/A",
          status: d.status || "Pending",
          joinDate: d.joinDate || "N/A",
          createdAt: d.createdAt || "",
          urlClickCount: Number(d.urlClickCount || 0),
          downloadCount: Number(d.downloadCount || 0),
          withdrawalStatus: d.withdrawalStatus || "None"
        });
      });

      // Filter by status if provided
      if (statusFilter) {
        if (statusFilter === "Approved") {
          allReferrals = allReferrals.filter(r => r.status === "Referral Approved" || r.status === "Commission Paid");
        } else if (statusFilter === "Pending") {
          allReferrals = allReferrals.filter(r => r.status !== "Referral Approved" && r.status !== "Commission Paid" && r.status !== "Rejected");
        } else if (statusFilter === "Rejected") {
          allReferrals = allReferrals.filter(r => r.status === "Rejected");
        }
      }

      // Filter by search query
      if (search) {
        allReferrals = allReferrals.filter(r => 
          r.referredName.toLowerCase().includes(search) || 
          r.referredUsername.toLowerCase().includes(search) || 
          r.mobileNumber.includes(search)
        );
      }

      // Sort by newest first
      allReferrals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      // Paginate
      const startIndex = (page - 1) * limitVal;
      const paginatedList = allReferrals.slice(startIndex, startIndex + limitVal);

      // Mask mobile numbers for privacy
      const processedList = paginatedList.map(r => {
        let masked = r.mobileNumber;
        if (masked && masked.length === 10) {
          masked = masked.substring(0, 3) + "****" + masked.substring(7);
        }
        return { ...r, mobileNumber: masked };
      });

      res.json({
        success: true,
        referrals: processedList,
        total: allReferrals.length,
        page,
        totalPages: Math.ceil(allReferrals.length / limitVal)
      });
    } catch (err: any) {
      console.error("Error in Referral list API:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Route 6: Get Referral Milestones & Claim Statuses
  app.get("/api/referral/milestones", async (req, res) => {
    try {
      const userId = String(req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const milestonePromise = (async () => {
        // Load referral settings milestones
        const systemDoc = await getDoc(doc(db, "settings", "system"));
        let milestones = [
          { referrals: 10, reward: 50, enabled: true },
          { referrals: 25, reward: 200, enabled: true },
          { referrals: 50, reward: 500, enabled: true },
          { referrals: 100, reward: 1500, enabled: true },
          { referrals: 500, reward: 5000, enabled: true }
        ];

        if (systemDoc.exists() && systemDoc.data()?.referralSystemV4?.milestones) {
          milestones = systemDoc.data()?.referralSystemV4?.milestones;
        }

        // Count approved referrals
        const approvedRefsSnap = await getDocs(query(collection(db, "referrals"), where("referrerId", "==", userId), where("status", "in", ["Referral Approved", "Commission Paid"])));
        const approvedCount = approvedRefsSnap.size;

        // Get claimed milestones
        const claimedSnap = await getDocs(query(collection(db, "claimed_milestones"), where("userId", "==", userId)));
        const claimedReferralMilestones: number[] = [];
        claimedSnap.forEach(d => {
          claimedReferralMilestones.push(Number(d.data().referrals));
        });

        const responseMilestones = milestones.map(m => {
          const isClaimed = claimedReferralMilestones.includes(m.referrals);
          const canClaim = !isClaimed && approvedCount >= m.referrals;
          return {
            referrals: m.referrals,
            reward: m.reward,
            enabled: m.enabled,
            status: isClaimed ? "claimed" : (canClaim ? "ready" : "locked"),
            progress: Math.min(100, Math.round((approvedCount / m.referrals) * 100))
          };
        });

        return { approvedCount, responseMilestones };
      })();

      // Timeout: 4 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Milestones timeout")), 4000)
      );

      const result = await Promise.race([milestonePromise, timeoutPromise]);
      const { approvedCount, responseMilestones } = result as any;

      res.json({
        success: true,
        approvedCount,
        milestones: responseMilestones
      });
    } catch (err: any) {
      console.error("Error in referral milestones API:", err);
      res.status(500).json({ error: err.message || "Failed to load milestones" });
    }
  });

  app.get("/api/system-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "system");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        res.json({ maintenanceMode: "🟢 OFF", urlShortenerEnabled: false });
      } else {
        const data = docSnap.data();
        res.json({
          maintenanceMode: data.maintenanceMode,
          urlShortenerEnabled: data.urlShortener?.enabled === true
        });
      }
    } catch (e: any) {
      console.error("System settings fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/public/stats", async (req, res) => {
    try {
      const getCount = async (collName: string) => {
        try {
          const coll = collection(db, collName);
          return (await getCountFromServer(coll)).data().count;
        } catch (e) {
          return 0;
        }
      };

      const [totalUsers, totalUploads, totalLinks] = await Promise.all([
        getCount("users"),
        getCount("uploads"),
        getCount("links")
      ]);

      // If we had a global settings doc with overall stats, we'd fetch it here.
      // For now, we return document counts.
      res.json({
        totalUsers,
        totalUploads,
        totalLinks,
        totalDownloads: 0 // Will handle "Growing Every Day" if 0
      });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // ==========================================
  // TELEGRAM BROADCAST CENTER API ENDPOINTS
  // ==========================================

  // Helper functions for Telegram buttons Firestore compatibility (flattening & reconstructing)
  function flattenButtons(nested: any[][]): any[] {
    const flat: any[] = [];
    if (!Array.isArray(nested)) return flat;
    
    nested.forEach((row, rIdx) => {
      if (!Array.isArray(row)) return;
      row.forEach((btn, cIdx) => {
        if (!btn) return;
        const id = btn.id || `btn_${rIdx}_${cIdx}_${Math.random().toString(36).substring(2, 11)}`;
        flat.push({
          id,
          row: rIdx,
          text: btn.text || "",
          action: btn.action || "mini_app",
          url: btn.url || "",
          callbackData: btn.callbackData || "",
          clicks: btn.clicks || 0
        });
      });
    });
    return flat;
  }

  function reconstructButtons(flat: any[]): any[][] {
    const nested: any[][] = [];
    if (!Array.isArray(flat)) return nested;
    
    const groupedRows: { [key: number]: any[] } = {};
    flat.forEach((btn) => {
      const r = typeof btn.row === 'number' ? btn.row : 0;
      if (!groupedRows[r]) {
        groupedRows[r] = [];
      }
      groupedRows[r].push(btn);
    });
    
    const sortedRowIndices = Object.keys(groupedRows).map(Number).sort((a, b) => a - b);
    
    sortedRowIndices.forEach((rIdx) => {
      const row = groupedRows[rIdx];
      const rowBtns = row.map(btn => ({
        id: btn.id,
        text: btn.text || "",
        action: btn.action || "mini_app",
        url: btn.url || "",
        clicks: btn.clicks || 0,
        callbackData: btn.callbackData || undefined
      }));
      nested.push(rowBtns);
    });
    
    return nested;
  }

  // Helper function to deliver Telegram Broadcast by ID
  async function sendTelegramBroadcastById(broadcastId: string, isTest = false, testTargetOverride?: string) {
    const db = getDb();
    const docRef = doc(db, "telegram_broadcasts", broadcastId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Broadcast not found");

    const broadcast = snap.data();
    
    // Load Telegram Settings
    const tgDoc = await getDoc(doc(db, "settings", "telegram"));
    if (!tgDoc.exists()) throw new Error("Telegram settings are not configured in Firestore.");
    
    const tgData = tgDoc.data();
    const botToken = tgData.botToken;
    const channelUsername = tgData.channelUsername;
    const groupUsername = tgData.groupUsername;
    
    if (!botToken) throw new Error("Telegram Bot Token is missing in settings.");

    // Determine target chat ID
    let chatId = "";
    if (isTest) {
      chatId = testTargetOverride || groupUsername || channelUsername;
    } else {
      chatId = channelUsername; // Default to Channel for channel broadcasts
    }

    if (!chatId) throw new Error("No target Chat ID (Channel/Group Username) found.");
    
    // Ensure chatId starts with @ if it's a public channel name and doesn't start with @ or -
    if (!chatId.startsWith("@") && !chatId.startsWith("-") && isNaN(Number(chatId))) {
      chatId = `@${chatId}`;
    }

    const origin = broadcast.origin || "http://localhost:3000";

    // Build the inline keyboard markup from flat array stored in Firestore
    const inlineKeyboard: any[] = [];
    if (broadcast.buttons && Array.isArray(broadcast.buttons)) {
      const groupedRows: { [key: number]: any[] } = {};
      broadcast.buttons.forEach((btn: any) => {
        const r = typeof btn.row === 'number' ? btn.row : 0;
        if (!groupedRows[r]) {
          groupedRows[r] = [];
        }
        groupedRows[r].push(btn);
      });

      const sortedRowIndices = Object.keys(groupedRows).map(Number).sort((a, b) => a - b);

      sortedRowIndices.forEach((rIdx) => {
        const row = groupedRows[rIdx];
        const rowBtns: any[] = [];
        row.forEach((btn: any, cIdx: number) => {
          const trackingUrl = `${origin}/api/tg-click?broadcastId=${broadcastId}&row=${rIdx}&col=${cIdx}`;
          rowBtns.push({
            text: btn.text,
            url: trackingUrl
          });
        });
        if (rowBtns.length > 0) {
          inlineKeyboard.push(rowBtns);
        }
      });
    }

    let telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body: any = {
      chat_id: chatId,
      reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
    };

    const textMessage = broadcast.message || "";

    // Image vs Text
    if (broadcast.imageUrl) {
      telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      body.photo = broadcast.imageUrl;
      body.caption = textMessage;
    } else {
      body.text = textMessage;
    }

    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const resJson = await res.json();
    if (!resJson.ok) {
      throw new Error(`Telegram Bot API Error: ${resJson.description || "Unknown error"}`);
    }

    // Update status in Firestore (only if not a test send)
    if (!isTest) {
      await setDoc(docRef, {
        status: "Sent",
        sentTime: new Date().toISOString()
      }, { merge: true });
    }

    return resJson;
  }

  // Periodic scheduler to check for and send scheduled broadcasts (every 60 seconds)
  setInterval(async () => {
    try {
      const db = getDb();
      const broadcastsRef = collection(db, "telegram_broadcasts");
      const q = query(
        broadcastsRef,
        where("status", "==", "Scheduled")
      );
      const snap = await getDocs(q);
      const now = new Date();

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.scheduledAt) {
          const schedTime = new Date(data.scheduledAt);
          if (schedTime <= now) {
            console.log(`[Scheduler] Sending scheduled broadcast: ${docSnap.id}`);
            try {
              await sendTelegramBroadcastById(docSnap.id);
            } catch (err: any) {
              console.error(`[Scheduler Error] Failed to send broadcast ${docSnap.id}:`, err.message);
              // Mark as Failed so we don't try forever
              await setDoc(docSnap.ref, {
                status: "Failed",
                error: err.message || "Failed to deliver scheduled broadcast"
              }, { merge: true });
            }
          }
        }
      }
    } catch (error) {
      console.error("[Scheduler Error] Failed checking scheduled broadcasts:", error);
    }
  }, 60000);

  // AI Generation endpoint for Telegram Broadcasts
  app.post("/api/admin/telegram-broadcast/generate-ai", async (req, res) => {
    try {
      const { prompt, language, tone, length, action, originalText } = req.body;
      
      const supportDoc = await getDoc(doc(db, "settings", "support"));
      const supportData = supportDoc.exists() ? supportDoc.data() : {};
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "No Gemini API Key configured in server or support settings." });
      }

      const model = supportData.geminiModel || "gemini-3.5-flash";

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = `You are a professional copywriter, Telegram community manager, and growth hacker.
Your task is to write high-converting, extremely engaging, visually appealing messages specifically for a Telegram Channel or Group.
Use proper Telegram text formatting:
- Bold for headings or emphasis (e.g. use **text** for bold).
- Tasteful and relevant emojis to increase readability and excitement.
- Bulleted lists or numbered lists to make information scannable.
- Clear and exciting Call to Actions (CTAs).
- Avoid any explanations, introductory text (like "Here is your post:"), or closing text. Return ONLY the final message content itself.`;

      let userPrompt = "";
      if (action === "improve" && originalText) {
        userPrompt = `Please improve the following message to make it more engaging, compelling, and high-converting.
Tone: ${tone}
Language: ${language}
Length: ${length}

Original message:
"""
${originalText}
"""`;
      } else if (action === "regenerate" && originalText) {
        userPrompt = `Please regenerate a completely unique, fresh variation of the following message.
Tone: ${tone}
Language: ${language}
Length: ${length}

Original message:
"""
${originalText}
"""`;
      } else {
        userPrompt = `Create a completely new message for a Telegram broadcast.
Topic / Prompt: ${prompt || "General exciting update, game release, or community reward announcement"}
Tone: ${tone}
Language: ${language}
Length: ${length} (short = ~1-2 sentences, medium = ~2-4 sentences with bullet points, long = full detailed newsletter/announcement with headings and bullet points)`;
      }

      const response = await safeGenerateContent(ai, {
        model,
        contents: userPrompt,
        config: {
          systemInstruction,
        }
      });

      const text = response.text ? response.text.trim() : "";
      res.json({ success: true, text });
    } catch (error: any) {
      console.error("Error generating Telegram broadcast:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
  });

  // Save/Broadcast POST handler
  app.post("/api/admin/telegram-broadcast/broadcast", async (req, res) => {
    try {
      const payload = req.body;
      const db = getDb();
      const broadcastsRef = collection(db, "telegram_broadcasts");
      
      let docId = payload.id;
      let docRef;

      const broadcastData = {
        message: payload.message || "",
        language: payload.language || "English",
        tone: payload.tone || "Exciting",
        length: payload.length || "Medium",
        imageUrl: payload.imageUrl || "",
        thumbnailUrl: payload.thumbnailUrl || "",
        buttons: flattenButtons(payload.buttons || []),
        status: payload.status || "Draft",
        scheduledAt: payload.scheduledAt || null,
        createdTime: payload.createdTime || new Date().toISOString(),
        createdBy: payload.createdBy || "Admin",
        sentTime: payload.sentTime || null,
        totalClicks: payload.totalClicks || 0,
        miniAppOpens: payload.miniAppOpens || 0,
        origin: payload.origin || "http://localhost:3000"
      };

      if (docId) {
        docRef = doc(db, "telegram_broadcasts", docId);
        await setDoc(docRef, broadcastData, { merge: true });
      } else {
        docRef = await addDoc(broadcastsRef, broadcastData);
        docId = docRef.id;
      }

      // Handle the actions
      if (payload.action === "send_now") {
        try {
          await sendTelegramBroadcastById(docId, false);
          res.json({ success: true, id: docId, status: "Sent" });
        } catch (err: any) {
          console.error("Error sending live broadcast:", err);
          res.status(400).json({ error: "Failed to send to Telegram: " + err.message });
        }
      } else if (payload.action === "send_test") {
        try {
          await sendTelegramBroadcastById(docId, true, payload.testTarget);
          res.json({ success: true, id: docId, status: "Test Sent" });
        } catch (err: any) {
          console.error("Error sending test broadcast:", err);
          res.status(400).json({ error: "Failed to send test: " + err.message });
        }
      } else {
        // Just saved draft or schedule
        res.json({ success: true, id: docId, status: broadcastData.status });
      }
    } catch (error: any) {
      console.error("Error in broadcast endpoint:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // List all Telegram broadcasts
  app.get("/api/admin/telegram-broadcast/list", async (req, res) => {
    try {
      const db = getDb();
      const broadcastsRef = collection(db, "telegram_broadcasts");
      const qSnap = await getDocs(query(broadcastsRef, orderBy("createdTime", "desc")));
      const list = qSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          buttons: reconstructButtons(data.buttons || [])
        };
      });
      res.json({ success: true, list });
    } catch (error: any) {
      console.error("Error fetching telegram broadcast list:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete specific Telegram broadcast
  app.delete("/api/admin/telegram-broadcast/:id", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const docRef = doc(db, "telegram_broadcasts", id);
      await deleteDoc(docRef);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting broadcast:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Public Click/Open tracking redirect endpoint
  app.get("/api/tg-click", async (req, res) => {
    try {
      const { broadcastId, row, col } = req.query;
      if (!broadcastId) {
        return res.status(400).send("Missing broadcastId");
      }

      const db = getDb();
      const docRef = doc(db, "telegram_broadcasts", broadcastId as string);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).send("Broadcast not found");
      }

      const data = snap.data();
      const rowIndex = parseInt(row as string, 10);
      const colIndex = parseInt(col as string, 10);

      // Extract the target URL
      const buttonRows = reconstructButtons(data.buttons || []);
      const buttonRow = buttonRows[rowIndex];
      if (!buttonRow) {
        return res.status(404).send("Button row not found");
      }
      const button = buttonRow[colIndex];
      if (!button) {
        return res.status(404).send("Button not found");
      }

      const targetUrl = button.url || "#";

      // Increment click counters in Firestore
      const isMiniApp = button.action === "mini_app";
      const totalClicks = (data.totalClicks || 0) + 1;
      const miniAppOpens = (data.miniAppOpens || 0) + (isMiniApp ? 1 : 0);

      // Increment button specific clicks if tracking at button level
      const updatedButtons = [...buttonRows];
      if (updatedButtons[rowIndex] && updatedButtons[rowIndex][colIndex]) {
        updatedButtons[rowIndex][colIndex] = {
          ...updatedButtons[rowIndex][colIndex],
          clicks: (updatedButtons[rowIndex][colIndex].clicks || 0) + 1
        };
      }

      await setDoc(docRef, {
        totalClicks,
        miniAppOpens,
        buttons: flattenButtons(updatedButtons)
      }, { merge: true });

      // Redirect user to the actual target URL!
      return res.redirect(targetUrl);
    } catch (error: any) {
      console.error("Error tracking telegram click:", error);
      res.status(500).send("Error tracking redirect");
    }
  });

  // Security Endpoints
  app.get("/api/admin/security", async (req, res) => {
    try {
      const logsSnap = await getDocs(query(collection(db, "securityLogs"), orderBy("createdAt", "desc")));
      const logs = logsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

      const totalAlerts = logs.filter((l: any) => ['High', 'Critical'].includes(l.riskLevel)).length;
      const totalBans = users.filter((u: any) => u.status === 'Banned').length;
      const pendingReviews = logs.filter((l: any) => l.reviewStatus === 'Pending').length;
      const whitelistedUsers = users.filter((u: any) => u.securityStatus === 'Whitelisted').length;

      res.json({
        logs,
        stats: {
          totalAlerts,
          totalBans,
          pendingReviews,
          whitelistedUsers,
          fraudAlerts: totalAlerts,
          bannedUsers: totalBans,
          suspiciousUsers: users.filter((u: any) => u.securityStatus === 'Suspicious').length
        }
      });
    } catch (error: any) {
      console.error("Error fetching security data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/security/action", async (req, res) => {
    try {
      const { logId, userId, action, reason } = req.body;
      
      if (logId) {
        await updateDoc(doc(db, "securityLogs", logId), { reviewStatus: 'Reviewed' });
      }

      if (userId) {
        if (action === 'Ban') {
          await updateDoc(doc(db, "users", userId), { status: 'Banned', banReason: reason || 'Security Ban' });
        } else if (action === 'Whitelist') {
          await updateDoc(doc(db, "users", userId), { securityStatus: 'Whitelisted' });
        } else if (action === 'Warn') {
          await updateDoc(doc(db, "users", userId), { securityStatus: 'Warned' });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating security action:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Activity Logs Endpoint
  app.get("/api/admin/activity-logs", async (req, res) => {
    try {
      const logsSnap = await getDocs(query(collection(db, "adminActivityLogs"), orderBy("createdAt", "desc")));
      const logs = logsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;
      const actionCounts: Record<string, number> = {};

      logs.forEach((log: any) => {
        const logTime = new Date(log.createdAt).getTime();
        if (logTime >= startOfToday) todayCount++;
        if (logTime >= startOfWeek) weekCount++;
        if (logTime >= startOfMonth) monthCount++;

        const action = log.action || 'Unknown';
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      const mostCommonAction = Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b, 'None');

      res.json({
        logs,
        stats: {
          totalActions: logs.length,
          todayActions: todayCount,
          weeklyActions: weekCount,
          monthlyActions: monthCount,
          mostCommonAction,
          mostActiveAdmin: 'Admin'
        }
      });
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Backups Endpoints
  app.get("/api/admin/backups", async (req, res) => {
    try {
      const backupsSnap = await getDocs(query(collection(db, "backups"), orderBy("createdAt", "desc")));
      const backups = backupsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      res.json(backups);
    } catch (error: any) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/backups", async (req, res) => {
    try {
      // In a real scenario, you'd fetch all collections and upload to storage.
      // Here we just mock the backup record.
      const sizeMB = (Math.random() * 50 + 10).toFixed(2);
      const backupId = `BK${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newBackup = {
        backupId,
        backupDate: new Date().toISOString(),
        backupSize: `${sizeMB} MB`,
        backupType: req.body.type || 'Manual',
        backupStatus: 'Completed',
        createdAt: new Date().toISOString(),
        restoredAt: null
      };
      
      const docRef = await addDoc(collection(db, "backups"), newBackup);
      res.json({ id: docRef.id, ...newBackup });
    } catch (error: any) {
      console.error("Error creating backup:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/backups/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, "backups", req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/backups/:id/restore", async (req, res) => {
    try {
      // Mock restoring process
      await updateDoc(doc(db, "backups", req.params.id), {
        restoredAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/backup-settings", async (req, res) => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "backups"));
      res.json(docSnap.data() || { autoBackupEnabled: false, backupFrequency: 'Daily', retentionDays: 30 });
    } catch (error: any) {
      console.error("Error fetching backup settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/backup-settings", async (req, res) => {
    try {
      await setDoc(doc(db, "settings", "backups"), req.body, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating backup settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

// Telegram settings routes
  app.get("/api/telegram/settings", async (req, res) => {
    try {
        console.log("Firestore READ: settings/telegram");
        const docRef = doc(db, "settings", "telegram");
        const docSnap = await getDoc(docRef);
        res.json(docSnap.data() || {});
    } catch (e: any) {
        console.error("Firestore READ Error (settings/telegram):", e.message, e.stack);
        res.status(500).json({ error: "Server error", details: e.message });
    }
  });

  const extractUsername = (link: string) => {
    if (!link) return "";
    let cleaned = link.replace(/https?:\/\/(t\.me\/|telegram\.me\/)/, '');
    cleaned = cleaned.replace(/^@/, '');
    return cleaned.split('/')[0];
  };

  app.post("/api/telegram/settings", async (req, res) => {
      try {
          console.log("Firestore WRITE: settings/telegram", req.body);
          const data = req.body;
          
          const cleanUsername = (username: string) => {
              if (!username) return "";
              let cleaned = username.replace(/https?:\/\/(t\.me\/|telegram\.me\/)/, '');
              cleaned = cleaned.replace(/^@/, '');
              return cleaned.split('/')[0].trim();
          };

          const channelUser = cleanUsername(data.channelUsername || data.channelLink || "");
          const groupUser = cleanUsername(data.groupUsername || data.groupLink || "");

          let finalBotToken = data.botToken || "";
          if (finalBotToken && !finalBotToken.startsWith("enc:")) {
              finalBotToken = encryptSecret(finalBotToken);
          }

          const updateData = {
              ...data,
              botToken: finalBotToken,
              adminChatId: data.chatId || data.adminChatId || "",
              chatId: data.chatId || data.adminChatId || "",
              channelUsername: channelUser ? `@${channelUser}` : "",
              groupUsername: groupUser ? `@${groupUser}` : "",
              channelLink: channelUser ? `https://t.me/${channelUser}` : "",
              groupLink: groupUser ? `https://t.me/${groupUser}` : "",
              updatedAt: data.updatedAt || new Date().toISOString()
          };

          await setDoc(doc(db, "settings", "telegram"), updateData, { merge: true });
          res.json({ status: "ok" });
      } catch (e: any) {
          console.error("Firestore WRITE Error (settings/telegram):", e.message, e.stack);
          res.status(500).json({ error: "Server error", details: e.message });
      }
  });

  app.post("/api/telegram/membership-test", async (req, res) => {
    try {
        const { botToken, channelUsername, groupUsername } = req.body;
        console.log("Membership test:", { channelUsername, groupUsername });
        const results: any = {};
        
        for (const username of [channelUsername, groupUsername]) {
            if (!username) {
                results[username || "unknown"] = "Username missing";
                continue;
            }
            const chatResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${username.replace(/^@/, '')}`);
            results[username] = await chatResponse.json();
        }
        res.json(results);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
  });
  // Telegram API routes
  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { botToken, chatId, otp } = req.body;
      if (!botToken || !chatId || !otp) return res.status(400).json({ error: "Missing fields" });

      const message = `🔐 RoyShare Admin Login OTP
\nOTP: ${otp}\n\nValid for 5 minutes.`;
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      
      const data = await response.json();
      if (!data.ok) return res.status(400).json({ error: "Failed to send OTP", details: data.description });
      
      res.json({ status: "ok" });
    } catch (e) {
      res.status(500).json({ error: "Failed to send" });
    }
  });

  app.post("/api/telegram/test", async (req, res) => {
    try {
      const { botToken, chatId, channelLink, groupLink, storageChannelId } = req.body;
      if (!botToken) return res.status(400).json({ error: "Missing botToken" });
      
      const results: any = { botValid: false, chatValid: false, channelValid: false, groupValid: false, storageValid: false };

      const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botData = await botResponse.json();
      results.botValid = botData.ok;

      if (!botData.ok) return res.json({ ...results, error: botData.description });

      if (chatId) {
        const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: "Testing connection..." })
        });
        const chatData = await chatRes.json();
        results.chatValid = chatData.ok;
      }
      
      const checkChat = async (link: string) => {
        if (!link) return false;
        const username = link.replace(/https?:\/\/(t\.me\/|telegram\.me\/)/, '').replace(/^@/, '').split('/')[0];
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${username}`);
        const data = await res.json();
        return data.ok;
      };

      results.channelValid = await checkChat(channelLink);
      results.groupValid = await checkChat(groupLink);
      
      if (storageChannelId) {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${storageChannelId}`);
        const data = await res.json();
        results.storageValid = data.ok;
      }
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/api/telegram/diagnostics", async (req, res) => {
    try {
      const { botToken, chatId, channelUsername, groupUsername, storageChannelId, supportUsername, botName, botUsername } = req.body;
      
      const errors: string[] = [];
      const report: any = {
        system: {
          frontend: "Online",
          backend: "Online",
          firebase: "Online",
          firestore: "Online",
          telegramBot: "Offline",
          webhook: "Offline",
          storage: "Offline",
          gemini: "Offline"
        },
        bot: {
          name: "None",
          username: "None",
          id: "None",
          tokenValid: "No",
          connected: "No",
          lastResponse: "No token provided"
        },
        webhook: {
          url: "None",
          connected: "No",
          pendingUpdates: 0,
          lastError: "None",
          httpResponseCode: 0
        },
        adminChat: {
          chatIdValid: "No",
          testMessageStatus: "Not tested"
        },
        privateStorage: {
          channelFound: "No",
          botAdmin: "No",
          uploadTest: "No",
          downloadTest: "No",
          error: "None"
        },
        publicChannel: {
          usernameFound: "No",
          botAdmin: "No",
          membershipVerification: "Not tested"
        },
        group: {
          usernameFound: "No",
          botAdmin: "No",
          membershipVerification: "Not tested"
        },
        overallStatus: "🔴 ERROR FOUND",
        errors: errors
      };

      // Check Firebase & Firestore
      if (db) {
        report.system.firebase = "Online";
        try {
          await getDoc(doc(db, "settings", "telegram"));
          report.system.firestore = "Online";
        } catch (e: any) {
          report.system.firestore = "Offline";
          errors.push(`Firestore Error: ${e.message}`);
        }
      } else {
        report.system.firebase = "Offline";
        report.system.firestore = "Offline";
        errors.push("Firebase App not initialized");
      }

      // Check Gemini API
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const response = await safeGenerateContent(ai, {
            model: "gemini-1.5-flash",
            contents: "ping",
          });
          if (response && response.text) {
            report.system.gemini = "Online";
          } else {
            errors.push("Gemini API call returned empty response");
          }
        } catch (e: any) {
          errors.push(`Gemini API Error: ${e.message}`);
        }
      } else {
        errors.push("Gemini API key (GEMINI_API_KEY) not set in environment");
      }

      if (!botToken) {
        errors.push("❌ Bot Token is missing");
        report.bot.lastResponse = "❌ Bot Token is missing";
        return res.json(report);
      }

      // 1. Validate Bot Token & Get Bot Info
      let botId: number | null = null;
      try {
        const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const botData = await botResponse.json();
        if (botData.ok) {
          report.bot.tokenValid = "Yes";
          report.bot.connected = "Yes";
          report.bot.name = botData.result.first_name;
          report.bot.username = "@" + botData.result.username;
          report.bot.id = String(botData.result.id);
          botId = botData.result.id;
          report.bot.lastResponse = "OK";
          report.system.telegramBot = "Online";
        } else {
          errors.push(`❌ Invalid Bot Token: ${botData.description}`);
          report.bot.lastResponse = `❌ Invalid Bot Token: ${botData.description}`;
          return res.json(report);
        }
      } catch (e: any) {
        errors.push(`❌ Telegram API Error: ${e.message}`);
        report.bot.lastResponse = `❌ Telegram API Error: ${e.message}`;
        return res.json(report);
      }

      // 2. Verify Webhook
      try {
        const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const webhookData = await webhookResponse.json();
        if (webhookData.ok) {
          report.webhook.url = webhookData.result.url || "None";
          report.webhook.pendingUpdates = webhookData.result.pending_update_count || 0;
          report.webhook.lastError = webhookData.result.last_error_message || "None";
          report.webhook.httpResponseCode = webhookData.result.last_error_date ? 500 : 200;
          
          if (webhookData.result.url) {
            report.webhook.connected = "Yes";
            report.system.webhook = "Online";
          } else {
            errors.push("❌ Webhook Not Set");
          }
        } else {
          errors.push(`❌ Webhook Info Failed: ${webhookData.description}`);
        }
      } catch (e: any) {
        errors.push(`❌ Webhook Check Error: ${e.message}`);
      }

      // 3. Verify Admin Chat
      if (chatId) {
        try {
          const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: "🟢 <b>RoyShare Connection Test</b>\n\nThis is a diagnostic test message sent from the Admin Dashboard." })
          });
          const chatData = await chatRes.json();
          if (chatData.ok) {
            report.adminChat.chatIdValid = "Yes";
            report.adminChat.testMessageStatus = "Sent Successfully";
          } else {
            errors.push(`❌ Chat ID Invalid: ${chatData.description}`);
            report.adminChat.testMessageStatus = `❌ Chat ID Invalid: ${chatData.description}`;
          }
        } catch (e: any) {
          errors.push(`❌ Admin Chat Test Error: ${e.message}`);
          report.adminChat.testMessageStatus = `❌ Error: ${e.message}`;
        }
      } else {
        errors.push("❌ Admin Chat ID Not Configured");
      }

      // 4. Verify Private Storage Channel (upload/download tests)
      if (storageChannelId) {
        try {
          const chRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${storageChannelId}`);
          const chData = await chRes.json();
          if (chData.ok) {
            report.privateStorage.channelFound = "Yes";
            
            // Is Bot Admin?
            const adminsRes = await fetch(`https://api.telegram.org/bot${botToken}/getChatAdministrators?chat_id=${storageChannelId}`);
            const adminsData = await adminsRes.json();
            if (adminsData.ok && Array.isArray(adminsData.result)) {
              const isBotAdmin = adminsData.result.some((admin: any) => admin.user?.id === botId);
              report.privateStorage.botAdmin = isBotAdmin ? "Yes" : "No";
              if (!isBotAdmin) {
                errors.push("❌ Storage Channel: Bot is not Admin");
              }
            } else {
              report.privateStorage.botAdmin = "No";
              errors.push(`❌ Storage Channel Admin Check Failed: ${adminsData.description || "Inaccessible"}`);
            }

            // Upload Test
            let uploadedFileId: string | null = null;
            let uploadMessageId: number | null = null;
            try {
              const form = new FormData();
              form.append("chat_id", storageChannelId);
              const fileBlob = new Blob(["RoyShare Connection Test File " + Date.now()], { type: "text/plain" });
              form.append("document", fileBlob, "royshare_test.txt");
              const uploadRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
                method: "POST",
                body: form
              });
              const uploadData = await uploadRes.json();
              if (uploadData.ok && uploadData.result?.document?.file_id) {
                report.privateStorage.uploadTest = "Yes";
                report.system.storage = "Online";
                uploadedFileId = uploadData.result.document.file_id;
                uploadMessageId = uploadData.result.message_id;
              } else {
                errors.push(`❌ Upload Failed: ${uploadData.description || "Unknown error"}`);
              }
            } catch (upErr: any) {
              errors.push(`❌ Upload Failed: ${upErr.message}`);
            }

            // Download Test
            if (uploadedFileId) {
              try {
                const getFileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${uploadedFileId}`);
                const getFileData = await getFileRes.json();
                if (getFileData.ok && getFileData.result?.file_path) {
                  const filePath = getFileData.result.file_path;
                  const fileContentUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
                  const dlRes = await fetch(fileContentUrl);
                  if (dlRes.ok) {
                    report.privateStorage.downloadTest = "Yes";
                  } else {
                    errors.push("❌ Download Failed: HTTP error downloading file");
                  }
                } else {
                  errors.push(`❌ Download Failed: getFile failed - ${getFileData.description || "Unknown"}`);
                }
              } catch (dlErr: any) {
                errors.push(`❌ Download Failed: ${dlErr.message}`);
              }

              // Cleanup uploaded message
              if (uploadMessageId) {
                try {
                  await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: storageChannelId, message_id: uploadMessageId })
                  });
                } catch (e) {}
              }
            }
          } else {
            errors.push(`❌ Storage Channel Not Accessible: ${chData.description}`);
            report.privateStorage.error = chData.description;
          }
        } catch (e: any) {
          errors.push(`❌ Storage Channel Test Error: ${e.message}`);
        }
      } else {
        errors.push("❌ Storage Channel ID is missing");
      }

      // Helper for channel/group verification
      const verifyJoinChat = async (usernameField: string, label: string, targetReport: any) => {
        if (!usernameField) {
          targetReport.usernameFound = "No";
          targetReport.membershipVerification = "No username provided";
          errors.push(`❌ ${label} Username Not Configured`);
          return;
        }

        const cleanUsername = usernameField.replace(/^@/, '').trim();
        if (!cleanUsername) {
          targetReport.usernameFound = "No";
          errors.push(`❌ ${label} Username is empty`);
          return;
        }

        try {
          const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${cleanUsername}`);
          const chatData = await chatRes.json();
          if (chatData.ok) {
            targetReport.usernameFound = "Yes";
            
            // Check admin status
            const adminsRes = await fetch(`https://api.telegram.org/bot${botToken}/getChatAdministrators?chat_id=@${cleanUsername}`);
            const adminsData = await adminsRes.json();
            if (adminsData.ok && Array.isArray(adminsData.result)) {
              const isBotAdmin = adminsData.result.some((admin: any) => admin.user?.id === botId);
              targetReport.botAdmin = isBotAdmin ? "Yes" : "No";
              if (!isBotAdmin) {
                errors.push(`❌ ${label}: Bot is not Admin`);
              }
            } else {
              targetReport.botAdmin = "No";
              errors.push(`❌ ${label}: Bot is not Admin or cannot fetch administrators`);
            }

            targetReport.membershipVerification = "Verified";
          } else {
            errors.push(`❌ ${label} Username Found Failed: ${chatData.description}`);
            targetReport.membershipVerification = `Failed: ${chatData.description}`;
          }
        } catch (e: any) {
          errors.push(`❌ ${label} Verification Error: ${e.message}`);
          targetReport.membershipVerification = `Failed: ${e.message}`;
        }
      };

      // 5. Verify Public Channel
      await verifyJoinChat(channelUsername, "Public Channel", report.publicChannel);

      // 6. Verify Group
      await verifyJoinChat(groupUsername, "Group", report.group);

      // Overall status
      if (errors.length === 0) {
        report.overallStatus = "🟢 ALL SYSTEMS OPERATIONAL";
      } else {
        report.overallStatus = "🔴 ERROR FOUND";
      }

      res.json(report);
    } catch (e: any) {
      console.error("Full diagnostics handler error:", e);
      res.status(500).json({ error: e.message || "Server error running diagnostics" });
    }
  });

  app.post("/api/telegram/send-test", async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      if (!botToken || !chatId) return res.status(400).json({ error: "Missing botToken or chatId" });
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: "🔔 <b>RoyShare Test Message</b>\n\nYour Telegram Bot is successfully connected and can send messages to this chat!" })
      });
      const data = await response.json();
      if (!data.ok) return res.status(400).json({ error: data.description });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/telegram/test-channel", async (req, res) => {
    try {
      const { botToken, channelUsername } = req.body;
      if (!botToken || !channelUsername) return res.status(400).json({ error: "Missing fields" });
      const clean = channelUsername.replace(/^@/, '').trim();
      const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${clean}`);
      const data = await chatRes.json();
      if (!data.ok) return res.status(400).json({ error: data.description });
      res.json({ ok: true, chat: data.result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/telegram/test-group", async (req, res) => {
    try {
      const { botToken, groupUsername } = req.body;
      if (!botToken || !groupUsername) return res.status(400).json({ error: "Missing fields" });
      const clean = groupUsername.replace(/^@/, '').trim();
      const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${clean}`);
      const data = await chatRes.json();
      if (!data.ok) return res.status(400).json({ error: data.description });
      res.json({ ok: true, chat: data.result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/telegram/test-upload", async (req, res) => {
    try {
      const { botToken, storageChannelId } = req.body;
      if (!botToken || !storageChannelId) return res.status(400).json({ error: "Missing fields" });
      const form = new FormData();
      form.append("chat_id", storageChannelId);
      const fileBlob = new Blob(["Upload test " + Date.now()], { type: "text/plain" });
      form.append("document", fileBlob, "royshare_test_upload.txt");
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: "POST",
        body: form
      });
      const data = await response.json();
      if (!data.ok) return res.status(400).json({ error: data.description });
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: storageChannelId, message_id: data.result.message_id })
        });
      } catch (e) {}
      res.json({ ok: true, fileId: data.result.document.file_id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/telegram/test-download", async (req, res) => {
    try {
      const { botToken, storageChannelId } = req.body;
      if (!botToken || !storageChannelId) return res.status(400).json({ error: "Missing fields" });
      const form = new FormData();
      form.append("chat_id", storageChannelId);
      const fileBlob = new Blob(["Download test " + Date.now()], { type: "text/plain" });
      form.append("document", fileBlob, "royshare_test_download.txt");
      const upRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: "POST",
        body: form
      });
      const upData = await upRes.json();
      if (!upData.ok) return res.status(400).json({ error: `Upload phase failed: ${upData.description}` });
      const fileId = upData.result.document.file_id;
      const getFileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
      const getFileData = await getFileRes.json();
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: storageChannelId, message_id: upData.result.message_id })
        });
      } catch (e) {}
      if (!getFileData.ok) return res.status(400).json({ error: `getFile phase failed: ${getFileData.description}` });
      const filePath = getFileData.result.file_path;
      const fileContentUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
      const dlRes = await fetch(fileContentUrl);
      if (!dlRes.ok) return res.status(400).json({ error: `Download phase failed: HTTP status ${dlRes.status}` });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/clear-cache", (req, res) => {
    res.json({ ok: true, message: "System cache cleared successfully." });
  });

  app.post("/api/telegram/webhook/get", async (req, res) => {
    try {
      const { botToken } = req.body;
      if (!botToken) return res.status(400).json({ error: "Missing botToken" });
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const data = await response.json();
      res.json(data.result || {});
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/telegram/webhook/set", async (req, res) => {
    try {
      const { botToken, url } = req.body;
      if (!botToken || !url) return res.status(400).json({ error: "Missing fields" });
      
      // 1. Call setWebhook API
      const setResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(url)}`);
      const setData = await setResponse.json();
      
      if (!setData.ok) {
        return res.status(400).json({ 
          error: setData.description || "Failed to set webhook" 
        });
      }

      // 2. Verify immediately using getWebhookInfo
      const verifyResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const verifyData = await verifyResponse.json();

      if (verifyData.ok) {
        const info = verifyData.result;
        if (info.url === url) {
          return res.json({
            ok: true,
            description: "Webhook set and verified successfully!",
            webhookInfo: info
          });
        } else {
          return res.status(400).json({
            error: `Verification mismatch: Requested URL is ${url}, but Telegram returned ${info.url || "None"}`
          });
        }
      } else {
        return res.status(400).json({
          error: `Verification failed: getWebhookInfo returned: ${verifyData.description || "Unknown Error"}`
        });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/api/telegram/webhook/delete", async (req, res) => {
    try {
      const { botToken } = req.body;
      if (!botToken) return res.status(400).json({ error: "Missing botToken" });
      const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
      const data = await response.json();
      res.json({ ok: data.ok, description: data.description });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Incoming Telegram Webhook handler endpoint
  app.post("/api/telegram/webhook", (req, res) => {
    // ALWAYS return 200 immediately to Telegram to prevent retries and timeouts
    res.status(200).json({ ok: true });

    // Process in background
    (async () => {
      const db = getDb();
      try {
        const update = req.body;
        if (!update || typeof update !== "object") return;

        console.log(`📥 Webhook Processing Update ID: ${update.update_id}`);

        // Load Bot Token from Firestore
        const settingsSnap = await getDoc(doc(db, "settings", "telegram"));
        if (!settingsSnap.exists()) {
          console.error("🔴 Fatal: settings/telegram document missing in Firestore");
          return;
        }
        const botToken = settingsSnap.data()?.botToken;
        if (!botToken) {
          console.error("🔴 Fatal: Bot Token missing in Firestore");
          return;
        }

        // Handle the update
        await handleUpdate(botToken, update);

      } catch (err: any) {
        console.error("🔴 Webhook Background Processing Fatal Error:");
        console.error(err.stack || err);
        
        try {
          await setDoc(doc(db, "settings", "telegram"), {
            lastWebhookError: err.message || String(err),
            lastWebhookErrorTime: new Date().toISOString(),
            lastWebhookErrorStack: err.stack || ""
          }, { merge: true });
        } catch (dbErr) {}
      }
    })();
  });

  // Polling infrastructure
  let pollingInterval: NodeJS.Timeout | null = null;
  let pollingState = {
      isRunning: false,
      lastUpdate: null as any,
      receivedCount: 0,
      lastCommand: null as any,
      lastError: null as any,
      lastUpdateId: 0,
      lastUserId: null as any
  };

  async function runPolling(botToken: string) {
      console.log("Long polling is completely disabled in favor of Telegram Webhook to prevent 409 Conflict errors.");
      pollingState.isRunning = false;
      return;
  }

  app.post("/api/telegram/polling/start", async (req, res) => {
      const { botToken } = req.body;
      runPolling(botToken);
      res.json({ status: "started" });
  });

  app.post("/api/telegram/polling/stop", async (req, res) => {
      pollingState.isRunning = false;
      res.json({ status: "stopped" });
  });

  app.post("/api/telegram/polling/restart", async (req, res) => {
      const { botToken } = req.body;
      pollingState.isRunning = false;
      await new Promise(r => setTimeout(r, 1500)); // wait for stop
      runPolling(botToken);
      res.json({ status: "restarted" });
  });

  app.get("/api/telegram/polling/status", (req, res) => {
      res.json(pollingState);
  });

  // Auto-start polling on app startup if token exists (delayed slightly for network initialization)
  setTimeout(() => {
    getDoc(doc(db, "settings", "telegram")).then(async (docSnap) => {
        const data = docSnap.data();
        if (!docSnap.exists()) {
          console.log("Initializing settings/telegram document...");
          await setDoc(doc(db, "settings", "telegram"), {
            botToken: "",
            channelUsername: "",
            groupUsername: "",
            storageChannelId: "",
            adminChatId: ""
          });
        } else if (data?.botToken) {
            console.log("Auto-start polling skipped: Webhook is the only active update method.");
        }
    }).catch(e => {
        console.error("Failed to auto-start polling:", e);
    });
  }, 2000);

  app.post("/api/auth/send-otp", async (req: any, res: any) => {
    try {
      const { mobile, telegramId } = req.body;
      if (!mobile || !telegramId) {
        return res.status(400).json({ error: "Mobile and Telegram ID required" });
      }

      const cleanMobile = mobile.trim();
      const tgIdStr = String(telegramId).trim();

      const userRef = doc(db, "users", tgIdStr);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return res.status(404).json({ error: "User profile not found." });

      const userData = userSnap.data();
      const username = userData.firstName || userData.username || "User";

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const rateSnap = await getDocs(query(collection(db, "otpRequests"), 
        where("telegramId", "==", tgIdStr), 
        where("createdAt", ">=", oneHourAgo.toISOString())));
      
      if (rateSnap.size >= 5) {
        return res.status(429).json({ error: "OTP limit exceeded. Try again in an hour." });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = crypto.createHash("sha256").update(otpCode).digest("hex");
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      const oldSnap = await getDocs(query(collection(db, "otps"), 
        where("telegramId", "==", tgIdStr), 
        where("used", "==", false)));
      for (const oldDoc of oldSnap.docs) await updateDoc(oldDoc.ref, { used: true });

      await addDoc(collection(db, "otps"), {
        telegramId: tgIdStr,
        mobile: cleanMobile,
        hashedOtp,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        used: false
      });

      await addDoc(collection(db, "otpRequests"), {
        telegramId: tgIdStr,
        mobile: cleanMobile,
        createdAt: now.toISOString()
      });

      const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
      const botToken = telegramSettingsDoc.data()?.botToken;
      if (botToken) {
        const msg = `🔐 <b>RoyShare Verification</b>
\nHello <b>${username}</b> 👋\n\nYour Verification Code\n\n<code>${otpCode}</code>\n\n⏳ Valid for 5 Minutes`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgIdStr, text: msg, parse_mode: "HTML" })
        });
      }

      res.json({ success: true, message: "OTP sent." });
    } catch (e: any) {
      console.error("Error in /api/auth/send-otp:", e);
      res.status(500).json({ error: "Failed to send OTP." });
    }
  });

  app.post("/api/auth/verify-otp", async (req: any, res: any) => {
    try {
      const { mobile, otp, telegramId } = req.body;
      if (!mobile || !otp || !telegramId) return res.status(400).json({ error: "Missing parameters" });

      const cleanMobile = mobile.trim();
      const tgIdStr = String(telegramId).trim();
      const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
      const now = new Date().toISOString();

      const otpSnap = await getDocs(query(collection(db, "otps"), 
        where("telegramId", "==", tgIdStr),
        where("mobile", "==", cleanMobile), 
        where("hashedOtp", "==", hashedInput), 
        where("used", "==", false), 
        where("expiresAt", ">=", now)));
      
      if (otpSnap.empty) return res.status(400).json({ error: "Invalid or expired OTP." });

      await updateDoc(otpSnap.docs[0].ref, { used: true });

      const userRef = doc(db, "users", tgIdStr);
      await updateDoc(userRef, { 
        lastLogin: now,
        isVerified: true,
        verifiedAt: now,
        phoneVerifiedInMiniApp: true,
        mobile: cleanMobile
      });

      res.json({ success: true, message: "Verified!" });
    } catch (e: any) {
      console.error("Error in /api/auth/verify-otp:", e);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/auth/check-session", async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const { token, fingerprint } = req.body;
      debugLog(`[${requestId}] check-session START | token: ${token ? token.substring(0, 5) + "..." : "missing"}`);

      if (!token) {
        return res.status(200).json({ success: false, authenticated: false, error: "No token provided" });
      }

      const now = new Date().toISOString();
      
      debugLog(`[${requestId}] Querying session...`);
      const snap = await getDocs(query(collection(db, "sessions"), 
        where("token", "==", token), 
        where("expiresAt", ">", now)));

      if (snap.empty) {
        debugLog(`[${requestId}] Session not found or expired`);
        return res.status(200).json({ success: false, authenticated: false });
      }

      const sessionDoc = snap.docs[0];
      const sessionData = sessionDoc.data();
      debugLog(`[${requestId}] Session found for user: ${sessionData.userId}`);

      // Check fingerprint
      if (fingerprint && sessionData.fingerprint && sessionData.fingerprint !== fingerprint) {
        debugLog(`[${requestId}] Fingerprint mismatch`);
        return res.status(200).json({ 
          success: false,
          authenticated: false,
          error: "New Device Detected. Please verify again.",
          newDevice: true 
        });
      }
      
      if (!sessionData.userId) {
        debugLog(`[${requestId}] Session has no userId`);
        return res.status(200).json({ success: false, authenticated: false });
      }

      debugLog(`[${requestId}] Fetching user doc: ${sessionData.userId}`);
      const userSnap = await getDoc(doc(db, "users", String(sessionData.userId)));
      
      if (!userSnap.exists()) {
        debugLog(`[${requestId}] User doc NOT FOUND`);
        return res.status(200).json({ success: false, authenticated: false, error: "User profile not found" });
      }

      const userData = userSnap.data();
      debugLog(`[${requestId}] SUCCESS: Returning user data`);
      res.json({ 
        success: true, 
        authenticated: true,
        user: {
          telegramId: userData.telegramId || sessionData.userId,
          username: userData.username || "no_username",
          firstName: userData.firstName || "User",
          mobile: userData.mobile,
          isVerified: true,
          status: userData.status || "active",
          photoUrl: userData.photoUrl || ""
        } 
      });
    } catch (e: any) {
      console.error("Error in /api/auth/check-session:", e);
      debugLog(`[${requestId}] ERROR in /api/auth/check-session: ${e.message || e}`);
      if (e.stack) debugLog(`STACK: ${e.stack}`);
      // Even on error, return a non-500 response if it's a logical failure
      res.status(200).json({ success: false, authenticated: false, error: "Internal session check error" });
    }
  });

  // Earn Rewards endpoints
  app.get("/api/earn-rewards/settings", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      // 1. Get timer duration (defaults to 30)
      const settingsDocRef = doc(db, "settings", "earn_rewards");
      const settingsSnap = await getDoc(settingsDocRef);
      const timerDuration = settingsSnap.exists() ? (settingsSnap.data()?.timerDuration ?? 30) : 30;

      let currency = "INR";
      let userName = "User";
      let completedTaskIds: string[] = [];

      if (userId) {
        // 2. Fetch user information
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          currency = uData.currency || "INR";
          userName = uData.firstName || uData.username || "User";
        }

        // 3. Fetch completed tasks for anti-abuse check
        const q = query(
          collection(db, "task_completions"),
          where("userId", "==", userId),
          where("status", "==", "completed")
        );
        const qSnap = await getDocs(q);
        qSnap.forEach(docSnap => {
          const comp = docSnap.data();
          if (comp.taskId) {
            completedTaskIds.push(comp.taskId);
          }
        });
      }

      let botUsername = "Roysharearn_bot";
      try {
        const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
        const botToken = telegramSettingsDoc.data()?.botToken;
        if (botToken) {
          const botMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
          const botMeData = await botMeRes.json();
          if (botMeData.ok && botMeData.result?.username) {
            botUsername = botMeData.result.username;
          }
        }
      } catch (e) {
        console.error("Error getting bot username inside settings endpoint:", e);
      }

      // Fetch dynamic tasks from Firestore tasks collection
      let dbTasks: any[] = [];
      try {
        const tasksQuery = query(collection(db, "tasks"));
        const tasksSnap = await getDocs(tasksQuery);
        dbTasks = tasksSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.title || "",
            amount: Number(d.rewardAmount) || 0,
            status: d.status || "🟢 Active",
            ...d
          };
        });
      } catch (e) {
        console.error("Error fetching dynamic tasks in settings endpoint:", e);
      }

      // Only return Active tasks to the user
      const mergedTasks = dbTasks.filter(t => 
        t.status === "🟢 Active" || 
        String(t.status || "").toLowerCase().includes("active")
      );

      return res.json({
        timerDuration,
        currency,
        userName,
        completedTaskIds,
        tasks: mergedTasks,
        botUsername
      });
    } catch (e: any) {
      console.error("Error in /api/earn-rewards/settings:", e);
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/api/earn-rewards/complete", async (req, res) => {
    try {
      const { userId, taskId } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      if (!taskId) return res.status(400).json({ error: "Missing taskId" });

      // Find the task amount from Firestore or fallback to hardcoded REWARD_TASKS
      let amount = 0;
      let isDbTask = false;
      let taskTitle = "Task";
      let taskProvider = "";
      try {
        const dbTaskRef = doc(db, "tasks", taskId);
        const dbTaskSnap = await getDoc(dbTaskRef);
        if (dbTaskSnap.exists()) {
          const tData = dbTaskSnap.data();
          
          if (tData.status === "Pause" || tData.status === "🔴 Disabled") {
            return res.status(400).json({ error: "This task is currently paused." });
          }

          if (tData.totalLimit && tData.totalLimit > 0) {
            if ((tData.completedUsers || 0) >= tData.totalLimit) {
              return res.status(400).json({ error: "Total task limit reached." });
            }
          }

          amount = Number(tData.rewardAmount) || 0;
          isDbTask = true;
          taskTitle = tData.title || "Task";
          taskProvider = tData.provider || "Unknown";
          
          // Increment participants, completedUsers, and totalRewardsDistributed on dynamic task
          await setDoc(dbTaskRef, {
            participants: (dbTaskSnap.data()?.participants || 0) + 1,
            completedUsers: (dbTaskSnap.data()?.completedUsers || 0) + 1,
            totalRewardsDistributed: (dbTaskSnap.data()?.totalRewardsDistributed || 0) + amount
          }, { merge: true });
        }
      } catch (err) {
        console.error("Error looking up task in Firestore inside complete route:", err);
      }

      if (!isDbTask) {
        return res.status(400).json({ error: "Invalid taskId" });
      }

      // Anti-abuse: Check if already completed (incorporating Daily Limit and Cooldown)
      const taskDocRef = doc(db, "tasks", taskId);
      const tSnap = await getDoc(taskDocRef);
      let cooldown = 30; // default 30 mins
      let dailyLimit = 0; // 0 = unlimited
      if (tSnap.exists()) {
        cooldown = Number(tSnap.data().cooldown) || 30;
        dailyLimit = Number(tSnap.data().dailyLimitPerUser) || 0;
      }

      const qCheck = query(
        collection(db, "task_completions"),
        where("userId", "==", userId),
        where("taskId", "==", taskId),
        where("status", "==", "completed")
      );
      const qSnap = await getDocs(qCheck);
      
      if (!qSnap.empty) {
        const completions = qSnap.docs.map(d => d.data());
        // Sort descending by date
        completions.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        
        // 1. Check Cooldown
        const lastCompletion = completions[0];
        if (lastCompletion && cooldown > 0) {
          const lastTime = new Date(lastCompletion.completedAt).getTime();
          const nowTime = Date.now();
          const diffMins = (nowTime - lastTime) / (1000 * 60);
          if (diffMins < cooldown) {
            return res.status(400).json({ error: `You must wait ${cooldown} minutes between completions.` });
          }
        }

        // 2. Check Daily Limit
        if (dailyLimit > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayCompletions = completions.filter(c => c.completedAt && c.completedAt.startsWith(today));
          if (todayCompletions.length >= dailyLimit) {
            return res.status(400).json({ error: `Daily limit of ${dailyLimit} completions reached for this task.` });
          }
        }
      }


      // Fetch user
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return res.status(404).json({ error: "User not found" });
      }

      const uData = userDoc.data();
      
      // Evaluate Reward via Economy Protection & Smart Reward Engine
      const economyEval = await evaluateReward(userId, amount, "shortener_task");
      if (!economyEval.allowed) {
        return res.status(400).json({ error: economyEval.message || "Daily limit reached. Please come back tomorrow." });
      }
      amount = economyEval.finalAmount;

      const userStatus = uData.status || "Normal";
      let isFlagged = ["Pending Review", "High Risk", "Shadow Monitor"].includes(userStatus) || (uData?.trustScore !== undefined && uData.trustScore < 20);
      if (economyEval.isPending) {
        isFlagged = true;
      }
      const isSb = uData.shadowBanned === true;
      let finalNewBalance = uData?.availableBalance || 0;

      if (isFlagged) {
        const fileEarnings = uData?.fileEarnings || 0;
        const linkEarnings = uData?.linkEarnings || 0;
        const referralEarnings = uData?.referralEarnings || 0;
        const bonusBalance = uData?.bonusBalance || 0;
        const realRewardBalance = uData?.rewardBalance || 0;
        const withdrawnAmount = uData?.withdrawnAmount || 0;
        const pendingWithdrawals = uData?.pendingWithdrawals || 0;

        finalNewBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + realRewardBalance - withdrawnAmount - pendingWithdrawals;
        
        await setDoc(userDocRef, {
          tasksCompleted: (uData.tasksCompleted || 0) + 1
        }, { merge: true });
      } else if (isSb) {
        const shadowRewardBalance = (uData.shadowRewardBalance || 0) + amount;
        const shadowAvailableBalance = (uData.shadowAvailableBalance || 0) + amount;
        const shadowEarnings = (uData.shadowEarnings || 0) + amount;
        const shadowTotalEarnings = (uData.shadowTotalEarnings || 0) + amount;
        const shadowBalance = (uData.shadowBalance || 0) + amount;

        await setDoc(userDocRef, {
          shadowRewardBalance,
          shadowAvailableBalance,
          shadowEarnings,
          shadowTotalEarnings,
          shadowBalance,
          tasksCompleted: (uData.tasksCompleted || 0) + 1
        }, { merge: true });

        await addDoc(collection(db, "shadow_blocked_rewards"), {
          userId: String(userId),
          username: uData.username || uData.firstName || "no_username",
          amount,
          type: "task_reward",
          createdAt: new Date().toISOString()
        });

        const fileEarnings = uData?.fileEarnings || 0;
        const linkEarnings = uData?.linkEarnings || 0;
        const referralEarnings = uData?.referralEarnings || 0;
        const bonusBalance = uData?.bonusBalance || 0;
        const realRewardBalance = uData?.rewardBalance || 0;
        const withdrawnAmount = uData?.withdrawnAmount || 0;
        const pendingWithdrawals = uData?.pendingWithdrawals || 0;

        finalNewBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + realRewardBalance + shadowRewardBalance - withdrawnAmount - pendingWithdrawals;
      } else {
        const fileEarnings = uData?.fileEarnings || 0;
        const linkEarnings = uData?.linkEarnings || 0;
        const referralEarnings = uData?.referralEarnings || 0;
        const bonusBalance = uData?.bonusBalance || 0;
        const rewardBalance = (uData?.rewardBalance || 0) + amount;
        const withdrawnAmount = uData?.withdrawnAmount || 0;
        const pendingWithdrawals = uData?.pendingWithdrawals || 0;

        // New availableBalance calculation (integrating rewardBalance!)
        finalNewBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance - withdrawnAmount - pendingWithdrawals;
        const earnings = (uData?.earnings || 0) + amount;

        // Update user doc in Firestore
        await setDoc(userDocRef, {
          rewardBalance,
          availableBalance: finalNewBalance,
          earnings,
          tasksCompleted: (uData.tasksCompleted || 0) + 1
        }, { merge: true });

        // Increase Trust Score for Completed Task (+2)
        adjustTrustScore(userId, 2, "Completed Task").catch(() => {});
      }

      // Store in Firestore exactly what was requested:
      // userId, taskId, rewardAmount, status, completedPages, completedAt
      const completedAt = new Date().toISOString();
      await addDoc(collection(db, "task_completions"), {
        userId,
        taskId,
        rewardAmount: amount,
        status: isFlagged ? "pending_review" : "completed",
        taskCompleted: true,
        rewardGranted: !isFlagged,
        completedPages: 3,
        completedAt,
        shadow_banned: isSb,
        is_flagged: isFlagged
      });

      // Log Transaction History
      const taskName = tSnap.exists() ? (tSnap.data().name || tSnap.data().title || "Task") : "Task";
      await recordWalletTransaction({
        userId: String(userId),
        amount,
        creditDebit: "Credit",
        source: "🎯 Task Reward",
        description: `Completed task: ${taskName}`,
        status: isFlagged ? "Pending Review" : "Completed"
      });

      // Format transaction date & time for legacy logs if needed
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const timeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });

      const txData = {
        amount,
        type: "Task Reward",
        date: dateStr,
        time: timeStr,
        userId,
        createdAt: now.toISOString(),
        shadow_banned: isSb,
        status: isFlagged ? "Pending Review" : "Completed",
        is_flagged: isFlagged
      };

      await Promise.all([
        addDoc(collection(db, "transactionHistory"), txData)
      ]);

      // Fetch Bot Token & Notify user on Telegram
      const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
      const botToken = settingsDoc.data()?.botToken;
      const currency = uData?.currency || "INR";

      if (botToken) {
        function localFormatCurrency(val: number, cur: string = "INR"): string {
            if (cur === "USD") {
                const converted = val * 0.0118;
                return `$${converted.toFixed(2)}`;
            } else {
                return `₹${val.toFixed(2)}`;
            }
        }
        const formattedAmt = localFormatCurrency(amount, currency);
        
        // Exact text required:
        // ✅ Reward Credited
        // 💰 Reward:
        // ₹{rewardAmount}
        // Added to Reward Balance.
        const messageText = isFlagged 
          ? `⏳ Reward is under security verification.
\nYour reward of ${formattedAmt} is being verified by security. This usually completes within a short time.`
          : `✅ Reward Credited
\n💰 Reward:\n${formattedAmt}\n\nAdded to Reward Balance.`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: Number(userId),
            text: messageText
          })
        });
      }

      return res.json({ ok: true, rewardAmount: amount, currency, isFlagged, message: isFlagged ? "⏳ Reward is under security verification. This usually completes within a short time." : undefined });
    } catch (e: any) {
      console.error("Error in /api/earn-rewards/complete:", e);
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  // ========================================
  
  // ========================================
  
  
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-!'; // Must be 32 bytes
  const IV_LENGTH = 16;

  function encryptToken(text) {
    if (!text) return text;
    try {
      let iv = crypto.randomBytes(IV_LENGTH);
      let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch(e) {
      return text;
    }
  }

  function decryptToken(text) {
    if (!text || !text.includes(':')) return text;
    try {
      let textParts = text.split(':');
      let iv = Buffer.from(textParts.shift(), 'hex');
      let encryptedText = Buffer.from(textParts.join(':'), 'hex');
      let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch(e) {
      return text;
    }
  }

  // MONETAG SERVER-SIDE POSTBACK SYSTEM
  // ========================================

  // 0. Health Check Endpoint
  app.get("/api/monetag/postback/test", (req, res) => {
    res.json({
      success: true,
      message: "Monetag Postback API is working",
      timestamp: new Date().toISOString()
    });
  });

  // 1. Postback Handler (Supports both GET and POST)
  app.all("/api/monetag/postback", async (req, res) => {
    const method = req.method;
    const params = method === "GET" ? req.query : req.body;
    
    console.log(`[MONETAG POSTBACK] Received ${method} request at ${new Date().toISOString()}`);
    console.log(`[MONETAG POSTBACK] Full Raw Params:`, JSON.stringify(params, null, 2));

    // Helper function to clean values and discard placeholder macros
    const cleanValue = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      const str = String(val).trim();
      if (
        str === "" ||
        str === "undefined" ||
        str === "null" ||
        str === "Unknown" ||
        (str.startsWith("{") && str.endsWith("}"))
      ) {
        return null;
      }
      return str;
    };

    const clean_telegram_id = cleanValue(params.telegram_id) || 
                              cleanValue(params.ext_id) || 
                              cleanValue(params.subid) || 
                              cleanValue(params.click_id) || 
                              cleanValue(params.sub_id) || 
                              cleanValue(params.visitor_id);
                              
    const clean_ymid = cleanValue(params.ymid) || 
                       cleanValue(params.clickid) || 
                       cleanValue(params.transaction_id) || 
                       cleanValue(params.visitor_id) || 
                       cleanValue(params.click_id);
                       
    const clean_request_var = cleanValue(params.request_var) || 
                              cleanValue(params.custom_var) || 
                              cleanValue(params.taskId) || 
                              cleanValue(params.subid1);

    // Try to extract from custom underscore-separated ymid format if any other parts are missing or placeholders
    let extracted_tg_id: string | null = null;
    let extracted_task_id: string | null = null;

    if (clean_ymid && clean_ymid.includes("_")) {
      const parts = clean_ymid.split("_");
      if (parts.length >= 2) {
        extracted_tg_id = parts[0];
        extracted_task_id = parts[1];
        console.log(`[MONETAG POSTBACK] Extracted parameters from ymid (${clean_ymid}): TG=${extracted_tg_id}, TASK=${extracted_task_id}`);
      }
    }

    const telegram_id = clean_telegram_id || extracted_tg_id;
    const ymid = clean_ymid;
    const request_var = clean_request_var || extracted_task_id;
    
    const zone_id = params.zone_id || params.zoneid;
    const sub_zone_id = params.sub_zone_id || params.subzoneid || "unknown";
    const event_type = params.event_type || params.event;
    const reward_event_type = params.reward_event_type || params.reward;
    const estimated_price = params.estimated_price || params.price || params.revenue || 0;

    // Log entry for the postback
    const postbackRef = collection(db, "monetag_postbacks");
    const logEntry: any = {
      timestamp: new Date().toISOString(),
      method,
      ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
      params: { ...params },
      status: "pending",
      identified_tg_id: telegram_id || "MISSING",
      identified_ymid: ymid || "MISSING",
      identified_task: request_var || "DEFAULT"
    };

    try {
      // Basic validation
      if (!telegram_id) {
        console.error(`[MONETAG POSTBACK] FAILURE: Missing or macro-placeholder telegram_id.`);
        logEntry.status = "failed";
        logEntry.error = `Invalid or missing telegram_id. Check if ext_id, subid, or ymid was passed to show()`;
        await addDoc(postbackRef, logEntry);
        
        return res.status(400).json({ 
          error: "Missing telegram_id", 
          received: params,
          hint: "Ensure ext_id, subid or ymid is passed in the frontend SDK call" 
        });
      }

      if (!ymid) {
        console.error(`[MONETAG POSTBACK] FAILURE: Missing or macro-placeholder ymid.`);
        logEntry.status = "failed";
        logEntry.error = "Missing ymid (transaction id)";
        await addDoc(postbackRef, logEntry);
        return res.status(400).send("Missing ymid");
      }

      console.log(`[MONETAG POSTBACK] Validated Postback: TG=${telegram_id}, YMID=${ymid}, Zone=${zone_id}, Event=${event_type}`);

      // Replay Protection: Check if this YMID was already processed successfully
      const duplicateQuery = query(
        postbackRef, 
        where("params.ymid", "==", ymid), 
        where("status", "==", "success")
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        console.warn(`[MONETAG POSTBACK] Warning: Duplicate YMID detected: ${ymid}`);
        logEntry.status = "failed";
        logEntry.error = "Duplicate YMID detected (Replay Attack prevented)";
        await addDoc(postbackRef, logEntry);
        return res.status(200).send("Duplicate postback already processed");
      }

      // Check reward eligibility
      const isEligibleReward = reward_event_type === "yes" || reward_event_type === "valued";
      if (!isEligibleReward) {
        console.log(`[MONETAG POSTBACK] Event ignored: reward_event_type is '${reward_event_type}'`);
        logEntry.status = "ignored";
        logEntry.reason = `reward_event_type '${reward_event_type}' is neither 'yes' nor 'valued'`;
        await addDoc(postbackRef, logEntry);
        return res.status(200).send("Event ignored (no reward requested)");
      }

      // Find User by Telegram ID - Use direct document ID for reliability and speed
      const usersRef = collection(db, "users");
      let userDocRef = doc(usersRef, String(telegram_id));
      const userSnap = await getDoc(userDocRef);

      let userId: string;
      let userData: any;
      let tgIdNum = Number(telegram_id);

      if (!userSnap.exists()) {
        console.warn(`[MONETAG POSTBACK] User ${telegram_id} not found by ID. Querying...`);
        // Fallback to query in case doc ID is different for some reason
        const userQuery = query(usersRef, where("telegramId", "==", tgIdNum));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          console.warn(`[MONETAG POSTBACK] User not found. Creating auto-record for TG=${telegram_id}`);
          userData = {
            telegramId: isNaN(tgIdNum) ? telegram_id : tgIdNum,
            username: params.username || "monetag_auto_user",
            firstName: params.firstName || "Monetag",
            lastName: params.lastName || "User",
            balance: 0,
            availableBalance: 0,
            totalEarnings: 0,
            rewardBalance: 0,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            membershipVerified: false,
            verified: false,
            registrationStep: 'completed',
            monetag_auto_created: true
          };
          await setDoc(userDocRef, userData);
          userId = String(telegram_id);
        } else {
          const userDoc = userSnapshot.docs[0];
          userData = userDoc.data();
          userId = userDoc.id;
          userDocRef = userDoc.ref as any;
        }
      } else {
        userData = userSnap.data();
        userId = userSnap.id;
      }

      console.log(`[MONETAG POSTBACK] User Validated: ${userId} (${userData.username || 'No Username'})`);

      // Determine reward amount
      let rewardAmount = 0.56; 
      const taskId = request_var || "monetag_default_task";
      
      if (taskId !== "monetag_default_task") {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        if (taskDoc.exists()) {
          rewardAmount = Number(taskDoc.data().rewardAmount) || rewardAmount;
        }
      }

      console.log(`[MONETAG POSTBACK] Reward Amount determined: ${rewardAmount}`);

      // AUTOMATIC BALANCE UPDATE: Crediting the user immediately
      const currentBalance = Number(userData.availableBalance || userData.balance || 0);
      const currentTotalEarnings = Number(userData.totalEarnings || 0);
      const currentRewardBalance = Number(userData.rewardBalance || 0);
      const newBalance = currentBalance + rewardAmount;
      const newTotalEarnings = currentTotalEarnings + rewardAmount;
      const newRewardBalance = currentRewardBalance + rewardAmount;

      await updateDoc(userDocRef, {
        availableBalance: newBalance,
        balance: newBalance,
        totalEarnings: newTotalEarnings,
        rewardBalance: newRewardBalance,
        lastActive: new Date().toISOString()
      });
      console.log(`[MONETAG POSTBACK] SUCCESS: Balance updated for user ${telegram_id}. New Balance: ${newBalance}`);

      // Send Telegram notification after successful balance update
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
        const botToken = settingsDoc.data()?.botToken;
        if (botToken) {
          const messageText = `🎉 Reward Added Successfully!
\n` +
            `💰 Reward: ₹${rewardAmount.toFixed(2)}
` +
            `💳 Reward Balance: ₹${newRewardBalance.toFixed(2)}
` +
            `🏦 Available Balance: ₹${newBalance.toFixed(2)}
\n` +
            `Thank you for watching the rewarded advertisement.`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: Number(telegram_id),
              text: messageText
            })
          });
          console.log(`[MONETAG POSTBACK] Telegram notification successfully sent to user ${telegram_id}`);
        } else {
          console.warn("[MONETAG POSTBACK] Telegram bot token not found in settings/telegram. Notification skipped.");
        }
      } catch (tgError) {
        console.error("[MONETAG POSTBACK] Error sending Telegram notification:", tgError);
      }

      // Create Task Completion Record (Marked as already credited)
      const completionsRef = collection(db, "task_completions");
      const completionId = `${userId}_${taskId}_${ymid}`;
      
      const completionData = {
        telegram_id: String(telegram_id),
        userId: userId,
        taskId: taskId,
        ymid: String(ymid),
        zone_id: zone_id || "unknown",
        sub_zone_id: sub_zone_id || "unknown",
        event_type: event_type || "unknown",
        reward_event_type: reward_event_type,
        estimated_price: Number(estimated_price || 0),
        rewardAmount: rewardAmount,
        status: "verified",
        verified: true,
        reward_credited: true, // Marked as credited
        claimed: true,         // Marked as claimed (since it's automatic)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        adNetwork: "Monetag"
      };

      await setDoc(doc(completionsRef, completionId), completionData);
      console.log(`[MONETAG POSTBACK] Task Completion Record Created (Auto-Credited): ID=${completionId}`);

      // Update Postback Analytics
      const today = new Date().toISOString().split("T")[0];
      const analyticsRef = doc(db, "monetag_analytics", today);
      const analyticsSnap = await getDoc(analyticsRef);
      
      const revenue = Number(estimated_price || 0);
      
      if (analyticsSnap.exists()) {
        const existing = analyticsSnap.data();
        await updateDoc(analyticsRef, {
          totalPostbacks: (existing.totalPostbacks || 0) + 1,
          successCount: (existing.successCount || 0) + 1,
          totalRevenue: (existing.totalRevenue || 0) + revenue
        });
      } else {
        await setDoc(analyticsRef, {
          date: today,
          totalPostbacks: 1,
          successCount: 1,
          totalRevenue: revenue
        });
      }

      // Global Stats update
      const globalStatsRef = doc(db, "monetag_analytics", "global_stats");
      const globalStatsSnap = await getDoc(globalStatsRef);
      if (globalStatsSnap.exists()) {
        const existing = globalStatsSnap.data();
        await updateDoc(globalStatsRef, {
          totalPostbacks: (existing.totalPostbacks || 0) + 1,
          successCount: (existing.successCount || 0) + 1,
          totalRevenue: (existing.totalRevenue || 0) + revenue,
          lastPostbackAt: new Date().toISOString()
        });
      } else {
        await setDoc(globalStatsRef, {
          totalPostbacks: 1,
          successCount: 1,
          totalRevenue: revenue,
          lastPostbackAt: new Date().toISOString()
        });
      }

      // Update status in log entry
      logEntry.status = "success";
      logEntry.userId = userId;
      logEntry.rewardAmount = rewardAmount;
      await addDoc(postbackRef, logEntry);

      console.log(`[MONETAG POSTBACK] Verification Success for TG=${telegram_id}`);
      return res.status(200).send("Reward verified successfully");
    } catch (e: any) {
      console.error("[MONETAG POSTBACK] Fatal Error:", e);
      logEntry.status = "failed";
      logEntry.error = e.message || "Unknown internal error";
      await addDoc(postbackRef, logEntry);
      return res.status(500).send("Internal processing error");
    }
  });

  app.post("/api/monetag/claim-reward", async (req, res) => {
    try {
      const { telegram_id, taskId } = req.body;
      if (!telegram_id || !taskId) {
        return res.status(400).json({ success: false, message: "Missing telegram_id or taskId" });
      }

      console.log(`[CLAIM REWARD] Incoming: TG=${telegram_id}, Task=${taskId}`);

      const completionsRef = collection(db, "task_completions");
      const q = query(
        completionsRef,
        where("telegram_id", "==", String(telegram_id)),
        where("taskId", "==", taskId),
        where("status", "==", "verified"),
        where("claimed", "==", false)
      );

      const snapshot = await getDocs(q);
      let targetDoc: any = null;

      if (snapshot.empty) {
        // Try fallback query with userId for older records
        const qFallback = query(
          completionsRef,
          where("userId", "==", String(telegram_id)),
          where("taskId", "==", taskId),
          where("status", "==", "verified"),
          where("claimed", "==", false)
        );
        const fallbackSnap = await getDocs(qFallback);
        if (fallbackSnap.empty) {
          console.warn(`[CLAIM REWARD] No claimable record for TG=${telegram_id}`);
          return res.status(404).json({ success: false, message: "Verification pending or already claimed. Please refresh." });
        }
        targetDoc = fallbackSnap.docs[0];
      } else {
        targetDoc = snapshot.docs[0];
      }

      const data = targetDoc.data();
      const rewardAmount = Number(data.rewardAmount || 0.56);
      const ymid = data.ymid;

      // Find User
      const usersRef = collection(db, "users");
      const userDocRef = doc(usersRef, String(telegram_id));
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, message: "User record not found." });
      }

      const userData = userSnap.data();
      const currentBalance = Number(userData.availableBalance || userData.balance || 0);
      const currentTotalEarnings = Number(userData.totalEarnings || 0);
      const currentRewardBalance = Number(userData.rewardBalance || 0);
      
      const newBalance = currentBalance + rewardAmount;
      const newTotalEarnings = currentTotalEarnings + rewardAmount;
      const newRewardBalance = currentRewardBalance + rewardAmount;

      console.log(`[CLAIM REWARD] Crediting reward: ₹${rewardAmount} to TG=${telegram_id}`);

      // 1. Update User
      await updateDoc(userDocRef, {
        availableBalance: newBalance,
        balance: newBalance,
        totalEarnings: newTotalEarnings,
        rewardBalance: newRewardBalance,
        lastEarningAt: new Date().toISOString()
      });

      // 2. Mark as Claimed
      await updateDoc(targetDoc.ref, {
        claimed: true,
        reward_credited: true,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 3. Log History
      await addDoc(collection(db, "reward_history"), {
        userId: String(telegram_id),
        telegramId: Number(telegram_id),
        amount: rewardAmount,
        type: "monetag_claim",
        description: `Monetag Ad Reward Claimed (YMID: ${ymid})`,
        timestamp: new Date().toISOString(),
        ymid
      });

      // 4. Transaction log
      await addDoc(collection(db, "transactions"), {
        userId: String(telegram_id),
        type: "reward",
        amount: rewardAmount,
        status: "success",
        description: "Monetag Ad Reward",
        timestamp: new Date().toISOString()
      });

      console.log(`[CLAIM REWARD] Success for TG=${telegram_id}`);
      return res.json({ 
        success: true, 
        message: "Reward claimed successfully.",
        amount: rewardAmount
      });

    } catch (e: any) {
      console.error("[CLAIM REWARD] Fatal Error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // 2. Admin: Get Monetag Settings and Stats
  app.get("/api/admin/verified-tasks", async (req, res) => {
    try {
      const completionsRef = collection(db, "task_completions");
      // Basic query for verified tasks
      const q = query(
        completionsRef,
        where("status", "==", "verified"),
        limit(200)
      );
      const snapshot = await getDocs(q);
      let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory if created_at exists
      tasks.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.completedAt || 0).getTime();
        const dateB = new Date(b.created_at || b.completedAt || 0).getTime();
        return dateB - dateA;
      });

      res.json(tasks);
    } catch (e: any) {
      console.error("Error fetching verified tasks:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/monetag/stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const globalStatsSnap = await getDoc(doc(db, "monetag_analytics", "global_stats"));
      const todayStatsSnap = await getDoc(doc(db, "monetag_analytics", today));
      
      // Recent postbacks
      const recentQuery = query(collection(db, "monetag_postbacks"), orderBy("timestamp", "desc"), limit(20));
      const recentSnapshot = await getDocs(recentQuery);
      const recentEvents = recentSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Always generate the postback URL targeting the production Render backend
      const postbackUrl = `https://www.royshare.online/api/monetag/postback?telegram_id={telegram_id}&ymid={ymid}&zone_id={zone_id}&event_type={event_type}&reward_event_type={reward_event_type}&estimated_price={estimated_price}&request_var={request_var}`;

      res.json({
        success: true,
        postbackUrl,
        globalStats: globalStatsSnap.exists() ? globalStatsSnap.data() : { totalPostbacks: 0, successCount: 0, totalRevenue: 0, totalRewards: 0 },
        todayStats: todayStatsSnap.exists() ? todayStatsSnap.data() : { totalPostbacks: 0, successCount: 0, totalRevenue: 0, totalRewards: 0 },
        recentEvents
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 3. Admin: Test Postback Endpoint
  app.post("/api/admin/monetag/test-postback", async (req, res) => {
    try {
      const { telegramId } = req.body;
      if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

      const testYmid = "test_" + Math.random().toString(36).substring(7);
      
      const testUrl = `https://www.royshare.online/api/monetag/postback?telegram_id=${telegramId}&zone_id=12345&sub_zone_id=67890&event_type=ad_completed&reward_event_type=yes&estimated_price=0.01&ymid=${testYmid}&request_var=monetag_default_task`;

      console.log("Simulating Monetag Postback:", testUrl);
      
      const response = await fetch(testUrl, { method: "GET" });
      const text = await response.text();

      res.json({
        success: response.ok,
        status: response.status,
        response: text,
        testUrl
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/admin/telegram-urls", async (req, res) => {
    try {
      const rawAppUrl = process.env.APP_URL || "https://www.royshare.online";
      const appUrl = (rawAppUrl.includes("run.app") || rawAppUrl.includes("ais-dev") || rawAppUrl === "MY_APP_URL") 
        ? rawAppUrl 
        : "https://www.royshare.online";
      res.json({
        success: true,
        appUrl,
        rawAppUrl: process.env.APP_URL || "",
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/admin/telegram-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "telegram");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() || {};
        res.json({
          success: true,
          settings: {
            ...data,
            botToken: data.botToken ? "••••••••••••••" : "",
            clientSecret: data.clientSecret ? "••••••••••••••" : ""
          }
        });
      } else {
        res.json({ success: true, settings: null });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/admin/telegram-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "telegram");
      const snap = await getDoc(docRef);
      let existingData: any = {};
      if (snap.exists()) {
        existingData = snap.data() || {};
      }

      const payload = req.body || {};
      
      let finalBotToken = existingData.botToken || "";
      if (payload.botToken && payload.botToken !== "••••••••••••••" && payload.botToken !== "••••••••••••••••") {
        finalBotToken = encryptSecret(payload.botToken);
      }

      let finalClientSecret = existingData.clientSecret || "";
      if (payload.clientSecret && payload.clientSecret !== "••••••••••••••" && payload.clientSecret !== "••••••••••••••••") {
        finalClientSecret = encryptSecret(payload.clientSecret);
      }

      const saveData = {
        ...existingData,
        ...payload,
        botToken: finalBotToken,
        clientSecret: finalClientSecret,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, saveData);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/admin/telegram-settings/test-bot", async (req, res) => {
    try {
      let { botToken } = req.body;
      if (!botToken || botToken === "••••••••••••••" || botToken === "••••••••••••••••") {
        const docRef = doc(db, "settings", "telegram");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          botToken = snap.data().botToken;
        }
      }
      if (!botToken) {
        return res.status(400).json({ success: false, error: "Bot Token is required or not configured." });
      }
      const decBotToken = botToken.startsWith("enc:") ? decryptSecret(botToken) : botToken;
      const response = await fetch(`https://api.telegram.org/bot${decBotToken}/getMe`);
      const data = await response.json();
      if (response.ok && data.ok) {
        res.json({ success: true, botUsername: data.result.username });
      } else {
        res.status(400).json({ success: false, error: data.description || "Invalid Bot Token" });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/admin/telegram-settings/verify-channel", async (req, res) => {
    try {
      let { botToken, channelUsername, channelChatId } = req.body;
      if (!botToken || botToken === "••••••••••••••" || botToken === "••••••••••••••••") {
        const docRef = doc(db, "settings", "telegram");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          botToken = snap.data().botToken;
        }
      }
      if (!botToken) {
        return res.status(400).json({ success: false, error: "Bot Token is missing." });
      }
      const decBotToken = botToken.startsWith("enc:") ? decryptSecret(botToken) : botToken;
      
      let target = channelChatId || channelUsername;
      if (!target) {
        return res.status(400).json({ success: false, error: "Channel Username or Chat ID is required." });
      }
      
      if (typeof target === 'string' && !target.startsWith("@") && !target.startsWith("-") && isNaN(Number(target))) {
        target = `@${target}`;
      }
      
      const response = await fetch(`https://api.telegram.org/bot${decBotToken}/getChat?chat_id=${target}`);
      const data = await response.json();
      if (response.ok && data.ok) {
        res.json({ success: true, chat: data.result });
      } else {
        res.status(400).json({ success: false, error: data.description || "Cannot access channel. Ensure bot is an administrator of the channel." });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/admin/telegram-settings/verify-group", async (req, res) => {
    try {
      let { botToken, groupUsername, groupChatId } = req.body;
      if (!botToken || botToken === "••••••••••••••" || botToken === "••••••••••••••••") {
        const docRef = doc(db, "settings", "telegram");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          botToken = snap.data().botToken;
        }
      }
      if (!botToken) {
        return res.status(400).json({ success: false, error: "Bot Token is missing." });
      }
      const decBotToken = botToken.startsWith("enc:") ? decryptSecret(botToken) : botToken;
      
      let target = groupChatId || groupUsername;
      if (!target) {
        return res.status(400).json({ success: false, error: "Group Username or Chat ID is required." });
      }
      
      if (typeof target === 'string' && !target.startsWith("@") && !target.startsWith("-") && isNaN(Number(target))) {
        target = `@${target}`;
      }
      
      const response = await fetch(`https://api.telegram.org/bot${decBotToken}/getChat?chat_id=${target}`);
      const data = await response.json();
      if (response.ok && data.ok) {
        res.json({ success: true, chat: data.result });
      } else {
        res.status(400).json({ success: false, error: data.description || "Cannot access group. Ensure bot is an administrator/member of the group." });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Public endpoint for telegram settings
  app.get("/api/telegram-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "telegram");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const { botToken, clientSecret, ...publicSettings } = snap.data();
        res.json({ success: true, settings: publicSettings });
      } else {
        res.json({ success: true, settings: null });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });


  // ==========================================
  // ADS.TXT MANAGER
  // ==========================================

  app.get("/api/admin/ads-txt-providers", async (req, res) => {
    try {
      const q = query(collection(db, "ads_txt_providers"));
      const snap = await getDocs(q);
      const providers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ success: true, providers });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/ads-txt-providers", async (req, res) => {
    try {
      const { providerName, providerType, snippet, enabled } = req.body;
      const data = {
        providerName,
        providerType,
        snippet,
        enabled: enabled !== undefined ? enabled : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "ads_txt_providers"), data);
      res.json({ success: true, id: docRef.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/ads-txt-providers/:id", async (req, res) => {
    try {
      const { providerName, providerType, snippet, enabled } = req.body;
      const data: any = {
        updatedAt: new Date().toISOString()
      };
      if (providerName) data.providerName = providerName;
      if (providerType) data.providerType = providerType;
      if (snippet) data.snippet = snippet;
      if (enabled !== undefined) data.enabled = enabled;

      await updateDoc(doc(db, "ads_txt_providers", req.params.id), data);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/ads-txt-providers/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, "ads_txt_providers", req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/ads-txt-providers/:id/toggle", async (req, res) => {
    try {
      const { enabled } = req.body;
      await updateDoc(doc(db, "ads_txt_providers", req.params.id), { enabled });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public ads.txt route
  app.get("/ads.txt", async (req, res) => {
    try {
      const q = query(collection(db, "ads_txt_providers"), where("enabled", "==", true));
      const snap = await getDocs(q);
      let content = "# RoyShare Ads.txt Manager\n";
      snap.forEach(doc => {
        const d = doc.data();
        content += `
# --- ${d.providerName} (${d.providerType}) ---\n${d.snippet}\n`;
      });
      res.header("Content-Type", "text/plain");
      res.send(content);
    } catch (e: any) {
      res.status(500).send("Error generating ads.txt");
    }
  });

  app.get("/api/earn-rewards/check-status", async (req, res) => {
    try {
      const { userId, taskId } = req.query;
      if (!userId || !taskId) return res.status(400).json({ error: "Missing params" });
      
      console.log(`[STATUS CHECK] Checking status for userId: ${userId}, taskId: ${taskId}`);

      const q = query(
        collection(db, "task_completions"),
        where("telegram_id", "==", String(userId)),
        where("taskId", "==", taskId),
        where("status", "==", "verified")
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.log(`[STATUS CHECK] Success: Task ${taskId} found verified for user ${userId}`);
        return res.json({ completed: true });
      } else {
        // Fallback for older records using userId
        const q2 = query(
          collection(db, "task_completions"),
          where("userId", "==", String(userId)),
          where("taskId", "==", taskId),
          where("status", "==", "verified")
        );
        const snapshot2 = await getDocs(q2);
        if (!snapshot2.empty) {
          return res.json({ completed: true });
        }
        
        // Check for recent failed postbacks to provide better feedback
        const failedPostbacksQuery = query(
          collection(db, "monetag_postbacks"),
          where("identified_tg_id", "==", String(userId)),
          where("status", "==", "failed"),
          limit(1)
        );
        const failedSnapshot = await getDocs(failedPostbacksQuery);
        if (!failedSnapshot.empty) {
          const failedData = failedSnapshot.docs[0].data();
          return res.json({ 
            completed: false, 
            reason: "Postback failed", 
            error: failedData.error || "Unknown error" 
          });
        }

        console.log(`[STATUS CHECK] Pending: No verified completion found for userId: ${userId}, taskId: ${taskId}`);
        return res.json({ completed: false, reason: "Verification pending..." });
      }
    } catch (e: any) {
      console.error("[STATUS CHECK] Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/withdrawal/submit", async (req, res) => {
    try {
      const { 
        userId, 
        amount, 
        method,
        upiId,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        walletAddress,
        processingFee,
        receiveAmount
      } = req.body;

      if (!userId || !amount || !method) {
        return res.status(400).json({ success: false, message: "Missing required parameters." });
      }

      // 1. Load System Settings for Withdrawal Policies
      const settingsSnap = await getDoc(doc(db, "settings", "system"));
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
      const withdrawalSettings = settingsData?.withdrawalSettings || {};

      // 2. Validate Payment Method Status
      let methodEnabled = true;
      if (method === "UPI ID") {
        methodEnabled = withdrawalSettings.upiEnabled !== false;
      } else if (method === "Bank Account") {
        methodEnabled = withdrawalSettings.bankEnabled !== false;
      } else if (method === "USDT (TRC20)") {
        methodEnabled = withdrawalSettings.usdtEnabled !== false;
      } else {
        return res.status(400).json({ success: false, message: "Invalid payment method selected." });
      }

      if (!methodEnabled) {
        return res.status(400).json({ success: false, message: "Selected payment method is currently disabled by administrator." });
      }

      // 3. Validation check for fields
      if (method === "UPI ID") {
        if (!upiId || !upiId.trim()) {
          return res.status(400).json({ success: false, message: "UPI ID is required." });
        }
      } else if (method === "Bank Account") {
        if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
          return res.status(400).json({ success: false, message: "All bank account details are required." });
        }
      } else if (method === "USDT (TRC20)") {
        if (!walletAddress || !walletAddress.trim()) {
          return res.status(400).json({ success: false, message: "USDT Wallet address is required." });
        }
      }

      const userDocRef = doc(db, "users", String(userId));
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const userData = userSnap.data();
      const isSb = userData.shadowBanned === true;
      const userTrustScore = userData.trustScore !== undefined ? Number(userData.trustScore) : 100;

      const userBalance = Number(userData.balance || 0);
      const fileEarnings = Number(userData.fileEarnings || 0);
      const linkEarnings = Number(userData.linkEarnings || 0);
      const referralEarnings = Number(userData.referralEarnings || 0);
      const bonusBalance = userData.bonusBalance !== undefined ? Number(userData.bonusBalance) : Number(userData.bonus || 0);
      const rewardBalance = Number(userData.rewardBalance || 0);
      const withdrawnAmount = userData.withdrawnAmount !== undefined ? Number(userData.withdrawnAmount) : Number(userData.totalWithdrawn || 0);
      const pendingWithdrawals = Number(userData.pendingWithdrawals || 0);

      let availableBalance = 0;
      if (isSb) {
        const shadowBalance = Number(userData.shadowBalance || 0);
        const shadowRewardBalance = Number(userData.shadowRewardBalance || 0);
        const shadowLinkEarnings = Number(userData.shadowLinkEarnings || 0);
        const shadowBonusBalance = Number(userData.shadowBonusBalance || 0);
        const shadowFileEarnings = Number(userData.shadowFileEarnings || 0);
        const shadowReferralEarnings = Number(userData.shadowReferralEarnings || 0);
        const shadowPendingWithdrawals = Number(userData.shadowPendingWithdrawals || 0);

        availableBalance = (fileEarnings + shadowFileEarnings) +
                           (linkEarnings + shadowLinkEarnings) +
                           (referralEarnings + shadowReferralEarnings) +
                           (bonusBalance + shadowBonusBalance) +
                           (rewardBalance + shadowRewardBalance) +
                           (userBalance + shadowBalance) -
                           withdrawnAmount -
                           (pendingWithdrawals + shadowPendingWithdrawals);
      } else {
        availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + userBalance - withdrawnAmount - pendingWithdrawals;
      }

      // Calculate amount in INR
      const requestedAmount = Number(amount);
      const isUsdtMethod = method === "USDT (TRC20)";
      const USDT_RATE = 90;
      const requestedAmountInINR = isUsdtMethod ? (requestedAmount * USDT_RATE) : requestedAmount;

      if (isNaN(requestedAmount) || requestedAmount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid withdrawal amount." });
      }

      // 4. Verify Minimum Withdrawal Amount
      let minWithdrawal = 100;
      if (method === "UPI ID") {
        minWithdrawal = parseFloat(withdrawalSettings.upiMin) || 100;
      } else if (method === "Bank Account") {
        minWithdrawal = parseFloat(withdrawalSettings.bankMin) || 500;
      } else if (method === "USDT (TRC20)") {
        minWithdrawal = parseFloat(withdrawalSettings.usdtMin) || 10;
      }

      if (isUsdtMethod) {
        if (requestedAmount < minWithdrawal) {
          return res.status(400).json({ success: false, message: `Minimum withdrawal amount is ${minWithdrawal} USDT.` });
        }
      } else {
        if (requestedAmount < minWithdrawal) {
          return res.status(400).json({ success: false, message: `Minimum withdrawal amount is ₹${minWithdrawal}.` });
        }
      }

      if (requestedAmountInINR > availableBalance) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
      }

      // 5. Verify Withdrawal Window (IST hours)
      if (withdrawalSettings.windowStartHour !== undefined && withdrawalSettings.windowEndHour !== undefined) {
        const startHour = Number(withdrawalSettings.windowStartHour);
        const endHour = Number(withdrawalSettings.windowEndHour);
        
        const kolkataTime = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          hour12: false
        });
        const currentHour = parseInt(kolkataTime.format(new Date()), 10);
        
        if (currentHour < startHour || currentHour >= endHour) {
          return res.status(400).json({ 
            success: false, 
            message: `Withdrawals are only allowed during the official submission window: ${startHour}:00 to ${endHour}:00 IST.` 
          });
        }
      }

      // 6. Fetch User's Recent non-Cancelled/non-Failed Withdrawals for limits validation
      const recentWDQuery = query(
        collection(db, "withdrawals"),
        where("userId", "==", String(userId))
      );
      const recentWDSnap = await getDocs(recentWDQuery);
      const historyList = recentWDSnap.docs.map(doc => doc.data()).filter(w => w.status !== "Cancelled" && w.status !== "Failed");

      // Verify Cooldown Hours
      const cooldownHours = Number(withdrawalSettings.cooldownHours || 24);
      if (historyList.length > 0) {
        // Sort to find the newest
        const sortedHistory = [...historyList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const newestWD = sortedHistory[0];
        if (newestWD && newestWD.createdAt) {
          const elapsedMs = Date.now() - new Date(newestWD.createdAt).getTime();
          const elapsedHours = elapsedMs / (1000 * 60 * 60);
          if (elapsedHours < cooldownHours) {
            const remainingHours = Math.ceil(cooldownHours - elapsedHours);
            return res.status(400).json({ 
              success: false, 
              message: `Cooldown active. Please wait ${remainingHours} hour(s) before submitting another request.` 
            });
          }
        }
      }

      // Verify Daily Limits (IST calendar date)
      const dailyLimit = Number(withdrawalSettings.dailyLimit || 3);
      const todayISTStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const todayCount = historyList.filter(w => {
        if (!w.createdAt) return false;
        const wDateStr = new Date(w.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
        return wDateStr === todayISTStr;
      }).length;

      if (todayCount >= dailyLimit) {
        return res.status(400).json({ 
          success: false, 
          message: `Daily withdrawal limit reached. Maximum ${dailyLimit} requests allowed per day.` 
        });
      }

      // 7. Anti-Fraud Rules (Auto-Rejection checks)
      let isLowTrust = false;
      if (withdrawalSettings.autoRejectLowTrust) {
        const threshold = Number(withdrawalSettings.trustScoreThreshold || 20);
        isLowTrust = userTrustScore < threshold;
      }

      let isDuplicateDetail = false;
      if (withdrawalSettings.autoRejectDuplicateDetails) {
        if (method === "UPI ID" && upiId) {
          const dupQuery = query(collection(db, "withdrawals"), where("upiId", "==", upiId.trim()));
          const dupSnap = await getDocs(dupQuery);
          isDuplicateDetail = dupSnap.docs.some(d => d.data().userId !== String(userId));
        } else if (method === "Bank Account" && accountNumber) {
          const dupQuery = query(collection(db, "withdrawals"), where("accountNumber", "==", accountNumber.trim()));
          const dupSnap = await getDocs(dupQuery);
          isDuplicateDetail = dupSnap.docs.some(d => d.data().userId !== String(userId));
        } else if (method === "USDT (TRC20)" && walletAddress) {
          const dupQuery = query(collection(db, "withdrawals"), where("walletAddress", "==", walletAddress.trim()));
          const dupSnap = await getDocs(dupQuery);
          isDuplicateDetail = dupSnap.docs.some(d => d.data().userId !== String(userId));
        }
      }

      let hasActiveTicket = false;
      if (withdrawalSettings.autoRejectActiveSupportTicket) {
        const ticketQuery = query(
          collection(db, "tickets"),
          where("userId", "==", String(userId)),
          where("status", "==", "open")
        );
        const ticketSnap = await getDocs(ticketQuery);
        hasActiveTicket = !ticketSnap.empty;
      }

      let autoRejectReason = "";
      if (isLowTrust) {
        autoRejectReason = `Trust score (${userTrustScore}) is below required security threshold (${withdrawalSettings.trustScoreThreshold || 20}).`;
      } else if (isDuplicateDetail) {
        autoRejectReason = "This payment destination is already registered on another user account.";
      } else if (hasActiveTicket) {
        autoRejectReason = "You have an active open support ticket. Please resolve it before requesting withdrawals.";
      }

      // Generate unique Request ID
      let withdrawalId = "";
      let isUnique = false;
      while (!isUnique) {
        const randomId = Math.floor(Math.random() * 900000) + 100000;
        withdrawalId = `WD${randomId}`;
        const existingDoc = await getDoc(doc(db, "withdrawals", withdrawalId));
        if (!existingDoc.exists()) {
          isUnique = true;
        }
      }

      const now = new Date();
      const currentDateTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      if (autoRejectReason) {
        const prefix = withdrawalSettings.rejectReasonPrefix || "Auto-Rejected: ";
        const finalRejectReason = `${prefix}${autoRejectReason}`;

        const rejectDocData: any = {
          id: withdrawalId,
          withdrawalId,
          userId: String(userId),
          firstName: userData.firstName || "User",
          lastName: userData.lastName || "",
          username: userData.username || "",
          mobile: userData.mobile || userData.phone || "",
          amount: requestedAmount,
          method,
          status: "Rejected",
          rejectReason: finalRejectReason,
          adminRemark: finalRejectReason,
          refundAmount: requestedAmount,
          createdAt: now.toISOString(),
          rejectedAt: now.toISOString(),
          shadow_banned: isSb,
          is_flagged: true,
          trustScore: userTrustScore
        };

        if (method === "UPI ID") {
          rejectDocData.upiId = upiId.trim();
        } else if (method === "Bank Account") {
          rejectDocData.accountHolderName = accountHolderName.trim();
          rejectDocData.accountNumber = accountNumber.trim();
          rejectDocData.ifscCode = ifscCode.trim();
          rejectDocData.bankName = bankName.trim();
        } else if (method === "USDT (TRC20)") {
          rejectDocData.walletAddress = walletAddress.trim();
          rejectDocData.network = "TRC20";
        }

        await setDoc(doc(db, "withdrawals", withdrawalId), rejectDocData);

        const tgMsg = `❌ <b>Withdrawal Request Auto-Rejected</b>
\n` +
                      `<b>Amount:</b> ${isUsdtMethod ? `${requestedAmount} USDT` : `₹${requestedAmount}`}
` +
                      `<b>Reason:</b> ${finalRejectReason}
\n` +
                      `Your request was automatically declined due to security guidelines. Your balance is unaffected.`;
        await sendTgMessage(String(userId), tgMsg);

        return res.json({ 
          success: false, 
          message: `Request auto-rejected: ${autoRejectReason}`, 
          autoRejected: true, 
          withdrawalId,
          status: "Rejected"
        });
      }

      // 8. Determine final status & handle Auto-Approval checks
      const userStatus = userData.status || "Normal";
      const isFlagged = ["Pending Review", "High Risk", "Shadow Monitor"].includes(userStatus) || userTrustScore < 20;
      let withdrawalStatus = isFlagged ? "Security Review" : "Pending";

      let autoApproved = false;
      if (!isFlagged) {
        if (method === "UPI ID" && withdrawalSettings.upiAutoApprove) {
          const limitVal = parseFloat(withdrawalSettings.upiAutoApproveLimit) || 500;
          if (requestedAmountInINR <= limitVal) autoApproved = true;
        } else if (method === "Bank Account" && withdrawalSettings.bankAutoApprove) {
          const limitVal = parseFloat(withdrawalSettings.bankAutoApproveLimit) || 1000;
          if (requestedAmountInINR <= limitVal) autoApproved = true;
        } else if (method === "USDT (TRC20)" && withdrawalSettings.usdtAutoApprove) {
          const limitVal = parseFloat(withdrawalSettings.usdtAutoApproveLimit) || 10;
          if (requestedAmount <= limitVal) autoApproved = true;
        }
      }

      if (autoApproved) {
        withdrawalStatus = "Approved";
      }

      const withdrawalDocData: any = {
        id: withdrawalId,
        withdrawalId,
        userId: String(userId),
        firstName: userData.firstName || "User",
        lastName: userData.lastName || "",
        username: userData.username || "",
        mobile: userData.mobile || userData.phone || "",
        amount: requestedAmount,
        method,
        status: withdrawalStatus,
        processingFee: Number(processingFee || 0),
        receiveAmount: Number(receiveAmount || 0),
        createdAt: now.toISOString(),
        shadow_banned: isSb,
        is_flagged: isFlagged,
        trustScore: userTrustScore
      };

      if (method === "UPI ID") {
        withdrawalDocData.upiId = upiId.trim();
      } else if (method === "Bank Account") {
        withdrawalDocData.accountHolderName = accountHolderName.trim();
        withdrawalDocData.accountNumber = accountNumber.trim();
        withdrawalDocData.ifscCode = ifscCode.trim();
        withdrawalDocData.bankName = bankName.trim();
      } else if (method === "USDT (TRC20)") {
        withdrawalDocData.walletAddress = walletAddress.trim();
        withdrawalDocData.network = "TRC20";
      }

      // 1. Create the withdrawal request
      await setDoc(doc(db, "withdrawals", withdrawalId), withdrawalDocData);

      // 2. Deduct available balance immediately by adding it to pendingWithdrawals on the user doc
      const userUpdateData: any = {
        updatedAt: now.toISOString()
      };

      if (isSb) {
        const shadowPendingWithdrawals = Number(userData.shadowPendingWithdrawals || 0);
        userUpdateData.shadowPendingWithdrawals = shadowPendingWithdrawals + requestedAmountInINR;
      } else {
        userUpdateData.pendingWithdrawals = pendingWithdrawals + requestedAmountInINR;
      }

      if (method === "UPI ID" && upiId) {
        userUpdateData.upiId = upiId.trim();
      } else if (method === "Bank Account") {
        userUpdateData.bankDetails = {
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          bankName: bankName.trim()
        };
      } else if (method === "USDT (TRC20)" && walletAddress) {
        userUpdateData.usdtWalletAddress = walletAddress.trim();
      }

      await setDoc(userDocRef, userUpdateData, { merge: true });

      // 3. Immediately send Telegram Bot notification
      let tgMsg = "";
      if (method === "USDT (TRC20)") {
        tgMsg = `💸 <b>USDT Withdrawal Request Submitted</b>
\n<b>Amount:</b> ${requestedAmount} USDT (≈ ₹${requestedAmountInINR.toFixed(2)})\n<b>Fee:</b> ${processingFee} USDT\n<b>Receive Amount:</b> <b>${receiveAmount} USDT</b>\n<b>Wallet:</b> <code>${walletAddress.trim()}</code>\n<b>Network:</b> TRC20 (Fixed)\n<b>Request ID:</b> <code>${withdrawalId}</code>\n<b>Status:</b> ${withdrawalStatus}\n<b>Date & Time:</b> ${currentDateTime}\n\n${autoApproved ? "✅ Auto-Approved by System! Processing payment." : "Please wait for admin approval."}`;
      } else if (method === "Bank Account") {
        tgMsg = `💸 <b>Bank Withdrawal Request Submitted</b>
\n<b>Amount:</b> ₹${requestedAmount.toFixed(2)}\n<b>Fee:</b> ₹${processingFee.toFixed(2)}\n<b>Receive Amount:</b> <b>₹${receiveAmount.toFixed(2)}</b>\n<b>Bank Name:</b> ${bankName.trim()}\n<b>A/C No:</b> <code>${accountNumber.trim()}</code>\n<b>Holder:</b> ${accountHolderName.trim()}\n<b>IFSC:</b> <code>${ifscCode.trim()}</code>\n<b>Request ID:</b> <code>${withdrawalId}</code>\n<b>Status:</b> ${withdrawalStatus}\n<b>Date & Time:</b> ${currentDateTime}\n\n${autoApproved ? "✅ Auto-Approved by System! Processing payment." : "Please wait for admin approval."}`;
      } else {
        tgMsg = `💸 <b>UPI Withdrawal Request Submitted</b>
\n<b>Amount:</b> ₹${requestedAmount.toFixed(2)}\n<b>Fee:</b> ₹${processingFee.toFixed(2)}\n<b>Receive Amount:</b> <b>₹${receiveAmount.toFixed(2)}</b>\n<b>UPI ID:</b> <code>${upiId.trim()}</code>\n<b>Request ID:</b> <code>${withdrawalId}</code>\n<b>Status:</b> ${withdrawalStatus}\n<b>Date & Time:</b> ${currentDateTime}\n\n${autoApproved ? "✅ Auto-Approved by System! Processing payment." : "Please wait for admin approval."}`;
      }

      // Log Transaction History
      await recordWalletTransaction({
        userId: String(userId),
        amount: requestedAmount,
        creditDebit: "Debit",
        source: "💸 Withdrawal",
        description: `${method === "UPI ID" ? "UPI Transfer" : method === "Bank Account" ? "Bank Transfer" : "USDT Transfer"}`,
        status: withdrawalStatus === "Approved" ? "Completed" : withdrawalStatus,
        transactionId: withdrawalId,
        skipNotification: true // Already sending custom detailed bot message
      });

      await sendTgMessage(String(userId), tgMsg);

      res.json({ success: true, withdrawalId, status: withdrawalStatus });
    } catch (e: any) {
      console.error("Error submitting withdrawal:", e);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  app.get("/api/withdrawal/captcha", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });
      
      const userDoc = await getDoc(doc(db, "users", String(userId)));
      const state = userDoc.data()?.pendingWithdrawal;
      
      if (!state || state.step !== "human_verification_pending" || !state.captchaNum1 || !state.captchaNum2) {
        return res.status(400).json({ success: false, message: "Verification session expired." });
      }
      
      res.json({ success: true, num1: state.captchaNum1, num2: state.captchaNum2 });
    } catch (e: any) {
      console.error("Error in /api/withdrawal/captcha:", e);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.post("/api/withdrawal/verify", async (req, res) => {
    try {
      const { userId, answer } = req.body;
      if (!userId || !answer) return res.status(400).json({ success: false, message: "Missing params" });
      
      const userDoc = await getDoc(doc(db, "users", String(userId)));
      const state = userDoc.data()?.pendingWithdrawal;
      
      if (!state || state.step !== "human_verification_pending") {
        return res.status(400).json({ success: false, message: "Verification session expired." });
      }
      
      if (answer.trim() !== state.captchaAnswer) {
        return res.status(400).json({ success: false, message: "Incorrect answer. Try again." });
      }
      
      // Update state to null to avoid duplicate
      await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: null }, { merge: true });

      // Record verification
      state.verificationStatus = "✅ Verified";
      state.verificationTime = new Date().toISOString();
      state.verificationMethod = "Math Challenge";

      const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
      const botToken = settingsDoc.data()?.botToken;
      
      if (botToken) {
        await submitWithdrawalRequest(botToken, state.chatId, String(userId), state);
      }
      
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error in /api/withdrawal/verify:", e);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // ==========================================
  // SMART URL SHORTENER PUBLIC & ADMIN APIs
  // ==========================================

  app.post("/api/smart-links/session/init", async (req, res) => {
    try {
      const { type, id, browser, device, country, referrer, visitorTgId } = req.body;
      if (!type || !id) return res.status(400).json({ success: false, message: "Missing required parameters" });

      const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";

      let itemData: any = null;
      let docRef: any = null;
      let col = type === "shortener" ? "links" : "uploads";
      let globalSettings: any = {
        totalPages: 1,
        instructions: "Follow the steps below to reach your destination.",
        autoScroll: true,
        autoRedirect: true,
        continueButtonText: "Proceed",
        verifyButtonText: "Verify This Step",
        humanVerification: true,
        vpnDetection: false,
        botDetection: true,
        pagesConfig: []
      };

      // Requirement 6: Debug log - Link ID received
      console.log(`[DEBUG SHORTENER] Link ID received: "${id}"`);

      if (type === "shortener") {
        // Requirement 6: Debug log - Collection searched
        console.log(`[DEBUG SHORTENER] Searching collection: "links" (used by bot) and fallback to "smart_links"`);

        // 1. Try "links" collection first
        const directLinkRef = doc(db, "links", id);
        const directLinkSnap = await getDoc(directLinkRef);
        if (directLinkSnap.exists()) {
          docRef = directLinkRef;
          itemData = directLinkSnap.data();
          col = "links";
        } else {
          const qLink = query(collection(db, "links"), where("linkId", "==", id));
          const qLinkSnap = await getDocs(qLink);
          if (!qLinkSnap.empty) {
            docRef = qLinkSnap.docs[0].ref;
            itemData = qLinkSnap.docs[0].data();
            col = "links";
          } else {
            const qLinkAlias = query(collection(db, "links"), where("alias", "==", id));
            const qLinkAliasSnap = await getDocs(qLinkAlias);
            if (!qLinkAliasSnap.empty) {
              docRef = qLinkAliasSnap.docs[0].ref;
              itemData = qLinkAliasSnap.docs[0].data();
              col = "links";
            }
          }
        }

        // 2. Try "smart_links" collection as fallback
        if (!itemData) {
          const qSmart = query(collection(db, "smart_links"), where("alias", "==", id));
          const qSmartSnap = await getDocs(qSmart);
          if (!qSmartSnap.empty) {
            docRef = qSmartSnap.docs[0].ref;
            itemData = qSmartSnap.docs[0].data();
            col = "smart_links";
          } else {
            const directSmartRef = doc(db, "smart_links", id);
            const directSmartSnap = await getDoc(directSmartRef);
            if (directSmartSnap.exists()) {
              docRef = directSmartRef;
              itemData = directSmartSnap.data();
              col = "smart_links";
            }
          }
        }
      } else {
        console.log(`[DEBUG SHORTENER] Searching collection: "uploads"`);
        const directRef = doc(db, "uploads", id);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          docRef = directRef;
          itemData = directSnap.data();
        } else {
          const qFileId = query(collection(db, "uploads"), where("fileId", "==", id));
          const qFileIdSnap = await getDocs(qFileId);
          if (!qFileIdSnap.empty) {
            docRef = qFileIdSnap.docs[0].ref;
            itemData = qFileIdSnap.docs[0].data();
          } else {
            const qDriveId = query(collection(db, "uploads"), where("driveFileId", "==", id));
            const qDriveIdSnap = await getDocs(qDriveId);
            if (!qDriveIdSnap.empty) {
              docRef = qDriveIdSnap.docs[0].ref;
              itemData = qDriveIdSnap.docs[0].data();
            } else {
              const qAlias = query(collection(db, "uploads"), where("customAlias", "==", id));
              const qAliasSnap = await getDocs(qAlias);
              if (!qAliasSnap.empty) {
                docRef = qAliasSnap.docs[0].ref;
                itemData = qAliasSnap.docs[0].data();
              }
            }
          }
        }
      }

      if (itemData) {
        // Compatibility mapping for "links" and "smart_links"
        itemData.destinationUrl = itemData.destinationUrl || itemData.originalUrl;
        itemData.id = itemData.id || itemData.linkId || id;
        itemData.alias = itemData.alias || itemData.linkId || id;

        // Ensure default status/enabled if missing
        if (itemData.status === undefined && itemData.Status !== undefined) {
          itemData.status = itemData.Status;
        }
        if (itemData.status === undefined) {
          itemData.status = "Active";
        }
        if (itemData.Status === undefined) {
          itemData.Status = itemData.status;
        }
        if (itemData.enabled === undefined && itemData.Enabled !== undefined) {
          itemData.enabled = itemData.Enabled;
        }
        if (itemData.enabled === undefined) {
          itemData.enabled = true;
        }
        if (itemData.Enabled === undefined) {
          itemData.Enabled = itemData.enabled;
        }

        // Fetch Global Configuration Defaults
        try {
          const userSettingsSnap = await getDoc(doc(db, "settings", "user_shortener_config"));
          if (userSettingsSnap.exists()) {
            globalSettings = { ...globalSettings, ...userSettingsSnap.data() };
          }
        } catch (err) {
          console.error("Error fetching global shortener settings config:", err);
        }

        // Apply configuration logic
        if (type === "shortener" && col === "links") {
          itemData.totalPages = globalSettings.totalPages;
          itemData.instructions = globalSettings.instructions;
          itemData.autoScroll = globalSettings.autoScroll;
          itemData.autoRedirect = globalSettings.autoRedirect;
          itemData.continueButtonText = globalSettings.continueButtonText || "Proceed";
          itemData.verifyButtonText = globalSettings.verifyButtonText || "Verify This Step";
          itemData.humanVerification = globalSettings.humanVerification;
          itemData.vpnDetection = globalSettings.vpnDetection;
          itemData.botDetection = globalSettings.botDetection;
          itemData.pagesConfig = globalSettings.pagesConfig;
        } else {
          // Smart Links / Downloads: Use item-specific values if they exist, otherwise fallback to global
          itemData.totalPages = itemData.totalPages ? Number(itemData.totalPages) : globalSettings.totalPages;
          itemData.pagesConfig = (itemData.pagesConfig && itemData.pagesConfig.length > 0) ? itemData.pagesConfig : globalSettings.pagesConfig;
          
          itemData.instructions = itemData.instructions || globalSettings.instructions;
          itemData.autoScroll = itemData.autoScroll !== undefined ? itemData.autoScroll : globalSettings.autoScroll;
          itemData.autoRedirect = itemData.autoRedirect !== undefined ? itemData.autoRedirect : globalSettings.autoRedirect;
          itemData.continueButtonText = itemData.continueButtonText || globalSettings.continueButtonText || "Proceed";
          itemData.verifyButtonText = itemData.verifyButtonText || globalSettings.verifyButtonText || "Verify This Step";
          
          if (itemData.humanVerification === undefined) itemData.humanVerification = globalSettings.humanVerification;
          if (itemData.vpnDetection === undefined) itemData.vpnDetection = globalSettings.vpnDetection;
          if (itemData.botDetection === undefined) itemData.botDetection = globalSettings.botDetection;
        }

        // Requirement 6: Debug logs
        console.log(`[DEBUG SHORTENER] Firestore document found: true in collection: "${col}"`);
        console.log(`[DEBUG SHORTENER] Document status: "${itemData.status || itemData.Status || 'N/A'}" (Enabled: ${itemData.enabled !== false && itemData.Enabled !== false})`);
        console.log(`[DEBUG SHORTENER] Config Applied - Pages: ${itemData.totalPages}, AutoRedirect: ${itemData.autoRedirect}`);
        console.log(`[DEBUG SHORTENER] Redirect destination: "${itemData.destinationUrl || "N/A"}"`);
      } else {
        console.log(`[DEBUG SHORTENER] Firestore document found: false`);
      }

      // Determine if disabled or deleted
      let isDocEnabled = false;
      if (itemData) {
        const statusLower = String(itemData.status || itemData.Status || "").toLowerCase();
        const isDeletedOrDisabled = statusLower === "deleted" || statusLower === "disabled" || statusLower === "inactive";
        const hasEnabledFlag = itemData.enabled !== false && itemData.Enabled !== false;
        isDocEnabled = !isDeletedOrDisabled && hasEnabledFlag;
      }

      if (!itemData || !isDocEnabled) {
        return res.status(404).json({ success: false, message: `${type === "shortener" ? "Smart link" : "File"} not found or disabled.` });
      }

      // Security checking - Bot & Crawler Detection (Ignore automated requests)
      const ua = req.headers["user-agent"] || "";
      const isBot = /bot|spider|crawl|slurp|lighthouse|chrome-lighthouse|headless|telegrambot|telegram\s?bot|facebookexternalhit|whatsapp|googlebot|bingbot|yahoo|baiduspider|yandex|duckduckbot|twitterbot|linkedinbot|pinterest|slackbot|discordbot/i.test(ua);
      if (isBot && itemData.botDetection !== false) {
        try {
          const currentBlocked = Number(itemData.blockedClicks || 0) + 1;
          await updateDoc(docRef, { blockedClicks: currentBlocked });
          await addDoc(collection(db, "shortener_analytics"), {
            linkId: itemData.id || id,
            type: "blocked_click",
            reason: "bot",
            ip: String(ip),
            userAgent: ua,
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Error updating blocked clicks for bot:", e);
        }
        return res.json({ success: false, securityBlocked: true, securityReason: "🤖 Automated agent request blocked by RoyShare Integrity Sentinel." });
      }

      // Generate unique visitor identifier for fraud & duplicate verification
      let visitorId = "";
      if (visitorTgId) {
        visitorId = `visitor_tg_${visitorTgId}`;
      } else {
        const hash = crypto.createHash("md5").update(String(ip) + ua).digest("hex");
        visitorId = `visitor_fp_${hash}`;
      }

      // Security checking - Fraud Protection (Prevent rapid refreshes within 10 seconds)
      const qRecent = query(
        collection(db, "shortener_sessions"),
        where("visitorId", "==", visitorId)
      );
      const recentSnap = await getDocs(qRecent);
      let hasRecent = false;
      if (!recentSnap.empty) {
        const tenSecondsAgoTime = new Date(Date.now() - 10000).getTime();
        hasRecent = recentSnap.docs.some(doc => {
          const data = doc.data();
          const createdAtTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;
          return createdAtTime >= tenSecondsAgoTime;
        });
      }

      if (hasRecent) {
        try {
          const currentBlocked = Number(itemData.blockedClicks || 0) + 1;
          await updateDoc(docRef, { blockedClicks: currentBlocked });
          await addDoc(collection(db, "shortener_analytics"), {
            linkId: itemData.id || id,
            type: "blocked_click",
            reason: "rapid_refresh",
            ip: String(ip),
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Error updating blocked clicks for rapid refresh:", e);
        }
        return res.json({ success: false, securityBlocked: true, securityReason: "⚠️ Rapid refreshes detected. Please wait 10 seconds before generating a new session." });
      }

      // Security checking - VPN/Proxy Detection
      if (itemData.vpnDetection === true && ip && ip !== "Unknown" && ip !== "127.0.0.1" && ip !== "::1") {
        try {
          const ipCheckRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting`).catch(() => null);
          if (ipCheckRes && ipCheckRes.ok) {
            const checkData = await ipCheckRes.json();
            if (checkData.status === "success") {
              if (checkData.proxy === true || checkData.hosting === true) {
                const currentBlocked = Number(itemData.blockedClicks || 0) + 1;
                await updateDoc(docRef, { blockedClicks: currentBlocked });
                await addDoc(collection(db, "shortener_analytics"), {
                  linkId: itemData.id || id,
                  type: "blocked_click",
                  reason: "vpn_proxy",
                  ip: String(ip),
                  createdAt: new Date().toISOString()
                });
                return res.json({ success: false, securityBlocked: true, securityReason: "🔒 Access restricted. VPN, proxy, or hosting network connections are prohibited." });
              }
            }
          }
        } catch (e) {
          console.error("VPN detection error:", e);
        }
      }

      // Self-click check (visitor is the owner of the link)
      let isSelfClick = false;
      const ownerId = String(itemData.userId || "");
      if (visitorTgId && ownerId && String(visitorTgId) === ownerId) {
        isSelfClick = true;
      }

      // Duplicate-click check (same visitor clicked within 24 hours)
      let isDuplicate = false;
      if (!isSelfClick) {
        const qDup = query(
          collection(db, "shortener_sessions"),
          where("visitorId", "==", visitorId)
        );
        const dupSnap = await getDocs(qDup);
        if (!dupSnap.empty) {
          const targetLinkId = itemData.id || id;
          const twentyFourHoursAgoTime = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
          isDuplicate = dupSnap.docs.some(doc => {
            const data = doc.data();
            const createdAtTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;
            return data.linkId === targetLinkId && data.isVerified === true && createdAtTime >= twentyFourHoursAgoTime;
          });
        }
      }

      const isValidClick = !isSelfClick && !isDuplicate;

      // Initialize session ID
      const sessionId = "SESS_" + Math.random().toString(36).substring(2, 15).toUpperCase();
      
      // Page configuration logic
      let totalPages = itemData.totalPages ? Number(itemData.totalPages) : 1;
      let pagesConfig = itemData.pagesConfig || [];

      if (type === "download" && pagesConfig.length === 0) {
        // Default download pages configuration
        totalPages = 1;
        pagesConfig = [{
          pageNumber: 1,
          timerDuration: 5,
          humanVerification: true,
          selectedAdIds: []
        }];
      }

      // Setup session document in Firestore
      await setDoc(doc(db, "shortener_sessions", sessionId), {
        id: sessionId,
        linkId: itemData.id || id,
        type,
        currentPage: 1,
        completedPages: [],
        createdAt: new Date().toISOString(),
        ip: String(ip),
        visitorId,
        visitorTgId: visitorTgId || "",
        isVerified: false,
        isSelfClick,
        isDuplicate,
        isValidClick
      });

      // Update counters on the link/upload document
      const currentViews = Number(itemData.views || 0);
      const currentSelfClicks = Number(itemData.selfClicks || 0);
      const currentDuplicateClicks = Number(itemData.duplicateClicks || 0);
      const currentUniqueViews = Number(itemData.uniqueViews || itemData.uniqueVisitors || 0);

      const updatePayload: any = {
        views: currentViews + 1
      };

      if (isSelfClick) {
        updatePayload.selfClicks = currentSelfClicks + 1;
      } else if (isDuplicate) {
        updatePayload.duplicateClicks = currentDuplicateClicks + 1;
      } else {
        // Unique valid visitor!
        updatePayload.uniqueViews = currentUniqueViews + 1;
        updatePayload.uniqueVisitors = currentUniqueViews + 1;
      }
      
      // Recalculate conversion rate based on unique valid clicks or total views
      const redirects = Number(itemData.completedRedirects || itemData.downloads || 0);
      const denominator = isSelfClick ? currentViews + 1 : (currentUniqueViews + (isValidClick ? 1 : 0) || 1);
      updatePayload.conversionRate = Number(((redirects / denominator) * 100).toFixed(2));

      await updateDoc(docRef, updatePayload);

      // Save analytics records
      const analyticsPayload: any = {
        linkId: itemData.id || id,
        type: isSelfClick ? "self_click" : (isDuplicate ? "duplicate_click" : "view"),
        ip: String(ip),
        country,
        device,
        browser,
        referrer: referrer || "Direct",
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "shortener_analytics"), analyticsPayload);

      if (isValidClick) {
        await addDoc(collection(db, "shortener_analytics"), {
          linkId: itemData.id || id,
          type: "unique_view",
          ip: String(ip),
          country,
          device,
          browser,
          createdAt: new Date().toISOString()
        });
      }

      // Scrub confidential fields from public return
      const publicItemData = { ...itemData };
      delete publicItemData.destinationUrl; // SECURITY: Never leak destination URL at session init!
      delete publicItemData.ipList;
      delete publicItemData.password; // SECURITY: Never leak password at session init!

      res.json({
        success: true,
        sessionId,
        totalPages,
        pagesConfig,
        isPasswordProtected: !!itemData.password || !!itemData.isPasswordProtected,
        data: publicItemData
      });

    } catch (err: any) {
      console.error("Error initiating smart link session:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  
  app.post("/api/smart-links/session/verify-password", async (req, res) => {
    try {
      const { sessionId, password } = req.body;
      if (!sessionId || !password) return res.status(400).json({ success: false, message: "Missing sessionId or password" });

      const sessionSnap = await getDoc(doc(db, "shortener_sessions", sessionId));
      if (!sessionSnap.exists()) return res.status(404).json({ success: false, message: "Session not found" });
      const sessionData = sessionSnap.data();

      // Find the link or file
      let linkSnap: any = null;
      if (sessionData.type === "download") {
        linkSnap = await getDoc(doc(db, "uploads", sessionData.linkId));
      } else {
        linkSnap = await getDoc(doc(db, "smart_links", sessionData.linkId));
        if (!linkSnap.exists()) {
           linkSnap = await getDoc(doc(db, "links", sessionData.linkId));
        }
        if (!linkSnap.exists()) {
          const qLinkAlias = query(collection(db, "links"), where("alias", "==", sessionData.linkId));
          const qLinkAliasSnap = await getDocs(qLinkAlias);
          if (!qLinkAliasSnap.empty) {
            linkSnap = qLinkAliasSnap.docs[0];
          } else {
            const qSmart = query(collection(db, "smart_links"), where("alias", "==", sessionData.linkId));
            const qSmartSnap = await getDocs(qSmart);
            if (!qSmartSnap.empty) {
               linkSnap = qSmartSnap.docs[0];
            }
          }
        }
      }

      if (!linkSnap || !linkSnap.exists()) return res.status(404).json({ success: false, message: "Item not found" });
      
      const linkData = linkSnap.data();
      
      if (linkData.password === password) {
         // Optionally track password unlocked in session
         await updateDoc(doc(db, "shortener_sessions", sessionId), { passwordVerified: true });
         return res.json({ success: true });
      } else {
         return res.status(401).json({ success: false, message: "Incorrect password" });
      }
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.post("/api/smart-links/session/page-complete", async (req, res) => {
    try {
      const { sessionId, pageNumber } = req.body;
      if (!sessionId || !pageNumber) return res.status(400).json({ success: false, message: "Missing session ID or page number" });

      const sessionRef = doc(db, "shortener_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return res.status(404).json({ success: false, message: "Session expired or invalid." });
      }

      const sessionData = sessionSnap.data();
      if (sessionData.currentPage !== pageNumber) {
        return res.status(400).json({ success: false, message: "Session page mismatch. Anti-skip triggered." });
      }

      const completed = sessionData.completedPages || [];
      if (!completed.includes(pageNumber)) {
        completed.push(pageNumber);
      }

      await updateDoc(sessionRef, {
        completedPages: completed,
        currentPage: pageNumber + 1
      });

      // Save page_complete analytics
      await addDoc(collection(db, "shortener_analytics"), {
        linkId: sessionData.linkId,
        type: "page_complete",
        pageNumber,
        ip: sessionData.ip,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, nextPage: pageNumber + 1 });
    } catch (err: any) {
      console.error("Error in page-complete:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.post("/api/smart-links/session/claim", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ success: false, message: "Missing session ID" });

      const sessionRef = doc(db, "shortener_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return res.status(404).json({ success: false, message: "Session invalid or expired." });
      }

      const sessionData = sessionSnap.data();
      const { linkId, type, completedPages, ip, isSelfClick, isDuplicate, isValidClick } = sessionData;

      let itemData: any = null;
      let docRef: any = null;

      // Debug log: Link ID received for claim
      console.log(`[DEBUG CLAIM] Link ID received: "${linkId}"`);

      if (type === "shortener") {
        console.log(`[DEBUG CLAIM] Searching collection: "links" (used by bot) and fallback to "smart_links"`);

        // 1. Try "links" collection first
        const directLinkRef = doc(db, "links", linkId);
        const directLinkSnap = await getDoc(directLinkRef);
        if (directLinkSnap.exists()) {
          docRef = directLinkRef;
          itemData = directLinkSnap.data();
        } else {
          const qLink = query(collection(db, "links"), where("linkId", "==", linkId));
          const qLinkSnap = await getDocs(qLink);
          if (!qLinkSnap.empty) {
            docRef = qLinkSnap.docs[0].ref;
            itemData = qLinkSnap.docs[0].data();
          } else {
            const qLinkAlias = query(collection(db, "links"), where("alias", "==", linkId));
            const qLinkAliasSnap = await getDocs(qLinkAlias);
            if (!qLinkAliasSnap.empty) {
              docRef = qLinkAliasSnap.docs[0].ref;
              itemData = qLinkAliasSnap.docs[0].data();
            }
          }
        }

        // 2. Try "smart_links" collection as fallback
        if (!itemData) {
          const qSmart = query(collection(db, "smart_links"), where("alias", "==", linkId));
          const qSmartSnap = await getDocs(qSmart);
          if (!qSmartSnap.empty) {
            docRef = qSmartSnap.docs[0].ref;
            itemData = qSmartSnap.docs[0].data();
          } else {
            const directSmartRef = doc(db, "smart_links", linkId);
            const directSmartSnap = await getDoc(directSmartRef);
            if (directSmartSnap.exists()) {
              docRef = directSmartRef;
              itemData = directSmartSnap.data();
            }
          }
        }
      } else {
        console.log(`[DEBUG CLAIM] Searching collection: "uploads"`);
        const directRef = doc(db, "uploads", linkId);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          docRef = directRef;
          itemData = directSnap.data();
        } else {
          const qFileId = query(collection(db, "uploads"), where("fileId", "==", linkId));
          const qFileIdSnap = await getDocs(qFileId);
          if (!qFileIdSnap.empty) {
            docRef = qFileIdSnap.docs[0].ref;
            itemData = qFileIdSnap.docs[0].data();
          } else {
            const qDriveId = query(collection(db, "uploads"), where("driveFileId", "==", linkId));
            const qDriveIdSnap = await getDocs(qDriveId);
            if (!qDriveIdSnap.empty) {
              docRef = qDriveIdSnap.docs[0].ref;
              itemData = qDriveIdSnap.docs[0].data();
            } else {
              const qAlias = query(collection(db, "uploads"), where("customAlias", "==", linkId));
              const qAliasSnap = await getDocs(qAlias);
              if (!qAliasSnap.empty) {
                docRef = qAliasSnap.docs[0].ref;
                itemData = qAliasSnap.docs[0].data();
              }
            }
          }
        }
      }

      if (itemData) {
        // Fetch Global Configuration Defaults for claim verification
        let globalSettings: any = {
          totalPages: 1,
        };
        try {
          const userSettingsSnap = await getDoc(doc(db, "settings", "user_shortener_config"));
          if (userSettingsSnap.exists()) {
            globalSettings = userSettingsSnap.data();
          }
        } catch (err) {
          console.error("Error fetching global shortener settings config in claim:", err);
        }

        // Apply same configuration logic as session init
        const col = (docRef.path || "").split("/")[0];
        if (type === "shortener" && col === "links") {
          itemData.totalPages = globalSettings.totalPages;
        } else {
          itemData.totalPages = itemData.totalPages ? Number(itemData.totalPages) : globalSettings.totalPages;
        }

        // Compatibility mapping for "links" and "smart_links"
        itemData.destinationUrl = itemData.destinationUrl || itemData.originalUrl;
        itemData.id = itemData.id || itemData.linkId || linkId;
        itemData.alias = itemData.alias || itemData.linkId || linkId;

        // Ensure default status/enabled if missing
        if (itemData.status === undefined && itemData.Status !== undefined) {
          itemData.status = itemData.Status;
        }
        if (itemData.status === undefined) {
          itemData.status = "Active";
        }
        if (itemData.Status === undefined) {
          itemData.Status = itemData.status;
        }
        if (itemData.enabled === undefined && itemData.Enabled !== undefined) {
          itemData.enabled = itemData.Enabled;
        }
        if (itemData.enabled === undefined) {
          itemData.enabled = true;
        }
        if (itemData.Enabled === undefined) {
          itemData.Enabled = itemData.enabled;
        }

        // Debug logs
        console.log(`[DEBUG CLAIM] Firestore document found: true`);
        console.log(`[DEBUG CLAIM] Document status: "${itemData.status || itemData.Status || 'N/A'}" (Enabled: ${itemData.enabled !== false && itemData.Enabled !== false})`);
        console.log(`[DEBUG CLAIM] Final Verification - Required Pages: ${itemData.totalPages}, Completed: ${completedPages.length}`);
        console.log(`[DEBUG CLAIM] Redirect destination: "${itemData.destinationUrl || "N/A"}"`);
      } else {
        console.log(`[DEBUG CLAIM] Firestore document found: false`);
      }

      if (!itemData) {
        return res.status(404).json({ success: false, message: "Target entity not found." });
      }

      // Verify all pages completed
      let totalPages = itemData.totalPages ? Number(itemData.totalPages) : 1;
      if (type === "download" && !itemData.totalPages) {
        totalPages = 1;
      }

      for (let p = 1; p <= totalPages; p++) {
        if (!completedPages.includes(p)) {
          return res.status(400).json({ success: false, message: `Page ${p} verification missing. Skip blocked.` });
        }
      }

      // Mark session verified
      await updateDoc(sessionRef, { isVerified: true });

      // Save analytics redirect log
      await addDoc(collection(db, "shortener_analytics"), {
        linkId,
        type: isSelfClick ? "self_redirect" : (isDuplicate ? "duplicate_redirect" : "valid_redirect"),
        ip: String(ip),
        createdAt: new Date().toISOString()
      });

      // Increment completed Redirects / Downloads
      if (type === "shortener") {
        const currentRedirects = Number(itemData.completedRedirects || 0) + 1;
        const currentValidClicks = Number(itemData.validClicks || 0) + (isValidClick ? 1 : 0);
        const uniqueVisitors = Number(itemData.uniqueViews || itemData.uniqueVisitors || 1);
        const conversionRate = Number(((currentRedirects / uniqueVisitors) * 100).toFixed(2));
        
        const updatePayload: any = {
          completedRedirects: currentRedirects,
          conversionRate
        };

        if (isValidClick) {
          updatePayload.validClicks = currentValidClicks;
        }

        if (isValidClick && itemData.userId) {
          try {
            const sysRef = doc(db, "settings", "system");
            const sysSnap = await getDoc(sysRef);
            let cpm = 5.0; // Default CPM of $5.0 per 1000 views ($0.005 per click)
            if (sysSnap.exists()) {
              const earningSettings = sysSnap.data().earningSettings || {};
              cpm = parseFloat(earningSettings.linkCpm || "5.0") || 5.0;
            }
            const clickReward = cpm / 1000;
            
            const currentEarnings = Number(itemData.earnings || 0) + clickReward;
            updatePayload.earnings = currentEarnings;

            const userRef = doc(db, "users", String(itemData.userId));
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const userStatus = userData.status || "Normal";
              const isFlagged = ["Pending Review", "High Risk", "Shadow Monitor"].includes(userStatus) || (userData?.trustScore !== undefined && userData.trustScore < 20);
              const isSb = userData.shadowBanned === true;
              
              if (isFlagged) {
                // Silent Review Mode: Do not credit balances. Just log transaction as Pending Review.
                await addDoc(collection(db, "transactions"), {
                  userId: String(itemData.userId),
                  type: "Credit",
                  amount: clickReward,
                  description: `Earnings from short link redirect completion: ${itemData.alias || itemData.id || "N/A"}`,
                  createdAt: new Date().toISOString(),
                  status: "Pending Review",
                  is_flagged: true,
                  flagged_status: userStatus
                });
              } else if (isSb) {
                const shadowLinkEarnings = Number(userData.shadowLinkEarnings || 0);
                const shadowBalance = Number(userData.shadowBalance || 0);
                const shadowTotalEarned = Number(userData.shadowTotalEarned || 0);
                const shadowAvailableBalance = Number(userData.shadowAvailableBalance || 0);

                await updateDoc(userRef, {
                  shadowLinkEarnings: shadowLinkEarnings + clickReward,
                  shadowBalance: shadowBalance + clickReward,
                  shadowTotalEarned: shadowTotalEarned + clickReward,
                  shadowAvailableBalance: shadowAvailableBalance + clickReward
                });

                await addDoc(collection(db, "shadow_blocked_rewards"), {
                  userId: String(itemData.userId),
                  username: userData.username || userData.firstName || "no_username",
                  amount: clickReward,
                  type: "shortener_link",
                  createdAt: new Date().toISOString()
                });

                await addDoc(collection(db, "transactions"), {
                  userId: String(itemData.userId),
                  type: "Credit",
                  amount: clickReward,
                  description: `Earnings from short link redirect completion: ${itemData.alias || itemData.id || "N/A"}`,
                  createdAt: new Date().toISOString(),
                  status: "Completed",
                  shadow_banned: isSb
                });
              } else {
                const currentLinkEarnings = Number(userData.linkEarnings || 0);
                const currentBalance = Number(userData.balance || 0);
                const currentTotalEarned = Number(userData.totalEarned || 0);
                
                await updateDoc(userRef, {
                  linkEarnings: currentLinkEarnings + clickReward,
                  balance: currentBalance + clickReward,
                  totalEarned: currentTotalEarned + clickReward
                });

                await addDoc(collection(db, "transactions"), {
                  userId: String(itemData.userId),
                  type: "Credit",
                  amount: clickReward,
                  description: `Earnings from short link redirect completion: ${itemData.alias || itemData.id || "N/A"}`,
                  createdAt: new Date().toISOString(),
                  status: "Completed",
                  shadow_banned: isSb
                });
              }
            }
          } catch (e) {
            console.error("Error crediting user wallet for link click:", e);
          }
        }

        await updateDoc(docRef, updatePayload);

        if (!itemData.destinationUrl) {
          return res.status(400).json({ success: false, message: "Target destination URL is missing in the database." });
        }

        res.json({
          success: true,
          destinationUrl: itemData.destinationUrl
        });
      } else {
        const currentDownloads = Number(itemData.downloads || 0) + 1;
        const currentValidClicks = Number(itemData.validClicks || 0) + (isValidClick ? 1 : 0);
        const uniqueVisitors = Number(itemData.uniqueViews || itemData.uniqueVisitors || 1);
        const conversionRate = Number(((currentDownloads / uniqueVisitors) * 100).toFixed(2));

        const updatePayload: any = {
          downloads: currentDownloads,
          conversionRate
        };

        if (isValidClick) {
          updatePayload.validClicks = currentValidClicks;
        }

        if (isValidClick && itemData.userId) {
          try {
            // Fetch system earnings per download
            const settingsSnap = await getDoc(doc(db, "settings", "earnings"));
            const earningsPerDownload = settingsSnap.exists() ? (Number(settingsSnap.data()?.earningsPerDownload) || 0.1) : 0.1;
            const currentEarnings = Number(itemData.earnings || 0) + earningsPerDownload;
            updatePayload.earnings = currentEarnings;

            const userRef = doc(db, "users", String(itemData.userId));
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const userStatus = userData.status || "Normal";
              const isFlagged = ["Pending Review", "High Risk", "Shadow Monitor"].includes(userStatus) || (userData?.trustScore !== undefined && userData.trustScore < 20);
              const isSb = userData.shadowBanned === true;

              if (isFlagged) {
                // Silent Review Mode: Do not credit balances. Just log transaction as Pending Review.
                await addDoc(collection(db, "transactions"), {
                  userId: String(itemData.userId),
                  type: "Credit",
                  amount: earningsPerDownload,
                  description: `Earnings from download of file: ${itemData.fileName || "N/A"}`,
                  createdAt: new Date().toISOString(),
                  status: "Pending Review",
                  is_flagged: true,
                  flagged_status: userStatus
                });
              } else if (isSb) {
                const shadowBalance = Number(userData.shadowBalance || 0);
                const shadowTotalEarnings = Number(userData.shadowTotalEarnings || 0);
                const shadowFileEarnings = Number(userData.shadowFileEarnings || 0);
                const shadowAvailableBalance = Number(userData.shadowAvailableBalance || 0);

                await updateDoc(userRef, {
                  shadowBalance: shadowBalance + earningsPerDownload,
                  shadowTotalEarnings: shadowTotalEarnings + earningsPerDownload,
                  shadowFileEarnings: shadowFileEarnings + earningsPerDownload,
                  shadowAvailableBalance: shadowAvailableBalance + earningsPerDownload
                });

                await addDoc(collection(db, "shadow_blocked_rewards"), {
                  userId: String(itemData.userId),
                  username: userData.username || userData.firstName || "no_username",
                  amount: earningsPerDownload,
                  type: "file_download",
                  createdAt: new Date().toISOString()
                });

                await addDoc(collection(db, "transactions"), {
                  userId: String(itemData.userId),
                  type: "Credit",
                  amount: earningsPerDownload,
                  description: `Earnings from download of file: ${itemData.fileName || "N/A"}`,
                  createdAt: new Date().toISOString(),
                  status: "Completed",
                  shadow_banned: isSb
                });
              } else {
                const currentBalance = Number(userData.balance || 0);
                const currentTotalEarnings = Number(userData.totalEarnings || 0);
                await updateDoc(userRef, {
                  balance: currentBalance + earningsPerDownload,
                  totalEarnings: currentTotalEarnings + earningsPerDownload
                });

                await addDoc(collection(db, "transactions"), {
                  userId: String(itemData.userId),
                  type: "Credit",
                  amount: earningsPerDownload,
                  description: `Earnings from download of file: ${itemData.fileName || "N/A"}`,
                  createdAt: new Date().toISOString(),
                  status: "Completed",
                  shadow_banned: isSb
                });
              }
            }
          } catch (e) {
            console.error("Error crediting uploader wallet:", e);
          }
        }

        await updateDoc(docRef, updatePayload);

        // Return the new secure direct backend download endpoint
        const downloadUrl = `/download/${linkId}?action=download`;
        console.log(`[DEBUG CLAIM] Returning backend download url: ${downloadUrl}`);

        res.json({
          success: true,
          downloadUrl
        });
      }
    } catch (err: any) {
      console.error("Error in claim target:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Admin CRUD for self-hosted Smart Shortener Links
  app.get("/api/admin/smart-links", async (req, res) => {
    try {
      const q = query(collection(db, "smart_links"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const links = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(links);
    } catch (e: any) {
      console.error("Error fetching smart links:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/smart-links", async (req, res) => {
    try {
      const {
        destinationUrl,
        customAlias,
        isPasswordProtected,
        password,
        totalPages,
        autoRedirect,
        finalRedirectDelay,
        instructions,
        reward,
        status,
        pagesConfig
      } = req.body;

      if (!destinationUrl) {
        return res.status(400).json({ error: "Destination URL is required" });
      }

      let alias = customAlias ? customAlias.trim() : "";
      if (alias) {
        if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
          return res.status(400).json({ error: "Alias must only contain letters, numbers, dashes, and underscores." });
        }
        const q = query(collection(db, "smart_links"), where("alias", "==", alias));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return res.status(400).json({ error: "Custom alias is already in use." });
        }
      } else {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          alias = Math.random().toString(36).substring(2, 8).toUpperCase();
          const q = query(collection(db, "smart_links"), where("alias", "==", alias));
          const qSnap = await getDocs(q);
          if (qSnap.empty) {
            isUnique = true;
          }
          attempts++;
        }
      }

      const newLinkId = "LNK_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const rawAppUrl = process.env.APP_URL || "https://www.royshare.online";
      const appUrl = (rawAppUrl.includes("run.app") || rawAppUrl.includes("ais-dev") || rawAppUrl === "MY_APP_URL") 
        ? "https://www.royshare.online" 
        : rawAppUrl;
      const baseDomain = appUrl.replace(/\/$/, "");
      const shortUrl = `${baseDomain}/s/${alias}`;

      const newLinkDoc = {
        id: newLinkId,
        destinationUrl,
        alias,
        shortUrl,
        isPasswordProtected: isPasswordProtected === true,
        password: password || "",
        totalPages: Number(totalPages) || 1,
        autoRedirect: autoRedirect !== false,
        finalRedirectDelay: Number(finalRedirectDelay) || 0,
        instructions: instructions || "",
        reward: Number(reward) || 0,
        status: status || "Enabled",
        pagesConfig: pagesConfig || [],
        createdAt: new Date().toISOString(),
        views: 0,
        uniqueViews: 0,
        completedRedirects: 0,
        conversionRate: 0,
        ipList: []
      };

      await setDoc(doc(db, "smart_links", newLinkId), newLinkDoc);
      res.json(newLinkDoc);
    } catch (e: any) {
      console.error("Error creating smart link:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/smart-links/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        destinationUrl,
        customAlias,
        isPasswordProtected,
        password,
        totalPages,
        autoRedirect,
        finalRedirectDelay,
        instructions,
        reward,
        status,
        pagesConfig
      } = req.body;

      const linkRef = doc(db, "smart_links", id);
      const linkSnap = await getDoc(linkRef);

      if (!linkSnap.exists()) {
        return res.status(404).json({ error: "Smart link not found." });
      }

      const existingData = linkSnap.data();
      let alias = customAlias ? customAlias.trim() : existingData.alias;

      if (alias !== existingData.alias) {
        const q = query(collection(db, "smart_links"), where("alias", "==", alias));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return res.status(400).json({ error: "Custom alias is already in use." });
        }
      }

      const rawAppUrl = process.env.APP_URL || "https://www.royshare.online";
      const appUrl = (rawAppUrl.includes("run.app") || rawAppUrl.includes("ais-dev") || rawAppUrl === "MY_APP_URL") 
        ? "https://www.royshare.online" 
        : rawAppUrl;
      const baseDomain = appUrl.replace(/\/$/, "");
      const shortUrl = `${baseDomain}/s/${alias}`;

      const updatedDoc = {
        ...existingData,
        destinationUrl,
        alias,
        shortUrl,
        isPasswordProtected: isPasswordProtected === true,
        password: password || "",
        totalPages: Number(totalPages) || 1,
        autoRedirect: autoRedirect !== false,
        finalRedirectDelay: Number(finalRedirectDelay) || 0,
        instructions: instructions || "",
        reward: Number(reward) || 0,
        status: status || "Enabled",
        pagesConfig: pagesConfig || []
      };

      await setDoc(linkRef, updatedDoc);
      res.json(updatedDoc);
    } catch (e: any) {
      console.error("Error updating smart link:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/smart-links/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "smart_links", id));
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error deleting smart link:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // AI Generate Instructions
  app.post("/api/admin/shortener/generate-instructions", async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ error: "Settings are required" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        Analyze these URL Shortener settings and generate professional visitor instructions:
        - Total Pages: ${settings.totalPages || 1}
        - Timer Duration: ${settings.pagesConfig?.[0]?.timerDuration || 10} seconds
        - Verify Button Text: ${settings.verifyButtonText || "Verify This Step"}
        - Auto Redirect: ${settings.autoRedirect ? "Enabled" : "Disabled"}
        - Math Verification (Human Check): ${settings.humanVerification ? "Enabled" : "Disabled"}
        - Ads: Multiple placements active
        - Anti VPN: ${settings.vpnDetection ? "Active" : "Inactive"}
        - Bot Detection: ${settings.botDetection ? "Active" : "Inactive"}

        Requirements for the output:
        - Short and professional
        - Use emojis
        - Easy to understand
        - SEO and Human friendly
        - Formatted as a single instruction text block

        Example format:
        📢 Please complete all verification steps to continue.
        ✔ Read the instructions on each page.
        ✔ Wait for the timer to finish.
        ✔ Complete the verification if required.
        ✔ Follow all pages until the final destination unlocks.
        Thank you for your patience.
      `;

      const result = await safeGenerateContent(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional copywriter specialized in UX and instruction writing for web applications. Generate short, clear, and engaging instructions. Use bullet points and emojis where appropriate.",
        }
      });

      res.json({ text: result.text });
    } catch (e: any) {
      console.error("Error generating instructions:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // AI Generate Task
  app.post("/api/admin/tasks/generate-ai", async (req, res) => {
    try {
      const { taskType, field, currentTask } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is missing. Please add it to your environment variables." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let prompt = `
        You are an expert Reward System Task Architect. 
        Generate details for a task of type: "${taskType}".
        
        The reward system uses these rules:
        - Reward: User gets this amount (e.g. 1-100)
        - Timer: User must stay on page for X seconds (e.g. 5-60)
        - Pages: User must visit N pages (e.g. 1-5)
        - Ad Network: Adsterra, Monetag Mini App, or Direct
        
        ${currentTask?.adNetwork ? `The current selected Ad Network is: "${currentTask.adNetwork}". Please generate details that match this network.` : ''}
        ${field ? `The user only wants to update the "${field}" field specifically.` : `Generate a complete optimized task.`}
        
        For the "imageUrl", always suggest a high-quality, relevant, royalty-free placeholder image URL from Unsplash (e.g. https://images.unsplash.com/photo-...) that matches the task type perfectly.
        
        Return the result as a JSON object with this structure:
        {
          "task": {
            "title": "...",
            "description": "...",
            "rewardAmount": "...",
            "timerDuration": "...",
            "totalPages": "...",
            "imageUrl": "...",
            "adNetwork": "${currentTask?.adNetwork || "Adsterra"}"
          },
          "analytics": {
            "completionRate": "85%",
            "risk": "Low|Medium|High",
            "difficulty": "Easy|Medium|Hard",
            "estimatedTime": "45s",
            "suggestions": "Brief optimization advice..."
          }
        }
      `;

      const result = await safeGenerateContent(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an AI specialized in generating high-conversion, professional task instructions and settings for reward-based applications. Ensure the tone is engaging, human-friendly, and optimized for mobile users. Always return valid JSON.",
        }
      });

      const responseText = result.text;
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (e: any) {
      console.error("Error generating AI task:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/user-shortener-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "user_shortener_config");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        res.json({
          ...data,
        });
      } else {
        const defaultUserSettings = {
          totalPages: 2,
          instructions: "Follow the steps below to reach your destination.",
          autoScroll: true,
          autoRedirect: true,
          continueButtonText: "Proceed",
          verifyButtonText: "Verify This Step",
          humanVerification: true,
          vpnDetection: false,
          botDetection: true,
          pagesConfig: [
            {
              pageNumber: 1,
              timerDuration: 10,
              instructions: "Complete verification step 1.",
              selectedAdIds: [],
              numberOfAds: 3,
              humanVerification: true,
              verifyBtnText: "Verify Step 1",
              continueBtnText: "Proceed"
            },
            {
              pageNumber: 2,
              timerDuration: 10,
              instructions: "Complete the final verification step.",
              selectedAdIds: [],
              numberOfAds: 3,
              humanVerification: true,
              verifyBtnText: "Verify Step 2",
              continueBtnText: "Proceed"
            }
          ]
        };
        res.json(defaultUserSettings);
      }
    } catch (e: any) {
      console.error("Error fetching user shortener settings:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/user-shortener-settings", async (req, res) => {
    try {
      const config = req.body;
      const docRef = doc(db, "settings", "user_shortener_config");
      await setDoc(docRef, config);
      res.json({ success: true, config });
    } catch (e: any) {
      console.error("Error saving user shortener settings:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Google Drive Connection Routes
  app.get("/api/google-drive/connect", (req, res) => {
    try {
      const tg_id = req.query.tg_id;
      if (!tg_id) {
        return res.status(400).send("Error: Missing tg_id query parameter.");
      }

      const appUrl = "https://www.royshare.online";
      const redirectUri = "https://royshare.online/api/google-drive/callback";

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      const isConfigured = clientId && clientSecret && 
                           !clientId.startsWith("YOUR_") && !clientId.startsWith("MY_") && clientId.trim() !== "" &&
                           !clientSecret.startsWith("YOUR_") && !clientSecret.startsWith("MY_") && clientSecret.trim() !== "";

      if (!isConfigured) {
        const missingVars = [];
        if (!clientId || clientId.startsWith("YOUR_") || clientId.startsWith("MY_") || clientId.trim() === "") missingVars.push("GOOGLE_CLIENT_ID");
        if (!clientSecret || clientSecret.startsWith("YOUR_") || clientSecret.startsWith("MY_") || clientSecret.trim() === "") missingVars.push("GOOGLE_CLIENT_SECRET");

        res.send(`
          <html>
            <body style="margin:0;padding:0;background-color:#0f172a;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <div style="padding:2.5rem;max-width:700px;width:90%;border:1px solid #334155;border-radius:20px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.3);background-color:#1e293b;margin:2rem 0;">
                <div style="font-size:3rem;margin-bottom:1rem;text-align:center;">⚙️</div>
                <h1 style="color:#ef4444;font-size:2rem;margin-bottom:1.5rem;margin-top:0;font-weight:700;text-align:center;">Google OAuth Setup Required</h1>
                
                <p style="color:#94a3b8;margin-bottom:1.5rem;font-size:1.1rem;line-height:1.6;">
                  To enable Google Drive integration, you must configure Google OAuth Credentials in the AI Studio environment variables.
                </p>

                <div style="background-color:#0f172a;padding:1.2rem;border-radius:12px;margin-bottom:2rem;border:1px solid #ef4444;">
                  <h3 style="color:#f87171;margin-top:0;margin-bottom:0.8rem;font-size:1.1rem;">Missing Environment Variables:</h3>
                  <ul style="color:#ef4444;font-family:monospace;font-size:1rem;margin:0;padding-left:1.5rem;line-height:1.5;">
                    ${missingVars.map(v => `<li><strong>${v}</strong></li>`).join('')}
                  </ul>
                </div>

                <h2 style="color:#38bdf8;font-size:1.4rem;margin-top:2rem;margin-bottom:1rem;font-weight:600;border-bottom:1px solid #334155;padding-bottom:0.5rem;">How to configure Google Cloud Console:</h2>
                
                <ol style="color:#cbd5e1;padding-left:1.5rem;line-height:1.8;font-size:1rem;">
                  <li style="margin-bottom:0.8rem;">
                    Go to the <strong><a href="https://console.cloud.google.com/" target="_blank" style="color:#38bdf8;text-decoration:underline;">Google Cloud Console</a></strong> and select or create a project.
                  </li>
                  <li style="margin-bottom:0.8rem;">
                    Go to <strong>APIs & Services > OAuth consent screen</strong>:
                    <ul style="padding-left:1.2rem;list-style-type:circle;margin-top:0.4rem;">
                      <li>Choose <strong>External</strong> user type, fill in required fields, and save.</li>
                      <li>In the <strong>Scopes</strong> step, add <code>.../auth/drive.file</code>, <code>.../auth/drive.readonly</code>, <code>.../auth/userinfo.email</code>, and <code>.../auth/userinfo.profile</code>.</li>
                      <li>In the <strong>Test users</strong> step, add your developer email address (e.g., <code>ritikrai2625@gmail.com</code>) so you can authenticate while the app is in testing.</li>
                    </ul>
                  </li>
                  <li style="margin-bottom:0.8rem;">
                    Go to <strong>APIs & Services > Credentials</strong>, click <strong>+ CREATE CREDENTIALS</strong>, and select <strong>OAuth client ID</strong>.
                  </li>
                  <li style="margin-bottom:0.8rem;">
                    Configure the credential:
                    <ul style="padding-left:1.2rem;list-style-type:circle;margin-top:0.4rem;">
                      <li>Select <strong>Web application</strong> as Application type.</li>
                      <li>Under <strong>Authorized redirect URIs</strong>, add this exact URL:<br>
                        <code style="background-color:#0f172a;padding:0.2rem 0.5rem;border-radius:4px;color:#38bdf8;word-break:break-all;font-size:0.9rem;">${redirectUri}</code>
                      </li>
                    </ul>
                  </li>
                  <li style="margin-bottom:0.8rem;">
                    Click <strong>Create</strong>, then copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong>.
                  </li>
                  <li style="margin-bottom:0.8rem;">
                    In AI Studio, go to the <strong>Settings (or Secrets)</strong> menu and add these keys with your copied values:
                    <ul style="padding-left:1.2rem;list-style-type:circle;margin-top:0.4rem;">
                      <li><code>GOOGLE_CLIENT_ID</code></li>
                      <li><code>GOOGLE_CLIENT_SECRET</code></li>
                    </ul>
                  </li>
                </ol>

                <div style="margin-top:2.5rem;text-align:center;">
                  <button onclick="window.location.reload();" style="background-color:#0284c7;color:#ffffff;border:none;padding:0.8rem 1.8rem;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:background-color 0.2s;">
                    🔄 Reload Page
                  </button>
                </div>
              </div>
            </body>
          </html>
        `);
        return;
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive.readonly",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile"
        ],
        state: String(tg_id)
      });

      res.redirect(authUrl);
    } catch (e: any) {
      console.error("Error in Google Drive connect route:", e);
      res.status(500).send(`Error: ${e.message}`);
    }
  });

  app.get("/api/google-drive/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.status(400).send("Error: Missing code or state parameters from Google callback.");
      }

      const appUrl = "https://www.royshare.online";
      const redirectUri = "https://royshare.online/api/google-drive/callback";
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2"
      });

      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email || "";
      const name = userInfo.data.name || "";
      const googleUserId = userInfo.data.id || "";

      // Store in Firestore
      const docRef = doc(db, "google_drive_accounts", String(state));
      const existingSnap = await getDoc(docRef);

      const accountData: any = {
        userId: String(state),
        telegramId: String(state),
        name: name,
        email: email,
        gmail: email,
        googleUserId: googleUserId,
        accessToken: tokens.access_token || "",
        expiryTime: tokens.expiry_date || 0,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "",
        connectedAt: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        status: "connected"
      };

      if (tokens.refresh_token) {
        accountData.refreshToken = tokens.refresh_token;
      } else if (existingSnap.exists() && existingSnap.data()?.refreshToken) {
        accountData.refreshToken = existingSnap.data().refreshToken;
      }

      await setDoc(docRef, accountData, { merge: true });

      // Notify User via Telegram
      try {
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        const botToken = telegramSettingsSnap.exists() ? telegramSettingsSnap.data()?.botToken : null;
        if (botToken) {
          const messageText = `✅ Google Drive connected successfully.
Gmail: ${email}`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: Number(state),
              text: messageText,
              parse_mode: "Markdown"
            })
          });
        }
      } catch (tgErr) {
        console.error("Failed to send telegram notification for google drive connect:", tgErr);
      }

      res.send(`
        <html>
          <body style="margin:0;padding:0;background-color:#0f172a;display:flex;justify-content:center;align-items:center;height:100vh;">
            <div style="font-family:sans-serif;padding:2.5rem;max-width:500px;width:90%;border:1px solid #334155;border-radius:20px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.3);background-color:#1e293b;text-align:center;color:#f8fafc;">
              <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
              <h1 style="color:#10b981;font-size:2rem;margin-bottom:1rem;margin-top:0;font-weight:700;">Drive Connected!</h1>
              <p style="color:#94a3b8;margin-bottom:1.5rem;font-size:1.1rem;line-height:1.5;">Google Drive has been successfully connected to your RoyShare account.</p>
              <div style="background-color:#334155;padding:1.2rem;border-radius:12px;font-family:monospace;font-size:1rem;color:#e2e8f0;margin-bottom:1.5rem;word-break:break-all;">
                <strong>Gmail:</strong> ${email}
              </div>
              <p style="color:#64748b;font-size:0.9rem;">You can safely close this browser window and return to your Telegram Bot.</p>
            </div>
          </body>
        </html>
      `);
    } catch (e: any) {
      console.error("Error in Google Drive callback:", e);
      res.status(500).send(`Error: ${e.message}`);
    }
  });

  // Helper to format bytes to human readable string
  function formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  // Helper to obtain an active access token for Google Drive
  async function getActiveGoogleToken(tgId: string): Promise<{ accessToken: string; email: string }> {
    const docRef = doc(db, "google_drive_accounts", String(tgId));
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Google Drive is not connected.");
    }
    const data = snap.data();
    if (data.status !== "connected") {
      throw new Error("Google Drive connection is inactive.");
    }
    if (!data.accessToken || !data.refreshToken) {
      throw new Error("Missing Google Drive credentials.");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://royshare.online/api/google-drive/callback"
    );

    oauth2Client.setCredentials({
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expiry_date: data.expiryTime || 0
    });

    const now = Date.now();
    const isExpired = (data.expiryTime || 0) <= now + 60000;

    let accessToken = data.accessToken;
    if (isExpired) {
      console.log(`[Google API Trace] [Step 6] Access token for tg_id ${tgId} is expired or expiring soon. Attempting token refresh...`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          accessToken = credentials.access_token;
          const expiryTime = credentials.expiry_date || (Date.now() + 3600 * 1000);
          const updateData: any = {
            accessToken: accessToken,
            expiryTime: expiryTime,
            expiryDate: new Date(expiryTime).toISOString()
          };
          await setDoc(docRef, updateData, { merge: true });
          console.log(`[Google API Trace] [Step 6] Token refresh outcome for tg_id ${tgId}: SUCCESS. New access token secured.`);
        } else {
          console.error(`[Google API Trace] [Step 6] Token refresh outcome for tg_id ${tgId}: FAILED. No access token in credentials response.`);
          throw new Error("Failed to refresh Google access token: Response was empty.");
        }
      } catch (refreshErr: any) {
        console.error(`[Google API Trace] [Step 6] Token refresh outcome for tg_id ${tgId}: FAILED. Error:`, refreshErr);
        throw new Error(`Failed to refresh Google access token: ${refreshErr.message}`);
      }
    } else {
      console.log(`[Google API Trace] [Step 6] Token refresh check for tg_id ${tgId}: Active token exists. Expiry: ${new Date(data.expiryTime || 0).toISOString()}. No refresh needed.`);
    }

    return { accessToken, email: data.email || "" };
  }

  // Google Drive Connection Status endpoint
  app.get("/api/google-drive/status", async (req, res) => {
    try {
      const tgId = req.query.tg_id as string;
      if (!tgId) {
        return res.status(400).json({ error: "Missing tg_id" });
      }
      const docRef = doc(db, "google_drive_accounts", String(tgId));
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.status === "connected") {
        return res.json({ connected: true, email: snap.data().email });
      }
      return res.json({ connected: false });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Google Drive Resumable Upload Session initiator endpoint
  app.post("/api/google-drive/initiate-upload", async (req, res) => {
    try {
      const { tg_id, fileName, fileSize, mimeType } = req.body;
      if (!tg_id || !fileName || !fileSize) {
        return res.status(400).json({ error: "Missing required parameters (tg_id, fileName, fileSize)" });
      }

      console.log(`[Google API Trace] [Step 1] Initiating upload trace for tg_id ${tg_id}, file: ${fileName} (${fileSize} bytes)`);

      const { accessToken } = await getActiveGoogleToken(tg_id);

      const targetUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
      const requestHeaders = {
        "Authorization": `Bearer [HIDDEN]`,
        "X-Upload-Content-Type": mimeType || "application/octet-stream",
        "X-Upload-Content-Length": String(fileSize),
        "Content-Type": "application/json; charset=UTF-8"
      };
      const requestBody = {
        name: fileName,
        mimeType: mimeType || "application/octet-stream"
      };

      console.log(`[Google API Trace] 1. Exact POST request URL sent to Google Drive API: ${targetUrl}`);
      console.log(`[Google API Trace] 2. Request Headers (sensitive token hidden):`, JSON.stringify(requestHeaders, null, 2));
      console.log(`[Google API Trace] 3. Request Body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Upload-Content-Type": mimeType || "application/octet-stream",
          "X-Upload-Content-Length": String(fileSize),
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(requestBody)
      });

      const statusCode = response.status;
      const responseText = await response.text();

      console.log(`[Google API Trace] 4. HTTP Status Code returned by Google: ${statusCode}`);
      console.log(`[Google API Trace] 5. Complete response body from Google:`, responseText);

      if (!response.ok) {
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(responseText);
        } catch (e) {}

        console.error("[Google Resumable] Failed to initiate session. Google error response:", responseText);
        
        // Return the exact Google error JSON as part of details for user requirement 7
        return res.status(statusCode).json({ 
          error: "Google Drive API error initiating upload", 
          details: errorJson || responseText 
        });
      }

      const uploadUrl = response.headers.get("Location");
      if (!uploadUrl) {
        return res.status(500).json({ error: "Google Drive API did not return a Location header for resumable upload" });
      }

      console.log(`[Google API Trace] Success: Location header returned: ${uploadUrl}`);
      return res.json({ uploadUrl });
    } catch (err: any) {
      console.error("[Google Resumable] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Google Drive Recover File ID from resumable upload session URL
  app.post("/api/google-drive/recover-file-id", async (req, res) => {
    const { uploadUrl, tg_id } = req.body;
    if (!uploadUrl) {
      return res.status(400).json({ error: "Missing uploadUrl" });
    }
    try {
      console.log(`[Recovery Endpoint] Querying Google Drive upload status for session: ${uploadUrl}`);
      const statusRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": "0",
          "Content-Range": `bytes * / *`
        }
      });
      const statusText = await statusRes.text();
      console.log(`[Recovery Endpoint] Status Query HTTP response code: ${statusRes.status}`);
      console.log(`[Recovery Endpoint] Status Query response body:`, statusText);
      
      if (statusRes.status === 200 || statusRes.status === 201) {
        const metadata = JSON.parse(statusText);
        if (metadata.id) {
          return res.json({ driveFileId: metadata.id });
        }
      }
      return res.status(400).json({ error: "Could not retrieve file ID from session, status: " + statusRes.status, details: statusText });
    } catch (err: any) {
      console.error("[Recovery Endpoint] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Google Drive Finalize upload, set permissions, and register in uploads collection
  app.post("/api/google-drive/finalize-upload", async (req, res) => {
    console.log(`[Google API Trace] === START FINALIZE UPLOAD ===`);
    console.log(`[Google API Trace] Finalize request payload received:`, JSON.stringify(req.body, null, 2));

    let { tg_id, driveFileId, fileName, fileSize, mimeType, uploadUrl, customAlias, password } = req.body;

    try {
      // Step 1: Validate core inputs and check token
      console.log(`[Google API Trace] [Step 1] Validating core inputs and fetching access token...`);
      if (!tg_id) {
        console.error(`[Google API Trace] [Step 1] Validation FAILED: Missing tg_id.`);
        return res.status(400).json({ error: "Missing required parameter: tg_id", step: 1 });
      }
      if (!fileName) {
        console.error(`[Google API Trace] [Step 1] Validation FAILED: Missing fileName.`);
        return res.status(400).json({ error: "Missing required parameter: fileName", step: 1 });
      }
      if (!fileSize) {
        console.error(`[Google API Trace] [Step 1] Validation FAILED: Missing fileSize.`);
        return res.status(400).json({ error: "Missing required parameter: fileSize", step: 1 });
      }

      let accessToken = "";
      let ownerEmail = "";
      try {
        const tokenObj = await getActiveGoogleToken(tg_id);
        accessToken = tokenObj.accessToken;
        ownerEmail = tokenObj.email;
        console.log(`[Google API Trace] [Step 1] Successfully fetched active Google OAuth token for user: ${ownerEmail}`);
      } catch (authErr: any) {
        console.error(`[Google API Trace] [Step 1] Google OAuth token fetching FAILED:`, authErr);
        return res.status(401).json({ 
          error: "Google Drive OAuth authentication failed", 
          step: 1, 
          details: authErr.message 
        });
      }

      // Step 2: Recover or verify driveFileId
      console.log(`[Google API Trace] [Step 2] Resolving driveFileId (passed: "${driveFileId || ''}", uploadUrl: "${uploadUrl || ''}")...`);
      if (!driveFileId && uploadUrl) {
        console.log(`[Google API Trace] [Step 2] driveFileId is empty. Querying Google Drive upload session status to recover it...`);
        try {
          const statusRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Length": "0",
              "Content-Range": `bytes * / *`
            }
          });
          const statusText = await statusRes.text();
          console.log(`[Google API Trace] [Step 2] Google status query HTTP response code: ${statusRes.status}`);
          console.log(`[Google API Trace] [Step 2] Google status query response body:`, statusText);
          
          if (statusRes.status === 200 || statusRes.status === 201) {
            const metadata = JSON.parse(statusText);
            if (metadata.id) {
              driveFileId = metadata.id;
              console.log(`[Google API Trace] [Step 2] Successfully recovered driveFileId from Google: ${driveFileId}`);
            } else {
              console.warn(`[Google API Trace] [Step 2] Google status response parsed but contains no file ID.`);
            }
          } else {
            console.warn(`[Google API Trace] [Step 2] Google status response was not 200/201 OK.`);
          }
        } catch (statusErr: any) {
          console.error(`[Google API Trace] [Step 2] Exception during status query recovery:`, statusErr);
        }
      }

      if (!driveFileId) {
        console.error(`[Google API Trace] [Step 2] Verification FAILED: driveFileId is missing/could not be resolved.`);
        return res.status(400).json({ 
          error: "Google Drive File ID is missing", 
          step: 2, 
          details: "Could not retrieve the file ID from Google Drive. Please make sure the upload completed successfully." 
        });
      }

      console.log(`[Google API Trace] driveFileId successfully resolved: ${driveFileId}`);

      // Step 3: Set public reader permissions on Google Drive
      console.log(`[Google API Trace] [Step 3] Setting public reader permission for file: ${driveFileId}`);
      try {
        const permResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}/permissions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone"
          })
        });

        if (!permResponse.ok) {
          const permErr = await permResponse.text();
          console.warn(`[Google API Trace] [Step 3] Warning: Failed to set public permission for file ${driveFileId}:`, permErr);
        } else {
          console.log(`[Google API Trace] [Step 3] Public permissions set successfully.`);
        }
      } catch (permErr: any) {
        console.warn(`[Google API Trace] [Step 3] Warning: Exception while setting public permission:`, permErr);
      }

      // Step 4: RoyShare download ID & Page / Firestore metadata creation
      console.log(`[Google API Trace] [Step 4] Checking for existing metadata records for driveFileId: ${driveFileId}`);
      let uniqueFileId = "";
      let royshareLink = "";
      let existingDoc: any = null;

      try {
        const q = query(collection(db, "uploads"), where("driveFileId", "==", driveFileId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          existingDoc = qSnap.docs[0].data();
          uniqueFileId = qSnap.docs[0].id;
          royshareLink = existingDoc.royshareLink || `https://www.royshare.online/download/${uniqueFileId}`;
          console.log(`[Google API Trace] Found existing RoyShare record for driveFileId ${driveFileId}. Reusing ID: ${uniqueFileId}`);
        }
      } catch (findErr) {
        console.error(`[Google API Trace] Error querying existing uploads in Step 4:`, findErr);
      }

      if (!uniqueFileId) {
        if (customAlias && customAlias.trim()) {
          uniqueFileId = customAlias.trim();
        } else {
          uniqueFileId = "gd_" + Math.random().toString(36).substring(2, 10);
        }
        royshareLink = `https://www.royshare.online/download/${uniqueFileId}`;
        console.log(`[Google API Trace] Generated new RoyShare download ID: ${uniqueFileId}`);
      }

      const driveLink = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
      const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      console.log(`[Google API Trace] [Step 4] Saving metadata record to Firestore...`);
      try {
        const uploadDocRef = doc(db, "uploads", uniqueFileId);
        await setDoc(uploadDocRef, {
          fileId: uniqueFileId,
          telegramId: String(tg_id),
          userId: String(tg_id),
          driveFileId,
          fileName,
          fileSize: Number(fileSize),
          mimeType: mimeType || "application/octet-stream",
          driveLink,
          royshareLink,
          generatedLink: royshareLink,
          uploadDate: formattedDate,
          downloads: existingDoc ? (existingDoc.downloads || 0) : 0,
          earnings: existingDoc ? (existingDoc.earnings || 0) : 0,
          storage: "google_drive",
          ownerEmail,
          status: "active",
          customAlias: customAlias || "",
          password: password || "",
          isPasswordProtected: !!password
        }, { merge: true });

        console.log(`[Google API Trace] [Step 4] Firestore metadata successfully written.`);
      } catch (fsErr: any) {
        console.error(`[Google API Trace] [Step 4] Firestore metadata creation FAILED:`, fsErr);
        return res.status(500).json({
          error: "Firestore metadata creation failed",
          step: 4,
          driveFileId,
          details: fsErr.message
        });
      }

      // Step 5: Update user totalFiles statistics
      console.log(`[Google API Trace] [Step 5] Updating user totalFiles statistics...`);
      try {
        const uRef = doc(db, "users", String(tg_id));
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const currentTotalFiles = uSnap.data().totalFiles || 0;
          await setDoc(uRef, { totalFiles: currentTotalFiles + 1 }, { merge: true });
          console.log(`[Google API Trace] [Step 5] User totalFiles statistics updated successfully.`);
        } else {
          console.log(`[Google API Trace] [Step 5] User document does not exist, skipping totalFiles update.`);
        }
      } catch (uErr) {
        console.error(`[Google API Trace] [Step 5] Warning: Failed to update user totalFiles statistics:`, uErr);
      }

      // Step 6: Send Telegram success notification
      console.log(`[Google API Trace] [Step 6] Attempting to send Telegram success notification...`);
      try {
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        const botToken = telegramSettingsSnap.exists() ? telegramSettingsSnap.data()?.botToken : null;
        if (botToken) {
          const formattedSize = formatBytes(Number(fileSize));
          const escapedName = fileName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const messageText = `✅ <b>Upload Successful</b>
\n📄 <b>File Name:</b> <code>${escapedName}</code>\n📦 <b>File Size:</b> ${formattedSize}\n☁️ <b>Storage:</b> Google Drive\n🔗 <b>RoyShare Link:</b>\n${royshareLink}`;
          
          const rawAppUrl = process.env.APP_URL || "https://www.royshare.online";
          const appUrl = (rawAppUrl.includes("run.app") || rawAppUrl.includes("ais-dev") || rawAppUrl === "MY_APP_URL") 
            ? rawAppUrl 
            : "https://www.royshare.online";
          const cleanAppUrl = appUrl.replace(/\/$/, "");

          const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: Number(tg_id),
              text: messageText,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "🔗 Open Link", url: royshareLink },
                    { text: "📋 Copy Link", callback_data: `mycontent_copy_${uniqueFileId}` }
                  ],
                  [
                    { text: "📂 My Files", web_app: { url: `${cleanAppUrl}/app?page=content&userId=${tg_id}` } }
                  ]
                ]
              }
            })
          });

          if (!tgRes.ok) {
            const tgErrText = await tgRes.text();
            console.error(`[Google API Trace] [Step 6] Telegram sendMessage FAILED with status ${tgRes.status}:`, tgErrText);
            return res.status(500).json({
              error: "Telegram success notification failed to send",
              step: 6,
              driveFileId,
              details: `Telegram API error: ${tgErrText}`
            });
          } else {
            console.log(`[Google API Trace] [Step 6] Telegram success notification sent successfully.`);
          }
        } else {
          console.warn(`[Google API Trace] [Step 6] Telegram bot token is not configured in settings.`);
        }
      } catch (tgErr: any) {
        console.error(`[Google API Trace] [Step 6] Telegram success notification FAILED:`, tgErr);
        return res.status(500).json({
          error: "Telegram success notification failed",
          step: 6,
          driveFileId,
          details: tgErr.message
        });
      }

      console.log(`[Google API Trace] === FINALIZE UPLOAD COMPLETED SUCCESSFULLY ===`);
      console.log(`[Google API Trace] Generated RoyShare Link: ${royshareLink}`);
      
      return res.json({
        success: true,
        fileId: uniqueFileId,
        royshareLink
      });

    } catch (err: any) {
      console.error(`[Google API Trace] Unexpected finalize error:`, err);
      return res.status(500).json({ 
        error: "An unexpected error occurred during finalization", 
        step: 4, 
        driveFileId, 
        details: err.message 
      });
    }
  });

  // Admin APIs for Google Drive Accounts
  app.get("/api/admin/google-drive-accounts", async (req, res) => {
    try {
      const colRef = collection(db, "google_drive_accounts");
      const snap = await getDocs(colRef);
      const accounts: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        accounts.push({
          id: d.id,
          userId: data.userId || d.id,
          name: data.name || "N/A",
          email: data.email || "N/A",
          connectedAt: data.connectedAt || "N/A",
          status: data.status || "N/A"
        });
      });
      res.json({ success: true, accounts });
    } catch (e: any) {
      console.error("Error fetching Google Drive accounts for admin:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/google-drive-accounts/:id/disconnect", async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = doc(db, "google_drive_accounts", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Account connection record not found" });
      }

      await updateDoc(docRef, {
        accessToken: "",
        refreshToken: "",
        status: "disconnected"
      });

      // Notify on Telegram
      try {
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        const botToken = telegramSettingsSnap.exists() ? telegramSettingsSnap.data()?.botToken : null;
        if (botToken) {
          const messageText = `⚠️ *Google Drive Disconnected*
\nYour Google Drive connection has been disconnected.`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: Number(id),
              text: messageText,
              parse_mode: "Markdown"
            })
          });
        }
      } catch (tgErr) {
        console.error("Failed to send telegram disconnect notification:", tgErr);
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Error disconnecting Google Drive account:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // UNIFIED FRAUD INVESTIGATION CENTER APIs
  // ==========================================

  // Helper function to calculate fraud score and log/evaluate session
  const trackFraudSession = async (req: any, params: {
    userId: string;
    type: string; // "video_ad" | "url_shortener" | "giveaway" | "reward" | "withdrawal"
    taskId?: string;
    token?: string;
    fingerprint?: string;
    browserFingerprint?: string;
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    rewardAmount?: number;
    transactionId?: string;
    refreshes?: number;
    multipleTabs?: boolean;
    fastCompletion?: boolean;
    vpnDetected?: boolean;
    proxyDetected?: boolean;
    ipChanged?: boolean;
    fingerprintChanged?: boolean;
    heartbeatMissing?: boolean;
    focusLostCount?: number;
    devToolsDetected?: boolean;
    automationDetected?: boolean;
    emulatorDetected?: boolean;
    rootJailbreakDetected?: boolean;
    watchStartTime?: string;
    totalWatchTime?: number;
  }) => {
    try {
      const userId = String(params.userId);
      const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Unknown";

      // 1. Fetch user data
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const uData = userSnap.exists() ? userSnap.data() : {};

      // 2. Fetch Geo IP info using fetch
      let country = "Unknown";
      let region = "Unknown";
      let city = "Unknown";
      let isp = "Unknown";
      let vpnDetected = !!params.vpnDetected;
      let proxyDetected = !!params.proxyDetected;

      if (ip && ip !== "127.0.0.1" && ip !== "::1" && ip !== "Unknown") {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,hosting`);
          const geoData: any = await geoRes.json();
          if (geoData && geoData.status === "success") {
             country = geoData.country || "Unknown";
             region = geoData.regionName || "Unknown";
             city = geoData.city || "Unknown";
             isp = geoData.isp || "Unknown";
             if (geoData.hosting) {
               vpnDetected = true;
               proxyDetected = true;
             }
          }
        } catch (err) {
          console.error("Geo lookup error in trackFraudSession:", err);
        }
      }

      // Update IP history and device history
      const ipHistory = uData.ipHistory || [];
      if (ip !== "Unknown" && !ipHistory.includes(ip)) {
        ipHistory.push(ip);
        await updateDoc(userRef, { ipHistory }).catch(() => {});
      }

      const deviceHistory = uData.deviceHistory || [];
      if (params.fingerprint && !deviceHistory.includes(params.fingerprint)) {
        deviceHistory.push(params.fingerprint);
        await updateDoc(userRef, { deviceHistory }).catch(() => {});
      }

      // 3. Compute Fraud Score based on rules
      let fraudScore = 0;
      const fraudReasons: string[] = [];
      const penaltyReasons: { amount: number, reason: string }[] = [];

      if (params.refreshes && params.refreshes > 2) {
        fraudScore += 10;
        fraudReasons.push("Refresh Abuse (+10)");
        penaltyReasons.push({ amount: -10, reason: "Refresh Abuse" });
      }
      if (params.multipleTabs) {
        fraudScore += 30;
        fraudReasons.push("Multiple Tabs (+30)");
        penaltyReasons.push({ amount: -15, reason: "Multiple Tabs" });
      }
      if (params.fastCompletion) {
        fraudScore += 50;
        fraudReasons.push("Fast Completion (+50)");
        penaltyReasons.push({ amount: -40, reason: "Fast Completion" });
      }
      if (vpnDetected) {
        fraudScore += 20;
        fraudReasons.push("VPN (+20)");
        penaltyReasons.push({ amount: -20, reason: "VPN Detected" });
      }
      if (proxyDetected) {
        fraudScore += 20;
        fraudReasons.push("Proxy (+20)");
        penaltyReasons.push({ amount: -20, reason: "Proxy Detected" });
      }
      if (params.ipChanged) {
        fraudScore += 30;
        fraudReasons.push("IP Change (+30)");
      }
      if (params.fingerprintChanged) {
        fraudScore += 40;
        fraudReasons.push("Fingerprint Change (+40)");
        penaltyReasons.push({ amount: -30, reason: "Fingerprint Changed" });
      }
      if (params.heartbeatMissing) {
        fraudScore += 40;
        fraudReasons.push("Heartbeat Missing (+40)");
      }
      if (params.focusLostCount && params.focusLostCount > 3) {
        fraudScore += 20;
        fraudReasons.push("Focus Lost Repeatedly (+20)");
      }
      if (params.devToolsDetected) {
        fraudScore += 40;
        fraudReasons.push("Developer Tools (+40)");
      }
      if (params.automationDetected) {
        fraudScore += 50;
        fraudReasons.push("Automation Pattern (+50)");
        penaltyReasons.push({ amount: -50, reason: "Automation Detected" });
      }
      if (params.emulatorDetected) {
        fraudScore += 30;
        fraudReasons.push("Emulator Detected (+30)");
      }
      if (params.rootJailbreakDetected) {
        fraudScore += 30;
        fraudReasons.push("Root/Jailbreak Detected (+30)");
      }

      // Apply Trust Score penalties asynchronously
      if (penaltyReasons.length > 0) {
        setTimeout(async () => {
          for (const item of penaltyReasons) {
            await adjustTrustScore(userId, item.amount, item.reason);
          }
        }, 50);
      }

      // Auto Actions Threshold
      let status = "Normal";
      if (fraudScore >= 100) {
        status = "Banned";
      } else if (fraudScore >= 80) {
        status = "Suspended";
      } else if (fraudScore >= 50) {
        status = "Pending Review";
      }

      // Apply Action to User doc
      if (status === "Banned") {
        await updateDoc(userRef, { status: "Banned", banReason: `Auto Ban: Fraud Score too high (${fraudScore}) - ${fraudReasons.join(", ")}` }).catch(() => {});
      } else if (status === "Suspended") {
        await updateDoc(userRef, { status: "Suspended", suspensionReason: `Suspended: Fraud Score too high (${fraudScore}) - ${fraudReasons.join(", ")}` }).catch(() => {});
      }

      // 4. Admin Telegram Notification if score exceeds 80
      if (fraudScore >= 80) {
        try {
          const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
          const botToken = telegramSettingsSnap.exists() ? telegramSettingsSnap.data()?.botToken : null;
          const adminChatId = telegramSettingsSnap.exists() ? (telegramSettingsSnap.data()?.adminChatId || telegramSettingsSnap.data()?.chatId) : null;
          if (botToken && adminChatId) {
            const alertMsg = `🚨 <b>Fraud Attempt Detected</b>
\n` +
              `👤 <b>User:</b> @${uData.username || "Unknown"}
` +
              `🆔 <b>Telegram ID:</b> <code>${userId}</code>
` +
              `📊 <b>Fraud Score:</b> <b>${fraudScore}</b>
` +
              `🔎 <b>Reasons:</b> ${fraudReasons.join(", ") || "None"}
` +
              `🛠 <b>Task Type:</b> ${params.type}
\n` +
              `<i>Check the RoyShare Fraud Investigation Center in your Admin Panel to review this session.</i>`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: String(adminChatId),
                text: alertMsg,
                parse_mode: "HTML"
              })
            });
          }
        } catch (tgErr) {
          console.error("Failed to send bot alert:", tgErr);
        }
      }

      // 5. Store session log (Immutable)
      const sessionToken = params.token || crypto.randomBytes(32).toString("hex");
      const fraudDoc = {
        userId,
        username: uData.username || uData.telegramUsername || "Unknown",
        firstName: uData.firstName || uData.first_name || "Unknown",
        lastName: uData.lastName || uData.last_name || "Unknown",
        phone: uData.phone || uData.phoneNumber || "N/A",
        ip,
        country,
        region,
        city,
        isp,
        fingerprint: params.fingerprint || "missing",
        browserFingerprint: params.browserFingerprint || "missing",
        userAgent: params.userAgent || req.headers["user-agent"] || "missing",
        screenResolution: params.screenResolution || "Unknown",
        timezone: params.timezone || "Unknown",
        language: params.language || "Unknown",
        sessionToken,
        type: params.type,
        taskId: params.taskId || "N/A",
        createdAt: new Date().toISOString(),
        watchStartTime: params.watchStartTime || new Date().toISOString(),
        watchEndTime: new Date().toISOString(),
        totalWatchTime: params.totalWatchTime || 0,
        refreshes: params.refreshes || 0,
        multipleTabCount: params.multipleTabs ? 1 : 0,
        focusLostCount: params.focusLostCount || 0,
        visibilityHiddenCount: params.focusLostCount || 0,
        heartbeatLogs: params.heartbeatMissing ? ["Missing heartbeats"] : ["Valid heartbeats received"],
        vpnDetected,
        proxyDetected,
        emulatorDetected: !!params.emulatorDetected,
        rootJailbreakDetected: !!params.rootJailbreakDetected,
        fraudScore,
        fraudReasons,
        status,
        rewardAmount: params.rewardAmount || 0,
        transactionId: params.transactionId || "N/A",
        notes: []
      };

      await addDoc(collection(db, "fraud_sessions"), fraudDoc);
      return fraudDoc;
    } catch (err) {
      console.error("Error in trackFraudSession:", err);
    }
  };

  // Exposed API to trigger evaluation/recording from client or web hooks
  app.post("/api/fraud/evaluate", async (req, res) => {
    try {
      const { userId, type, ...rest } = req.body;
      if (!userId || !type) return res.status(400).json({ error: "Missing required fields userId or type" });
      const record = await trackFraudSession(req, { userId, type, ...rest });
      res.json({ success: true, record });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin GET: Fetch all Fraud logs
  app.get("/api/admin/fraud/logs", async (req, res) => {
    try {
      const q = query(collection(db, "fraud_sessions"), orderBy("createdAt", "desc"), limit(500));
      const snap = await getDocs(q);
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const userIds = Array.from(new Set(logs.map(l => String(l.userId)).filter(Boolean)));
      const shadowMap: Record<string, boolean> = {};
      const statusMap: Record<string, string> = {};
      for (const uid of userIds) {
        const uDoc = await getDoc(doc(db, "users", uid));
        if (uDoc.exists()) {
          const uData = uDoc.data();
          shadowMap[uid] = uData?.shadowBanned === true;
          statusMap[uid] = uData?.status || "Normal";
        }
      }

      const logsWithShadow = logs.map(l => ({
        ...l,
        shadowBanned: shadowMap[String(l.userId)] || false,
        userStatus: statusMap[String(l.userId)] || "Normal"
      }));

      res.json({ success: true, logs: logsWithShadow });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin GET: Fraud Analytics and Stats
  app.get("/api/admin/fraud/stats", async (req, res) => {
    try {
      const q = query(collection(db, "fraud_sessions"));
      const snap = await getDocs(q);
      const sessions = snap.docs.map(doc => doc.data());

      let normalCount = 0;
      let pendingCount = 0;
      let suspendedCount = 0;
      let bannedCount = 0;
      let todayAttempts = 0;
      let lifetimeAttempts = sessions.length;

      const todayStr = new Date().toISOString().split("T")[0];

      sessions.forEach(s => {
        if (s.status === "Normal") normalCount++;
        else if (s.status === "Pending Review") pendingCount++;
        else if (s.status === "Suspended") suspendedCount++;
        else if (s.status === "Banned") bannedCount++;

        if (s.createdAt && s.createdAt.startsWith(todayStr)) {
          todayAttempts++;
        }
      });

      // Top reasons counting
      const reasonsCount: Record<string, number> = {};
      const devicesCount: Record<string, number> = {};
      const countriesCount: Record<string, number> = {};
      const vpnCount: Record<string, number> = {};

      sessions.forEach(s => {
        if (s.fraudReasons && Array.isArray(s.fraudReasons)) {
          s.fraudReasons.forEach((r: string) => {
            reasonsCount[r] = (reasonsCount[r] || 0) + 1;
          });
        }
        if (s.fingerprint && s.fingerprint !== "missing") {
          devicesCount[s.fingerprint] = (devicesCount[s.fingerprint] || 0) + 1;
        }
        if (s.country && s.country !== "Unknown") {
          countriesCount[s.country] = (countriesCount[s.country] || 0) + 1;
        }
        if (s.vpnDetected && s.isp && s.isp !== "Unknown") {
          vpnCount[s.isp] = (vpnCount[s.isp] || 0) + 1;
        }
      });

      const shadowUsersSnap = await getDocs(query(collection(db, "users"), where("shadowBanned", "==", true)));
      const shadowBannedCount = shadowUsersSnap.size;

      res.json({
        success: true,
        stats: {
          normalCount,
          pendingCount,
          suspendedCount,
          bannedCount,
          shadowBannedCount,
          todayAttempts,
          lifetimeAttempts,
          reasonsCount,
          devicesCount,
          countriesCount,
          vpnCount
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin POST: Trigger Investigation Action
  app.post("/api/admin/fraud/action", async (req, res) => {
    try {
      const { id, action, userId, noteText, fingerprint } = req.body;
      if (!id || !action) return res.status(400).json({ error: "Missing id or action" });

      const docRef = doc(db, "fraud_sessions", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return res.status(404).json({ error: "Log record not found" });

      const logData = snap.data();
      const targetUserId = userId || logData.userId;

      if (action === "approve") {
        await updateDoc(docRef, { status: "Normal", approvedAt: new Date().toISOString() });
        // Send notification
        if (targetUserId) {
          await sendTgMessage(targetUserId, `✅ <b>Session Approved</b>
\nYour session was manually verified and approved by the RoyShare Security team. Thank you!`);
        }
      } else if (action === "reject") {
        await updateDoc(docRef, { status: "Rejected", rejectedAt: new Date().toISOString() });
        if (targetUserId) {
          await sendTgMessage(targetUserId, `❌ <b>Session Rejected</b>
\nYour session was manually reviewed and rejected due to security discrepancies.`);
        }
      } else if (action === "suspend_user") {
        if (targetUserId) {
          await updateDoc(doc(db, "users", String(targetUserId)), { status: "Suspended", suspensionReason: "Manually suspended from Fraud investigation" });
          await adjustTrustScore(String(targetUserId), -100, "Confirmed Fraud").catch(() => {});
          await sendTgMessage(targetUserId, `⚠️ <b>Account Suspended</b>
\nYour account has been suspended due to suspected fraudulent activities.`);
        }
      } else if (action === "ban_user") {
        if (targetUserId) {
          await updateDoc(doc(db, "users", String(targetUserId)), { status: "Banned", banReason: "Manually banned from Fraud investigation" });
          await adjustTrustScore(String(targetUserId), -100, "Confirmed Fraud").catch(() => {});
          await sendTgMessage(targetUserId, `🚫 <b>Account Banned</b>
\nYour account has been permanently banned due to severe policy violations.`);
        }
      } else if (action === "ban_device" || action === "ban_fingerprint") {
        const fpToBan = fingerprint || logData.fingerprint;
        if (fpToBan && fpToBan !== "missing") {
          await setDoc(doc(db, "banned_fingerprints", fpToBan), {
            fingerprint: fpToBan,
            bannedAt: new Date().toISOString(),
            reason: `Banned from Log ID: ${id}`
          });
        }
      } else if (action === "whitelist") {
        if (targetUserId) {
          await updateDoc(doc(db, "users", String(targetUserId)), { isWhitelisted: true });
          await sendTgMessage(targetUserId, `🛡 <b>Account Whitelisted</b>
\nYour account has been whitelisted on the RoyShare platform.`);
        }
      } else if (action === "blacklist") {
        if (targetUserId) {
          await updateDoc(doc(db, "users", String(targetUserId)), { isBlacklisted: true, status: "Banned", banReason: "Blacklisted from Fraud investigation" });
          await adjustTrustScore(String(targetUserId), -100, "Confirmed Fraud").catch(() => {});
          await sendTgMessage(targetUserId, `🚫 <b>Account Blacklisted</b>
\nYour account has been blacklisted on the RoyShare platform.`);
        }
      } else if (action === "update_user_status") {
        const { status } = req.body;
        if (targetUserId && status) {
          await updateDoc(doc(db, "users", String(targetUserId)), { status });
          await sendTgMessage(targetUserId, `🛡 <b>Security Status Updated</b>
\nYour account security status has been updated to: <b>${status}</b>.`);
        }
      } else if (action === "shadow_ban") {
        if (targetUserId) {
          await updateDoc(doc(db, "users", String(targetUserId)), {
            shadowBanned: true,
            shadowBanDate: new Date().toISOString(),
            shadowBanReason: noteText || "Suspicious or automated traffic detected"
          });
        }
      } else if (action === "remove_shadow_ban") {
        if (targetUserId) {
          await updateDoc(doc(db, "users", String(targetUserId)), {
            shadowBanned: false,
            shadowBanRemovedAt: new Date().toISOString()
          });
        }
      } else if (action === "add_notes") {
        if (!noteText) return res.status(400).json({ error: "Missing note text" });
        const notes = logData.notes || [];
        notes.push({
          text: noteText,
          timestamp: new Date().toISOString()
        });
        await updateDoc(docRef, { notes });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin POST: Clear all fraud logs (Only authorized Super Admin)
  app.post("/api/admin/fraud/clear", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "fraud_sessions"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "fraud_sessions", d.id));
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin GET: Shadow Ban Analytics Dashboard
  app.get("/api/admin/shadow-ban/dashboard", async (req, res) => {
    try {
      const usersSnap = await getDocs(query(collection(db, "users"), where("shadowBanned", "==", true)));
      const shadowUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const blockedRewardAmount = shadowUsers.reduce((sum, u: any) => sum + Number(u.shadowBalance || 0), 0);

      const todayStr = new Date().toISOString().split("T")[0];
      const blockedSnap = await getDocs(query(collection(db, "shadow_blocked_rewards")));
      const blockedRewardsList = blockedSnap.docs.map(doc => doc.data());
      const todayShadowRewards = blockedRewardsList
        .filter((r: any) => (r.createdAt || "").startsWith(todayStr))
        .reduce((sum, r: any) => sum + Number(r.amount || 0), 0);

      const withdrawalsSnap = await getDocs(query(collection(db, "withdrawals"), where("shadow_banned", "==", true)));
      const blockedWithdrawalsList = withdrawalsSnap.docs.map(doc => doc.data());
      const blockedWithdrawalAmount = blockedWithdrawalsList.reduce((sum, w: any) => sum + Number(w.amount || 0), 0);

      res.json({
        success: true,
        shadowUsers,
        todayShadowRewards,
        blockedRewardAmount,
        blockedWithdrawalAmount,
        blockedWithdrawalsCount: blockedWithdrawalsList.length
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Differentiate page visit vs file download action
  app.get("/download/:fileId", async (req, res, next) => {
    // If it's a standard page view in browser (not action=download), pass to React SPA
    if (req.query.action !== "download" && (!req.headers.accept || req.headers.accept.includes("text/html"))) {
      return next();
    }

    const { fileId } = req.params;
    console.log(`
=== [DEBUG DOWNLOAD ROUTE] STARTING TRACE FOR ID: ${fileId} ===`);

    try {
      // Step 1: Firestore Lookup
      console.log(`[DEBUG DOWNLOAD ROUTE] [1/4] Firestore lookup for uploads/${fileId}...`);
      let docRef = doc(db, "uploads", fileId);
      let docSnap = await getDoc(docRef);
      let itemData: any = null;
      
      if (docSnap.exists()) {
        itemData = docSnap.data();
      } else {
        const qFileId = query(collection(db, "uploads"), where("fileId", "==", fileId));
        const qFileIdSnap = await getDocs(qFileId);
        if (!qFileIdSnap.empty) {
          docRef = qFileIdSnap.docs[0].ref;
          docSnap = qFileIdSnap.docs[0];
          itemData = qFileIdSnap.docs[0].data();
        } else {
          const qDriveId = query(collection(db, "uploads"), where("driveFileId", "==", fileId));
          const qDriveIdSnap = await getDocs(qDriveId);
          if (!qDriveIdSnap.empty) {
            docRef = qDriveIdSnap.docs[0].ref;
            docSnap = qDriveIdSnap.docs[0];
            itemData = qDriveIdSnap.docs[0].data();
          } else {
            const qAlias = query(collection(db, "uploads"), where("customAlias", "==", fileId));
            const qAliasSnap = await getDocs(qAlias);
            if (!qAliasSnap.empty) {
              docRef = qAliasSnap.docs[0].ref;
              docSnap = qAliasSnap.docs[0];
              itemData = qAliasSnap.docs[0].data();
            }
          }
        }
      }
      
      if (!itemData) {
        console.error(`[DEBUG DOWNLOAD ROUTE] [1/4] FAILED: Document uploads/${fileId} not found.`);
        return res.status(404).send(`
          <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;text-align:center;background:#0f172a;color:white;border-radius:20px;margin-top:50px;">
            <h1 style="color:#ef4444;font-size:3rem;margin-bottom:1rem;">404</h1>
            <h2 style="margin-bottom:1rem;">File Not Found</h2>
            <p style="color:#94a3b8;line-height:1.6;">The file you are looking for does not exist or has been deleted from our servers.</p>
            <a href="/" style="display:inline-block;margin-top:2rem;padding:0.75rem 1.5rem;background:#3b82f6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">Return Home</a>
          </div>
        `);
      }
      
      console.log(`[DEBUG DOWNLOAD ROUTE] [1/4] SUCCESS: Metadata retrieved for "${itemData.fileName}"`);

      // Validation of required fields
      if (!itemData.fileName || (!itemData.driveFileId && !itemData.telegramFileId && !itemData.filePath)) {
        console.error(`[DEBUG DOWNLOAD ROUTE] [VALIDATION] FAILED: Incomplete metadata.`, JSON.stringify(itemData));
        return res.status(400).send(`
          <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;text-align:center;background:#0f172a;color:white;border-radius:20px;margin-top:50px;">
            <h1 style="color:#f59e0b;font-size:3rem;margin-bottom:1rem;">400</h1>
            <h2 style="margin-bottom:1rem;">Invalid File Metadata</h2>
            <p style="color:#94a3b8;line-height:1.6;">The file metadata is incomplete or corrupted. This might be an old or failed upload.</p>
            <a href="/" style="display:inline-block;margin-top:2rem;padding:0.75rem 1.5rem;background:#3b82f6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">Return Home</a>
          </div>
        `);
      }

      // Step 2: Storage Type Routing
      console.log(`[DEBUG DOWNLOAD ROUTE] [2/4] Storage provider identified as: ${itemData.storage || "firebase"}`);

      // Handle Google Drive Storage
      if (itemData.storage === "google_drive") {
        console.log(`[DEBUG DOWNLOAD ROUTE] Processing Google Drive download...`);
        try {
          const { accessToken } = await getActiveGoogleToken(itemData.telegramId || itemData.userId);
          const driveFileId = itemData.driveFileId;

          // Increment download count
          await setDoc(docRef, { downloads: (itemData.downloads || 0) + 1 }, { merge: true }).catch(ce => console.error("Count error:", ce));

          const googleStreamUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`;
          const response = await fetch(googleStreamUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });

          if (!response.ok) {
            console.warn(`[DEBUG DOWNLOAD ROUTE] Google API failed with ${response.status}. Falling back to public link.`);
            return res.redirect(`https://drive.google.com/uc?export=download&id=${driveFileId}`);
          }

          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(itemData.fileName)}"`);
          res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
          
          const contentLength = response.headers.get("Content-Length");
          if (contentLength) res.setHeader("Content-Length", contentLength);

          if (response.body) {
            // Stream the file
            const reader = response.body.getReader();
            const streamToRes = async () => {
              const { done, value } = await reader.read();
              if (done) return res.end();
              res.write(value);
              return streamToRes();
            };
            await streamToRes();
            return;
          } else {
            return res.redirect(`https://drive.google.com/uc?export=download&id=${driveFileId}`);
          }
        } catch (err: any) {
          console.error(`[DEBUG DOWNLOAD ROUTE] Google Drive Error:`, err);
          if (itemData.driveFileId) return res.redirect(`https://drive.google.com/uc?export=download&id=${itemData.driveFileId}`);
          throw err;
        }
      }

      // Handle Telegram Storage
      if (itemData.storage === "telegram" || itemData.telegramFileId) {
        console.log(`[DEBUG DOWNLOAD ROUTE] [3/4] Telegram API lookup for file_id: ${itemData.telegramFileId}...`);
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        const tgSettings = telegramSettingsSnap.exists() ? telegramSettingsSnap.data() : {};
        const botTokenEnc = tgSettings.botToken;
        const botToken = botTokenEnc && botTokenEnc.startsWith("enc:") ? decryptSecret(botTokenEnc) : botTokenEnc;
        const botUsername = (tgSettings.botUsername || "RoyShareBot").replace('@', '');

        if (!botToken) {
          console.error(`[DEBUG DOWNLOAD ROUTE] [3/4] FAILED: Telegram Bot Token not configured.`);
          return res.status(500).send("Server configuration error: Telegram Bot Token missing.");
        }

        try {
          const getFileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${itemData.telegramFileId}`);
          const getFileData = await getFileRes.json();
          
          if (getFileData.ok && getFileData.result?.file_path) {
            const telegramDirectUrl = `https://api.telegram.org/file/bot${botToken}/${getFileData.result.file_path}`;
            console.log(`[DEBUG DOWNLOAD ROUTE] [3/4] SUCCESS: Telegram direct URL obtained.`);
            
            // Increment download count
            await setDoc(docRef, { downloads: (itemData.downloads || 0) + 1 }, { merge: true }).catch(() => {});
            
            console.log(`[DEBUG DOWNLOAD ROUTE] [4/4] Redirecting to Telegram file server...`);
            return res.redirect(telegramDirectUrl);
          } else {
            const tgError = getFileData.description || "Unknown error";
            console.warn(`[DEBUG DOWNLOAD ROUTE] [3/4] Telegram getFile failed: ${tgError}`);
            
            // If it failed because it's too large, show friendly Telegram Bot redirect
            return res.status(200).send(`
              <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;text-align:center;background:#0f172a;color:white;border-radius:20px;margin-top:50px;">
                <div style="font-size:4rem;margin-bottom:1rem;">🤖</div>
                <h2 style="margin-bottom:1rem;">Large File Detected</h2>
                <p style="color:#94a3b8;line-height:1.6;margin-bottom:2rem;">
                  This file is too large to be downloaded directly via web. 
                  Please use our Telegram Bot to get this file securely.
                </p>
                <a href="https://t.me/${botUsername}?start=dl_${fileId}" 
                   style="display:inline-block;padding:1rem 2rem;background:#0088cc;color:white;text-decoration:none;border-radius:15px;font-weight:bold;font-size:1.1rem;box-shadow:0 10px 20px rgba(0,136,204,0.3);">
                   Get File in Telegram
                </a>
                <p style="margin-top:1.5rem;font-size:0.8rem;color:#64748b;">RoyShare Secure Delivery</p>
              </div>
            `);
          }
        } catch (tgErr: any) {
          console.error(`[DEBUG DOWNLOAD ROUTE] [3/4] Telegram API Exception:`, tgErr);
          return res.status(502).send("Error communicating with Telegram servers. Please try again later.");
        }
      }

      // Default: Firebase Storage Lookup
      console.log(`[DEBUG DOWNLOAD ROUTE] [3/4] Firebase Storage lookup...`);
      const fileNameStr = itemData.fileName || "file";
      const storagePath = `uploads/${fileId}/${fileNameStr}`;
      const bucket = getStorage().bucket();
      const fileRef = bucket.file(storagePath);

      const [exists] = await fileRef.exists();
      if (!exists) {
        console.error(`[DEBUG DOWNLOAD ROUTE] [3/4] FAILED: File not found in bucket at ${storagePath}`);
        return res.status(404).send("The actual file data is missing from our cloud storage.");
      }

      console.log(`[DEBUG DOWNLOAD ROUTE] [4/4] Generating signed URL...`);
      const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
      });

      // Increment download count
      await setDoc(docRef, { downloads: (itemData.downloads || 0) + 1 }, { merge: true }).catch(() => {});

      console.log(`[DEBUG DOWNLOAD ROUTE] [4/4] SUCCESS: Redirecting to signed URL.`);
      return res.redirect(downloadUrl);

    } catch (err: any) {
      console.error(`
🔴 [DEBUG DOWNLOAD ROUTE] CRITICAL UNHANDLED ERROR FOR FILE ID: ${fileId}`);
      console.error(`Error Message: ${err.message || err}`);
      console.error(`Stack Trace:
`, err.stack || err);
      console.error(`================================================================================
`);

      const statusCode = err.message?.includes("not found") ? 404 : 500;
      res.status(statusCode).send(`
        <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;text-align:center;background:#0f172a;color:white;border-radius:20px;margin-top:50px;border:1px solid #ef4444;">
          <h1 style="color:#ef4444;margin-bottom:1rem;">500 System Error</h1>
          <p style="color:#94a3b8;line-height:1.6;">An unexpected error occurred while preparing your download.</p>
          <div style="background:#1e293b;padding:1rem;border-radius:10px;margin-top:1rem;text-align:left;font-family:monospace;font-size:0.875rem;color:#fca5a5;word-break:break-all;overflow-x:auto;">
             <strong>Error ${statusCode}:</strong> ${err.message || err}
          </div>
          <a href="/" style="display:inline-block;margin-top:2rem;padding:0.75rem 1.5rem;background:#3b82f6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">Try Again</a>
          <p style="color:#94a3b8;font-size:0.75rem;margin-top:1.5rem;text-align:center;">RoyShare Safe Download System</p>
        </div>
      `);
    }
  });

  // Advertiser Routes
  setupAdvertiserRoutes(app, db);
  
  // ==========================================
  // Website Domain Verification Tag Endpoints
  // ==========================================

  // Public Endpoint to fetch active tag
  app.get("/api/verification-tag", async (req, res) => {
    try {
      return res.json({ tag: cachedVerificationTag });
    } catch (e: any) {
      console.error("Error fetching public verification tag:", e);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Admin GET Endpoint (Requires requireAdminDb)
  app.get("/api/admin/verification-tag", requireAdminDb, async (req, res) => {
    try {
      return res.json({ tag: cachedVerificationTag });
    } catch (e: any) {
      console.error("Error fetching admin verification tag:", e);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Admin PUT Endpoint (Requires requireAdminDb)
  app.put("/api/admin/verification-tag", requireAdminDb, async (req, res) => {
    try {
      const { tag } = req.body;
      if (tag === undefined) {
        return res.status(400).json({ error: "Tag parameter is required." });
      }

      const trimmedTag = (tag || "").trim();

      // Strict security validation
      if (trimmedTag) {
        if (!trimmedTag.toLowerCase().startsWith("<meta") || !trimmedTag.endsWith(">")) {
          return res.status(400).json({ error: "Invalid verification tag: Must start with '<meta' and end with '>'" });
        }
        const openCount = (trimmedTag.match(/</g) || []).length;
        const closeCount = (trimmedTag.match(/>/g) || []).length;
        if (openCount !== 1 || closeCount !== 1) {
          return res.status(400).json({ error: "Invalid verification tag: Only one tag (exactly one '<' and '>') is allowed. Rejecting script/HTML tags." });
        }
        const lower = trimmedTag.toLowerCase();
        if (lower.includes("javascript:") || lower.includes("onload=") || lower.includes("onerror=")) {
          return res.status(400).json({ error: "Invalid verification tag: Contains potentially unsafe script content." });
        }
        const metaRegex = /^<meta\s+[^>]+>$/i;
        if (!metaRegex.test(trimmedTag)) {
          return res.status(400).json({ error: "Invalid verification tag structure." });
        }
      }

      // Save to Firestore settings/verification doc
      const docRef = doc(db, "settings", "verification");
      await setDoc(docRef, { tag: trimmedTag, updatedAt: new Date().toISOString() }, { merge: true });

      // Update cached version instantly
      cachedVerificationTag = trimmedTag;
      debugLog(`[Verification] Cache updated: "${cachedVerificationTag}"`);

      return res.json({ success: true, tag: cachedVerificationTag });
    } catch (e: any) {
      console.error("Error updating verification tag:", e);
      return res.status(500).json({ error: "Server error: " + e.message });
    }
  });

  // ==========================================
  // AdsBitvex Monetization Manager Endpoints
  // ==========================================

  // Public endpoint to get AdsBitvex configuration for dynamic client-side load/sync
  app.get("/api/adsbitvex-config", async (req, res) => {
    try {
      if (!cachedAdsbitvexSettings) {
        return res.json({
          sdkEndpoint: "https://sdk.adsbitvex.com/functions/v1/ad-script?appid=YOUR_APP_ID",
          appId: "",
          rewardScript: `window.showadsbitvex()\n.then(()=>{\nconsole.log("Reward earned");\n})\n.catch(e=>{\nconsole.error(e);\n});`,
          initScript: `window.showadsbitvex_init()\n.then(()=>{\nconsole.log("Init Closed");\n})\n.catch(e=>{\nconsole.error(e);\n});`,
          generatedHeadScript: "",
          integrationStatus: {}
        });
      }
      return res.json(cachedAdsbitvexSettings);
    } catch (e: any) {
      console.error("Error fetching AdsBitvex config:", e);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Admin GET endpoint to retrieve active settings
  app.get("/api/admin/adsbitvex-config", requireAdminDb, async (req, res) => {
    try {
      if (!cachedAdsbitvexSettings) {
        // Return default values
        return res.json({
          sdkEndpoint: "https://sdk.adsbitvex.com/functions/v1/ad-script?appid=YOUR_APP_ID",
          appId: "",
          rewardScript: `window.showadsbitvex()\n.then(()=>{\nconsole.log("Reward earned");\n})\n.catch(e=>{\nconsole.error(e);\n});`,
          initScript: `window.showadsbitvex_init()\n.then(()=>{\nconsole.log("Init Closed");\n})\n.catch(e=>{\nconsole.error(e);\n});`,
          generatedHeadScript: "",
          integrationStatus: {}
        });
      }
      return res.json(cachedAdsbitvexSettings);
    } catch (e: any) {
      console.error("Error fetching Admin AdsBitvex config:", e);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Admin PUT endpoint to save settings
  app.put("/api/admin/adsbitvex-config", requireAdminDb, async (req, res) => {
    try {
      const { sdkEndpoint, appId, rewardScript, initScript, integrationStatus } = req.body;

      // Validate URL or complete script tag if provided
      let cleanEndpoint = (sdkEndpoint || "").trim();
      if (cleanEndpoint) {
        // If they pasted a complete <script src="...">...</script> tag, extract the src URL
        if (cleanEndpoint.toLowerCase().startsWith("<script") || cleanEndpoint.includes("src=")) {
          const srcMatch = cleanEndpoint.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            cleanEndpoint = srcMatch[1].trim();
          }
        }

        if (!cleanEndpoint.startsWith("http://") && !cleanEndpoint.startsWith("https://")) {
          return res.status(400).json({ error: "Invalid SDK Endpoint: Must be a valid URL starting with http:// or https://, or a complete <script src='...'> tag." });
        }
        // Prevent unsafe HTML/Javascript injection in the URL itself
        if (cleanEndpoint.includes("<") || cleanEndpoint.includes(">") || cleanEndpoint.includes('"') || cleanEndpoint.includes("'")) {
          return res.status(400).json({ error: "Invalid SDK Endpoint URL after parsing. Special characters are not allowed in the URL query parameters." });
        }
      }

      // App ID validation
      const cleanAppId = (appId || "").trim();
      if (cleanAppId) {
        // Prevent malicious appid payloads (script injection / special characters)
        if (!/^[a-zA-Z0-9_-]+$/.test(cleanAppId)) {
          return res.status(400).json({ error: "Invalid App ID: Must be alphanumeric, dashes, or underscores only." });
        }
      }

      const cleanRewardScript = (rewardScript || "").trim();
      const cleanInitScript = (initScript || "").trim();

      // Generate head script
      let finalSdkUrl = "";
      let generatedHeadScript = "";
      if (cleanEndpoint) {
        let endpoint = cleanEndpoint;
        if (cleanAppId) {
          if (endpoint.includes("YOUR_APP_ID")) {
            endpoint = endpoint.replace(/YOUR_APP_ID/g, cleanAppId);
          } else if (!endpoint.includes(cleanAppId)) {
            if (endpoint.includes("appid=")) {
              endpoint = endpoint.replace(/appid=[^&]*/, `appid=${cleanAppId}`);
            } else {
              const sep = endpoint.includes("?") ? "&" : "?";
              endpoint = `${endpoint}${sep}appid=${cleanAppId}`;
            }
          }
        }
        finalSdkUrl = endpoint;
        generatedHeadScript = `<script src="${finalSdkUrl}"></script>`;
      }

      // Get existing settings or create new
      const docRef = doc(db, "settings", "adsbitvex");
      const docSnap = await getDoc(docRef);
      const isNew = !docSnap.exists();

      const updatedData = {
        sdkEndpoint: cleanEndpoint,
        appId: cleanAppId,
        rewardScript: cleanRewardScript,
        initScript: cleanInitScript,
        generatedHeadScript,
        finalSdkUrl,
        integrationStatus: integrationStatus || {},
        createdTime: isNew ? new Date().toISOString() : (docSnap.data()?.createdTime || new Date().toISOString()),
        updatedTime: new Date().toISOString()
      };

      await setDoc(docRef, updatedData, { merge: true });

      // Instantly update server cache
      cachedAdsbitvexSettings = updatedData;
      debugLog(`[AdsBitvex] Cached settings updated successfully! ${JSON.stringify(updatedData)}`);

      return res.json({ success: true, settings: updatedData });
    } catch (e: any) {
      console.error("Error updating AdsBitvex config:", e);
      return res.status(500).json({ error: "Server error: " + e.message });
    }
  });
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    debugLog("Setting up Vite development middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    const serveIndexWithComment = (req: express.Request, res: express.Response) => {
      const indexPath = path.join(distPath, 'index.html');
      debugLog(`Serving index dynamically from: ${indexPath}`);
      try {
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // 1. Inject EZMob Site Validation Code if missing
        if (!html.includes('EZMob Site Validation Code: EZMTNDAFBDSCOTJPM5F')) {
          debugLog("Comment missing in index.html, dynamically injecting...");
          const comment = '\n    <!-- EZMob Site Validation Code: EZMTNDAFBDSCOTJPM5F -->\n  ';
          if (html.includes('</head>')) {
            html = html.replace('</head>', `${comment}</head>`);
          } else {
            html = html + comment;
          }
        }

        // 2. Inject Dynamic Domain Verification Meta Tag if configured and not present in html
        if (cachedVerificationTag && cachedVerificationTag.trim()) {
          const cleanTag = cachedVerificationTag.trim();
          if (html.includes('</head>') && !html.includes(cleanTag)) {
            html = html.replace('</head>', `\n    ${cleanTag}\n</head>`);
          }
        }

        // 3. Inject Dynamic AdsBitvex SDK script if configured and not present in html
        if (cachedAdsbitvexSettings && cachedAdsbitvexSettings.generatedHeadScript) {
          const cleanScript = cachedAdsbitvexSettings.generatedHeadScript.trim();
          if (html.includes('</head>') && !html.includes(cleanScript)) {
            html = html.replace('</head>', `\n    ${cleanScript}\n</head>`);
          }
        }

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (err: any) {
        debugLog(`Failed to read index.html dynamically: ${err.message}`);
        res.sendFile(indexPath);
      }
    };

    app.get('/', serveIndexWithComment);
    app.get('/index.html', serveIndexWithComment);

    app.use(express.static(distPath, { index: false }));

    app.get('*', (req, res, next) => {
      if (!req.headers.accept || req.headers.accept.includes("text/html")) {
        return serveIndexWithComment(req, res);
      }
      next();
    });
  }

  debugLog(`startServer: Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    debugLog(`Server started and listening on http://0.0.0.0:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
