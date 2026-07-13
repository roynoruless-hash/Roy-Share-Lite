import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Sparkles, AlertTriangle, Save, RefreshCw, BarChart2, DollarSign, Users, TrendingUp } from "lucide-react";

interface EconomySettings {
  maxDailyRewardPerUser: number;
  maxDailyTasks: number;
  maxDailyVideoAds: number;
  maxDailyShortenerTasks: number;
  maxDailyGiveaways: number;
  dailyRewardBudget: number;
  monthlyRewardBudget: number;
  abnormalDailyEarningThreshold: number;
  abnormalTasksHourlyThreshold: number;
  abnormalReferralsHourlyThreshold: number;
  abnormalGiveawayWinsThreshold: number;
}

interface EconomyStats {
  todayBudget: number;
  remainingBudget: number;
  totalPaid: number;
  pendingRewards: number;
  blockedRewards: number;
  avgRewardPerUser: number;
}

export function EconomyAdminView() {
  const [settings, setSettings] = useState<EconomySettings>({
    maxDailyRewardPerUser: 500,
    maxDailyTasks: 20,
    maxDailyVideoAds: 30,
    maxDailyShortenerTasks: 20,
    maxDailyGiveaways: 5,
    dailyRewardBudget: 10000,
    monthlyRewardBudget: 250000,
    abnormalDailyEarningThreshold: 300,
    abnormalTasksHourlyThreshold: 10,
    abnormalReferralsHourlyThreshold: 8,
    abnormalGiveawayWinsThreshold: 3,
  });

  const [stats, setStats] = useState<EconomyStats>({
    todayBudget: 10000,
    remainingBudget: 10000,
    totalPaid: 0,
    pendingRewards: 0,
    blockedRewards: 0,
    avgRewardPerUser: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEconomyData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Settings
      const settingsRes = await fetch("/api/admin/economy/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // 2. Fetch Stats
      const statsRes = await fetch("/api/admin/economy/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching economy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEconomyData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/economy/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Economy settings updated successfully!" });
        fetchEconomyData();
      } else {
        setMessage({ type: "error", text: "Failed to save settings. Please try again." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" id="economy-protection-panel">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-400" size={26} />
            Economy Protection & Smart Reward Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Safeguard your platform economy, prevent inflation, configure dynamic limits, and track rewards spending.
          </p>
        </div>
        <button
          onClick={fetchEconomyData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Stats
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Today's Budget</span>
            <DollarSign className="text-emerald-400" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">₹{stats.todayBudget}</span>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2 border-t border-slate-900 pt-2">
              <span>Paid: ₹{stats.totalPaid}</span>
              <span className="text-emerald-400 font-bold">Remaining: ₹{stats.remainingBudget}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.1 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Security Pipeline</span>
            <AlertTriangle className="text-amber-400" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-amber-400">₹{stats.pendingRewards}</span>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2 border-t border-slate-900 pt-2">
              <span>Blocked/Fraud: ₹{stats.blockedRewards}</span>
              <span className="text-slate-400">Under Review</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.2 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Avg User Reward</span>
            <TrendingUp className="text-indigo-400" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">₹{stats.avgRewardPerUser.toFixed(2)}</span>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2 border-t border-slate-900 pt-2">
              <span>Dynamic Engine Ratio</span>
              <span className="text-indigo-400 font-bold">Smart Optimized</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Settings Panel */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Daily Limits Block */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="text-yellow-400" size={18} />
              Daily Safety Limits
            </h3>
            <p className="text-xs text-slate-500">
              Control the maximum rewards or attempts users can perform within a single 24-hour cycle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Max Daily Reward (₹)
                </label>
                <input
                  type="number"
                  value={settings.maxDailyRewardPerUser}
                  onChange={(e) => setSettings({ ...settings, maxDailyRewardPerUser: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Max Daily Tasks
                </label>
                <input
                  type="number"
                  value={settings.maxDailyTasks}
                  onChange={(e) => setSettings({ ...settings, maxDailyTasks: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Max Video Ads
                </label>
                <input
                  type="number"
                  value={settings.maxDailyVideoAds}
                  onChange={(e) => setSettings({ ...settings, maxDailyVideoAds: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Max Shortener Tasks
                </label>
                <input
                  type="number"
                  value={settings.maxDailyShortenerTasks}
                  onChange={(e) => setSettings({ ...settings, maxDailyShortenerTasks: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Max Daily Giveaways Participation
                </label>
                <input
                  type="number"
                  value={settings.maxDailyGiveaways}
                  onChange={(e) => setSettings({ ...settings, maxDailyGiveaways: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Budget & Abnormal Detection Block */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="text-indigo-400" size={18} />
              Smart Budgets & Abnormal Signals
            </h3>
            <p className="text-xs text-slate-500">
              System auto-sends instant claims to Pending Review once limits are hit, protecting platform reserves.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Daily Reward Budget (₹)
                </label>
                <input
                  type="number"
                  value={settings.dailyRewardBudget}
                  onChange={(e) => setSettings({ ...settings, dailyRewardBudget: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Monthly Reward Budget (₹)
                </label>
                <input
                  type="number"
                  value={settings.monthlyRewardBudget}
                  onChange={(e) => setSettings({ ...settings, monthlyRewardBudget: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Abnormal Daily Earn (₹)
                </label>
                <input
                  type="number"
                  value={settings.abnormalDailyEarningThreshold}
                  onChange={(e) => setSettings({ ...settings, abnormalDailyEarningThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Hourly Tasks Limit
                </label>
                <input
                  type="number"
                  value={settings.abnormalTasksHourlyThreshold}
                  onChange={(e) => setSettings({ ...settings, abnormalTasksHourlyThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Hourly Referrals Limit
                </label>
                <input
                  type="number"
                  value={settings.abnormalReferralsHourlyThreshold}
                  onChange={(e) => setSettings({ ...settings, abnormalReferralsHourlyThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Max Giveaway Wins
                </label>
                <input
                  type="number"
                  value={settings.abnormalGiveawayWinsThreshold}
                  onChange={(e) => setSettings({ ...settings, abnormalGiveawayWinsThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message and Save Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 mt-6">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-Optimized protection enabled. Parameters apply instantly in real-time.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {message && (
              <span className={`text-xs font-semibold ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {message.text}
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
