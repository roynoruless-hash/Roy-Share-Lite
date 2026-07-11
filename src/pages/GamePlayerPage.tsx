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
  Info,
  Tv,
  X,
  Timer as TimerIcon,
  Maximize2,
  Maximize,
  Minimize
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
  width?: string;
  height?: string;
  displayMode?: string;
  rewardSettings?: any;
}

interface GamePlayerPageProps {
  gameId: string;
  userId: string;
  onBack: () => void;
}

export const GamePlayerPage: React.FC<GamePlayerPageProps> = ({ gameId, userId, onBack }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ sessionId: string, sessionToken?: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [walkthroughData, setWalkthroughData] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [interactionCount, setInteractionCount] = useState(0);
  const [viewportDim, setViewportDim] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(`session_${userId}_${gameId}`);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
          setSession({ sessionId: parsed.sessionId });
          setStartTime(parsed.startTime);
          setActiveSeconds(parsed.activeSeconds || 0);
          setPlaying(true);
          console.log("🔄 Session Restored:", parsed);
        } else {
          localStorage.removeItem(`session_${userId}_${gameId}`);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, [userId, gameId]);

  // Persist activeSeconds periodically
  useEffect(() => {
    if (playing && session?.sessionId) {
      const savedSession = localStorage.getItem(`session_${userId}_${gameId}`);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        localStorage.setItem(`session_${userId}_${gameId}`, JSON.stringify({
          ...parsed,
          activeSeconds,
          timestamp: Date.now()
        }));
      }
    }
  }, [activeSeconds, playing, session, userId, gameId]);

  useEffect(() => {
    fetchGame();
    fetchGlobalSettings();
    fetchWalkthrough();
  }, [gameId]);

  const fetchWalkthrough = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gamemonetize/walkthrough/${gameId}`);
      const data = await res.json();
      if (data.success) {
        setWalkthroughData(data);
      }
    } catch (err) {
      console.error("Error fetching walkthrough:", err);
    }
  };

  // Visibility and Activity Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        console.log("⏸️ Page Hidden - Timer Paused");
      } else {
        setIsPaused(false);
        setLastActivity(Date.now());
        console.log("▶️ Page Visible - Timer Resumed");
      }
    };

    const handleActivity = () => {
      setLastActivity(Date.now());
      setInteractionCount(prev => prev + 1);
      if (isPaused) {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("wheel", handleActivity);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("wheel", handleActivity);
    };
  }, [isPaused]);

  // Orientation Detection & Responsive Logic
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setViewportDim({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [game]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getIframeStyle = () => {
    if (!viewportDim.width || !viewportDim.height || !game) return {};

    const dMode = game.displayMode || 'smart';
    // Use metadata if available, otherwise default to 16:9
    const gW = Number(game.width) || 1920;
    const gH = Number(game.height) || 1080;
    const gameAspect = gW / gH;
    const viewAspect = viewportDim.width / viewportDim.height;

    let style: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      border: 'none',
      transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: iframeLoaded ? 1 : 0
    };

    if (dMode === 'stretch') {
      style.width = '100%';
      style.height = '100%';
    } else if (dMode === 'cover') {
      if (viewAspect > gameAspect) {
        style.width = '100%';
        style.height = `${(viewAspect / gameAspect) * 100}%`;
      } else {
        style.width = `${(gameAspect / viewAspect) * 100}%`;
        style.height = '100%';
      }
    } else {
      // Contain mode (Default for Smart/Contain)
      if (viewAspect > gameAspect) {
        style.width = `${(gameAspect / viewAspect) * 100}%`;
        style.height = '100%';
      } else {
        style.width = '100%';
        style.height = `${(viewAspect / gameAspect) * 100}%`;
      }
    }

    return style;
  };

  // Main Timer and Heartbeat
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;

    if (playing && iframeLoaded && !isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        const idleTime = now - lastActivity;

        // If inactive for more than 20 seconds, pause
        if (idleTime > 20000) {
          if (!isPaused) {
            setIsPaused(true);
            console.warn("⏸️ Inactivity detected (>20s) - Timer Paused");
          }
          return;
        }

        setActiveSeconds(prev => prev + 1);
        setCurrentTime(now);
      }, 1000);

      // Heartbeat every 15 seconds
      heartbeatInterval = setInterval(async () => {
        if (session?.sessionId && session?.sessionToken) {
          try {
            await fetch(`${API_BASE}/api/game/sessions/heartbeat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                sessionId: session.sessionId,
                sessionToken: session.sessionToken,
                activeSeconds: activeSeconds,
                interactions: interactionCount
              })
            });
          } catch (e) {
            console.error("Heartbeat failed", e);
          }
        }
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [playing, iframeLoaded, isPaused, lastActivity, session, activeSeconds]);

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/game/reward-settings`);
      const data = await res.json();
      if (data.success) {
        setGlobalSettings(data.settings);
      }
    } catch (err) {
      console.error("Error fetching global settings:", err);
    }
  };

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

  const [showChromeModal, setShowChromeModal] = useState(false);

  const handleStartPlay = async () => {
    if (!game || !userId) return;

    const gameUrl = game.url;
    if (!gameUrl || !gameUrl.startsWith("https://")) {
      alert("Security Error: Only secure game URLs are allowed.");
      return;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && 
                    !/Edge|OPR|SamsungBrowser|UCBrowser|Maniac|MiuiBrowser|VivoBrowser|OppoBrowser/i.test(navigator.userAgent);

    const mustUseChrome = (gReward.chromeOnly ?? globalSettings?.chromeOnly) || 
                         !(gReward.allowWebView ?? globalSettings?.allowWebView);
    const useExternal = gReward.externalBrowserMode ?? globalSettings?.externalBrowserMode;

    if (mustUseChrome && isAndroid && !isChrome) {
      const urlWithoutProtocol = gameUrl.replace(/^https?:\/\//, "");
      const chromeIntent = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
      
      console.log("🚀 Forced Chrome Intent:", chromeIntent);
      window.location.href = chromeIntent;

      setTimeout(() => {
        setShowChromeModal(true);
      }, 2000);
      return;
    }

    if (useExternal) {
       window.open(gameUrl, "_blank");
       // We still start the session to track it
    }

    try {
      const res = await fetch(`${API_BASE}/api/game/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gameId: game.id })
      });
      const data = await res.json();
      
      if (data.success) {
        const sTime = Date.now();
        setSession({ sessionId: data.sessionId, sessionToken: data.sessionToken });
        setStartTime(sTime);
        setActiveSeconds(0);
        setInteractionCount(0);
        setPlaying(true);
        setLastActivity(Date.now());
        
        localStorage.setItem(`session_${userId}_${gameId}`, JSON.stringify({
          sessionId: data.sessionId,
          sessionToken: data.sessionToken,
          startTime: sTime,
          activeSeconds: 0,
          timestamp: Date.now()
        }));
      } else {
        alert(data.error || "Failed to start session");
      }
    } catch (err) {
      console.error("Session start error:", err);
      alert("Connection Error: Could not reach gaming server.");
    }
  };

  const handleClaimReward = async () => {
    if (!session || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/api/game/sessions/end-v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: session.sessionId, 
          sessionToken: session.sessionToken,
          userId,
          duration: activeSeconds,
          interactions: interactionCount,
          isFocused: !isPaused
        })
      });
      const data = await res.json();
      if (data.success) {
        setRewardClaimed(true);
        setClaimData(data);
        setPlaying(false);
        localStorage.removeItem(`session_${userId}_${gameId}`);
      } else {
        alert(data.error || "Failed to claim reward");
      }
    } catch (err) {
      console.error("Claim reward error:", err);
      alert("Failed to claim reward. Please check your internet.");
    }
  };

  // Consolidate settings (Game specific > Global defaults)
  const gReward = game?.rewardSettings || {};
  const rawRequiredTime = gReward.requiredTime ?? globalSettings?.requiredPlayTime ?? game?.requiredTime ?? 300;
  const requiredTime = isNaN(Number(rawRequiredTime)) ? 300 : Number(rawRequiredTime);
  
  const rawMinActiveTime = gReward.minActiveTime ?? globalSettings?.minActiveTime ?? 120;
  const minActiveTime = isNaN(Number(rawMinActiveTime)) ? 120 : Number(rawMinActiveTime);
  
  const rewardCoins = Number(gReward.rewardCoins ?? globalSettings?.rewardCoins ?? game?.rewardCoins) || 100;

  const progress = Math.min((activeSeconds / requiredTime) * 100, 100);
  // canClaim requires reaching the requiredTime and also meeting minActiveTime (though activeSeconds tracks focus)
  const canClaim = activeSeconds >= requiredTime && activeSeconds >= minActiveTime;
  const remainingTime = Math.max(requiredTime - activeSeconds, 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleBack = () => {
    if (playing && !canClaim) {
      setShowBackWarning(true);
    } else {
      onBack();
    }
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {!playing || rewardClaimed ? (
        <>
          <header className="px-6 py-4 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
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
                <span className="text-sm font-black text-emerald-500">{rewardCoins}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full overflow-y-auto">
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
                        <p className="text-xs text-slate-400 leading-relaxed">Click "Play Now" to start the integrated gaming session.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shrink-0">2</div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Play for at least <b>{Math.ceil(requiredTime / 60)} minutes</b> to qualify for the <b>{rewardCoins} coin</b> reward.
                          </p>
                          {minActiveTime > 0 && (
                            <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">
                              Focus required: {Math.ceil(minActiveTime / 60)}m active play
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black shrink-0">3</div>
                        <p className="text-xs text-slate-400 leading-relaxed">Wait for the <b>Claim Reward</b> button to activate after completion.</p>
                      </div>
                    </div>
                  </div>

                  {walkthroughData?.success && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-blue-400">
                        <div className="bg-blue-500/10 p-2 rounded-xl">
                          <Tv size={18} />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">🎥 Official Game Walkthrough</h3>
                      </div>
                      
                      <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl relative group aspect-video">
                        <iframe 
                          title="Official Game Walkthrough"
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>
                                  body { margin: 0; padding: 0; background: black; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                                  #gamemonetize-video { width: 100% !important; height: 100% !important; }
                                </style>
                              </head>
                              <body>
                                ${walkthroughData.walkthrough.rawCode || `<iframe src="https://api.gamemonetize.com/video.php?id=${walkthroughData.walkthrough.gameId}&width=100%&height=100%&color=${encodeURIComponent('#4f46e5')}" frameBorder="0" scrolling="no" width="100%" height="100%"></iframe>`}
                              </body>
                            </html>
                          `}
                          frameBorder="0" scrolling="no" width="100%" height="100%" className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleStartPlay}
                    className="w-full bg-white text-slate-950 hover:bg-indigo-500 hover:text-white py-5 rounded-3xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    Play Now <Play className="w-6 h-6" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="reward"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10"
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
                          {claimData?.coinsEarned || rewardCoins}
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
                  </div>
                  <button onClick={onBack} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-3xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                    Back to Arcade <ChevronRight className="w-6 h-6" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      ) : (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          {/* SESSION HEADER */}
          <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={handleBack} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-white truncate uppercase tracking-tight">{game.title}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${iframeLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    {iframeLoaded ? 'Live Session' : 'Initializing...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {isPaused ? (
                    <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                  ) : (
                    <TimerIcon className={`w-3 h-3 ${canClaim ? 'text-emerald-500' : 'text-indigo-400'}`} />
                  )}
                  <span className={`text-xs font-black ${canClaim ? 'text-emerald-500' : isPaused ? 'text-amber-500' : 'text-white'} font-mono tabular-nums`}>
                    {isPaused ? "PAUSED" : formatTime(remainingTime)}
                  </span>
                </div>
                <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${canClaim ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
              
              {canClaim && (
                <button 
                  onClick={handleClaimReward}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 animate-in fade-in zoom-in"
                >
                  Claim
                </button>
              )}
              
              <button 
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white flex items-center justify-center shrink-0"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </header>

          {/* GAME VIEWPORT */}
          <div 
            ref={containerRef}
            className="flex-1 relative bg-black overflow-hidden flex flex-col"
            style={{ 
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)'
            }}
          >
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-6 z-10 bg-slate-950">
                <div className="w-full max-w-xs space-y-4 animate-pulse mb-4">
                  <div className="h-40 bg-slate-900 rounded-[2.5rem] w-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-900 rounded-full w-3/4 mx-auto" />
                    <div className="h-3 bg-slate-900 rounded-full w-1/2 mx-auto" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                    <Gamepad2 className="absolute inset-0 m-auto w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Loading Game World</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Preparing Responsive Viewport...</p>
                  </div>
                </div>
              </div>
            )}

            {isPaused && iframeLoaded && !canClaim && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-amber-400/50 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-4 h-4 text-slate-950" />
                <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Inactivity Detected - Timer Paused</span>
              </div>
            )}

            {iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-6 z-10 bg-slate-950">
                <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Loading Failed</h3>
                  <p className="text-slate-400 text-sm">The game provider is currently unavailable or blocking the connection.</p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-[200px]">
                  <button onClick={() => { setIframeError(false); setIframeLoaded(false); }} className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Retry Loading</button>
                  <button onClick={() => window.open(game.url, "_blank")} className="w-full bg-white/5 border border-white/10 text-slate-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    Open in Chrome <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={game.url}
              style={getIframeStyle()}
              onLoad={() => {
                console.log("🎮 Game iframe loaded successfully");
                setIframeLoaded(true);
                
                // Set timer start time only if not already set (e.g. on first load or restore)
                if (!startTime) {
                  const sTime = Date.now();
                  setStartTime(sTime);
                  
                  // Update localStorage with the actual start time
                  const savedSession = localStorage.getItem(`session_${userId}_${gameId}`);
                  if (savedSession) {
                    const parsed = JSON.parse(savedSession);
                    localStorage.setItem(`session_${userId}_${gameId}`, JSON.stringify({
                      ...parsed,
                      startTime: sTime
                    }));
                  }
                }
              }}
              onError={() => {
                console.error("❌ Game iframe load error");
                setIframeError(true);
              }}
              allow="autoplay; fullscreen; pointer-lock"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* BACK WARNING MODAL */}
      <AnimatePresence>
        {showBackWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBackWarning(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 text-amber-500">
                <Gamepad2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">Reward Locked</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  🎮 First play the game to earn rewards. If you leave now, your current progress will be lost.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => setShowBackWarning(false)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Keep Playing</button>
                <button onClick={() => { setShowBackWarning(false); onBack(); }} className="w-full bg-white/5 text-slate-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:text-red-400 transition-colors">Exit Session</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* CHROME MODAL (EXISTING) */}
      <AnimatePresence>
        {showChromeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowChromeModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
              <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20 text-indigo-500">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">Chrome Required</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">Google Chrome is required to play games and track your rewards correctly on Android.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { window.location.href = "https://play.google.com/store/apps/details?id=com.android.chrome"; setShowChromeModal(false); }} className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest">Install Chrome</button>
                <button onClick={() => setShowChromeModal(false)} className="w-full bg-white/5 border border-white/10 text-slate-400 py-4 rounded-2xl font-black text-sm uppercase tracking-widest">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
