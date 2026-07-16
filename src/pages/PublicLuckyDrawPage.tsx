import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, Trophy, Users, Info, Calendar, CheckCircle, AlertCircle, Loader2, Lock, Sparkles, RefreshCw } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { parseInKolkata, formatFriendlyKolkata, getGiveawayStatus, getGiveawayTimeLeft } from "../lib/dateUtils";

export default function PublicLuckyDrawPage({ giveawayId, onBack }: { giveawayId: string; onBack: () => void }) {
  const { user } = useTelegramUser();
  const [giveaway, setGiveaway] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [participationStatus, setParticipationStatus] = useState<"not_enrolled" | "enrolled" | "winner">("not_enrolled");
  const [winnerDetails, setWinnerDetails] = useState<any>(null);

  // Verification & Enrollment local state
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [verifyingMembership, setVerifyingMembership] = useState(false);
  const [membershipError, setMembershipError] = useState("");
  const [membershipSuccess, setMembershipSuccess] = useState(false);

  // 1. Real-time Subscription to Lucky Draw Campaign
  useEffect(() => {
    if (!giveawayId) return;
    console.log("[LuckyDraw] Subscribing to campaign document:", giveawayId);
    const docRef = doc(db, "lucky_draws", giveawayId);
    const unsub = onSnapshot(docRef, (snap) => {
      setLoading(false);
      if (snap.exists()) {
        const data = snap.data();
        console.log("[LuckyDraw] Campaign data updated:", data);
        setGiveaway(data);
      } else {
        console.error("[LuckyDraw] Campaign not found inside Firestore:", giveawayId);
        setError("This Lucky Draw campaign was not found or has been deleted.");
      }
    }, (err) => {
      console.error("[LuckyDraw] Error fetching campaign document:", err);
      setLoading(false);
      setError("Failed to load campaign.");
    });
    return () => unsub();
  }, [giveawayId]);

  // 2. Real-time Subscription to Authenticated User Profile in Firestore
  useEffect(() => {
    if (!user?.telegramId) {
      console.log("[LuckyDraw] No authenticated telegramId found for profile subscription");
      return;
    }
    console.log("[LuckyDraw] Subscribing to user profile in Firestore for telegramId:", user.telegramId);
    const userRef = doc(db, "users", String(user.telegramId));
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        console.log("[LuckyDraw] User profile updated in Firestore:", data);
        setDbUser(data);
      } else {
        console.log("[LuckyDraw] User profile document does not exist yet inside 'users' collection");
        setDbUser(null);
      }
    }, (err) => {
      console.error("[LuckyDraw] Error listening to user profile:", err);
    });
    return () => unsub();
  }, [user?.telegramId]);

  // 3. Real-time Subscription to Participation & Winner Documents
  useEffect(() => {
    console.log(`[LuckyDraw] useEffect(Participation) triggered | user.telegramId: ${user?.telegramId} | giveawayId: ${giveawayId}`);
    if (!user?.telegramId || !giveawayId) {
      console.log(`[LuckyDraw] ⚠️ Skipping subscription: Missing user.telegramId (${user?.telegramId}) or giveawayId (${giveawayId})`);
      return;
    }
    console.log("[LuckyDraw] 📡 Subscribing to participant and winner statuses for:", user.telegramId, giveawayId);

    const participantDocId = `${giveawayId}_${user.telegramId}`;
    console.log(`[LuckyDraw] Listening to lucky_draw_participants doc: ${participantDocId}`);
    
    const pRef = doc(db, "lucky_draw_participants", participantDocId);
    const unsubP = onSnapshot(pRef, (snap) => {
      if (snap.exists()) {
        console.log(`[LuckyDraw] 🟢 User is enrolled (found in lucky_draw_participants: ${participantDocId})`);
        setParticipationStatus("enrolled");
      } else {
        console.log(`[LuckyDraw] 🔴 User is not enrolled (not found in lucky_draw_participants: ${participantDocId})`);
        setParticipationStatus("not_enrolled");
      }
    }, (err) => {
      console.error("[LuckyDraw] ❌ Error listening to lucky_draw_participants:", err);
    });

    const wRef = collection(db, "lucky_draw_winners");
    const wQ = query(wRef, where("campaignId", "==", giveawayId), where("telegramId", "==", String(user.telegramId)));
    const unsubW = onSnapshot(wQ, (snap) => {
      if (!snap.empty) {
        console.log("[LuckyDraw] User is a selected winner in lucky_draw_winners!");
        setParticipationStatus("winner");
        setWinnerDetails(snap.docs[0].data());
      }
    }, (err) => {
      console.error("[LuckyDraw] Error listening to lucky_draw_winners:", err);
    });

    return () => {
      unsubP();
      unsubW();
    };
  }, [giveawayId, user?.telegramId]);

  // 4. Timer calculation
  useEffect(() => {
    if (!giveaway) return;
    const calculateTimeLeft = () => {
      setTimeLeft(getGiveawayTimeLeft(giveaway));
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [giveaway]);

  // Helper: Get user's dynamic requirements status list
  const getRequirementsList = () => {
    if (!giveaway) return [];
    const rules = giveaway.rules || {};
    const list: Array<{ id: string; label: string; isMet: boolean; progressStr?: string; canVerify?: boolean }> = [];

    // TG Membership verification
    if (rules.requireTgChannel || rules.requireTgGroup) {
      const label = `Join Official Telegram ${rules.requireTgChannel && rules.requireTgGroup ? "Channel & Group" : rules.requireTgChannel ? "Channel" : "Group"}`;
      list.push({
        id: "membership",
        label,
        isMet: !!dbUser?.membershipVerified,
        canVerify: true
      });
    }

    // Min referrals
    if (rules.minReferrals > 0) {
      const current = Number(dbUser?.referrals || 0);
      const req = Number(rules.minReferrals);
      list.push({
        id: "referrals",
        label: `Invite at least ${req} Referrals`,
        isMet: current >= req,
        progressStr: `(${current}/${req} joined)`
      });
    }

    // Min reward tasks completed
    if (rules.minRewardTasks > 0) {
      const current = Number(dbUser?.tasksCompleted || 0);
      const req = Number(rules.minRewardTasks);
      list.push({
        id: "tasks",
        label: `Complete ${req} Reward Tasks`,
        isMet: current >= req,
        progressStr: `(${current}/${req} completed)`
      });
    }

    // Account verification
    if (rules.requireAccountVerification) {
      list.push({
        id: "verification",
        label: "Account Status Verified",
        isMet: !!dbUser?.verified
      });
    }

    // Wallet Connected
    if (rules.requireWalletConnected) {
      list.push({
        id: "wallet",
        label: "Connect Crypto Wallet",
        isMet: !!(dbUser?.walletAddress || dbUser?.isWalletConnected)
      });
    }

    // Mobile verification
    if (rules.requireMobileVerification) {
      list.push({
        id: "mobile",
        label: "Mobile Number Verified",
        isMet: !!(dbUser?.phone || dbUser?.isMobileVerified)
      });
    }

    // Email verification
    if (rules.requireEmailVerification) {
      list.push({
        id: "email",
        label: "Email Address Verified",
        isMet: !!(dbUser?.email || dbUser?.isEmailVerified)
      });
    }

    return list;
  };

  const requirements = getRequirementsList();
  const allRequirementsMet = requirements.every(req => req.isMet);

  const tg = (window as any).Telegram?.WebApp;
  const isInsideTelegram = !!(tg && tg.initData);

  // Membership Verification Action
  const handleVerifyMembership = async () => {
    if (!user?.telegramId) {
      setMembershipError("Telegram profile not loaded. Please re-authenticate inside Telegram.");
      return;
    }
    setVerifyingMembership(true);
    setMembershipError("");
    setMembershipSuccess(false);
    console.log("[LuckyDraw] Initiating membership verification request for Telegram ID:", user.telegramId);

    try {
      const res = await fetch("/api/user/verify-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.telegramId })
      });
      const data = await res.json();
      console.log("[LuckyDraw] Membership verification API response:", data);

      if (res.ok && data.verified) {
        console.log("[LuckyDraw] Membership successfully verified on server.");
        setMembershipSuccess(true);
        setTimeout(() => setMembershipSuccess(false), 4000);
      } else {
        console.warn("[LuckyDraw] Membership check failed:", data.error);
        setMembershipError(data.error || "Please join both official channel and group first!");
      }
    } catch (err: any) {
      console.error("[LuckyDraw] Failed to complete membership verification API call:", err);
      setMembershipError("Failed to verify membership. Please verify your internet connection and try again.");
    } finally {
      setVerifyingMembership(false);
    }
  };

  const completeEnrollment = async () => {
    setEnrolling(true);
    setEnrollError("");
    console.log(`[LuckyDraw] 🚀 Initiating Enrollment API call | Campaign: ${giveawayId} | User: ${user?.telegramId}`);
    try {
      const payload = {
        campaignId: giveawayId,
        telegramId: user?.telegramId
      };
      const endpoint = "/api/upi-giveaway/lucky-draw/enroll";
      console.log(`[LuckyDraw] Sending payload to ${endpoint}:`, payload);
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const responseText = await res.text();
      console.log(`[LuckyDraw] Raw response status: ${res.status}`);
      
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("[LuckyDraw] Failed to parse enrollment response as JSON. Raw response text:", responseText);
        setEnrollError(`Server error (${res.status}). Please try again later.`);
        setEnrolling(false);
        return;
      }

      console.log(`[LuckyDraw] 📩 Enrollment API response received | HTTP Status: ${res.status}`, data);

      if (res.ok && data.success) {
        console.log("[LuckyDraw] ✅ Successfully enrolled on server. Updating UI status immediately.");
        setParticipationStatus("enrolled");
      } else {
        console.warn("[LuckyDraw] ❌ Enrollment rejected by server:", data.error);
        setEnrollError(data.error || "Enrollment failed. Please ensure you satisfy all rules.");
      }
    } catch (err: any) {
      console.error("[LuckyDraw] 💥 Enrollment API exception occurred:", err);
      setEnrollError(err.message || "Network error while submitting enrollment. Please try again.");
    } finally {
      setEnrolling(false);
      console.log("[LuckyDraw] 🏁 Enrollment flow finished.");
    }
  };

  // Lucky Draw Enrollment Action
  const handleEnrollInLuckyDraw = async () => {
    if (!user?.telegramId || !giveawayId) {
      setEnrollError("User or campaign details not available.");
      return;
    }

    if (!isInsideTelegram) {
      setEnrollError("Rewarded Ads and Enrollment are only available inside the Telegram Mini App.");
      return;
    }

    setEnrolling(true);
    setEnrollError("");
    
    const blockId = "3856"; // Recommended Adsgram test block ID for rewarded videos
    const adsgram = (window as any).Adsgram;
    
    if (adsgram) {
      console.log("[LuckyDraw] Adsgram SDK is initialized correctly in the window scope.");
      try {
        console.log("[Adsgram] Callback: loaded | Initializing ad controller with blockId:", blockId);
        const adController = adsgram.init({ blockId });
        console.log("[Adsgram] Ad controller initialized:", adController);
        
        console.log("[Adsgram] Callback: opened | Displaying rewarded video ad...");
        adController.show()
          .then((result: any) => {
            console.log("[Adsgram] Callback: rewarded | User successfully watched the full ad!", result);
            // After successful ad reward callback, proceed to enroll
            completeEnrollment();
          })
          .catch((err: any) => {
            console.error("[Adsgram] Callback: failed or closed | Ad closed prematurely or failed to load:", err);
            setEnrollError("Please watch the full ad to participate.");
            setEnrolling(false);
          });
      } catch (err: any) {
        console.error("[LuckyDraw] Failed to initialize Adsgram. Callback: failed:", err);
        setEnrollError("Failed to load sponsored ad. Please try again.");
        setEnrolling(false);
      }
    } else {
      console.log("[LuckyDraw] Adsgram SDK not loaded in window.");
      setEnrollError("Adsgram SDK failed to load. Please ensure you are running inside Telegram and have a stable internet connection.");
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading Lucky Draw Details...</p>
      </div>
    );
  }

  if (error && !giveaway) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Campaign Not Found</h2>
        <p className="text-slate-400 text-center max-w-sm">{error}</p>
        <button onClick={onBack} className="mt-4 bg-slate-800 hover:bg-slate-750 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const status = giveaway ? getGiveawayStatus(giveaway) : "ENDED";
  const giveawayIsEnded = status === "ENDED";
  const giveawayIsActive = status === "LIVE";

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Lucky Draw</h2>
          <p className="text-xs text-slate-400">Premium Reward Campaign</p>
        </div>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6 relative z-10">
        {giveaway && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
              <img src={giveaway.bannerUrl || giveaway.thumbnailUrl || "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d"} alt={giveaway.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  giveawayIsEnded ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {giveawayIsEnded ? "Ended" : "Live Draw"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h1 className="text-xl font-black text-white">{giveaway.title}</h1>
              {giveaway.description && (
                <p className="text-xs text-slate-400 leading-relaxed">{giveaway.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Prize Details</span>
                  <span className="text-lg font-black text-emerald-400">
                    {giveaway.prizeType === "Cash" || giveaway.prizeType === "UPI" ? "₹" : ""}{giveaway.prizeAmount} {giveaway.currency}
                  </span>
                </div>
                <div className="space-y-1 border-l border-slate-850 pl-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Lucky Winners</span>
                  <span className="text-lg font-black text-white flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-400"/> {giveaway.winnerCount}</span>
                </div>
              </div>

              {!giveawayIsEnded ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">Countdown Until Draw</span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40"><span className="text-lg font-black text-white block">{timeLeft.days}</span><span className="text-[9px] text-slate-500 font-bold uppercase">Days</span></div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40"><span className="text-lg font-black text-white block">{timeLeft.hours}</span><span className="text-[9px] text-slate-500 font-bold uppercase">Hours</span></div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40"><span className="text-lg font-black text-white block">{timeLeft.minutes}</span><span className="text-[9px] text-slate-500 font-bold uppercase">Mins</span></div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40"><span className="text-lg font-black text-white block">{timeLeft.seconds}</span><span className="text-[9px] text-slate-500 font-bold uppercase">Secs</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" /> This lucky draw has closed.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requirements & Checklist (Only visible if not ended and not winner) */}
        {!giveawayIsEnded && participationStatus !== "winner" && requirements.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Campaign Requirements</span>
            </div>

            <div className="space-y-3">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-start justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-200 block">{req.label}</span>
                    {req.progressStr && (
                      <span className="text-[10px] text-slate-400 font-medium block">{req.progressStr}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.isMet ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-black uppercase">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {req.canVerify && (
                          <button
                            onClick={handleVerifyMembership}
                            disabled={verifyingMembership}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded-md transition flex items-center gap-1"
                          >
                            {verifyingMembership ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Verify
                          </button>
                        )}
                        <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black uppercase">
                          <Lock className="w-3.5 h-3.5" /> Pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Verification specific notifications */}
            {membershipError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{membershipError}</span>
              </div>
            )}
            {membershipSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs animate-pulse">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Membership verified successfully! All requirements updated.</span>
              </div>
            )}
          </div>
        )}

        {/* Participation Status Block */}
        {participationStatus === "winner" ? (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl relative">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400">
              <Trophy className="w-6 h-6 shrink-0 text-yellow-400" />
              <div>
                <span className="text-xs font-black block">CONGRATULATIONS!</span>
                <span className="text-[10px] text-emerald-500/80">You won this lucky draw!</span>
              </div>
            </div>
            {winnerDetails && (
              <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-2xl border border-slate-855 text-xs">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Prize Info</span>
                 <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Reward:</span>
                    <span className="font-bold text-emerald-400">₹{winnerDetails.prizeAmount || winnerDetails.rewardAmount || giveaway?.prizeAmount}</span>
                 </div>
                 <div className="flex justify-between pb-2">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-slate-200">Sent to your registered payment method.</span>
                 </div>
              </div>
            )}
          </div>
        ) : participationStatus === "enrolled" ? (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl relative">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6 shrink-0 text-emerald-400" />
              <div>
                <span className="text-xs font-black block">YOU ARE ENROLLED</span>
                <span className="text-[10px] text-emerald-400/80">You are successfully enrolled in this draw!</span>
              </div>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">Draw Result</span>
              {giveawayIsEnded ? (
                <div className="text-center space-y-2">
                  <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full font-black text-xs inline-block">Better luck next time!</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">You weren't selected as a winner in this campaign. Don't worry, we host unlimited giveaways!</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-black text-xs inline-block">⏳ Pending Draw</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Winners will be picked randomly when the campaign ends.</p>
                </div>
              )}
            </div>

            {/* Enrolled join button is disabled */}
            <button
              disabled={true}
              className="w-full py-4 bg-slate-800 text-slate-400 font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700/50"
            >
              <CheckCircle className="w-4.5 h-4.5 text-slate-500" />
              Already Enrolled 🍀
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
             <div className="flex items-center gap-3 text-amber-400">
                <Info className="w-6 h-6 shrink-0" />
                <span className="text-xs font-black">Not Enrolled</span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               You are currently not enrolled in this lucky draw. Please satisfy all specified requirements listed above to be eligible to enroll.
             </p>

             {enrollError && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 <span>{enrollError}</span>
               </div>
             )}

             {/* Enroll Button / Unsupported Environment Notice */}
             {!isInsideTelegram ? (
               <div className="space-y-4">
                 <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl flex flex-col gap-2 text-xs">
                   <div className="flex items-center gap-2 font-black uppercase text-amber-400">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     <span>Unsupported Environment</span>
                   </div>
                   <p className="text-slate-400 leading-relaxed font-medium">
                     Rewarded Ads and Enrollment are only available inside the Telegram Mini App. Please open this campaign inside Telegram to participate.
                   </p>
                 </div>
                 <button
                   disabled={true}
                   className="w-full py-4 bg-slate-800 text-slate-500 font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-800"
                 >
                   <Lock className="w-4.5 h-4.5 text-slate-500" />
                   Open in Telegram to Enroll
                 </button>
               </div>
             ) : (
               <button
                 onClick={handleEnrollInLuckyDraw}
                 disabled={enrolling || !allRequirementsMet || giveawayIsEnded}
                 className={`w-full py-4 font-black rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg ${
                   allRequirementsMet && !giveawayIsEnded
                     ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-emerald-950/20"
                     : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                 }`}
               >
                 {enrolling ? (
                   <Loader2 className="w-5 h-5 text-white animate-spin" />
                 ) : (
                   <>
                     <Sparkles className="w-4.5 h-4.5 text-yellow-400 animate-pulse" />
                     {allRequirementsMet ? "Enroll In Lucky Draw 🍀" : "Complete Requirements to Enroll"}
                   </>
                 )}
               </button>
             )}
          </div>
        )}

      </main>

    </div>
  );
}
