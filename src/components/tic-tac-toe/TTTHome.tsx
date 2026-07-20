import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Coins, Play, X, UserCheck, Loader2, ArrowLeft, Grid, Compass, AlertCircle, RefreshCw, Trophy, HelpCircle } from "lucide-react";
import { db } from "../../lib/firebase";
import { getDoc, onSnapshot } from "firebase/firestore";
import { doc } from "../../lib/botDb";
import { API_BASE } from "../../config/api";

interface TTTHomeProps {
  onBack: () => void;
  onJoinMatch: (matchId: string) => void;
  userId: string;
}

export default function TTTHome({ onBack, onJoinMatch, userId }: TTTHomeProps) {
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

  const [searchTimer, setSearchTimer] = useState(0);
  const [timeoutError, setTimeoutError] = useState(false);

  const [matchmakeIntervalId, setMatchmakeIntervalId] = useState<any>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    console.log(`[TTT HOME] Initializing with userId: ${userId}`);

    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "ttt"));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (err) {
        console.error("[TTT HOME] Failed to load settings:", err);
      }
      setLoading(false);
    };

    loadSettings();

    const unsubUser = onSnapshot(doc(db, "users", String(userId)), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    });

    const unsubQueue = onSnapshot(doc(db, "ttt_queue", String(userId)), (docSnap) => {
      if (docSnap.exists()) {
        const qData = docSnap.data();
        if (qData.status === "matched" && qData.matchId) {
          const completedMatches = JSON.parse(sessionStorage.getItem("ttt_completed") || "[]");
          if (!completedMatches.includes(qData.matchId)) {
            stopMatchmaking();
            onJoinMatch(qData.matchId);
          } else {
            console.log("[TTT QUEUE] Ignoring completed match:", qData.matchId);
            setSearching(false);
          }
        } else if (qData.status === "searching") {
          setSearching(true);
          setPublicCode(qData.publicCode);
        }
      } else {
        setSearching(false);
      }
    }, (error) => {
      console.error("[TTT QUEUE STATE] Listen failed:", error);
    });

    return () => {
      unsubUser();
      unsubQueue();
      stopMatchmaking();
      stopSearchTimer();
    };
  }, [userId]);

  const startSearchTimer = () => {
    stopSearchTimer();
    setSearchTimer(0);
    setTimeoutError(false);

    timerIntervalRef.current = setInterval(() => {
      setSearchTimer((prev) => {
        const nextTime = prev + 1;
        if (nextTime >= 30) {
          handleCancelQueue(true);
        }
        return nextTime;
      });
    }, 1000);
  };

  const stopSearchTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startMatchmaking = () => {
    if (matchmakeIntervalId) return;

    triggerMatchmakeAPI();
    const interval = setInterval(() => {
      triggerMatchmakeAPI();
    }, 2000);
    setMatchmakeIntervalId(interval);
    startSearchTimer();
  };

  const stopMatchmaking = () => {
    if (matchmakeIntervalId) {
      clearInterval(matchmakeIntervalId);
      setMatchmakeIntervalId(null);
    }
    stopSearchTimer();
  };

  const triggerMatchmakeAPI = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ttt-battle/matchmake`, {
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
      console.error("[TTT MATCHMAKING] Poll error:", err);
    }
  };

  const handleJoinQueue = async () => {
    setJoining(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/ttt-battle/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId })
      });

      const data = await res.json();
      if (data.success) {
        setShowConfirm(false);
        setPublicCode(data.publicCode);
        setSearching(true);
        startMatchmaking();
      } else {
        setErrorMsg(data.message || "Failed to join battle lobby");
      }
    } catch (err) {
      console.error("[TTT HOME] join API error:", err);
      setErrorMsg("Connection error. Try again.");
    }
    setJoining(false);
  };

  const handleCancelQueue = async (wasTimeout = false) => {
    stopMatchmaking();
    try {
      await fetch(`${API_BASE}/api/ttt-battle/cancel-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId })
      });
    } catch (err) {
      console.error("[TTT HOME] cancel queue API error:", err);
    }
    setSearching(false);
    if (wasTimeout) {
      setTimeoutError(true);
    }
  };

  const totalUserBalance = (userProfile.balance || 0) + (userProfile.rewardBalance || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Entering Battle Lobby...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-4 border-b border-slate-850 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-emerald-400" /> TTT Battle Arena
            </h1>
            <p className="text-[10px] text-slate-500">Fast Matchmaking 3x3 Board</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-black text-slate-200">₹{totalUserBalance.toFixed(2)}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full justify-between pb-8 relative z-10">
        
        {/* Banner Area */}
        <div className="space-y-6 mt-2">
          
          {/* Main Visual Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 text-center space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
            
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/15">
              <Grid className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Tic Tac Toe Battle</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Connect three of your marks in a horizontal, vertical, or diagonal row to claim the prize!
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3 bg-slate-950/65 rounded-2xl border border-slate-900 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Entry Fee</p>
                <p className="text-sm font-black text-emerald-400 mt-1">₹{settings.entryFee || 5}</p>
              </div>
              <div className="p-3 bg-slate-950/65 rounded-2xl border border-slate-900 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prize Pool</p>
                <p className="text-sm font-black text-indigo-400 mt-1">₹{settings.prizePool || 20}</p>
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-slate-900/30 border border-slate-850/60 p-4 rounded-2xl space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Combat Regulations
            </h4>
            <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Turn Timers: Players have <strong className="text-slate-200">{settings.moveTimer || 10} seconds</strong> per move.</li>
              <li>AIs will replace absent players automatically after the queue wait time.</li>
              <li>If you disconnect or close the screen, the match status will save for 30s.</li>
            </ul>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="space-y-4 mt-8">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-400 animate-bounce">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search State Overlay */}
          <AnimatePresence>
            {searching && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/15">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold">Finding Worthy Opponent...</h3>
                  <p className="text-[10px] text-slate-400">Matchmaking Queue is active. Waiting time: {searchTimer}s</p>
                </div>

                <div className="py-2.5 px-4 bg-slate-950/60 rounded-xl font-mono text-xs text-indigo-400 border border-slate-905">
                  LOBBY ID: {publicCode || "Generating..."}
                </div>

                <button
                  onClick={() => handleCancelQueue(false)}
                  className="w-full py-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 font-extrabold rounded-xl text-xs transition"
                >
                  Cancel Matchmaking
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeout Fallback Card */}
          <AnimatePresence>
            {timeoutError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-3xl bg-slate-900 border border-rose-500/25 text-center space-y-4 shadow-xl"
              >
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-rose-400">Matchmaking Timeout</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    No active players were found. Your entry fee was automatically returned to your wallet. You can try joining again.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setTimeoutError(false);
                    setShowConfirm(true);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg"
                >
                  Join Queue Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lobby Entrance Confirm Modal */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl relative"
              >
                <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Confirm Battle Registration</span>
                  <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 py-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Combat Entry Fee:</span>
                    <strong className="text-emerald-400 font-extrabold">₹{settings.entryFee}.00</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Your Wallet Balance:</span>
                    <span className="text-slate-200 font-bold">₹{totalUserBalance.toFixed(2)}</span>
                  </div>

                  <div className="h-[1px] bg-slate-850 my-2" />

                  {totalUserBalance < settings.entryFee ? (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/15 rounded-xl text-[10px] font-bold text-rose-400">
                      Insufficient Balance. Please add funds to join this Arena match.
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Entering the lobby deducts ₹{settings.entryFee} immediately from your wallet. If you cancel searching, it will be refunded.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-750"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleJoinQueue}
                    disabled={totalUserBalance < settings.entryFee || joining}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Confirm Entry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Start Button */}
          {!searching && !showConfirm && !timeoutError && (
            <button
              onClick={() => {
                if (settings.enabled === false) {
                  setErrorMsg("Tic Tac Toe Battle is currently disabled.");
                } else {
                  setShowConfirm(true);
                }
              }}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2.5 transition shadow-lg hover:shadow-emerald-500/10"
            >
              <Play className="w-4 h-4 fill-white" />
              Find Combat Match (₹{settings.entryFee})
            </button>
          )}

        </div>

      </main>

    </div>
  );
}
