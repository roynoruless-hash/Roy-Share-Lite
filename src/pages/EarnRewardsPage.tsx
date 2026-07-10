import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";
import { Clock, User, Award, AlertTriangle, CheckCircle2, ExternalLink, ShieldAlert, AlertCircle, Play, Zap } from "lucide-react";

// Types
interface Task {
  id: string;
  name: string;
  amount: number;
  adNetwork?: string;
  description?: string;
}

const AD_LINKS = [
  {
    title: "Hostinger - Premium Web Hosting",
    desc: "Get 70% off premium web hosting + Free SSL and Free Domain name. Plans starting at just ₹149/mo!",
    cta: "Claim Discount",
    url: "https://www.hostinger.com"
  },
  {
    title: "Binance - Trade Crypto Instantly",
    desc: "Join the world's largest cryptocurrency exchange. Trade BTC, ETH, and 500+ altcoins with the lowest trading fees.",
    cta: "Register & Trade",
    url: "https://www.binance.com"
  },
  {
    title: "Stake - Premium Online Casino",
    desc: "Play slots, blackjack, roulette and sports betting with 100% safe deposits.",
    cta: "Play Now",
    url: "https://stake.com"
  },
  {
    title: "Zomato - Order Hot Food",
    desc: "Craving delicious meals? Order from premium local restaurants and get super fast delivery + flat 50% discount!",
    cta: "Order Now",
    url: "https://www.zomato.com"
  }
];

