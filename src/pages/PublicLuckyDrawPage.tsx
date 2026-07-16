import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, Trophy, Users, Info, Calendar } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { parseInKolkata, formatFriendlyKolkata, getGiveawayTimingStatus, getGiveawayTimeLeft } from "../lib/dateUtils";



export default function PublicLuckyDrawPage({ giveawayId, onBack }: { giveawayId: string; onBack: () => void }) {
  const { user } = useTelegramUser();
  const [giveaway, setGiveaway] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [participationStatus, setParticipationStatus] = useState<"not_enrolled" | "enrolled" | "winner">("not_enrolled");
  const [winnerDetails, setWinnerDetails] = useState<any>(null);

  useEffect(() => {
    if (!giveawayId) return;
    const docRef = doc(db, "lucky_draws", giveawayId);
    const unsub = onSnapshot(docRef, (snap) => {
      setLoading(false);
      if (snap.exists()) {
        setGiveaway(snap.data());
      } else {
        setError("This Lucky Draw campaign was not found or has been deleted.");
      }
    }, (err) => {
      setLoading(false);
      setError("Failed to load campaign.");
    });
    return () => unsub();
  }, [giveawayId]);

  useEffect(() => {
    if (!user?.telegramId || !giveawayId) return;
    const checkParticipation = async () => {
      try {
        const pRef = collection(db, "lucky_draw_participants");
        const q = query(pRef, where("campaignId", "==", giveawayId), where("telegramId", "==", String(user.telegramId)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setParticipationStatus("enrolled");
        }
        
        const wRef = collection(db, "lucky_draw_winners");
        const wQ = query(wRef, where("campaignId", "==", giveawayId), where("telegramId", "==", String(user.telegramId)));
        const wSnap = await getDocs(wQ);
        if (!wSnap.empty) {
          setParticipationStatus("winner");
          setWinnerDetails(wSnap.docs[0].data());
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkParticipation();
  }, [giveawayId, user?.telegramId]);

  useEffect(() => {
    if (!giveaway) return;
    const calculateTimeLeft = () => {
      setTimeLeft(getGiveawayTimeLeft(giveaway));
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [giveaway]);

  if (loading) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
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

  const timing = giveaway ? getGiveawayTimingStatus(giveaway) : { status: 'Draft', message: '' };
  const giveawayIsEnded = timing.status === 'Ended' || timing.status === 'Completed' || timing.status === 'Drawing';
  const giveawayIsActive = timing.status === 'Active';

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

        {/* Participation Status */}
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
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-blue-400">
              <Calendar className="w-6 h-6 shrink-0" />
              <div>
                <span className="text-xs font-black block">YOU ARE ENROLLED</span>
                <span className="text-[10px] text-blue-400/80">You are automatically enrolled in this draw!</span>
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
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
             <div className="flex items-center gap-3 text-amber-400">
                <Info className="w-6 h-6 shrink-0" />
                <span className="text-xs font-black">Not Enrolled</span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               You are currently not enrolled in this lucky draw. To be eligible, ensure you have completed the required membership verification and tasks, then the system will automatically enroll you before the draw.
             </p>
          </div>
        )}

      </main>
    </div>
  );
}
