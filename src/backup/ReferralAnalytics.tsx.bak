import { useState, useEffect } from "react";
import { Loader2, Users, DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { API_BASE } from "../config/api";
import { motion } from "motion/react";

export default function ReferralAnalytics({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/referral/analytics?userId=${userId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.analytics);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Approved Refs</div>
          <div className="text-2xl font-black text-white">{data.totalReferrals}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Total Earnings</div>
          <div className="text-2xl font-black text-emerald-400">₹{data.lifetimeReferralEarnings.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400">Level: {data.levelName}</span>
            <span className="text-xs font-bold text-indigo-400">{data.levelProgress}%</span>
        </div>
        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
            <motion.div initial={{width: 0}} animate={{width: `${data.levelProgress}%`}} className="h-full bg-indigo-500" />
        </div>
        <div className="text-xs text-slate-500 mt-2">Next Level: {data.nextLevelName}</div>
      </div>
    </div>
  );
}
