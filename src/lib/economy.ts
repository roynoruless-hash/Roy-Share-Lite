import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, increment } from "firebase/firestore";
import { db } from "./firebase";
import { adjustTrustScore } from "./trustScore";

export interface EconomySettings {
  maxDailyRewardPerUser: number;
  maxDailyTasks: number;
  maxDailyVideoAds: number;
  maxDailyShortenerTasks: number;
  maxDailyGiveaways: number;
  dailyRewardBudget: number;
  monthlyRewardBudget: number;
  abnormalDailyEarningThreshold: number;
  abnormalTasksHourlyThreshold: number;
  abnormalReferralsHourlyThreshold: number;
  abnormalGiveawayWinsThreshold: number;
}

export const DEFAULT_ECONOMY_SETTINGS: EconomySettings = {
  maxDailyRewardPerUser: 500,
  maxDailyTasks: 20,
  maxDailyVideoAds: 30,
  maxDailyShortenerTasks: 20,
  maxDailyGiveaways: 5,
  dailyRewardBudget: 10000,
  monthlyRewardBudget: 250000,
  abnormalDailyEarningThreshold: 300,
  abnormalTasksHourlyThreshold: 10,
  abnormalReferralsHourlyThreshold: 8,
  abnormalGiveawayWinsThreshold: 3,
};

/**
 * Fetches the economy settings from Firestore settings/economy.
 * Automatically seeds the default settings if they do not exist.
 */
export async function getEconomySettings(): Promise<EconomySettings> {
  try {
    const configRef = doc(db, "settings", "economy");
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        maxDailyRewardPerUser: Number(data.maxDailyRewardPerUser ?? DEFAULT_ECONOMY_SETTINGS.maxDailyRewardPerUser),
        maxDailyTasks: Number(data.maxDailyTasks ?? DEFAULT_ECONOMY_SETTINGS.maxDailyTasks),
        maxDailyVideoAds: Number(data.maxDailyVideoAds ?? DEFAULT_ECONOMY_SETTINGS.maxDailyVideoAds),
        maxDailyShortenerTasks: Number(data.maxDailyShortenerTasks ?? DEFAULT_ECONOMY_SETTINGS.maxDailyShortenerTasks),
        maxDailyGiveaways: Number(data.maxDailyGiveaways ?? DEFAULT_ECONOMY_SETTINGS.maxDailyGiveaways),
        dailyRewardBudget: Number(data.dailyRewardBudget ?? DEFAULT_ECONOMY_SETTINGS.dailyRewardBudget),
        monthlyRewardBudget: Number(data.monthlyRewardBudget ?? DEFAULT_ECONOMY_SETTINGS.monthlyRewardBudget),
        abnormalDailyEarningThreshold: Number(data.abnormalDailyEarningThreshold ?? DEFAULT_ECONOMY_SETTINGS.abnormalDailyEarningThreshold),
        abnormalTasksHourlyThreshold: Number(data.abnormalTasksHourlyThreshold ?? DEFAULT_ECONOMY_SETTINGS.abnormalTasksHourlyThreshold),
        abnormalReferralsHourlyThreshold: Number(data.abnormalReferralsHourlyThreshold ?? DEFAULT_ECONOMY_SETTINGS.abnormalReferralsHourlyThreshold),
        abnormalGiveawayWinsThreshold: Number(data.abnormalGiveawayWinsThreshold ?? DEFAULT_ECONOMY_SETTINGS.abnormalGiveawayWinsThreshold),
      };
    } else {
      // Seed default settings
      await setDoc(configRef, DEFAULT_ECONOMY_SETTINGS);
      return DEFAULT_ECONOMY_SETTINGS;
    }
  } catch (err) {
    console.error("Error fetching economy settings:", err);
    return DEFAULT_ECONOMY_SETTINGS;
  }
}

/**
 * Updates economy settings in Firestore.
 */
