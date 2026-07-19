import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, Info, AlertCircle, ShieldAlert } from "lucide-react";
import { useTelegramAuth } from "../../context/TelegramAuthContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { API_BASE } from "../../config/api";

export default function SplitOrStealHome({ onBack, onJoinMatch }: { onBack: () => void, onJoinMatch: (matchId: string) => void }) {
  const { user } = useTelegramAuth();
  const [settings, setSettings] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queueStatus, setQueueStatus] = useState<string | null>(null);
  const [recentMatchId, setRecentMatchId] = useState<string | null>(null);
  const [recentMatch, setRecentMatch] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "sos"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
      else setSettings({ enabled: true, entryFee: 5, prizePool: 20 });
    });
    return () => unsub();
  }, []);

  // Check localStorage for active match to automatically restore
  useEffect(() => {
    const savedMatchId = localStorage.getItem("sos_active_match_id");
    if (savedMatchId) {
      getDoc(doc(db, "sos_matches", savedMatchId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status !== "completed" && data.status !== "cancelled") {
            console.log("Found unfinished match in progress, restoring match:", savedMatchId);
            onJoinMatch(savedMatchId);
          } else {
            // Keep recent match data if completed so user can view results
            setRecentMatchId(savedMatchId);
            setRecentMatch(data);
          }
        }
      }).catch(console.error);
    }
  }, [onJoinMatch]);

  useEffect(() => {
    if (!user?.telegramId) return;
    const unsub = onSnapshot(doc(db, "sos_queue", String(user.telegramId)), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === "searching") {
          setQueueStatus("searching");
          pollMatch(); // Trigger matchmaking check
        } else if (data.status === "matched" && data.matchId) {
          localStorage.setItem("sos_active_match_id", data.matchId);
          onJoinMatch(data.matchId);
        }
      } else {
        setQueueStatus(null);
      }
    }, (err) => {
      console.error("Queue listener error:", err);
    });
    return () => unsub();
  }, [user]);

  const pollMatch = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/split-or-steal/matchmake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user?.telegramId })
      });
      const data = await res.json();
      if (data.success && data.status === "matched") {
        localStorage.setItem("sos_active_match_id", data.matchId);
        onJoinMatch(data.matchId);
      } else if (data.success && data.status === "searching") {
        setTimeout(pollMatch, 3000);
      }
    } catch (e) {
      console.error(e);
      setTimeout(pollMatch, 5000);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/split-or-steal/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user?.telegramId })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setShowConfirm(false);
      }
    } catch (e: any) {
      setError("Failed to join. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQueue = async () => {
    try {
      await fetch(`${API_BASE}/api/split-or-steal/cancel-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user?.telegramId })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!settings || settings.enabled === false) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Game Offline</h2>
        <p className="text-slate-400 mt-2">Split or Steal is currently disabled for maintenance.</p>
        <button onClick={onBack} className="mt-6 px-6 py-2 bg-slate-800 rounded-xl text-sm font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-20 relative">
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <h2 className="text-xl font-bold">Split or Steal</h2>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-8">
        <div className="bg-gradient-to-br from-rose-900/40 to-blue-900/40 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h1 className="text-3xl font-black mb-2 relative z-10">Split <span className="text-slate-500">or</span> Steal</h1>
          <p className="text-sm text-slate-300 relative z-10 mb-6">Trust your opponent or take it all.</p>
          
          <div className="flex justify-center gap-8 relative z-10">
            <div className="text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Entry Fee</div>
              <div className="text-2xl font-bold text-white">₹{settings.entryFee}</div>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Prize Pool</div>
              <div className="text-2xl font-bold text-amber-400">₹{settings.prizePool}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold flex items-center gap-2 text-slate-200 mb-4"><Info className="w-5 h-5 text-blue-400" /> How to Play</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-2"><span>1.</span><span>Pay the entry fee and enter the matchmaking queue.</span></li>
            <li className="flex gap-2"><span>2.</span><span>Discuss your decision with your opponent in a secure chat room.</span></li>
            <li className="flex gap-2"><span>3.</span><span>When the timer ends, secretly choose to <strong>Split</strong> or <strong>Steal</strong>.</span></li>
            <li className="flex gap-2 text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl w-full border border-slate-800 mt-2 space-y-2">
                <p>🤝 Both Split = 50/50 Prize</p>
                <p>😈 Steal + 🤝 Split = Stealer gets 100%</p>
                <p>😈 Both Steal = Nobody gets anything</p>
              </div>
            </li>
          </ul>
        </div>

        {queueStatus === "searching" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="font-bold text-white">Searching for opponent...</h3>
              <p className="text-xs text-slate-400 mt-1">Estimated wait time: ~{settings.humanWaitTime}s</p>
            </div>
            <button onClick={handleCancelQueue} className="px-6 py-2 bg-rose-500/10 text-rose-400 font-bold rounded-xl text-sm w-full">Cancel Search</button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setShowConfirm(true)} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black text-white text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Play Now
            </button>
            {recentMatchId && (
              <button 
                onClick={() => onJoinMatch(recentMatchId)} 
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl font-bold text-slate-300 text-sm transition flex items-center justify-center gap-2"
              >
                <span>📊</span> View Last Match Results
              </button>
            )}
          </div>
        )}
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
            <h3 className="text-xl font-bold text-center mb-6">Confirm Entry</h3>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-800">
              <span className="text-slate-400">Entry Fee</span>
              <span className="font-bold">₹{settings.entryFee}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-800 mb-6">
              <span className="text-slate-400">Prize Pool</span>
              <span className="font-bold text-amber-400">₹{settings.prizePool}</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoin}
                disabled={loading}
                className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Pay & Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
