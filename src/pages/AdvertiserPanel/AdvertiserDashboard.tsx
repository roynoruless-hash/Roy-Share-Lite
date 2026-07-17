import React, { useState, useEffect } from 'react';
import { Wallet, Activity, CheckCircle2, Clock, XCircle, TrendingUp, Users } from 'lucide-react';
import { API_BASE } from '../../config/api';

export default function AdvertiserDashboard({ advertiser }: { advertiser: any }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [rechargeAmount, setRechargeAmount] = useState(1000);

  useEffect(() => {
    fetch(`${API_BASE}/api/advertiser/${advertiser.id}/campaigns`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.campaigns);
        }
        setLoading(false);
      })
      .catch(e => setLoading(false));
  }, [advertiser.id]);

  const stats = [
    { label: 'Wallet Balance', value: `₹${advertiser.balance?.toFixed(2) || '0.00'}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'Running').length, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Pending Review', value: campaigns.filter(c => c.status === 'Waiting Admin Approval').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Completed Campaigns', value: campaigns.filter(c => c.status === 'Completed').length, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  
  
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/advertiser/${advertiser.id}/notifications`);
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (advertiser) {
      fetchNotifications();
    }
  }, [advertiser]);
  
  const handleRecharge = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/advertiser/wallet/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertiserId: advertiser.id, amount: rechargeAmount })
      });
      const data = await res.json();
      if (data.success) {
        alert("Wallet recharged successfully. Please login again or refresh to see balance update (mock feature).");
        setIsRechargeOpen(false);
      }
    } catch (e) {
      alert("Recharge failed");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={() => setIsNotifOpen(true)} className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              🔔
            </button>
            <button onClick={() => setIsRechargeOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition shadow-lg shadow-emerald-500/20">
          Recharge Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-400">{s.label}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">Recent Campaigns</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No campaigns found. Go to "Create Campaign" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Campaign Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <div className="font-bold text-sm text-white">{c.name}</div>
                      <a href={c.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">View Video</a>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{c.category || 'Uncategorized'}</span>
                    </td>
                    <td className="p-4 font-mono text-sm text-emerald-400">₹{c.totalAmount?.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        c.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400' :
                        c.status === 'Waiting Admin Approval' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    
      
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No notifications yet</div>
              ) : (
                notifications.map((n: any, idx) => (
                  <div key={idx} className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm">
                    <p className="text-white">{n.message}</p>
                    <span className="text-xs text-slate-500 mt-1 block">Just now</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
  
      {isRechargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Recharge Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                <input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsRechargeOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition">Cancel</button>
                <button onClick={handleRecharge} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">Pay Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
