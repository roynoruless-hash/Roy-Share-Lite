import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, MousePointerClick, Calendar, Globe, Monitor, Smartphone, Layout, ArrowRight } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const LinkAnalyticsPage = ({ linkId, onBack }: { linkId: string, onBack: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const q = query(collection(db, "shortener_analytics"), where("linkId", "==", linkId));
        const snap = await getDocs(q);
        const records = snap.docs.map(d => d.data()).filter(d => d.type === "view");

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let clicksToday = 0;
        let clicksYesterday = 0;
        const countries: Record<string, number> = {};
        const devices: Record<string, number> = {};
        const browsers: Record<string, number> = {};
        const osList: Record<string, number> = {};
        const referrers: Record<string, number> = {};

        records.forEach(r => {
          const dStr = r.createdAt?.split('T')[0];
          if (dStr === today) clicksToday++;
          if (dStr === yesterday) clicksYesterday++;

          if (r.country) countries[r.country] = (countries[r.country] || 0) + 1;
          if (r.device) devices[r.device] = (devices[r.device] || 0) + 1;
          if (r.browser) browsers[r.browser] = (browsers[r.browser] || 0) + 1;
          if (r.os) osList[r.os] = (osList[r.os] || 0) + 1;
          if (r.referrer) referrers[r.referrer] = (referrers[r.referrer] || 0) + 1;
        });

        setStats({
          total: records.length,
          today: clicksToday,
          yesterday: clicksYesterday,
          countries: Object.entries(countries).sort((a, b) => b[1] - a[1]),
          devices: Object.entries(devices).sort((a, b) => b[1] - a[1]),
          browsers: Object.entries(browsers).sort((a, b) => b[1] - a[1]),
          os: Object.entries(osList).sort((a, b) => b[1] - a[1]),
          referrers: Object.entries(referrers).sort((a, b) => b[1] - a[1]),
        });
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderList = (title: string, icon: any, data: [string, number][]) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold">
        {React.createElement(icon, { className: "w-4 h-4 text-indigo-400" })}
        {title}
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-slate-500 text-xs">No data yet.</p>
        ) : (
          data.slice(0, 5).map(([key, val], i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-slate-400">{key || "Unknown"}</span>
              <span className="font-mono text-white font-bold">{val}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 max-w-4xl mx-auto space-y-6 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold">Link Analytics</h1>
        <p className="text-slate-400 text-sm">Real-time statistics for link {linkId}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
          <p className="text-indigo-400 text-xs font-bold uppercase mb-1">Total Clicks</p>
          <h2 className="text-3xl font-bold">{stats?.total || 0}</h2>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Today</p>
          <h2 className="text-3xl font-bold">{stats?.today || 0}</h2>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
          <p className="text-blue-400 text-xs font-bold uppercase mb-1">Yesterday</p>
          <h2 className="text-3xl font-bold">{stats?.yesterday || 0}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderList("Countries", Globe, stats?.countries || [])}
        {renderList("Devices", Smartphone, stats?.devices || [])}
        {renderList("Browsers", Layout, stats?.browsers || [])}
        {renderList("Operating Systems", Monitor, stats?.os || [])}
        {renderList("Referrers", ArrowRight, stats?.referrers || [])}
      </div>
    </div>
  );
};

export default LinkAnalyticsPage;
