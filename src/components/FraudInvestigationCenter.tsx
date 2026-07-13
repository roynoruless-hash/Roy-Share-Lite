import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  UserX, 
  Globe, 
  Cpu, 
  Clock, 
  Database, 
  TrendingUp, 
  Lock, 
  FileText, 
  MapPin, 
  UserCheck, 
  HelpCircle,
  Sparkles,
  BarChart2,
  Calendar,
  AlertCircle,
  Ghost,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface FraudLog {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  fingerprint: string;
  browserFingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  sessionToken: string;
  type: string;
  taskId: string;
  createdAt: string;
  watchStartTime: string;
  watchEndTime: string;
  totalWatchTime: number;
  refreshes: number;
  multipleTabCount: number;
  focusLostCount: number;
  visibilityHiddenCount: number;
  heartbeatLogs: string[];
  vpnDetected: boolean;
  proxyDetected: boolean;
  emulatorDetected: boolean;
  rootJailbreakDetected: boolean;
  fraudScore: number;
  fraudReasons: string[];
  status: string;
  rewardAmount: number;
  transactionId: string;
  notes: Array<{ text: string; timestamp: string }>;
}

interface FraudStats {
  normalCount: number;
  pendingCount: number;
  suspendedCount: number;
  bannedCount: number;
  todayAttempts: number;
  lifetimeAttempts: number;
  reasonsCount: Record<string, number>;
  devicesCount: Record<string, number>;
  countriesCount: Record<string, number>;
  vpnCount: Record<string, number>;
}

