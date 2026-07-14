import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { Save, Zap, CheckCircle, Code, Terminal, Network, AlertCircle, RefreshCw } from "lucide-react";

export default function ClickAdillaAdsManager() {
  const [settings, setSettings] = useState({ apiKey: "", spotId: "", js: "", html: "", css: "" });
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<{timestamp: string, type: string, message: string}[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    fetch(`${API_BASE}/api/admin/clickadilla/settings`, {
      headers
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
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setRawResponse(data);
      const duration = Date.now() - start;
      setNetworkLogs(prev => [{ method: "POST", url: endpoint, status: res.status, duration, ...data }, ...prev]);
      
      if (res.status === 401 || res.status === 403) {
        addLog("error", "Unauthorized: Session expired or invalid token.");
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error(data.error || "Failed");
      addLog("success", `${action} successful`);
    } catch(e: any) {
      addLog("error", `${action} failed: ${e.message}`);
    }
    setLoading(prev => ({...prev, [action]: false}));
  };

  return (
    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-8 text-slate-200">
      
      {/* API Connection Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">API Key</h2>
        <input type="password" value={settings.apiKey} onChange={e => setSettings({...settings, apiKey: e.target.value})} placeholder="API Key" className="w-full p-2 bg-slate-800 rounded-lg text-white" />
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => handleAction("Test Connection", "/api/admin/clickadilla/test-connection", { apiKey: settings.apiKey })} disabled={!!loading["Test Connection"]} className="flex-1 p-2 bg-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Zap size={16}/>{loading["Test Connection"] ? "Testing..." : "Test Connection"}</button>
          <button onClick={() => handleAction("Save Settings", "/api/admin/clickadilla/settings", settings)} disabled={!!loading["Save Settings"]} className="flex-1 p-2 bg-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Save size={16}/>{loading["Save Settings"] ? "Saving..." : "Save"}</button>
        </div>
      </section>

      {/* Spot Manager Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Spot Manager</h2>
        <input type="text" value={settings.spotId} onChange={e => setSettings({...settings, spotId: e.target.value})} placeholder="Spot ID" className="w-full p-2 bg-slate-800 rounded-lg text-white" />
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => handleAction("Test Spot", "/api/admin/clickadilla/validate-spot", { spotId: settings.spotId })} disabled={!!loading["Test Spot"]} className="flex-1 p-2 bg-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle size={16}/>{loading["Test Spot"] ? "Testing..." : "Test Spot"}</button>
          <button onClick={() => handleAction("Save Settings", "/api/admin/clickadilla/settings", settings)} disabled={!!loading["Save Settings"]} className="flex-1 p-2 bg-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Save size={16}/>{loading["Save Settings"] ? "Saving..." : "Save"}</button>
        </div>
      </section>

      {/* Editors */}
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">JavaScript Editor</h2>
        <textarea value={settings.js} onChange={e => setSettings({...settings, js: e.target.value})} placeholder="JavaScript" className="w-full h-32 p-2 bg-slate-800 rounded-lg text-white font-mono text-xs" />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Advertisement HTML</h2>
        <textarea value={settings.html} onChange={e => setSettings({...settings, html: e.target.value})} placeholder="HTML" className="w-full h-32 p-2 bg-slate-800 rounded-lg text-white font-mono text-xs" />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Advertisement CSS</h2>
        <textarea value={settings.css} onChange={e => setSettings({...settings, css: e.target.value})} placeholder="CSS" className="w-full h-32 p-2 bg-slate-800 rounded-lg text-white font-mono text-xs" />
      </section>
      
      {/* Previews and Logs */}
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Live Preview</h2>
        <div className="p-4 bg-white rounded-lg min-h-[300px]">
          <iframe className="w-full h-[300px]" srcDoc={`<style>${settings.css}</style><body><div id="ad-container">${settings.html}</div><script>${settings.js}</script></body>`} title="Ad Preview" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Live Debug Console</h2>
        <div className="p-4 bg-black rounded-lg text-green-400 font-mono h-48 overflow-y-auto text-xs">
          {logs.map((log, i) => <div key={i}>[{log.timestamp}] <span className={log.type === "error" ? "text-red-400" : log.type === "success" ? "text-blue-400" : ""}>{log.message}</span></div>)}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Raw API Response</h2>
        <pre className="p-4 bg-slate-950 rounded-lg text-slate-300 font-mono text-xs overflow-auto h-48">{JSON.stringify(rawResponse, null, 2)}</pre>
      </section>

    </div>
  );
}

