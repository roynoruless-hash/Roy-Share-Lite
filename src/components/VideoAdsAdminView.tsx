import { useState, useEffect } from "react";
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

  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);


  useEffect(() => {
    if (activeTab === "Tasks") fetchTasks();
    if (activeTab === "Analytics") fetchAnalytics();
    if (activeTab === "Security Logs") fetchLogs();
  }, [activeTab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/video-tasks`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
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
      const res = await fetch(`${API_BASE}/api/admin/video-analytics`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingAnalytics(false);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/video-logs`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch(e) {}
    setLoadingLogs(false);
  };

  const handleAction = async (sessionId: string, action: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/video-logs-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("admin_token")}` },
        body: JSON.stringify({ sessionId, action })
      });
      const data = await res.json();
      if (data.success) {
         fetchLogs();
      } else {
         alert("Action failed: " + data.error);
      }
    } catch(e) {
      alert("Error taking action");
    }
  };


  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/video-tasks`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        },
        body: JSON.stringify(editingTask)
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
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/video-tasks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
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
      countdown: 30,
      clickAdillaScript: "",
      rewardAmount: 0,
      dailyLimit: 1,
      status: "Active",
      cpm: 0,
      viewsPerCpm: 1000
    });
  };

  const autoCalcReward = () => {
    if (!editingTask) return 0;
    const cpm = parseFloat(editingTask.cpm) || 0;
    const views = parseFloat(editingTask.viewsPerCpm) || 1000;
    if (views === 0) return 0;
    return (cpm / views).toFixed(4);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/50">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-500" />
            Video Ads System
          </h2>
          <p className="text-slate-400 mt-1">Manage ClickAdilla video ad tasks and view analytics.</p>
        </div>
        <div className="flex gap-2">
          {["Tasks", "Analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {tab === "Tasks" ? <PlayCircle className="w-4 h-4 inline-block mr-2" /> : <BarChart3 className="w-4 h-4 inline-block mr-2" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "Tasks" && !editingTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Video Ad Tasks</h3>
              <button 
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" /> Add Task
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                <Video className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-300 mb-2">No Video Tasks Found</h4>
                <p className="text-slate-500">Create your first video ad task to start monetizing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tasks.map(task => (
                  <div key={task.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${task.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          {task.status}
                        </span>
                        <h4 className="text-white font-bold text-lg">{task.name}</h4>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-mono">
                        <span className="bg-slate-900 px-2 py-1 rounded">Reward: {task.rewardAmount}</span>
                        <span className="bg-slate-900 px-2 py-1 rounded">Wait: {task.countdown}s</span>
                        <span className="bg-slate-900 px-2 py-1 rounded">Limit: {task.dailyLimit}/day</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingTask(task)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Task Name</label>
                    <input required type="text" value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Watch Premium Ad" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Task Description</label>
                    <input required type="text" value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Short description" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Status</label>
                    <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Countdown (sec)</label>
                      <input required type="number" min="0" value={editingTask.countdown} onChange={e => setEditingTask({...editingTask, countdown: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Daily Limit</label>
                      <input required type="number" min="0" value={editingTask.dailyLimit} onChange={e => setEditingTask({...editingTask, dailyLimit: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-blue-400 font-bold flex items-center gap-2"><Calculator className="w-4 h-4" /> Revenue & Reward Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-blue-300 mb-1">CPM (INR)</label>
                        <input type="number" step="0.01" value={editingTask.cpm} onChange={e => setEditingTask({...editingTask, cpm: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400" placeholder="e.g. 955" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-300 mb-1">Views per CPM</label>
                        <input type="number" value={editingTask.viewsPerCpm} onChange={e => setEditingTask({...editingTask, viewsPerCpm: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400" placeholder="e.g. 1000" />
                      </div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                      <span className="text-sm text-slate-400">Calculated Reward:</span>
                      <span className="text-emerald-400 font-mono font-bold text-lg">₹{autoCalcReward()}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-300 mb-1 flex justify-between">
                        <span>Actual Reward Amount</span>
                        <button type="button" onClick={() => setEditingTask({...editingTask, rewardAmount: autoCalcReward()})} className="text-blue-400 hover:text-blue-300">Use Calculated</button>
                      </label>
                      <input required type="number" step="0.0001" value={editingTask.rewardAmount} onChange={e => setEditingTask({...editingTask, rewardAmount: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Rules (Rich Text/HTML)</label>
                  <textarea rows={3} value={editingTask.rules} onChange={e => setEditingTask({...editingTask, rules: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500" placeholder="<ul><li>Watch full video</li></ul>" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Claim Process (Rich Text/HTML)</label>
                  <textarea rows={3} value={editingTask.claimProcess} onChange={e => setEditingTask({...editingTask, claimProcess: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500" placeholder="<p>Click Watch, wait 30s...</p>" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1 flex justify-between">
                    <span>ClickAdilla Script</span>
                    <span className="text-xs text-amber-500 font-normal">⚠️ Will be injected directly</span>
                  </label>
                  <textarea rows={4} required value={editingTask.clickAdillaScript} onChange={e => setEditingTask({...editingTask, clickAdillaScript: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-emerald-400 font-mono text-xs focus:outline-none focus:border-blue-500" placeholder="<script>...</script>" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                  <Save className="w-5 h-5" /> Save Video Task
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === "Analytics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loadingAnalytics ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : analytics ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl text-center">
                  <p className="text-slate-400 text-sm font-bold mb-2">Total Views</p>
                  <p className="text-3xl font-black text-white">{analytics.totalViews}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl text-center">
                  <p className="text-slate-400 text-sm font-bold mb-2">Completed Ads</p>
                  <p className="text-3xl font-black text-emerald-400">{analytics.completedAds}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl text-center">
                  <p className="text-slate-400 text-sm font-bold mb-2">Failed/Incomplete</p>
                  <p className="text-3xl font-black text-red-400">{analytics.failedAds}</p>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl text-center">
                  <p className="text-blue-400 text-sm font-bold mb-2">Rewards Paid</p>
                  <p className="text-3xl font-black text-white">₹{parseFloat(analytics.rewardsPaid).toFixed(4)}</p>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl text-center">
                  <p className="text-blue-400 text-sm font-bold mb-2">Estimated Revenue</p>
                  <p className="text-3xl font-black text-white">₹{parseFloat(analytics.estimatedRevenue).toFixed(4)}</p>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl text-center">
                  <p className="text-emerald-400 text-sm font-bold mb-2">Est. Profit</p>
                  <p className="text-3xl font-black text-emerald-400">₹{parseFloat(analytics.profit).toFixed(4)}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Failed to load analytics</div>
            )}
          </motion.div>
        )}

        {activeTab === "Security Logs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-400" /> Session Security Logs</h3>
               <button onClick={fetchLogs} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">Refresh</button>
            </div>
            {loadingLogs ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-xs text-slate-400">User: {log.userId}</span>
                           <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                             log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                             log.status === 'pending_review' ? 'bg-amber-500/20 text-amber-400' :
                             log.status === 'auto_banned' ? 'bg-red-500/20 text-red-400' :
                             log.status === 'rejected' ? 'bg-slate-500/20 text-slate-400' :
                             'bg-blue-500/20 text-blue-400'
                           }`}>{log.status.toUpperCase()}</span>
                           <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">Score: {log.riskScore || 0}</span>
                        </div>
                        <div className="text-sm text-slate-300">
                           <p><strong>IP:</strong> {log.ip} | <strong>Device:</strong> {log.fingerprint?.substring(0,8)}... | <strong>UserAgent:</strong> {log.userAgent?.substring(0,30)}...</p>
                           <p className="text-xs text-slate-400">Heartbeats: {log.heartbeats || 0} | Focus Loss: {log.focusLossCount || 0} | Refreshes: {log.refreshes || 0}</p>
                           {log.fraudReason && <p className="text-xs text-red-400 mt-1">⚠️ {log.fraudReason}</p>}
                        </div>
                     </div>
                     
                     {log.status === 'pending_review' && (
                       <div className="flex items-center gap-2 shrink-0">
                         <button onClick={() => handleAction(log.id, 'approve')} className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/30">Approve</button>
                         <button onClick={() => handleAction(log.id, 'reject')} className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold border border-slate-600">Reject</button>
                         <button onClick={() => handleAction(log.id, 'ban')} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-bold border border-red-500/30">Ban</button>
                       </div>
                     )}
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center text-slate-500 py-8">No logs found.</p>}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
