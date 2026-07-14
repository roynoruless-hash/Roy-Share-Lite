const fs = require('fs');

const code = `import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2, Video, BarChart3, Save, CheckCircle2, Loader2, PlayCircle, Settings, Calculator, ShieldCheck } from "lucide-react";

export default function VideoAdsAdminView() {
  const [activeTab, setActiveTab] = useState("Tasks");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab === "Tasks") fetchTasks();
    if (activeTab === "Analytics") fetchAnalytics();
  }, [activeTab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(\`\${API_BASE}/api/admin/video-tasks\`, {
        headers: { "Authorization": \`Bearer \${localStorage.getItem("admin_token")}\` }
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(\`\${API_BASE}/api/admin/video-analytics\`, {
        headers: { "Authorization": \`Bearer \${localStorage.getItem("admin_token")}\` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingAnalytics(false);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rewardAmount = autoCalcReward();
      const platformProfit = autoCalcPlatformProfit();
      
      const payload = {
        ...editingTask,
        rewardAmount,
        platformProfit
      };
      
      const res = await fetch(\`\${API_BASE}/api/admin/video-tasks\`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${localStorage.getItem("admin_token")}\`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Task saved successfully!");
        setEditingTask(null);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save task");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(\`\${API_BASE}/api/admin/video-tasks/\${id}\`, {
        method: "DELETE",
        headers: { "Authorization": \`Bearer \${localStorage.getItem("admin_token")}\` }
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete task");
    }
  };

  const handleCreateNew = () => {
    setEditingTask({
      name: "",
      description: "",
      rules: "",
      claimProcess: "",
      thumbnail: "",
      countdown: 30,
      dailyLimit: 1,
      perUserLimit: 10,
      cpm: 0,
      estimatedViews: 1000,
      profitPercentage: 30,
      clickAdillaScript: "",
      callbackUrl: "https://your-domain.com/api/video-tasks/postback",
      apiEndpoint: "https://api.clickadilla.com",
      secretKey: "",
      status: "Active",
    });
  };

  const autoCalcTotalRev = () => {
    if (!editingTask) return 0;
    const cpm = parseFloat(editingTask.cpm) || 0;
    const estimatedViews = parseFloat(editingTask.estimatedViews) || 0;
    return (cpm / 1000) * estimatedViews;
  };

  const autoCalcReward = () => {
    if (!editingTask) return 0;
    const cpm = parseFloat(editingTask.cpm) || 0;
    const profitPercentage = parseFloat(editingTask.profitPercentage) || 0;
    return (cpm / 1000) * (1 - (profitPercentage / 100));
  };

  const autoCalcPlatformProfit = () => {
    if (!editingTask) return 0;
    const totalRev = autoCalcTotalRev();
    const profitPercentage = parseFloat(editingTask.profitPercentage) || 0;
    return totalRev * (profitPercentage / 100);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/50">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-500" />
            Video Ads Task System
          </h2>
          <p className="text-slate-400 mt-1">Manage ClickAdilla integration and view analytics</p>
        </div>
        <div className="flex bg-slate-800 rounded-xl p-1">
          {["Tasks", "Analytics"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={\`px-6 py-2.5 rounded-lg font-bold text-sm transition-all \${activeTab === tab ? "bg-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}\`}
            >
              {tab === "Tasks" && <Settings className="w-4 h-4 inline mr-2" />}
              {tab === "Analytics" && <BarChart3 className="w-4 h-4 inline mr-2" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "Tasks" && !editingTask && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Video Ad Tasks</h3>
              <button onClick={handleCreateNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Create Task
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                <Video className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400 font-medium">No video tasks configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tasks.map(task => (
                  <div key={task.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          {task.name}
                          <span className={\`text-xs px-2 py-0.5 rounded-full font-bold \${task.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}\`}>
                            {task.status || "Active"}
                          </span>
                        </h4>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingTask(task)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-400 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-700/50">
                        <div className="text-slate-500 text-xs font-bold mb-0.5">Reward</div>
                        <div className="text-emerald-400 font-mono font-bold">₹{Number(task.rewardAmount).toFixed(4)}</div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-700/50">
                        <div className="text-slate-500 text-xs font-bold mb-0.5">Duration</div>
                        <div className="text-white font-bold">{task.countdown}s</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Tasks" && editingTask && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-500" />
                {editingTask.id ? "Edit Video Task" : "Create Video Task"}
              </h3>
              <button onClick={() => setEditingTask(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="space-y-5">
                  <h4 className="text-lg font-bold text-white border-b border-slate-700 pb-2">General Info</h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Task Name</label>
                    <input required type="text" value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Description</label>
                    <input required type="text" value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Thumbnail URL (Optional)</label>
                    <input type="text" value={editingTask.thumbnail} onChange={e => setEditingTask({...editingTask, thumbnail: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="https://" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Status</label>
                      <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Countdown (sec)</label>
                      <input required type="number" min="0" value={editingTask.countdown} onChange={e => setEditingTask({...editingTask, countdown: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Daily Limit</label>
                      <input required type="number" min="0" value={editingTask.dailyLimit} onChange={e => setEditingTask({...editingTask, dailyLimit: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Per User Limit</label>
                      <input required type="number" min="0" value={editingTask.perUserLimit} onChange={e => setEditingTask({...editingTask, perUserLimit: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Rules (Rich Text/HTML)</label>
                    <textarea rows={3} value={editingTask.rules} onChange={e => setEditingTask({...editingTask, rules: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500" placeholder="<ul><li>Watch full video</li></ul>" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Claim Process (Rich Text/HTML)</label>
                    <textarea rows={3} value={editingTask.claimProcess} onChange={e => setEditingTask({...editingTask, claimProcess: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500" placeholder="<p>Click Watch, wait 30s...</p>" />
                  </div>
                </div>

                {/* Integration & Economics */}
                <div className="space-y-6">
                  <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Calculator className="w-32 h-32" />
                    </div>
                    <h4 className="text-emerald-400 font-bold flex items-center gap-2 border-b border-emerald-500/20 pb-2"><Calculator className="w-4 h-4" /> Reward Settings</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-emerald-300 mb-1">CPM (₹)</label>
                        <input type="number" step="0.01" required value={editingTask.cpm} onChange={e => setEditingTask({...editingTask, cpm: e.target.value})} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-emerald-300 mb-1">Est. Views</label>
                        <input type="number" required value={editingTask.estimatedViews} onChange={e => setEditingTask({...editingTask, estimatedViews: e.target.value})} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-emerald-300 mb-1">Profit %</label>
                        <input type="number" step="1" max="100" min="0" required value={editingTask.profitPercentage} onChange={e => setEditingTask({...editingTask, profitPercentage: e.target.value})} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-400">Total Est. Revenue</div>
                        <div className="text-white font-mono font-bold">₹{autoCalcTotalRev().toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-400">Platform Profit</div>
                        <div className="text-emerald-400 font-mono font-bold">₹{autoCalcPlatformProfit().toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 col-span-2">
                        <div className="text-xs text-slate-400">Reward Per View / User</div>
                        <div className="text-blue-400 text-xl font-mono font-black">₹{autoCalcReward().toFixed(4)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-blue-400 font-bold flex items-center gap-2 border-b border-blue-500/20 pb-2"><ShieldCheck className="w-4 h-4" /> ClickAdilla Integration</h4>
                    <div>
                      <label className="block text-xs font-bold text-blue-300 mb-1">ClickAdilla JS Script</label>
                      <textarea rows={6} required value={editingTask.clickAdillaScript} onChange={e => setEditingTask({...editingTask, clickAdillaScript: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-xl px-4 py-3 text-emerald-400 font-mono text-xs focus:outline-none focus:border-blue-400" placeholder="<script>...</script>" />
                      <p className="text-xs text-slate-500 mt-1">Paste the exact JS snippet from ClickAdilla. Will be safely injected.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-300 mb-1">Callback URL</label>
                      <input type="text" value={editingTask.callbackUrl} onChange={e => setEditingTask({...editingTask, callbackUrl: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-blue-300 mb-1">API Endpoint</label>
                        <input type="text" value={editingTask.apiEndpoint} onChange={e => setEditingTask({...editingTask, apiEndpoint: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-300 mb-1">Secret Key</label>
                        <input type="password" value={editingTask.secretKey} onChange={e => setEditingTask({...editingTask, secretKey: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400" placeholder="Optional" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-800">
                <button type="submit" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-blue-500/20 text-lg">
                  <Save className="w-6 h-6" /> Save Video Task
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === "Analytics" && (
          <div className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="text-slate-400 text-sm font-bold mb-2">Total Views</div>
                    <div className="text-2xl font-black text-white">{analytics.totalViews || 0}</div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <div className="text-emerald-400 text-sm font-bold mb-2">Verified Views</div>
                    <div className="text-2xl font-black text-emerald-400">{analytics.verifiedViews || 0}</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                    <div className="text-amber-400 text-sm font-bold mb-2">Pending Verification</div>
                    <div className="text-2xl font-black text-amber-400">{analytics.pendingVerification || 0}</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                    <div className="text-blue-400 text-sm font-bold mb-2">Completed Users</div>
                    <div className="text-2xl font-black text-blue-400">{analytics.completedUsers || 0}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="text-slate-400 text-sm font-bold mb-2">Revenue Generated</div>
                    <div className="text-2xl font-black text-white font-mono">₹{(analytics.totalRevenue || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                    <div className="text-rose-400 text-sm font-bold mb-2">Reward Paid</div>
                    <div className="text-2xl font-black text-rose-400 font-mono">₹{(analytics.totalRewardPaid || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <div className="text-emerald-400 text-sm font-bold mb-2">Platform Profit</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">₹{(analytics.platformProfit || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                    <div className="text-purple-400 text-sm font-bold mb-2">Avg CPM</div>
                    <div className="text-2xl font-black text-purple-400 font-mono">₹{(analytics.avgCpm || 0).toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-400">No analytics data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
`
fs.writeFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', code);
console.log("Updated VideoAdsAdminView.tsx");
