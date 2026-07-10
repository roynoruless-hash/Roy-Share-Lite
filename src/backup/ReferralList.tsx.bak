import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE } from "../config/api";

export default function ReferralList({ userId }: { userId: string }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/referral/list?userId=${userId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setList(json.referrals);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" /></div>;

  return (
    <div className="space-y-3">
      {list.map((r, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
            {r.referredName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{r.referredName}</div>
            <div className="text-[10px] text-slate-500">{r.joinDate}</div>
          </div>
          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${r.status === 'Commission Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {r.status}
          </div>
        </div>
      ))}
    </div>
  );
}
