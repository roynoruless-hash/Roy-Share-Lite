import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Shield, Award, Search, User, CheckCircle2, XCircle } from 'lucide-react';

export default function ReputationSystem() {
  const [search, setSearch] = useState("");

  const mockUsers = [
    { id: 1, name: "Ritik Rai", score: 98, level: "Diamond", trust: "Excellent", approved: 1240, rejected: 5, earnings: "₹4,520" },
    { id: 2, name: "John Doe", score: 75, level: "Silver", trust: "Good", approved: 150, rejected: 12, earnings: "₹450" },
    { id: 3, name: "Alice Smith", score: 45, level: "Bronze", trust: "Risky", approved: 20, rejected: 40, earnings: "₹60" },
    { id: 4, name: "Spammer 99", score: 10, level: "Bronze", trust: "Blocked", approved: 0, rejected: 100, earnings: "₹0" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="text-yellow-400" fill="currentColor" /> Reputation & Trust System</h1>
          <p className="text-slate-400 mt-1">Manage user levels, trust scores, and automated reputation rules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Diamond Users", count: 12, icon: Award, color: "text-cyan-400" },
          { label: "Platinum Users", count: 45, icon: Award, color: "text-purple-400" },
          { label: "Gold Users", count: 120, icon: Award, color: "text-yellow-400" },
          { label: "Risky/Blocked", count: 34, icon: Shield, color: "text-red-400" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center ${stat.color}`}>
              <stat.icon />
            </div>
            <div><p className="text-sm text-slate-400">{stat.label}</p><p className="text-2xl font-bold">{stat.count}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">User Profiles & Trust Scores</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white" />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-sm text-slate-400">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Reputation Score</th>
              <th className="p-4 font-medium">Level & Trust</th>
              <th className="p-4 font-medium">Approval Rate</th>
              <th className="p-4 font-medium">Earnings</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map(u => {
              const approvalRate = ((u.approved / (u.approved + u.rejected || 1)) * 100).toFixed(1);
              return (
              <tr key={u.id} className="border-t border-slate-800 hover:bg-slate-800/20">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><User size={14} /></div>
                  <span className="font-bold">{u.name}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{u.score}</span>
                    {u.score > 80 ? <TrendingUp className="text-emerald-400 w-4 h-4" /> : <TrendingDown className="text-red-400 w-4 h-4" />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded uppercase w-fit">{u.level}</span>
                    <span className={`text-xs ${u.trust === 'Excellent' ? 'text-emerald-400' : u.trust === 'Risky' || u.trust === 'Blocked' ? 'text-red-400' : 'text-yellow-400'}`}>{u.trust} Trust</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <span className="text-emerald-400">{u.approved} ✓</span> / <span className="text-red-400">{u.rejected} ✗</span>
                    <p className="text-xs text-slate-400 mt-1">{approvalRate}% Approved</p>
                  </div>
                </td>
                <td className="p-4 text-sm font-medium">{u.earnings}</td>
                <td className="p-4 flex gap-2">
                  <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition">Adjust Score</button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Reputation Engine Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-emerald-400 font-bold text-sm">Score Increases</h3>
            <div className="p-3 bg-slate-800 rounded-lg flex justify-between text-sm"><span className="text-slate-300">Approved Task</span><span className="font-bold text-emerald-400">+1 Point</span></div>
            <div className="p-3 bg-slate-800 rounded-lg flex justify-between text-sm"><span className="text-slate-300">Daily Activity Streak</span><span className="font-bold text-emerald-400">+2 Points</span></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-red-400 font-bold text-sm">Score Decreases</h3>
            <div className="p-3 bg-slate-800 rounded-lg flex justify-between text-sm"><span className="text-slate-300">Rejected Task</span><span className="font-bold text-red-400">-5 Points</span></div>
            <div className="p-3 bg-slate-800 rounded-lg flex justify-between text-sm"><span className="text-slate-300">Duplicate Submission Detected</span><span className="font-bold text-red-400">-15 Points</span></div>
            <div className="p-3 bg-slate-800 rounded-lg flex justify-between text-sm"><span className="text-slate-300">Spam / Fake Screenshot</span><span className="font-bold text-red-400">-30 Points</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
