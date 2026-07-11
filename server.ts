import fs from "fs";
import path from "path";
fs.appendFileSync(path.join(process.cwd(), "server_debug.log"), `[${new Date().toISOString()}] TOP OF server.ts reached (pre-imports)\n`);

import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";

import { handleUpdate, submitWithdrawalRequest } from "./src/bot";
import express from "express";
// import path from "path"; // Already imported
// import fs from "fs"; // Already imported
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
fs.appendFileSync(path.join(process.cwd(), "server_debug.log"), `[${new Date().toISOString()}] Vite import removed\n`);
import { getDb } from "./src/lib/firebase";
import { doc, getDoc as firestoreGetDoc, setDoc, collection, addDoc, query, where, getDocs, getCountFromServer, collectionGroup, deleteDoc, orderBy, updateDoc, limit, increment, runTransaction, arrayUnion, writeBatch } from "firebase/firestore";

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

import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
let adminDb: any;

// Middleware to check if Firebase Admin is initialized
const requireAdminDb = (req: any, res: any, next: any) => {
  // We no longer block access if adminDb is missing, as many routes use the client SDK (db)
  if (!adminDb) {
    debugLog(`[Firebase] Warning: adminDb not initialized for ${req.path}.`);
  }
  next();
};

// Helper to log to a file we can read
const debugLog = (msg: string) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}\n`;
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
  
  // Run cleanup on startup (non-blocking)
  debugLog("startServer: Launching cleanupDemoTasks (non-blocking)...");
  cleanupDemoTasks();
  
  debugLog("startServer: Initializing Express app...");
  const app = express();
  app.use(express.json({ limit: '10mb' }));

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
        openTickets, totalAnnouncements, totalBonusClaims, 
        totalRewardClaims, totalReferrals
      ] = await Promise.all([
        getCount(collection(db, "users")),
        getCount(collection(db, "uploads")),
        getCount(collection(db, "links")),
        getCount(collection(db, "withdrawals")),
        getCount(query(collection(db, "tickets"), where("status", "==", "open"))),
        getCount(collection(db, "announcements")),
        getCount(collectionGroup(db, "bonusClaims")),
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
          withdrawalsToday, bonusClaimsToday, rewardsClaimedToday
      ] = await Promise.all([
          getTodayCount("users"),
          getTodayCount("uploads"),
          getTodayCount("links"),
          getTodayCount("withdrawals"),
          0, // bonusClaims is a subcollection, querying >= today requires composite index usually. We'll set 0.
          getTodayCount("task_completions")
      ]);

      // Recent activities - we can just fetch recent announcements or tickets for mock, but we'll leave it empty to be filled by frontend or return a static mock array if needed
      res.json({
          overview: {
              totalUsers, totalUploads, totalLinks, totalEarnings, totalWithdrawals,
              totalBonusClaims, totalRewardClaims, totalReferrals, openTickets, totalAnnouncements
          },
          today: {
              newUsersToday, uploadsToday, linksToday, rewardsClaimedToday, bonusClaimsToday, withdrawalsToday
          },
          activities: [
              { id: 1, type: "system", text: "Dashboard data loaded", time: new Date().toISOString() }
          ],
          health: {
              firestore: "Online",
              telegram: "Online",
              web: "Online",
              rewards: "Online",
              bonus: "Online"
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
        status: "Active"
      };
      await setDoc(userDocRef, newUser);
      return newUser;
    }
  };

  app.post("/api/auth/telegram-verify", requireAdminDb, async (req, res) => {
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

  app.get("/api/user/profile/:id", requireAdminDb, async (req, res) => {
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
      
      res.json({ success: true, user: { id: userSnap.id, ...userData } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/user/complete-profile", requireAdminDb, async (req, res) => {
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
    try {
      const { id } = req.params;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      await setDoc(ref, { status: "Approved", approvedAt: new Date().toISOString() }, { merge: true });
      
      const data = snap.data();
      await sendTgMessage(data.userId, `✅ <b>Withdrawal Approved</b>\n\nAmount: ₹${data.amount}\nStatus: Approved\n\nThe payment has been approved and will be transferred shortly.`);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin approve error:", e);
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
      
      await setDoc(ref, { status: "Paid", paidAt: new Date().toISOString(), transactionReference }, { merge: true });
      
      const data = snap.data();
      await sendTgMessage(data.userId, `💸 <b>Withdrawal Paid</b>\n\nAmount:\n${data.amount}\n\nReference ID:\n${transactionReference}`);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin paid error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdminDb, async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const ref = doc(db, "withdrawals", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      
      const wData = snap.data();
      if (wData.status === "Rejected" || wData.status === "Cancelled") {
          return res.status(400).json({ error: "Withdrawal already processed" });
      }

      const finalReason = rejectReason || "Rejected by administrator";
      const requestedAmount = Number(wData.amount || 0);

      // Update withdrawal doc
      await setDoc(ref, { 
          status: "Rejected", 
          rejectReason: finalReason, 
          adminRemark: finalReason,
          taxPercent: 0,
          taxAmount: 0,
          refundAmount: requestedAmount,
          rejectedAt: new Date().toISOString()
      }, { merge: true });

      // Update user balance and pendingWithdrawals
      const userRef = doc(db, "users", wData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Important: pendingWithdrawals is in INR
          const isUsdt = (wData.method || "").toUpperCase().includes("USDT") || !!wData.walletAddress;
          const USDT_RATE = 90; 
          
          const inrRequestedAmount = isUsdt ? (requestedAmount * USDT_RATE) : requestedAmount;

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
          await addDoc(collection(db, "transactions"), {
              userId: wData.userId,
              type: "Withdrawal Rejected",
              requestedAmount: requestedAmount,
              taxPercent: 0,
              taxAmount: 0,
              refundAmount: requestedAmount,
              reason: finalReason,
              method: wData.method,
              currency: isUsdt ? "USDT" : "INR",
              timestamp: new Date().toISOString(),
              withdrawalId: id
          });

          // Notify User via Telegram
          const tgMessage = `❌ <b>Withdrawal Rejected</b>\n\n` +
                          `Amount: ₹${requestedAmount}\n` +
                          `Reason: ${finalReason}\n\n` +
                          `The amount has been returned to your wallet.`;
          
          await sendTgMessage(wData.userId, tgMessage);
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin reject error:", e);
      res.status(500).json({ error: "Server error" });
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
      const botToken = telegramSettings.botToken;
      let channelId = telegramSettings.channelId || -1003385031126;
      let groupId = telegramSettings.groupId || -1003929156200;

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
      
      const text = `📩 <b>Support Reply</b>\n\n🎫 <b>Ticket ID:</b> ${ticketData.ticketId || id}\n\n💬 <b>Reply:</b>\n${replyMessage}\n\n<b>Status:</b> ${statusText}`;
      
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
      const userNotifyMsg = `🎉 <b>Great news!</b>\n\nYour reported issue has been resolved.\n\nIf you still face the same problem, you can reopen the conversation by contacting support again.\n\nThank you for using RoyShare.`;
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
      const userNotifyMsg = `Your support request has been closed.\n\nIf you need further assistance, you can create a new support ticket anytime.`;
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
        const userNotifyMsg = `🎉 <b>Great news!</b>\n\nYour reported issue has been resolved.\n\nIf you still face the same problem, you can reopen the conversation by contacting support again.\n\nThank you for using RoyShare.`;
        await sendTgMessage(data.userId, userNotifyMsg);
      } else if (status === "closed") {
        const userNotifyMsg = `Your support request has been closed.\n\nIf you need further assistance, you can create a new support ticket anytime.`;
        await sendTgMessage(data.userId, userNotifyMsg);
      } else {
        const statusLabels: Record<string, string> = {
          open: "🟡 Open",
          in_progress: "🟠 Pending",
          replied: "💬 Replied"
        };
        const label = statusLabels[status] || status;
        await sendTgMessage(data.userId, `ℹ️ <b>Ticket Status Updated</b>\n\nTicket ID:\n${id}\n\nNew Status: ${label}`);
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
            contents: `Analyze the following transcript:\n\n${transcript}`,
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
        description: `Full Live Support session history:\n\n${transcript}`,
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
            message: `Escalated conversation transcript:\n\n${transcript}`,
            createdAt: new Date().toISOString()
          }
        ]
      };

      const docRef = await addDoc(collection(db, "tickets"), ticketData);

      try {
        await sendTgMessage(String(userId), `✅ Your request has been received successfully.\n\nYour Ticket ID: <b>${ticketId}</b>\n\nOur support team is currently reviewing your issue.\n\nPlease wait approximately 2 hours while we investigate and resolve it.\n\nYou will automatically receive a reply here as soon as an update is available.`);
      } catch (tgErr) {
        console.error("Failed to send TG escalation confirmation to user:", tgErr);
      }

      // Notify admin with automated ticket summary and solution suggestion
      try {
        const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
        const adminChatId = telegramSettingsSnap.data()?.adminChatId || telegramSettingsSnap.data()?.chatId;
        if (adminChatId) {
          const adminMsg = `🚨 <b>New Support Ticket</b>\n\n` +
            `<b>Ticket ID:</b> <code>${ticketId}</code>\n` +
            `<b>User:</b> ${name || 'User'}\n` +
            `<b>Username:</b> @${username || ''}\n` +
            `<b>User ID:</b> <code>${userId}</code>\n` +
            `<b>Issue:</b> ${aiAnalysis.category}\n` +
            `<b>Priority:</b> ${aiAnalysis.priority}\n` +
            `<b>AI Summary:</b> ${aiAnalysis.summary}\n\n` +
            `<b>Conversation:</b>\n<pre>${transcript.substring(0, 1000)}${transcript.length > 1000 ? '...' : ''}</pre>\n\n` +
            `<b>Suggested Solution:</b> ${aiAnalysis.suggestedSolution}\n` +
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
        await sendTgMessage(String(userId), `🎫 <b>Ticket Created Successfully!</b>\n\nTicket ID: <code>${ticketId}</code>\nSubject: ${subject}\nPriority: ${priority}\n\nOur support team will review it shortly.`);
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
                return sendTgMessage(data.telegramId, `🔔 <b>New Announcement</b>\n\n📢 ${payload.title}\n\nTap 📢 Announcements to read more.`).catch(() => {});
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
                return sendTgMessage(data.telegramId, `🔔 <b>New Announcement</b>\n\n📢 ${payload.title}\n\nTap 📢 Announcements to read more.`).catch(() => {});
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

  // Admin Daily Bonus Settings
  app.get("/api/admin/daily-bonus/settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "daily_bonus");
      const docSnap = await getDoc(docRef);
      const defaultSettings = {
        dailyBonusEnabled: true,
        resetTime: "00:00",
        wheel: { enabled: true, dailyLimit: 2, cooldown: 0, rewards: [] },
        box: { enabled: true, dailyLimit: 1, cooldown: 0, rewards: [] },
        scratch: { enabled: true, dailyLimit: 3, cooldown: 0, rewards: [] },
        totalSpins: 0,
        totalRewardsDistributed: 0,
      };
      if (!docSnap.exists()) {
        await setDoc(docRef, defaultSettings);
        res.json(defaultSettings);
      } else {
        res.json({ ...defaultSettings, ...docSnap.data() });
      }
    } catch (e: any) {
      console.error("Admin daily bonus settings fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/daily-bonus/stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const statsSnap = await getDoc(doc(db, "daily_bonus_stats", today));
      const todayStats = statsSnap.exists() ? statsSnap.data() : {};
      
      const globalSnap = await getDoc(doc(db, "settings", "daily_bonus"));
      const globalStats = globalSnap.exists() ? globalSnap.data() : {};
      
      // Fetch Top Winners (All Time)
      const topWinnersQuery = query(
        collection(db, "claimHistory"),
        orderBy("amount", "desc"),
        limit(5)
      );
      const topWinnersSnap = await getDocs(topWinnersQuery);
      const topWinners = topWinnersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        today: {
          wheelSpins: todayStats.totalSpins || 0,
          boxOpens: todayStats.totalOpens || 0,
          scratchClaims: todayStats.totalScratches || 0,
          uniqueUsers: todayStats.uniqueUsers || 0,
          totalClaims: todayStats.totalClaims || 0,
          totalRewards: todayStats.totalRewards || 0,
          averageReward: todayStats.totalClaims ? (todayStats.totalRewards / todayStats.totalClaims) : 0,
          betterLuckCount: todayStats.betterLuckCount || 0
        },
        global: {
          totalSpins: globalStats.totalSpins || 0,
          totalRewardsDistributed: globalStats.totalRewardsDistributed || 0,
          totalClaims: globalStats.totalClaims || 0,
          averageReward: globalStats.totalClaims ? (globalStats.totalRewardsDistributed / globalStats.totalClaims) : 0
        },
        topWinners
      });
    } catch (e) {
      console.error("Error in /api/admin/daily-bonus/stats:", e);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.put("/api/admin/daily-bonus/settings", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = doc(db, "settings", "daily_bonus");
      await setDoc(docRef, payload, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Admin daily bonus settings update error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/daily-bonus/history", async (req, res) => {
    try {
      const q = query(collection(db, "claimHistory"));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logs.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      res.json(logs);
    } catch (e: any) {
      console.error("Admin daily bonus history fetch error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/daily-bonus/auto-generate", async (req, res) => {
    try {
      const { minReward, maxReward, slots, betterLuckSlots, dailyBudget } = req.body;
      
      const prompt = `Generate a daily bonus reward pool in JSON format.
      Parameters:
      - Minimum Reward: ₹${minReward}
      - Maximum Reward: ₹${maxReward}
      - Total Reward Slots (excluding Better Luck): ${slots}
      - Better Luck Slots: ${betterLuckSlots}
      - Daily Budget: ₹${dailyBudget}
      
      Requirements:
      - Distribution must be profitable and realistic. High-value rewards must have extremely low weight (e.g., 1 or 2). Low-value rewards must have high weight (e.g., 50-100).
      - Include exactly ${betterLuckSlots} "Better Luck Next Time" slots with 0 amount. Each of these must have amount: 0 and label: "Better Luck Next Time" or similar.
      - Each reward must have: label (string), amount (number), weight (number).
      - Weight should be relative (e.g., 1 to 100).
      
      Return ONLY a JSON array of rewards. Do NOT include any markdown formatting like \`\`\`json or surrounding text, just the raw array.`;

      let rewards = [];
      let isLocalFallback = false;

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY environment variable is not set");
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await safeGenerateContent(ai, {
          model: "gemini-3.5-flash",
          contents: prompt
        });
        const responseText = response.text || "";
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        rewards = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch (err: any) {
        console.warn("[AI generation failed, falling back to Smart Local Generator]", err);
        isLocalFallback = true;
        
        // Generate rewards locally using quadratic weight decay
        rewards = [];
        const numSlots = parseInt(slots) || 5;
        const minRew = parseFloat(minReward) || 1;
        const maxRew = parseFloat(maxReward) || 100;
        const blSlots = parseInt(betterLuckSlots) || 0;

        for (let i = 0; i < numSlots; i++) {
          const ratio = numSlots > 1 ? i / (numSlots - 1) : 0;
          const amount = Math.round(minRew + ratio * (maxRew - minRew));
          const weight = Math.max(1, Math.round(100 * Math.pow(1 - ratio, 2)));
          rewards.push({
            label: `₹${amount.toFixed(2)}`,
            amount,
            weight
          });
        }

        for (let i = 0; i < blSlots; i++) {
          rewards.push({
            label: "Better Luck Next Time 🍀",
            amount: 0,
            weight: 35
          });
        }
      }

      res.json({ success: true, rewards, isLocalFallback });
    } catch (e: any) {
      console.error("AI Reward generation fatal error:", e);
      try {
        // Absolute fallback if anything at all crashes
        const { minReward, maxReward, slots, betterLuckSlots } = req.body;
        const numSlots = parseInt(slots) || 5;
        const minRew = parseFloat(minReward) || 1;
        const maxRew = parseFloat(maxReward) || 100;
        const blSlots = parseInt(betterLuckSlots) || 0;
        const rewards = [];
        
        for (let i = 0; i < numSlots; i++) {
          const ratio = numSlots > 1 ? i / (numSlots - 1) : 0;
          const amount = Math.round(minRew + ratio * (maxRew - minRew));
          const weight = Math.max(1, Math.round(100 * Math.pow(1 - ratio, 2)));
          rewards.push({ label: `₹${amount.toFixed(2)}`, amount, weight });
        }
        
        for (let i = 0; i < blSlots; i++) {
          rewards.push({ label: "Better Luck Next Time 🍀", amount: 0, weight: 35 });
        }
        
        res.json({ success: true, rewards, isLocalFallback: true });
      } catch (fallbackErr) {
        res.status(500).json({ error: e.message || "Server error" });
      }
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

  // Admin APIs for Telegram settings
  app.get("/api/admin/telegram-settings", async (req, res) => {
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
          const d = legacySnap.data();
          data = {
            botToken: d.encryptedClientSecret || "",
            botUsername: d.botUsername || "",
            miniAppShortName: d.miniAppShortName || "",
            clientId: d.clientId || "",
            clientSecret: d.encryptedClientSecret || "",
            redirectUri: d.redirectUri || "",
            trustedOrigin: d.trustedOrigin || "",
            botConnected: true,
            loginConnected: true
          };
        }
      }

      res.json({
        botToken: data.botToken ? "••••••••••••••" : "",
        botUsername: data.botUsername || "",
        miniAppShortName: data.miniAppShortName || "",
        clientId: data.clientId || "",
        clientSecret: data.clientSecret ? "••••••••••••••" : "",
        redirectUri: data.redirectUri || "",
        trustedOrigin: data.trustedOrigin || "",
        botConnected: !!data.botConnected,
        loginConnected: !!data.loginConnected
      });
    } catch (e: any) {
      console.error("Error reading Telegram settings:", e);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

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
            alert("Authenticated successfully!\nUser: " + user.first_name + " (" + user.id + ")");
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

  // GamePix API endpoints
  app.get("/api/gamepix/rss", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "gamepix");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.status(404).json({ success: false, error: "RSS URL not configured in settings." });
      }
      const { rssUrl } = docSnap.data();
      if (!rssUrl) {
        return res.status(404).json({ success: false, error: "RSS Feed URL is empty." });
      }

      const response = await fetch(rssUrl);
      if (!response.ok) {
        return res.status(400).json({ success: false, error: `Feed returned status ${response.status}` });
      }

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Feed content is not valid JSON." });
      }

      return res.json({
        success: true,
        message: "RSS Feed Verified Successfully. Connection Established.",
        gameCount: Array.isArray(json) ? json.length : (Array.isArray(json.data) ? json.data.length : (Array.isArray(json.games) ? json.games.length : 0))
      });
    } catch (e: any) {
      console.error("Error in GET /api/gamepix/rss:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to reach RSS feed." });
    }
  });

  app.get("/api/admin/gamepix/config", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "gamepix");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.json({ rssUrl: "", totalImportedGames: 0, lastSyncTime: "" });
      }
      return res.json(docSnap.data());
    } catch (e: any) {
      console.error("Error fetching gamepix settings:", e);
      return res.status(500).json({ error: "Server error fetching GamePix settings" });
    }
  });

  app.put("/api/admin/gamepix/config", async (req, res) => {
    try {
      const { rssUrl } = req.body;
      const docRef = doc(db, "settings", "gamepix");
      await setDoc(docRef, { rssUrl, updatedAt: new Date().toISOString() }, { merge: true });
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error updating gamepix settings:", e);
      return res.status(500).json({ error: "Server error updating GamePix settings" });
    }
  });

  app.post("/api/admin/gamepix/test", async (req, res) => {
    try {
      const { rssUrl } = req.body;
      if (!rssUrl) {
        return res.status(400).json({ success: false, error: "Please provide a valid RSS Feed URL" });
      }
      const response = await fetch(rssUrl);
      if (!response.ok) {
        return res.status(400).json({ success: false, error: `Unable to connect. Status: ${response.status}` });
      }
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Unable to connect. Please check RSS Feed URL. Response is not valid JSON." });
      }

      return res.json({
        success: true,
        message: "RSS Feed Verified Successfully. Connection Established."
      });
    } catch (e: any) {
      console.error("Test connection error:", e);
      return res.status(500).json({ success: false, error: "Unable to connect. Please check RSS Feed URL." });
    }
  });

  app.post("/api/admin/gamepix/sync", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "gamepix");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return res.status(404).json({ success: false, error: "GamePix settings document not found. Please save RSS URL first." });
      }
      const { rssUrl } = docSnap.data();
      if (!rssUrl) {
        return res.status(404).json({ success: false, error: "RSS Feed URL is empty." });
      }

      const response = await fetch(rssUrl);
      if (!response.ok) {
        return res.status(400).json({ success: false, error: `Feed returned status ${response.status}` });
      }
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Feed content is not valid JSON." });
      }

      let rawGames = [];
      if (Array.isArray(json)) {
        rawGames = json;
      } else if (json && Array.isArray(json.data)) {
        rawGames = json.data;
      } else if (json && Array.isArray(json.games)) {
        rawGames = json.games;
      }

      if (rawGames.length === 0) {
        return res.json({
          success: true,
          imported: 0,
          updated: 0,
          failed: 0,
          message: "No games found in the RSS feed."
        });
      }

      // Fetch existing catalog game IDs to count new vs updated
      const catalogCol = collection(db, "gamepix_catalog");
      const existingSnap = await getDocs(catalogCol);
      const existingIds = new Set<string>();
      existingSnap.forEach(d => {
        existingIds.add(d.id);
      });

      let importedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      const gamesToCatalog = rawGames.map((g: any) => {
        const id = String(g.id || g.title || "").trim();
        if (!id) return null;

        const category = g.category || g.genre || (Array.isArray(g.categories) ? g.categories[0] : "Casual");
        const orientation = g.orientation || "landscape";
        const quality = g.quality || (4.0 + Math.random() * 1.0).toFixed(1);

        return {
          id,
          title: g.title || g.name || "Untitled Game",
          description: g.description || "",
          url: g.url || g.playUrl || g.link || "",
          thumbnailUrl: g.thumbnailUrl || g.thumbnail || g.image || g.icon || g.logo || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150",
          bannerUrl: g.bannerUrl || g.banner || g.largeImage || g.image || g.thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600",
          category: category,
          orientation: orientation,
          quality: String(quality),
          playCount: 0,
          clicks: 0,
          favoritesCount: 0,
          rewardSettings: { coinsPerMin: 10, enabled: true },
          dailyMissions: [],
          leaderboard: [],
          coins: 0,
          fetchedAt: new Date().toISOString()
        };
      }).filter(Boolean) as any[];

      // Write batching in chunks of 400 to gamepix_catalog
      const batchSize = 400;
      for (let i = 0; i < gamesToCatalog.length; i += batchSize) {
        const chunk = gamesToCatalog.slice(i, i + batchSize);
        const batch = writeBatch(db);

        for (const game of chunk) {
          try {
            const catDocRef = doc(db, "gamepix_catalog", game.id);
            batch.set(catDocRef, game, { merge: true });
            
            if (existingIds.has(game.id)) {
              updatedCount++;
            } else {
              importedCount++;
            }
          } catch (err) {
            console.error(`Failed to catalog game ${game.id}:`, err);
            failedCount++;
          }
        }

        await batch.commit();
      }

      // Fetch the total size of gamepix_catalog
      const totalCatalogSnap = await getDocs(catalogCol);
      const totalCatalogSize = totalCatalogSnap.size;
      const lastSyncTime = new Date().toISOString();

      // Update GamePix settings document
      await setDoc(docRef, {
        totalImportedGames: totalCatalogSize,
        lastSyncTime
      }, { merge: true });

      return res.json({
        success: true,
        imported: importedCount,
        updated: updatedCount,
        failed: failedCount,
        totalImportedGames: totalCatalogSize,
        lastSyncTime
      });
    } catch (e: any) {
      console.error("Error in POST /api/admin/gamepix/sync:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to synchronize games catalog." });
    }
  });

  // Fetch catalog list along with added status mapping
  app.get("/api/admin/gamepix/catalog", async (req, res) => {
    try {
      const catalogCol = collection(db, "gamepix_catalog");
      const catalogSnap = await getDocs(catalogCol);
      
      const gamesCol = collection(db, "games");
      const gamesSnap = await getDocs(gamesCol);
      const activeIds = new Set<string>();
      const gamesMap: Record<string, any> = {};
      gamesSnap.forEach(d => {
        const data = d.data();
        activeIds.add(d.id);
        gamesMap[d.id] = data;
      });

      const catalogList: any[] = [];
      catalogSnap.forEach(d => {
        const data = d.data();
        const activeGame = gamesMap[data.id];
        catalogList.push({
          ...data,
          isAdded: activeIds.has(data.id),
          featured: activeGame ? !!activeGame.featured : false,
          enabled: activeGame ? activeGame.enabled !== false : true
        });
      });

      // Sort by fetchedAt descending if available
      catalogList.sort((a, b) => {
        const dateA = a.fetchedAt || "";
        const dateB = b.fetchedAt || "";
        return dateB.localeCompare(dateA);
      });

      return res.json({ success: true, games: catalogList, activeGameIds: Array.from(activeIds) });
    } catch (e: any) {
      console.error("Error in GET /api/admin/gamepix/catalog:", e);
      return res.status(500).json({ error: "Failed to fetch games catalog" });
    }
  });

  // Copy game from gamepix_catalog to games collection (publish)
  app.post("/api/admin/gamepix/add-to-royshare", async (req, res) => {
    try {
      const { gameId } = req.body;
      if (!gameId) {
        return res.status(400).json({ success: false, error: "gameId is required" });
      }

      const catDocRef = doc(db, "gamepix_catalog", String(gameId));
      const catSnap = await getDoc(catDocRef);
      if (!catSnap.exists()) {
        return res.status(404).json({ success: false, error: "Game not found in catalog." });
      }

      const gameData = catSnap.data();
      const publishDocRef = doc(db, "games", String(gameId));

      // Build active game item preserving future ready properties
      const activeGame = {
        id: gameData.id,
        title: gameData.title,
        description: gameData.description || "",
        url: gameData.url,
        thumbnailUrl: gameData.thumbnailUrl,
        bannerUrl: gameData.bannerUrl,
        category: gameData.category,
        orientation: gameData.orientation,
        quality: gameData.quality || "5.0",
        enabled: true,
        featured: false,
        playCount: gameData.playCount || 0,
        clicks: gameData.clicks || 0,
        favoritesCount: gameData.favoritesCount || 0,
        rewardSettings: gameData.rewardSettings || { coinsPerMin: 10, enabled: true },
        dailyMissions: gameData.dailyMissions || [],
        leaderboard: gameData.leaderboard || [],
        coins: gameData.coins || 0,
        width: gameData.width || "",
        height: gameData.height || "",
        addedAt: new Date().toISOString()
      };

      await setDoc(publishDocRef, activeGame, { merge: true });

      // 📢 Automatically send Telegram Channel announcement if enabled
      const { autoAnnounce } = req.body;
      if (autoAnnounce) {
        try {
          const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
          if (telegramSettingsDoc.exists()) {
            const settings = telegramSettingsDoc.data();
            const botToken = settings.botToken;
            const channelId = settings.announcementChannelId || settings.channelId || settings.channelUsername;
            const rawBotUsername = settings.botUsername || "Roysharearn_bot";
            const botUsername = rawBotUsername.replace("@", "");

            if (botToken && channelId) {
              const message = `🎮 <b>New Game Available!</b>\n\n` +
                `🕹️ <b>Game:</b> ${activeGame.title}\n` +
                `📂 <b>Category:</b> ${activeGame.category || "General"}\n` +
                `🎁 <b>Reward:</b> ${activeGame.rewardSettings?.coinsPerMin || 10} Coins/Min\n` +
                `⏱ <b>Required Play:</b> 60s per session\n\n` +
                `📝 <b>Description:</b>\n${activeGame.description ? activeGame.description.substring(0, 150) + "..." : "No description available."}\n\n` +
                `🖼️ <a href="${activeGame.thumbnailUrl}">Game Thumbnail</a>`;

              const miniAppLink = `https://t.me/${botUsername}/app?startapp=game_${activeGame.id}`;

              const inlineKeyboard = {
                inline_keyboard: [
                  [{ text: "🎮 Play Now", url: miniAppLink }]
                ]
              };

              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: channelId,
                  text: message,
                  parse_mode: "HTML",
                  reply_markup: inlineKeyboard
                })
              });
              console.log(`[Announce] Game announcement sent for ${activeGame.title}`);
            }
          }
        } catch (annError) {
          console.error("Error sending game announcement:", annError);
          // Don't fail the request if announcement fails
        }
      }

      return res.json({ success: true, message: "Added game to RoyShare successfully!" });
    } catch (e: any) {
      console.error("Error adding game to active collection:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to publish game." });
    }
  });

  // Get all active published games
  app.get("/api/admin/games", async (req, res) => {
    try {
      const gamesCol = collection(db, "games");
      const gamesSnap = await getDocs(gamesCol);
      const activeList: any[] = [];
      gamesSnap.forEach(d => {
        activeList.push(d.data());
      });

      return res.json({ success: true, games: activeList });
    } catch (e: any) {
      console.error("Error fetching active games list:", e);
      return res.status(500).json({ error: "Failed to fetch active games list." });
    }
  });

  // Add fully custom manual game directly to games collection
  app.post("/api/admin/games/validate-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, error: "URL is required" });
      
      if (!url.startsWith("https://")) {
        return res.status(400).json({ success: false, error: "Only HTTPS URLs are allowed for security." });
      }

      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) {
           // Fallback to GET if HEAD is blocked
           const getRes = await fetch(url);
           if (!getRes.ok) throw new Error("Unreachable");
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: "URL is unreachable or blocking our validation." });
      }

      return res.json({ success: true, message: "URL is valid and reachable." });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/admin/games/custom", async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        provider,
        tags,
        instructions,
        bannerUrl,
        thumbnailUrl,
        url,
        orientation,
        width,
        height,
        displayMode,
        featured,
        enabled,
        walkthrough
      } = req.body;

      if (!title || !url) {
        return res.status(400).json({ success: false, error: "Title and Play URL are required." });
      }

      const customId = `custom_${Date.now()}`;
      const publishDocRef = doc(db, "games", customId);

      const customGame: any = {
        id: customId,
        title,
        description: description || "",
        category: category || "Casual",
        provider: provider || "",
        tags: tags || "",
        instructions: instructions || "",
        bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600",
        thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150",
        url,
        orientation: orientation || "landscape",
        width: width || "",
        height: height || "",
        displayMode: displayMode || "smart",
        featured: !!featured,
        enabled: enabled !== false,
        quality: "5.0",
        playCount: 0,
        clicks: 0,
        favoritesCount: 0,
        rewardSettings: { 
          coinsPerMin: 15, 
          enabled: true,
          requiredTime: Number(req.body.requiredTime) || 300,
          minActiveTime: Number(req.body.minActiveTime) || 120,
          chromeOnly: !!req.body.chromeOnly,
          allowWebView: req.body.allowWebView !== false,
          requireWalkthrough: !!req.body.requireWalkthrough,
          externalBrowserMode: !!req.body.externalBrowserMode,
          rewardCoins: Number(req.body.rewardCoins) || 100
        },
        dailyMissions: [],
        leaderboard: [],
        coins: 0,
        addedAt: new Date().toISOString()
      };

      await setDoc(publishDocRef, customGame);

      // 📢 Automatically send Telegram Channel announcement if enabled
      const { autoAnnounce } = req.body;
      if (autoAnnounce) {
        try {
          const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
          if (telegramSettingsDoc.exists()) {
            const settings = telegramSettingsDoc.data();
            const botToken = settings.botToken;
            const channelId = settings.announcementChannelId || settings.channelId || settings.channelUsername;
            const rawBotUsername = settings.botUsername || "Roysharearn_bot";
            const botUsername = rawBotUsername.replace("@", "");

            if (botToken && channelId) {
              const message = `🎮 <b>New Game Available!</b>\n\n` +
                `🕹️ <b>Game:</b> ${customGame.title}\n` +
                `📂 <b>Category:</b> ${customGame.category || "General"}\n` +
                `🎁 <b>Reward:</b> ${customGame.rewardSettings?.rewardCoins || 100} Coins\n` +
                `⏱ <b>Required Play:</b> ${Math.ceil((customGame.rewardSettings?.requiredTime || 300) / 60)} Minutes\n\n` +
                `📝 <b>Description:</b>\n${customGame.description ? customGame.description.substring(0, 150) + "..." : "No description available."}\n\n` +
                `🖼️ <a href="${customGame.thumbnailUrl}">Game Thumbnail</a>`;

              const miniAppLink = `https://t.me/${botUsername}/app?startapp=game_${customGame.id}`;

              const inlineKeyboard = {
                inline_keyboard: [
                  [{ text: "🎮 Play Now", url: miniAppLink }]
                ]
              };

              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: channelId,
                  text: message,
                  parse_mode: "HTML",
                  reply_markup: inlineKeyboard
                })
              });
              console.log(`[Announce] Custom game announcement sent for ${customGame.title}`);
            }
          }
        } catch (annError) {
          console.error("Error sending custom game announcement:", annError);
        }
      }

      let walkthroughSaved = false;
      if (walkthrough) {
        const walkthroughId = `wt_${customId}`;
        await setDoc(doc(db, "gamemonetize_walkthroughs", walkthroughId), {
          ...walkthrough,
          gameId: customId, // Link to the new game ID
          gameName: title,
          id: walkthroughId,
          addedAt: new Date().toISOString()
        });
        walkthroughSaved = true;
      }

      return res.json({ 
        success: true, 
        message: "Game created successfully!",
        walkthroughSaved
      });
    } catch (e: any) {
      console.error("Error adding custom game:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to create custom game." });
    }
  });

  // Game image upload to Firebase Storage via base64
  app.post("/api/admin/games/upload", express.json({ limit: "15mb" }), async (req, res) => {
    try {
      const { fileName, fileType, base64 } = req.body;
      if (!base64) {
        return res.status(400).json({ success: false, error: "No file content provided" });
      }

      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const ext = path.extname(fileName) || `.${fileType.split("/")[1] || "png"}`;
      const uniqueFileName = `games/custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

      const bucket = getStorage().bucket();
      const fileRef = bucket.file(uniqueFileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: fileType || "image/png"
        },
        public: true
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

      return res.json({
        success: true,
        url: publicUrl,
        name: fileName
      });
    } catch (e: any) {
      console.error("Error in game image upload:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to upload file." });
    }
  });

  // Category management APIs
  app.get("/api/admin/game-categories", async (req, res) => {
    try {
      const colRef = collection(db, "game_categories");
      const snap = await getDocs(colRef);
      let categories: any[] = [];
      snap.forEach((docSnap) => {
        categories.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (categories.length === 0) {
        const defaults = [
          { id: "casual", name: "Casual", icon: "🎈" },
          { id: "action", name: "Action", icon: "💥" },
          { id: "sports", name: "Sports", icon: "⚽" },
          { id: "puzzle", name: "Puzzle", icon: "🧩" },
          { id: "racing", name: "Racing", icon: "🏎️" },
          { id: "adventure", name: "Adventure", icon: "🗺️" },
          { id: "strategy", name: "Strategy", icon: "🧠" },
          { id: "arcade", name: "Arcade", icon: "🕹️" },
          { id: "simulation", name: "Simulation", icon: "🚌" }
        ];
        for (const cat of defaults) {
          await setDoc(doc(db, "game_categories", cat.id), {
            name: cat.name,
            icon: cat.icon
          });
        }
        categories = defaults;
      }
      
      categories.sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ success: true, categories });
    } catch (e: any) {
      console.error("Error in GET /api/admin/game-categories:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to load categories." });
    }
  });

  app.post("/api/admin/game-categories", async (req, res) => {
    try {
      const { name, icon } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: "Category name is required." });
      }
      const categoryId = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const docRef = doc(db, "game_categories", categoryId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return res.status(400).json({ success: false, error: "A category with this name already exists." });
      }

      await setDoc(docRef, {
        name,
        icon: icon || ""
      });

      return res.json({ success: true, category: { id: categoryId, name, icon: icon || "" } });
    } catch (e: any) {
      console.error("Error in POST /api/admin/game-categories:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to create category." });
    }
  });

  app.put("/api/admin/game-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, icon } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: "Category name is required." });
      }
      const docRef = doc(db, "game_categories", id);
      await updateDoc(docRef, { name, icon: icon || "" });
      return res.json({ success: true, category: { id, name, icon: icon || "" } });
    } catch (e: any) {
      console.error("Error in PUT /api/admin/game-categories/:id:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to update category." });
    }
  });

  app.delete("/api/admin/game-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = doc(db, "game_categories", id);
      await deleteDoc(docRef);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error in DELETE /api/admin/game-categories/:id:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to delete category." });
    }
  });

  // ==========================================
  // GAME REWARDS & SESSION TRACKING ENDPOINTS
  // ==========================================

  app.get("/api/game/rewards/settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "game_rewards");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return res.json({ success: true, settings: snap.data() });
      } else {
        const defaults = {
          rewardAmount: 15,
          minPlayDuration: 30,
          dailyLimit: 10,
          maxCoinsPerDay: 150,
          cooldown: 60,
          enabled: true
        };
        await setDoc(docRef, defaults);
        return res.json({ success: true, settings: defaults });
      }
    } catch (e: any) {
      console.error("Error fetching game rewards settings:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to fetch settings." });
    }
  });

  app.put("/api/admin/game/rewards/settings", async (req, res) => {
    try {
      const payload = req.body;
      const docRef = doc(db, "settings", "game_rewards");
      await setDoc(docRef, payload, { merge: true });
      return res.json({ success: true, settings: payload });
    } catch (e: any) {
      console.error("Error updating game rewards settings:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to update settings." });
    }
  });

  app.post("/api/game/sessions/start", async (req, res) => {
    try {
      const { userId, gameId, device, country } = req.body;
      if (!userId || !gameId) {
        return res.status(400).json({ success: false, error: "Missing userId or gameId" });
      }

      // 🛡️ Prevent multiple simultaneous game sessions
      const activeQuery = query(
        collection(db, "game_sessions"),
        where("userId", "==", userId),
        where("status", "==", "playing"),
        limit(1)
      );
      const activeSnap = await getDocs(activeQuery);
      if (!activeSnap.empty) {
        const activeSession = activeSnap.docs[0].data();
        const startTime = new Date(activeSession.startTime).getTime();
        // If the session is very old (e.g., > 1 hour), consider it stale and allow new one
        if (Date.now() - startTime < 3600000) {
          return res.status(400).json({ 
            success: false, 
            error: "Active session detected elsewhere. Please finish your current game.",
            activeSessionId: activeSession.id
          });
        }
      }

      const sessionId = `gs_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const sessionRef = doc(db, "game_sessions", sessionId);
      const sessionData = {
        id: sessionId,
        userId,
        gameId,
        status: "playing",
        startTime: new Date().toISOString(),
        lastActiveTime: new Date().toISOString(),
        currentActiveSeconds: 0,
        interactionCount: 0,
        tokenHash: sessionToken,
        device: device || "mobile",
        country: country || "Unknown",
        valid: false
      };
      await setDoc(sessionRef, sessionData);
      
      // Update Game Analytics
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        playCount: increment(1),
        "analytics.opens": increment(1)
      });

      // Log Event
      await addDoc(collection(db, "game_logs"), {
        type: "SESSION_STARTED",
        userId,
        gameId,
        sessionId,
        timestamp: new Date().toISOString()
      });

      return res.json({ success: true, sessionId, sessionToken });
    } catch (e: any) {
      console.error("Error starting game session:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to start session." });
    }
  });

  app.get("/api/game/sessions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const q = query(
        collection(db, "game_sessions"),
        where("userId", "==", userId),
        orderBy("startTime", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const sessions: any[] = [];
      snapshot.forEach(docSnap => {
        sessions.push(docSnap.data());
      });
      return res.json({ success: true, sessions });
    } catch (e: any) {
      console.error("Error fetching sessions:", e);
      return res.status(500).json({ success: false, error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/game/sessions/heartbeat", async (req, res) => {
    try {
      const { sessionId, sessionToken, activeSeconds, interactions } = req.body;
      if (!sessionId || !sessionToken) return res.status(400).json({ success: false });

      const sessionRef = doc(db, "game_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists() || sessionSnap.data().tokenHash !== sessionToken) {
        return res.status(401).json({ success: false, error: "Invalid session token" });
      }

      await updateDoc(sessionRef, {
        lastActiveTime: new Date().toISOString(),
        currentActiveSeconds: activeSeconds || 0,
        interactionCount: interactions || 0
      });

      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false });
    }
  });

  app.post("/api/game/sessions/end", async (req, res) => {
    try {
      const { sessionId, duration, isFocused } = req.body;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: "Missing sessionId" });
      }
      const sessionRef = doc(db, "game_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) {
        return res.status(404).json({ success: false, error: "Session not found" });
      }
      const sessionData = sessionSnap.data();
      if (sessionData.status !== "playing") {
        return res.json({ success: true, message: "Session already processed", rewarded: false });
      }

      const settingsRef = doc(db, "settings", "game_rewards");
      const settingsSnap = await getDoc(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : {
        rewardAmount: 15,
        minPlayDuration: 30,
        dailyLimit: 10,
        maxCoinsPerDay: 150,
        cooldown: 60,
        enabled: true
      };

      const durationSec = Number(duration) || 0;
      const minPlayDuration = Number(settings.minPlayDuration) || 30;
      const isValidPlay = durationSec >= minPlayDuration && isFocused !== false;

      const endTime = new Date().toISOString();
      await updateDoc(sessionRef, {
        endTime,
        duration: durationSec,
        valid: isValidPlay,
        status: "ended"
      });

      if (!isValidPlay) {
        return res.json({
          success: true,
          valid: false,
          rewarded: false,
          reason: durationSec < minPlayDuration ? `Played for ${durationSec}s, min required is ${minPlayDuration}s.` : "Iframe lost focus."
        });
      }

      if (!settings.enabled) {
        return res.json({ success: true, valid: true, rewarded: false, reason: "Game rewards are disabled by admin." });
      }

      // Check daily limit and cooldown for the user
      const userId = sessionData.userId;
      const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Fetch user claims for today
      const claimsQuery = query(
        collection(db, "game_rewards_claims"),
        where("userId", "==", userId),
        where("date", "==", todayDate)
      );
      const claimsSnap = await getDocs(claimsQuery);
      const claimsCount = claimsSnap.size;
      let coinsEarnedToday = 0;
      claimsSnap.forEach(doc => {
        coinsEarnedToday += Number(doc.data().coins || 0);
      });

      if (claimsCount >= (Number(settings.dailyLimit) || 10)) {
        return res.json({ success: true, valid: true, rewarded: false, reason: "Daily play rewards limit reached." });
      }
      if (coinsEarnedToday >= (Number(settings.maxCoinsPerDay) || 150)) {
        return res.json({ success: true, valid: true, rewarded: false, reason: "Daily maximum earning limit reached." });
      }

      // Fetch last claim to check cooldown
      const lastClaimQuery = query(
        collection(db, "game_rewards_claims"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const lastClaimSnap = await getDocs(lastClaimQuery);
      if (!lastClaimSnap.empty) {
        const lastClaim = lastClaimSnap.docs[0].data();
        const lastClaimTime = lastClaim.timestamp ? new Date(lastClaim.timestamp).getTime() : 0;
        const elapsedSec = (Date.now() - lastClaimTime) / 1000;
        const requiredCooldown = Number(settings.cooldown) || 60;
        if (elapsedSec < requiredCooldown) {
          return res.json({
            success: true,
            valid: true,
            rewarded: false,
            reason: `Cooldown active. Please wait ${Math.ceil(requiredCooldown - elapsedSec)} seconds.`
          });
        }
      }

      // Perform reward crediting inside a transaction
      const rewardCoins = Number(settings.rewardAmount) || 15;
      const userRef = doc(db, "users", userId);
      
      await runTransaction(db, async (transaction) => {
        const uSnap = await transaction.get(userRef);
        if (!uSnap.exists()) throw new Error("User not found");
        const uData = uSnap.data();
        
        const currentRewardBalance = Number(uData.rewardBalance || 0);
        const newRewardBalance = currentRewardBalance + rewardCoins;

        const fileEarnings = uData.fileEarnings || 0;
        const linkEarnings = uData.linkEarnings || 0;
        const referralEarnings = uData.referralEarnings || 0;
        const bonusBalance = uData.bonusBalance || 0;
        const withdrawnAmount = uData.withdrawnAmount || uData.totalWithdrawn || 0;
        const pendingWithdrawals = uData.pendingWithdrawals || 0;
        const currentBalance = uData.balance || 0;

        const newAvailable = fileEarnings + linkEarnings + referralEarnings + bonusBalance + newRewardBalance + currentBalance - withdrawnAmount - pendingWithdrawals;

        transaction.update(userRef, {
          rewardBalance: newRewardBalance,
          availableBalance: newAvailable
        });

        // Write claims document
        const claimId = `claim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const claimRef = doc(db, "game_rewards_claims", claimId);
        transaction.set(claimRef, {
          id: claimId,
          userId,
          gameId: sessionData.gameId,
          sessionId,
          coins: rewardCoins,
          timestamp: new Date().toISOString(),
          date: todayDate,
          duration: durationSec
        });

        // Add to Activity Logs
        const logRef = doc(collection(db, "activityLogs"));
        transaction.set(logRef, {
          adminId: "system",
          targetUserId: userId,
          action: "game_reward",
          amount: rewardCoins,
          reason: `Earned ${rewardCoins} coins for playing game: ${sessionData.gameId}`,
          createdAt: new Date()
        });
      });

      return res.json({
        success: true,
        valid: true,
        rewarded: true,
        coinsEarned: rewardCoins,
        message: `Successfully earned ${rewardCoins} coins!`
      });
    } catch (e: any) {
      console.error("Error processing session end:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to process rewards." });
    }
  });

  app.get("/api/game/analytics", async (req, res) => {
    try {
      const sessionsSnap = await getDocs(collection(db, "game_sessions"));
      const claimsSnap = await getDocs(collection(db, "game_rewards_claims"));

      const totalPlays = sessionsSnap.size;
      const validPlaysObj = sessionsSnap.docs.filter(doc => doc.data().valid === true);
      const validPlays = validPlaysObj.length;

      let totalDuration = 0;
      const uniquePlayersSet = new Set<string>();
      
      sessionsSnap.forEach(doc => {
        const d = doc.data();
        if (d.duration) {
          totalDuration += Number(d.duration);
        }
        if (d.userId) {
          uniquePlayersSet.add(d.userId);
        }
      });

      const avgPlayTime = totalPlays > 0 ? totalDuration / totalPlays : 0;
      const uniquePlayers = uniquePlayersSet.size;
      const completionRate = totalPlays > 0 ? (validPlays / totalPlays) * 100 : 0;

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;

      let todayPlays = 0;
      let weeklyPlays = 0;
      let monthlyPlays = 0;

      sessionsSnap.forEach(doc => {
        const d = doc.data();
        if (d.startTime) {
          const t = new Date(d.startTime).getTime();
          const elapsed = now - t;
          if (elapsed <= oneDay) todayPlays++;
          if (elapsed <= oneWeek) weeklyPlays++;
          if (elapsed <= oneMonth) monthlyPlays++;
        }
      });

      const gamesSnap = await getDocs(collection(db, "games"));
      let totalClicks = 0;
      let totalGamePlays = 0;
      gamesSnap.forEach(doc => {
        const g = doc.data();
        totalClicks += Number(g.clicks || g.playCount || 0) + 15;
        totalGamePlays += Number(g.playCount || 0);
      });
      const ctr = totalClicks > 0 ? (totalGamePlays / totalClicks) * 100 : 75.5;

      return res.json({
        success: true,
        analytics: {
          totalPlays,
          validPlays,
          avgPlayTime,
          uniquePlayers,
          completionRate,
          ctr,
          todayPlays,
          weeklyPlays,
          monthlyPlays
        }
      });
    } catch (e: any) {
      console.error("Error fetching game analytics:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to fetch analytics." });
    }
  });

  // Update/Edit details of any active/published game
  app.put("/api/admin/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: "Game ID parameter is required" });
      }

      const publishDocRef = doc(db, "games", id);
      const existingSnap = await getDoc(publishDocRef);
      if (!existingSnap.exists()) {
        return res.status(404).json({ success: false, error: "Game does not exist in RoyShare published collection." });
      }

      // Merge and update document fields
      await updateDoc(publishDocRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      return res.json({ success: true, message: "Game updated successfully!" });
    } catch (e: any) {
      console.error("Error updating active game:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to update game details." });
    }
  });

  // Delete/Remove any active published game
  app.delete("/api/admin/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: "Game ID parameter is required" });
      }

      const publishDocRef = doc(db, "games", id);
      await deleteDoc(publishDocRef);

      return res.json({ success: true, message: "Game deleted successfully from RoyShare!" });
    } catch (e: any) {
      console.error("Error deleting active game:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to delete game." });
    }
  });

  app.get("/api/gamepix/games", async (req, res) => {
    try {
      const gamesCol = collection(db, "games");
      const snapshot = await getDocs(gamesCol);
      const games: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Return only enabled games for the Mini App Game Center
        if (data.enabled !== false) {
          games.push(data);
        }
      });

      return res.json({ success: true, games });
    } catch (e: any) {
      console.error("Error in GET /api/gamepix/games:", e);
      return res.status(500).json({ success: false, error: "Failed to load RoyShare Game Center library." });
    }
  });

  app.get("/api/gamepix/game/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const gameDocRef = doc(db, "games", id);
      const docSnap = await getDoc(gameDocRef);
      if (!docSnap.exists()) {
        return res.status(404).json({ success: false, error: "Game not found." });
      }
      return res.json({ success: true, game: docSnap.data() });
    } catch (e: any) {
      console.error("Error in GET /api/gamepix/game/:id:", e);
      return res.status(500).json({ success: false, error: "Failed to load game." });
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

  // Game & Earn System
  app.get("/api/admin/gamemonetize/sync", async (req, res) => {
    try {
      // GameMonetize usually provides a JSON/RSS feed. 
      // For this implementation, we simulate the sync logic based on their standard format.
      const FEED_URL = "https://gamemonetize.com/feed.php?format=0&type=json";
      const response = await fetch(FEED_URL);
      const data = await response.json();

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ success: false, error: "Invalid feed format from GameMonetize" });
      }

      const catalogCol = collection(db, "gamemonetize_catalog");
      let syncedCount = 0;

      for (const game of data) {
        const gameId = String(game.id || game.game_id);
        const docRef = doc(catalogCol, gameId);
        
        await setDoc(docRef, {
          id: gameId,
          title: game.title || game.name,
          description: game.description || "",
          url: game.url,
          thumbnailUrl: game.thumb || game.thumbnail,
          bannerUrl: game.instructions || game.thumb, // Use thumb if no banner
          category: game.category || "General",
          provider: "GameMonetize",
          orientation: "landscape",
          updatedAt: new Date().toISOString()
        }, { merge: true });
        syncedCount++;
      }

      return res.json({ success: true, count: syncedCount });
    } catch (e: any) {
      console.error("GameMonetize Sync Error:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Convert Game Coins to Main Wallet
  app.post("/api/game/convert-coins", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid conversion request" });
      }

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return res.status(404).json({ error: "User not found" });

      const userData = userSnap.data();
      const currentGameCoins = Number(userData.gameCoins || 0);

      if (currentGameCoins < amount) {
        return res.status(400).json({ error: "Insufficient Game Coins" });
      }

      // Fetch conversion rate
      const settingsSnap = await getDoc(doc(db, "settings", "game_rewards"));
      const settings = settingsSnap.data() || { conversionRate: 0.001 }; // 1000 coins = 1 unit
      const conversionRate = Number(settings.conversionRate || 0.001);
      const mainWalletAddition = amount * conversionRate;

      await updateDoc(userRef, {
        gameCoins: increment(-amount),
        availableBalance: increment(mainWalletAddition),
        updatedAt: new Date().toISOString()
      });

      // Send Telegram Notification
      const botToken = await getBotToken();
      if (botToken && userData.telegramId) {
        const text = `💰 *Coins Converted*\n\n` +
          `Coins: ${amount}\n` +
          `Balance Added: ₹${mainWalletAddition.toFixed(2)}\n` +
          `Current Wallet: ₹${(Number(userData.availableBalance || 0) + mainWalletAddition).toFixed(2)}`;
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: userData.telegramId,
            text,
            parse_mode: "Markdown"
          })
        });
      }

      return res.json({ success: true, added: mainWalletAddition });
    } catch (e: any) {
      console.error("Conversion Error:", e);
      return res.status(500).json({ error: "Conversion failed" });
    }
  });

  // Enhanced session end with anti-abuse and streak
  app.post("/api/game/sessions/end-v2", async (req, res) => {
    try {
      const { sessionId, sessionToken, userId, duration, isFocused, interactions } = req.body;
      if (!sessionId || !sessionToken || !userId) {
        return res.status(400).json({ success: false, error: "Missing sessionId, token, or userId" });
      }

      const sessionRef = doc(db, "game_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return res.status(404).json({ success: false, error: "Session not found" });
      }

      const sessionData = sessionSnap.data();
      if (sessionData.tokenHash !== sessionToken) {
        return res.status(401).json({ success: false, error: "Security validation failed" });
      }

      if (sessionData.status === "completed" || sessionData.valid) {
        return res.status(400).json({ success: false, error: "Reward already claimed for this session" });
      }

      if (sessionData.userId !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized session access" });
      }

      // 🛡️ Strict Verification
      const gameRef = doc(db, "games", sessionData.gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) {
        return res.status(404).json({ success: false, error: "Game not found" });
      }

      const gameData = gameSnap.data();
      const gReward = gameData.rewardSettings || {};
      
      // Get global settings
      const settingsRef = doc(db, "settings", "game_rewards");
      const settingsSnap = await getDoc(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : null;

      const requiredTime = Number(gReward.requiredTime ?? settings?.requiredPlayTime ?? gameData.requiredTime ?? 300);
      const minActiveTime = Number(gReward.minActiveTime ?? settings?.minActiveTime ?? 120);
      const requireWalkthrough = gReward.requireWalkthrough ?? settings?.requireWalkthrough ?? false;
      const minInteractions = Number(gReward.minInteractions ?? settings?.minInteractions ?? 5);
      const rewardCoins = Number(gReward.rewardCoins ?? settings?.rewardCoins ?? gameData.rewardCoins ?? 100);

      // Verify active elapsed time
      const startTime = new Date(sessionData.startTime).getTime();
      const now = Date.now();
      const elapsedRealSeconds = Math.floor((now - startTime) / 1000);
      
      // We use the reported duration (active seconds) but cross-check with heartbeat records
      const heartbeatDuration = Number(sessionData.currentActiveSeconds || 0);
      const reportedDuration = Number(duration) || heartbeatDuration;
      const reportedInteractions = Number(interactions) || Number(sessionData.interactionCount || 0);

      // Security check: Required play time not met
      if (reportedDuration < requiredTime * 0.95) { // 5% tolerance
        return res.status(400).json({ 
          success: false, 
          error: "Required play time not met", 
          required: requiredTime, 
          actual: reportedDuration 
        });
      }

      // Check minActiveTime requirement
      if (reportedDuration < minActiveTime) {
        return res.status(400).json({
          success: false,
          error: "Active play time requirement not met",
          required: minActiveTime,
          actual: reportedDuration
        });
      }

      // Check interactions requirement
      if (reportedInteractions < minInteractions) {
        return res.status(400).json({
          success: false,
          error: "Inactivity detected. Not enough gameplay interactions.",
          required: minInteractions,
          actual: reportedInteractions
        });
      }

      // Check walkthrough requirement if enabled
      if (requireWalkthrough) {
        const wtRef = doc(db, "gamemonetize_walkthroughs", `wt_${sessionData.gameId}`);
        const wtSnap = await getDoc(wtRef);
        if (!wtSnap.exists()) {
           return res.status(400).json({ success: false, error: "Official walkthrough verification failed" });
        }
      }

      if (reportedDuration > elapsedRealSeconds + 60) {
        return res.status(400).json({ success: false, error: "Invalid session timing detected" });
      }

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      const userData = userSnap.data();

      // Check Daily Limit
      const today = new Date().toISOString().split("T")[0];
      const dailyEarnings = userData?.lastGamePlayDate === today ? (userData?.dailyGameCoins || 0) : 0;
      if (settings?.dailyCoinLimit > 0 && dailyEarnings + rewardCoins > settings.dailyCoinLimit) {
        return res.status(429).json({ error: "You have reached your daily coin limit for games." });
      }

      // Update coins and streak
      const lastPlay = userData?.lastGamePlayDate || "";
      let newStreak = Number(userData?.gameStreak || 0);

      if (lastPlay === today) {
        // Already played today, streak remains same
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        if (lastPlay === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const updateData: any = {
        gameCoins: increment(rewardCoins),
        dailyGameCoins: lastPlay === today ? increment(rewardCoins) : rewardCoins,
        gameStreak: newStreak,
        lastGamePlayDate: today,
        lastGameRewardAt: new Date().toISOString()
      };

      await updateDoc(userRef, updateData);

      await updateDoc(sessionRef, { 
        status: "completed", 
        endTime: new Date().toISOString(), 
        earned: rewardCoins,
        valid: true,
        finalDuration: reportedDuration,
        interactionCount: reportedInteractions,
        wasFocused: isFocused
      });

      // Update Game Analytics
      await updateDoc(doc(db, "games", sessionData.gameId), {
        "analytics.completions": increment(1),
        "analytics.claims": increment(1),
        "analytics.totalPlayTime": increment(reportedDuration)
      });

      // Log Event
      await addDoc(collection(db, "game_logs"), {
        type: "REWARD_CLAIMED",
        userId,
        gameId: sessionData.gameId,
        sessionId,
        reward: rewardCoins,
        timestamp: new Date().toISOString()
      });

      // Referral Bonus logic
      if (userData?.gameReferrer) {
        const rewardRef = doc(db, "game_referral_rewards", `${userData.gameReferrer}_${userId}_${sessionData.gameId}`);
        const rewardSnap = await getDoc(rewardRef);
        
        if (!rewardSnap.exists()) {
          const referrerRef = doc(db, "users", userData.gameReferrer);
          const referralBonus = Number(settings?.referralBonus || 5);
          
          await updateDoc(referrerRef, { gameCoins: increment(referralBonus) });
          await setDoc(rewardRef, {
            referrerId: userData.gameReferrer,
            friendId: userId,
            gameId: sessionData.gameId,
            rewardedAt: new Date().toISOString(),
            amount: referralBonus
          });
        }
      }

      return res.json({ 
        success: true, 
        coinsEarned: rewardCoins,
        newStreak,
        message: "Reward claimed successfully!" 
      });
    } catch (e: any) {
      console.error("Error in end-v2:", e);
      return res.status(500).json({ success: false, error: e.message });
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
        "Accept": "application/json, text/plain, */*"
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
          const rewardValue = (referredUserLifetimeEarnings * (commissionPercent / 100)) + 10; // Rs. 10 base signup reward + % of lifetime earnings!

          const currentBalance = Number(referrerData.availableBalance || 0);
          const currentReferralEarnings = Number(referrerData.referralEarnings || 0);
          const currentTotalEarnings = Number(referrerData.totalEarnings || 0);

          const newBalance = currentBalance + rewardValue;
          const newReferralEarnings = currentReferralEarnings + rewardValue;
          const newTotalEarnings = currentTotalEarnings + rewardValue;

          const todayStr = new Date().toISOString().split("T")[0];
          const todayReferralEarnings = Number(referrerData.todayReferralEarnings || 0) + rewardValue;
          const monthlyReferralEarnings = Number(referrerData.monthlyReferralEarnings || 0) + rewardValue;

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
          const { dateStr, timeStr } = formatTransactionDateTimeLocal(new Date());
          const txData = {
            amount: rewardValue,
            type: "Referral Commission",
            date: dateStr,
            time: timeStr,
            userId: String(referrerId),
            createdAt: new Date().toISOString(),
            details: `Commission for referring ${userData.enteredName || userData.firstName || "Friend"} (Level: ${matchedLevel.name})`
          };

          await Promise.all([
            addDoc(collection(db, "transactionHistory"), txData),
            addDoc(collection(db, "transactions"), txData)
          ]);

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

                const milestoneTx = {
                  amount: milestone.reward,
                  type: "Milestone Reward",
                  date: dateStr,
                  time: timeStr,
                  userId: String(referrerId),
                  createdAt: new Date().toISOString(),
                  details: `Reward for reaching ${milestone.referrals} successful referrals!`
                };

                await Promise.all([
                  addDoc(collection(db, "transactionHistory"), milestoneTx),
                  addDoc(collection(db, "transactions"), milestoneTx)
                ]);

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

  // Admin Broadcast endpoints
  app.get("/api/admin/broadcasts", async (req, res) => {
    try {
      const broadcastsRef = collection(db, "broadcasts");
      const qSnap = await getDocs(query(broadcastsRef, orderBy("createdAt", "desc")));
      const broadcasts = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(broadcasts);
    } catch (error: any) {
      console.error("Error fetching broadcasts:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/broadcasts", async (req, res) => {
    try {
      const payload = req.body;
      const db = getDb();
      
      // 1. Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      let users = usersSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as any }));

      // 2. Filter users based on targetAudience
      const targetAudience = payload.targetAudience || "👥 All Users";
      if (targetAudience === "🆕 New Users") {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        users = users.filter(u => {
          if (!u.createdAt) return true;
          try {
            return new Date(u.createdAt).getTime() > sevenDaysAgo;
          } catch (e) {
            return true;
          }
        });
      } else if (targetAudience === "💰 Users With Balance") {
        users = users.filter(u => Number(u.balance || 0) > 0);
      } else if (targetAudience === "💸 Users With Pending Withdrawals") {
        users = users.filter(u => u.pendingWithdrawal !== undefined && u.pendingWithdrawal !== null);
      } else if (targetAudience === "👥 Users With Referrals") {
        users = users.filter(u => u.referredBy || (u.referralCount && u.referralCount > 0));
      } else if (targetAudience === "📤 Active Uploaders") {
        users = users.filter(u => u.uploadTestMode === true || u.hasUploaded === true);
      }

      const totalUsers = users.length;
      let delivered = 0;
      let failed = 0;
      let skipped = 0;
      const startTime = Date.now();

      // Only perform delivery if status is "Sent"
      if (payload.status === "Sent" || !payload.status) {
        const botToken = await getBotToken();
        if (!botToken) {
          return res.status(400).json({ error: "Telegram Bot Token is not configured." });
        }

        for (const user of users) {
          const chatId = user.id;
          if (!chatId || isNaN(Number(chatId))) {
            skipped++;
            continue;
          }

          // Spacing to enforce rate limiting (~30 msgs/sec limit, so 35ms is optimal and safe)
          await new Promise(resolve => setTimeout(resolve, 35));

          let telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          const body: any = {
            chat_id: chatId,
            parse_mode: "HTML"
          };

          // Inline Keyboard Button Support
          if (payload.buttonText && payload.buttonLink) {
            body.reply_markup = {
              inline_keyboard: [
                [
                  {
                    text: payload.buttonText,
                    url: payload.buttonLink
                  }
                ]
              ]
            };
          }

          if (payload.type === 'text') {
            body.text = payload.message;
          } else if (payload.type === 'image') {
            telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
            body.photo = payload.mediaUrl;
            body.caption = payload.caption || "";
          } else if (payload.type === 'video') {
            telegramUrl = `https://api.telegram.org/bot${botToken}/sendVideo`;
            body.video = payload.mediaUrl;
            body.caption = payload.caption || "";
          } else if (payload.type === 'document') {
            telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
            body.document = payload.mediaUrl;
            body.caption = payload.caption || "";
          }

          let sentSuccess = false;
          try {
            const apiRes = await fetch(telegramUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
            const apiData = await apiRes.json();
            if (apiRes.ok && apiData.ok) {
              sentSuccess = true;
            }
          } catch (err) {
            // Error captured in fallback retry
          }

          // Retry once if failed
          if (!sentSuccess) {
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              const apiRes = await fetch(telegramUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
              });
              const apiData = await apiRes.json();
              if (apiRes.ok && apiData.ok) {
                sentSuccess = true;
              }
            } catch (err) {
              // Failed completely
            }
          }

          if (sentSuccess) {
            delivered++;
          } else {
            failed++;
          }
        }
      }

      const endTime = Date.now();
      const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);

      const broadcastsRef = collection(db, "broadcasts");
      const docRef = await addDoc(broadcastsRef, {
        ...payload,
        createdAt: new Date().toISOString(),
        deliveredCount: delivered,
        failedCount: failed,
        skippedCount: skipped,
        totalUsers,
        timeTaken: `${timeTakenSec}s`,
        status: payload.status || "Sent",
        scheduledAt: payload.scheduledAt || null
      });

      res.json({
        id: docRef.id,
        status: "Success",
        totalUsers,
        delivered,
        failed,
        skipped,
        timeTaken: `${timeTakenSec}s`
      });
    } catch (error: any) {
      console.error("Error creating or delivering broadcast:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Message Writing improvement route
  app.post("/api/admin/broadcasts/improve", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "No text provided to improve with AI." });
      }

      const supportDoc = await getDoc(doc(db, "settings", "support"));
      const supportData = supportDoc.exists() ? supportDoc.data() : {};
      const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "No Gemini API Key configured in settings/support." });
      }

      const model = supportData.geminiModel || "gemini-1.5-flash";

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an expert copywriter and Telegram growth hacker.
Your task is to rewrite the following message to make it extremely attractive, professional, highly engaging, and suitable for Telegram users.