export default function EarnRewardsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration and settings
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [currency, setCurrency] = useState<string>("INR");
  const [userName, setUserName] = useState<string>("User");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [botUsername, setBotUsername] = useState<string>("Roysharearn_bot");

  // Active Task State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [timer, setTimer] = useState<number>(30);
  const [isTimerFinished, setIsTimerFinished] = useState<boolean>(false);
  const [adClicked, setAdClicked] = useState<boolean>(false);
  const [adTimer, setAdTimer] = useState<number>(0);
  const [adTimerActive, setAdTimerActive] = useState<boolean>(false);

  // Completion State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState<boolean>(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [isTelegramApp, setIsTelegramApp] = useState<boolean>(false);
  const [showRewardAlreadyClaimed, setShowRewardAlreadyClaimed] = useState<boolean>(false);

  // Initialize Telegram WebApp and parse parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId");
    const queryTaskId = params.get("taskId");

    const checkTelegram = () => {
      const tg = (window as any).Telegram?.WebApp;
      
      console.log("[EarnRewardsPage] Checking Telegram context...");
      if (tg) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        const hasTgWebApp = !!(tg.initData && user?.id);
        setIsTelegramApp(hasTgWebApp);
        
        console.log("[EarnRewardsPage] Telegram Version:", tg.version);
        console.log("[EarnRewardsPage] Telegram User ID detected:", user?.id);
      } else {
        console.log("[EarnRewardsPage] Telegram SDK not found yet");
        setIsTelegramApp(false);
      }
    };

    // Check immediately
    checkTelegram();
    
    // Multiple retries to handle late script loading
    const timer1 = setTimeout(checkTelegram, 500);
    const timer2 = setTimeout(checkTelegram, 1500);
    
    const tg = (window as any).Telegram?.WebApp;
    const tgUserId = tg?.initDataUnsafe?.user?.id;

    const resolvedUserId = queryUserId || (tgUserId ? String(tgUserId) : null);
    const resolvedTaskId = queryTaskId || null;

    if (resolvedUserId) {
      setUserId(resolvedUserId);
    }
    if (resolvedTaskId) {
      setTaskId(resolvedTaskId);
    }

    if (!resolvedUserId || !resolvedTaskId) {
      setError("Missing query parameters (userId and taskId are required).");
      setLoading(false);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Fetch settings, user information, and tasks
  useEffect(() => {
    if (!userId || !taskId) return;

    setLoading(true);
    fetch(`${API_BASE}/api/earn-rewards/settings?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }

        setTimerDuration(0);
        setTimer(0);
        setCurrency(data.currency || "INR");
        setUserName(data.userName || "User");
        setCompletedTaskIds(data.completedTaskIds || []);
        setTasks(data.tasks || []);
        setBotUsername(data.botUsername || "Roysharearn_bot");

        const resolvedTask = (data.tasks || []).find((t: Task) => t.id === taskId);
        if (resolvedTask) {
          setCurrentTask(resolvedTask);
          // Check if already completed (anti-abuse)
          if ((data.completedTaskIds || []).includes(taskId)) {
            setShowRewardAlreadyClaimed(true);
          }
        } else {
          setError("Requested task not found.");
        }
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
        setError("Failed to connect to the server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, taskId]);

  // Main countdown timer
  useEffect(() => {
    if (loading || error || isCompletedSuccess || timer <= 0) {
      if (timer === 0 && !isTimerFinished) {
        setIsTimerFinished(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, error, isCompletedSuccess, timer, isTimerFinished]);

  // Redirect to Telegram Bot on success
  useEffect(() => {
    if (isCompletedSuccess) {
      const timerId = setTimeout(() => {
        window.location.href = `https://t.me/${botUsername}`;
      }, 3000);
      return () => clearTimeout(timerId);
    }
  }, [isCompletedSuccess, botUsername]);

  // Ad verification timer (5 seconds)
  useEffect(() => {
    if (!adTimerActive || adTimer <= 0) {
      if (adTimer === 0 && adTimerActive) {
        setAdTimerActive(false);
        setAdClicked(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setAdTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [adTimerActive, adTimer]);

  // Handle ad clicking
  const handleAdClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    if (!adClicked && !adTimerActive) {
      setAdTimer(5);
      setAdTimerActive(true);
    }
  };

  // Currency Formatter
  const formatValue = (amount: number) => {
    if (currency === "USD") {
      const usd = amount * 0.0118;
      return `$${usd.toFixed(2)}`;
    }
    return `₹${amount.toFixed(2)}`;
  };

  // Verify and Continue to next page
  const handleVerifyAndContinue = () => {
    if (!isTimerFinished) return;

    if (currentPage < 3) {
      // Transition to next page
      setCurrentPage((prev) => prev + 1);
      setTimer(timerDuration);
      setIsTimerFinished(false);
      // Optional: keep adClicked state or reset it. Let's keep it clicked to avoid annoying users, but require at least one click.
    } else {
      // Last page verification - complete the task!
      submitTaskCompletion();
    }
  };

  const submitTaskCompletion = () => {
    if (!userId || !taskId) return;
    setSubmitting(true);
    fetch(`${API_BASE}/api/earn-rewards/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, taskId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setIsCompletedSuccess(true);
        }
      })
      .catch((err) => {
        console.error("Error completing task:", err);
        setError("Failed to submit task verification.");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Close WebApp and return to bot chat
  const handleBackToBot = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.close();
    } else {
      // Fallback for desktop browser testing
      window.close();
      alert("Please return to your Telegram chat.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1118] text-white p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" id="loading-spinner"></div>
        <p className="text-gray-400 font-medium">Loading Reward Task...</p>
      </div>
    );
  }

  // Universal Telegram Environment Check
  if (!loading && !isTelegramApp && (userId || taskId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1118] text-white p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 text-amber-500">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Telegram Mini App Required</h1>
        <p className="text-gray-400 max-w-xs mb-8">
          This reward page is only accessible within the official Telegram Mini App. Please open it from the Telegram bot using the Mini App button.
        </p>
        <button
          onClick={() => window.location.href = `https://t.me/${botUsername}`}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all active:scale-95 flex items-center gap-2"
        >
          <Play size={18} className="fill-current" />
          Open In Telegram Bot
        </button>
        <div className="mt-8 text-[10px] text-slate-600 font-mono">
          Environment: Browser/Desktop Detected
        </div>
      </div>
    );
  }

  if (showRewardAlreadyClaimed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1118]/95 backdrop-blur-sm text-white p-6 text-center z-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl"
        >
          <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
            <AlertTriangle size={44} />
          </div>
          <h2 className="text-2xl font-black text-amber-400 mb-4">⚠️ Reward Already Claimed</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            You have already completed this reward task. Each reward task can only be claimed once. Please wait for new tasks to become available.
          </p>
          <button
            onClick={handleBackToBot}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-amber-900/20"
          >
            OK
          </button>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1118] text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 text-red-500 shadow-lg shadow-red-950/20">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-red-400">Action Blocked</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">{error}</p>
        <button
          onClick={handleBackToBot}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/30 transition-all duration-200"
          id="btn-error-back"
        >
          Return to Telegram Bot
        </button>
      </div>
    );
  }

  if (isCompletedSuccess && currentTask) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6 text-center overflow-hidden relative">
        {/* Decorative background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="max-w-md w-full bg-slate-900/80 border border-emerald-500/20 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative"
        >
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <CheckCircle2 size={44} />
          </div>

          <h2 className="text-3xl font-extrabold text-emerald-400 mb-2">✅ Task Completed</h2>
          <p className="text-gray-300 font-semibold mb-6 text-base">You are being redirected back to the bot...</p>
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">💰 Reward Earned</p>
            <p className="text-4xl font-black text-amber-400 tracking-tight">{formatValue(currentTask.amount)}</p>
            <p className="text-[10px] text-emerald-400/80 mt-2 font-medium">Credited to your balance</p>
          </div>

          <button
            onClick={() => window.location.href = `https://t.me/${botUsername}`}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/40 transition-all duration-200 flex items-center justify-center gap-2 text-lg animate-pulse"
            id="btn-congrats-back"
          >
            🤖 Return To Telegram Bot
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col justify-center py-6 px-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto space-y-10 text-center relative"
      >
        {/* Task Info */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest mx-auto">
            <Zap size={12} className="fill-current" />
            <span>Premium Task</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            {currentTask?.name || "Premium Reward Task"}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed px-4">
            {currentTask?.description || "Claim your reward coins instantly with zero advertisements."}
          </p>
        </div>

        {/* Reward Amount */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award size={120} />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">Total Reward Points</p>
          <p className="text-6xl font-black text-amber-400 drop-shadow-sm">
            {currentTask ? formatValue(currentTask.amount) : "—"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={14} />
            <span>Ad-free Verification Enabled</span>
          </div>
        </div>

        {/* Footer & Claim Controls */}
        <div className="space-y-4 pt-4">
          <button
            disabled={submitting}
            onClick={submitTaskCompletion}
            className={`w-full py-5 rounded-[2rem] font-black transition-all shadow-2xl flex flex-col items-center justify-center gap-2 text-xl active:scale-95 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/20`}
            id="btn-verify-continue"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} />
                <span>Claim Reward Coins</span>
              </div>
            )}
          </button>

          <button
            onClick={handleBackToBot}
            className="w-full py-4 text-slate-400 hover:text-white font-bold transition-colors text-sm"
          >
            ↩️ Return to Telegram Bot
          </button>
        </div>
      </motion.div>
    </div>
  );
}
