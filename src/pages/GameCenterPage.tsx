import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad2, 
  Search, 
  Filter, 
  Wallet, 
  Flame, 
  Clock, 
  Play, 
  Share2, 
  Trophy, 
  Coins, 
  ChevronRight, 
  TrendingUp,
  History,
  Info,
  ExternalLink,
  ChevronLeft,
  SearchX,
  Sparkles,
  ArrowLeft,
  Gamepad,
  Timer,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { API_BASE } from "../config/api";
import { navigate } from "../lib/navigation";

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string;
  category: string;
  provider: string;
  rewardCoins: number;
  requiredTime: number; // in seconds
  playCount: number;
}

interface UserData {
  gameCoins: number;
  gameStreak: number;
  lastGamePlayDate: string;
  availableBalance: number;
}

interface GameCenterPageProps {
  userId: string;
  onBack: () => void;
  initialView?: "intro" | "center";
}

export const GameCenterPage: React.FC<GameCenterPageProps> = ({ userId, onBack, initialView = "intro" }) => {
  const [view, setView] = useState<"intro" | "center">(initialView);
  const [games, setGames] = useState<Game[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeTab, setActiveTab] = useState<"games" | "wallet" | "history">("games");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
    fetchGlobalSettings();
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === "history" && userId) {
      fetchSessions();
    }
  }, [activeTab, userId]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      setSessionsError(null);
      // We fetch from the server-side proxy or direct firestore if allowed.
      // The instructions say "Load sessions from Firestore". 
      // In this app, db is usually imported from ../lib/firebase.
      const { db } = await import("../lib/firebase");
      const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore");
      
      const q = query(
        collection(db, "game_sessions"),
        where("userId", "==", userId),
        orderBy("startTime", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedSessions: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSessions.push({ id: doc.id, ...doc.data() });
      });
      setSessions(fetchedSessions);
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
      setSessionsError("Failed to load game sessions. Please try again.");
    } finally {
      setLoadingSessions(false);
    }
  };

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

  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gamepix/games`);
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
        const cats = ["All", ...Array.from(new Set(data.games.map((g: any) => g.category))) as string[]];
        setCategories(cats);
      }
    } catch (err) {
      console.error("Failed to fetch games:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile/${userId}`);
      const data = await res.json();
      if (data.success) {
        setUserData({
          gameCoins: data.user.gameCoins || 0,
          gameStreak: data.user.gameStreak || 0,
          lastGamePlayDate: data.user.lastGamePlayDate || "",
          availableBalance: data.user.availableBalance || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredGames = games.slice(0, 4);

  const handleConvertCoins = async (amount: number) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/game/convert-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully converted! ₹${data.added.toFixed(2)} added to main wallet.`);
        fetchUserData();
      } else {
        alert(data.error || "Conversion failed");
      }
    } catch (err) {
      console.error("Conversion error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Game Universe...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === "intro" ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="min-h-screen flex flex-col p-6 relative"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
            
            <header className="flex items-center gap-4 mb-12">
              <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">RoyShare Arcade</h1>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Version 2.0</p>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-6 group">
                <Gamepad2 className="w-12 h-12 text-white animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white">Play Games, <span className="text-indigo-500">Earn Coins</span></h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Join millions of players in the most rewarding gaming arena. Complete daily missions and convert your skills into real cash.
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left">
                  <Flame className="w-6 h-6 text-orange-500 mb-2" />
                  <p className="text-xs font-bold text-white mb-1">Daily Streak</p>
                  <p className="text-[10px] text-slate-500">Play every day to earn massive multipliers.</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left">
                  <Coins className="w-6 h-6 text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-white mb-1">Instant Cash</p>
                  <p className="text-[10px] text-slate-500">Convert game coins directly to your wallet.</p>
                </div>
              </div>

              <button 
                onClick={() => setView("center")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Enter the Arena <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-auto pt-12 flex flex-col items-center gap-4 opacity-60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Powered By</span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-white">RoyShare</span>
                  <div className="h-3 w-[1px] bg-white/20" />
                  <span className="text-[11px] font-bold text-indigo-400">GamePix</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-white">RoyShare</span>
                  <div className="h-3 w-[1px] bg-white/20" />
                  <span className="text-[11px] font-bold text-amber-400">GameMonetize</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            {/* Top Navigation */}
            <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView("intro")} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-white">Arcade</h1>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">Live</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveTab("wallet")}
                    className="bg-slate-950 border border-white/5 rounded-2xl px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-500">{userData?.gameCoins?.toLocaleString() || 0}</span>
                  </button>
                  <div className="bg-slate-950 border border-white/5 rounded-2xl px-3 py-1.5 flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${userData?.gameStreak ? "text-orange-500" : "text-slate-600"}`} />
                    <span className="text-sm font-bold text-white">{userData?.gameStreak || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-6 w-full">
              {activeTab === "games" && (
                <div className="space-y-8 pb-24">
                  {/* Search & Category */}
                  <div className="flex flex-col gap-4">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === cat 
                              ? "bg-indigo-600 text-white shadow-lg" 
                              : "bg-slate-900 text-slate-400 border border-white/5 hover:border-white/10"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!searchQuery && selectedCategory === "All" && (
                    <>
                      {/* Featured */}
                      <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Recommended</h2>
                          </div>
                          <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">See More</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {featuredGames.map(game => (
                            <GameCard key={game.id} game={game} settings={globalSettings} />
                          ))}
                        </div>
                      </section>

                      {/* Referral System Promo */}
                      <section className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full -mr-24 -mt-24 group-hover:bg-indigo-500/20 transition-colors" />
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="space-y-4 max-w-md">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                                <Share2 className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Referral Arena</h3>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              Invite your friends to the RoyShare Game & Earn universe. Get <span className="text-white font-bold">100 coins</span> instantly when they play their first game.
                            </p>
                          </div>
                          <button className="px-8 py-3.5 bg-white text-slate-950 rounded-2xl text-xs font-black hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-black/20 active:scale-95 whitespace-nowrap">
                            INVITE SQUAD
                          </button>
                        </div>
                      </section>

                      {/* Streak Card */}
                      <section className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center text-center md:text-left gap-8 relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex-shrink-0 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-2xl">
                          <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white tracking-tight">Daily Missions</h3>
                            <p className="text-slate-500 text-sm">Keep playing daily to maintain your <span className="text-orange-500 font-bold">{userData?.gameStreak || 0} day</span> streak!</p>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                              <div key={d} className={`w-3 h-8 rounded-full transition-all duration-500 ${d <= (userData?.gameStreak || 0) % 7 ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-lg shadow-orange-500/20 h-10" : "bg-slate-800"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-2">
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Current Multiplier</p>
                           <p className="text-3xl font-black text-white">1.2x</p>
                        </div>
                      </section>
                    </>
                  )}

                  {/* All Games Grid */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Gamepad className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-lg font-black text-white">{searchQuery ? "Search Results" : "Game Library"}</h2>
                    </div>
                    {filteredGames.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredGames.map(game => (
                          <GameCard key={game.id} game={game} settings={globalSettings} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                        <SearchX className="w-12 h-12 text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-1">Mission Not Found</h3>
                        <p className="text-slate-500 text-sm">Try searching with a different term.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === "wallet" && (
                <div className="max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
                    <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-900/20 rotate-3">
                      <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available Game Coins</p>
                      <h2 className="text-5xl font-black text-white flex items-center justify-center gap-3">
                        <Coins className="w-10 h-10 text-amber-500" />
                        {userData?.gameCoins?.toLocaleString() || 0}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-600 uppercase">Est. Value</p>
                        <p className="text-lg font-black text-emerald-500">
                          ₹{(Number(userData?.gameCoins || 0) * (Number(globalSettings?.conversionInr || 0) / Number(globalSettings?.conversionCoins || 1000) || 0.001)).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-600 uppercase">Rate</p>
                        <p className="text-lg font-black text-white">
                          {Number(globalSettings?.conversionCoins || 1000)} = ₹{Number(globalSettings?.conversionInr || 1)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConvertCoins(userData?.gameCoins || 0)}
                      disabled={!userData?.gameCoins || userData.gameCoins < 100}
                      className="w-full bg-white hover:bg-indigo-400 hover:text-white text-slate-950 py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {userData?.gameCoins && userData.gameCoins >= 100 ? "Convert Coins Now" : "Min 100 Coins Required"}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Info className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Converted balance adds to Main Wallet</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="max-w-2xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">Roy Pass</h2>
                    </div>
                    <button 
                      onClick={fetchSessions}
                      className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-indigo-400"
                    >
                      <RefreshCw className={`w-5 h-5 ${loadingSessions ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {loadingSessions ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Scanning History...</p>
                    </div>
                  ) : sessionsError ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Error Loading Pass</h3>
                      <p className="text-slate-400 text-sm mb-6">{sessionsError}</p>
                      <button 
                        onClick={fetchSessions}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="bg-slate-900/30 border border-white/5 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 shadow-inner">
                        <Gamepad className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-white tracking-tight">🎮 No Active Game Session</h3>
                        <p className="text-slate-500 text-sm max-w-[200px] mx-auto font-medium">
                          Start playing a game to track your progress.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab("games")}
                        className="bg-white text-slate-950 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20"
                      >
                        Browse Games
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((s) => {
                        const gameInfo = games.find(g => g.id === s.gameId);
                        const isCompleted = s.status === 'completed' || s.valid === true;
                        return (
                          <div 
                            key={s.id} 
                            className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                <img 
                                  src={gameInfo?.thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&h=200&auto=format&fit=crop"} 
                                  alt={gameInfo?.title || "Game"} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h4 className="font-bold text-white truncate text-sm">
                                    {gameInfo?.title || "Unknown Game"}
                                  </h4>
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                    isCompleted 
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  }`}>
                                    {s.status || (s.valid ? "Valid" : "Pending")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {s.startTime ? new Date(s.startTime).toLocaleDateString() : "N/A"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {s.duration ? `${Math.floor(s.duration / 60)}m ${s.duration % 60}s` : "0s"}
                                  </div>
                                  {s.coinsEarned > 0 && (
                                    <div className="flex items-center gap-1 text-amber-500">
                                      <Coins className="w-3 h-3" />
                                      {s.coinsEarned}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Menu */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 flex gap-1 z-[60] shadow-2xl">
              <button onClick={() => setActiveTab("games")} className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${activeTab === "games" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white"}`}>
                <Gamepad2 className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Arena</span>
              </button>
              <button onClick={() => setActiveTab("wallet")} className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${activeTab === "wallet" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white"}`}>
                <Wallet className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Wallet</span>
              </button>
              <button onClick={() => setActiveTab("history")} className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${activeTab === "history" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white"}`}>
                <History className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pass</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GameCard: React.FC<{ game: Game, settings?: any }> = ({ game, settings }) => {
  const rewardCoins = settings?.rewardCoins || game.rewardCoins || 10;
  const requiredTime = settings?.requiredPlayTime || game.requiredTime || 60;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col group h-full cursor-pointer relative"
      onClick={() => navigate(`/game/${game.id}`)}
    >
      <div className="absolute top-3 left-3 z-20 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
        <span className="text-[8px] font-black text-white/80 uppercase tracking-widest">{game.provider}</span>
      </div>
      
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={game.bannerUrl || game.thumbnailUrl} 
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
            <Coins className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400">+{rewardCoins}</span>
          </div>
          <div className="bg-indigo-500/20 backdrop-blur-md border border-indigo-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
            <Timer className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400">{Math.ceil(requiredTime / 60)}m</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{game.category}</p>
        <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{game.title}</h3>
        <div className="mt-4 flex items-center justify-between">
          <button className="flex-1 bg-white hover:bg-indigo-400 hover:text-white text-slate-950 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2">
            <Play className="w-3 h-3 fill-current" /> Play & Earn
          </button>
        </div>
      </div>
    </motion.div>
  );
};
