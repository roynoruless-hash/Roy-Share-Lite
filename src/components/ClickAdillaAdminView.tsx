import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { motion } from "motion/react";
import {
  Save, AlertTriangle, CheckCircle2, RotateCcw, MonitorPlay,
  MousePointer2, Zap, LayoutDashboard, Settings, Loader2, BarChart2, Calendar
} from "lucide-react";

export default function ClickAdillaAdminView() {
  const [activeTab, setActiveTab] = useState("Live Statistics");
  const [apiToken, setApiToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  
  const [todayStats, setTodayStats] = useState<any[]>([]);
  const [last30Stats, setLast30Stats] = useState<any[]>([]);
  const [adformatStats, setAdformatStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [spots, setSpots] = useState<any[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);

  const [debugData, setDebugData] = useState<any>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ status?: number; url?: string; time?: number; count?: number; }>({});
  const [showDebug, setShowDebug] = useState(false);

  const fetchDebugData = async () => {
    setLoadingDebug(true);
    setDebugData(null);
    setDebugInfo({});
    const startTime = Date.now();
    try {
      const fetchUrl = `${API_BASE}/api/admin/clickadilla/spots`;
      const res = await fetch(fetchUrl, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const endTime = Date.now();
      const rawText = await res.text();
      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        parsed = rawText;
      }
      
      let count = 0;
      if (parsed && Array.isArray(parsed)) count = parsed.length;
      else if (parsed && parsed.data && Array.isArray(parsed.data)) count = parsed.data.length;
      else if (parsed && parsed.items && Array.isArray(parsed.items)) count = parsed.items.length;

      setDebugData(parsed);
      setDebugInfo({
        status: res.status,
        url: fetchUrl,
        time: endTime - startTime,
        count
      });
    } catch (e: any) {
      setDebugData({ error: e.message });
    }
    setLoadingDebug(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "Live Statistics") fetchStats();
    if (activeTab === "Ad Spots") fetchSpots();
    if (activeTab === "Revenue Analytics") fetchAnalytics();
    
    let interval: NodeJS.Timeout;
    if (activeTab === "Live Statistics" || activeTab === "Revenue Analytics") {
      interval = setInterval(() => {
        if (activeTab === "Live Statistics") fetchStats();
        if (activeTab === "Revenue Analytics") fetchAnalytics();
      }, 5 * 60 * 1000); // 5 min auto refresh
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/clickadilla/settings`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const data = await res.json();
      if (data.apiToken) {
        setApiToken(data.apiToken);
        setConnected(data.connected);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/clickadilla/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        },
        body: JSON.stringify({ apiToken, connected })
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save settings");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/clickadilla/test`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        },
        body: JSON.stringify({ apiToken })
      });
      const data = await res.json();
      if (data.success) {
        setConnected(true);
        setTestResult({ success: true, message: "✅ Connected Successfully", data: data.data });
      } else {
        setConnected(false);
        setTestResult({ success: false, message: `❌ ${data.error || "Invalid API Token"}` });
      }
    } catch (e: any) {
      setConnected(false);
      setTestResult({ success: false, message: `❌ Error: ${e.message}` });
    }
    setTesting(false);
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/clickadilla/stats/today`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const data = await res.json();
      const rows = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setTodayStats(rows);
    } catch (e) {
      console.error(e);
    }
    setLoadingStats(false);
  };

  const fetchAnalytics = async () => {
    setLoadingStats(true);
    try {
      const [res30, resAd] = await Promise.all([
        fetch(`${API_BASE}/api/admin/clickadilla/stats/last30`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
        }),
        fetch(`${API_BASE}/api/admin/clickadilla/stats/adformat`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
        })
      ]);
      const data30 = await res30.json();
      const dataAd = await resAd.json();
      
      setLast30Stats(Array.isArray(data30.data) ? data30.data : (Array.isArray(data30) ? data30 : []));
      setAdformatStats(Array.isArray(dataAd.data) ? dataAd.data : (Array.isArray(dataAd) ? dataAd : []));
    } catch (e) {
      console.error(e);
    }
    setLoadingStats(false);
  };

  const fetchSpots = async () => {
    setLoadingSpots(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/clickadilla/spots`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const data = await res.json();
      setSpots(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error(e);
    }
    setLoadingSpots(false);
  };

  // Aggregation helpers
  const sumField = (arr: any[], field: string) => arr.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
  
  const todayRevenue = sumField(todayStats, 'money');
  const todayImpressions = sumField(todayStats, 'impressions');
  const todayClicks = sumField(todayStats, 'clicks');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-6">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <MonitorPlay className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">ClickAdilla Publisher API</h2>
            <p className="text-slate-400">Official real-time stats and spot management</p>
          </div>
          {connected && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">API Connected</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
          {["API Setup", "Live Statistics", "Ad Spots", "Revenue Analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? "bg-indigo-600 text-white" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {tab === "API Setup" && <Settings className="w-4 h-4 inline-block mr-2" />}
              {tab === "Live Statistics" && <LayoutDashboard className="w-4 h-4 inline-block mr-2" />}
              {tab === "Ad Spots" && <MonitorPlay className="w-4 h-4 inline-block mr-2" />}
              {tab === "Revenue Analytics" && <BarChart2 className="w-4 h-4 inline-block mr-2" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {activeTab === "API Setup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Official ClickAdilla Publisher API Integration</p>
                <p className="text-sm mt-1">Get your API token from the ClickAdilla Publisher Dashboard. The token will be securely stored encrypted.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Publisher API Token</label>
                <input 
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter ClickAdilla API Token"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving || !apiToken}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Settings
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !apiToken}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                Test Connection
              </button>
            </div>
            
            {testResult && (
              <div className={`p-4 rounded-xl border mt-4 ${testResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                <p className="font-medium">{testResult.message}</p>
                {testResult.success && testResult.data && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20 text-sm">
                    <p><strong>Found {testResult.data.length || (testResult.data.data && testResult.data.data.length) || 0} Ad Spots.</strong> Connection is fully working.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Live Statistics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Today's Real Statistics</h3>
                <p className="text-sm text-slate-400">Pulled directly from official API.</p>
              </div>
              <button 
                onClick={fetchStats}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <RotateCcw className={`w-5 h-5 text-indigo-400 ${loadingStats ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            {loadingStats ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <p className="text-slate-400 text-sm font-medium mb-1">Today's Revenue</p>
                    <p className="text-3xl font-black text-emerald-400">${todayRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <p className="text-slate-400 text-sm font-medium mb-1">Today's Impressions</p>
                    <p className="text-3xl font-black text-white">{todayImpressions.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <p className="text-slate-400 text-sm font-medium mb-1">Today's Clicks</p>
                    <p className="text-3xl font-black text-blue-400">{todayClicks.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-white font-bold mb-4">Raw Today Data Rows</h4>
                  <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/50 text-slate-400">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Impressions</th>
                          <th className="p-4">Clicks</th>
                          <th className="p-4">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {todayStats.map((row, i) => (
                          <tr key={i} className="text-slate-300">
                            <td className="p-4">{row.date || 'N/A'}</td>
                            <td className="p-4">{row.impressions || 0}</td>
                            <td className="p-4">{row.clicks || 0}</td>
                            <td className="p-4 text-emerald-400">${parseFloat(row.money || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        {todayStats.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-500">No data today.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === "Ad Spots" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Your Ad Spots</h3>
              <button 
                onClick={fetchSpots}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <RotateCcw className={`w-5 h-5 text-indigo-400 ${loadingSpots ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            {loadingSpots ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : spots.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700">
                <p className="text-slate-400">No ad spots found. Have you created any in ClickAdilla?</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto bg-slate-800/50 rounded-xl border border-slate-700">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-300 text-sm whitespace-nowrap">
                      <tr>
                        <th className="p-4">Spot ID</th>
                        <th className="p-4">Spot Name</th>
                        <th className="p-4">Format</th>
                        <th className="p-4">Ad Code ID</th>
                        <th className="p-4">Last Activity</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {spots.map((spot, i) => {
                        const findField = (obj: any, possibleKeys: string[]) => {
                          if (!obj || typeof obj !== 'object') return 'Not Provided by API';
                          for (const key of Object.keys(obj)) {
                            const lowerKey = key.toLowerCase();
                            if (possibleKeys.includes(lowerKey)) {
                              if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
                                return obj[key];
                              }
                            }
                          }
                          for (const key of Object.keys(obj)) {
                            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                              for (const subKey of Object.keys(obj[key])) {
                                const lowerSubKey = subKey.toLowerCase();
                                if (possibleKeys.includes(lowerSubKey)) {
                                  if (obj[key][subKey] !== null && obj[key][subKey] !== undefined && obj[key][subKey] !== "") {
                                    return obj[key][subKey];
                                  }
                                }
                              }
                            }
                          }
                          return 'Not Provided by API';
                        };

                        const spotId = findField(spot, ['id', 'spot_id', 'spotid', 'uuid']);
                        const spotName = findField(spot, ['name', 'title', 'spot_name', 'spotname', 'description']);
                        const format = findField(spot, ['format', 'adformat', 'ad_format', 'type', 'adformat_name']);
                        const status = findField(spot, ['status', 'active', 'is_active', 'state', 'enabled', 'is_enabled']);
                        const adCodeId = findField(spot, ['code', 'code_id', 'script', 'script_id', 'ad_code']);
                        const lastActivity = findField(spot, ['activity', 'date', 'time', 'updated', 'updated_at', 'created', 'created_at', 'last_activity']);

                        let isOk = false;
                        const statusStr = String(status).toLowerCase();
                        if (statusStr === "active" || statusStr === "true" || statusStr === "1" || statusStr === "enabled") {
                          isOk = true;
                        }

                        return (
                          <tr key={i} className="hover:bg-slate-800/50 transition-colors text-sm">
                            <td className="p-4 text-slate-400 font-mono text-xs">{String(spotId)}</td>
                            <td className="p-4 font-bold text-white max-w-[200px] truncate" title={String(spotName)}>{String(spotName)}</td>
                            <td className="p-4 text-indigo-400 font-medium">{String(format)}</td>
                            <td className="p-4 text-slate-400 font-mono text-xs">{String(adCodeId)}</td>
                            <td className="p-4 text-slate-400 text-xs">{String(lastActivity)}</td>
                            <td className="p-4 whitespace-nowrap">
                              {status !== "Not Provided by API" ? (
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  isOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {String(status)}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs">Not Provided by API</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 border border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="w-full bg-slate-800 p-4 flex items-center justify-between text-white font-bold hover:bg-slate-700 transition-colors"
                  >
                    <span>Debug Data (Raw JSON)</span>
                    <span>{showDebug ? "Hide" : "Show"}</span>
                  </button>
                  
                  {showDebug && (
                    <div className="p-6 bg-slate-900 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-sm">Use this to verify the exact field names returned by the ClickAdilla API.</p>
                        <button
                          onClick={fetchDebugData}
                          disabled={loadingDebug}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {loadingDebug ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorPlay className="w-4 h-4" />}
                          Load Debug Data
                        </button>
                      </div>

                      {debugInfo.status && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <p className="text-slate-400 text-xs mb-1">HTTP Status</p>
                            <p className={`font-mono font-bold ${debugInfo.status >= 200 && debugInfo.status < 300 ? 'text-emerald-400' : 'text-red-400'}`}>{debugInfo.status}</p>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <p className="text-slate-400 text-xs mb-1">Response Time</p>
                            <p className="text-white font-mono font-bold">{debugInfo.time}ms</p>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <p className="text-slate-400 text-xs mb-1">Objects Returned</p>
                            <p className="text-white font-mono font-bold">{debugInfo.count || 0}</p>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 truncate" title={debugInfo.url}>
                            <p className="text-slate-400 text-xs mb-1">Request URL</p>
                            <p className="text-indigo-400 font-mono text-xs">{debugInfo.url}</p>
                          </div>
                        </div>
                      )}

                      {debugData && (
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl overflow-x-auto max-h-[500px] overflow-y-auto">
                          <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                            {typeof debugData === 'string' ? debugData : JSON.stringify(debugData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Revenue Analytics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Advanced Statistics</h3>
              <button 
                onClick={fetchAnalytics}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <RotateCcw className={`w-5 h-5 text-indigo-400 ${loadingStats ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingStats ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" /> 
                    Last 30 Days (Daily Breakdown)
                  </h4>
                  <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/50 text-slate-400">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Impressions</th>
                          <th className="p-4">Clicks</th>
                          <th className="p-4">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {last30Stats.slice(0, 30).map((row, i) => (
                          <tr key={i} className="text-slate-300">
                            <td className="p-4">{row.date || 'N/A'}</td>
                            <td className="p-4">{row.impressions || 0}</td>
                            <td className="p-4">{row.clicks || 0}</td>
                            <td className="p-4 text-emerald-400">${parseFloat(row.money || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        {last30Stats.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-500">No data for the last 30 days.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" /> 
                    Today's Ad Format Performance
                  </h4>
                  <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/50 text-slate-400">
                        <tr>
                          <th className="p-4">Ad Format</th>
                          <th className="p-4">Impressions</th>
                          <th className="p-4">Clicks</th>
                          <th className="p-4">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {adformatStats.map((row, i) => (
                          <tr key={i} className="text-slate-300">
                            <td className="p-4 font-bold">{row.adformat || row.adformat_name || 'Unknown Format'}</td>
                            <td className="p-4">{row.impressions || 0}</td>
                            <td className="p-4">{row.clicks || 0}</td>
                            <td className="p-4 text-emerald-400">${parseFloat(row.money || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        {adformatStats.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-500">No ad format data available today.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
