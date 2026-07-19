import React, { useState, useEffect } from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { db } from "../lib/firebase";
import { API_BASE } from "../config/api";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { 
  Trophy, 
  ArrowLeft, 
  Clock, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Lock,
  Flame,
  Sparkles,
  Wallet,
  ChevronRight,
  Users,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatFriendlyKolkata, getGiveawayTimeLeft } from "../lib/dateUtils";
import confetti from "canvas-confetti";

interface PublicLuckyNumberGiveawayPageProps {
  giveawayId: string;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

export default function PublicLuckyNumberGiveawayPage({ giveawayId, onBack, onNavigate }: PublicLuckyNumberGiveawayPageProps) {
  const { user, isInsideTelegram } = useTelegramAuth();
  
  const [giveaway, setGiveaway] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<any>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });

  // 1. Listen to Giveaway in real-time with automatic fallback
  useEffect(() => {
    console.log(`[Diagnostic] Subscribed to lucky_number_campaigns. Requested campaign ID: ${giveawayId}`);
    const colRef = collection(db, "lucky_number_campaigns");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Attempt 1: Look for exact campaign by giveawayId
      const targetCampaign = giveawayId ? list.find(g => g.id === giveawayId) : null;
      
      if (targetCampaign) {
        console.log(`[Diagnostic] Found target campaign by ID: ${giveawayId}`);
        setGiveaway(targetCampaign);
        setLoading(false);
      } else {
        console.warn(`[Diagnostic] Requested campaign not found by ID: ${giveawayId}. Searching for any live/active campaigns...`);
        // Fallback: Find all campaigns where status is Live/LIVE
        const liveCampaigns = list.filter(g => g.status === "Live" || g.status === "LIVE");
        
        if (liveCampaigns.length === 1) {
          console.log(`[Diagnostic] Found exactly 1 active live campaign: ${liveCampaigns[0].id}. Selecting it directly.`);
          setGiveaway(liveCampaigns[0]);
          setLoading(false);
        } else if (liveCampaigns.length > 1) {
          console.log(`[Diagnostic] Found multiple active live campaigns. Navigating to the active campaigns list view.`);
          setLoading(false);
          if (onNavigate) {
            onNavigate("lucky-number-list");
          } else if (onBack) {
            onBack();
          }
        } else {
          console.warn("[Diagnostic] No active live campaigns found in lucky_number_campaigns collection.");
          setGiveaway(null);
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Error listening to lucky_number_campaigns:", err);
      setLoading(false);
    });

    return unsub;
  }, [giveawayId, onNavigate, onBack]);

  // 2. Listen to Entries in real-time
  useEffect(() => {
    const activeCampaignId = giveaway?.id;
    if (!activeCampaignId) return;

    const q = query(collection(db, "lucky_number_entries"), where("campaignId", "==", activeCampaignId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(list);
    }, (err) => {
      console.error("Error listening to entries:", err);
    });

    return unsub;
  }, [giveaway?.id]);

  // 3. Setup countdown timer and trigger automatic draw if expired
  useEffect(() => {
    if (!giveaway) return;
    
    const updateTimer = () => {
      const calculated = getGiveawayTimeLeft(giveaway);
      setTimeLeft(calculated);
      
      // Auto trigger draw if expired and is live
      if (calculated.isExpired && giveaway.status === "Live" && giveaway.autoResult) {
        console.log(`[AutoDraw] Campaign end reached, triggering auto-draw for giveaway: ${giveaway.id}`);
        fetch(`${API_BASE}/api/lucky-number-giveaway/auto-draw-trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ giveawayId: giveaway.id })
        })
        .then(res => res.json())
        .then(data => {
          console.log("[AutoDraw] Result:", data);
        })
        .catch(err => {
          console.error("[AutoDraw] Auto-draw trigger error:", err);
        });
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [giveaway]);

  // 4. Trigger celebration animation if user has won
  const myEntries = entries.filter(e => e.telegramId === String(user?.telegramId) && e.status !== "PendingAd" && e.id.includes("_num_"));
  const hasWon = myEntries.some(e => e.status === "Winner" || e.status === "Approved");

  useEffect(() => {
    if (hasWon) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [hasWon]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading Lucky Number Board...</p>
        </div>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black">Not Found</h2>
          <p className="text-sm text-slate-400">This Lucky Number Giveaway was not found or has been removed.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-750 font-bold rounded-xl text-sm transition cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isLive = giveaway.status === "Live" && !timeLeft.isExpired;
  
  // Calculate bounds of the Board
  const minNum = Number(giveaway.minNumber || 1);
  const maxNum = Number(giveaway.maxNumber || 100);
  const totalNumbersCount = maxNum - minNum + 1;

  const entryLimit = Number(giveaway.entryLimitPerUser || 1);
  const hasReachedLimit = myEntries.length >= entryLimit;

  // Determine hot ranges (with fewest selected numbers)
  const getHotNumbersSet = () => {
    if (giveaway.numberVisibility !== "Show Hot Numbers") return new Set<number>();
    
    const bucketSize = Math.ceil(totalNumbersCount / 5);
    const buckets: { min: number; max: number; count: number }[] = [];
    
    for (let i = 0; i < 5; i++) {
      const bMin = minNum + i * bucketSize;
      const bMax = Math.min(maxNum, bMin + bucketSize - 1);
      if (bMin <= maxNum) {
        buckets.push({ min: bMin, max: bMax, count: 0 });
      }
    }

    buckets.forEach(b => {
      b.count = entries.filter(e => {
        const num = Number(e.selectedNumber);
        return num >= b.min && num <= b.max && (e.status === "Confirmed" || e.status === "Winner");
      }).length;
    });

    let minCount = Infinity;
    buckets.forEach(b => {
      if (b.count < minCount) minCount = b.count;
    });

    const hotSet = new Set<number>();
    buckets.forEach(b => {
      if (b.count === minCount) {
        for (let n = b.min; n <= b.max; n++) {
          hotSet.add(n);
        }
      }
    });

    return hotSet;
  };

  const hotNumbersSet = getHotNumbersSet();

  // Helper to check if a specific number is reserved
  const getOccupyingEntry = (num: number) => {
    // Only search number doc ids to be safe
    const entry = entries.find(e => Number(e.selectedNumber) === num && e.id.includes(`_num_${num}`));
    if (!entry) return null;

    if (entry.status === "Confirmed" || entry.status === "Winner" || entry.status === "Approved" || entry.status === "Rejected") {
      return entry;
    }

    if (entry.status === "PendingAd") {
      const reservedAt = new Date(entry.reservedAt).getTime();
      if (Date.now() - reservedAt < 60000) {
        return entry; // Active lock
      }
    }

    return null;
  };

  // Build the complete list of number grid elements
  const renderNumbersList: number[] = [];
  for (let i = minNum; i <= maxNum; i++) {
    renderNumbersList.push(i);
  }

  // Handle Participate Submission with integrated Ad Flow & secure confirmations
  const handleParticipate = async () => {
    if (!user) {
      setEnrollError("Please login inside Telegram to enter giveaways.");
      return;
    }

    if (selectedNum === null) {
      setEnrollError("Please select an available lucky number from the board first!");
      return;
    }

    setEnrollError("");
    setSuccessMsg("");
    setEnrolling(true);

    try {
      // Step 1: Request temporary reservation on backend to prevent race condition
      const reserveRes = await fetch(`${API_BASE}/api/lucky-number-giveaway/reserve-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giveawayId: giveaway.id,
          telegramId: user.telegramId,
          username: user.username || "",
          firstName: user.firstName || "Telegram User",
          selectedNumber: selectedNum
        })
      });

      const reserveData = await reserveRes.json();
      if (!reserveRes.ok || !reserveData.success) {
        setEnrollError(reserveData.error || "This number is no longer available. Please choose another number.");
        setEnrolling(false);
        return;
      }

      // Step 2: AdsBitvex Reward Ad Integration
      if (giveaway.rewardAdsEnabled !== false) {
        try {
          if (typeof (window as any).showadsbitvex !== "function") {
            throw new Error("window.showadsbitvex is not loaded.");
          }
          await (window as any).showadsbitvex();
        } catch (err: any) {
          console.error("Ad failed, releasing reservation:", err);
          // Auto release reservation on fail
          await fetch(`${API_BASE}/api/lucky-number-giveaway/release-number`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              giveawayId: giveaway.id,
              telegramId: user.telegramId,
              selectedNumber: selectedNum
            })
          });
          setEnrollError(`Sponsor Ad failed to load: ${err?.message || "Closed or blocked"}. Please try again.`);
          setEnrolling(false);
          return;
        }
      }

      // Step 3: Confirm permanently
      const confirmRes = await fetch(`${API_BASE}/api/lucky-number-giveaway/confirm-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giveawayId: giveaway.id,
          telegramId: user.telegramId,
          selectedNumber: selectedNum
        })
      });

      const confirmData = await confirmRes.json();
      if (confirmRes.ok && confirmData.success) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.7 }
        });
        setSuccessMsg(`✅ Entry Submitted Successfully!\n🎟 Your Lucky Number: ${selectedNum}`);
        setSelectedNum(null);
      } else {
        // Auto release number on backend error
        await fetch(`${API_BASE}/api/lucky-number-giveaway/release-number`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            giveawayId: giveaway.id,
            telegramId: user.telegramId,
            selectedNumber: selectedNum
          })
        });
        setEnrollError(confirmData.error || "Failed to confirm participation.");
      }
      setEnrolling(false);

    } catch (err: any) {
      console.error("Enrollment crash:", err);
      if (selectedNum !== null) {
        await fetch(`${API_BASE}/api/lucky-number-giveaway/release-number`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            giveawayId: giveaway.id,
            telegramId: user.telegramId,
            selectedNumber: selectedNum
          })
        });
      }
      setEnrollError(err.message || "Failed to participate. Please try again.");
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-16 font-sans relative overflow-x-hidden">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          <span>🍀 Lucky Number Giveaway</span>
        </h2>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6 relative z-10">

        {/* Live Countdown Timer */}
        {isLive && !timeLeft.isExpired && (
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-3xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase">⏳ Result In</span>
            </div>
            
            <div className="flex items-center gap-1 font-mono text-sm font-black text-emerald-400">
              <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
              <span className="text-slate-600 animate-pulse">:</span>
              <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
              <span className="text-slate-600 animate-pulse">:</span>
              <span className="text-emerald-300">{String(timeLeft.seconds).padStart(2, "0")}s</span>
            </div>
          </div>
        )}

        {/* Winner Showcase Panel */}
        {hasWon && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border-2 border-amber-500/40 rounded-3xl shadow-xl text-center space-y-4"
          >
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-amber-300">🎉 Congratulations!</h2>
              <p className="text-sm text-slate-300">
                You won! One of your lucky numbers was picked!
              </p>
            </div>
            <div className="space-y-2">
              {myEntries.filter(e => e.status === "Winner").map((winE, idx) => (
                <div key={idx} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Number: <b className="text-white">{winE.selectedNumber}</b></span>
                  <span className="font-black text-emerald-400 text-base">₹{winE.rewardAmount || giveaway.prizeAmount} Credited</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The prize amount has been credited directly to your Roy Share Wallet. You can check your updated balance and withdraw it instantly!
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate("wallet")}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20"
              >
                <Wallet className="w-4.5 h-4.5" />
                Go to Wallet
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* Giveaway Details Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
            <img src={giveaway.bannerUrl} alt={giveaway.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
            
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isLive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {isLive ? "Live" : "Closed"}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <h1 className="text-xl font-black text-white">{giveaway.title}</h1>
            {giveaway.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{giveaway.description}</p>
            )}

            {/* Price Cards */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Prize Pool</span>
                <span className="text-lg font-black text-amber-400 flex items-center gap-1">
                  <Coins className="w-4.5 h-4.5 text-amber-400" />
                  ₹{giveaway.prizeAmount}
                </span>
              </div>
              <div className="space-y-1 border-l border-slate-800 pl-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Winners</span>
                <span className="text-lg font-black text-white">{giveaway.totalWinners}</span>
              </div>
            </div>
          </div>
        </div>

        {/* USER ENROLLED CARD / CURRENT ENTRIES */}
        {myEntries.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-black block">🎉 MY ENTRIES ({myEntries.length}/{entryLimit})</span>
                <span className="text-[10px] text-emerald-500/80">Participation verified</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {myEntries.map((entry, idx) => (
                <div key={idx} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 text-center space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Lucky Number</span>
                  <span className="text-xl font-black text-white tracking-widest">{entry.selectedNumber}</span>
                  <span className={`text-[9px] block font-bold ${entry.status === 'Winner' ? 'text-amber-400' : 'text-slate-500'}`}>
                    {entry.status === 'Winner' ? '🏆 Winner' : 'Confirmed'}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              {hasReachedLimit 
                ? "You have reached your maximum entry limit for this giveaway! Sit back and wait for the results."
                : `You can select up to ${entryLimit - myEntries.length} more lucky number(s) to increase your winning chances!`
              }
            </p>
          </motion.div>
        )}

        {/* LIVE STATUS PANEL */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-2xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Live Giveaway Status
          </h3>
          
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Participants</span>
              <span className="text-base font-black text-white">
                {Array.from(new Set(entries.map(e => e.telegramId))).length}
              </span>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Entries Filled</span>
              <span className="text-base font-black text-white">
                {entries.filter(e => e.status === "Confirmed" || e.status === "Winner").length}
              </span>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Available Slots</span>
              <span className="text-base font-black text-emerald-400">
                {Math.max(0, totalNumbersCount - entries.filter(e => e.status === "Confirmed" || e.status === "Winner").length)}
              </span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE NUMBER SELECTION BOARD */}
        {!hasReachedLimit && isLive && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-black text-sm flex items-center gap-1.5 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Select Your Lucky Number
              </h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Limit: {entryLimit} Per User</span>
            </div>

            {/* Error & Success Banner */}
            {enrollError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center gap-2.5 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{enrollError}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2.5 text-xs"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Interactive Grid Board */}
            <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-4 shadow-inner max-h-96 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                <AnimatePresence>
                  {renderNumbersList.map(num => {
                    const occupant = getOccupyingEntry(num);
                    const isOccupied = occupant !== null;
                    const isSelected = selectedNum === num;

                    // Support Hide Remaining Numbers
                    if (isOccupied && giveaway.numberVisibility === "Hide Remaining Numbers") {
                      return null;
                    }

                    const isHot = hotNumbersSet.has(num);

                    let btnClass = "relative aspect-square rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ";
                    
                    if (isOccupied) {
                      // Disabled/Locked Number
                      btnClass += "bg-slate-900/30 border border-slate-900 text-slate-700 cursor-not-allowed";
                    } else if (isSelected) {
                      // Clicked / Highlighted selection
                      btnClass += "bg-emerald-500 border-2 border-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105 font-black";
                    } else {
                      // Standard Available State
                      if (isHot) {
                        btnClass += "bg-amber-950/30 border border-amber-500/40 text-amber-400 hover:bg-amber-900/30 shadow-[0_0_12px_rgba(245,158,11,0.05)]";
                      } else {
                        btnClass += "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/20";
                      }
                    }

                    return (
                      <motion.button
                        key={num}
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                          if (isOccupied) return;
                          setSelectedNum(num);
                          setEnrollError("");
                        }}
                        disabled={isOccupied || enrolling}
                        className={btnClass}
                      >
                        <span>{String(num).padStart(2, "0")}</span>
                        {isOccupied && giveaway.numberVisibility !== "Hide Remaining Numbers" && (
                          <Lock className="w-2.5 h-2.5 text-slate-700 absolute bottom-1 right-1" />
                        )}
                        {!isOccupied && isHot && !isSelected && (
                          <Flame className="w-2.5 h-2.5 text-amber-500 absolute top-1 right-1 animate-pulse" />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Selected Number:</span>
                <span className={`font-black text-sm px-3 py-1 rounded-lg ${selectedNum ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-slate-950 text-slate-500"}`}>
                  {selectedNum !== null ? String(selectedNum).padStart(2, "0") : "None Selected"}
                </span>
              </div>

              <button
                onClick={handleParticipate}
                disabled={selectedNum === null || enrolling}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                {enrolling ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>
                    {giveaway.rewardAdsEnabled !== false ? "Watch Sponsor Ad & Submit Entry 🍀" : "Submit Entry 🍀"}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* CLOSED DRAW CARD */}
        {(!isLive || hasReachedLimit) && (
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-sm space-y-4 shadow-xl">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-white">
              {hasReachedLimit ? "Entry Limit Reached" : "Board Ended/Closed"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {hasReachedLimit 
                ? `You have reached the maximum allowed limit of ${entryLimit} entry/entries on this board. Good luck!`
                : "This lucky board is no longer accepting submissions. Keep notifications active for new board launches!"
              }
            </p>
          </div>
        )}

        {/* Recent Winners Section */}
        {giveaway.drawnWinners && giveaway.drawnWinners.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              🏆 Recent Winners
            </h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {giveaway.drawnWinners.slice(0, 10).map((winner: any, idx: number) => {
                const winnerCode = `RS${String(winner.telegramId || "").slice(-4).padStart(4, "0")}`;
                return (
                  <div 
                    key={idx}
                    className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-900/80 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{winnerCode}</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                          Winner
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {winner.drawConfirmedAt ? formatFriendlyKolkata(winner.drawConfirmedAt) : formatFriendlyKolkata(winner.paidAt)}
                      </p>
                    </div>
                    
                    <div className="text-right space-y-0.5">
                      <span className="text-xs font-black text-amber-400 block">
                        ₹{winner.allocatedPrize}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Number: <span className="text-white font-bold">{winner.selectedNumber}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
