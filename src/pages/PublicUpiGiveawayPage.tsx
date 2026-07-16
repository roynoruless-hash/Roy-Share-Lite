import React, { useState, useEffect } from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { db } from "../lib/firebase";
import { API_BASE } from "../config/api";
import { doc, getDoc, getDocs, collection, query, where, onSnapshot } from "firebase/firestore";
import { 
  Trophy, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon, 
  ChevronRight, 
  QrCode, 
  Send, 
  Loader2,
  Copy,
  Check,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseInKolkata, formatFriendlyKolkata, getGiveawayStatus, getGiveawayTimeLeft } from "../lib/dateUtils";

interface PublicUpiGiveawayPageProps {
  giveawayId: string;
  onBack: () => void;
}

export default function PublicUpiGiveawayPage({ giveawayId, onBack }: PublicUpiGiveawayPageProps) {
  const { user } = useTelegramAuth();
  
  const [giveaway, setGiveaway] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Submission fields
  const [upiId, setUpiId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  
  // Existing Entry State
  const [existingEntry, setExistingEntry] = useState<any>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // Copy helpers
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch Giveaway
  useEffect(() => {
    if (!giveawayId) return;

    const docRef = doc(db, "upi_giveaways", giveawayId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setGiveaway(snap.data());
      } else {
        setError("This UPI Giveaway campaign was not found or has been deleted.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching giveaway:", err);
      setError("Failed to connect to the database.");
      setLoading(false);
    });

    return unsub;
  }, [giveawayId]);

  // Sync Existing Entry
  useEffect(() => {
    if (!user?.telegramId || !giveawayId) {
      setLoadingEntry(false);
      return;
    }

    const entryId = `${giveawayId}_${user.telegramId}`;
    const entryRef = doc(db, "upi_giveaway_entries", entryId);
    
    const unsub = onSnapshot(entryRef, (docSnap) => {
      if (docSnap.exists()) {
        setExistingEntry(docSnap.data());
      } else {
        setExistingEntry(null);
      }
      setLoadingEntry(false);
    }, (err) => {
      console.error("Error listening to entry:", err);
      setLoadingEntry(false);
    });

    return unsub;
  }, [giveawayId, user?.telegramId]);

  // Countdown Clock Timer
  useEffect(() => {
    if (!giveaway?.endDate) return;

    const calculateTimeLeft = () => {
      const parsedEnd = parseInKolkata(giveaway.endDate);
      const difference = +parsedEnd - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [giveaway]);

  // QR Code Upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const res = await fetch(`${API_BASE}/api/upi-giveaway/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64: base64String
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setQrUrl(data.url);
          setSuccessMsg("QR Code uploaded successfully!");
          setTimeout(() => setSuccessMsg(""), 3050);
        } else {
          setError(data.error || "Failed to upload QR Code.");
        }
        setUploadingQr(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("QR upload error:", err);
      setError("Failed to upload QR Code. Server unavailable.");
      setUploadingQr(false);
    }
  };

  // Submit Entry to Backend
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!user) {
      return setError("You must be logged in inside Telegram to enter giveaways.");
    }

    const allowUpi = giveaway.entryRules?.allowUpiId ?? true;
    const allowQr = giveaway.entryRules?.allowQrUpload ?? true;

    if (allowUpi && allowQr) {
      if (!upiId.trim() && !qrUrl) {
        return setError("Please provide either your UPI ID or upload a QR Code to enter.");
      }
    } else if (allowUpi && !upiId.trim()) {
      return setError("Please enter your UPI ID.");
    } else if (allowQr && !qrUrl) {
      return setError("Please upload your payment QR Code.");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/submit-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giveawayId,
          telegramId: user.telegramId,
          username: user.username || "",
          firstName: user.firstName || "Telegram User",
          upiId: upiId.trim(),
          qrUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("🎉 Entry Submitted Successfully! Your entry is now confirmed! Good Luck! 🍀");
        setExistingEntry({ status: "Pending", ticketNumber: data.ticketNumber || "" });
      } else {
        setError(data.error || "Failed to submit entry. Please try again.");
      }
    } catch (err) {
      console.error("Entry submission error:", err);
      setError("Network error while submitting entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  if (loading || loadingEntry) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading Giveaway Campaign Details...</p>
        </div>
      </div>
    );
  }

  if (error && !giveaway) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black">Error Occurred</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-sm transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const allowUpiInput = giveaway.entryRules?.allowUpiId ?? true;
  const allowQrUpload = giveaway.entryRules?.allowQrUpload ?? true;
  
  const status = getGiveawayStatus(giveaway);
  const giveawayIsEnded = status === "ENDED";

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-16 font-sans relative overflow-x-hidden">
      
      {/* Top Bar Header */}
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <h2 className="text-lg font-black tracking-tight text-white">🔥 UPI Giveaway</h2>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6 relative z-10">
        
        {/* Giveaway Main Details Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Banner */}
          <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
            <img src={giveaway.bannerUrl} alt={giveaway.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
            
            {/* Status floating badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                giveawayIsEnded ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}>
                {giveawayIsEnded ? "Ended" : "Live Giveaway"}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h1 className="text-xl font-black text-white">{giveaway.title}</h1>
            {giveaway.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{giveaway.description}</p>
            )}

            {/* Reward Summary Card */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Giveaway Budget</span>
                <span className="text-lg font-black text-emerald-400">₹{giveaway.totalBudget}</span>
              </div>
              <div className="space-y-1 border-l border-slate-850 pl-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Lucky Winners</span>
                <span className="text-lg font-black text-white">{giveaway.totalWinners}</span>
              </div>
            </div>

            {/* Countdown / Expired Status */}
            {!giveawayIsEnded ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">Countdown Until Draw</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40">
                    <span className="text-lg font-black text-white block">{timeLeft.days}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Days</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40">
                    <span className="text-lg font-black text-white block">{timeLeft.hours}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Hours</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40">
                    <span className="text-lg font-black text-white block">{timeLeft.minutes}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Mins</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40">
                    <span className="text-lg font-black text-white block">{timeLeft.seconds}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Secs</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                This giveaway campaign has closed for submissions.
              </div>
            )}
          </div>
        </div>

        {/* Existing Confirmed Entry Panel */}
        {existingEntry ? (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl relative">
            
            {/* Top Confirmed Stamp */}
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <span className="text-xs font-black block">ENTRY CONFIRMED</span>
                <span className="text-[10px] text-emerald-500/80">You are successfully enrolled in this giveaway!</span>
              </div>
            </div>

            {/* Submission Detail List */}
            <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-2xl border border-slate-855 text-xs">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Your Submitted Details</span>
              
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400">Telegram Name:</span>
                <span className="font-bold text-slate-200">{existingEntry.firstName || user?.firstName}</span>
              </div>

              {existingEntry.ticketNumber && (
                <div className="flex justify-between border-b border-slate-900 pb-2 items-center">
                  <span className="text-slate-400">Ticket Number:</span>
                  <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{existingEntry.ticketNumber}</span>
                </div>
              )}

              {existingEntry.upiId && (
                <div className="flex justify-between border-b border-slate-900 pb-2 items-center">
                  <span className="text-slate-400">UPI ID:</span>
                  <span className="font-mono font-bold text-slate-200 select-all">{existingEntry.upiId}</span>
                </div>
              )}

              {existingEntry.qrUrl && (
                <div className="flex justify-between pb-1 items-center">
                  <span className="text-slate-400">QR Code:</span>
                  <a 
                    href={existingEntry.qrUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Eye className="w-3.5 h-3.5" /> View QR
                  </a>
                </div>
              )}
            </div>

            {/* Status Update Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">Draw Result</span>
              
              {existingEntry.status === "Pending" ? (
                <div className="text-center space-y-2">
                  <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-black text-xs inline-block">
                    ⏳ Pending Selection
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Winners will be picked randomly when the campaign ends. We will notify you directly via our Telegram Bot!
                  </p>
                </div>
              ) : existingEntry.status === "Winner" ? (
                <div className="text-center space-y-3">
                  <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full font-black text-xs inline-flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> Winner! ₹{existingEntry.rewardAmount}
                  </span>
                  
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Payment Status</span>
                    <span className={`text-xs font-black ${existingEntry.paymentStatus === "Paid" ? "text-emerald-400" : "text-amber-400"}`}>
                      {existingEntry.paymentStatus === "Paid" ? "💸 Paid & Completed" : "⏳ Processing Payment"}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[10px]">
                    Congratulations on your win! If payment is pending, our admins will process it to your UPI ID shortly.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-full font-black text-xs inline-block">
                    💔 Better Luck Next Time
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    You weren't selected as a winner in this campaign. Don't worry, we host unlimited giveaways! Keep participating! 🍀
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (() => {
          if (status === "ENDED") {
            return (
              <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center text-red-400 text-sm space-y-3">
                <AlertCircle className="w-10 h-10 mx-auto text-red-500" />
                <h3 className="font-bold text-white">Giveaway Ended</h3>
                <p className="text-xs text-slate-400 leading-relaxed">This Giveaway has ended.</p>
              </div>
            );
          }

          return (
            /* Form Submission Block */
            <form onSubmit={handleSubmitEntry} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Trophy className="w-4.5 h-4.5 text-yellow-400" />
                  Submit Your Entry Details
                </h3>
                <p className="text-slate-400 text-[10px]">Please complete the verified field(s) below to enroll.</p>
              </div>

              {/* Notifications inside Form */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Field: UPI ID */}
              {allowUpiInput && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex justify-between">
                    <span>Enter Your UPI ID</span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">Example: user@upi</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., paytmuser@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3.5 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              )}

              {/* Field: QR Code Upload */}
              {allowQrUpload && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Upload Payment QR Code</label>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      id="qr-file"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="qr-file"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5 transition shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {uploadingQr ? "Uploading..." : "Select QR"}
                    </label>

                    {qrUrl ? (
                      <div className="relative shrink-0 w-11 h-11 rounded border border-slate-700 bg-slate-900 overflow-hidden">
                        <img src={qrUrl} alt="QR Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No QR code uploaded yet</span>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || uploadingQr}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <>
                    <Send className="w-4.5 h-4.5" />
                    Enroll In Giveaway 🍀
                  </>
                )}
              </button>
            </form>
          );
        })()}


      </main>



    </div>
  );
}
