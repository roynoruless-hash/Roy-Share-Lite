import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Search, 
  Play, 
  Gamepad2, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw,
  Compass,
  Star,
  Clock,
  Laptop,
  Smartphone,
  Trophy,
  Filter
} from "lucide-react";
import { API_BASE } from "../config/api";

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

interface GameCenterPageProps {
  userId: string;
  onBack: () => void;
  initialView?: "intro" | "center";
}

export const GameCenterPage: React.FC<GameCenterPageProps> = ({ userId, onBack, initialView = "intro" }) => {
  const [view, setView] = useState<"intro" | "center">(initialView);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Future Ready states (for architecture extension)
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`games_recent_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`games_fav_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const categories = [
    "All",
    "Action",
    "Arcade",
    "Puzzle",
    "Sports",
    "Adventure",
    "Racing",
    "Strategy",
    "Girls",
    "Boys",
    "Casual",
    "Multiplayer"
  ];

  useEffect(() => {
    // Check if user has already seen the intro. If so, let them go straight to the center if they prefer.
    const introSeen = localStorage.getItem(`game_intro_seen_${userId}`);
    if (introSeen === "true" && initialView === "intro") {
      setView("center");
    }
  }, [userId, initialView]);

  useEffect(() => {
    if (view === "center") {
      fetchGames();
    }
  }, [view]);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/gamepix/games`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.games)) {
        setGames(data.games);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching games:", err);
      setError("Failed to load games. Showing offline library.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGameCenter = () => {
    localStorage.setItem(`game_intro_seen_${userId}`, "true");
    setView("center");
  };

  const handlePlayGame = (game: Game) => {
    // Record into recently played for Future Ready requirement
    const updatedRecent = [game.id, ...recentlyPlayed.filter(id => id !== game.id)].slice(0, 10);
    setRecentlyPlayed(updatedRecent);
    localStorage.setItem(`games_recent_${userId}`, JSON.stringify(updatedRecent));

    // Open play URL
    if (game.url) {
      window.open(game.url, "_blank");
    }
  };

  const toggleFavorite = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(gameId) 
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    setFavorites(updated);
    localStorage.setItem(`games_fav_${userId}`, JSON.stringify(updated));
  };

  // Filters logic
  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || 
                            game.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans">
      <AnimatePresence mode="wait">
        {view === "intro" ? (
          /* ==========================================
             PART 2 - INTRODUCTION PAGE
             ========================================== */
          <motion.div
            key="intro-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex flex-col justify-between p-6 relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Brand */}
            <div>
              <header className="flex items-center gap-4 mb-8 pt-4">
                <button 
                  onClick={onBack} 
                  className="p-2 hover:bg-slate-900 border border-slate-800/80 rounded-xl transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-6 h-6 text-slate-400" />
                </button>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-7 h-7 text-purple-400" />
                  <h1 className="text-xl font-black tracking-tight bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                    Game & Earn
                  </h1>
                </div>
              </header>

              {/* Main Intro content */}
              <div className="space-y-6 max-w-md mx-auto">
                <div className="text-center space-y-2 mb-8">
                  <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mx-auto mb-4 shadow-xl shadow-purple-500/5">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    🎮 Game & Earn
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Play premium HTML5 games and enjoy the RoyShare gaming experience.
                  </p>
                </div>

                {/* Co-Branding */}
                <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex items-center justify-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">🤝 Powered by</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white tracking-wider">RoyShare</span>
                    <span className="text-xs text-slate-500">×</span>
                    <span className="text-sm font-black text-purple-400 tracking-wider">GamePix</span>
                  </div>
                </div>

                {/* How It Works */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                    How It Works
                  </h3>
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 space-y-4">
                    {[
                      { step: "1", title: "Browse Games", desc: "Browse hundreds of premium games." },
                      { step: "2", title: "Tap Play", desc: "Choose your favorite title and tap Play." },
                      { step: "3", title: "Enjoy Gameplay", desc: "Enjoy the game on any device instantly." },
                      { step: "4", title: "Earn Rewards", desc: "Rewards will be available in future updates after gameplay verification." }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-200">{item.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Notice */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                    Important Notice
                  </h3>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 space-y-3 text-xs text-slate-400">
                    <div className="flex items-start gap-2 text-red-400/90 font-bold mb-1">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Fair Play Policy</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                      <li>Play fairly.</li>
                      <li>Do not use bots.</li>
                      <li>Do not use automation.</li>
                      <li>Do not refresh repeatedly.</li>
                      <li>Rewards are verified.</li>
                      <li>Abuse may result in account restriction.</li>
                    </ul>
                    <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/40">
                      * This page is only informational.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action button */}
            <div className="pt-8 max-w-md w-full mx-auto">
              <button
                onClick={handleOpenGameCenter}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20"
              >
                🚀 Open Game Center
              </button>
            </div>
          </motion.div>
        ) : (
          /* ==========================================
             PART 3 - GAME CENTER PAGE
             ========================================== */
          <motion.div
            key="game-center"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen pb-12 relative"
          >
            {/* Header Navbar */}
            <header className="p-4 border-b border-slate-850 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView("intro")} 
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                  <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    🎮 Game Center
                  </h1>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Powered by GamePix
                  </p>
                </div>
              </div>

              {/* Co-Branding Partner */}
              <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-bold text-purple-400">
                RoyShare × GamePix
              </div>
            </header>

            <main className="p-4 space-y-6">
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games by title instantly..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-500 text-slate-200"
                />
              </div>

              {/* Categories horizontally scrollable */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Filter by Category
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                        activeCategory === cat 
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-900/35" 
                          : "bg-slate-900/50 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-750"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loader */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Loading awesome games...</p>
                </div>
              )}

              {/* Error fallback message */}
              {error && !loading && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center text-center max-w-md mx-auto">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
                  <h4 className="font-bold text-sm">Offline Mode</h4>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                  <button 
                    onClick={fetchGames}
                    className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Connection
                  </button>
                </div>
              )}

              {/* Future Ready Extensions layout placeholders (Recently Played / Favorites / Stats) */}
              {!loading && !error && games.length > 0 && (
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  <div className="p-3 bg-gradient-to-br from-purple-950/20 to-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div>
                      <Trophy className="w-5 h-5 text-amber-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Play Missions</span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-2">Coming Soon</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div>
                      <Star className="w-5 h-5 text-indigo-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saved Favorites</span>
                    </div>
                    <p className="text-xs text-slate-200 font-bold mt-2">
                      {favorites.length} {favorites.length === 1 ? 'Game' : 'Games'}
                    </p>
                  </div>
                </div>
              )}

              {/* Games Cards Grid */}
              {!loading && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      {activeCategory} Games ({filteredGames.length})
                    </h3>
                  </div>

                  {filteredGames.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No games found matching your filters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredGames.map((game) => {
                        const isFav = favorites.includes(game.id);
                        return (
                          <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/30 rounded-2xl overflow-hidden flex flex-col group transition-all"
                          >
                            {/* Banner Image Container */}
                            <div className="h-44 relative overflow-hidden bg-slate-950">
                              <img
                                src={game.bannerUrl}
                                alt={game.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                              
                              {/* Favorite / Love button */}
                              <button
                                onClick={(e) => toggleFavorite(game.id, e)}
                                className="absolute top-3 right-3 p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/40 rounded-xl transition-all active:scale-90"
                              >
                                <Star className={`w-4 h-4 ${isFav ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
                              </button>

                              {/* Category Badge */}
                              <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase rounded-lg">
                                {game.category}
                              </span>

                              {/* Orientation Badge */}
                              <span className="absolute bottom-3 right-3 px-2 py-1 bg-slate-900/60 backdrop-blur-md border border-slate-800/50 text-slate-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                                {game.orientation === "portrait" ? (
                                  <>
                                    <Smartphone className="w-3 h-3" /> Portrait
                                  </>
                                ) : (
                                  <>
                                    <Laptop className="w-3 h-3" /> Landscape
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Card Details Panel */}
                            <div className="p-4 flex gap-4 items-center">
                              {/* Game Icon */}
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                                <img
                                  src={game.thumbnailUrl}
                                  alt={`${game.title} icon`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Title & Category Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-white truncate group-hover:text-purple-400 transition-colors">
                                  {game.title}
                                </h4>
                                <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                                  {game.description || `Enjoy high-quality ${game.category} gaming.`}
                                </p>
                              </div>

                              {/* Play Button */}
                              <button
                                onClick={() => handlePlayGame(game)}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-purple-900/10"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Play
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
