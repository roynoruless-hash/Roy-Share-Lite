import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Coins, HelpCircle, Loader2, RefreshCw, Trophy, AlertCircle, ArrowLeft, Grid, Wifi, WifiOff } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { API_BASE } from "../../config/api";

// Pure JavaScript SHA-256 for secure client public code calculation
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const lengthProperty = 'length';
  let i, j;
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let isPresent: any = {};
  words[asciiLength >> 2] |= 128 << (24 - (asciiLength % 4) * 8);
  words[((asciiLength + 8) >> 6 << 4) + 15] = asciiLength * 8;

  for (i = 0; i < words.length; i += 16) {
    const w = [];
    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] || 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e;
      e = (d + temp1) | 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) | 0;
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  let result = '';
  for (i = 0; i < 8; i++) {
    result += hash[i].toString(16).padStart(8, '0');
  }
  return result;
}

interface TTTMatchProps {
  matchId: string;
  onBack: () => void;
  userId: string;
}

export default function TTTMatch({ matchId, onBack, userId }: TTTMatchProps) {
  const [match, setMatch] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingMove, setSubmittingMove] = useState(false);
  const [documentMissing, setDocumentMissing] = useState(false);

  // Turn count timers
  const [timeLeft, setTimeLeft] = useState(10);
  const [opponentDisconnectTimeLeft, setOpponentDisconnectTimeLeft] = useState(30);

  // Ad verification state layers
  const [showAdBeforeMatch, setShowAdBeforeMatch] = useState(false);
  const [adCompletedBeforeMatch, setAdCompletedBeforeMatch] = useState(false);
  const [claimAdFinished, setClaimAdFinished] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const countdownTriggeredRef = useRef(false);
  const safetyTimeoutRef = useRef<any>(null);

  const myCode = useMemo(() => {
    try {
      const hashHex = sha256(String(userId));
      return "RS" + hashHex.substring(0, 5).toUpperCase();
    } catch (e) {
      return "RS" + String(userId).substring(0, 5).toUpperCase();
    }
  }, [userId]);

  // Read admin settings once
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "ttt"));
        if (snap.exists()) {
          const s = snap.data();
          setSettings(s);
          if (s.rewardAdsEnabled && s.rewardAdsMode === "mode1") {
            setShowAdBeforeMatch(true);
          }
        }
      } catch (e) {
        console.error("Error reading settings", e);
      }
    };
    fetchSettings();
  }, []);

  // Sync disconnect status on mount / unmount
  useEffect(() => {
    const updateDisconnect = async (disconnected: boolean) => {
      try {
        await fetch(`${API_BASE}/api/ttt-battle/handle-disconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId: userId, matchId, disconnected })
        });
      } catch (e) {
        console.error("Failed to update disconnect state:", e);
      }
    };

    updateDisconnect(false);

    return () => {
      updateDisconnect(true);
    };
  }, [userId, matchId]);

  // Main game observer
  useEffect(() => {
    console.log(`[TTT MATCH] Observing real-time state for ${matchId}...`);
    
    const unsub = onSnapshot(doc(db, "ttt_matches", matchId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMatch(data);
        setDocumentMissing(false);
        setLoading(false);
      } else {
        setDocumentMissing(true);
        setLoading(false);
      }
    }, (error) => {
      console.error("[TTT MATCH] Snapshot failed:", error);
      setDocumentMissing(true);
      setLoading(false);
    });

    return () => {
      unsub();
    };
  }, [matchId]);

  // Track completed match in sessionStorage to prevent auto-rejoining
  useEffect(() => {
    if (match?.status === "completed") {
      try {
        const completed = JSON.parse(sessionStorage.getItem("ttt_completed") || "[]");
        if (!completed.includes(matchId)) {
          completed.push(matchId);
          sessionStorage.setItem("ttt_completed", JSON.stringify(completed));
        }
      } catch (e) {
        console.error("Failed to save completed match id:", e);
      }
    }
  }, [match?.status, matchId]);

  // Turn count timer ticking
  useEffect(() => {
    if (!match || match.status !== "active") return;

    const timerLimit = match.moveTimer || 10;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - match.lastMoveAt) / 1000);
      const remaining = Math.max(0, timerLimit - elapsed);
      setTimeLeft(remaining);

      // If timer hit 0 and it is my turn, trigger recovery on server once
      if (remaining === 0 && match.turn === String(userId)) {
        clearInterval(interval);
        triggerRecovery();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [match?.turn, match?.lastMoveAt, match?.status]);

  // Opponent reconnect timer ticking
  useEffect(() => {
    if (!match || match.status !== "active") return;
    const opp = getOpponent();
    if (!opp || !opp.disconnected) {
      setOpponentDisconnectTimeLeft(30);
      return;
    }

    const maxTimeout = settings?.disconnectTimeout || 30;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (opp.disconnectedAt || Date.now())) / 1000);
      const remaining = Math.max(0, maxTimeout - elapsed);
      setOpponentDisconnectTimeLeft(remaining);

      // If timer hit 0, trigger disconnect resolution on server
      if (remaining === 0) {
        clearInterval(interval);
        triggerDisconnectTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [match?.player1?.disconnected, match?.player2?.disconnected, match?.status, settings]);

  const getMe = () => {
    if (!match) return null;
    return match.player1.publicCode === myCode ? match.player1 : match.player2;
  };

  const getOpponent = () => {
    if (!match) return null;
    return match.player1.publicCode === myCode ? match.player2 : match.player1;
  };

  const isMyTurn = () => {
    if (!match || match.status !== "active") return false;
    // If ad is required before starting, block turns until completed
    if (settings?.rewardAdsEnabled && settings?.rewardAdsMode === "mode1" && !adCompletedBeforeMatch) return false;
    return match.turn === String(userId);
  };

  const triggerRecovery = async () => {
    try {
      await fetch(`${API_BASE}/api/ttt-battle/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      });
    } catch (e) {
      console.error("Failed to recover match:", e);
    }
  };

  const triggerDisconnectTimeout = async () => {
    try {
      await fetch(`${API_BASE}/api/ttt-battle/handle-disconnect-timeout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      });
    } catch (e) {
      console.error("Failed to resolve disconnect:", e);
    }
  };

  const handleCellClick = async (index: number) => {
    if (!isMyTurn() || match.board[index] !== "" || submittingMove) return;

    setSubmittingMove(true);
    try {
      const res = await fetch(`${API_BASE}/api/ttt-battle/submit-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: userId,
          matchId,
          cellIndex: index
        })
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Move submission failed:", data.message);
      }
    } catch (e) {
      console.error("Connection error submitting move:", e);
    }
    setSubmittingMove(false);
  };

  const handleAdWatchBeforeStart = () => {
    if ((window as any).showadsbitvex) {
      console.log("[TTT MATCH] Launching Match start ad...");
      (window as any).showadsbitvex()
        .then(() => {
          setAdCompletedBeforeMatch(true);
          setShowAdBeforeMatch(false);
        })
        .catch((e: any) => {
          console.error("[TTT MATCH] Ad error. Bypassing safely:", e);
          setAdCompletedBeforeMatch(true);
          setShowAdBeforeMatch(false);
        });
    } else {
      setAdCompletedBeforeMatch(true);
      setShowAdBeforeMatch(false);
    }
  };

  const handleClaimPrize = async () => {
    setClaimingPrize(true);
    let adWatchPassed = false;

    // Trigger Reward Ad depending on Mode 2 or Mode 3
    const adRequired = settings?.rewardAdsEnabled !== false;
    if (adRequired && !claimAdFinished) {
      if ((window as any).showadsbitvex) {
        try {
          await (window as any).showadsbitvex();
          adWatchPassed = true;
          setClaimAdFinished(true);
        } catch (e) {
          console.error("Ad failed. Bypassing safely.", e);
          adWatchPassed = true; // Bypass safely
          setClaimAdFinished(true);
        }
      } else {
        adWatchPassed = true;
        setClaimAdFinished(true);
      }
    } else {
      adWatchPassed = true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ttt-battle/claim-prize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: userId,
          matchId,
          adCompleted: adWatchPassed
        })
      });
      const data = await res.json();
      if (data.success) {
        setClaimSuccess(true);
      } else {
        alert(data.message || "Failed to claim prize");
      }
    } catch (e) {
      console.error("Claim prize error:", e);
    }
    setClaimingPrize(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Entering Battle Arena...</p>
      </div>
    );
  }

  if (documentMissing || !match) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/15">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">Match Expired</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This match has already been completed, cancelled, or refunded to your wallet.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs transition shadow-lg"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  const me = getMe();
  const opponent = getOpponent();
  const myTurn = isMyTurn();

  const isWinnerMe = match.status === "completed" && match.winnerId === String(userId);
  const isDraw = match.status === "completed" && match.winnerId === "draw";
  const isWinnerOpponent = match.status === "completed" && match.winnerId !== "draw" && match.winnerId !== String(userId);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Background Decorators */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-4 border-b border-slate-850 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-slate-200">Arena Combat</h1>
            <p className="text-[9px] font-mono text-slate-500">ID: {matchId.substring(0, 8)}</p>
          </div>
        </div>

        {/* Prize Pool Display */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl shadow-inner animate-pulse">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-black text-emerald-400">Prize Pool: ₹{match.prizePool}</span>
        </div>
      </header>

      {/* Main Board Arena */}
      <main className="flex-1 p-6 flex flex-col justify-between max-w-md mx-auto w-full">
        
        {/* Player Versus Banner */}
        <div className="grid grid-cols-7 items-center gap-2 bg-slate-900/30 border border-slate-850/60 p-4 rounded-3xl relative overflow-hidden">
          
          {/* Player 1 Details */}
          <div className="col-span-3 text-center space-y-1.5">
            <div className={`w-11 h-11 rounded-2xl mx-auto flex items-center justify-center font-bold text-sm relative transition ${match.turn === String(userId) ? "bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10" : "bg-slate-800 border border-slate-700 text-slate-300"}`}>
              {me?.symbol || "X"}
              {me?.disconnected && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5"><WifiOff className="w-2.5 h-2.5" /></span>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold text-slate-300 max-w-[80px] truncate mx-auto">You</p>
              <p className="text-[9px] font-mono text-slate-500">{me?.publicCode}</p>
            </div>
          </div>

          {/* Versus Center */}
          <div className="col-span-1 text-center font-black text-xs text-slate-500">
            VS
          </div>

          {/* Player 2 Details */}
          <div className="col-span-3 text-center space-y-1.5">
            <div className={`w-11 h-11 rounded-2xl mx-auto flex items-center justify-center font-bold text-sm relative transition ${match.turn !== String(userId) ? "bg-indigo-500/15 border-2 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10" : "bg-slate-800 border border-slate-700 text-slate-300"}`}>
              {opponent?.symbol || "O"}
              {opponent?.disconnected && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 animate-bounce"><WifiOff className="w-2.5 h-2.5" /></span>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold text-slate-300 max-w-[80px] truncate mx-auto">
                {opponent?.isAI ? (opponent.aiName || "AI Bot") : "Opponent"}
              </p>
              <p className="text-[9px] font-mono text-slate-500">{opponent?.publicCode}</p>
            </div>
          </div>
        </div>

        {/* Dynamic State Alerts / Turn indicators */}
        <div className="my-5 text-center">
          {match.status === "active" && (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${myTurn ? "bg-emerald-500 animate-ping" : "bg-indigo-500 animate-pulse"}`} />
                <span className="text-xs font-black uppercase tracking-wider">
                  {myTurn ? "Your turn to make a move" : "Waiting for Opponent move"}
                </span>
              </div>
              <p className="text-lg font-black font-mono text-slate-200">
                ⏰ Move Timer: <strong className={timeLeft < 4 ? "text-rose-500" : "text-emerald-400"}>{timeLeft}s</strong>
              </p>

              {opponent?.disconnected && (
                <div className="mt-3.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-bold text-rose-400">
                  ⚠️ Opponent disconnected. Reconnection countdown: {opponentDisconnectTimeLeft}s before automatic resolution.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3x3 Grid Board Canvas */}
        <div className="w-full max-w-sm mx-auto aspect-square p-2.5 bg-slate-900/60 border border-slate-850 rounded-3xl shadow-xl flex items-center justify-center relative">
          
          {/* Ad Block Overlay Mode 1 */}
          <AnimatePresence>
            {showAdBeforeMatch && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-5 z-20"
              >
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/15">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider">Ad View Required</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Watch a sponsored ad video to unlock the game board and start matching!
                  </p>
                </div>
                <button
                  onClick={handleAdWatchBeforeStart}
                  className="w-full max-w-[200px] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg"
                >
                  Watch Video Ad
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full">
            {match.board.map((cell: string, idx: number) => {
              return (
                <button
                  key={idx}
                  disabled={!myTurn || cell !== "" || submittingMove || showAdBeforeMatch}
                  onClick={() => handleCellClick(idx)}
                  className={`relative rounded-2xl flex items-center justify-center transition border ${cell === "X" ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400 text-3xl font-black shadow-inner shadow-emerald-500/5" : cell === "O" ? "bg-indigo-500/5 border-indigo-500/30 text-indigo-400 text-3xl font-black shadow-inner shadow-indigo-500/5" : "bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700 cursor-pointer disabled:cursor-not-allowed"} focus:outline-none`}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Panel Controls / Results Modal */}
        <div className="mt-8">
          
          {/* Completed Match Panel */}
          {match.status === "completed" && (
            <div className="p-6 bg-slate-900 border border-slate-850 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />

              <div className="space-y-4">
                
                {/* Winner Card */}
                {isWinnerMe && (
                  <div className="space-y-4 animate-bounce">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-emerald-400">VICTORY SECURED!</h3>
                      <p className="text-xs text-slate-400">Excellent combat skills! You have outplayed your opponent.</p>
                    </div>
                  </div>
                )}

                {isWinnerOpponent && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-rose-400">DEFEATED</h3>
                      <p className="text-xs text-slate-400">Better luck next time! Keep training to improve.</p>
                    </div>
                  </div>
                )}

                {isDraw && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-slate-500/10 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-500/20">
                      <RefreshCw className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-300">MATCH DRAWN</h3>
                      <p className="text-xs text-slate-400">Equal power and skills on both sides!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Claim controls for Winners */}
              {isWinnerMe && (
                <div className="space-y-3.5 bg-slate-950/50 p-4.5 rounded-2xl border border-slate-910">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Prize pool Reward:</span>
                    <strong className="text-emerald-400 font-extrabold text-sm">₹{match.prizePool}.00</strong>
                  </div>

                  <div className="h-[1px] bg-slate-850" />

                  {claimSuccess ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-xs font-bold text-emerald-400 text-center animate-pulse">
                      🎉 ₹{match.prizePool} credited to your wallet balance!
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimPrize}
                      disabled={claimingPrize}
                      className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      {claimingPrize ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Claim Your Prize Now
                    </button>
                  )}
                </div>
              )}

              {/* Exit button */}
              {(isWinnerOpponent || isDraw || claimSuccess || match.resultProcessed) && (
                <button
                  onClick={onBack}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-black rounded-2xl text-xs transition border border-slate-750"
                >
                  Return to Battle Lobby
                </button>
              )}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
