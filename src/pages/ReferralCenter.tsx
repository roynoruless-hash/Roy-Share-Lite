import { useState, useEffect } from "react";
import { Copy, Users, Target, Award, TrendingUp, CheckCircle, Clock, DollarSign } from "lucide-react";
import { API_BASE } from "../config/api";
import { useTelegramAuth } from "../context/TelegramAuthContext";

export default function ReferralCenter({ user }: { user: any }) {
  const { loading: authLoading, isAuthenticated } = useTelegramAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secureLink, setSecureLink] = useState("");

  const fetchData = async () => {
    if (authLoading) {
      console.log("[ReferralCenter] Authentication is still in progress, skipping fetch.");
      return;
    }
    if (!user?.id) {
      console.error("[ReferralCenter] User information not found or missing ID.");
      setError("User information not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const statsRes = await fetch(`/api/referral/analytics?userId=${user.id}`);
      if (!statsRes.ok) throw new Error(`Failed to fetch analytics: ${statsRes.status}`);
      const statsData = await statsRes.json();

      const milestonesRes = await fetch(`/api/referral/milestones?userId=${user.id}`);
      if (!milestonesRes.ok) throw new Error(`Failed to fetch milestones: ${milestonesRes.status}`);
      const milestonesData = await milestonesRes.json();
      
      setStats(statsData);
      const milestonesArray = Array.isArray(milestonesData.milestones)
        ? milestonesData.milestones
        : Array.isArray(milestonesData)
        ? milestonesData
        : [];
      setMilestones(milestonesArray);

      // Fetch secure link
      try {
        const secureRes = await fetch(`/api/referral/secure-link?userId=${user.id}`);
        if (secureRes.ok) {
          const secureData = await secureRes.json();
          if (secureData.secureLink) {
            setSecureLink(secureData.secureLink);
          }
        }
      } catch (secErr) {
        console.error("Error loading secure link:", secErr);
      }
    } catch (err) {
      console.error("Error fetching referral data:", err);
      setError("Unable to load Referral Center. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (authLoading) return <div className="text-white text-center p-10">Authenticating... Please wait.</div>;
  if (loading) return <div className="text-white text-center p-10">Loading Referral Center...</div>;
  if (error) return (
    <div className="text-white text-center p-10 space-y-4">
      <p>{error}</p>
      <button onClick={fetchData} className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold">Retry</button>
    </div>
  );
  if (!stats) return <div className="text-white text-center p-10">No data available.</div>;

  const referralLink = secureLink || `https://www.royshare.online/ref/${stats.referralCode}`;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Referral Center</h1>
        <div className="bg-indigo-900/50 text-indigo-300 px-4 py-2 rounded-full font-bold">Level: {stats.currentLevel?.name || "Bronze"}</div>
      </header>

      {/* Overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
            {label: "Today", value: stats.todayCount || 0, icon: TrendingUp},
            {label: "Earnings", value: `₹${stats.totalEarnings || 0}`, icon: DollarSign},
            {label: "Approved", value: stats.approvedCount || 0, icon: CheckCircle},
            {label: "Pending", value: stats.pendingCount || 0, icon: Clock},
        ].map((s, i) => (
            <div key={i} className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <s.icon className="w-6 h-6 text-indigo-400 mb-2" />
                <p className="text-slate-400 text-xs">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
            </div>
        ))}
      </section>

      {/* Invite */}
      <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold">Invite Friends</h2>
        <div className="flex gap-2">
            <input readOnly value={referralLink} className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-indigo-400 text-sm" />
            <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopied(true); }} className="bg-indigo-600 p-3 rounded-xl"><Copy /></button>
        </div>
        {copied && <p className="text-emerald-400 text-xs">Copied to clipboard!</p>}
      </section>
      
      {/* Milestone Rewards */}
      <section>
        <h2 className="text-xl font-bold mb-4">Milestone Rewards</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {(Array.isArray(milestones) ? milestones : []).map(m => (
                <div key={m.referrals} className={`p-4 rounded-2xl text-center border ${stats.approvedCount >= m.referrals ? "bg-emerald-900 border-emerald-700" : "bg-slate-800 border-slate-700"}`}>
                    <Award className={`w-8 h-8 mx-auto mb-2 ${stats.approvedCount >= m.referrals ? "text-yellow-400" : "text-slate-500"}`} />
                    <p className="font-bold text-xl">{m.referrals}+</p>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
