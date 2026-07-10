import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  MousePointerClick, 
  Calendar, 
  Globe, 
  Monitor, 
  Smartphone, 
  Layout, 
  ArrowRight,
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface UrlShortenerAnalyticsPageProps {
  linkId: string;
  onBack: () => void;
}

export const UrlShortenerAnalyticsPage: React.FC<UrlShortenerAnalyticsPageProps> = ({ linkId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'7days' | '30days'>('7days');
  const [linkInfo, setLinkInfo] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch short link details
      const linkRef = doc(db, "links", linkId);
      const linkSnap = await getDoc(linkRef);
      if (linkSnap.exists()) {
        setLinkInfo(linkSnap.data());
      }

      // 2. Query analytics collection where type == "view"
      const q = query(
        collection(db, "shortener_analytics"), 
        where("linkId", "==", linkId)
      );
      const snap = await getDocs(q);
      const records = snap.docs
        .map(d => d.data())
        .filter(d => d.type === "view" || !d.type); // "view" indicates page clicks

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let clicksToday = 0;
      let clicksYesterday = 0;
      const countries: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      const osList: Record<string, number> = {};
      const referrers: Record<string, number> = {};

      // Helper to generate empty dates maps
      const getDatesMap = (n: number) => {
        const map: Record<string, number> = {};
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const dStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          map[dStr] = 0;
        }
        return map;
      };

      const sevenDaysMap = getDatesMap(7);
      const thirtyDaysMap = getDatesMap(30);

      // Process raw view records
      records.forEach(r => {
        const createdAtStr = r.createdAt || "";
        const rDateStr = createdAtStr.split('T')[0];
        
        // Calculate Today vs Yesterday clicks
        if (rDateStr === today) clicksToday++;
        if (rDateStr === yesterday) clicksYesterday++;

        // Categorize by Countries, Devices, Browsers, Referrers
        if (r.country) countries[r.country] = (countries[r.country] || 0) + 1;
        if (r.device) devices[r.device] = (devices[r.device] || 0) + 1;
        if (r.browser) browsers[r.browser] = (browsers[r.browser] || 0) + 1;
        
        // Infer OS from device or browser if not present
        let os = r.os;
        if (!os && r.device) {
          const devLower = r.device.toLowerCase();
          if (devLower.includes("windows")) os = "Windows";
          else if (devLower.includes("android")) os = "Android";
          else if (devLower.includes("iphone") || devLower.includes("ipad") || devLower.includes("ios")) os = "iOS";
          else if (devLower.includes("mac") || devLower.includes("macos")) os = "macOS";
          else if (devLower.includes("linux")) os = "Linux";
          else os = "Unknown";
        }
        if (os) osList[os] = (osList[os] || 0) + 1;

        const rawReferrer = r.referrer || "Direct";
        const cleanReferrer = rawReferrer.trim() === "" ? "Direct" : rawReferrer;
        referrers[cleanReferrer] = (referrers[cleanReferrer] || 0) + 1;

        // Bucket chronologically for timeline charts
        if (createdAtStr) {
          const rDate = new Date(createdAtStr);
          const formattedLabel = rDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          
          if (sevenDaysMap[formattedLabel] !== undefined) {
            sevenDaysMap[formattedLabel]++;
          }
          if (thirtyDaysMap[formattedLabel] !== undefined) {
            thirtyDaysMap[formattedLabel]++;
          }
        }
      });

      // Prepare timelines as ordered key-value array list
      const timeline7Days = Object.entries(sevenDaysMap);
      const timeline30Days = Object.entries(thirtyDaysMap);

      setStats({
        total: records.length,
        today: clicksToday,
        yesterday: clicksYesterday,
        countries: Object.entries(countries).sort((a, b) => b[1] - a[1]),
        devices: Object.entries(devices).sort((a, b) => b[1] - a[1]),
        browsers: Object.entries(browsers).sort((a, b) => b[1] - a[1]),
        os: Object.entries(osList).sort((a, b) => b[1] - a[1]),
        referrers: Object.entries(referrers).sort((a, b) => b[1] - a[1]),
        timeline7: timeline7Days,
        timeline30: timeline30Days,
        rawRecords: records
      });

    } catch (err) {
      console.error("Error fetching URL shortener analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (linkId) {
      fetchAnalytics();
    }
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading Link Analytics...</p>
      </div>
    );
  }

  // Active Timeline Selection
  const activeTimeline = activeTab === '7days' ? stats?.timeline7 : stats?.timeline30;
  const maxClicks = Math.max(...(activeTimeline || []).map(([_, count]: any) => count), 1);

  const renderProgressList = (title: string, icon: any, data: [string, number][], totalSum: number) => (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
        {React.createElement(icon, { className: "w-4 h-4 text-indigo-400" })}
        <span>{title}</span>
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-slate-500 text-xs">No activity logged yet.</p>
        ) : (
          data.slice(0, 5).map(([key, count], i) => {
            const percentage = Math.round((count / (totalSum || 1)) * 100);
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate pr-4">{key || "Direct/Unknown"}</span>
                  <span className="font-bold text-slate-200">{count} clicks ({percentage}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Url Shortener Analytics</h2>
          <p className="text-xs text-slate-400">Detailed click records for ID {linkId}</p>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Link Meta Details Card */}
        {linkInfo && (
          <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Link</p>
            <div className="space-y-1">
              <h3 className="font-mono text-sm font-bold text-indigo-400 select-all leading-snug">{linkInfo.shortUrl}</h3>
              <p className="text-xs text-slate-400 truncate">
                Original: <span className="text-slate-300 font-mono text-[10px]">{linkInfo.originalUrl || linkInfo.destinationUrl}</span>
              </p>
            </div>
          </div>
        )}

        {/* Core Stats Overview Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-1">Total Clicks</p>
            <h2 className="text-2xl md:text-3xl font-black">{stats?.total || 0}</h2>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">Today</p>
            <h2 className="text-2xl md:text-3xl font-black">{stats?.today || 0}</h2>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-wider mb-1">Yesterday</p>
            <h2 className="text-2xl md:text-3xl font-black">{stats?.yesterday || 0}</h2>
          </div>
        </div>

        {/* Interactive Timeline Chart card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Click Timeline</span>
            </div>
            {/* Range filters */}
            <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('7days')}
                className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-colors ${
                  activeTab === '7days' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setActiveTab('30days')}
                className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-colors ${
                  activeTab === '30days' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Graphical timeline representation */}
          <div className="space-y-4">
            <div className="h-44 flex items-end justify-between gap-1.5 pt-6 border-b border-slate-800 px-2">
              {activeTimeline && activeTimeline.map(([dateLabel, clicksCount]: any, i: number) => {
                const heightPercentage = Math.max((clicksCount / maxClicks) * 100, 3); // minimum visible height
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="relative w-full flex justify-center">
                      {/* Tooltip on hover */}
                      <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                        {clicksCount} clicks
                      </span>
                      {/* Bar */}
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          clicksCount > 0 ? "bg-indigo-500 group-hover:bg-indigo-400" : "bg-slate-950 border border-slate-850"
                        }`}
                        style={{ height: `${heightPercentage}%`, minHeight: '3px' }}
                      ></div>
                    </div>
                    {/* Bottom date indicator */}
                    <span className="text-[8px] text-slate-500 group-hover:text-slate-300 transform font-mono mt-2 truncate w-full text-center">
                      {dateLabel.split(' ')[0]} {/* only show day digit to avoid crowding */}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Timeline day breakdown list */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Detailed Log ({activeTab === '7days' ? "Last 7 Days" : "Last 30 Days"})</p>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-850/50 bg-slate-950 border border-slate-850 rounded-xl">
                {activeTimeline && [...activeTimeline].reverse().map(([dateLabel, clicksCount]: any, i: number) => (
                  <div key={i} className="p-3 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {dateLabel}
                    </span>
                    <span className="font-mono font-bold text-slate-200">{clicksCount} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Geographic, Tech & Source distribution lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderProgressList("Top Countries", Globe, stats?.countries || [], stats?.total || 1)}
          {renderProgressList("Top Devices", Smartphone, stats?.devices || [], stats?.total || 1)}
          {renderProgressList("Top Browsers", Layout, stats?.browsers || [], stats?.total || 1)}
          {renderProgressList("Operating Systems", Monitor, stats?.os || [], stats?.total || 1)}
          {renderProgressList("Top Traffic Referrers", ArrowRight, stats?.referrers || [], stats?.total || 1)}
        </div>
      </main>
    </div>
  );
};
