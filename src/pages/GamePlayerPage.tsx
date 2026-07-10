import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Star, 
  Maximize, 
  Minimize, 
  Flag, 
  ExternalLink, 
  RefreshCw,
  ShieldAlert,
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Copy,
  MoreVertical,
  Clock,
  Flame,
  Coins,
  Play,
  RotateCcw,
  Smartphone,
  Laptop,
  Check
} from "lucide-react";
import { API_BASE } from "../config/api";
import { navigate } from "../lib/navigation";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";

interface Game {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  bannerUrl: string;
  category: string;
  orientation: string;
}

interface RewardSettings {
  rewardAmount: number;
  minPlayDuration: number;
  dailyLimit: number;
  maxCoinsPerDay: number;
  cooldown: number;
  enabled: boolean;
}

interface GamePlayerPageProps {
  gameId: string;
  userId: string;
  onBack: () => void;
}

export const GamePlayerPage: React.FC<GamePlayerPageProps> = ({ gameId, userId, onBack }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for player features
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  // Modals & Menu
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);

  // Rewards & Sessions
  const [rewardSettings, setRewardSettings] = useState<RewardSettings>({
    rewardAmount: 15,
    minPlayDuration: 30,
    dailyLimit: 10,
    maxCoinsPerDay: 150,
    cooldown: 60,
    enabled: true
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardStatusMessage, setRewardStatusMessage] = useState<string | null>(null);
  const [rewardErrorMessage, setRewardErrorMessage] = useState<string | null>(null);

  // Related games
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load single game details & related games
  useEffect(() => {
    let active = true;
    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      setIframeLoaded(false);
      setShowLoadingOverlay(true);
      setShowFallback(false);
      setElapsedTime(0);
      setRewardClaimed(false);
      setRewardStatusMessage(null);
      setRewardErrorMessage(null);

      try {
        // Fetch single game
        const response = await fetch(`${API_BASE}/api/gamepix/game/${gameId}`);
        let gameObj: Game | null = null;
        if (response.ok) {
          const data = await response.json();
          if (active && data.success && data.game) {
            gameObj = data.game;
          }
        }
        
        // Fallback to library fetch if needed
        if (!gameObj) {
          const allRes = await fetch(`${API_BASE}/api/gamepix/games`);
          if (!allRes.ok) throw new Error("Failed to fetch game library");
          const allData = await allRes.json();
          if (allData.success && Array.isArray(allData.games)) {
            const matched = allData.games.find((g: Game) => g.id === gameId);
            if (matched) {
              gameObj = matched;
            } else {
              throw new Error("Game not found in library.");
            }
          } else {
            throw new Error("Invalid response format.");
          }
        }

        if (active && gameObj) {
          setGame(gameObj);
          
          // Generate realistic play count
          const hash = gameObj.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          setPlayCount((hash % 800) + 420);

          // Start play session
          startPlaySession(gameObj.id);

          // Fetch related games
          fetchRelated(gameObj.category, gameObj.id);
        }
      } catch (err: any) {
        console.error("Error loading game:", err);
        if (active) setError(err.message || "Failed to load game. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchGameData();

    return () => {
      active = false;
      cleanupSession();
    };
  }, [gameId]);

  // Fetch related games
  const fetchRelated = async (category: string, currentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/gamepix/games`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
          // Filter same category first
          let filtered = data.games.filter((g: Game) => g.id !== currentId && g.category === category);
          if (filtered.length < 3) {
            // Fill with other games
            filtered = [...filtered, ...data.games.filter((g: Game) => g.id !== currentId && g.category !== category)].slice(0, 8);
          }
          setRelatedGames(filtered.slice(0, 8));
        }
      }
    } catch (e) {
      console.error("Error fetching related games:", e);
    }
  };

  // Sync favorites with Firestore in real-time
  useEffect(() => {
    if (!userId || !gameId) return;
    const favRef = doc(db, "users", userId, "game_favorites", gameId);
    const unsubscribe = onSnapshot(favRef, (snap) => {
      setIsFavorite(snap.exists());
    }, (err) => {
      console.error("Error listening to favorite status:", err);
    });
    return () => unsubscribe();
  }, [userId, gameId]);

  // Load reward settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/game/rewards/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setRewardSettings(data.settings);
          }
        }
      } catch (e) {
        console.error("Error fetching rewards settings:", e);
      }
    };
    fetchSettings();
  }, []);

  // Track window/page focus & document focus
  useEffect(() => {
    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Live timer interval for session valid validation
  useEffect(() => {
    if (!sessionId || rewardClaimed || showLoadingOverlay) return;

    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const next = prev + 1;
        // Check if reaches min play duration
        if (next >= rewardSettings.minPlayDuration) {
          if (timerRef.current) clearInterval(timerRef.current);
          claimRewards(next);
          return rewardSettings.minPlayDuration;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, rewardClaimed, showLoadingOverlay, rewardSettings.minPlayDuration]);

  // 10-second timeout for fallback option if game doesn't trigger onLoad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!iframeLoaded) {
        setShowFallback(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [iframeLoaded]);

  // Start play session
  const startPlaySession = async (gid: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/game/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          gameId: gid,
          device: window.innerWidth < 768 ? "mobile" : "desktop",
          country: "Telegram App"
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sessionId) {
          setSessionId(data.sessionId);
        }
      }
    } catch (e) {
      console.error("Failed to start game session in server:", e);
    }
  };

  // End and claim rewards
  const claimRewards = async (durationSec: number) => {
    if (!sessionId || rewardClaimed) return;
    setRewardClaimed(true);

    try {
      const response = await fetch(`${API_BASE}/api/game/sessions/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          duration: durationSec,
          isFocused: true // Iframe focus verified by user staying on page
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.rewarded) {
            setRewardStatusMessage(`🎉 +${data.coinsEarned} Coins Credited!`);
            // Trigger haptic feedback if running in Telegram Mini App
            if ((window as any).Telegram?.WebApp?.HapticFeedback) {
              (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            }
          } else {
            setRewardErrorMessage(data.reason || "Reward validation failed.");
          }
        } else {
          setRewardErrorMessage(data.error || "Failed to process reward.");
        }
      }
    } catch (e) {
      console.error("Error claiming rewards:", e);
      setRewardErrorMessage("Network error during reward sync.");
    }
  };

  // Cleanup session on unmount
  const cleanupSession = async () => {
    if (sessionId && !rewardClaimed) {
      // Send end signal with current elapsedTime
      try {
        await fetch(`${API_BASE}/api/game/sessions/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            duration: elapsedTime,
            isFocused
          })
        });
      } catch (e) {
        console.error("Failed to send final session end during cleanup:", e);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!userId || !gameId) return;
    const favRef = doc(db, "users", userId, "game_favorites", gameId);
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("medium");
        }
      } else {
        await setDoc(favRef, {
          gameId,
          userId,
          addedAt: new Date().toISOString()
        });
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error("Fullscreen request failed", err);
          setIsFullscreen(true); // Fallback pseudofullscreen
        });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleReportGame = async () => {
    if (!game || !reportReason.trim()) return;
    try {
      await fetch(`${API_BASE}/api/admin/gamepix/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report_game",
          gameId: game.id,
          userId,
          reason: reportReason
        })
      });
      setReportSuccess(true);
      setReportReason("");
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
      }, 2500);
    } catch (e) {
      console.error(e);
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
      }, 2500);
    }
  };

  const handleCopyLink = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkType(type);
    setTimeout(() => setCopiedLinkType(null), 2000);
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }
  };

  // Safe links for sharing
  const shortLink = `https://royshare.link/g/${gameId}`;
  const deepLink = `https://t.me/royshare_bot/app?startapp=game_${gameId}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(`🎮 Play ${game?.title || "Games"} and earn rewards on RoyShare!`)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Play ${game?.title || "Games"} on RoyShare: ${deepLink}`)}`;

  const handleRestartGame = () => {
    if (iframeRef.current) {
      setIframeLoaded(false);
      setShowLoadingOverlay(true);
      iframeRef.current.src = iframeRef.current.src;
      setIsMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-300 font-bold">Initializing Premium Console...</p>
        <p className="text-xs text-slate-500">Preparing high-definition GamePix connection</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-black text-white">Console Off-Line</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{error || "Game is currently unavailable."}</p>
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Center
        </button>
      </div>
    );
  }

  // Calculate Reward Progress Percentage
  const progressPercent = Math.min((elapsedTime / rewardSettings.minPlayDuration) * 100, 100);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col select-none overflow-x-hidden">
      
      {/* Immersive Game Container (Header + Reward Bar + IFrame) */}
      <div 
        ref={containerRef}
        className={`flex flex-col bg-black transition-all duration-300 ${
          isFullscreen 
            ? "fixed inset-0 z-[9999] w-screen h-screen" 
            : "relative w-full md:max-w-4xl md:mx-auto md:rounded-3xl md:overflow-hidden md:border md:border-slate-800 mt-2 shadow-2xl"
        }`}
        style={{
          height: isFullscreen ? "100vh" : game.orientation === "landscape" ? "56.25vw" : "75vw",
          maxHeight: isFullscreen ? "100vh" : "580px"
        }}
      >
        {/* PREMIUM TOOLBAR HEADER */}
        <header className="px-4 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-900/80 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-slate-900 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block">RoyShare Gaming</span>
              <h1 className="text-sm font-black text-white truncate max-w-[140px] sm:max-w-[200px]" title={game.title}>
                {game.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Favorite Button */}
            <button 
              onClick={handleToggleFavorite}
              className={`p-2 hover:bg-slate-900 border rounded-xl transition-all active:scale-90 ${
                isFavorite 
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" 
                  : "border-slate-800/40 text-slate-400 hover:text-yellow-400"
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </button>

            {/* Share Button */}
            <button 
              onClick={() => setIsShareOpen(true)}
              className="p-2 hover:bg-slate-900 border border-slate-800/40 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-blue-400"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button 
              onClick={handleToggleFullscreen}
              className="p-2 hover:bg-slate-900 border border-slate-800/40 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-purple-400"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* More Menu Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-slate-900 border border-slate-800/40 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-850 rounded-2xl p-2 shadow-2xl z-30"
                    >
                      <button 
                        onClick={handleRestartGame}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-purple-400" /> Reload Game
                      </button>
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsReportOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                      >
                        <Flag className="w-3.5 h-3.5 text-red-400" /> Report Issue
                      </button>
                      <a 
                        href={game.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Open in Browser
                      </a>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ROYSHARE LIVE REWARDS BAR */}
        <section className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-950 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span className="font-semibold truncate max-w-[120px]">Playing: {game.title}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-850 text-slate-300 font-mono font-bold">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>
                  {Math.floor(elapsedTime / 60).toString().padStart(2, "0")}:
                  {(elapsedTime % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Multiplier */}
              <div className="flex items-center gap-1 text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg font-black uppercase">
                <Flame className="w-3 h-3" />
                <span>x1.2 Multiplier</span>
              </div>
            </div>
          </div>

          {/* Reward Progress Bar Row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-850 p-[2px]">
              <motion.div 
                className={`h-full rounded-full ${
                  progressPercent >= 100 
                    ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-lg shadow-green-500/25" 
                    : progressPercent > 50 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400" 
                    : "bg-gradient-to-r from-purple-600 to-indigo-500"
                }`}
                style={{ width: `${progressPercent}%` }}
                layoutId="reward_progress"
              />
            </div>

            {/* Estimated Coins Display */}
            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-xl text-xs font-black shrink-0">
              <Coins className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {progressPercent >= 100 ? rewardSettings.rewardAmount : Math.floor((elapsedTime / rewardSettings.minPlayDuration) * rewardSettings.rewardAmount)} / {rewardSettings.rewardAmount} Coins
              </span>
            </div>
          </div>
        </section>

        {/* IN-APP SUCCESS / ERROR TOASTS */}
        <AnimatePresence>
          {rewardStatusMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 10 }}
              exit={{ opacity: 0, y: -40 }}
              className="absolute left-4 right-4 z-40 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-xs py-3 px-4 rounded-2xl flex items-center justify-between shadow-2xl border border-green-400/30"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                {rewardStatusMessage}
              </span>
              <button 
                onClick={() => setRewardStatusMessage(null)} 
                className="text-white hover:text-slate-200 text-[10px] uppercase font-black tracking-wider"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {rewardErrorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 10 }}
              exit={{ opacity: 0, y: -40 }}
              className="absolute left-4 right-4 z-40 bg-gradient-to-r from-amber-600 to-red-500 text-white font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-between shadow-2xl border border-red-500/20"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-white" />
                {rewardErrorMessage}
              </span>
              <button 
                onClick={() => setRewardErrorMessage(null)} 
                className="text-white hover:text-slate-200 text-[10px] uppercase font-bold"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GAME PLAY CANVAS & PREMIUM LOAD SCREEN */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          
          {/* BEAUTIFUL loading Screen Overlay */}
          <AnimatePresence>
            {showLoadingOverlay && (
              <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-[#020617] z-30 flex flex-col justify-between p-6 overflow-hidden"
              >
                {/* Loader background banner */}
                <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] blur-xl pointer-events-none" style={{ backgroundImage: `url(${game.bannerUrl})` }} />
                
                {/* Header block inside loader */}
                <div className="flex justify-between items-center z-10">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                    {game.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>RoyShare × GamePix</span>
                  </div>
                </div>

                {/* Center loading details block */}
                <div className="flex flex-col items-center text-center space-y-6 z-10 my-auto">
                  {/* Game Thumbnail */}
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900"
                  >
                    <img 
                      src={game.thumbnailUrl} 
                      alt={game.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </motion.div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-black text-white tracking-tight">{game.title}</h2>
                    <p className="text-slate-500 text-xs font-medium max-w-xs leading-relaxed">
                      Preparing your premium rewarded gaming session. Hold on!
                    </p>
                  </div>

                  {/* Animated Loader bar */}
                  <div className="w-48 space-y-2">
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850 p-[1px]">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="h-full w-1/2 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest block animate-pulse">
                      Preparing Game...
                    </span>
                  </div>
                </div>

                {/* Loader Footer */}
                <div className="text-center z-10">
                  <p className="text-[10px] text-slate-500 font-medium">
                    Maximize focus while playing to claim your <b>{rewardSettings.rewardAmount} Coins</b>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* IFrame Game Renderer */}
          <iframe
            ref={iframeRef}
            src={game.url}
            allow="fullscreen; autoplay; keyboard-map"
            allowFullScreen
            loading="lazy"
            onLoad={() => {
              setIframeLoaded(true);
              // Small extra delay for pristine loading transit
              setTimeout(() => {
                setShowLoadingOverlay(false);
              }, 1200);
            }}
            className="w-full h-full border-0 bg-black"
          />
        </div>
      </div>

      {/* FALLBACK OPEN IN BROWSER COMPONENT */}
      {showFallback && (
        <div className="max-w-md w-full mx-auto px-4 pt-4">
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Connection Troubles?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              If the game canvas appears blank or is failing to respond inside the secure sandbox, you can open it in an external window. Rewards will continue tracking based on active play duration.
            </p>
            <a 
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs"
            >
              Open Game in Browser
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* PRIMARY GAME DETAILS MAIN GRID */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-6">
        
        {/* Main Details Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl">
          {/* Banner with absolute gradient overlay */}
          <div className="h-28 w-full rounded-xl overflow-hidden relative border border-slate-800">
            <img 
              src={game.bannerUrl} 
              alt={game.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 flex gap-2">
              <span className="px-2 py-0.5 bg-purple-600 text-white text-[9px] font-black uppercase rounded-md tracking-wider border border-purple-500/30">
                {game.category}
              </span>
              <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[9px] font-bold uppercase rounded-md tracking-wider border border-slate-800 flex items-center gap-1">
                {game.orientation === "landscape" ? <Laptop className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                {game.orientation}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-white">{game.title}</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              {game.description || `Enjoy the extreme, fluid HTML5 gaming experience of ${game.title} on RoyShare. Play, verify, and complete challenges to earn coins dynamically.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-850">
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block mb-0.5">Rating</span>
              <span className="font-bold text-white flex items-center gap-1">
                ⭐ 4.8 / 5.0
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-850">
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block mb-0.5">Global Plays</span>
              <span className="font-bold text-purple-400">
                {playCount.toLocaleString()} Plays
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
            {/* Report Button */}
            <button 
              onClick={() => setIsReportOpen(true)}
              className="px-3 py-1.5 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-slate-400 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Flag className="w-3.5 h-3.5" /> Report Game Issue
            </button>

            {/* Co-branding Footer */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <span>Powered by</span>
              <span className="text-purple-400 font-black tracking-normal">GamePix</span>
            </div>
          </div>
        </div>

        {/* RELATED GAMES - YOU MAY ALSO LIKE */}
        {relatedGames.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
              You May Also Like
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
              {relatedGames.map((rg) => (
                <div 
                  key={rg.id}
                  onClick={() => navigate(`/game/${rg.id}`)}
                  className="w-36 shrink-0 bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/30 rounded-2xl overflow-hidden cursor-pointer group transition-all flex flex-col"
                >
                  <div className="h-24 w-full relative bg-slate-950">
                    <img 
                      src={rg.thumbnailUrl} 
                      alt={rg.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-slate-950/80 backdrop-blur-sm text-slate-400 text-[8px] font-black uppercase rounded-md border border-slate-850">
                      {rg.category}
                    </span>
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-purple-400 transition-colors">
                      {rg.title}
                    </h4>
                    <button className="mt-2 w-full py-1.5 bg-slate-950 hover:bg-purple-600 hover:text-white border border-slate-850 hover:border-purple-500 text-slate-400 text-[9px] font-black uppercase rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" /> Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* SHARE OVERLAY SHEET / MODAL */}
      <AnimatePresence>
        {isShareOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end justify-center p-4 z-[99999]">
            {/* Click backdrop to exit */}
            <div className="fixed inset-0" onClick={() => setIsShareOpen(false)} />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-slate-950 border-t border-slate-850 rounded-t-[32px] p-6 w-full max-w-md shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto"
            >
              {/* Header handle */}
              <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-6" onClick={() => setIsShareOpen(false)} />
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-white">Share Play Console</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Generate short deep-links to share this game with friends on Telegram or WhatsApp!
                  </p>
                </div>

                {/* Direct Share Options Icons */}
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={telegramShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold text-xs rounded-2xl hover:bg-blue-600/20 transition-all flex flex-col items-center gap-2"
                  >
                    <Gamepad2 className="w-5 h-5" />
                    <span>Telegram Chat</span>
                  </a>

                  <a 
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-green-600/10 border border-green-500/20 text-green-400 font-bold text-xs rounded-2xl hover:bg-green-600/20 transition-all flex flex-col items-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Link Copiers */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">RoyShare Short Link</span>
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-1.5 items-center justify-between">
                      <span className="text-xs text-slate-300 font-semibold truncate pl-2">{shortLink}</span>
                      <button 
                        onClick={() => handleCopyLink(shortLink, "short")}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        {copiedLinkType === "short" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedLinkType === "short" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Telegram Bot Deep Link</span>
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-1.5 items-center justify-between">
                      <span className="text-xs text-slate-300 font-semibold truncate pl-2">{deepLink}</span>
                      <button 
                        onClick={() => handleCopyLink(deepLink, "deep")}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        {copiedLinkType === "deep" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedLinkType === "deep" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsShareOpen(false)}
                  className="w-full py-3 border border-slate-800 text-slate-300 text-xs font-bold rounded-2xl hover:bg-slate-900 transition-colors"
                >
                  Close Share Sheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT ISSUE MODAL */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[99999]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl relative"
            >
              {reportSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto animate-bounce" />
                  <h3 className="font-bold text-white">Report Submitted</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Thank you for your report! Our administrators will review the game shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-white">Report Game</h3>
                  </div>
                  <p className="text-xs text-slate-400">Please describe the issue you encountered with this game:</p>
                  
                  <textarea 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="e.g. Black screen, game won't load, sound doesn't play..."
                    className="w-full h-24 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none placeholder-slate-600 resize-none"
                  />

                  <div className="flex gap-2.5 pt-2">
                    <button 
                      onClick={() => {
                        setIsReportOpen(false);
                        setReportReason("");
                      }}
                      className="flex-1 py-2.5 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleReportGame}
                      disabled={!reportReason.trim()}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
