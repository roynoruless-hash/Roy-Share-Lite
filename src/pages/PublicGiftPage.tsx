import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, getDocs, collection, query, where, limit, updateDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Gift, CheckCircle2, ArrowRight, ExternalLink, RefreshCw, Copy, ShieldAlert, KeyRound, AlertTriangle, UserCheck } from "lucide-react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { API_BASE } from "../config/api";

interface PublicGiftPageProps {
  giftId: string;
}

interface GiftDetails {
  id: string;
  name: string;
  totalCodes: number;
  claimedCodes: number;
  remainingCodes: number;
  status: string;
  createdAt: string;
}

interface TelegramSettings {
  channelUsername?: string;
  groupUsername?: string;
}

export default function PublicGiftPage({ giftId }: PublicGiftPageProps) {
  const { user: tgUser, loading: authLoading } = useTelegramAuth();

  // State
  const [gift, setGift] = useState<GiftDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual input state (for browser mode outside MiniApp)
  const [manualUserId, setManualUserId] = useState("");
  const [manualUsername, setManualUsername] = useState("");
  const [manualFirstName, setManualFirstName] = useState("");
  const [isManualLoggedIn, setIsManualLoggedIn] = useState(false);

  // Loaded Telegram Configuration for links
  const [tgSettings, setTgSettings] = useState<TelegramSettings | null>(null);

  // Verification state
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Claim state
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);

  // Active Telegram Identity
  const activeUser = (tgUser || (isManualLoggedIn ? {
    id: Number(manualUserId),
    username: manualUsername,
    firstName: manualFirstName
  } : null)) as any;

  // Fetch gift details
  useEffect(() => {
    const fetchGiftAndSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Gift Details
        const giftRef = doc(db, "gifts", giftId);
        const giftSnap = await getDoc(giftRef);
        if (!giftSnap.exists()) {
          setError("This gift link is invalid or has expired.");
          setLoading(false);
          return;
        }

        const giftData = giftSnap.data() as GiftDetails;
        if (giftData.status !== "Active") {
          setError("This gift campaign is currently paused or inactive.");
          setLoading(false);
          return;
        }

        setGift(giftData);

        // Fetch Telegram settings for public channels
        const settingsRes = await fetch(`${API_BASE}/api/telegram-settings`);
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setTgSettings(settingsData.settings);
        }
      } catch (err: any) {
        console.error("Error loading gift details:", err);
        setError("Failed to load gift page details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGiftAndSettings();
  }, [giftId]);

  // Load manual login from localStorage on start
  useEffect(() => {
    const savedId = localStorage.getItem("roy_gift_manual_id");
    const savedUser = localStorage.getItem("roy_gift_manual_username");
    const savedName = localStorage.getItem("roy_gift_manual_name");
    if (savedId && savedName) {
      setManualUserId(savedId);
      setManualUsername(savedUser || "");
      setManualFirstName(savedName);
      setIsManualLoggedIn(true);
    }
  }, []);

  // Check if active user already claimed on load/change
  useEffect(() => {
    if (!activeUser || !gift) return;

    const checkExistingClaim = async () => {
      try {
        const uId = String(activeUser.id);
        const q1 = query(collection(db, "gifts", giftId, "codes"), where("claimedBy", "==", uId));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          setClaimedCode(snap1.docs[0].data().code);
          setIsVerified(true); // Auto bypass verification since they already claimed
          return;
        }

        const q2 = query(collection(db, "gifts", giftId, "codes"), where("claimedBy", "==", Number(uId)));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          setClaimedCode(snap2.docs[0].data().code);
          setIsVerified(true);
          return;
        }
      } catch (e) {
        console.error("Error checking existing claim:", e);
      }
    };

    checkExistingClaim();
  }, [activeUser, gift, giftId]);

  // Helper to format telegram link
  const getTelegramLink = (username: string) => {
    if (!username) return "#";
    const clean = username.startsWith("@") ? username.slice(1) : username;
    if (clean.startsWith("https://") || clean.startsWith("http://")) return clean;
    return `https://t.me/${clean}`;
  };

  // Perform Membership Verification
  const handleVerifyMembership = async () => {
    if (!activeUser) return;
    setVerifying(true);
    setVerificationError(null);

    try {
      const res = await fetch(`${API_BASE}/api/user/verify-membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUser.id })
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setIsVerified(true);
      } else {
        setVerificationError(data.error || "Please make sure you have joined both the channel and the group!");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationError("Could not reach verification server. Please join the groups and try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Claim Gift Code
  const handleClaimGift = async () => {
    if (!activeUser || !gift) return;
    setClaimLoading(true);
    setVerificationError(null);

    try {
      const uId = String(activeUser.id);

      // Double-check if already claimed
      const q1 = query(collection(db, "gifts", giftId, "codes"), where("claimedBy", "==", uId));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        setClaimedCode(snap1.docs[0].data().code);
        setClaimLoading(false);
        return;
      }

      // Query unclaimed code
      const unclaimedQuery = query(
        collection(db, "gifts", giftId, "codes"),
        where("claimed", "==", false),
        limit(1)
      );
      const unclaimedSnap = await getDocs(unclaimedQuery);
      if (unclaimedSnap.empty) {
        setVerificationError("Oh no! All codes for this campaign have been claimed.");
        setClaimLoading(false);
        return;
      }

      const codeDoc = unclaimedSnap.docs[0];
      const codeId = codeDoc.id;

      // Atomically set claim
      await updateDoc(doc(db, "gifts", giftId, "codes", codeId), {
        claimed: true,
        claimedBy: uId,
        claimedByUsername: activeUser.username || "Anonymous",
        claimedByFirstName: activeUser.firstName || "Guest",
        claimedAt: new Date().toISOString()
      });

      // Update parent counters
      const giftRef = doc(db, "gifts", giftId);
      const giftSnap = await getDoc(giftRef);
      if (giftSnap.exists()) {
        const currentData = giftSnap.data();
        const newClaimed = (currentData.claimedCodes || 0) + 1;
        const newRemaining = Math.max(0, (currentData.totalCodes || 0) - newClaimed);
        await updateDoc(giftRef, {
          claimedCodes: newClaimed,
          remainingCodes: newRemaining
        });
        setGift(prev => prev ? { ...prev, claimedCodes: newClaimed, remainingCodes: newRemaining } : null);
      }

      // Add to claims history
      const claimId = `${giftId}_${uId}`;
      await setDoc(doc(db, "gift_claims", claimId), {
        id: claimId,
        giftId,
        giftName: gift.name,
        username: activeUser.username || "",
        firstName: activeUser.firstName || "",
        telegramId: Number(uId),
        claimedCode: codeId,
        claimedAt: new Date().toISOString(),
        status: "Claimed"
      });

      setClaimedCode(codeId);
      setClaimSuccessMsg("Gift Code Claimed Successfully!");
    } catch (err: any) {
      console.error("Claim error:", err);
      setVerificationError("Failed to claim gift. Please try again.");
    } finally {
      setClaimLoading(false);
    }
  };

  // Handle Manual Browser Login
  const handleManualLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId.trim() || !manualFirstName.trim()) {
      alert("Telegram Numeric User ID and Full Name are required.");
      return;
    }
    if (isNaN(Number(manualUserId))) {
      alert("Telegram User ID must be a valid number.");
      return;
    }

    localStorage.setItem("roy_gift_manual_id", manualUserId.trim());
    localStorage.setItem("roy_gift_manual_username", manualUsername.trim().replace("@", ""));
    localStorage.setItem("roy_gift_manual_name", manualFirstName.trim());
    setIsManualLoggedIn(true);
  };

  const handleManualLogout = () => {
    localStorage.removeItem("roy_gift_manual_id");
    localStorage.removeItem("roy_gift_manual_username");
    localStorage.removeItem("roy_gift_manual_name");
    setManualUserId("");
    setManualUsername("");
    setManualFirstName("");
    setIsManualLoggedIn(false);
    setIsVerified(false);
    setClaimedCode(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Loading View
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Glowing Background Orb */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] top-1/4 left-1/2 -translate-x-1/2" />
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading secure gift link...</p>
      </div>
    );
  }

  // Error View
  if (error || !gift) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-rose-600/10 blur-[100px] top-1/4 left-1/2 -translate-x-1/2" />
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl z-10">
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto border border-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Access Terminated</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {error || "This reward page is unavailable or expired."}
            </p>
          </div>
          <a
            href="/"
            className="block w-full py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl transition text-sm"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const channelUsername = tgSettings?.channelUsername || "Royshare_official";
  const groupUsername = tgSettings?.groupUsername || "RoyShare_Support";

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[100px] top-1/6 left-1/3" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-emerald-600/5 blur-[100px] bottom-1/6 right-1/3" />

      <div className="max-w-md w-full space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xs font-black tracking-widest text-blue-500 uppercase">RoyShare Rewards</h2>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            🎁 Gift Center
          </h1>
        </div>

        {/* Primary Container Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-[32px] p-6 md:p-8 shadow-2xl relative">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Account Identification (Browser Mode Only) */}
            {!activeUser ? (
              <motion.div
                key="identity-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/15">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Identify Your Account</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Please provide your Telegram details so we can verify channel membership and secure your gift reward code.
                  </p>
                </div>

                <form onSubmit={handleManualLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 tracking-wider">
                      Telegram User ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none placeholder-slate-600 font-mono text-sm transition"
                      placeholder="e.g. 589230491"
                      value={manualUserId}
                      onChange={(e) => setManualUserId(e.target.value)}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      ℹ️ Send <strong>/id</strong> to any Telegram bot like <strong>@userinfobot</strong> to find your numeric ID.
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 tracking-wider">
                      Your First Name / Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none placeholder-slate-600 text-sm transition"
                      placeholder="e.g. Joy"
                      value={manualFirstName}
                      onChange={(e) => setManualFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 tracking-wider">
                      Telegram Username (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">@</span>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 text-white pl-8 pr-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none placeholder-slate-600 text-sm transition"
                        placeholder="username"
                        value={manualUsername}
                        onChange={(e) => setManualUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            ) : claimedCode ? (
              
              /* Step 3: Success Claim / Show Code Panel */
              <motion.div
                key="claimed-success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/5">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-white">{claimSuccessMsg || "Reward Unlocked!"}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Congratulations! Your free coupon / redeem code for <strong className="text-blue-400">{gift.name}</strong> is ready.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl relative group overflow-hidden">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Your Unique Redeem Code
                  </span>
                  <div className="font-mono text-xl md:text-2xl font-black text-emerald-400 tracking-wider break-all select-all">
                    {claimedCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(claimedCode)}
                    className="mt-4 bg-slate-900 hover:bg-slate-850 text-xs text-white font-bold px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5 mx-auto"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-[11px] text-slate-400 flex items-center gap-2 justify-center">
                  <span>Logged in as <strong>{activeUser.firstName}</strong></span>
                  {!tgUser && (
                    <button onClick={handleManualLogout} className="text-rose-400 hover:underline">
                      (Logout)
                    </button>
                  )}
                </div>
              </motion.div>
            ) : !isVerified ? (
              
              /* Step 2: Verification Requirements */
              <motion.div
                key="verification-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Campaign Summary */}
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-blue-400">Campaign Reward Item</p>
                  <h3 className="text-xl font-extrabold text-white">{gift.name}</h3>
                  <div className="flex gap-4 justify-center text-xs text-slate-500 font-medium pt-1">
                    <span>Remaining: <strong className="text-slate-300">{gift.remainingCodes}</strong></span>
                    <span>•</span>
                    <span>Total Supplied: <strong className="text-slate-300">{gift.totalCodes}</strong></span>
                  </div>
                </div>

                {/* Info Text */}
                <div className="space-y-1 text-center">
                  <h4 className="text-sm font-black text-white">Join Verification Required</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    To claim your reward, you must first join our official Telegram channel and group.
                  </p>
                </div>

                {/* Channel Links */}
                <div className="space-y-3">
                  <a
                    href={getTelegramLink(channelUsername)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 hover:border-blue-500/40 rounded-2xl transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold">
                        📢
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Step 1</span>
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                          Join Official Channel
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
                  </a>

                  <a
                    href={getTelegramLink(groupUsername)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 hover:border-blue-500/40 rounded-2xl transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                        👥
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Step 2</span>
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          Join Support Group
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition" />
                  </a>
                </div>

                {/* Actions & Status */}
                {verificationError && (
                  <div className="bg-rose-500/10 border border-rose-500/15 p-3 rounded-xl text-xs text-rose-400 flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleVerifyMembership}
                    disabled={verifying}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/10"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Verifying membership...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" /> Verify Joined Channels
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>Logged in as <strong>{activeUser.firstName}</strong></span>
                    {!tgUser && (
                      <button onClick={handleManualLogout} className="text-rose-400 hover:underline">
                        Switch Account
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              
              /* Ready to Claim Panel */
              <motion.div
                key="claim-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/5">
                    <Gift className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Membership Verified!</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Awesome job! You are verified. Click below to claim your unique coupon / redeem code.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-0.5">Item To Claim</span>
                  <span className="text-base font-black text-white">{gift.name}</span>
                </div>

                {verificationError && (
                  <div className="bg-rose-500/10 border border-rose-500/15 p-3 rounded-xl text-xs text-rose-400 flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleClaimGift}
                    disabled={claimLoading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/15 text-sm uppercase tracking-wider"
                  >
                    {claimLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Claiming code...
                      </>
                    ) : (
                      "Claim Redeem Code 🎁"
                    )}
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>Logged in as <strong>{activeUser.firstName}</strong></span>
                    {!tgUser && (
                      <button onClick={handleManualLogout} className="text-rose-400 hover:underline">
                        Switch Account
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
