import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Eye, Loader2, Users, TrendingUp, HelpCircle, RefreshCw, Search, Filter, History } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, query } from "firebase/firestore";

export default function RPSAdminManager() {
  const [settings, setSettings] = useState<any>({
    enabled: true,
    aiEnabled: true,
    humanWaitTime: 15,
    entryFee: 5,
    prizePool: 20,
    platformSponsoredAmount: 10,
    drawMode: "refund", // refund | rematch | carry
    aiRockProb: 34,
    aiPaperProb: 33,
    aiScissorsProb: 33
  });

  const [stats, setStats] = useState<any>({
    totalMatches: 0,
    wins: 0,
    draws: 0,
    revenue: 0,
    sponsoredRewards: 0,
    adsCompleted: 0
  });

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"settings" | "stats" | "history">("settings");
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsSnap = await getDoc(doc(db, "settings", "rps"));
      if (settingsSnap.exists()) {
        setSettings({ ...settings, ...settingsSnap.data() });
      }

      const statsSnap = await getDoc(doc(db, "stats", "rps"));
      if (statsSnap.exists()) {
        setStats({ ...stats, ...statsSnap.data() });
      }

      await loadGames();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadGames = async () => {
    setGamesLoading(true);
    try {
      const q = query(collection(db, "rps_history"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      list.sort((a, b) => {
        const tA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const tB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return tB - tA;
      });
      setGames(list);
    } catch (e) {
      console.error("Error loading games:", e);
    }
    setGamesLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    // Validate probabilities sum to 100
    const totalProb = Number(settings.aiRockProb) + Number(settings.aiPaperProb) + Number(settings.aiScissorsProb);
    if (totalProb < 99 || totalProb > 101) {
      setMsg("Error: AI choice probabilities must sum up to approximately 100%. Current sum: " + totalProb + "%");
      setSaving(false);
      return;
    }

    try {
      await setDoc(doc(db, "settings", "rps"), settings);
      setMsg("Settings saved successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setMsg("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  // Derived Summary Statistics for History Tab
  const totalGames = games.length;
  const totalWins = games.filter(g => g.result === "Win").length;
  const totalLosses = games.filter(g => g.result === "Loss").length;
  const totalDraws = games.filter(g => g.result === "Draw").length;
  const totalRewardsPaid = games.reduce((sum, g) => sum + (g.reward || 0), 0);

  // Search and Filtering
  const filteredGames = games.filter(g => {
    const matchesSearch = 
      String(g.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(g.userId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(g.telegramId || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesResult = resultFilter === "all" || String(g.result).toLowerCase() === resultFilter.toLowerCase();
    
    return matchesSearch && matchesResult;
  });

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden text-white font-sans">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" /> RPS Battle Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure matchmaking, AI weights, draw resolution, and live analytics.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "settings" && (
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          )}
          {(activeTab === "stats" || activeTab === "history") && (
            <button 
              onClick={loadData} 
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition"
              title="Reload data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-6 bg-slate-950/45">
        <button 
          onClick={() => setActiveTab("settings")} 
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === "settings" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
        >
          ⚙️ General Configuration
        </button>
        <button 
          onClick={() => setActiveTab("stats")} 
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === "stats" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
        >
          📈 Real-time Analytics
        </button>
        <button 
          onClick={() => { setActiveTab("history"); loadGames(); }} 
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === "history" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
        >
          🎮 Game History
        </button>
      </div>

      <div className="p-6">
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Core Rules & Controls */}
            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">Core Game Rules</h3>
              
              <label className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <div>
                  <div className="font-bold text-sm">Enable RPS Battle Module</div>
                  <div className="text-[11px] text-slate-500">Allow users to play Rock Paper Scissors Battle</div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, enabled: !settings.enabled})}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <div>
                  <div className="font-bold text-sm">Enable AI Opponent Fallback</div>
                  <div className="text-[11px] text-slate-500">Match with server AI if no human player joins before timeout</div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.aiEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, aiEnabled: !settings.aiEnabled})}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400">Human Matchmaking Timeout (Seconds)</label>
                  <input type="number" value={settings.humanWaitTime} onChange={e => setSettings({...settings, humanWaitTime: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400">Draw Resolution Mode</label>
                  <select 
                    value={settings.drawMode || "refund"} 
                    onChange={e => setSettings({...settings, drawMode: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm text-white"
                  >
                    <option value="refund">Refund Entry Fee (Mark Draw)</option>
                    <option value="rematch">Instant Auto Rematch (Same Match)</option>
                    <option value="carry">Carry Prize Forward (Play again for pooled prize)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Economy & AI Probabilities */}
            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">Economy & AI Configuration</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400">Entry Fee (₹)</label>
                  <input type="number" value={settings.entryFee} onChange={e => setSettings({...settings, entryFee: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Prize Pool (₹)</label>
                  <input type="number" value={settings.prizePool} onChange={e => setSettings({...settings, prizePool: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Platform Sponsored Contribution (₹)</label>
                <input type="number" value={settings.platformSponsoredAmount} onChange={e => setSettings({...settings, platformSponsoredAmount: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                <p className="text-[10px] text-slate-500 mt-1">Platform-sponsored payout added to the prize pool (usually Prize Pool = 2 * EntryFee + Sponsored Contribution).</p>
              </div>

              <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-850 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span>AI Weighted Choice Probabilities</span>
                  <span className="text-[10px] text-indigo-400">Must sum up to 100%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Rock %</label>
                    <input type="number" min="0" max="100" value={settings.aiRockProb} onChange={e => setSettings({...settings, aiRockProb: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Paper %</label>
                    <input type="number" min="0" max="100" value={settings.aiPaperProb} onChange={e => setSettings({...settings, aiPaperProb: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Scissors %</label>
                    <input type="number" min="0" max="100" value={settings.aiScissorsProb} onChange={e => setSettings({...settings, aiScissorsProb: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">Business Performance</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Battles Played</p>
                <p className="text-2xl font-black text-white mt-1">{stats.totalMatches || 0}</p>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Human Wins</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{stats.wins || 0}</p>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Draw Matches</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{stats.draws || 0}</p>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Net Platform Revenue</p>
                <p className="text-2xl font-black text-amber-400 mt-1">₹{stats.revenue || 0}</p>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Platform Sponsored Paid</p>
                <p className="text-2xl font-black text-rose-400 mt-1">₹{stats.sponsoredRewards || 0}</p>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Rewarded Ads Played</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{stats.adsCompleted || 0}</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl flex gap-3.5 items-start">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                <p className="font-bold text-slate-200 mb-1">Financial Reconciliation Policy</p>
                Net platform revenue is computed as <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">(EntryFees - Payouts)</code>. Contribution records are verified and logged securely into the Firestore transactions database automatically after every resolution.
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">Admin Game History</h3>

            {/* History Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Games</p>
                <p className="text-xl font-black text-white mt-1">{totalGames}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Wins</p>
                <p className="text-xl font-black text-emerald-400 mt-1">{totalWins}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Losses</p>
                <p className="text-xl font-black text-rose-400 mt-1">{totalLosses}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Draws</p>
                <p className="text-xl font-black text-amber-400 mt-1">{totalDraws}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-center col-span-2 md:col-span-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Payouts</p>
                <p className="text-xl font-black text-indigo-400 mt-1">₹{totalRewardsPaid}</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Player Name, Username, ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={resultFilter}
                  onChange={e => setResultFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
                >
                  <option value="all">All Results</option>
                  <option value="win">Wins</option>
                  <option value="loss">Losses</option>
                  <option value="draw">Draws</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            {gamesLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs text-slate-400 mt-2">Loading game history logs...</p>
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-950/20 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-bold">No match logs found</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting filters or checking the search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/60 text-slate-400 font-bold">
                      <th className="p-4">Player Details</th>
                      <th className="p-4">Game ID</th>
                      <th className="p-4">Choices</th>
                      <th className="p-4">Result</th>
                      <th className="p-4">Reward Paid</th>
                      <th className="p-4">Wallet Balance</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {filteredGames.map((g: any, idx: number) => {
                      const dateStr = g.timestamp
                        ? new Date(g.timestamp.seconds ? g.timestamp.seconds * 1000 : g.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                        : "N/A";
                      
                      const resultClass = g.result === "Win"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : g.result === "Loss"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

                      return (
                        <tr key={g.id || idx} className="hover:bg-slate-900/40 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-200">{g.username || "Unknown"}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">ID: {g.userId || g.telegramId}</div>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-400">
                            {g.gameId || "N/A"}
                          </td>
                          <td className="p-4 text-slate-300">
                            <span className="capitalize">{g.userChoice || "rock"}</span> vs <span className="capitalize">{g.botChoice || "rock"}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${resultClass}`}>
                              {g.result}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            ₹{g.reward || 0}
                          </td>
                          <td className="p-4 text-slate-400">
                            ₹{g.walletBalanceAfter || 0}
                          </td>
                          <td className="p-4 text-slate-500">
                            {dateStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {msg && (
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-center font-bold text-indigo-400 text-sm mt-6">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
