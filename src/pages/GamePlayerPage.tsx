import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Gamepad2, 
  Clock, 
  ExternalLink, 
  RefreshCw,
  Trophy,
  Flame,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Play,
  ArrowRight,
  ChevronRight,
  Info
} from "lucide-react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";

interface Game {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  bannerUrl: string;
  category: string;
  rewardCoins: number;
  requiredTime: number; // in seconds
}

interface GamePlayerPageProps {
  gameId: string;
  userId: string;
  onBack: () => void;
}

export const GamePlayerPage: React.FC<GamePlayerPageProps> = ({ gameId, userId, onBack }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ sessionId: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (playing) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [playing]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gamepix/game/${gameId}`);
      const data = await res.json();
      if (data.success) {
        setGame(data.game);
      } else {
        setError("Game not found");
      }
    } catch (err) {
      setError("Failed to load game details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlay = async () => {
    if (!game || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/api/game/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gameId: game.id })
      });
      const data = await res.json();
      if (data.success) {
        setSession({ sessionId: data.sessionId });
        setStartTime(Date.now());
        setPlaying(true);
        // Open game in external browser
        window.open(game.url, "_blank");
      } else {
        alert(data.error || "Failed to start session");
      }
    } catch (err) {
      console.error("Session start error:", err);
      alert("Failed to connect to server");
    }
  };

  const handleClaimReward = async () => {
    if (!session || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/api/game/sessions/end-v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, userId })
      });
      const data = await res.json();
      if (data.success) {
        setRewardClaimed(true);
        setClaimData(data);
        setPlaying(false);
      } else {
        alert(data.error || "Failed to claim reward");
      }
    } catch (err) {
      console.error("Claim reward error:", err);
      alert("Failed to claim reward. Please check your internet.");
    }
  };

  const elapsedSeconds = startTime ? Math.floor((currentTime - startTime) / 1000) : 0;
  const progress = game ? Math.min((elapsedSeconds / game.requiredTime) * 100, 100) : 0;
  const canClaim = game && elapsedSeconds >= game.requiredTime;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Play Channel...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Game Offline</h2>
        <p className="text-slate-400 text-sm mb-6">{error || "This game is currently unavailable."}</p>
        <button onClick={onBack} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-bold text-white hover:bg-white/10 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-6 py-4 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-sm font-black text-white truncate max-w-[150px]">{game.title}</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Premium Session</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-black text-emerald-500">{game.rewardCoins}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {!playing && !rewardClaimed ? (
            <motion.div
              key="prepare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                <img src={game.bannerUrl || game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20">
                      <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">{game.title}</h2>
                      <p className="text-xs text-slate-300">{game.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 text-indigo-400">
                  <Info className="w-5 h-5" />
                  <h3 className="font-bold text-sm uppercase tracking-widest">How to earn rewards</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="text-xs text-slate-400 leading-relaxed">Click "Play Now" to open the game in your default browser.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-xs text-slate-400 leading-relaxed">Play for at least <b>{Math.ceil(game.requiredTime / 60)} minutes</b> to qualify for the reward.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shrink-0">3</div>
                    <p className="text-xs text-slate-400 leading-relaxed">Return to this page and click <b>Claim Reward</b> to get your coins.</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-4">
                <ShieldCheck className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Our system verifies active play time. Do not close this app while playing the game in your browser to ensure session tracking.
                </p>
              </div>

              <button 
                onClick={handleStartPlay}
                className="w-full bg-white text-slate-950 hover:bg-indigo-500 hover:text-white py-5 rounded-3xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Play Now <ExternalLink className="w-6 h-6" />
              </button>
            </motion.div>
          ) : playing ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-indigo-500 animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gamepad2 className="w-12 h-12 text-indigo-500 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">Gaming in Progress</h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  You are currently playing in an external window. Stay active to earn rewards!
                </p>
              </div>

              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-black text-white">{Math.floor(progress)}%</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full border border-white/5 p-1">
                    <motion.div 
                      className={`h-full rounded-full ${canClaim ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-indigo-600'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-center items-center gap-2 pt-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-bold text-slate-400">
                      {Math.floor(elapsedSeconds / 60)}m {(elapsedSeconds % 60)}s / {Math.ceil(game.requiredTime / 60)}m
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                  <button 
                    onClick={() => window.open(game.url, "_blank")}
                    className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    Resume Game <ExternalLink className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleClaimReward}
                    disabled={!canClaim}
                    className={`w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                      canClaim 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale'
                    }`}
                  >
                    Claim Reward <Trophy className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reward"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-900/40 rotate-6">
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white">Reward Claimed!</h2>
                <p className="text-slate-400 text-sm">Great job! Your coins have been added to your arcade wallet.</p>
              </div>

              <div className="w-full bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex justify-around items-center">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Earned</p>
                    <div className="flex items-center gap-2 text-2xl font-black text-white">
                      <Coins className="w-6 h-6 text-amber-500" />
                      {claimData?.coinsEarned || game.rewardCoins}
                    </div>
                  </div>
                  <div className="w-px h-12 bg-white/5" />
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Streak</p>
                    <div className="flex items-center gap-2 text-2xl font-black text-white">
                      <Flame className="w-6 h-6 text-orange-500" />
                      {claimData?.newStreak || "0"}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Next Milestone</p>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4" />
                  </div>
                </div>
              </div>

              <button 
                onClick={onBack}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-3xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                Back to Arcade <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
