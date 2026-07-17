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
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PublicLuckyNumberGiveawayPageProps {
  giveawayId: string;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

export default function PublicLuckyNumberGiveawayPage({ giveawayId, onBack, onNavigate }: PublicLuckyNumberGiveawayPageProps) {
  const { user, showAd, isInsideTelegram } = useTelegramAuth();
  
  const [giveaway, setGiveaway] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 1. Listen to Giveaway in real-time
  useEffect(() => {
    if (!giveawayId) return;

    const docRef = doc(db, "lucky_number_campaigns", giveawayId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setGiveaway({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to giveaway:", err);
      setLoading(false);
    });

    return unsub;
  }, [giveawayId]);

  // 2. Listen to Entries in real-time
  useEffect(() => {
    if (!giveawayId) return;

    const q = query(collection(db, "lucky_number_entries"), where("campaignId", "==", giveawayId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => d.data());
      setEntries(list);
    }, (err) => {
      console.error("Error listening to entries:", err);
    });

    return unsub;
  }, [giveawayId]);

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

  const isLive = giveaway.status === "Live";
  const myEntry = entries.find(e => e.telegramId === String(user?.telegramId) && e.status !== "PendingAd");

  // Determine bounds of the Board
  const minNum = Number(giveaway.minNumber || 1);
  const maxNum = Number(giveaway.maxNumber || 100);
  const totalNumbersCount = maxNum - minNum + 1;

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
    const entry = entries.find(e => Number(e.selectedNumber) === num);
    if (!entry) return null;

    if (entry.status === "Confirmed" || entry.status === "Winner" || entry.status === "Approved" || entry.status === "Rejected") {
      return entry;
    }

    if (entry.status === "PendingAd") {
      const reservedAt = new Date(entry.reservedAt).getTime();
      if (Date.now() - reservedAt < 60000) {
        return entry; // Lock active
      }
    }

    return null;
  };

  // Build the complete list of number grid elements
  const renderNumbersList: number[] = [];
  for (let i = minNum; i <= maxNum; i++) {
    renderNumbersList.push(i);
  }

  // Handle Participate Submission
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

      // Step 2: Show Ad using centralized implementation
      const adType = giveaway.adsType || "Reward";
      
      try {
        await showAd(adType);
        
        // Ad successfully completed! Confirm permanently.
        const confirmRes = await fetch(`${API_BASE}/api/lucky-number-giveaway/confirm-number`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            giveawayId: giveaway.id,
            telegramId: user.telegramId
          })
        });

        const confirmData = await confirmRes.json();
        if (confirmRes.ok && confirmData.success) {
          setSuccessMsg(`🎉 Number ${selectedNum} Reserved Successfully!`);
        } else {
          setEnrollError(confirmData.error || "Failed to confirm participation.");
        }
        setEnrolling(false);
      } catch (adError: any) {
        // User closed ad early or load failed. Release the reservation.
        console.warn("[LuckyNumber] Ad failed or closed prematurely. Releasing reservation...", adError);
        await fetch(`${API_BASE}/api/lucky-number-giveaway/release-number`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            giveawayId: giveaway.id,
            telegramId: user.telegramId
          })
        });

        const errMsg = typeof adError === "object" ? (adError?.message || adError?.description || JSON.stringify(adError)) : String(adError);
        setEnrollError(`Please watch the sponsored ad completely to secure your lucky number! (${errMsg})`);
        setEnrolling(false);
      }

    } catch (err: any) {
      console.error("Enrollment crash:", err);
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

        {/* Winner Showcase Panel */}
        {myEntry && myEntry.status === "Winner" && (
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
                You won! Your lucky number <span className="font-bold text-white">{myEntry.selectedNumber}</span> was picked!
              </p>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 font-bold text-emerald-400 text-lg">
              ₹{giveaway.prizeAmount} Credited
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

        {/* USER ENROLLED CARD */}
        {myEntry && myEntry.status !== "Winner" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <span className="text-xs font-black block">🎉 CONGRATULATIONS!</span>
                <span className="text-[10px] text-emerald-500/80">Participation confirmed</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 text-center space-y-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Your Selected Lucky Number</span>
              <span className="text-3xl font-black text-white tracking-widest">{myEntry.selectedNumber}</span>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              You are successfully enrolled. Sit back and wait for results! We will notify you instantly via our bot when the draw is completed! 🍀
            </p>
          </motion.div>
        )}

        {/* INTERACTIVE NUMBER SELECTION BOARD */}
        {!myEntry && isLive && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-black text-sm flex items-center gap-1.5 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Select Your Lucky Number
              </h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase">1 number per user</span>
            </div>

            {/* Stat Counters on the board */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block font-bold">Total Numbers</span>
                <span className="text-sm font-black text-slate-200">{totalNumbersCount}</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block font-bold">Remaining Available</span>
                <span className="text-sm font-black text-emerald-400">
                  {totalNumbersCount - entries.filter(e => e.status === "Confirmed" || e.status === "Winner").length}
                </span>
              </div>
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
                  <span>Watch Sponsor Ad & Confirm 🍀</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* CLOSED DRAW CARD */}
        {!isLive && !myEntry && (
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-sm space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-bold text-white">Closed Board</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This giveaway is closed. Keep your notifications active for direct bot alerts when we launch our next Lucky Number Board!
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
