import express from "express";
import { getDb } from "../lib/firebase";
import { getDoc, runTransaction, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
import { doc, collection } from "../lib/botDb";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const router = express.Router();
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" }
});

router.use(apiLimiter);

function encryptId(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptId(text: any) {
  if (!text || typeof text !== "string") return "";
  try {
    const textParts = text.split(":");
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift() as string, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text;
  }
}

function getPublicCode(telegramId: string) {
  const hash = crypto.createHash("sha256").update(String(telegramId)).digest("hex");
  return "RS" + hash.substring(0, 5).toUpperCase();
}

// 1. Join matchmaking queue
router.post("/join", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    const settingsSnap = await getDoc(doc(db, "settings", "rps"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { enabled: true, entryFee: 5 };

    if (!settings || settings.enabled === false) {
      return res.status(400).json({ success: false, message: "Rock Paper Scissors Battle is currently disabled." });
    }

    const entryFee = settings.entryFee || 5;
    let newBalance = 0;

    await runTransaction(db, async (t) => {
      const queueRef = doc(db, "rps_queue", String(telegramId));
      const queueSnap = await t.get(queueRef);
      if (queueSnap.exists()) {
        throw new Error("You are already in matchmaking queue or match.");
      }

      const userRef = doc(db, "users", String(telegramId));
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      const totalBalance = (userData.balance || 0) + (userData.rewardBalance || 0);
      if (totalBalance < entryFee) {
        throw new Error("Insufficient Balance");
      }

      let deductFromReward = 0;
      let deductFromMain = 0;
      if (userData.rewardBalance >= entryFee) {
        deductFromReward = entryFee;
      } else {
        deductFromReward = userData.rewardBalance || 0;
        deductFromMain = entryFee - deductFromReward;
      }

      t.update(userRef, {
        rewardBalance: Math.max(0, (userData.rewardBalance || 0) - deductFromReward),
        balance: Math.max(0, (userData.balance || 0) - deductFromMain)
      });
      newBalance = totalBalance - entryFee;

      t.set(queueRef, {
        telegramId: String(telegramId),
        publicCode: getPublicCode(telegramId),
        joinedAt: serverTimestamp(),
        status: "searching",
        matchId: null,
        paidFromReward: deductFromReward,
        paidFromMain: deductFromMain
      });

      const txRef = doc(collection(db, "transactions"));
      t.set(txRef, {
        userId: String(telegramId),
        amount: entryFee,
        type: "debit",
        description: "RPS Battle Entry Fee",
        timestamp: serverTimestamp(),
        status: "completed"
      });
    });

    res.json({ success: true, newBalance, publicCode: getPublicCode(telegramId) });
  } catch (error: any) {
    console.error("[RPS SERVER] Error in /join:", error);
    const friendlyMessages = ["You are already in matchmaking queue or match.", "User not found", "Insufficient Balance", "Rock Paper Scissors Battle is currently disabled."];
    const isFriendly = friendlyMessages.includes(error.message);
    res.status(400).json({ success: false, message: isFriendly ? error.message : "Failed to join queue. Please try again." });
  }
});

// 2. Queue matchmaking poller / queue processor
router.post("/matchmake", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    const myQueueRef = doc(db, "rps_queue", String(telegramId));
    const myQueueSnap = await getDoc(myQueueRef);
    if (!myQueueSnap.exists()) return res.json({ success: false, status: "not_in_queue" });

    const myQueue = myQueueSnap.data();
    if (myQueue.status === "matched" && myQueue.matchId) {
      return res.json({ success: true, status: "matched", matchId: myQueue.matchId });
    }

    const queueQuery = query(collection(db, "rps_queue"), where("status", "==", "searching"));
    const queueSnaps = await getDocs(queueQuery);

    let opponent = null;
    for (const docSnap of queueSnaps.docs) {
      if (docSnap.id !== String(telegramId)) {
        opponent = { id: docSnap.id, ...docSnap.data() };
        break;
      }
    }

    const settingsSnap = await getDoc(doc(db, "settings", "rps"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { aiEnabled: true, humanWaitTime: 15, prizePool: 20, entryFee: 5 };

    if (opponent) {
      let matchId = null;
      await runTransaction(db, async (t) => {
        const tOpponentSnap = await t.get(doc(db, "rps_queue", opponent.id));
        const tMySnap = await t.get(myQueueRef);

        if (tOpponentSnap.data()?.status === "searching" && tMySnap.data()?.status === "searching") {
          const matchRef = doc(collection(db, "rps_matches"));
          matchId = matchRef.id;

          t.set(matchRef, {
            id: matchId,
            status: "active",
            prizePool: settings.prizePool || 20,
            entryFee: settings.entryFee || 5,
            player1: { encTelegramId: encryptId(String(telegramId)), publicCode: myQueue.publicCode, ready: false, choiceSubmitted: false, isAI: false },
            player2: { encTelegramId: encryptId(opponent.telegramId), publicCode: opponent.publicCode, ready: false, choiceSubmitted: false, isAI: false },
            createdAt: serverTimestamp()
          });

          t.update(myQueueRef, { status: "matched", matchId });
          t.update(doc(db, "rps_queue", opponent.id), { status: "matched", matchId });
        }
      });

      if (matchId) {
        return res.json({ success: true, status: "matched", matchId });
      }
    }

    const joinedAt = myQueue.joinedAt?.toDate() || new Date();
    const waitTime = (Date.now() - joinedAt.getTime()) / 1000;

    if (settings.aiEnabled && waitTime > (settings.humanWaitTime || 15)) {
      let matchId = null;
      await runTransaction(db, async (t) => {
        const tMySnap = await t.get(myQueueRef);
        if (tMySnap.data()?.status === "searching") {
          const matchRef = doc(collection(db, "rps_matches"));
          matchId = matchRef.id;

          const aiId = "AI_" + Date.now();
          const aiCode = "RP" + Math.floor(Math.random() * 90000 + 10000);

          t.set(matchRef, {
            id: matchId,
            status: "active",
            prizePool: settings.prizePool || 20,
            entryFee: settings.entryFee || 5,
            player1: { encTelegramId: encryptId(String(telegramId)), publicCode: myQueue.publicCode, ready: false, choiceSubmitted: false, isAI: false },
            player2: { encTelegramId: encryptId(aiId), publicCode: aiCode, ready: true, choiceSubmitted: true, isAI: true },
            createdAt: serverTimestamp()
          });

          // Generate AI choice based on configuration weights
          const rockWeight = settings.aiRockProb != null ? Number(settings.aiRockProb) : 34;
          const paperWeight = settings.aiPaperProb != null ? Number(settings.aiPaperProb) : 33;
          const rValue = Math.random() * 100;
          let aiChoice = "rock";
          if (rValue < rockWeight) {
            aiChoice = "rock";
          } else if (rValue < rockWeight + paperWeight) {
            aiChoice = "paper";
          } else {
            aiChoice = "scissors";
          }

          // Save AI's choice securely in private collection
          const decRef = doc(db, "rps_decisions", matchId);
          t.set(decRef, {
            player2Move: aiChoice
          }, { merge: true });

          t.update(myQueueRef, { status: "matched", matchId });
        }
      });

      if (matchId) {
        return res.json({ success: true, status: "matched", matchId });
      }
    }

    return res.json({ success: true, status: "searching" });
  } catch (error: any) {
    console.error("[RPS SERVER] Matchmaking Error:", error);
    res.status(400).json({ success: false, message: "An error occurred during matchmaking." });
  }
});

// 3. Cancel matchmaking queue
router.post("/cancel-queue", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    let refunded = false;

    await runTransaction(db, async (t) => {
      const qRef = doc(db, "rps_queue", String(telegramId));
      const qSnap = await t.get(qRef);
      if (!qSnap.exists()) return;

      const queueData = qSnap.data();
      if (queueData.status === "searching") {
        const userRef = doc(db, "users", String(telegramId));
        const userSnap = await t.get(userRef);
        if (userSnap.exists()) {
          const paidFromReward = queueData.paidFromReward || 0;
          const paidFromMain = queueData.paidFromMain || 0;
          const totalRefund = paidFromReward + paidFromMain;

          t.update(userRef, {
            balance: (userSnap.data().balance || 0) + paidFromMain,
            rewardBalance: (userSnap.data().rewardBalance || 0) + paidFromReward
          });

          if (totalRefund > 0) {
            t.set(doc(collection(db, "transactions")), {
              userId: String(telegramId),
              amount: totalRefund,
              type: "credit",
              description: "RPS Queue Refund",
              timestamp: serverTimestamp(),
              status: "completed"
            });
          }
          refunded = true;
        }
        t.delete(qRef);
      }
    });

    res.json({ success: true, refunded });
  } catch (error: any) {
    console.error("[RPS SERVER] Cancel Queue Error:", error);
    res.status(400).json({ success: false, message: "Failed to cancel matchmaking." });
  }
});

