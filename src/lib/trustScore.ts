import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Adjusts the user's trust score and manages logs/alerts.
 * @param userId User's Telegram ID (string)
 * @param amount Amount to adjust (positive for increase, negative for decrease)
 * @param reason The reason for the change
 */
export async function adjustTrustScore(userId: string, amount: number, reason: string): Promise<{ success: boolean; oldScore: number; newScore: number } | null> {
  try {
    if (!userId) return null;
    const userRef = doc(db, "users", String(userId));
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const userData = userSnap.data();
    const oldScore = userData.trustScore !== undefined ? Number(userData.trustScore) : 50;
    const newScore = Math.max(0, Math.min(100, oldScore + amount));

    // If score actually changed, update and log
    if (oldScore !== newScore) {
      await updateDoc(userRef, { trustScore: newScore });

      // Log the change
      await addDoc(collection(db, "trust_logs"), {
        userId: String(userId),
        username: userData.username || userData.telegramUsername || "no_username",
        firstName: userData.firstName || "User",
        oldScore,
        newScore,
        change: amount,
        reason,
        createdAt: new Date().toISOString()
      });

      // If score dropped, send Telegram Alert to Admin Channel
      if (newScore < oldScore) {
        try {
          const tgDoc = await getDoc(doc(db, "settings", "telegram"));
          if (tgDoc.exists()) {
            const tgData = tgDoc.data();
            const botToken = tgData.botToken || process.env.TELEGRAM_BOT_TOKEN;
            const adminChatId = tgData.adminChatId || tgData.chatId;

            if (botToken && adminChatId) {
              const alertMsg = `🚨 <b>Trust Score Dropped</b>\n\n` +
                `👤 <b>User:</b> @${userData.username || "Unknown"}\n` +
                `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
                `📉 <b>Old Score:</b> <b>${oldScore}</b>\n` +
                `📈 <b>New Score:</b> <b>${newScore}</b>\n` +
                `🔎 <b>Reason:</b> ${reason}\n\n` +
                `<i>Review this user in your Admin Panel to investigate potential security risk.</i>`;

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
          }
        } catch (tgErr) {
          console.error("Failed to send Trust Score Drop alert:", tgErr);
        }
      }
    }

    return { success: true, oldScore, newScore };
  } catch (err) {
    console.error("Error in adjustTrustScore:", err);
    return null;
  }
}

/**
 * Returns security status details based on user trust score.
 */
export function getTrustLevel(score: number): {
  level: "Trusted" | "Verified" | "Watchlist" | "High Risk" | "Restricted";
  color: string;
  dotColor: string;
  benefits: string[];
} {
  if (score >= 80) {
    return {
      level: "Trusted",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dotColor: "bg-emerald-400",
      benefits: ["Instant rewards", "Fast withdrawals", "Lower verification"]
    };
  }
  if (score >= 60) {
    return {
      level: "Verified",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dotColor: "bg-blue-400",
      benefits: ["Normal processing"]
    };
  }
  if (score >= 40) {
    return {
      level: "Watchlist",
      color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      dotColor: "bg-yellow-400",
      benefits: ["Extra verification"]
    };
  }
  if (score >= 20) {
    return {
      level: "High Risk",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      dotColor: "bg-orange-400",
      benefits: ["Pending Review"]
    };
  }
  return {
    level: "Restricted",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
    benefits: ["No instant rewards", "Manual approval required"]
  };
}
