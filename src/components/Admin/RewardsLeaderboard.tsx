import React, { useState } from 'react';
import { Trophy, Medal, Gift, Target, Zap, Activity } from 'lucide-react';

export default function RewardsLeaderboard() {
  const [activeTab, setActiveTab] = useState("Leaderboard");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="text-yellow-400" /> Rewards & Leaderboard</h1>
          <p className="text-slate-400 mt-1">Manage platform gamification, achievements, bonuses, and view insights.</p>
        </div>
        <div className="flex gap-2">
          {["Leaderboard", "Achievements", "Bonus System", "AI Insights"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === "Leaderboard" && <LeaderboardView />}
      {activeTab === "Achievements" && <AchievementsView />}
      {activeTab === "Bonus System" && <BonusSystemView />}
      {activeTab === "AI Insights" && <InsightsView />}
    </div>
  );
}

function LeaderboardView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Medal className="text-yellow-400" /> Top Earners (Monthly)</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 1 ? 'bg-yellow-500/20 text-yellow-400' : i === 2 ? 'bg-slate-300/20 text-slate-300' : i === 3 ? 'bg-amber-700/20 text-amber-500' : 'bg-slate-700 text-slate-400'}`}>
                  #{i}
                </div>
                <span className="font-bold text-white">User {i}892</span>
              </div>
              <span className="font-bold text-emerald-400">₹{10000 - i * 1500}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Star className="text-blue-400" /> Top Reputation</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400">#{i}</div>
                <span className="font-bold text-white">Worker {i}X</span>
              </div>
              <span className="font-bold text-blue-400">{100 - i * 2} Score</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Star(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

function AchievementsView() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-6">Achievement Badges Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: "First Task", req: "1 Approved Task", reward: "₹5 Bonus" },
          { name: "Rising Star", req: "10 Approved Tasks", reward: "₹50 Bonus" },
          { name: "Task Master", req: "100 Approved Tasks", reward: "₹500 Bonus + Silver Level" },
          { name: "Elite Worker", req: "500 Approved Tasks", reward: "₹2500 Bonus + Gold Level" },
          { name: "Legendary", req: "1000 Approved Tasks", reward: "₹5000 Bonus + Platinum Level" },
          { name: "Event Badges", req: "Special Festival Participation", reward: "Custom Config" },
        ].map((ach, idx) => (
          <div key={idx} className="bg-slate-800 border border-slate-700 p-4 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Target size={48} /></div>
            <h3 className="font-bold text-lg text-white">{ach.name}</h3>
            <p className="text-sm text-slate-400 mt-1">Requirement: {ach.req}</p>
            <div className="mt-4 inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg">Reward: {ach.reward}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BonusSystemView() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-bold">Automated Bonus Engine</h2>
      <div className="space-y-4">
        {[
          { title: "Daily Login Bonus", enabled: true, amount: "₹1" },
          { title: "Weekly Active Bonus", enabled: true, amount: "₹10 (Requires 5 active days)" },
          { title: "Top Worker Monthly Bonus", enabled: false, amount: "₹1000 for top 10" },
          { title: "Festival Bonus Multiplier", enabled: false, amount: "1.5x on all earnings (Diwali/Holi)" },
        ].map((bonus, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Gift size={20} /></div>
              <div>
                <p className="font-bold text-white">{bonus.title}</p>
                <p className="text-sm text-emerald-400">{bonus.amount}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={bonus.enabled} />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Activity className="text-indigo-400" /> Platform AI Insights</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-emerald-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Highest Approval Rate Campaign</p>
            <p className="text-lg font-bold text-white mt-1">"Crypto Tokens Review 2026" (98.5%)</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-red-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Most Rejected Campaign</p>
            <p className="text-lg font-bold text-white mt-1">"Sign up for Binance" (45.2% rejected - Blur)</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-blue-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Most Trusted Worker</p>
            <p className="text-lg font-bold text-white mt-1">Ritik Rai (Reputation: 98)</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-yellow-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Highest Fraud Risk Network</p>
            <p className="text-lg font-bold text-white mt-1">IP Range: 104.28.x.x (VPN Detected)</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <Zap className="w-16 h-16 text-indigo-400 mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white">AI Health Analysis</h3>
        <p className="text-slate-400 mt-2 max-w-sm">The platform economy is currently stable. Fraud attempts are up by 4% this week, but the AI Moderation engine has successfully intercepted 99.2% of them.</p>
        <button className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition">Generate Full Report</button>
      </div>
    </div>
  );
}