// Helper: Determine Winner
function getWinner(m1: string, m2: string): "player1" | "player2" | "draw" {
  if (m1 === m2) return "draw";
  if (
    (m1 === "rock" && m2 === "scissors") ||
    (m1 === "scissors" && m2 === "paper") ||
    (m1 === "paper" && m2 === "rock")
  ) {
    return "player1";
  }
  return "player2";
}

// Helper: Send Telegram Message for RPS
async function sendTelegramMessageRPS(botToken: string, chatId: string, text: string) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        text: text,
        parse_mode: "HTML"
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[RPS BOT] Failed to send message to ${chatId}:`, errText);
    } else {
      console.log(`[RPS BOT] Message successfully sent to ${chatId}`);
    }
  } catch (err) {
    console.error(`[RPS BOT] Error sending message to ${chatId}:`, err);
  }
}

// Helper: Format Time in IST
function formatTimeIndian() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

// Helper: Resolve match internally
async function resolveRPSMatchInternal(matchId: string): Promise<{ success: boolean; message?: string }> {
  const db = getDb();
  try {
    let notifications: any[] = [];

    await runTransaction(db, async (t) => {
      notifications = []; // Reset on each transaction attempt
      const matchRef = doc(db, "rps_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");
      const match = matchSnap.data();

      if (match.status === "completed" || match.status === "cancelled" || match.resultProcessed) {
        return;
      }

      const decRef = doc(db, "rps_decisions", matchId);
      const decSnap = await t.get(decRef);
      if (!decSnap.exists()) throw new Error("Decisions not submitted");
      const decisions = decSnap.data();

      const p1Move = decisions.player1Move;
      const p2Move = decisions.player2Move;

      if (!p1Move || !p2Move) {
        throw new Error("One or both player moves are missing");
      }

      const winnerResult = getWinner(p1Move, p2Move);
      const prizePool = match.prizePool || 20;
      const entryFee = match.entryFee || 5;

      const settingsSnap = await t.get(doc(db, "settings", "rps"));
      const settings = settingsSnap.exists() ? settingsSnap.data() : { drawMode: "refund" };
      const drawMode = settings.drawMode || "refund";

      // 1. Handle Draw
      if (winnerResult === "draw") {
        if (drawMode === "refund") {
          // Refund both players
          let u1Ref = null, u1Snap = null;
          let u2Ref = null, u2Snap = null;
          let u1BalanceAfter = 0;
          let u2BalanceAfter = 0;

          if (!match.player1.isAI) {
            u1Ref = doc(db, "users", decryptId(match.player1.encTelegramId));
            u1Snap = await t.get(u1Ref);
          }
          if (!match.player2.isAI) {
            u2Ref = doc(db, "users", decryptId(match.player2.encTelegramId));
            u2Snap = await t.get(u2Ref);
          }

          if (u1Snap?.exists() && u1Ref) {
            const u1Data = u1Snap.data();
            const u1BalanceBefore = u1Data.balance || 0;
            const u1RewardBefore = u1Data.rewardBalance || 0;
            u1BalanceAfter = u1BalanceBefore + u1RewardBefore + entryFee;

            t.update(u1Ref, { balance: increment(entryFee) });
            t.set(doc(collection(db, "transactions")), {
              userId: decryptId(match.player1.encTelegramId),
              amount: entryFee,
              type: "credit",
              description: "RPS Draw Refund",
              timestamp: serverTimestamp(),
              status: "completed"
            });

            const u1Username = u1Data.username || "None";
            const u1FirstName = u1Data.first_name || u1Data.firstName || "Player";
            t.set(doc(db, "rps_history", matchId + "_" + decryptId(match.player1.encTelegramId)), {
              gameId: matchId,
              userId: decryptId(match.player1.encTelegramId),
              username: u1Username,
              telegramId: decryptId(match.player1.encTelegramId),
              gameName: "Rock Paper Scissors",
              userChoice: p1Move,
              botChoice: p2Move,
              result: "Draw",
              reward: 0,
              walletBalanceAfter: u1BalanceAfter,
              timestamp: serverTimestamp()
            });

            notifications.push({
              type: "draw",
              userId: decryptId(match.player1.encTelegramId),
              reward: 0,
              walletBalance: u1BalanceAfter,
              gameId: matchId,
              userChoice: p1Move,
              botChoice: p2Move,
              username: u1Username,
              firstName: u1FirstName
            });
          }
          if (u2Snap?.exists() && u2Ref) {
            const u2Data = u2Snap.data();
            const u2BalanceBefore = u2Data.balance || 0;
            const u2RewardBefore = u2Data.rewardBalance || 0;
            u2BalanceAfter = u2BalanceBefore + u2RewardBefore + entryFee;

            t.update(u2Ref, { balance: increment(entryFee) });
            t.set(doc(collection(db, "transactions")), {
              userId: decryptId(match.player2.encTelegramId),
              amount: entryFee,
              type: "credit",
              description: "RPS Draw Refund",
              timestamp: serverTimestamp(),
              status: "completed"
            });

            const u2Username = u2Data.username || "None";
            const u2FirstName = u2Data.first_name || u2Data.firstName || "Player";
            t.set(doc(db, "rps_history", matchId + "_" + decryptId(match.player2.encTelegramId)), {
              gameId: matchId,
              userId: decryptId(match.player2.encTelegramId),
              username: u2Username,
              telegramId: decryptId(match.player2.encTelegramId),
              gameName: "Rock Paper Scissors",
              userChoice: p2Move,
              botChoice: p1Move,
              result: "Draw",
              reward: 0,
              walletBalanceAfter: u2BalanceAfter,
              timestamp: serverTimestamp()
            });

            notifications.push({
              type: "draw",
              userId: decryptId(match.player2.encTelegramId),
              reward: 0,
              walletBalance: u2BalanceAfter,
              gameId: matchId,
              userChoice: p2Move,
              botChoice: p1Move,
              username: u2Username,
              firstName: u2FirstName
            });
          }

          t.update(matchRef, {
            status: "completed",
            winner: "draw",
            resultProcessed: true,
            player1Move: p1Move,
            player2Move: p2Move,
            resolvedAt: Date.now()
          });

          // Cleanup queue
          t.delete(doc(db, "rps_queue", decryptId(match.player1.encTelegramId)));
          if (!match.player2.isAI) {
            t.delete(doc(db, "rps_queue", decryptId(match.player2.encTelegramId)));
          }

          // Global analytics
          const statsRef = doc(db, "stats", "rps");
          t.set(statsRef, {
            totalMatches: increment(1),
            draws: increment(1)
          }, { merge: true });

        } else if (drawMode === "rematch" || drawMode === "carry") {
          // Reset move selections for a rematch
          t.update(matchRef, {
            status: "active",
            player1: { ...match.player1, ready: false, choiceSubmitted: false },
            player2: match.player2.isAI ? match.player2 : { ...match.player2, ready: false, choiceSubmitted: false },
            drawBanner: true,
            drawModeLabel: drawMode === "carry" ? "Prize Carried Forward!" : "Draw! Rematch Activated"
          });

          // Clear decisions
          t.delete(decRef);

          // If AI opponent, pre-generate a new move
          if (match.player2.isAI) {
            const rockWeight = settings.aiRockProb != null ? Number(settings.aiRockProb) : 34;
            const paperWeight = settings.aiPaperProb != null ? Number(settings.aiPaperProb) : 33;
            const rValue = Math.random() * 100;
            let aiChoice = "rock";
            if (rValue < rockWeight) {
              aiChoice = "rock";
            } else if (rValue < rockWeight + paperWeight) {
              aiChoice = "paper";
            } else {
              aiChoice = "scissors";
            }
            t.set(decRef, { player2Move: aiChoice }, { merge: true });
          }
        }
      } else {
        // 2. We have a winner
        const winningPlayer = winnerResult === "player1" ? match.player1 : match.player2;
        const losingPlayer = winnerResult === "player1" ? match.player2 : match.player1;

        let uWinRef = null, uWinSnap = null;
        let winUserId = "";
        let winBalanceAfter = 0;

        if (!winningPlayer.isAI) {
          winUserId = decryptId(winningPlayer.encTelegramId);
          uWinRef = doc(db, "users", winUserId);
          uWinSnap = await t.get(uWinRef);
        }

        let uLoseRef = null, uLoseSnap = null;
        let loseUserId = "";
        let loseBalanceAfter = 0;

        if (!losingPlayer.isAI) {
          loseUserId = decryptId(losingPlayer.encTelegramId);
          uLoseRef = doc(db, "users", loseUserId);
          uLoseSnap = await t.get(uLoseRef);
        }

        if (uWinSnap?.exists() && uWinRef) {
          const winData = uWinSnap.data();
          const winBalanceBefore = winData.balance || 0;
          const winRewardBefore = winData.rewardBalance || 0;
          winBalanceAfter = winBalanceBefore + winRewardBefore + prizePool;

          t.update(uWinRef, { balance: increment(prizePool) });
          t.set(doc(collection(db, "transactions")), {
            userId: winUserId,
            amount: prizePool,
            type: "credit",
            description: "RPS Battle Win",
            timestamp: serverTimestamp(),
            status: "completed"
          });

          // Audit log
          t.set(doc(collection(db, "rps_audit_logs")), {
            matchId,
            winnerId: winUserId,
            payout: prizePool,
            timestamp: serverTimestamp(),
            type: "win_payout"
          });

          // Save game history for winner
          const winUsername = winData.username || "None";
          const winFirstName = winData.first_name || winData.firstName || "Player";
          t.set(doc(db, "rps_history", matchId + "_" + winUserId), {
            gameId: matchId,
            userId: winUserId,
            username: winUsername,
            telegramId: winUserId,
            gameName: "Rock Paper Scissors",
            userChoice: winnerResult === "player1" ? p1Move : p2Move,
            botChoice: winnerResult === "player1" ? p2Move : p1Move,
            result: "Win",
            reward: prizePool,
            walletBalanceAfter: winBalanceAfter,
            timestamp: serverTimestamp()
          });

          notifications.push({
            type: "win",
            userId: winUserId,
            reward: prizePool,
            walletBalance: winBalanceAfter,
            gameId: matchId,
            userChoice: winnerResult === "player1" ? p1Move : p2Move,
            botChoice: winnerResult === "player1" ? p2Move : p1Move,
            username: winUsername,
            firstName: winFirstName
          });
        }

        if (uLoseSnap?.exists() && uLoseRef) {
          const loseData = uLoseSnap.data();
          const loseBalanceBefore = loseData.balance || 0;
          const loseRewardBefore = loseData.rewardBalance || 0;
          loseBalanceAfter = loseBalanceBefore + loseRewardBefore; // Already deducted when entering match

          // Save game history for loser
          const loseUsername = loseData.username || "None";
          const loseFirstName = loseData.first_name || loseData.firstName || "Player";
          t.set(doc(db, "rps_history", matchId + "_" + loseUserId), {
            gameId: matchId,
            userId: loseUserId,
            username: loseUsername,
            telegramId: loseUserId,
            gameName: "Rock Paper Scissors",
            userChoice: winnerResult === "player1" ? p2Move : p1Move,
            botChoice: winnerResult === "player1" ? p1Move : p2Move,
            result: "Loss",
            reward: 0,
            walletBalanceAfter: loseBalanceAfter,
            timestamp: serverTimestamp()
          });

          notifications.push({
            type: "loss",
            userId: loseUserId,
            reward: 0,
            walletBalance: loseBalanceAfter,
            gameId: matchId,
            userChoice: winnerResult === "player1" ? p2Move : p1Move,
            botChoice: winnerResult === "player1" ? p1Move : p2Move,
            username: loseUsername,
            firstName: loseFirstName
          });
        }

        t.update(matchRef, {
          status: "completed",
          winner: winnerResult,
          winnerCode: winningPlayer.publicCode,
          resultProcessed: true,
          player1Move: p1Move,
          player2Move: p2Move,
          resolvedAt: Date.now()
        });

        // Cleanup queue
        t.delete(doc(db, "rps_queue", decryptId(match.player1.encTelegramId)));
        if (!match.player2.isAI) {
          t.delete(doc(db, "rps_queue", decryptId(match.player2.encTelegramId)));
        }

        // Global analytics
        const statsRef = doc(db, "stats", "rps");
        t.set(statsRef, {
          totalMatches: increment(1),
          wins: increment(1),
          revenue: increment(entryFee * 2 - prizePool),
          sponsoredRewards: increment(settings.platformSponsoredAmount || 0)
        }, { merge: true });
      }
    });

    // Send Telegram Notifications after transaction success
    try {
      const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
      if (telegramSettingsSnap.exists()) {
        const telData = telegramSettingsSnap.data();
        const botToken = telData?.botToken;
        const adminChatId = telData?.adminChatId || telData?.chatId;

        if (botToken) {
          const timeStr = formatTimeIndian();
          for (const notif of notifications) {
            let userText = "";
            if (notif.type === "win") {
              userText = `🎉 <b>You Won!</b>\n\n` +
                `🎮 <b>Game:</b> Rock Paper Scissors\n` +
                `💰 <b>Reward:</b> ₹${notif.reward}\n` +
                `💳 Credited to Roy Share Wallet\n` +
                `💼 <b>New Wallet Balance:</b> ₹${notif.walletBalance}\n` +
                `🆔 <b>Game ID:</b> <code>${notif.gameId}</code>\n` +
                `🕒 <b>Time:</b> ${timeStr}`;
            } else if (notif.type === "loss") {
              userText = `😔 <b>You Lost!</b>\n\n` +
                `🎮 <b>Game:</b> Rock Paper Scissors\n` +
                `💸 <b>Reward:</b> ₹0\n` +
                `💼 <b>Wallet Balance:</b> ₹${notif.walletBalance}\n` +
                `🆔 <b>Game ID:</b> <code>${notif.gameId}</code>\n` +
                `🕒 <b>Time:</b> ${timeStr}`;
            } else if (notif.type === "draw") {
              userText = `🤝 <b>Match Draw!</b>\n\n` +
                `🎮 No reward this round.\n` +
                `💼 <b>Wallet Balance:</b> ₹${notif.walletBalance}\n` +
                `🆔 <b>Game ID:</b> <code>${notif.gameId}</code>\n` +
                `🕒 <b>Time:</b> ${timeStr}`;
            }

            if (userText) {
              await sendTelegramMessageRPS(botToken, notif.userId, userText);
            }

            if (adminChatId) {
              const adminText = `🎮 <b>New RPS Match</b>\n\n` +
                `👤 <b>User:</b> ${notif.firstName || "Player"} (@${notif.username || "None"})\n` +
                `🆔 <b>Telegram ID:</b> <code>${notif.userId}</code>\n` +
                `🎯 <b>Result:</b> ${notif.type.toUpperCase()}\n` +
                `💰 <b>Reward:</b> ₹${notif.reward}\n` +
                `💼 <b>Wallet After Reward:</b> ₹${notif.walletBalance}\n` +
                `🕒 <b>Time:</b> ${timeStr}`;

              await sendTelegramMessageRPS(botToken, adminChatId, adminText);
            }
          }
        }
      }
    } catch (notifErr) {
      console.error("[RPS SERVER] Notifications processing failed:", notifErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[RPS SERVER] Resolve Match Failed:", err);
    return { success: false, message: err.message };
  }
}

// 4. Submit choice
router.post("/submit-move", async (req, res) => {
  try {
    const { telegramId, matchId, move, adCompleted } = req.body;
    if (!telegramId || !matchId || !move) return res.status(400).json({ success: false, message: "Missing parameter" });
    if (!["rock", "paper", "scissors"].includes(move)) return res.status(400).json({ success: false, message: "Invalid move" });

    const db = getDb();
    let showRevealAnimation = false;

    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "rps_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");

      const match = matchSnap.data();
      if (match.status !== "active") return; // already solved or inactive

      const p1Id = decryptId(match.player1.encTelegramId);
      const p2Id = decryptId(match.player2.encTelegramId);

      const isPlayer1 = p1Id === String(telegramId);
      const isPlayer2 = p2Id === String(telegramId);

      if (!isPlayer1 && !isPlayer2) throw new Error("Unauthorized move submission");

      // Anti-cheat double submission guard
      const decRef = doc(db, "rps_decisions", matchId);
      const decSnap = await t.get(decRef);
      const decisions = decSnap.exists() ? decSnap.data() : {};

      if (isPlayer1 && decisions.player1Move) throw new Error("Move already submitted");
      if (isPlayer2 && decisions.player2Move) throw new Error("Move already submitted");

      // Save the choice securely inside the private decisions document (server-authoritative)
      if (isPlayer1) {
        decisions.player1Move = move;
      } else {
        decisions.player2Move = move;
      }
      t.set(decRef, decisions, { merge: true });

      // Mark the player as ready in public match
      const p1Submitted = isPlayer1 ? true : !!match.player1.choiceSubmitted;
      const p2Submitted = isPlayer2 ? true : !!match.player2.choiceSubmitted;

      const p1Ready = isPlayer1 ? true : !!match.player1.ready;
      const p2Ready = isPlayer2 ? true : !!match.player2.ready;

      const updateData: any = {
        "player1.ready": p1Ready,
        "player1.choiceSubmitted": p1Submitted,
        "player2.ready": p2Ready,
        "player2.choiceSubmitted": p2Submitted
      };

      // If both players have submitted, initiate transition to revealing
      if (p1Submitted && p2Submitted) {
        updateData.status = "revealing";
        updateData.revealingStartedAt = Date.now();
        showRevealAnimation = true;
      }

      t.update(matchRef, updateData);

      // Increment global ads stats if completed
      if (adCompleted) {
        const statsRef = doc(db, "stats", "rps");
        t.set(statsRef, {
          adsCompleted: increment(1)
        }, { merge: true });
      }
    });

    res.json({ success: true, showRevealAnimation });
  } catch (error: any) {
    console.error("[RPS SERVER] submit-move error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to submit move" });
  }
});

// 5. Trigger match result calculation
router.post("/process-result", async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ success: false, message: "Missing matchId" });

  const result = await resolveRPSMatchInternal(matchId);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: result.message || "Failed to process result." });
  }
});

// 6. Match recovery poller
router.post("/recover", async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ success: false, message: "Missing matchId" });

  try {
    const db = getDb();
    const matchRef = doc(db, "rps_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      return res.json({ success: false, status: "CANCELLED" });
    }

    const match = matchSnap.data();
    const statusUpper = (match.status || "").toUpperCase();

    if (statusUpper === "COMPLETED" || statusUpper === "CANCELLED" || match.resultProcessed) {
      return res.json({ success: true, status: statusUpper });
    }

    // Force complete if stuck in revealing for over 5s
    const isRevealing = statusUpper === "REVEALING";
    const revealingElapsed = match.revealingStartedAt ? (Date.now() - match.revealingStartedAt) : 0;

    if (isRevealing && revealingElapsed > 5000) {
      const result = await resolveRPSMatchInternal(matchId);
      if (result.success) {
        return res.json({ success: true, status: "COMPLETED" });
      }
    }

    res.json({ success: true, status: statusUpper });
  } catch (error: any) {
    console.error("[RPS SERVER] Recover Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Refund match on failure / opponent disconnect
router.post("/refund-match", async (req, res) => {
  try {
    const { telegramId, matchId } = req.body;
    if (!telegramId || !matchId) return res.status(400).json({ success: false, message: "Missing parameters" });

    const db = getDb();
    let refunded = false;

    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "rps_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) return;

      const match = matchSnap.data();
      if (match.status === "completed" || match.status === "cancelled") return;

      const p1Id = decryptId(match.player1.encTelegramId);
      const p2Id = decryptId(match.player2.encTelegramId);

      if (p1Id !== String(telegramId) && p2Id !== String(telegramId)) return;

      const entryFee = match.entryFee || 5;

      let u1Ref = null, u2Ref = null;
      let u1Snap = null, u2Snap = null;

      if (!match.player1.isAI) {
        u1Ref = doc(db, "users", p1Id);
        u1Snap = await t.get(u1Ref);
      }
      if (!match.player2.isAI) {
        u2Ref = doc(db, "users", p2Id);
        u2Snap = await t.get(u2Ref);
      }

      t.update(matchRef, { status: "cancelled", cancelledReason: "Opponent disconnect refund" });

      if (u1Snap?.exists() && u1Ref) {
        t.update(u1Ref, { balance: increment(entryFee) });
        t.set(doc(collection(db, "transactions")), {
          userId: p1Id,
          amount: entryFee,
          type: "credit",
          description: "RPS Disconnect Refund",
          timestamp: serverTimestamp(),
          status: "completed"
        });
      }

      if (u2Snap?.exists() && u2Ref) {
        t.update(u2Ref, { balance: increment(entryFee) });
        t.set(doc(collection(db, "transactions")), {
          userId: p2Id,
          amount: entryFee,
          type: "credit",
          description: "RPS Disconnect Refund",
          timestamp: serverTimestamp(),
          status: "completed"
        });
      }

      t.delete(doc(db, "rps_queue", p1Id));
      if (!match.player2.isAI) {
        t.delete(doc(db, "rps_queue", p2Id));
      }

      refunded = true;
    });

    res.json({ success: true, refunded });
  } catch (error: any) {
    console.error("[RPS SERVER] Refund Match Error:", error);
    res.status(500).json({ success: false, message: "Failed to refund match." });
  }
});

export default router;
