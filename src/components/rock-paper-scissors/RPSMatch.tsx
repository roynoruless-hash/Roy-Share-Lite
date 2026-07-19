import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Coins, HelpCircle, Loader2, RefreshCw, Trophy, AlertCircle, ArrowLeft } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { API_BASE } from "../../config/api";

// -----------------------------------------------------------------------------
// Pure JavaScript Synchronous SHA-256 Implementation (Client-Safe & Fast)
// -----------------------------------------------------------------------------
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

  const wordsLength = ((asciiLength + 8) >> 6) + 1;
  const wordsCount = wordsLength * 16;
  
  for (i = 0; i < wordsCount; i++) words[i] = 0;
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[wordsCount - 1] = asciiLength * 8;

  for (i = 0; i < wordsCount; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15];
        const w2 = w[j - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const a = hash[0], e = hash[4];
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & hash[5]) ^ (~e & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + (w[j] || 0)) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  let output = '';
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 0xff;
      output += byte.toString(16).padStart(2, '0');
    }
  }
  return output;
}

interface RPSMatchProps {
  matchId: string;
  onBack: () => void;
  userId: string;
}

export default function RPSMatch({ matchId, onBack, userId }: RPSMatchProps) {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documentMissing, setDocumentMissing] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealingLocal, setRevealingLocal] = useState(false);
  const [localRevealCountdown, setLocalRevealCountdown] = useState(3);
  const [resolvedResult, setResolvedResult] = useState<any>(null);

  // Guard against multiple timers running due to stale closure/component re-render
  const countdownTriggeredRef = useRef(false);

  // 1. Calculate user's public code securely & synchronously at component initialization
  const myCode = useMemo(() => {
    try {
      const hashHex = sha255SyncFallback(String(userId));
      return "RS" + hashHex.substring(0, 5).toUpperCase();
    } catch (e) {
      return "RS" + String(userId).substring(0, 5).toUpperCase();
    }
  }, [userId]);

  function sha255SyncFallback(id: string): string {
    return sha256(id);
  }

  // Self-healing: if the match is in the revealing state but remains stuck on client side for over 8 seconds, force resolve result calculation
  useEffect(() => {
    if (!match || match.status !== "revealing" || match.status === "completed") return;
    
    console.log(`[RPS MATCH] Setting backup safety recovery timer for match: ${matchId}`);
    const backupTimer = setTimeout(() => {
      console.warn(`[RPS MATCH] Backup timer triggered! Status still revealing after 8s. Forcing result calculation...`);
      triggerBackendProcessResult();
    }, 8000);

    return () => clearTimeout(backupTimer);
  }, [match?.status, matchId]);

  useEffect(() => {
    console.log(`[RPS MATCH] Initializing Battle Arena listener for match: ${matchId}, userId: ${userId}, myCode: ${myCode}`);

    // Real-time Listener on Match document
    const unsubMatch = onSnapshot(
      doc(db, "rps_matches", matchId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setMatch(data);
          setDocumentMissing(false);

          console.log(`[RPS MATCH] Received update: status=${data.status}, p1=${data.player1?.publicCode}, p2=${data.player2?.publicCode}`);

          if (data.status === "active") {
            // Reset state if back to active (e.g. Draw Rematch)
            countdownTriggeredRef.current = false;
            setRevealingLocal(false);
            setSubmitting(false);
            setSelectedChoice(null);
          }

          // Auto-resolve transition on client if both have submitted and status is revealing
          if (data.status === "revealing" && !countdownTriggeredRef.current) {
            countdownTriggeredRef.current = true;
            triggerLocalRevealCountdown();
          }

          if (data.status === "completed") {
            setRevealingLocal(false);
            determineFinalResult(data);
          }

          setLoading(false);
        } else {
          console.warn(`[RPS MATCH] Firestore match document ${matchId} does not exist or was deleted.`);
          setDocumentMissing(true);
          setLoading(false);
        }
      },
      (error) => {
        console.error(`[RPS MATCH] Firestore subscription error:`, error);
        setDocumentMissing(true);
        setLoading(false);
      }
    );

    return () => {
      unsubMatch();
    };
  }, [matchId, userId, myCode]);

  // Determine win / loss / draw on match completion using our computed synchronous public code
  const determineFinalResult = (matchData: any) => {
    if (!matchData || !matchData.player1 || !matchData.player2) return;

    const isP1 = matchData.player1.publicCode === myCode;
    let winState: "win" | "lose" | "draw" = "draw";

    if (matchData.winner === "draw") {
      winState = "draw";
    } else if (matchData.winner === "player1") {
      winState = isP1 ? "win" : "lose";
    } else if (matchData.winner === "player2") {
      winState = isP1 ? "lose" : "win";
    }

    const myMove = isP1 ? matchData.player1Move : matchData.player2Move;
    const oppMove = isP1 ? matchData.player2Move : matchData.player1Move;

    setResolvedResult({
      winState,
      myMove,
      oppMove,
      prizePool: matchData.prizePool || 20
    });
  };

  // Safe node matchers using precomputed client public code
  const getMyPlayerNode = () => {
    if (!match) return null;
    if (match.player1?.publicCode === myCode) return match.player1;
    if (match.player2?.publicCode === myCode) return match.player2;

    // Fast fallback if public codes haven't matched yet: non-AI is likely us
    if (match.player1 && !match.player1.isAI && match.player2?.isAI) return match.player1;
    if (match.player2 && !match.player2.isAI && match.player1?.isAI) return match.player2;
    return match.player1;
  };

  const getOpponentPlayerNode = () => {
    if (!match) return null;
    if (match.player1?.publicCode === myCode) return match.player2;
    if (match.player2?.publicCode === myCode) return match.player1;

    // Fast fallback if public codes haven't matched yet
    if (match.player1?.isAI) return match.player1;
    return match.player2;
  };

  const myPlayer = getMyPlayerNode();
  const oppPlayer = getOpponentPlayerNode();

  const triggerLocalRevealCountdown = () => {
    setRevealingLocal(true);
    let count = 3;
    setLocalRevealCountdown(count);

    const timer = setInterval(() => {
      count -= 1;
      setLocalRevealCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        // Call process-result to let the server finalise payouts and complete the match state
        triggerBackendProcessResult();
      }
    }, 1000);
  };

  const triggerBackendProcessResult = async () => {
    try {
      console.log(`[RPS MATCH] Invoking process-result for match ${matchId}...`);
      await fetch(`${API_BASE}/api/rps-battle/process-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      });
    } catch (e) {
      console.error("[RPS MATCH] Failed to trigger backend process-result:", e);
    }
  };

  const handleChoiceSelect = (choice: string) => {
    if (submitting || myPlayer?.choiceSubmitted) return;
    setSelectedChoice(choice);
    
    // Play Reward Ad and then submit
    playAdAndSubmit(choice);
  };

  const playAdAndSubmit = (choice: string) => {
    setSubmitting(true);
    
    // If ad is required and loaded, play it
    if ((window as any).showadsbitvex) {
      console.log("[RPS MATCH] Launching Reward Ad from AdsBitvex SDK...");
      (window as any).showadsbitvex()
        .then(() => {
          console.log("[RPS MATCH] Reward Ad Successful!");
          submitMoveToBackend(choice, true);
        })
        .catch((err: any) => {
          console.error("[RPS MATCH] Ad failed or skipped. Bypassing safely...", err);
          submitMoveToBackend(choice, false);
        });
    } else {
      // Ad SDK not present, bypass directly to submit
      console.log("[RPS MATCH] Ad SDK not loaded. Submitting directly...");
      submitMoveToBackend(choice, false);
    }
  };

  const submitMoveToBackend = async (choice: string, adCompleted: boolean) => {
    try {
      console.log(`[RPS MATCH] Submitting move '${choice}' to server...`);
      const res = await fetch(`${API_BASE}/api/rps-battle/submit-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: userId,
          matchId,
          move: choice,
          adCompleted
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit move.");
      }
      console.log("[RPS MATCH] Move successfully accepted by backend.");
      setSubmitting(false);
    } catch (err: any) {
      console.error("[RPS MATCH] Submit Move Failed:", err);
      alert("Error: " + (err.message || "Failed to submit move. Please try again."));
      setSubmitting(false);
      setSelectedChoice(null);
    }
  };

  const handleRefundDisconnect = async () => {
    try {
      console.log(`[RPS MATCH] Requesting match refund & leaving battle...`);
      await fetch(`${API_BASE}/api/rps-battle/refund-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId, matchId })
      });
    } catch (e) {
      console.error("[RPS MATCH] Refund request failed:", e);
    }
    onBack();
  };

  // -----------------------------------------------------------------------------
  // Render Loading / Missing Document states safely (Never stays blank or stuck)
  // -----------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Battle Arena...</p>
      </div>
    );
  }

  if (documentMissing || !match) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">Battle Not Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This match is unavailable, cancelled, or has been already refunded to your wallet.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Draw mode label from server rematch
  const hasDrawBanner = match.drawBanner && !myPlayer?.choiceSubmitted && !oppPlayer?.choiceSubmitted;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none overflow-x-hidden pb-8">
      
      {/* Match Header */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Battle Room</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-black">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          Pool: ₹{match.prizePool || 20}
        </div>
      </header>

      {/* Main Arena Stage */}
      <div className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full space-y-8">
        
        {/* Duelists Cards Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Player Card */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-indigo-500/20 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Player</p>
            <p className="text-sm font-black text-white">{myPlayer?.publicCode || "RS---"}</p>
            <div className="pt-1">
              {myPlayer?.choiceSubmitted ? (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold uppercase tracking-wider">Ready</span>
              ) : (
                <span className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/10 font-bold uppercase tracking-wider">Choosing</span>
              )}
            </div>
          </div>

          {/* Opponent Card */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800" />
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Opponent</p>
            <p className="text-sm font-black text-white">{oppPlayer?.publicCode || "RS---"}</p>
            <div className="pt-1">
              {oppPlayer?.choiceSubmitted ? (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold uppercase tracking-wider">Ready</span>
              ) : (
                <span className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/10 font-bold uppercase tracking-wider">Choosing</span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Center Board */}
        <div className="flex-1 flex flex-col justify-center items-center py-6 min-h-[220px]">
          <AnimatePresence mode="wait">
            
            {/* Draw Rematch Banner */}
            {hasDrawBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center space-y-1 mb-4"
              >
                <div className="text-xs font-black uppercase text-indigo-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin-slow" /> {match.drawModeLabel || "Draw Rematch!"}
                </div>
                <p className="text-[10px] text-slate-400">Make your move again to claim the prize pool.</p>
              </motion.div>
            )}

            {/* 1. Choice Phase UI */}
            {match.status === "active" && !myPlayer?.choiceSubmitted && (
              <motion.div
                key="choice-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full text-center space-y-6"
              >
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Select your weapon</p>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[
                    { id: "rock", label: "Rock", emoji: "✊", color: "from-rose-500/10 to-rose-600/5 hover:border-rose-500/30" },
                    { id: "paper", label: "Paper", emoji: "✋", color: "from-indigo-500/10 to-indigo-600/5 hover:border-indigo-500/30" },
                    { id: "scissors", label: "Scissors", emoji: "✌️", color: "from-amber-500/10 to-amber-600/5 hover:border-amber-500/30" }
                  ].map((weapon) => (
                    <motion.button
                      key={weapon.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChoiceSelect(weapon.id)}
                      disabled={submitting}
                      className={`h-28 rounded-2xl border border-slate-800 bg-gradient-to-b ${weapon.color} flex flex-col items-center justify-center space-y-2 transition-all shadow-lg`}
                    >
                      <span className="text-4xl">{weapon.emoji}</span>
                      <span className="text-xs font-extrabold text-slate-300">{weapon.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. Waiting Phase UI */}
            {match.status === "active" && myPlayer?.choiceSubmitted && (
              <motion.div
                key="waiting-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto flex items-center justify-center">
                    <Shield className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black">Move Registered!</p>
                  <p className="text-xs text-slate-400">Waiting for opponent to submit choice...</p>
                </div>
              </motion.div>
            )}

            {/* 3. Local Countdown Reveal Animation */}
            {revealingLocal && (
              <motion.div
                key="countdown-view"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="text-7xl font-black text-indigo-400 animate-ping">
                  {localRevealCountdown}
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Revealing Choices...</p>
              </motion.div>
            )}

            {/* 4. Match Results Board (Completed State) */}
            {match.status === "completed" && resolvedResult && (
              <motion.div
                key="results-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center space-y-8"
              >
                {/* Result Announcement Hero */}
                <div className="space-y-3">
                  <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                    resolvedResult.winState === "win" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" :
                    resolvedResult.winState === "lose" ? "bg-rose-500/20 border border-rose-500/30 text-rose-400" :
                    "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
                  }`}>
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight">
                      {resolvedResult.winState === "win" && "🥇 VICTORY!"}
                      {resolvedResult.winState === "lose" && "🥈 DEFEAT"}
                      {resolvedResult.winState === "draw" && "🤝 IT'S A DRAW!"}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {resolvedResult.winState === "win" && `Congratulations! ₹${resolvedResult.prizePool} credited to your wallet.`}
                      {resolvedResult.winState === "lose" && "Better luck next time! Keep refining your strategy."}
                      {resolvedResult.winState === "draw" && "Both played matching items. Refunds have been credited to your wallet."}
                    </p>
                  </div>
                </div>

                {/* Choices Unveiling Card */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 border border-slate-850 rounded-2xl">
                  <div className="space-y-1 border-r border-slate-850 pr-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Your Weapon</p>
                    <p className="text-3xl pt-1">
                      {resolvedResult.myMove === "rock" && "✊"}
                      {resolvedResult.myMove === "paper" && "✋"}
                      {resolvedResult.myMove === "scissors" && "✌️"}
                    </p>
                    <p className="text-xs font-bold text-slate-300 capitalize">{resolvedResult.myMove}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Opponent Weapon</p>
                    <p className="text-3xl pt-1">
                      {resolvedResult.oppMove === "rock" && "✊"}
                      {resolvedResult.oppMove === "paper" && "✋"}
                      {resolvedResult.oppMove === "scissors" && "✌️"}
                    </p>
                    <p className="text-xs font-bold text-slate-300 capitalize">{resolvedResult.oppMove}</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Buttons Row */}
        <div className="space-y-3.5 pt-4 w-full">
          {match.status === "completed" ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onBack}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-xl"
            >
              Return to Lobby
            </motion.button>
          ) : (
            /* Refund policy trigger button if opponent gets disconnected / matches stuck */
            <div className="text-center">
              <button 
                onClick={handleRefundDisconnect}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-1.5 mx-auto transition"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Force Refund / Leave Battle
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
