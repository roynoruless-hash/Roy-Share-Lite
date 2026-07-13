const fs = require('fs');

let code = fs.readFileSync('src/components/VideoAdsAdminView.tsx', 'utf8');

// We need to add "Security Logs" tab
const tabsRegex = /<div className="flex gap-2 p-1 bg-slate-900\/50 rounded-xl mb-6">([\s\S]*?)<\/div>/;
const matchTabs = code.match(tabsRegex);
if (matchTabs) {
  let tabsContent = matchTabs[1];
  tabsContent = tabsContent.replace(
    '["Tasks", "Analytics"].map(tab => (',
    '["Tasks", "Analytics", "Security Logs"].map(tab => ('
  );
  code = code.replace(tabsRegex, '<div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl mb-6">' + tabsContent + '</div>');
}

const stateRegex = /const \[analytics, setAnalytics\] = useState<any>\(null\);\n  const \[loadingAnalytics, setLoadingAnalytics\] = useState\(false\);/;
const extraState = `
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
`;
code = code.replace(stateRegex, 'const [analytics, setAnalytics] = useState<any>(null);\n  const [loadingAnalytics, setLoadingAnalytics] = useState(false);\n' + extraState);

const effectRegex = /if \(activeTab === "Analytics"\) fetchAnalytics\(\);/
code = code.replace(effectRegex, 'if (activeTab === "Analytics") fetchAnalytics();\n    if (activeTab === "Security Logs") fetchLogs();');

const fetchLogsCode = `
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(\`\${API_BASE}/api/admin/video-logs\`, {
        headers: { "Authorization": \`Bearer \${localStorage.getItem("admin_token")}\` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch(e) {}
    setLoadingLogs(false);
  };

  const handleAction = async (sessionId: string, action: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/admin/video-logs-action\`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${localStorage.getItem("admin_token")}\` },
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
`;
code = code.replace(/const fetchAnalytics = async \(\) => \{[\s\S]*?setLoadingAnalytics\(false\);\n  \};/, '$&\n' + fetchLogsCode);

const logsTabUI = `
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
                           <span className={\`text-xs px-2 py-0.5 rounded-full font-bold \${
                             log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                             log.status === 'pending_review' ? 'bg-amber-500/20 text-amber-400' :
                             log.status === 'auto_banned' ? 'bg-red-500/20 text-red-400' :
                             log.status === 'rejected' ? 'bg-slate-500/20 text-slate-400' :
                             'bg-blue-500/20 text-blue-400'
                           }\`}>{log.status.toUpperCase()}</span>
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
`;

code = code.replace(/\{activeTab === "Analytics" && \([\s\S]*?<\/motion\.div>\n        \)}/, '$&\n' + logsTabUI);

if(!code.includes('ShieldCheck')) {
  code = code.replace('import { Plus, Edit2, Trash2, Save, X, Loader2, PlayCircle, Clock, Calculator } from "lucide-react";', 'import { Plus, Edit2, Trash2, Save, X, Loader2, PlayCircle, Clock, Calculator, ShieldCheck } from "lucide-react";');
}

fs.writeFileSync('src/components/VideoAdsAdminView.tsx', code);
console.log('Successfully patched VideoAdsAdminView.tsx');
