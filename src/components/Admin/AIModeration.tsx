import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, ShieldAlert, CheckCircle2, AlertTriangle, Eye, Settings, RefreshCw, XCircle } from 'lucide-react';

export default function AIModeration() {
  const [activeTab, setActiveTab] = useState("Pending Review");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-400" /> AI Moderation Center</h1>
          <p className="text-slate-400 mt-1">Automatically analyzes submissions for fraud, blurriness, and edits.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("Pending Review")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "Pending Review" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>Pending Review</button>
          <button onClick={() => setActiveTab("Settings")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "Settings" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>Rules & Settings</button>
        </div>
      </div>

      {activeTab === "Pending Review" && <PendingReview />}
      {activeTab === "Settings" && <ModerationSettings />}
    </div>
  );
}

function PendingReview() {
  // Mock data for AI analysis
  const [submissions, setSubmissions] = useState([
    { id: "sub_1", user: "Ritik Rai", task: "Watch YouTube Video", score: 98, status: "Very likely valid", checks: { blur: "Pass", duplicate: "Pass", crop: "Pass", context: "Pass" }, time: "2 mins ago" },
    { id: "sub_2", user: "John Doe", task: "Subscribe Channel", score: 65, status: "Needs manual review", checks: { blur: "Fail", duplicate: "Pass", crop: "Warning", context: "Pass" }, time: "15 mins ago" },
    { id: "sub_3", user: "Alice Smith", task: "Join Telegram Group", score: 20, status: "Suspicious", checks: { blur: "Pass", duplicate: "Fail", crop: "Fail", context: "Fail" }, time: "1 hour ago" },
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 /></div>
          <div><p className="text-sm text-slate-400">Auto-Approved (24h)</p><p className="text-2xl font-bold">1,245</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><AlertTriangle /></div>
          <div><p className="text-sm text-slate-400">Requires Manual Review</p><p className="text-2xl font-bold">84</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"><ShieldAlert /></div>
          <div><p className="text-sm text-slate-400">Auto-Rejected (24h)</p><p className="text-2xl font-bold">320</p></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-sm text-slate-400">
              <th className="p-4 font-medium">User & Task</th>
              <th className="p-4 font-medium">AI Confidence Score</th>
              <th className="p-4 font-medium">Detailed Checks</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, idx) => (
              <tr key={idx} className="border-t border-slate-800 hover:bg-slate-800/20">
                <td className="p-4">
                  <p className="font-bold">{sub.user}</p>
                  <p className="text-xs text-slate-400">{sub.task} • {sub.time}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${sub.score >= 90 ? "bg-emerald-500/20 text-emerald-400" : sub.score >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}
                    `}>
                      {sub.score}%
                    </div>
                    <span className="text-sm">{sub.status}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {Object.entries(sub.checks).map(([key, val]) => (
                      <span key={key} title={key} className={`px-2 py-1 rounded text-xs font-mono uppercase
                        ${val === 'Pass' ? 'bg-emerald-500/10 text-emerald-400' : val === 'Fail' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}
                      `}>
                        {key.substring(0,4)}: {val}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 flex gap-2">
                  <button className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition" title="Approve"><CheckCircle2 size={16} /></button>
                  <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" title="Reject"><XCircle size={16} /></button>
                  <button className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition" title="View Image"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModerationSettings() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-indigo-400" /> AI Vision Settings</h2>
        <div className="space-y-4">
          {[
            { name: "Blurry Image Detection", desc: "Rejects images that are out of focus" },
            { name: "Cropped Screenshot Detection", desc: "Flags images missing status bars or expected dimensions" },
            { name: "Duplicate Detection", desc: "Uses perceptual hashing to block reused images" },
            { name: "Empty Screenshot Detection", desc: "Flags pure black or solid color images" },
            { name: "Edited Screenshot Detection", desc: "Basic checks for text overlays or spliced elements" },
            { name: "Context/Wrong Video Detection", desc: "Verifies the correct video/task is visible" },
          ].map((setting, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <div>
                <p className="font-medium text-slate-200">{setting.name}</p>
                <p className="text-xs text-slate-400">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><RefreshCw className="text-emerald-400" /> Auto-Approval Rules</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <label className="block text-sm font-medium text-slate-300 mb-2">Confidence Score Threshold for Auto-Approve</label>
            <input type="range" min="50" max="100" defaultValue="95" className="w-full accent-emerald-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>50%</span><span>Current: 95%</span><span>100%</span>
            </div>
          </div>
          
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <label className="block text-sm font-medium text-slate-300 mb-2">Auto-Approve ONLY if Reputation Score is above:</label>
            <input type="number" defaultValue="80" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          </div>

          <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-200">Require Manual Review for First Task</p>
              <p className="text-xs text-slate-400">New users always get manually reviewed</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
        <button className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition">Save AI Rules</button>
      </div>
    </div>
  );
}
