import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";
import { Clock, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, Zap, Award, ArrowLeft } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface Task {
  id: string;
  name: string;
  amount: number;
  description?: string;
  title?: string;
}

export default function RewardTasksPage({ userIdProp, taskIdProp, onBack }: { userIdProp?: string; taskIdProp?: string; onBack?: () => void } = {}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userName, setUserName] = useState("User");
  const [currency, setCurrency] = useState("INR");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [botUsername, setBotUsername] = useState("Roysharearn_bot");
  const [firestoreReadStatus, setFirestoreReadStatus] = useState("Pending");

  const [submitting, setSubmitting] = useState(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [showRewardAlreadyClaimed, setShowRewardAlreadyClaimed] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      setIsTelegramApp(!!(tg && user?.id));
    } else {
      setIsTelegramApp(false);
    }
  }, []);

  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp);
    }
    if (taskIdProp) {
      setTaskId(taskIdProp);
    }
    if (userIdProp && taskIdProp) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId");
    const queryTaskId = params.get("taskId");

    const tg = (window as any).Telegram?.WebApp;
    const tgUserId = tg?.initDataUnsafe?.user?.id;

    const resolvedUserId = queryUserId || (tgUserId ? String(tgUserId) : null);
    const resolvedTaskId = queryTaskId || null;

    if (resolvedUserId) setUserId(resolvedUserId);
    if (resolvedTaskId) setTaskId(resolvedTaskId);

    if (!resolvedUserId || !resolvedTaskId) {
      setError("Missing query parameters (userId and taskId are required).");
      setLoading(false);
    }
  }, [userIdProp, taskIdProp]);

  useEffect(() => {
    if (!userId || !taskId) return;

    const initializePage = async () => {
      try {
        setLoading(true);
        const tg = (window as any).Telegram?.WebApp;
        const isActuallyInTelegram = !!(tg && tg.initDataUnsafe?.user?.id);
        
        if (!isActuallyInTelegram && !userIdProp) {
          setError("Access denied: Please open this page from inside the official Telegram Mini App.");
          setLoading(false);
          return;
        }

        // Fetch Settings & User Information
        const settingsRes = await fetch(`${API_BASE}/api/earn-rewards/settings?userId=${userId}`);
        const data = await settingsRes.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setCurrency(data.currency || "INR");
        setUserName(data.userName || "User");
        setBotUsername(data.botUsername || "Roysharearn_bot");

        let resolvedTask: Task | null = null;
        let firestoreReadStatusLocal = "Pending";

        try {
          const taskDocRef = doc(db, "tasks", taskId);
          const taskDocSnap = await getDoc(taskDocRef);
          if (taskDocSnap.exists()) {
            const tData = taskDocSnap.data();
            resolvedTask = {
              id: taskId,
              name: tData.title || tData.name || "",
              amount: Number(tData.rewardAmount) || Number(tData.amount) || 0,
              description: tData.description || ""
            };
            firestoreReadStatusLocal = "Success";
          } else {
            firestoreReadStatusLocal = "Not Found in Firestore";
          }
        } catch (fErr: any) {
          console.error("Error reading task from Firestore:", fErr);
          firestoreReadStatusLocal = `Failed: ${fErr.message || fErr}`;
        }

        if (!resolvedTask) {
          if (data.tasks && Array.isArray(data.tasks)) {
            const found = data.tasks.find((t: any) => t.id === taskId);
            if (found) {
              resolvedTask = {
                id: found.id,
                name: found.name || found.title || "",
                amount: Number(found.amount) || 0,
                description: found.description || ""
              };
            }
          }
        }

        setFirestoreReadStatus(firestoreReadStatusLocal);

        if (resolvedTask) {
          setCurrentTask(resolvedTask);
          if ((data.completedTaskIds || []).includes(taskId)) {
            setShowRewardAlreadyClaimed(true);
          }
        } else {
          setError("Requested premium task not found.");
        }
      } catch (err) {
        console.error("Error setting up Premium Task Page:", err);
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [userId, taskId]);

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

  const handleBackToBot = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = `https://t.me/${botUsername}`;
    }
  };

  const formatValue = (amount: number) => {
    if (currency === "USD") {
      const usd = amount * 0.0118;
      return `$${usd.toFixed(2)}`;
    }
    return `₹${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1118] text-white">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading your task portal...</p>
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
            <Award size={44} />
          </div>
          <h2 className="text-2xl font-black text-amber-400 mb-4">⚠️ Reward Already Claimed</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            You have already completed this reward task. Each reward task can only be claimed once.
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
        <div className="w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 text-red-500 shadow-lg">
          <AlertCircle size={36} />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-red-400">Action Blocked</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">{error}</p>
        <button
          onClick={handleBackToBot}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold shadow-lg"
        >
          Return to Telegram Bot
        </button>
      </div>
    );
  }

  if (isCompletedSuccess && currentTask) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6 text-center overflow-hidden relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
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
            onClick={handleBackToBot}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-bold shadow-lg"
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
            <span>Premium Reward Task</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            {currentTask?.name || currentTask?.title || "Premium Reward Task"}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed px-4 font-medium">
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

        {/* Action Controls */}
        <div className="space-y-4 pt-4">
          <button
            disabled={submitting}
            onClick={submitTaskCompletion}
            className="w-full py-5 rounded-[2rem] font-black transition-all shadow-2xl flex flex-col items-center justify-center gap-2 text-xl active:scale-95 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/20"
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

          {onBack && (
            <button
              onClick={onBack}
              className="w-full py-4 text-slate-400 hover:text-white font-bold transition-colors text-sm"
            >
              ↩️ Back to Tasks List
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