export async function saveEconomySettings(settings: Partial<EconomySettings>): Promise<boolean> {
  try {
    const configRef = doc(db, "settings", "economy");
    await setDoc(configRef, settings, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving economy settings:", err);
    return false;
  }
}

/**
 * Evaluates whether a user is allowed to receive a reward, and applies Smart Reward Engine parameters.
 * @param userId User's Telegram ID
 * @param baseAmount The original base reward amount
 * @param rewardType The reward trigger category
 * @returns Evaluation metrics
 */
export async function evaluateReward(
  userId: string,
  baseAmount: number,
  rewardType: "video_ad" | "shortener_task" | "daily_bonus" | "referral_reward" | "giveaway"
): Promise<{
  allowed: boolean;
  finalAmount: number;
  isPending: boolean;
  isLimitReached: boolean;
  message?: string;
}> {
  try {
    const settings = await getEconomySettings();
    const userRef = doc(db, "users", String(userId));
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { allowed: false, finalAmount: 0, isPending: false, isLimitReached: false, message: "User not found" };
    }

    const userData = userSnap.data();
    const trustScore = userData.trustScore !== undefined ? Number(userData.trustScore) : 50;
    const fraudScore = userData.fraudScore !== undefined ? Number(userData.fraudScore) : 0;

    // 1. REWARD MULTIPLIER (based on Trust Score)
    let multiplier = 1.0;
    let isPending = false;

    if (trustScore >= 80) {
      multiplier = 1.0; // Trusted (100%)
    } else if (trustScore >= 60) {
      multiplier = 0.95; // Verified (95%)
    } else if (trustScore >= 40) {
      multiplier = 0.80; // Watchlist (80%)
    } else if (trustScore >= 20) {
      multiplier = 0.60; // High Risk (60%)
    } else {
      multiplier = 1.0; // Restricted (0-19) -> Reward Status: Pending Review
      isPending = true;
    }

    const finalAmount = Number((baseAmount * multiplier).toFixed(2));

    // 2. DAILY SAFETY LIMITS (User level)
    const todayStr = new Date().toISOString().split("T")[0];
    const limitsDocRef = doc(db, "users", String(userId), "economy_limits", todayStr);
    const limitsSnap = await getDoc(limitsDocRef);

    let limitsData = {
      totalEarnedToday: 0,
      tasksCompletedToday: 0,
      videoAdsToday: 0,
      shortenerTasksToday: 0,
      giveawaysToday: 0,
    };

    if (limitsSnap.exists()) {
      const d = limitsSnap.data();
      limitsData = {
        totalEarnedToday: Number(d.totalEarnedToday ?? 0),
        tasksCompletedToday: Number(d.tasksCompletedToday ?? 0),
        videoAdsToday: Number(d.videoAdsToday ?? 0),
        shortenerTasksToday: Number(d.shortenerTasksToday ?? 0),
        giveawaysToday: Number(d.giveawaysToday ?? 0),
      };
    }

    // Check Max Daily Reward
    if (limitsData.totalEarnedToday + finalAmount > settings.maxDailyRewardPerUser) {
      return { allowed: false, finalAmount: 0, isPending: false, isLimitReached: true, message: "Daily limit reached. Please come back tomorrow." };
    }

    // Check specific limits
    if (rewardType === "shortener_task") {
      if (limitsData.shortenerTasksToday >= settings.maxDailyShortenerTasks || limitsData.tasksCompletedToday >= settings.maxDailyTasks) {
        return { allowed: false, finalAmount: 0, isPending: false, isLimitReached: true, message: "Daily limit reached. Please come back tomorrow." };
      }
    } else if (rewardType === "video_ad") {
      if (limitsData.videoAdsToday >= settings.maxDailyVideoAds) {
        return { allowed: false, finalAmount: 0, isPending: false, isLimitReached: true, message: "Daily limit reached. Please come back tomorrow." };
      }
    } else if (rewardType === "giveaway") {
      if (limitsData.giveawaysToday >= settings.maxDailyGiveaways) {
        return { allowed: false, finalAmount: 0, isPending: false, isLimitReached: true, message: "Daily limit reached. Please come back tomorrow." };
      }
    }

    // 3. SMART PLATFORM BUDGET (Global level)
    const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM
    const globalDailyRef = doc(db, "economy_global_stats", `daily_${todayStr}`);
    const globalMonthlyRef = doc(db, "economy_global_stats", `monthly_${thisMonthStr}`);

    const [dailyGlobalSnap, monthlyGlobalSnap] = await Promise.all([
      getDoc(globalDailyRef),
      getDoc(globalMonthlyRef),
    ]);

    const dailyPaid = dailyGlobalSnap.exists() ? Number(dailyGlobalSnap.data().totalRewardsPaid ?? 0) : 0;
    const monthlyPaid = monthlyGlobalSnap.exists() ? Number(monthlyGlobalSnap.data().totalRewardsPaid ?? 0) : 0;

    // If platform budget is exhausted, place user into Pending Review
    if (dailyPaid + finalAmount > settings.dailyRewardBudget || monthlyPaid + finalAmount > settings.monthlyRewardBudget) {
      isPending = true;
    }

    // 4. ABNORMAL EARNING DETECTION
    // a. High Earning check
    if (limitsData.totalEarnedToday + finalAmount > settings.abnormalDailyEarningThreshold) {
      await updateDoc(userRef, { status: "High Risk", trustScore: 30 });
      await adjustTrustScore(userId, -20, "Abnormal Earning Triggered");
    }

    // b. Too many tasks completed in a short time (hourly completions check)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const completionsSnap = await getDocs(
      query(
        collection(db, "task_completions"),
        where("userId", "==", String(userId)),
        where("completedAt", ">=", oneHourAgo)
      )
    );
    if (completionsSnap.size >= settings.abnormalTasksHourlyThreshold) {
      await updateDoc(userRef, { status: "High Risk", trustScore: 30 });
      await adjustTrustScore(userId, -20, "Abnormal Speed Completions Detected");
    }

    // c. Too many referrals check (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const referralsSnap = await getDocs(
      query(
        collection(db, "users"),
        where("referredBy", "==", String(userId)),
        where("createdAt", ">=", oneDayAgo)
      )
    );
    if (referralsSnap.size >= settings.abnormalReferralsHourlyThreshold) {
      await updateDoc(userRef, { status: "High Risk", trustScore: 30 });
      await adjustTrustScore(userId, -25, "Abnormal Referral Surge Detected");
    }

    // d. Too many giveaway wins check
    const giveawayWinsSnap = await getDocs(
      query(
        collection(db, "upi_giveaway_entries"),
        where("telegramId", "==", String(userId)),
        where("isWinner", "==", true)
      )
    );
    if (giveawayWinsSnap.size >= settings.abnormalGiveawayWinsThreshold) {
      await updateDoc(userRef, { status: "High Risk", trustScore: 30 });
      await adjustTrustScore(userId, -15, "Excessive Giveaway Wins Detected");
    }

    // 5. UPDATE LIMITS & STATS (only if allowed and NOT pending review)
    // If pending review, we will track it under economy_global_stats as pending
    await setDoc(
      limitsDocRef,
      {
        totalEarnedToday: increment(isPending ? 0 : finalAmount),
        tasksCompletedToday: increment(rewardType === "shortener_task" ? 1 : 0),
        videoAdsToday: increment(rewardType === "video_ad" ? 1 : 0),
        shortenerTasksToday: increment(rewardType === "shortener_task" ? 1 : 0),
        giveawaysToday: increment(rewardType === "giveaway" ? 1 : 0),
      },
      { merge: true }
    );

    // Update Platform-wide totals
    await setDoc(
      globalDailyRef,
      {
        totalRewardsPaid: increment(isPending ? 0 : finalAmount),
        pendingRewards: increment(isPending ? finalAmount : 0),
        blockedRewards: increment(0), // Can be updated if fraud blocks it
        transactionCount: increment(isPending ? 0 : 1),
        pendingCount: increment(isPending ? 1 : 0),
      },
      { merge: true }
    );

    await setDoc(
      globalMonthlyRef,
      {
        totalRewardsPaid: increment(isPending ? 0 : finalAmount),
        pendingRewards: increment(isPending ? finalAmount : 0),
      },
      { merge: true }
    );

    return {
      allowed: true,
      finalAmount,
      isPending,
      isLimitReached: false,
      message: isPending ? "⏳ Reward is placed under security review due to economy protection checks." : undefined,
    };
  } catch (err) {
    console.error("Error in evaluateReward:", err);
    // Safe fallback if something breaks
    return { allowed: true, finalAmount: baseAmount, isPending: false, isLimitReached: false };
  }
}
