import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, Sparkles, AlertCircle, ArrowLeft, Award, Globe, HelpCircle } from "lucide-react";
import { API_BASE } from "../config/api";

export default function GPVerifyPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [taskTitle, setTaskTitle] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get("userId");
  const taskId = searchParams.get("taskId");

  useEffect(() => {
    if (!userId || !taskId) {
      setError("Missing userId or taskId parameters.");
      setLoading(false);
      return;
    }

    const verifyTask = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/gplinks-tasks/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, taskId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccess(true);
          setRewardAmount(data.rewardAmount);
          setCurrency(data.currency || "INR");
          setTaskTitle(data.taskTitle || "Shortener Smart Task");
        } else {
          setError(data.error || "Verification failed. Please ensure the timer has completed and you did not exit early.");
        }
      } catch (err: any) {
        console.error("Error verifying shortener task:", err);
        setError("Network error. Please try again or refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    verifyTask();
  }, [userId, taskId]);

  const handleClose = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.close();
    } else {
      window.close();
    }
  };

  const formatReward = (amount: number) => {
    if (currency === "USD") {
      const usd = amount * 0.0118;
      return `$${usd.toFixed(4)}`;
    }
    return `₹${amount.toFixed(4)}`;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative text-center"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs shadow-md shadow-blue-900/20">
            RS
          </div>
          <span className="font-extrabold text-sm tracking-widest text-slate-400 uppercase">RoyShare Verification</span>
        </div>

        {loading ? (
          <div className="space-y-6 py-8">
            <div className="relative w-20 h-20 mx-auto">
              <Loader2 className="w-20 h-20 text-blue-500 animate-spin absolute top-0 left-0" />
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center absolute top-4 left-4 text-blue-400">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Verifying Shortener Link...</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Validating your timer completion and destination page load. Please do not close this tab.
              </p>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/20"
            >
              <CheckCircle2 size={44} className="animate-bounce" />
            </motion.div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-emerald-400 tracking-tight">🎉 Reward Credited!</h2>
              <p className="text-sm text-slate-400 font-medium">{taskTitle}</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 max-w-xs mx-auto relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Award size={80} />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mb-2">Coins Earned</p>
              <p className="text-4xl font-black text-amber-400 tracking-tight">
                {rewardAmount !== null ? formatReward(rewardAmount) : "—"}
              </p>
              <p className="text-[10px] text-emerald-400/80 mt-1.5 font-bold flex items-center justify-center gap-1">
                <Sparkles size={10} /> Added to Reward Balance
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Your points have been successfully added to your RoyShare wallet. You can now close this tab safely.
            </p>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/10 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>Close Verification Tab</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-500/15 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-950/10">
              <XCircle size={44} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-red-400 tracking-tight">Verification Blocked</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                {error}
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-left space-y-2 max-w-xs mx-auto">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-blue-400" /> Tips for Verification:
              </h4>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside font-medium leading-relaxed">
                <li>Wait for the complete countdown timer in the app.</li>
                <li>Navigate through the shortened link to the end.</li>
                <li>Do not close the page or exit early.</li>
              </ul>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white rounded-2xl font-bold transition-all text-sm border border-slate-700"
            >
              Return to Mini App
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
