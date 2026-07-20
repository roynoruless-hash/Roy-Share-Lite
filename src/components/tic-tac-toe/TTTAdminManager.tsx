import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Loader2, Users, TrendingUp, History, RefreshCw, Grid } from "lucide-react";
import { db } from "../../lib/firebase";
import { getDoc, setDoc, getDocs, query } from "firebase/firestore";
import { doc, collection } from "../../lib/botDb";

export default function TTTAdminManager() {
  const [settings, setSettings] = useState<any>({
    enabled: true,
    aiEnabled: true,
    aiDifficulty: "Impossible",
    entryFee: 5,
    prizePool: 20,
    moveTimer: 10,
    matchTimeout: 15,
    disconnectPolicy: "autolose",
    disconnectTimeout: 30,
    drawPolicy: "refund",
    rewardAdsEnabled: true,
    rewardAdsMode: "mode2",
    retryOnFail: true,
    skipIfNoFill: true,
    fallbackNetwork: "Unity",
    adTimeout: 8,
    maintenanceMode: false
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
      if (settingsSnap.exists()) {
        setSettings({ ...settings, ...settingsSnap.data() });
      }

      const statsSnap = await getDoc(doc(db, "stats", "ttt"));
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
      const q = query(collection(db, "ttt_history"));
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
    try {
      await setDoc(doc(db, "settings", "ttt"), settings);
      setMsg("Settings saved successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setMsg("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden text-white font-sans mt-6">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-400" /> Tic Tac Toe Battle Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure matchmaking, AI parameters, ad models, and disconnect timers.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "settings" && (
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          )}
          <button 
            onClick={loadData} 
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition"
            title="Reload data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 py-2 gap-4">
        <button 
          onClick={() => setActiveTab("settings")} 
          className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "settings" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "text-slate-400 hover:text-slate-200"}`}
        >
          ⚙️ General Configuration
        </button>
        <button 
          onClick={() => setActiveTab("stats")} 
          className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "stats" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "text-slate-400 hover:text-slate-200"}`}
        >
          📊 Summary Analytics
        </button>
        <button 
          onClick={() => setActiveTab("history")} 
          className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "history" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "text-slate-400 hover:text-slate-200"}`}
        >
          📜 Match History logs
        </button>
      </div>

      <div className="p-6">
        {msg && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-xs font-bold ${msg.includes("successfully") ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" : "bg-rose-500/10 border border-rose-500/25 text-rose-400"}`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Game & Fees */}
            <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Main Arena Switch</h3>
              
              <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold">Enable Tic Tac Toe Battle</p>
                  <p className="text-[10px] text-slate-400">Enable/disable players from playing this game.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.enabled} 
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold">Maintenance Mode</p>
                  <p className="text-[10px] text-slate-400">Set the game in maintenance mode.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.maintenanceMode} 
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Entry Fee (₹)</label>
                <input 
                  type="number" 
                  value={settings.entryFee} 
                  onChange={(e) => setSettings({ ...settings, entryFee: Number(e.target.value) })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prize Pool (₹)</label>
                <input 
                  type="number" 
                  value={settings.prizePool} 
                  onChange={(e) => setSettings({ ...settings, prizePool: Number(e.target.value) })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Column 2: AI & Timer Options */}
            <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Matchmaking & AI System</h3>
              
              <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold">Enable AI Opponents</p>
                  <p className="text-[10px] text-slate-400">Pair players with AI if matchmaking times out.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.aiEnabled} 
                  onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Default AI Difficulty</label>
                <select 
                  value={settings.aiDifficulty} 
                  onChange={(e) => setSettings({ ...settings, aiDifficulty: e.target.value })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option value="Easy">Easy AI (Random moves)</option>
                  <option value="Medium">Medium AI (Block simple wins)</option>
                  <option value="Hard">Hard AI (90% Perfect play)</option>
                  <option value="Impossible">Impossible AI (Full Minimax)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Move Timer (Seconds)</label>
                <input 
                  type="number" 
                  value={settings.moveTimer} 
                  onChange={(e) => setSettings({ ...settings, moveTimer: Number(e.target.value) })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Match Timeout (Seconds)</label>
                <input 
                  type="number" 
                  value={settings.matchTimeout} 
                  onChange={(e) => setSettings({ ...settings, matchTimeout: Number(e.target.value) })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Column 3: Disconnect & Draw Policies */}
            <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Disconnect & Draw Policies</h3>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Disconnect Policy</label>
                <select 
                  value={settings.disconnectPolicy} 
                  onChange={(e) => setSettings({ ...settings, disconnectPolicy: e.target.value })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option value="autolose">Auto Lose (Loss to disconnected player)</option>
                  <option value="aitakeover">AI Takeover (Substitute bot takes over)</option>
                  <option value="refund">Refund (Cancel match & return fee)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Reconnect Timer (Seconds)</label>
                <input 
                  type="number" 
                  value={settings.disconnectTimeout} 
                  onChange={(e) => setSettings({ ...settings, disconnectTimeout: Number(e.target.value) })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Draw Policy</label>
                <select 
                  value={settings.drawPolicy} 
                  onChange={(e) => setSettings({ ...settings, drawPolicy: e.target.value })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option value="refund">Refund (Immediately refund entry fee)</option>
                  <option value="rematch">Rematch (Force replay match)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Timeout Rule</label>
                <select 
                  value={settings.timeoutPolicy || "autolose"} 
                  onChange={(e) => setSettings({ ...settings, timeoutPolicy: e.target.value })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option value="autolose">Auto Lose immediately</option>
                  <option value="randomCell">Random Empty Cell placement</option>
                </select>
              </div>
            </div>

            {/* Column 4: Reward Ads Configuration */}
            <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Reward Ads Management</h3>

              <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold">Enable Reward Ads</p>
                  <p className="text-[10px] text-slate-400">Require viewing ads to progress.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.rewardAdsEnabled} 
                  onChange={(e) => setSettings({ ...settings, rewardAdsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Ad Watching Placement Mode</label>
                <select 
                  value={settings.rewardAdsMode} 
                  onChange={(e) => setSettings({ ...settings, rewardAdsMode: e.target.value })}
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option value="mode1">Mode 1: Watch Ad BEFORE match starts</option>
                  <option value="mode2">Mode 2: Watch Ad AFTER match before payout</option>
                  <option value="mode3">Mode 3: Watch Ad BEFORE prize claiming</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-xl">
                  <span className="text-[10px] font-bold">Retry on Fail</span>
                  <input 
                    type="checkbox" 
                    checked={settings.retryOnFail} 
                    onChange={(e) => setSettings({ ...settings, retryOnFail: e.target.checked })}
                    className="w-3.5 h-3.5 accent-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-xl">
                  <span className="text-[10px] font-bold">Skip if no fill</span>
                  <input 
                    type="checkbox" 
                    checked={settings.skipIfNoFill} 
                    onChange={(e) => setSettings({ ...settings, skipIfNoFill: e.target.checked })}
                    className="w-3.5 h-3.5 accent-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Fallback Network</label>
                  <input 
                    type="text" 
                    value={settings.fallbackNetwork} 
                    onChange={(e) => setSettings({ ...settings, fallbackNetwork: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ad Timeout (s)</label>
                  <input 
                    type="number" 
                    value={settings.adTimeout} 
                    onChange={(e) => setSettings({ ...settings, adTimeout: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Total Matches</p>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.totalMatches || 0}</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Total Wins</p>
                <p className="text-xl font-extrabold text-indigo-400 mt-1">{stats.wins || 0}</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Total Draws</p>
                <p className="text-xl font-extrabold text-slate-300 mt-1">{stats.draws || 0}</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Ads Completed</p>
                <p className="text-xl font-extrabold text-amber-400 mt-1">{stats.adsCompleted || 0}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {gamesLoading ? (
              <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div>
            ) : games.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">No matches recorded in history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Opponent</th>
                      <th className="py-2.5">Difficulty</th>
                      <th className="py-2.5">Result</th>
                      <th className="py-2.5">Reward</th>
                      <th className="py-2.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g, i) => (
                      <tr key={i} className="border-b border-slate-850 hover:bg-slate-950/20">
                        <td className="py-2.5 font-bold text-slate-300">@{g.username || "Anonymous"}</td>
                        <td className="py-2.5 text-slate-400">{g.opponent}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-750">
                            {g.difficulty}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${g.result === "Win" ? "bg-emerald-500/15 text-emerald-400" : g.result === "Loss" ? "bg-rose-500/15 text-rose-400" : "bg-slate-500/15 text-slate-400"}`}>
                            {g.result}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-emerald-400">₹{g.reward}</td>
                        <td className="py-2.5 text-slate-400">{g.duration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
