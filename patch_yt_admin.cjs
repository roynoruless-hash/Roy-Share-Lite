const fs = require('fs');
let code = fs.readFileSync('src/components/YouTubeTasksAdmin.tsx', 'utf8');

const pendingReviewCode = `
import { Eye, CheckCircle2, XCircle, User, ShieldAlert, CheckCircle, Search, Filter } from 'lucide-react';

function PendingReview() {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const mockTasks = [
    {
      id: "SUB-8921",
      tgPhoto: "https://i.pravatar.cc/150?u=1",
      tgName: "Ritik Rai",
      tgUsername: "@ritikrai",
      tgId: "109238491",
      googleName: "Ritik Kumar Rai",
      googleEmail: "ritik@gmail.com",
      campaign: "Watch & Earn - Crypto Guide",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80",
      reward: "₹0.50",
      time: "2 mins ago",
      watchReq: "60s",
      aiScore: 98,
      aiStatus: "Very likely valid"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-yellow-400" /> Pending Review Tasks
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search ID or Username..." className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white" />
            </div>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition"><Filter size={16}/> Filter</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-800/50 text-sm text-slate-400">
                <th className="p-4 font-medium">Submission Details</th>
                <th className="p-4 font-medium">User Profile</th>
                <th className="p-4 font-medium">Campaign & Reward</th>
                <th className="p-4 font-medium">AI Analysis</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockTasks.map(task => (
                <tr key={task.id} className="border-t border-slate-800 hover:bg-slate-800/20">
                  <td className="p-4">
                    <p className="font-bold text-white">{task.id}</p>
                    <p className="text-xs text-slate-400">{task.time}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={task.tgPhoto} alt="TG" className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="font-bold text-white text-sm">{task.tgName} <span className="text-xs text-slate-400">({task.tgUsername})</span></p>
                        <p className="text-xs text-slate-500">{task.googleEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-200 text-sm">{task.campaign}</p>
                    <p className="text-xs text-emerald-400 font-bold">{task.reward} • {task.watchReq} Req</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg">{task.aiScore}%</div>
                      <span className="text-xs text-slate-300">{task.aiStatus}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedTask(task)} className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition" title="View Details"><Eye size={16} /></button>
                      <button className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition" title="Approve"><CheckCircle2 size={16} /></button>
                      <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" title="Reject"><XCircle size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* View Details Popup */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-4xl shadow-2xl relative my-8">
            <button onClick={() => setSelectedTask(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Submission Details: {selectedTask.id}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: User & Campaign */}
              <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">User Information</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <img src={selectedTask.tgPhoto} alt="TG" className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-bold text-white">{selectedTask.tgName}</p>
                      <p className="text-sm text-blue-400">{selectedTask.tgUsername}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Telegram ID:</span><span className="text-white font-mono">{selectedTask.tgId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Google Name:</span><span className="text-white">{selectedTask.googleName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Google Email:</span><span className="text-white">{selectedTask.googleEmail}</span></div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Campaign Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Name:</span><span className="text-white">{selectedTask.campaign}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Reward:</span><span className="text-emerald-400 font-bold">{selectedTask.reward}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Time Required:</span><span className="text-white">{selectedTask.watchReq}</span></div>
                  </div>
                </div>
              </div>

              {/* Right Column: Evidence & Actions */}
              <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Evidence (Screenshot)</h3>
                  <img src={selectedTask.thumbnail} alt="Proof" className="w-full h-auto rounded-lg mb-4" />
                  
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400 font-bold mb-2">AI Moderation Result</p>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg">{selectedTask.aiScore}% Score</div>
                      <span className="text-sm text-white">{selectedTask.aiStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"><XCircle size={18}/> Reject</button>
                  <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"><CheckCircle size={18}/> Approve</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// Also add tabs for Approved, Rejected, User History to YouTubeTasksAdmin if not there
const replaceTabs = `              {activeTab === "Pending Review" && <PendingReview />}
              {activeTab === "Approved" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Approved tasks table will be shown here.</p></div>}
              {activeTab === "Rejected" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Rejected tasks table will be shown here.</p></div>}
              {activeTab === "User History" && <div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">User History search and data will be shown here.</p></div>}
`;

code = code.replace(/function PendingReview\(\) \{[\s\S]*?\}\s*\}/, pendingReviewCode);
code = code.replace(/\{activeTab === "Pending Review" && <PendingReview \/>\}/, replaceTabs);

// Add icons to import if missing
if (!code.includes("Clock,")) {
  code = code.replace(/import {/, "import { Clock, Eye, CheckCircle2, XCircle, ShieldAlert, Search, Filter, CheckCircle,");
}

const tabsDefinitionRegex = /const tabs = \[\s*"Create Campaign",\s*"Active Campaigns",\s*"AI Comments",\s*"Reward Config",\s*"Budget Config",\s*"Analytics",\s*"Pending Review"\s*\];/;

const newTabs = `const tabs = [
    "Create Campaign",
    "Active Campaigns",
    "Pending Review",
    "Approved",
    "Rejected",
    "User History",
    "AI Comments",
    "Reward Config",
    "Budget Config",
    "Analytics"
  ];`;

code = code.replace(tabsDefinitionRegex, newTabs);

fs.writeFileSync('src/components/YouTubeTasksAdmin.tsx', code);
console.log("YouTubeTasksAdmin patched");
