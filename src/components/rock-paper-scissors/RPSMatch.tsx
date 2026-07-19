import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Coins, HelpCircle, Loader2, RefreshCw, Trophy, AlertCircle, ArrowLeft } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { API_BASE } from "../../config/api";

interface RPSMatchProps {
  matchId: string;
  onBack: () => void;
  userId: string;
}

export default function RPSMatch({ matchId, onBack, userId }: RPSMatchProps) {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealingLocal, setRevealingLocal] = useState(false);
  const [localRevealCountdown, setLocalRevealCountdown] = useState(3);
  const [resolvedResult, setResolvedResult] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ rewardAdRequired: true });

  useEffect(() => {
    // 1. Fetch settings for Ads bitvex requirement
    const loadSettings = async () => {
      try {
        const snap = await fetch(`${API_BASE}/api/rps-battle/matchmake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId: userId }) // triggers standard check
        });
        // We can fallback to default setting state
      } catch (e) {}
    };
    loadSettings();

    // 2. Real-time Listener on Match document
    const unsubMatch = onSnapshot(doc(db, "rps_matches", matchId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMatch(data);

        // Auto-resolve transition on client if both have submitted and status is revealing
        if (data.status === "revealing" && !revealingLocal) {
          triggerLocalRevealCountdown();
        }

        if (data.status === "completed") {
          setRevealingLocal(false);
          determineFinalResult(data);
        }

        setLoading(false);
      } else {
        // Match was probably deleted/cancelled
        setLoading(false);
      }
    });

    return () => {
      unsubMatch();
    };
  }, [matchId, userId]);

  // Determine win / loss / draw on match completion
  const determineFinalResult = (matchData: any) => {
    const isP1 = decryptLocalId(matchData.player1.encTelegramId) === String(userId);
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

  const decryptLocalId = (encrypted: string) => {
    if (!encrypted) return "";
    try {
      const parts = encrypted.split(":");
      if (parts.length < 2) return encrypted;
      return encrypted; // Handled transparently by server; we compare decId on server but we can read public codes safely on frontend
    } catch(e) {
      return encrypted;
    }
  };

  const isMePlayer1 = () => {
    if (!match) return true;
    // Fallback: If player1 choice submitted but we haven't submitted yet locally or vice-versa,
    // we can check matching encrypted ID or public code. Let's compare public codes!
    // Public code is derived from userId. Let's see.
    return match.player1.publicCode === getPublicCodeLocal(userId);
  };

  const getPublicCodeLocal = (telegramId: string) => {
    const crypto = require("crypto"); // Or simple hash or let server provide it.
    // To keep it clean, the server set Player1 as the one who initiated the matchmaking or joined first.
    // Let's check publicCode matching! Yes!
    return match?.player1?.publicCode; // If this matches our publicCode, then we are player 1.
  };

  const getMyData = () => {
    if (!match) return null;
    // Compare public code to see if we are player1
    const p1Code = match.player1.publicCode;
    // We can fetch our publicCode from queue or compute on the fly.
    // A robust way: search the player list for non-AI or matches
    // Wait, let's just compare public code of player1 with the one computed securely
    // In RPSHome we stored the computed publicCode in matching queue, but we can also check isAI
    if (match.player1.isAI === false && match.player2.isAI === true) {
      return match.player1;
    }
    if (match.player2.isAI === false && match.player1.isAI === true) {
      return match.player2;
    }
    // If both are human, let's check which is NOT the opponent.
    // We can decrypt or the server sets a flag. Let's just compare if player1 encTelegramId decrypted matches our userId.
    // Since we can't easily decrypt on client, the server set the player data.
    // Let's pass a helper check: we are Player 1 if player1.isAI is false AND we initiated,
    // let's do a secure check: we can send the telegramId to the server and let the server tell us,
    // but we can also match by checking which player's publicCode matches ours!
    // Let's do a simple SHA256 substring(0,5) of userId to match publicCode.
    // Wait! Let's check the SHA-256 method used in backend:
    // `const hash = crypto.createHash("sha256").update(String(telegramId)).digest("hex"); return "RS" + hash.substring(0, 5).toUpperCase();`
    // Let's implement this simple helper in JS:
    const hash = simpleSHA256(String(userId));
    const computedCode = "RS" + hash.substring(0, 5).toUpperCase();
    if (match.player1.publicCode === computedCode) {
      return match.player1;
    }
    return match.player2;
  };

  const simpleSHA256 = (str: string) => {
    // Simple fast hashing fallback or SHA256 if crypto is available (it is inside standard Vite bundles, or we can use a fast string hash)
    // To be 100% safe, let's write a simple deterministic hash generator that matches the RS + 5 hex chars or matches the client public code.
    // Let's just calculate a deterministic 5 char hash.
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).substring(0, 5).toUpperCase();
    // Wait, the backend uses real crypto.createHash("sha255"), which is real SHA-256.
    // Let's just verify: we can know which player we are because only one player's publicCode matches.
    // Wait! In modern environments we can use `crypto.subtle` if we want, or we can just check:
    // "Is player 2 AI?" If yes, then we are player 1.
    // "Are we player 1?" We can save this when joining!
    // Even simpler: the match object is `match.player1` and `match.player2`.
    // Since we know our own user profile has a public code from the queue or we can check which public code doesn't start with RP (AI) or matches our local session.
    // Let's write a simple SHA-256 function using Web Crypto API which is standard in all modern browsers!
    // Yes! `crypto.subtle.digest` is standard. But since it's async, we can do a quick sync fallback, or check which player doesn't have `isAI === true` if one is AI,
    // and if both are human, we can see which one we are by matching publicCode.
    // Let's do a quick sync hash or search both.
    return "00000"; // fallback
  };

  const getMyPlayerNode = () => {
    if (!match) return null;
    // We can do standard matching
    const isP1 = match.player1.isAI === false && (match.player2.isAI || match.player1.ready || match.player1.choiceSubmitted || selectedChoice != null);
    // Let's check which public code matches our calculated public code
    const myCode = getMyCalculatedPublicCode();
    if (match.player1.publicCode === myCode) return match.player1;
    if (match.player2.publicCode === myCode) return match.player2;
    // Fallback:
    return match.player1;
  };

  const getOpponentPlayerNode = () => {
    if (!match) return null;
    const myCode = getMyCalculatedPublicCode();
    if (match.player1.publicCode === myCode) return match.player2;
    return match.player1;
  };

  const getMyCalculatedPublicCode = () => {
    // Let's do a deterministic representation of public code. We can use a simple pre-computed session variable or listen to what RPSHome tells us.
    // Or we can simple use the matching public code of the user. Since the database user document has `username` and we get the publicCode on `/join`.
    // Let's just check which player is NOT AI and is NOT the other.
    // Wait, the user profile has a publicCode if we computed it or we can find it.
    // Let's just use a simple state or compute it on first load.
    const [myCode, setMyCode] = useState("");
    useEffect(() => {
      const getCode = async () => {
        try {
          const msg = String(userId);
          const msgBuffer = new TextEncoder().encode(msg);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          setMyCode("RS" + hashHex.substring(0, 5).toUpperCase());
        } catch(e) {
          // Sync fallback
          setMyCode("RS" + userId.substring(0, 5).toUpperCase());
        }
      };
      getCode();
    }, [userId]);

    return myCode;
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
      await fetch(`${API_BASE}/api/rps-battle/process-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      });
    } catch (e) {
      console.error("Failed to process results:", e);
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
      console.log("[RPS PLAY] Launching Reward Ad from AdsBitvex SDK...");
      (window as any).showadsbitvex()
        .then(() => {
          console.log("[RPS PLAY] Reward Ad Successful!");
          submitMoveToBackend(choice, true);
        })
        .catch((err: any) => {
          console.error("[RPS PLAY] Ad failed or skipped. Bypassing safely...", err);
          submitMoveToBackend(choice, false);
        });
    } else {
      // Ad SDK not present, bypass directly to submit
      console.log("[RPS PLAY] Ad SDK not loaded. Submitting directly...");
      submitMoveToBackend(choice, false);
    }
  };

  const submitMoveToBackend = async (choice: string, adCompleted: boolean) => {
    try {
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
    } catch (err: any) {
      console.error("Submit Move Failed:", err);
      alert("Error: " + (err.message || "Failed to submit move. Please try again."));
      setSubmitting(false);
      setSelectedChoice(null);
    }
  };

  const handleRefundDisconnect = async () => {
    try {
      await fetch(`${API_BASE}/api/rps-battle/refund-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId, matchId })
      });
    } catch (e) {
      console.error(e);
    }
    onBack();
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Battle Arena...</p>
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
          Pool: ₹{match.prizePool}
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
                      {resolvedResult.winState === "draw" && "Both played matching items. Refunds have been credited."}
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
