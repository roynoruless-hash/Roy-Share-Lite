import React, { useState } from 'react';
import { ClipboardList, Download, Calendar, Filter, Search } from 'lucide-react';

export default function AuditCenter() {
  const [filter, setFilter] = useState("All");

  const mockLogs = [
    { id: 1, action: "Wallet Credit", details: "₹50 credited to user Ritik Rai for YouTube Task", user: "Ritik Rai", admin: "System", date: "2026-07-17", time: "14:32:10", ip: "192.168.1.1" },
    { id: 2, action: "Task Approved", details: "Approved YouTube submission ID #8492", user: "John Doe", admin: "Admin1", date: "2026-07-17", time: "13:15:00", ip: "10.0.0.5" },
    { id: 3, action: "Campaign Created", details: "Advertiser created campaign 'Crypto Tokens'", user: "CryptoKing", admin: "-", date: "2026-07-16", time: "09:00:22", ip: "172.16.0.4" },
    { id: 4, action: "Task Rejected", details: "Rejected submission: Blur detected", user: "Alice Smith", admin: "AI System", date: "2026-07-16", time: "08:45:11", ip: "System" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="text-blue-400" /> Global Audit Center</h1>
          <p className="text-slate-400 mt-1">Immutable ledger of all platform activities, transactions, and moderation events.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition">
            <Download size={16} /> Export CSV
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input type="text" placeholder="Search logs (ID, User, Action)..." className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white" />
        </div>
        <div className="flex gap-2">
          <select className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
            <option>All Actions</option>
            <option>Task Approvals</option>
            <option>Task Rejections</option>
            <option>Wallet Credits</option>
            <option>Campaign Creations</option>
          </select>
          <select className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-sm text-slate-400">
              <th className="p-4 font-medium">Timestamp</th>
              <th className="p-4 font-medium">Action type</th>
              <th className="p-4 font-medium">Details</th>
              <th className="p-4 font-medium">Actor (User/Admin)</th>
              <th className="p-4 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map(log => (
              <tr key={log.id} className="border-t border-slate-800 hover:bg-slate-800/20 text-sm">
                <td className="p-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    <span>{log.date}</span>
                    <span className="text-slate-500">{log.time}</span>
                  </div>
                </td>
                <td className="p-4 font-bold text-slate-200">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.action.includes('Approved') || log.action.includes('Credit') ? 'bg-emerald-500/10 text-emerald-400' :
                    log.action.includes('Rejected') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>{log.action}</span>
                </td>
                <td className="p-4 text-slate-300">{log.details}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-white">{log.user}</span>
                    <span className="text-xs text-slate-500">By: {log.admin}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