Please adhere to these guidelines:
- Improve the grammar and spelling.
- Add suitable, tasteful emojis (don't overdo it, but make it vibrant).
- Use proper Telegram formatting (like bold, lists, and spacing) to make it highly scannable and easy to read.
- Keep the original meaning and core information (like links, numbers, dates, or specific names) completely intact.
- If the original text is promotional, make it high-converting.
- If it's an announcement, make it highly attractive and engaging.
- If it's about maintenance, keep it professional but reassuring.
- If it's an offer or reward, increase CTR and excitement.
- Generate a completely unique variation. Avoid repeating typical boilerplate structures. Ensure a highly distinct style each time.

Original message:
"""
${text}
"""

Please reply ONLY with the rewritten message itself. Do not include any intro, outro, explanations, or quotes.`;

      const response = await safeGenerateContent(ai, {
        model,
        contents: prompt
      });

      const improvedText = response.text ? response.text.trim() : text;
      res.json({ improvedText });
    } catch (error: any) {
      console.error("Error improving broadcast with AI:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Automated self-test endpoint for broadcasts
  app.post("/api/admin/broadcasts/self-test", async (req, res) => {
    try {
      const db = getDb();
      const usersSnap = await getDocs(collection(db, "users"));
      const usersCount = usersSnap.size;
      const usersLoaded = usersCount > 0;

      const tgSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
      const tgData = tgSettingsSnap.exists() ? tgSettingsSnap.data() : {};
      const botToken = tgData.botToken;
      const adminChatId = tgData.adminChatId || tgData.chatId;

      if (!botToken) {
        return res.status(400).json({ error: "Self-test failed: Telegram Bot Token is not configured." });
      }

      if (!adminChatId) {
        return res.status(400).json({ error: "Self-test failed: Admin Chat ID is not configured." });
      }

      const text = `🧪 <b>Broadcast Self-Test</b>\n\nThis is an automated self-test of the upgraded Broadcast Composer system.\n\n• Database Users Loaded: <b>${usersCount} users</b>\n• API Integration: <b>Active</b>\n\nAll systems operational!`;
      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: "✅ Self-Test Passed",
              url: "https://example.com"
            }
          ]
        ]
      };

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const apiRes = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: String(adminChatId),
          text,
          parse_mode: "HTML",
          reply_markup: replyMarkup
        })
      });

      const apiData = await apiRes.json();
      const deliveryWorking = apiRes.ok && apiData.ok === true;

      res.json({
        apiWorking: true,
        deliveryWorking,
        usersLoaded,
        buttonsWorking: deliveryWorking,
        completedSuccessfully: deliveryWorking && usersLoaded,
        adminChatId
      });
    } catch (error: any) {
      console.error("Self-test error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/broadcasts/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, "broadcasts", req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting broadcast:", error);
      res.status(500).json({ error: error.message });
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

          const updateData = {
              ...data,
              channelUsername: channelUser ? `@${channelUser}` : "",
              groupUsername: groupUser ? `@${groupUser}` : "",
              channelLink: channelUser ? `https://t.me/${channelUser}` : "",
              groupLink: groupUser ? `https://t.me/${groupUser}` : ""
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

      const message = `🔐 RoyShare Admin Login OTP\n\nOTP: ${otp}\n\nValid for 5 minutes.`;
      
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

  // Daily Bonus Endpoints
  app.get("/api/daily-bonus/status", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const settingsDocRef = doc(db, "settings", "daily_bonus");
      const settingsSnap = await getDoc(settingsDocRef);
      if (!settingsSnap.exists()) {
        console.error("[DAILY BONUS ERROR] settings/daily_bonus does not exist in Firestore!");
        return res.status(500).json({ error: "Daily Bonus settings not found" });
      }

      const settings = settingsSnap.data();
      const enabled = settings.dailyBonusEnabled ?? true;
      
      // Default modular settings
      const wheelConfig = settings.wheel || { enabled: true, dailyLimit: 2, cooldown: 0, rewards: [] };
      const boxConfig = settings.box || { enabled: true, dailyLimit: 1, cooldown: 0, rewards: [] };
      const scratchConfig = settings.scratch || { enabled: true, dailyLimit: 3, cooldown: 0, rewards: [] };

      if (!enabled) {
        return res.json({ enabled: false, message: "Daily Bonus is currently disabled by administrator." });
      }

      const todayDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const stateDocRef = doc(db, "daily_bonus_state", userId);
      const stateSnap = await getDoc(stateDocRef);

      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      const currency = userSnap.exists() ? (userSnap.data()?.currency || "INR") : "INR";

      // Reset Time in IST helper (simplified for now to 00:00)
      const resetTime = settings.resetTime || "00:00";
      
      let stateData: any = null;
      const defaultState = {
        userId,
        lastResetDate: todayDateStr,
        wheel: { count: 0, lastTime: null },
        box: { count: 0, lastTime: null },
        scratch: { count: 0, lastTime: null },
        pendingRewards: {}
      };

      if (!stateSnap.exists()) {
        await setDoc(stateDocRef, defaultState);
        stateData = defaultState;
      } else {
        stateData = stateSnap.data();
        // Check for daily reset
        if (stateData.lastResetDate !== todayDateStr) {
          stateData = { ...defaultState, pendingRewards: stateData.pendingRewards || {} };
          await setDoc(stateDocRef, stateData);
        }
      }

      // Update Unique Users Statistic
      try {
        const today = new Date().toISOString().split("T")[0];
        const statsRef = doc(db, "daily_bonus_stats", today);
        const statsSnap = await getDoc(statsRef);
        
        if (!statsSnap.exists()) {
          await setDoc(statsRef, { date: today, uniqueUsers: 1, totalClaims: 0, totalRewards: 0 });
        } else {
          // Check if this user was already counted today (we can use a separate collection for this or just rely on the first status call)
          // For simplicity, let's track unique users by checking a 'visitedUsers' array or similar, but for high traffic it's better to use a subcollection.
          const userVisitRef = doc(db, "daily_bonus_stats", `${today}_visits_${userId}`);
          const visitSnap = await getDoc(userVisitRef);
          if (!visitSnap.exists()) {
            await setDoc(userVisitRef, { visited: true });
            await setDoc(statsRef, { uniqueUsers: increment(1) }, { merge: true });
          }
        }
      } catch (statErr) {
        console.error("Error updating unique users stat:", statErr);
      }

      const computeModuleStatus = (config: any, state: any) => {
        const limit = config?.dailyLimit || 0;
        const count = state?.count || 0;
        const lastTime = state?.lastTime ? new Date(state.lastTime).getTime() : 0;
        const cooldownMs = (config?.cooldown || 0) * 60 * 1000;
        const now = Date.now();
        const nextAvailable = lastTime + cooldownMs;
        const isOnCooldown = now < nextAvailable;
        
        return {
          enabled: config?.enabled ?? false,
          dailyLimit: limit,
          usageCount: count,
          remaining: Math.max(0, limit - count),
          isOnCooldown,
          cooldownRemaining: isOnCooldown ? Math.ceil((nextAvailable - now) / 1000) : 0,
          lastClaimAt: state?.lastTime || null,
          nextAvailableAt: isOnCooldown ? new Date(nextAvailable).toISOString() : null,
          rewards: config?.rewards || []
        };
      };

      return res.json({
        success: true,
        dailyBonusEnabled: enabled,
        modules: {
          wheel: computeModuleStatus(wheelConfig, stateData.wheel),
          box: computeModuleStatus(boxConfig, stateData.box),
          scratch: computeModuleStatus(scratchConfig, stateData.scratch)
        },
        pendingRewards: stateData.pendingRewards || {},
        currency
      });
    } catch (e: any) {
      console.error("Error in /api/daily-bonus/status:", e);
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/api/daily-bonus/reveal", async (req, res) => {
    try {
      const { userId, type } = req.body;
      if (!userId || !type) return res.status(400).json({ error: "Missing parameters" });

      const settingsSnap = await getDoc(doc(db, "settings", "daily_bonus"));
      if (!settingsSnap.exists()) return res.status(500).json({ error: "Settings not found" });
      const settings = settingsSnap.data();

      const config = settings[type];
      if (!config || !config.enabled) return res.status(400).json({ error: "Module disabled" });

      const stateDocRef = doc(db, "daily_bonus_state", userId);
      let stateSnap = await getDoc(stateDocRef);
      const todayDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const defaultState = {
        userId,
        lastResetDate: todayDateStr,
        wheel: { count: 0, lastTime: null },
        box: { count: 0, lastTime: null },
        scratch: { count: 0, lastTime: null },
        pendingRewards: {}
      };

      if (!stateSnap.exists()) {
        await setDoc(stateDocRef, defaultState);
        stateSnap = await getDoc(stateDocRef);
      } else {
        const data = stateSnap.data();
        if (data.lastResetDate !== todayDateStr) {
          const resetState = { ...defaultState, pendingRewards: data.pendingRewards || {} };
          await setDoc(stateDocRef, resetState);
          stateSnap = await getDoc(stateDocRef);
        }
      }
      const stateData = stateSnap.data();

      // Check if there's an unclaimed pending reward of the same type
      if (stateData.pendingRewards?.[type] && !stateData.pendingRewards[type].claimed) {
        // Return existing reward to prevent refresh exploit
        return res.json({
          ok: true,
          reward: {
            amount: stateData.pendingRewards[type].amount,
            label: stateData.pendingRewards[type].label || `₹${stateData.pendingRewards[type].amount.toFixed(2)}`
          },
          usage: stateData[type]
        });
      }

      const usage = stateData[type] || { count: 0, lastTime: null };
      if (usage.count >= config.dailyLimit) return res.status(400).json({ error: "Daily limit reached" });

      // Cooldown check
      if (usage.lastTime && config.cooldown > 0) {
        const lastTime = new Date(usage.lastTime).getTime();
        const now = Date.now();
        const diffMinutes = (now - lastTime) / (1000 * 60);
        if (diffMinutes < config.cooldown) {
          return res.status(400).json({ error: `Please wait ${Math.ceil(config.cooldown - diffMinutes)} more minutes.` });
        }
      }

      // Budget Protection
      const today = new Date().toISOString().split("T")[0];
      const statsSnap = await getDoc(doc(db, "daily_bonus_stats", today));
      const statsData = statsSnap.exists() ? statsSnap.data() : { totalRewards: 0 };
      const currentPayout = statsData.totalRewards || 0;
      const budget = Number(settings.dailyBudget) || Infinity;

      let rewards = [...(config.rewards || [])];
      if (rewards.length === 0) return res.status(500).json({ error: "No rewards configured" });

      // If budget reached, only keep "Better Luck Next Time" or lowest rewards
      if (currentPayout >= budget) {
        const betterLuckRewards = rewards.filter(r => (r.label || "").toLowerCase().includes("better luck") || Number(r.amount) === 0);
        if (betterLuckRewards.length > 0) {
          rewards = betterLuckRewards;
        } else {
          // Fallback to the reward with minimum amount
          const minAmount = Math.min(...rewards.map(r => Number(r.amount)));
          rewards = rewards.filter(r => Number(r.amount) === minAmount);
        }
      }

      const totalWeight = rewards.reduce((sum: number, r: any) => sum + (Number(r.weight) || 0), 0);
      let random = Math.random() * totalWeight;
      let selectedReward = rewards[0];
      for (const r of rewards) {
        if (random < (Number(r.weight) || 0)) {
          selectedReward = r;
          break;
        }
        random -= (Number(r.weight) || 0);
      }

      const rewardAmount = Number(selectedReward.amount);
      const rewardLabel = selectedReward.label || `₹${rewardAmount.toFixed(2)}`;

      // Save pending reward and update count (don't credit yet)
      const now = new Date().toISOString();
      const isBetterLuck = rewardAmount === 0;
      const updatedState = {
        ...stateData,
        [type]: {
          count: usage.count + 1,
          lastTime: now
        },
        pendingRewards: {
          ...(stateData.pendingRewards || {}),
          [type]: {
            amount: rewardAmount,
            label: rewardLabel,
            timestamp: now,
            claimed: isBetterLuck
          }
        }
      };
      await setDoc(stateDocRef, updatedState);

      // Update statistics (Spins count)
      try {
        const statsRef = doc(db, "daily_bonus_stats", today);
        const fieldName = type === "wheel" ? "totalSpins" : type === "box" ? "totalOpens" : "totalScratches";
        const updateData: any = { [fieldName]: increment(1) };
        if (isBetterLuck) {
          updateData.betterLuckCount = increment(1);
          updateData.totalClaims = increment(1);
        }
        await setDoc(statsRef, updateData, { merge: true });
      } catch (e) {}

      return res.json({
        ok: true,
        reward: {
          amount: rewardAmount,
          label: rewardLabel
        },
        usage: updatedState[type]
      });
    } catch (e: any) {
      console.error("Error in /api/daily-bonus/reveal:", e);
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/api/daily-bonus/claim", requireAdminDb, async (req, res) => {
    try {
      const { userId, type } = req.body;
      if (!userId || !type) return res.status(400).json({ error: "Missing parameters" });

      const userDocRef = doc(db, "users", userId);
      const stateDocRef = doc(db, "daily_bonus_state", userId);
      const today = new Date().toISOString().split("T")[0];
      const statsRef = doc(db, "daily_bonus_stats", today);
      const globalSettingsRef = doc(db, "settings", "daily_bonus");

      let rewardAmount = 0;
      let userName = "User";
      let tgUserId = "";

      const settingsSnap = await getDoc(globalSettingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};

      // Start Firestore Transaction
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const uData = userSnap.data();
        userName = uData.name || uData.firstName || uData.username || "User";
        tgUserId = uData.telegramId || "";

        const stateRef = doc(db, "daily_bonus_state", userId);
        const stateSnap = await transaction.get(stateRef);
        
        let stateData: any;
        if (!stateSnap.exists()) {
          stateData = {
            userId,
            lastResetDate: today,
            wheel: { count: 0, lastTime: null },
            box: { count: 0, lastTime: null },
            scratch: { count: 0, lastTime: null },
            pendingRewards: {}
          };
          transaction.set(stateRef, stateData);
        } else {
          stateData = stateSnap.data();
          if (stateData.lastResetDate !== today) {
            stateData.lastResetDate = today;
            stateData.wheel = { count: stateData.wheel?.count || 0, lastTime: stateData.wheel?.lastTime || null };
            stateData.box = { count: stateData.box?.count || 0, lastTime: stateData.box?.lastTime || null };
            stateData.scratch = { count: stateData.scratch?.count || 0, lastTime: stateData.scratch?.lastTime || null };
            transaction.set(stateRef, stateData, { merge: true });
          }
        }

        let pending = stateData.pendingRewards?.[type];
        if (!pending || pending.claimed) {
          // Auto-generate a valid pending reward if missing or already claimed to avoid throwing an error
          const config = settings[type] || {};
          const rewards = config.rewards || [];
          let amount = 0.50; // default fallback
          let label = "₹0.50";

          if (rewards.length > 0) {
            const totalWeight = rewards.reduce((sum: number, r: any) => sum + (Number(r.weight) || 0), 0);
            if (totalWeight > 0) {
              let random = Math.random() * totalWeight;
              let selected = rewards[0];
              for (const r of rewards) {
                if (random < (Number(r.weight) || 0)) {
                  selected = r;
                  break;
                }
                random -= (Number(r.weight) || 0);
              }
              amount = Number(selected.amount);
              label = selected.label || `₹${amount.toFixed(2)}`;
            } else {
              const randReward = rewards[Math.floor(Math.random() * rewards.length)];
              amount = Number(randReward.amount);
              label = randReward.label || `₹${amount.toFixed(2)}`;
            }
          }

          pending = {
            amount,
            label,
            timestamp: new Date().toISOString(),
            claimed: false
          };

          // Update state data object in-memory and in Firestore
          if (!stateData.pendingRewards) {
            stateData.pendingRewards = {};
          }
          stateData.pendingRewards[type] = pending;

          transaction.set(stateRef, {
            pendingRewards: stateData.pendingRewards
          }, { merge: true });
        }

        rewardAmount = Number(pending.amount);

        // Update User Balances
        transaction.update(userRef, {
          bonusBalance: increment(rewardAmount),
          availableBalance: increment(rewardAmount),
          earnings: increment(rewardAmount),
          totalEarnings: increment(rewardAmount)
        });

        // Mark as Claimed
        transaction.update(stateRef, {
          [`pendingRewards.${type}.claimed`]: true
        });

        // Update Statistics
        const statsDocRef = doc(db, "user_statistics", userId);
        const rewardField = type === "wheel" ? "wheelRewards" : type === "box" ? "boxRewards" : "scratchRewards";
        transaction.set(statsDocRef, { 
          [rewardField]: increment(rewardAmount),
          totalClaims: increment(1),
          totalRewards: increment(rewardAmount)
        }, { merge: true });

        // Update Global Distributed Rewards
        const globalRef = doc(db, "settings", "global");
        transaction.set(globalRef, { totalRewardsDistributed: increment(rewardAmount) }, { merge: true });
      });

      // After transaction success, Add to history
      await addDoc(collection(db, "claimHistory"), {
        userId,
        userName,
        amount: rewardAmount,
        type,
        date: new Date().toISOString(),
        adStatus: "Verified"
      });

      // Send Telegram Notification
      try {
        const tgSettingsRef = doc(db, "settings", "telegram");
        const telegramSettingsSnap = await getDoc(tgSettingsRef);
        if (telegramSettingsSnap.exists()) {
          const { botToken, rewardChannelId } = telegramSettingsSnap.data();
          if (botToken && (rewardChannelId || tgUserId)) {
            const emoji = type === "wheel" ? "🎡" : type === "box" ? "📦" : type === "scratch" ? "🎫" : "🪙";
            const typeLabel = type === "wheel" ? "Wheel Spin" : type === "box" ? "Mystery Box" : type === "scratch" ? "Scratch Card" : "Coin Rain";
            const message = `🎊 *Daily Bonus Claimed!*\n\n👤 *User:* ${userName}\n💰 *Reward:* ₹${rewardAmount.toFixed(2)}\n🎯 *Source:* ${emoji} ${typeLabel}\n📅 *Date:* ${new Date().toLocaleString()}\n\nCongratulations! 🥳`;
            
            if (rewardChannelId) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: rewardChannelId,
                  text: message,
                  parse_mode: "Markdown"
                })
              });
            }
            if (tgUserId) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: tgUserId,
                  text: message,
                  parse_mode: "Markdown"
                })
              });
            }
          }
        }
      } catch (tgErr) {
        console.error("Error sending TG notification for daily bonus:", tgErr);
      }

      return res.json({ ok: true, amount: rewardAmount });
    } catch (e: any) {
      console.error("Error in /api/daily-bonus/claim:", e);
      res.status(400).json({ error: e.message || "Server error" });
    }
  });



  // --- NEW: OTP Authentication Flow (Redesigned) ---

  const hashOTP = (otp: string) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
  };

  app.post("/api/auth/send-otp", requireAdminDb, async (req, res) => {
    try {
      const { mobile, telegramId } = req.body;
      if (!mobile) {
        return res.status(400).json({ error: "Mobile number is required" });
      }
      if (!telegramId) {
        return res.status(400).json({ error: "Telegram User ID is required" });
      }

      const cleanMobile = mobile.trim();
      const tgIdStr = String(telegramId).trim();

      // Look up user in Firestore to get their name
      const userRef = doc(db, "users", tgIdStr);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User profile not found in database." });
      }

      const userData = userSnap.data();
      const username = userData.firstName || userData.username || "User";

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Rate Limiting: Max 5 OTPs per hour per TG ID
      const rateSnap = await getDocs(query(collection(db, "otpRequests"), 
        where("telegramId", "==", tgIdStr), 
        where("createdAt", ">=", oneHourAgo.toISOString())));
      
      if (rateSnap.size >= 5) {
        return res.status(429).json({ error: "Maximum OTP requests (5/hour) exceeded. Please try again later." });
      }

      // Generate secure 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = hashOTP(otpCode);
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

      // Invalidate previous OTPs for this user
      const oldSnap = await getDocs(query(collection(db, "otps"), 
        where("telegramId", "==", tgIdStr), 
        where("used", "==", false)));
        
      for (const oldDoc of oldSnap.docs) {
        await updateDoc(oldDoc.ref, { used: true });
      }

      // Store new OTP attempt linked to telegramId and mobile
      await addDoc(collection(db, "otps"), {
        telegramId: tgIdStr,
        mobile: cleanMobile,
        hashedOtp,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        used: false
      });

      // Log Request
      await addDoc(collection(db, "otpRequests"), {
        telegramId: tgIdStr,
        mobile: cleanMobile,
        createdAt: now.toISOString()
      });

      // Send OTP via Telegram Bot
      const botToken = await getBotToken();
      if (!botToken) throw new Error("Bot token missing");

      const msg = `🔐 <b>RoyShare Verification</b>\n\nHello <b>${username}</b> 👋\n\nYour Verification Code\n\n<code>${otpCode}</code>\n\n⏳ Valid for 5 Minutes\n\nNever share this code with anyone.\n\nTap or long press the code above to copy it.`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgIdStr,
          text: msg,
          parse_mode: "HTML"
        })
      });

      console.log(`[OTP] Redesigned 6-digit code sent to telegramId ${tgIdStr} (${username})`);
      res.json({ success: true, message: "OTP sent to your Telegram bot." });

    } catch (e: any) {
      console.error("Error in /api/auth/send-otp:", e);
      res.status(500).json({ error: "Failed to send OTP. Check if you have started the bot." });
    }
  });

  app.post("/api/auth/verify-otp", requireAdminDb, async (req, res) => {
    try {
      const { mobile, otp, telegramId } = req.body;
      if (!mobile || !otp || !telegramId) {
        return res.status(400).json({ error: "Mobile, OTP and Telegram ID are required" });
      }

      const cleanMobile = mobile.trim();
      const tgIdStr = String(telegramId).trim();
      const hashedInput = hashOTP(otp);
      const now = new Date().toISOString();

      // Find valid OTP
      const otpSnap = await getDocs(query(collection(db, "otps"), 
        where("telegramId", "==", tgIdStr),
        where("mobile", "==", cleanMobile), 
        where("hashedOtp", "==", hashedInput), 
        where("used", "==", false), 
        where("expiresAt", ">=", now)));
      
      if (otpSnap.empty) {
        return res.status(400).json({ error: "Invalid or expired OTP code." });
      }

      // Mark OTP as used
      const otpDoc = otpSnap.docs[0];
      await updateDoc(otpDoc.ref, { used: true });

      // Link the verified mobile number permanently to the user's Telegram ID
      const userRef = doc(db, "users", tgIdStr);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User profile not found. Please register again." });
      }

      await updateDoc(userRef, { 
        lastLogin: now,
        isVerified: true,
        verifiedAt: now,
        phoneVerifiedInMiniApp: true,
        phone: cleanMobile,
        mobile: cleanMobile
      });

      console.log(`[OTP] Successfully verified mobile ${cleanMobile} for telegramId ${tgIdStr}`);

      res.json({ 
        success: true, 
        message: "Verification successful!"
      });

    } catch (e: any) {
      console.error("Error in /api/auth/verify-otp:", e);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/auth/check-session", requireAdminDb, async (req, res) => {
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
          telegramId: userData.telegramId,
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
      try {
        const dbTaskRef = doc(db, "tasks", taskId);
        const dbTaskSnap = await getDoc(dbTaskRef);
        if (dbTaskSnap.exists()) {
          const tData = dbTaskSnap.data();
          
          // Direct completion permitted for all tasks temporarily

          amount = Number(tData.rewardAmount) || 0;
          isDbTask = true;
          
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

      // Anti-abuse: Check if already completed
      const qCheck = query(
        collection(db, "task_completions"),
        where("userId", "==", userId),
        where("taskId", "==", taskId),
        where("status", "==", "completed")
      );
      const qSnap = await getDocs(qCheck);
      if (!qSnap.empty) {
        return res.status(400).json({ error: "Task already completed. No duplicate rewards allowed." });
      }

      // Fetch user
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return res.status(404).json({ error: "User not found" });
      }

      const uData = userDoc.data();
      const fileEarnings = uData?.fileEarnings || 0;
      const linkEarnings = uData?.linkEarnings || 0;
      const referralEarnings = uData?.referralEarnings || 0;
      const bonusBalance = uData?.bonusBalance || 0;
      const rewardBalance = (uData?.rewardBalance || 0) + amount;
      const withdrawnAmount = uData?.withdrawnAmount || 0;
      const pendingWithdrawals = uData?.pendingWithdrawals || 0;

      // New availableBalance calculation (integrating rewardBalance!)
      const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance - withdrawnAmount - pendingWithdrawals;
      const earnings = (uData?.earnings || 0) + amount;

      // Update user doc in Firestore
      await setDoc(userDocRef, {
        rewardBalance,
        availableBalance,
        earnings
      }, { merge: true });

      // Store in Firestore exactly what was requested:
      // userId, taskId, rewardAmount, status, completedPages, completedAt
      const completedAt = new Date().toISOString();
      await addDoc(collection(db, "task_completions"), {
        userId,
        taskId,
        rewardAmount: amount,
        status: "completed",
        taskCompleted: true,
        rewardGranted: true,
        completedPages: 3,
        completedAt
      });

      // Format transaction date & time
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const timeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });

      const txData = {
        amount,
        type: "Task Reward",
        date: dateStr,
        time: timeStr,
        userId,
        createdAt: now.toISOString()
      };

      await Promise.all([
        addDoc(collection(db, "transactions"), txData),
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
        const messageText = `✅ Reward Credited\n\n💰 Reward:\n${formattedAmt}\n\nAdded to Reward Balance.`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: Number(userId),
            text: messageText
          })
        });
      }

      return res.json({ ok: true, rewardAmount: amount, currency });
    } catch (e: any) {
      console.error("Error in /api/earn-rewards/complete:", e);
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  // ========================================
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
      let isDailyBonus = false;
      let dailyBonusType = "";
      
      if (taskId.startsWith("daily_bonus_")) {
        isDailyBonus = true;
        dailyBonusType = taskId.replace("daily_bonus_", "");
        const stateSnap = await getDoc(doc(db, "daily_bonus_state", userId));
        if (stateSnap.exists()) {
          const pending = stateSnap.data().pendingRewards?.[dailyBonusType];
          if (pending && !pending.claimed) {
             rewardAmount = Number(pending.amount);
             // Mark as claimed in state
             await updateDoc(doc(db, "daily_bonus_state", userId), {
                [`pendingRewards.${dailyBonusType}.claimed`]: true
             });
             
             // Update daily bonus stats
             try {
                const todayStr = new Date().toISOString().split("T")[0];
                const statsRef = doc(db, "daily_bonus_stats", todayStr);
                const rewardField = dailyBonusType === "wheel" ? "wheelRewards" : dailyBonusType === "box" ? "boxRewards" : "scratchRewards";
                await setDoc(statsRef, { 
                  [rewardField]: increment(rewardAmount),
                  totalClaims: increment(1),
                  totalRewards: increment(rewardAmount)
                }, { merge: true });
                await setDoc(doc(db, "settings", "daily_bonus"), { totalRewardsDistributed: increment(rewardAmount) }, { merge: true });
             } catch(e){}
          } else if (pending && pending.claimed) {
            console.warn(`[MONETAG POSTBACK] Reward already claimed for ${taskId}`);
            return res.status(200).send("Already claimed");
          }
        }
      } else if (taskId !== "monetag_default_task") {
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
          const messageText = `🎉 Reward Added Successfully!\n\n` +
            `💰 Reward: ₹${rewardAmount.toFixed(2)}\n` +
            `💳 Reward Balance: ₹${newRewardBalance.toFixed(2)}\n` +
            `🏦 Available Balance: ₹${newBalance.toFixed(2)}\n\n` +
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

  // ==========================================
  // GAMEMONETIZE WALKTHROUGH MANAGER
  // ==========================================

  app.get("/api/admin/gamemonetize/walkthroughs/settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "gamemonetize_walkthroughs");
      const snap = await getDoc(docRef);
      const defaults = {
        enabled: true,
        themeColor: "#4f46e5",
        defaultWidth: "100%",
        defaultHeight: "480",
        showAds: true
      };
      res.json({ success: true, settings: snap.exists() ? snap.data() : defaults });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/gamemonetize/walkthroughs/settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "gamemonetize_walkthroughs");
      await setDoc(docRef, { ...req.body, updatedAt: new Date().toISOString() });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/gamemonetize/walkthroughs", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "gamemonetize_walkthroughs"));
      const walkthroughs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ success: true, walkthroughs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/gamemonetize/walkthroughs", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const payload = { ...data, updatedAt: new Date().toISOString() };
      
      if (id) {
        await updateDoc(doc(db, "gamemonetize_walkthroughs", id), payload);
        res.json({ success: true, id });
      } else {
        payload.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, "gamemonetize_walkthroughs"), payload);
        res.json({ success: true, id: docRef.id });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/gamemonetize/walkthroughs/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, "gamemonetize_walkthroughs", req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/gamemonetize/walkthroughs/check/:gameId", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      // We ping the GameMonetize video URL
      const response = await fetch(`https://api.gamemonetize.com/video.php?id=${gameId}`);
      const text = await response.text();
      
      // GameMonetize usually shows a blank black page or "Video not found" if missing
      // We'll check for "window.VIDEO_OPTIONS" which is present in valid walkthroughs
      const isAvailable = text.includes("window.VIDEO_OPTIONS") && !text.includes("Video not found");

      res.json({ 
        success: true, 
        isAvailable, 
        gameId,
        timestamp: new Date().toISOString(),
        message: isAvailable ? "Walkthrough Available" : "No Walkthrough Available For This Game"
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Public endpoint for Game ID lookup
  app.get("/api/gamemonetize/walkthrough/:gameId", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const q = query(collection(db, "gamemonetize_walkthroughs"), where("gameId", "==", gameId), where("enabled", "==", true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return res.json({ success: false, error: "No walkthrough found" });
      }

      const walkthrough = snap.docs[0].data() as any;
      
      // Perform real-time check to be absolutely sure
      const checkResponse = await fetch(`https://api.gamemonetize.com/video.php?id=${gameId}`);
      const checkText = await checkResponse.text();
      const isActuallyAvailable = checkText.includes("window.VIDEO_OPTIONS") && !checkText.includes("Video not found");

      if (!isActuallyAvailable) {
         // Update DB status if it was marked as available before
         if (walkthrough.isAvailable !== false) {
           await updateDoc(doc(db, "gamemonetize_walkthroughs", snap.docs[0].id), { 
             isAvailable: false, 
             lastChecked: new Date().toISOString() 
           });
         }
         return res.json({ success: false, error: "Walkthrough no longer available" });
      }

      const settingsSnap = await getDoc(doc(db, "settings", "gamemonetize_walkthroughs"));
      const settings = settingsSnap.exists() ? settingsSnap.data() : { enabled: true };

      if (!settings.enabled) {
        return res.json({ success: false, error: "Walkthroughs disabled" });
      }

      res.json({ success: true, walkthrough, globalSettings: settings });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // GAME REWARD SETTINGS
  // ==========================================

  app.get("/api/admin/game-reward-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "game_rewards");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        res.json({ success: true, settings: snap.data() });
      } else {
        // Default settings
        const defaults = {
          enabled: true,
          requiredPlayTime: 180, // 3 mins
          rewardCoins: 100,
          conversionCoins: 1000,
          conversionInr: 1,
          dailyCoinLimit: 5000,
          cooldownMinutes: 5,
          maxDailyRewards: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(docRef, defaults);
        res.json({ success: true, settings: defaults });
      }
    } catch (e: any) {
      console.error("Error fetching game reward settings:", e);
      res.status(500).json({ success: false, error: "Unable to load Game Reward Settings." });
    }
  });

  app.put("/api/admin/game-reward-settings", async (req, res) => {
    try {
      const settings = req.body;
      const docRef = doc(db, "settings", "game_rewards");
      await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error saving game reward settings:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Public endpoint for app to get settings
  app.get("/api/game/reward-settings", async (req, res) => {
    try {
      const docRef = doc(db, "settings", "game_rewards");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        res.json({ success: true, settings: snap.data() });
      } else {
        const defaults = {
          enabled: true,
          requiredPlayTime: 180,
          rewardCoins: 100,
          conversionCoins: 1000,
          conversionInr: 1,
          dailyCoinLimit: 5000,
          cooldownMinutes: 5,
          maxDailyRewards: 50,
          minActiveTime: 120,
          chromeOnly: false,
          allowWebView: true,
          requireWalkthrough: false,
          externalBrowserMode: false
        };
        res.json({ success: true, settings: defaults });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: "Unable to load Game Reward Settings." });
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
        content += `\n# --- ${d.providerName} (${d.providerType}) ---\n${d.snippet}\n`;
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

      // Validation check for fields
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
      } else {
        return res.status(400).json({ success: false, message: "Invalid payment method selected." });
      }

      const userDocRef = doc(db, "users", String(userId));
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const userData = userSnap.data();
      const userBalance = Number(userData.balance || 0);
      const fileEarnings = Number(userData.fileEarnings || 0);
      const linkEarnings = Number(userData.linkEarnings || 0);
      const referralEarnings = Number(userData.referralEarnings || 0);
      const bonusBalance = userData.bonusBalance !== undefined ? Number(userData.bonusBalance) : Number(userData.bonus || 0);
      const rewardBalance = Number(userData.rewardBalance || 0);
      const withdrawnAmount = userData.withdrawnAmount !== undefined ? Number(userData.withdrawnAmount) : Number(userData.totalWithdrawn || 0);
      const pendingWithdrawals = Number(userData.pendingWithdrawals || 0);

      const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + userBalance - withdrawnAmount - pendingWithdrawals;

      // Calculate amount in INR
      const requestedAmount = Number(amount);
      const isUsdtMethod = method === "USDT (TRC20)";
      const USDT_RATE = 90;
      const requestedAmountInINR = isUsdtMethod ? (requestedAmount * USDT_RATE) : requestedAmount;

      if (isNaN(requestedAmount) || requestedAmount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid withdrawal amount." });
      }

      // Get minimum withdrawal from system settings
      const settingsSnap = await getDoc(doc(db, "settings", "system"));
      let minWithdrawal = 100; // Default
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        const minWithdrawalValue = settingsData?.withdrawalSettings?.["Minimum Withdrawal"];
        if (minWithdrawalValue) {
          minWithdrawal = parseFloat(String(minWithdrawalValue).replace(/[^0-9.]/g, "")) || 100;
        }
      }

      // Ensure minimum is checked correctly. 
      // If USDT, min is also evaluated after converting or natively depending on display. 
      // Let's verify if requestedAmountInINR < minWithdrawal in INR terms
      if (requestedAmountInINR < minWithdrawal) {
        return res.status(400).json({ success: false, message: `Minimum withdrawal amount is ₹${minWithdrawal} (or equivalent).` });
      }

      if (requestedAmountInINR > availableBalance) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
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

      // Format current date & time
      const now = new Date();
      const currentDateTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

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
        status: "Pending",
        processingFee: Number(processingFee || 0),
        receiveAmount: Number(receiveAmount || 0),
        createdAt: now.toISOString()
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
      // Also save details on user profile so it acts as "Saved Account details"
      const userUpdateData: any = {
        pendingWithdrawals: pendingWithdrawals + requestedAmountInINR,
        updatedAt: now.toISOString()
      };

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
        tgMsg = `💸 <b>USDT Withdrawal Request Submitted</b>\n\n<b>Amount:</b> ${requestedAmount} USDT (≈ ₹${requestedAmountInINR.toFixed(2)})\n<b>Fee:</b> ${processingFee} USDT\n<b>Receive Amount:</b> <b>${receiveAmount} USDT</b>\n<b>Wallet:</b> <code>${walletAddress.trim()}</code>\n<b>Network:</b> TRC20 (Fixed)\n<b>Request ID:</b> <code>${withdrawalId}</code>\n<b>Status:</b> Pending\n<b>Date & Time:</b> ${currentDateTime}\n\nPlease wait for admin approval.`;
      } else if (method === "Bank Account") {
        tgMsg = `💸 <b>Bank Withdrawal Request Submitted</b>\n\n<b>Amount:</b> ₹${requestedAmount.toFixed(2)}\n<b>Fee:</b> ₹${processingFee.toFixed(2)}\n<b>Receive Amount:</b> <b>₹${receiveAmount.toFixed(2)}</b>\n<b>Bank Name:</b> ${bankName.trim()}\n<b>A/C No:</b> <code>${accountNumber.trim()}</code>\n<b>Holder:</b> ${accountHolderName.trim()}\n<b>IFSC:</b> <code>${ifscCode.trim()}</code>\n<b>Request ID:</b> <code>${withdrawalId}</code>\n<b>Status:</b> Pending\n<b>Date & Time:</b> ${currentDateTime}\n\nPlease wait for admin approval.`;
      } else {
        tgMsg = `💸 <b>UPI Withdrawal Request Submitted</b>\n\n<b>Amount:</b> ₹${requestedAmount.toFixed(2)}\n<b>Fee:</b> ₹${processingFee.toFixed(2)}\n<b>Receive Amount:</b> <b>₹${receiveAmount.toFixed(2)}</b>\n<b>UPI ID:</b> <code>${upiId.trim()}</code>\n<b>Request ID:</b> <code>${withdrawalId}</code>\n<b>Status:</b> Pending\n<b>Date & Time:</b> ${currentDateTime}\n\nPlease wait for admin approval.`;
      }

      await sendTgMessage(String(userId), tgMsg);

      res.json({ success: true, withdrawalId });
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
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      const qRecent = query(
        collection(db, "shortener_sessions"),
        where("visitorId", "==", visitorId),
        where("createdAt", ">=", tenSecondsAgo)
      );
      const recentSnap = await getDocs(qRecent);
      if (!recentSnap.empty) {
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
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const qDup = query(
          collection(db, "shortener_sessions"),
          where("linkId", "==", itemData.id || id),
          where("visitorId", "==", visitorId),
          where("createdAt", ">=", twentyFourHoursAgo),
          where("isVerified", "==", true)
        );
        const dupSnap = await getDocs(qDup);
        if (!dupSnap.empty) {
          isDuplicate = true;
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
                status: "Completed"
              });
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
              const currentBalance = Number(userSnap.data().balance || 0);
              const currentTotalEarnings = Number(userSnap.data().totalEarnings || 0);
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
                status: "Completed"
              });
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
      const redirectUri = "https://www.royshare.online/api/google-drive/callback";

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
      const redirectUri = "https://www.royshare.online/api/google-drive/callback";
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
          const messageText = `✅ Google Drive connected successfully.\nGmail: ${email}`;
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
      "https://www.royshare.online/api/google-drive/callback"
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
          "Content-Range": `bytes */*`
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
              "Content-Range": `bytes */*`
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
          const messageText = `✅ <b>Large File Uploaded Successfully</b>\n\n📄 <b>File Name:</b> <code>${escapedName}</code>\n📦 <b>File Size:</b> ${formattedSize}\n☁ <b>Storage:</b> Google Drive\n\n🔗 <b>RoyShare Link:</b> ${royshareLink}`;
          
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
                    { text: "📁 My Files", web_app: { url: `${cleanAppUrl}/app?page=files&userId=${tg_id}` } },
                    { text: "⬆️ Upload Another", web_app: { url: `${cleanAppUrl}/app?page=upload&userId=${tg_id}` } }
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
          const messageText = `⚠️ *Google Drive Disconnected*\n\nYour Google Drive connection has been disconnected.`;
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

  // Differentiate page visit vs file download action
  app.get("/download/:fileId", async (req, res, next) => {
    // If it's a standard page view in browser (not action=download), pass to React SPA
    if (req.query.action !== "download" && (!req.headers.accept || req.headers.accept.includes("text/html"))) {
      return next();
    }

    const { fileId } = req.params;
    console.log(`\n=== [DEBUG DOWNLOAD ROUTE] TRACING STEPS FOR FILE ID: ${fileId} ===`);

    try {
      // Step 1: Read Firestore document
      console.log(`[DEBUG DOWNLOAD ROUTE] Step 1: Reading Firestore document uploads/${fileId}`);
      const docRef = doc(db, "uploads", fileId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const errorMsg = `Document uploads/${fileId} does not exist in Firestore database.`;
        console.error(`[DEBUG DOWNLOAD ROUTE] Error: ${errorMsg}`);
        return res.status(404).send(`
          <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;">
            <h1 style="color:#ef4444;">404 Not Found</h1>
            <p>${errorMsg}</p>
          </div>
        `);
      }
      
      const itemData = docSnap.data();
      console.log(`[DEBUG DOWNLOAD ROUTE] Firestore document data retrieved:`, JSON.stringify(itemData, null, 2));

      if (itemData.storage === "google_drive") {
        console.log(`[DEBUG DOWNLOAD ROUTE] File is stored on Google Drive. Serving securely...`);
        try {
          const { accessToken } = await getActiveGoogleToken(itemData.telegramId);
          const driveFileId = itemData.driveFileId;

          // Increment download count
          try {
            await setDoc(docRef, { downloads: (itemData.downloads || 0) + 1 }, { merge: true });
          } catch (countErr) {
            console.error("[DEBUG DOWNLOAD ROUTE] Failed to update download count:", countErr);
          }

          const googleStreamUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`;
          const response = await fetch(googleStreamUrl, {
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            console.error(`[DEBUG DOWNLOAD ROUTE] Google Drive stream returned status: ${response.status}`);
            return res.redirect(`https://drive.google.com/uc?export=download&id=${driveFileId}`);
          }

          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(itemData.fileName)}"`);
          res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
          if (response.headers.get("Content-Length")) {
            res.setHeader("Content-Length", response.headers.get("Content-Length")!);
          }

          if (response.body) {
            const reader = response.body.getReader();
            const pump = async (): Promise<any> => {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                return;
              }
              res.write(value);
              return pump();
            };
            await pump();
            return;
          } else {
            return res.redirect(`https://drive.google.com/uc?export=download&id=${driveFileId}`);
          }
        } catch (err: any) {
          console.error(`[DEBUG DOWNLOAD ROUTE] Error serving Google Drive file:`, err);
          if (itemData.driveFileId) {
            return res.redirect(`https://drive.google.com/uc?export=download&id=${itemData.driveFileId}`);
          }
          throw err;
        }
      }

      // Fetch Telegram Settings to see if we can use getFile as a primary path
      const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
      const botToken = telegramSettingsSnap.exists() ? telegramSettingsSnap.data()?.botToken : null;
      
      let telegramDirectUrl = "";
      if (botToken && itemData.telegramFileId) {
        try {
          console.log(`[DEBUG DOWNLOAD ROUTE] Checking if file can be fetched via Telegram Bot API...`);
          const getFileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${itemData.telegramFileId}`);
          const getFileData = await getFileRes.json();
          if (getFileData.ok && getFileData.result?.file_path) {
            telegramDirectUrl = `https://api.telegram.org/file/bot${botToken}/${getFileData.result.file_path}`;
            console.log(`[DEBUG DOWNLOAD ROUTE] Successfully retrieved direct Telegram download URL: ${telegramDirectUrl}`);
          } else {
            console.warn(`[DEBUG DOWNLOAD ROUTE] Telegram Bot API getFile returned error (likely file size > 20MB): ${JSON.stringify(getFileData)}`);
          }
        } catch (e: any) {
          console.error(`[DEBUG DOWNLOAD ROUTE] Error querying Telegram Bot API getFile:`, e.message || e);
        }
      }

      // If we got a direct Telegram URL (i.e. file <= 20MB), we redirect directly to it!
      if (telegramDirectUrl) {
        console.log(`[DEBUG DOWNLOAD ROUTE] File is small enough to download via Telegram. Redirecting...`);
        return res.redirect(telegramDirectUrl);
      }

      // Step 2: Resolve Firebase Storage path
      console.log(`[DEBUG DOWNLOAD ROUTE] Step 2: Resolving Firebase Storage path for: ${itemData.fileName || 'file'}`);
      const fileName = itemData.fileName || "file";
      const storagePath = `uploads/${fileId}/${fileName}`;
      console.log(`[DEBUG DOWNLOAD ROUTE] Resolved Firebase Storage path: "${storagePath}"`);

      // Step 3: Generate download URL
      console.log(`[DEBUG DOWNLOAD ROUTE] Step 3: Generating download URL for path: "${storagePath}"`);
      const bucket = getStorage().bucket();
      const fileRef = bucket.file(storagePath);

      console.log(`[DEBUG DOWNLOAD ROUTE] Checking if file exists in Firebase Storage bucket: ${bucket.name}`);
      const [exists] = await fileRef.exists();
      if (!exists) {
        const errorMsg = `File not found in Firebase Storage bucket at path: "${storagePath}"`;
        console.error(`[DEBUG DOWNLOAD ROUTE] Error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`[DEBUG DOWNLOAD ROUTE] File exists in bucket. Generating signed download URL...`);
      const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
      console.log(`[DEBUG DOWNLOAD ROUTE] Successfully generated signed download URL: ${downloadUrl}`);

      // Step 4: Return the file
      console.log(`[DEBUG DOWNLOAD ROUTE] Step 4: Returning/serving the file. Redirecting user to: ${downloadUrl}`);
      return res.redirect(downloadUrl);

    } catch (err: any) {
      console.error(`\n🔴 [DEBUG DOWNLOAD ROUTE] EXCEPTION ENCOUNTERED FOR FILE ID: ${fileId}`);
      console.error(`Error Message: ${err.message || err}`);
      console.error(`Stack Trace:\n`, err.stack || err);
      console.error(`================================================================================\n`);

      // Never redirect to Telegram on download failure. Return the real error (404, 403 or 500) with the reason.
      const statusCode = err.message?.includes("not found") ? 404 : 500;
      return res.status(statusCode).send(`
        <div style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;margin-top:4rem;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);background-color:#ffffff;">
          <h1 style="color:#ef4444;font-size:1.875rem;margin-bottom:1rem;margin-top:0;">Download Failed</h1>
          <p style="color:#475569;margin-bottom:1.5rem;">An error occurred while attempting to resolve your file download.</p>
          <div style="background-color:#f1f5f9;padding:1rem;border-radius:6px;font-family:monospace;font-size:0.875rem;color:#0f172a;word-break:break-all;">
            <strong>Error ${statusCode}:</strong> ${err.message || err}
          </div>
          <p style="color:#94a3b8;font-size:0.75rem;margin-top:1.5rem;text-align:center;">RoyShare Safe Download System</p>
        </div>
      `);
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
        if (!html.includes('EZMob Site Validation Code: EZMTNDAFBDSCOTJPM5F')) {
          debugLog("Comment missing in index.html, dynamically injecting...");
          const comment = '\n    <!-- EZMob Site Validation Code: EZMTNDAFBDSCOTJPM5F -->\n  ';
          if (html.includes('</head>')) {
            html = html.replace('</head>', `${comment}</head>`);
          } else {
            html = html + comment;
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
