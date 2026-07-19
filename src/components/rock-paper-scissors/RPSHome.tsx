import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Coins, Play, X, UserCheck, Loader2, ArrowLeft, Gamepad2, Compass, AlertCircle, RefreshCw } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { API_BASE } from "../../config/api";

interface RPSHomeProps {
  onBack: () => void;
  onJoinMatch: (matchId: string) => void;
  userId: string;
}

export default function RPSHome({ onBack, onJoinMatch, userId }: RPSHomeProps) {
  const [settings, setSettings] = useState<any>({
    enabled: true,
    entryFee: 5,
    prizePool: 20
  });
  const [userProfile, setUserProfile] = useState<any>({
    balance: 0,
    rewardBalance: 0
  });

  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [joining, setJoining] = useState(false);
  const [searching, setSearching] = useState(false);
  const [publicCode, setPublicCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Periodical matchmaking polling ref
  const [matchmakeIntervalId, setMatchmakeIntervalId] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch game settings
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "rps"));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
      setLoading(false);
    };

    loadSettings();

    // 2. Listen to user profile for balances
    const unsubUser = onSnapshot(doc(db, "users", String(userId)), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    });

    // 3. Listen to current queue state (if any)
    const unsubQueue = onSnapshot(doc(db, "rps_queue", String(userId)), (docSnap) => {
      if (docSnap.exists()) {
        const qData = docSnap.data();
        if (qData.status === "matched" && qData.matchId) {
          // Join the matched match
          stopMatchmaking();
          onJoinMatch(qData.matchId);
        } else if (qData.status === "searching") {
          setSearching(true);
          setPublicCode(qData.publicCode);
        }
      } else {
        setSearching(false);
      }
    });

    return () => {
      unsubUser();
      unsubQueue();
      stopMatchmaking();
    };
  }, [userId]);

  const startMatchmaking = () => {
    if (matchmakeIntervalId) return;

    // Immediately trigger matchmaking
    triggerMatchmakeAPI();

    const interval = setInterval(() => {
      triggerMatchmakeAPI();
    }, 2000);
    setMatchmakeIntervalId(interval);
  };

  const stopMatchmaking = () => {
    if (matchmakeIntervalId) {
      clearInterval(matchmakeIntervalId);
      setMatchmakeIntervalId(null);
    }
  };

  const triggerMatchmakeAPI = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rps-battle/matchmake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId })
      });
      const data = await res.json();
      if (data.success && data.status === "matched" && data.matchId) {
        stopMatchmaking();
        onJoinMatch(data.matchId);
      }
    } catch (err) {
      console.error("Matchmaking error:", err);
    }
  };

  const handlePlayClick = () => {
    setErrorMsg("");
    setShowConfirm(true);
  };

  const handleConfirmPlay = async () => {
    setJoining(true);
    setErrorMsg("");

    const totalBalance = (userProfile.balance || 0) + (userProfile.rewardBalance || 0);
    const entryFee = settings.entryFee || 5;

    if (totalBalance < entryFee) {
      setErrorMsg("Insufficient Balance. Please add funds to your wallet.");
      setJoining(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/rps-battle/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to join matchmaking.");
      }

      setPublicCode(data.publicCode || "");
      setShowConfirm(false);
      setSearching(true);
      startMatchmaking();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setJoining(false);
    }
  };

  const handleCancelQueue = async () => {
    stopMatchmaking();
    try {
      await fetch(`${API_BASE}/api/rps-battle/cancel-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId })
      });
    } catch (err) {
      console.error("Cancel queue failed:", err);
    }
    setSearching(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!settings.enabled) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
        <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h2 className="text-xl font-bold">RPS Battle</h2>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold">Under Maintenance</h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Rock Paper Scissors Battle is currently undergoing optimization. Please check back later!
          </p>
          <button onClick={onBack} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 font-bold rounded-xl text-sm transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none">
      
      {/* Dynamic Header */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={searching ? handleCancelQueue : onBack} className="p-2 hover:bg-slate-800 rounded-xl transition">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400 animate-pulse" /> RPS Battle Arena
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-indigo-400">
          <Coins className="w-3.5 h-3.5" />
          ₹{((userProfile.balance || 0) + (userProfile.rewardBalance || 0)).toFixed(2)}
        </div>
      </header>

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 max-w-md mx-auto w-full">
        
        <AnimatePresence mode="wait">
          {!searching ? (
            <motion.div 
              key="intro-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-8 text-center"
            >
              <div className="space-y-4">
                <div className="relative w-36 h-36 mx-auto bg-indigo-500/10 border-2 border-indigo-500/20 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                  <span className="text-6xl animate-bounce">✊</span>
                  <div className="absolute -top-1 -right-1 text-3xl transform rotate-12">✌️</div>
                  <div className="absolute -bottom-1 -left-1 text-3xl transform -rotate-12">✋</div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-black tracking-tight text-white bg-clip-text bg-gradient-to-r from-indigo-400 to-orange-400">
                    Rock Paper Scissors
                  </h1>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">The Ultimate Duel of Strategy</p>
                </div>
              </div>

              {/* Game Rules Card */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 text-left text-xs text-slate-400 space-y-2.5">
                <h4 className="font-bold text-slate-200 uppercase tracking-widest text-[10px]">Arena Instructions</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Both players submit Rock, Paper, or Scissors securely.</li>
                  <li>Winner claims the configurable Prize Pool.</li>
                  <li>In case of a draw, resolution matches active Draw mode.</li>
                  <li>Full server-authoritative engine prevents cheat strategies.</li>
                </ul>
              </div>

              <div className="space-y-4 pt-4 w-full">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlayClick}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2.5 transition-colors shadow-xl shadow-indigo-600/15"
                >
                  <Play className="w-4 h-4 fill-white" /> Enter Arena
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Queue Matchmaking Loader Screen */
            <motion.div 
              key="searching-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center space-y-12"
            >
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center shadow-xl">
                  <Compass className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black">Finding Opponent...</h3>
                  <p className="text-slate-400 text-xs">Matching with active human players first</p>
                </div>
              </div>

              {/* Matchmaking status cards */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">You</p>
                  <p className="text-sm font-black text-indigo-400 mt-1">{publicCode || "RS---"}</p>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/15 font-bold mt-2 inline-block">Ready</span>
                </div>
                <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl flex flex-col justify-center items-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Opponent</p>
                  <div className="flex gap-1.5 items-center mt-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 w-full">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancelQueue}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold rounded-xl border border-slate-800 text-xs transition"
                >
                  Cancel Matchmaking
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Entry Confirmation Popup */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black">Confirm Battle Entry</h3>
                    <p className="text-xs text-slate-400">Review game rules and ticket fee.</p>
                  </div>
                  <button onClick={() => setShowConfirm(false)} className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold">Game Type</span>
                      <span className="text-xs text-white font-black">RPS Battle Duel</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                      <span className="text-xs text-slate-400 font-bold">Entry Ticket Fee</span>
                      <span className="text-xs text-indigo-400 font-black">₹{settings.entryFee}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                      <span className="text-xs text-slate-400 font-bold">Prize Pool Reward</span>
                      <span className="text-xs text-emerald-400 font-black">₹{settings.prizePool}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl text-[10px] text-slate-500 leading-relaxed text-center">
                    By clicking Play, ₹{settings.entryFee} will be immediately deducted from your balance.
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={joining}
                    className="py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPlay}
                    disabled={joining}
                    className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-600/10"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Play"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
