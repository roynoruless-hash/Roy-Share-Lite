import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, CheckCircle2, XCircle, ShieldAlert, Search, Filter, CheckCircle } from 'lucide-react';

export default function YouTubeTasksAdmin() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  const tabs = [
    "Dashboard",
    "API & Google Login",
    "Campaigns",
    "AI Comments",
    "Reward Settings",
    "Budget",
    "Analytics",
    "Pending Review"
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? "bg-red-600 text-white" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "API & Google Login" && <ApiAndGoogleLogin />}
      {activeTab === "Campaigns" && <Campaigns />}
      {activeTab === "AI Comments" && <AiComments />}
      {activeTab === "Reward Settings" && <RewardSettings />}
      {activeTab === "Budget" && <Budget />}
      {activeTab === "Analytics" && <Analytics />}
                    {activeTab === "Pending Review" && <PendingReview />}
              {activeTab === "Approved" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Approved tasks table will be shown here.</p></div>}
              {activeTab === "Rejected" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Rejected tasks table will be shown here.</p></div>}
              {activeTab === "User History" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">User History search and data will be shown here.</p></div>}

            {activeTab === "Dashboard" && <Dashboard />}
      {activeTab === "Approved" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Approved tasks table will be shown here.</p></div>}
      {activeTab === "Rejected" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Rejected tasks table will be shown here.</p></div>}
      {activeTab === "User History" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">User History search and data will be shown here.</p></div>}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <h2 className="text-xl font-bold text-white mb-4">YouTube Tasks Dashboard</h2>
      <p className="text-slate-400">Welcome to the YouTube Tasks administration module. Select a tab above to configure settings, manage campaigns, or review submissions.</p>
    </div>
  );
}

function ApiAndGoogleLogin() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [status, setStatus] = useState("Disconnected");

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Google API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Google Client ID</label>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="Enter Client ID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Google Client Secret</label>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="Enter Client Secret" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Redirect URL</label>
            <input type="text" value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="e.g. https://yourdomain.com/api/youtube/callback" />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition">Connect Google</button>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Test Connection</button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition">Disconnect</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 mb-1">Status</span>
            <span className={`font-bold ${status === 'Connected' ? 'text-emerald-400' : 'text-red-400'}`}>{status}</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 mb-1">Connection Time</span>
            <span className="text-white font-medium">-</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 mb-1">Google Account Email</span>
            <span className="text-white font-medium">-</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Reset</button>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition">Save</button>
      </div>
    </div>
  );
}

function Campaigns() {
  const [videoUrl, setVideoUrl] = useState("");
  const [adsgramType, setAdsgramType] = useState("reward");
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">YouTube Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">YouTube Video URL</label>
            <div className="flex gap-2">
              <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="https://youtube.com/watch?v=..." />
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition whitespace-nowrap">Fetch Video</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Video Title</label>
                <input type="text" readOnly className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300" placeholder="Automatically fetched" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Channel Name</label>
                <input type="text" readOnly className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300" placeholder="Automatically fetched" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Duration</label>
                  <input type="text" readOnly className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300" placeholder="00:00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <input type="text" readOnly className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300" placeholder="Auto" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Thumbnail</label>
                <div className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-500">
                  Thumbnail Preview
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea readOnly className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 resize-none" placeholder="Automatically fetched"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">AI Detect (Category)</h2>
        <p className="text-sm text-slate-400 mb-4">Gemini automatically detects the category. You can edit this manually.</p>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
          <option>Gaming</option>
          <option>Education</option>
          <option>Technology</option>
          <option>Finance</option>
          <option>Entertainment</option>
          <option>Music</option>
          <option>Vlog</option>
          <option>News</option>
          <option>Motivation</option>
          <option>Health</option>
          <option>Other</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Campaign Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Campaign Name</label>
            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Total Participants</label>
            <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Watch Time Required (seconds)</label>
            <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Maximum Tasks Per User Per Day</label>
            <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Campaign Status</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
              <option>Draft</option>
              <option>Running</option>
              <option>Paused</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Adsgram Configuration</h2>
        <p className="text-sm text-slate-400 mb-4">Load configuration automatically from Adsgram Settings.</p>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Adsgram Type</label>
          <select value={adsgramType} onChange={e => setAdsgramType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
            <option value="reward">Reward</option>
            <option value="interstitial">Interstitial</option>
            <option value="task">Task</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Preview</button>
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Reset</button>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition">Save</button>
      </div>
    </div>
  );
}

function AiComments() {
  const [comments, setComments] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  
  const generateComments = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/youtube-tasks/generate-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      const data = await res.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };
  
  const updateComment = (index: number, val: string) => {
    const newComments = [...comments];
    newComments[index] = val;
    setComments(newComments);
  };
  
  const deleteComment = (index: number) => {
    const newComments = [...comments];
    newComments.splice(index, 1);
    setComments(newComments);
  };
  
  const copyAll = () => {
    navigator.clipboard.writeText(comments.join("\\n"));
    alert("Comments copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">AI Comment Generator</h2>
          <button 
            onClick={generateComments} 
            disabled={generating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? "Generating..." : "✨ Generate 20 Unique Comments"}
          </button>
        </div>
        
        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
          {comments.length === 0 ? (
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-slate-400">
               No comments generated yet. Click generate above.
             </div>
          ) : (
            comments.map((comment, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="mt-2 text-slate-500 font-mono text-xs">{idx + 1}.</div>
                <textarea
                  value={comment}
                  onChange={(e) => updateComment(idx, e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 resize-none h-12"
                />
                <button onClick={() => deleteComment(idx)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition">
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={generateComments} disabled={generating} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Generate Again</button>
          <button onClick={() => setComments([...comments, ""])} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Add New Comment</button>
          <button onClick={copyAll} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Copy All</button>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <button onClick={() => setComments([])} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Reset</button>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition">Save Comments</button>
      </div>
    </div>
  );
}

function RewardSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Reward Settings</h2>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Reward Amount per Task (₹)</label>
          <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="0.50" />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Reset</button>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition">Save</button>
      </div>
    </div>
  );
}

function Budget() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Budget Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Daily Budget (₹)</label>
            <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Auto Stop Campaign</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
              <option value="on">ON (Stop when budget reaches 0)</option>
              <option value="off">OFF</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 mb-1">Remaining Budget</span>
            <span className="text-xl font-bold text-white">₹0.00</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 mb-1">Spent Today</span>
            <span className="text-xl font-bold text-white">₹0.00</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 mb-1">Remaining Participants</span>
            <span className="text-xl font-bold text-white">0</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition">Reset</button>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition">Save</button>
      </div>
    </div>
  );
}

function Analytics() {
  const stats = [
    { label: "Campaigns", value: "0" },
    { label: "Budget Used", value: "₹0.00" },
    { label: "Budget Remaining", value: "₹0.00" },
    { label: "Participants", value: "0" },
    { label: "Pending Review", value: "0" },
    { label: "Approved", value: "0" },
    { label: "Rejected", value: "0" },
    { label: "Average Cost", value: "₹0.00" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Analytics Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
              <span className="block text-xs text-slate-400 mb-1">{stat.label}</span>
              <span className="text-xl font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingReview() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Pending Review Tasks</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-4">No tasks pending review.</p>
        </div>
      </div>
    </div>
  );
}
