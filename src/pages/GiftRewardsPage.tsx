import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  runTransaction,
  limit 
} from "firebase/firestore";
import { 
  ArrowLeft, 
  Gift, 
  Award, 
  Copy, 
  Check, 
  ExternalLink, 
  Calendar, 
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { API_BASE } from "../config/api";

interface GiftRewardsPageProps {
  onBack: () => void;
  user: any;
}

export default function GiftRewardsPage({ onBack, user }: GiftRewardsPageProps) {
  const [activeTab, setActiveTab] = useState<"Active Rewards" | "My Claims">("Active Rewards");
  const [gifts, setGifts] = useState<any[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [myClaimsLoading, setMyClaimsLoading] = useState(false);
  const [claimingGiftId, setClaimingGiftId] = useState<string | null>(null);
  const [claimedCodeResult, setClaimedCodeResult] = useState<{ giftName: string, code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch active gifts
  const fetchActiveGifts = async () => {
    setGiftsLoading(true);
    setErrorMessage(null);
    try {
      const q = query(
        collection(db, "gifts"), 
        where("status", "==", "Active"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGifts(list);
    } catch (err: any) {
      console.error("Error fetching active gifts:", err);
      setErrorMessage("Failed to load active gift rewards. Please try again.");
    } finally {
      setGiftsLoading(false);
    }
  };

  // Fetch user's claims
  const fetchMyClaims = async () => {
    setMyClaimsLoading(true);
    try {
      const q = query(
        collection(db, "gift_claims"),
        where("userId", "==", user.id),
        orderBy("claimedAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyClaims(list);
    } catch (err) {
      console.error("Error fetching user claims:", err);
    } finally {
      setMyClaimsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Active Rewards") {
      fetchActiveGifts();
    } else {
      fetchMyClaims();
    }
  }, [activeTab]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimNow = async (giftId: string, giftName: string) => {
    setClaimingGiftId(giftId);
    setErrorMessage(null);
    try {
      // 1. Check/Trigger official Telegram membership verification first
      const verifyResponse = await fetch(`${API_BASE}/api/user/verify-membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyData.verified) {
        setErrorMessage("⚠️ Telegram Verification Required. Please join both the channel and group first, then try again.");
        setClaimingGiftId(null);
        return;
      }

      // 2. Fetch the first available unclaimed code for this gift
      const codesRef = collection(db, "gifts", giftId, "codes");
      const q = query(codesRef, where("claimed", "==", false), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setErrorMessage("❌ Out Of Stock! This gift has no remaining claimable codes left.");
        setClaimingGiftId(null);
        // Refresh counts
        fetchActiveGifts();
        return;
      }

      const availableCodeDoc = snap.docs[0];
      const codeId = availableCodeDoc.id; // The actual reward code string

      // 3. Run transactional claim update to guarantee atomic and single assignment of code
      const claimedCode = await runTransaction(db, async (transaction) => {
        // Double check claim document to prevent duplicate claims for same user/gift
        const claimDocRef = doc(db, "gift_claims", `${user.id}_${giftId}`);
        const claimDocSnap = await transaction.get(claimDocRef);
        if (claimDocSnap.exists()) {
          throw new Error("ALREADY_CLAIMED");
        }

        // Double check code document to verify it is still unclaimed
        const codeDocRef = doc(db, "gifts", giftId, "codes", codeId);
        const codeDocSnap = await transaction.get(codeDocRef);
        if (!codeDocSnap.exists()) {
          throw new Error("CODE_NOT_FOUND");
        }
        const codeData = codeDocSnap.data();
        if (codeData.claimed) {
          throw new Error("CODE_ALREADY_TAKEN");
        }

        // Get latest parent gift info to make sure it's active and has stock
        const giftDocRef = doc(db, "gifts", giftId);
        const giftDocSnap = await transaction.get(giftDocRef);
        if (!giftDocSnap.exists()) {
          throw new Error("GIFT_NOT_FOUND");
        }
        const giftData = giftDocSnap.data();
        if (giftData.status !== "Active") {
          throw new Error("GIFT_PAUSED");
        }
        if (giftData.remainingCodes <= 0) {
          throw new Error("OUT_OF_STOCK");
        }

        // Mark code document as claimed
        transaction.update(codeDocRef, {
          claimed: true,
          claimedBy: user.id,
          claimedByUsername: user.username || user.firstName || "User",
          claimedAt: new Date().toISOString()
        });

        // Decrement remaining codes and increment claimed codes on parent
        const newClaimedCount = (giftData.claimedCodes || 0) + 1;
        const newRemainingCount = Math.max(0, (giftData.remainingCodes || 0) - 1);
        transaction.update(giftDocRef, {
          claimedCodes: newClaimedCount,
          remainingCodes: newRemainingCount
        });

        // Save gift claim record
        const usernameStr = user.username 
          ? `@${user.username}` 
          : (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Anonymous");

        transaction.set(claimDocRef, {
          userId: user.id,
          username: usernameStr,
          telegramId: user.id,
          giftId,
          giftName,
          claimedCode: codeId,
          claimedAt: new Date().toISOString(),
          status: "Claimed"
        });

        return codeId;
      });

      // Show gorgeous success modal
      setClaimedCodeResult({
        giftName,
        code: claimedCode
      });

      // Re-fetch active gifts
      fetchActiveGifts();
    } catch (err: any) {
      console.error("Error claiming gift reward:", err);
      if (err.message === "ALREADY_CLAIMED") {
        setErrorMessage("You have already claimed this gift reward! Each reward can only be claimed once.");
      } else if (err.message === "CODE_ALREADY_TAKEN") {
        setErrorMessage("Someone else claimed that code first. Please try again to fetch another code.");
      } else if (err.message === "OUT_OF_STOCK") {
        setErrorMessage("This gift is out of stock.");
      } else {
        setErrorMessage("Failed to claim gift reward. Please try again.");
      }
    } finally {
      setClaimingGiftId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Gift className="w-6 h-6 text-pink-500 animate-pulse" /> Gift Rewards
            </h1>
            <p className="text-xs text-slate-500 font-medium">Claim premium reward keys & codes instantly</p>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/50 border border-slate-800 p-1.5 rounded-2xl gap-2">
          <button
            onClick={() => setActiveTab("Active Rewards")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === "Active Rewards" 
                ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            🎁 Available Rewards
          </button>
          <button
            onClick={() => setActiveTab("My Claims")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === "My Claims" 
                ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            📂 My Claimed Codes
          </button>
        </div>

        {/* Status Error Display */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-semibold flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Active Rewards Tab */}
        {activeTab === "Active Rewards" && (
          <div className="space-y-4">
            {giftsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm font-medium">Fetching reward stock...</p>
              </div>
            ) : gifts.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mx-auto">
                  <Gift className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">No Gifts Available</h3>
                  <p className="text-slate-500 text-xs">Check back soon for brand new rewards!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {gifts.map((gift) => {
                  const outOfStock = gift.remainingCodes === 0;
                  const lowStock = gift.remainingCodes <= 10 && gift.remainingCodes > 0;
                  return (
                    <motion.div
                      layout
                      key={gift.id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-center md:items-center justify-between gap-5 relative overflow-hidden group shadow-xl"
                    >
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-16 h-16 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition duration-300">
                          {gift.imageUrl ? (
                            <img
                              src={gift.imageUrl}
                              alt={gift.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Award className="w-8 h-8 text-pink-500" />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors">
                            {gift.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3">
                            {outOfStock ? (
                              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-2 py-0.5 rounded">
                                Out of Stock
                              </span>
                            ) : lowStock ? (
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded">
                                ⚠️ Only {gift.remainingCodes} left!
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-auto shrink-0">
                        <button
                          onClick={() => handleClaimNow(gift.id, gift.name)}
                          disabled={outOfStock || claimingGiftId !== null}
                          className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                            outOfStock
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                              : claimingGiftId === gift.id
                              ? "bg-pink-600/50 text-white/50"
                              : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white hover:shadow-pink-600/15"
                          }`}
                        >
                          {claimingGiftId === gift.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <span>Claim Now</span>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Claims Tab */}
        {activeTab === "My Claims" && (
          <div className="space-y-4">
            {myClaimsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm font-medium">Fetching claimed codes...</p>
              </div>
            ) : myClaims.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">No Claims Record</h3>
                  <p className="text-slate-500 text-xs">You haven't claimed any reward gifts yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition flex flex-col justify-between gap-4 shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5 text-pink-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">
                              {claim.giftName}
                            </h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(claim.claimedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded">
                          Claimed
                        </span>
                      </div>

                      {/* Revealed Code Block */}
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-4 mt-2">
                        <div className="font-mono text-base text-pink-400 font-extrabold tracking-widest select-all pl-2">
                          {claim.claimedCode}
                        </div>
                        <button
                          onClick={() => handleCopyCode(claim.claimedCode)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-800 shrink-0 cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Success Modal / Revealed Code Overlay */}
      <AnimatePresence>
        {claimedCodeResult && (
          <div className="fixed inset-0 bg-[#000000e0] backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Confetti Glow Effect */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-rose-600 rounded-full flex items-center justify-center text-white mx-auto shadow-lg animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Claim Successful!</h2>
                <p className="text-sm text-slate-400">
                  Your reward code for <span className="text-pink-400 font-bold">{claimedCodeResult.giftName}</span> has been unlocked.
                </p>
              </div>

              {/* Monospace Code Display */}
              <div className="space-y-2">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 relative">
                  <div className="font-mono text-xl text-pink-400 font-black tracking-widest text-center flex-1 select-all">
                    {claimedCodeResult.code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(claimedCodeResult.code)}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    Code copied to clipboard!
                  </p>
                )}
              </div>

              <button
                onClick={() => setClaimedCodeResult(null)}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 transition cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