export function FraudInvestigationCenter() {
  const [logs, setLogs] = useState<FraudLog[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<FraudLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState<"logs" | "analytics" | "shadow">("logs");
  const [shadowData, setShadowData] = useState<any>(null);
  const [shadowLoading, setShadowLoading] = useState(false);

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

  const fetchShadowDashboard = async () => {
    setShadowLoading(true);
    try {
      const res = await fetch("/api/admin/shadow-ban/dashboard");
      const data = await res.json();
      if (data.success) {
        setShadowData(data);
      }
    } catch (e) {
      console.error("Error loading shadow ban dashboard data", e);
    } finally {
      setShadowLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const logsRes = await fetch("/api/admin/fraud/logs");
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.logs);
      }

      const statsRes = await fetch("/api/admin/fraud/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (e) {
      console.error("Error loading fraud center data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "shadow") {
      fetchShadowDashboard();
    }
  }, [activeTab]);

  const handleAction = async (id: string, action: string, extra?: any) => {
    try {
      const res = await fetch("/api/admin/fraud/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local details if active
        if (selectedLog && selectedLog.id === id) {
          const updatedLog = { ...selectedLog };
          if (action === "approve") updatedLog.status = "Normal";
          if (action === "reject") updatedLog.status = "Rejected";
          if (action === "update_user_status" && extra?.status) {
            (updatedLog as any).userStatus = extra.status;
          }
          if (action === "shadow_ban") (updatedLog as any).shadowBanned = true;
          if (action === "remove_shadow_ban") (updatedLog as any).shadowBanned = false;
          if (action === "add_notes" && extra?.noteText) {
            updatedLog.notes = [
              ...(updatedLog.notes || []),
              { text: extra.noteText, timestamp: new Date().toISOString() }
            ];
          }
          setSelectedLog(updatedLog);
        }
        await fetchData();
        if (activeTab === "shadow") {
          await fetchShadowDashboard();
        }
      }
    } catch (e) {
      console.error("Failed to apply fraud action", e);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete all fraud investigation logs. This is irreversible!")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/fraud/clear", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
        setSelectedLog(null);
        await fetchData();
      }
    } catch (e) {
      console.error("Error clearing logs", e);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.userId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ip || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.country || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.isp || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesType = typeFilter === "all" || log.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Analytics helper charts formatting
  const getDailyAttemptsChartData = () => {
    const days: Record<string, number> = {};
    logs.forEach(log => {
      if (log.createdAt) {
        const dateStr = log.createdAt.split("T")[0];
        days[dateStr] = (days[dateStr] || 0) + 1;
      }
    });

    return Object.keys(days).sort().map(day => ({
      date: day,
      Attempts: days[day]
    })).slice(-10); // Last 10 days
  };

  const getReasonsChartData = () => {
    if (!stats?.reasonsCount) return [];
    return Object.keys(stats.reasonsCount).map(key => ({
      name: key,
      Count: stats.reasonsCount[key]
    })).sort((a, b) => b.Count - a.Count);
  };

  const getCountriesPieData = () => {
    if (!stats?.countriesCount) return [];
    return Object.keys(stats.countriesCount).map(key => ({
      name: key,
      value: stats.countriesCount[key]
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  return (
    <div id="fraud-investigation-center" className="space-y-6 text-slate-100 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              🛡 Fraud Investigation Center <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-mono border border-red-500/20">Anti-Abuse Engine V2</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time server-side security, hardware fingerprint matching, and multi-vector bot detection logic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-btn-logs"
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "logs" 
                ? "bg-slate-800 text-white shadow-lg border border-slate-700" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Database className="w-4 h-4" /> Security Logs
          </button>
          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "analytics" 
                ? "bg-slate-800 text-white shadow-lg border border-slate-700" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Threat Analytics
          </button>
          <button
            id="tab-btn-shadow"
            onClick={() => setActiveTab("shadow")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "shadow" 
                ? "bg-slate-800 text-white shadow-lg border border-slate-700 font-bold" 
                : "text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50"
            }`}
          >
            <Ghost className="w-4 h-4 text-purple-400 animate-pulse" /> Shadow Ban Center
          </button>
          <button
            id="btn-clear-logs"
            onClick={handleClearLogs}
            className="px-4 py-2 text-sm font-semibold bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Purge Logs
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Normal Traffic</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{stats.normalCount}</span>
              <span className="text-xs text-emerald-500 font-medium">Safe</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pending Review</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-yellow-500">{stats.pendingCount}</span>
              <span className="text-xs text-yellow-500 font-medium">Flagged</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Suspended</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-orange-500">{stats.suspendedCount}</span>
              <span className="text-xs text-orange-500 font-medium">Restricted</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Auto Banned</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-red-500">{stats.bannedCount}</span>
              <span className="text-xs text-red-500 font-medium">Blocked</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Today's Alarms</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.todayAttempts}</span>
              <span className="text-xs text-red-400 font-medium">Threats</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Monitored</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-400">{stats.lifetimeAttempts}</span>
              <span className="text-xs text-indigo-400 font-medium">Claims</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading live security logs & compiling risk scores...</p>
        </div>
      ) : activeTab === "logs" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Logs List Section */}
          <div className="xl:col-span-2 space-y-4">
            {/* Filter and Search Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search by User ID, Username, Name, IP, ISP, Fingerprint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-medium">Status:</span>
                  <select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-white font-bold focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Normal">Normal</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Banned">Banned</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <span className="text-slate-400 font-medium">Task:</span>
                  <select
                    id="filter-type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-transparent border-none text-white font-bold focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="video_ad">🎥 Video Ads</option>
                    <option value="url_shortener">🔗 URL Shortener</option>
                    <option value="giveaway">🎁 Giveaway</option>
                    <option value="reward">💰 Reward Claim</option>
                    <option value="withdrawal">📤 Withdrawal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Triggered At</th>
                      <th className="px-4 py-3.5">Security Context</th>
                      <th className="px-4 py-3.5">Channel / Task</th>
                      <th className="px-4 py-3.5 text-center">Threat Rating</th>
                      <th className="px-4 py-3.5">Action Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-16 text-slate-500">
                          <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                          No threat logs match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => {
                        const scoreColor = 
                          log.fraudScore >= 80 ? "text-red-400 bg-red-950/40 border-red-900/40" :
                          log.fraudScore >= 50 ? "text-yellow-400 bg-yellow-950/40 border-yellow-900/40" :
                          "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";

                        const statusStyle = 
                          log.status === "Banned" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          log.status === "Suspended" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                          log.status === "Pending Review" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                          log.status === "Rejected" ? "bg-slate-800 text-slate-400 border-slate-700" :
                          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                        return (
                          <tr
                            key={log.id}
                            id={`log-row-${log.id}`}
                            onClick={() => setSelectedLog(log)}
                            className={`border-b border-slate-800/40 hover:bg-slate-800/30 transition-all cursor-pointer ${
                              selectedLog?.id === log.id ? "bg-slate-800/40 border-l-2 border-l-red-500" : ""
                            }`}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-200">
                                  {new Date(log.createdAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                  {log.username ? `@${log.username}` : `UID: ${log.userId}`}
                                  {log.vpnDetected && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">VPN</span>}
                                </span>
                                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                  <Globe className="w-3 h-3 text-slate-600" /> {log.ip} ({log.country || "N/A"})
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                                  {log.type === "video_ad" ? "🎥 Video Ad" : 
                                   log.type === "url_shortener" ? "🔗 URL" :
                                   log.type === "giveaway" ? "🎁 Giveaway" :
                                   log.type === "withdrawal" ? "📤 Cashout" : "💰 Reward"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {log.rewardAmount ? `₹${log.rewardAmount}` : "Free"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 text-sm font-black font-mono px-3 py-1 rounded-full border ${scoreColor}`}>
                                {log.fraudScore}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusStyle}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Investigation Details Side Panel */}
          <div className="xl:col-span-1">
            {selectedLog ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-6 sticky top-6">
                {/* Header Profile */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">
                      {selectedLog.firstName} {selectedLog.lastName}
                    </h3>
                    <p className="text-sm text-red-400 font-mono">
                      @{selectedLog.username}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      Telegram ID: {selectedLog.userId}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(() => {
                        const s = (selectedLog as any).userStatus || "Normal";
                        let colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        let dotColor = "bg-emerald-400";
                        if (s === "Pending Review") {
                          colorClasses = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
                          dotColor = "bg-yellow-400";
                        } else if (s === "High Risk") {
                          colorClasses = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                          dotColor = "bg-orange-400";
                        } else if (s === "Banned") {
                          colorClasses = "bg-red-500/10 text-red-400 border-red-500/20";
                          dotColor = "bg-red-400";
                        } else if (s === "Shadow Monitor") {
                          colorClasses = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                          dotColor = "bg-slate-400";
                        }
                        return (
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold border px-2 py-0.5 rounded-lg ${colorClasses}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} /> {s}
                          </span>
                        );
                      })()}
                    </div>
                    {(selectedLog as any).shadowBanned && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-bold mt-2 animate-pulse">
                        <Ghost className="w-3 h-3" /> Silently Shadow-Banned
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Risk Level</span>
                    <span className={`text-2xl font-black font-mono ${
                      selectedLog.fraudScore >= 80 ? "text-red-500" :
                      selectedLog.fraudScore >= 50 ? "text-yellow-500" : "text-emerald-400"
                    }`}>
                      {selectedLog.fraudScore}%
                    </span>
                  </div>
                </div>

                {/* Audit Signals */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> Security Audit Flags
                  </h4>
                  {selectedLog.fraudReasons && selectedLog.fraudReasons.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLog.fraudReasons.map((reason, idx) => (
                        <span key={idx} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg font-medium">
                          ⚠️ {reason}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> No security concerns flagged. Safe traffic score.
                    </div>
                  )}
                </div>

                {/* Device & Browser Fingerprint Metadata */}
                <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" /> Hardware Footprint
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Device Fingerprint</span>
                      <span className="font-mono text-slate-300 font-bold block truncate" title={selectedLog.fingerprint}>
                        {selectedLog.fingerprint || "missing"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Browser Canvas</span>
                      <span className="font-mono text-slate-300 font-bold block truncate" title={selectedLog.browserFingerprint}>
                        {selectedLog.browserFingerprint || "missing"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Display Area</span>
                      <span className="text-slate-300 font-bold block font-mono">
                        {selectedLog.screenResolution || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">ISP / Gateway</span>
                      <span className="text-slate-300 font-bold block truncate" title={selectedLog.isp}>
                        {selectedLog.isp || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Language / Region</span>
                      <span className="text-slate-300 font-bold block font-mono">
                        {selectedLog.language || "Unknown"} / {selectedLog.timezone || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">ISP Country</span>
                      <span className="text-slate-300 font-bold block flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" /> {selectedLog.city || "Unknown"}, {selectedLog.country || "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 break-all font-mono">
                    UA: {selectedLog.userAgent}
                  </div>
                </div>

                {/* Real-time Session Tracker */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Live Session Telemetry
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-slate-500 block mb-1">Refreshes</span>
                      <span className="font-bold text-white text-base font-mono">{selectedLog.refreshes || 0}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-slate-500 block mb-1">Focus Lost</span>
                      <span className="font-bold text-white text-base font-mono">{selectedLog.focusLostCount || 0}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-slate-500 block mb-1">Tab Count</span>
                      <span className="font-bold text-white text-base font-mono">{selectedLog.multipleTabCount || 0}</span>
                    </div>
                  </div>
                  {selectedLog.type === "video_ad" && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Watch Elapsed:</span>
                        <span className="font-bold font-mono text-slate-200">
                          {selectedLog.watchStartTime && selectedLog.watchEndTime
                            ? `${Math.floor((new Date(selectedLog.watchEndTime).getTime() - new Date(selectedLog.watchStartTime).getTime()) / 1000)} seconds`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Heartbeat State:</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Notes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Security Analyst Notes
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-950/40 rounded-xl p-2.5 border border-slate-800">
                    {selectedLog.notes && selectedLog.notes.length > 0 ? (
                      selectedLog.notes.map((note, idx) => (
                        <div key={idx} className="text-xs border-b border-slate-800/50 pb-1.5 last:border-none">
                          <p className="text-slate-300">{note.text}</p>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                            {new Date(note.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-2">No analyst notes recorded yet.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="analyst-note-input"
                      type="text"
                      placeholder="Add investigation note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 flex-1"
                    />
                    <button
                      id="btn-add-note"
                      onClick={() => {
                        if (!newNote.trim()) return;
                        handleAction(selectedLog.id, "add_notes", { noteText: newNote });
                        setNewNote("");
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Direct Action Drawer */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Analyst Response Actions</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-action-approve"
                      onClick={() => handleAction(selectedLog.id, "approve")}
                      className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:text-white text-emerald-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Whitelist / Pass
                    </button>
                    <button
                      id="btn-action-reject"
                      onClick={() => handleAction(selectedLog.id, "reject")}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Reward
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-action-suspend"
                      onClick={() => handleAction(selectedLog.id, "suspend_user")}
                      className="px-3 py-2 bg-orange-600/10 hover:bg-orange-600 border border-orange-500/20 hover:text-white text-orange-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Suspend Account
                    </button>
                    <button
                      id="btn-action-ban"
                      onClick={() => handleAction(selectedLog.id, "ban_user")}
                      className="px-3 py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:text-white text-red-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" /> Permanent Ban
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-action-ban-device"
                      onClick={() => handleAction(selectedLog.id, "ban_device")}
                      className="px-2 py-2 bg-slate-950 hover:bg-red-950 hover:text-red-400 border border-slate-800 text-slate-400 font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Cpu className="w-3.5 h-3.5" /> Ban Device ID
                    </button>
                    <button
                      id="btn-action-blacklist"
                      onClick={() => handleAction(selectedLog.id, "blacklist")}
                      className="px-2 py-2 bg-slate-950 hover:bg-red-950 hover:text-red-400 border border-slate-800 text-slate-400 font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Global Blacklist
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/40 space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      User Security Classification
                    </label>
                    <select
                      id="select-user-status"
                      value={(selectedLog as any).userStatus || "Normal"}
                      onChange={(e) => handleAction(selectedLog.id, "update_user_status", { status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
                    >
                      <option value="Normal">🟢 Normal</option>
                      <option value="Pending Review">🟡 Pending Review</option>
                      <option value="High Risk">🟠 High Risk</option>
                      <option value="Banned">🔴 Banned</option>
                      <option value="Shadow Monitor">⚫ Shadow Monitor</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4 text-slate-400 flex flex-col items-center justify-center h-[500px]">
                <ShieldAlert className="w-12 h-12 opacity-30 text-slate-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-200">Select Session for Full Audit</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Choose any record in the table on the left to see screen resolutions, hardware canvas, VPN status, analyst notes, and perform admin actions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "analytics" ? (
        /* Analytics Tab View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Attacks Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Daily Threat Wave (Last 10 Days)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getDailyAttemptsChartData()}>
                  <defs>
                    <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Area type="monotone" dataKey="Attempts" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWave)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Threat Reasons Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Leading Attack Vectors & Alarm Reasons
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getReasonsChartData().slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="Count" fill="#ef4444" radius={[5, 5, 0, 0]}>
                    {getReasonsChartData().slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Common Geographies Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-emerald-400" /> Most Flagged Country Origins
            </h3>
            <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="w-full md:w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCountriesPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getCountriesPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-2">
                {getCountriesPieData().map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-slate-300 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-white font-mono">{entry.value} occurrences</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top VPN/Proxy ISP Provider Networks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> Common VPN/Hosting Providers Tagged
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {stats?.vpnCount && Object.keys(stats.vpnCount).length > 0 ? (
                Object.keys(stats.vpnCount).sort((a, b) => stats.vpnCount[b] - stats.vpnCount[a]).slice(0, 6).map((isp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <span className="font-semibold text-slate-300 font-mono">{isp}</span>
                    <span className="font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      {stats.vpnCount[isp]} counts
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-10">No VPN ISP servers flagged today.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Shadow Ban Dashboard & Users View */
        <div id="shadow-ban-center-view" className="space-y-6">
          {/* Shadow Ban Stats Metrics */}
          {shadowLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading shadow statistics & parallel ledger balances...</p>
            </div>
          ) : shadowData ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 text-purple-500 opacity-20">
                  <Ghost className="w-16 h-16" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 z-10">Shadow Banned Users</span>
                <div className="flex items-baseline gap-2 z-10">
                  <span className="text-3xl font-extrabold text-purple-400">{(shadowData.shadowUsers || []).length}</span>
                  <span className="text-xs text-purple-500 font-bold">Silent</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 text-red-500 opacity-20">
                  <Clock className="w-16 h-16" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 z-10">Today's Shadow Rewards</span>
                <div className="flex items-baseline gap-2 z-10">
                  <span className="text-3xl font-extrabold text-red-400">₹{(shadowData.todayShadowRewards || 0).toFixed(2)}</span>
                  <span className="text-xs text-red-500 font-bold">Blocked</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 text-indigo-500 opacity-20">
                  <Database className="w-16 h-16" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 z-10">Blocked Reward Amount</span>
                <div className="flex items-baseline gap-2 z-10">
                  <span className="text-3xl font-extrabold text-indigo-400">₹{(shadowData.blockedRewardAmount || 0).toFixed(2)}</span>
                  <span className="text-xs text-indigo-500 font-bold">Diverted</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 text-yellow-500 opacity-20">
                  <Lock className="w-16 h-16" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 z-10">Blocked Withdrawals</span>
                <div className="flex items-baseline gap-2 z-10">
                  <span className="text-3xl font-extrabold text-yellow-400">₹{(shadowData.blockedWithdrawalAmount || 0).toFixed(2)}</span>
                  <span className="text-xs text-yellow-500 font-bold">({shadowData.blockedWithdrawalsCount || 0} Req)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center">No shadow data available.</p>
          )}

          {/* List of Shadow Banned Users */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-200">Silently Sandboxed Traffic Profiles</h3>
                <p className="text-xs text-slate-500">Only authorized Super Admins have permission to view or manage these hidden sandboxes.</p>
              </div>
              <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-mono font-bold animate-pulse">
                🛡 Super Admin Sandbox Active
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">User Identity</th>
                    <th className="px-6 py-4">Banned Since</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                    <th className="px-6 py-4">Parallel Balance Ledger</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {shadowData?.shadowUsers && shadowData.shadowUsers.length > 0 ? (
                    shadowData.shadowUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-xs text-purple-400 font-mono">
                              @{u.username || "no_username"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {u.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">
                          {u.shadowBanDate ? new Date(u.shadowBanDate).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 max-w-xs text-xs text-slate-400 truncate" title={u.shadowBanReason}>
                          {u.shadowBanReason || "Suspicious traffic patterns"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col text-xs font-mono">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Virtual Wallet:</span>
                              <span className="font-bold text-purple-400">₹{(u.shadowBalance || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-[10px]">
                              <span className="text-slate-600">Actual Real:</span>
                              <span className="font-bold text-emerald-500">₹{(u.balance || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you absolutely sure you want to lift the shadow ban on @${u.username || u.firstName}?`)) {
                                try {
                                  const res = await fetch("/api/admin/fraud/action", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: "sandbox", action: "remove_shadow_ban", userId: u.id })
                                  });
                                  const d = await res.json();
                                  if (d.success) {
                                    await fetchShadowDashboard();
                                    await fetchData();
                                  }
                                } catch (err) {
                                  console.error("Failed to lift shadow ban", err);
                                }
                              }
                            }}
                            className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:text-white text-blue-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" /> Remove Ban
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500 italic text-xs">
                        No users are currently in the silent sandbox. All user accounts are operating normally.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
