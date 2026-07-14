import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { Save, Zap, CheckCircle, Code, Terminal, Network, AlertCircle, RefreshCw } from "lucide-react";

export default function ClickAdillaAdsManager() {
  const [settings, setSettings] = useState({ apiKey: "", spotId: "", js: "", html: "", css: "" });
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState("API Connection");
  const [logs, setLogs] = useState<{timestamp: string, type: string, message: string}[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/clickadilla/settings`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` }
    })
    .then(res => res.json())
    .then(data => setSettings(data));
  }, []);

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, {timestamp: new Date().toLocaleTimeString(), type, message}]);
  };

  const handleAction = async (action: string, endpoint: string, body: any) => {
    setLoading(prev => ({...prev, [action]: true}));
    addLog("info", `Running ${action}...`);
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("admin_token")}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setRawResponse(data);
      const duration = Date.now() - start;
      setNetworkLogs(prev => [{ method: "POST", url: endpoint, status: res.status, duration, ...data }, ...prev]);
      
      if (!res.ok) throw new Error(data.error || "Failed");
      addLog("success", `${action} successful`);
    } catch(e: any) {
      addLog("error", `${action} failed: ${e.message}`);
    }
    setLoading(prev => ({...prev, [action]: false}));
  };

  return (
    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6 text-slate-200">
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {["API Connection", "Spot Manager", "JS Editor", "HTML Editor", "CSS Editor", "Live Preview", "Debug Console", "Raw API", "Network"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 text-xs font-bold rounded-t-lg ${activeTab === tab ? "bg-slate-800 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}>{tab}</button>
        ))}
      </div>
      
      {activeTab === "API Connection" && (
        <div className="space-y-4">
          <input type="password" value={settings.apiKey} onChange={e => setSettings({...settings, apiKey: e.target.value})} placeholder="API Key" className="w-full p-2 bg-slate-800 rounded-lg text-white" />
          <div className="flex gap-2">
            <button onClick={() => handleAction("Test Connection", "/api/admin/clickadilla/test-connection", { apiKey: settings.apiKey })} className="flex-1 p-2 bg-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2"><Zap size={16}/>Test Connection</button>
            <button onClick={() => handleAction("Save Settings", "/api/admin/clickadilla/settings", settings)} className="flex-1 p-2 bg-slate-700 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={16}/>Save</button>
          </div>
        </div>
      )}
      
      {activeTab === "Spot Manager" && (
        <div className="space-y-4">
          <input type="text" value={settings.spotId} onChange={e => setSettings({...settings, spotId: e.target.value})} placeholder="Spot ID" className="w-full p-2 bg-slate-800 rounded-lg text-white" />
          <button onClick={() => handleAction("Validate Spot", "/api/admin/clickadilla/validate-spot", { spotId: settings.spotId })} className="w-full p-2 bg-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2"><CheckCircle size={16}/>Validate Spot</button>
        </div>
      )}

      {activeTab === "JS Editor" && <textarea value={settings.js} onChange={e => setSettings({...settings, js: e.target.value})} placeholder="JavaScript" className="w-full h-64 p-2 bg-slate-800 rounded-lg text-white font-mono text-xs" />}
      {activeTab === "HTML Editor" && <textarea value={settings.html} onChange={e => setSettings({...settings, html: e.target.value})} placeholder="HTML" className="w-full h-64 p-2 bg-slate-800 rounded-lg text-white font-mono text-xs" />}
      {activeTab === "CSS Editor" && <textarea value={settings.css} onChange={e => setSettings({...settings, css: e.target.value})} placeholder="CSS" className="w-full h-64 p-2 bg-slate-800 rounded-lg text-white font-mono text-xs" />}
      
      {activeTab === "Raw API" && <pre className="p-4 bg-slate-950 rounded-lg text-slate-300 font-mono text-xs overflow-auto h-64">{JSON.stringify(rawResponse, null, 2)}</pre>}
      {activeTab === "Network" && (
        <div className="space-y-2 h-64 overflow-y-auto">
            {networkLogs.map((log, i) => <div key={i} className="text-xs font-mono p-2 bg-slate-800 rounded">{log.method} {log.url} - {log.status} ({log.duration}ms)</div>)}
        </div>
      )}

      {activeTab === "Live Preview" && (
        <div className="p-4 bg-white rounded-lg min-h-[300px]">
          <iframe className="w-full h-[300px]" srcDoc={`<style>${settings.css}</style><body><div id="ad-container">${settings.html}</div><script>${settings.js}</script></body>`} title="Ad Preview" />
        </div>
      )}
      
      {activeTab === "Debug Console" && (
        <div className="p-4 bg-black rounded-lg text-green-400 font-mono h-64 overflow-y-auto text-xs">
          {logs.map((log, i) => <div key={i}>[{log.timestamp}] <span className={log.type === "error" ? "text-red-400" : log.type === "success" ? "text-blue-400" : ""}>{log.message}</span></div>)}
        </div>
      )}
    </div>
  );
}
