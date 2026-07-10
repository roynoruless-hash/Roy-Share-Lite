import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { motion } from "motion/react";
import { Save, Terminal, ShieldCheck, Link, Trash2, Webhook } from "lucide-react";

export default function TelegramSettingsPage() {
  const [configs, setConfigs] = useState({
    botToken: localStorage.getItem("telegramBotToken") || "",
    chatId: localStorage.getItem("telegramChatId") || "",
    channelLink: localStorage.getItem("telegramChannelLink") || "",
    groupLink: localStorage.getItem("telegramGroupLink") || "",
    storageChannelId: localStorage.getItem("telegramStorageChannelId") || "",
    miniAppUrl: localStorage.getItem("telegramMiniAppUrl") || "",
  });
  const [isPollingMode, setIsPollingMode] = useState(localStorage.getItem("isPollingMode") !== "false");
  const [feedback, setFeedback] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [diagnosticsResults, setDiagnosticsResults] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem("isPollingMode", String(isPollingMode));
  }, [isPollingMode]);

  const extractUsername = (link: string) => {
    let cleaned = link.replace(/https?:\/\/(t\.me\/|telegram\.me\/)/, '');
    cleaned = cleaned.replace(/^@/, '');
    return cleaned.split('/')[0];
  };

  const handleSave = async () => {
    console.log("Saving configuration:", configs);
    await fetch(`${API_BASE}/api/telegram/settings`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(configs) 
    });
    console.log("Saved channel:", configs.channelLink);
    console.log("Saved group:", configs.groupLink);
    setFeedback("✅ Configuration Saved Successfully");
    setTimeout(() => setFeedback(""), 2000);
  };

  const runMembershipTest = async () => {
    setFeedback("Running membership test...");
    setDiagnosticsResults(null);
    try {
        const res = await fetch(`${API_BASE}/api/telegram/membership-test`, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ 
                botToken: configs.botToken, 
                channelUsername: (configs as any).channelUsername || extractUsername(configs.channelLink),
                groupUsername: (configs as any).groupUsername || extractUsername(configs.groupLink)
            }) 
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Server error occurred");
        
        setDiagnosticsResults(data);
        setFeedback("✅ Membership test completed");
    } catch (e: any) {
        setFeedback(`❌ Error: ${e.message}`);
    }
  };

  const runDiagnostics = async () => {
    setFeedback("Fetching diagnostics...");
    setDiagnosticsResults(null);
    try {
        const res = await fetch(`${API_BASE}/api/telegram/diagnostics`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(configs) });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Server error occurred");
        
        if (data.error) {
            setFeedback(`❌ Error: ${data.error}`);
        } else {
            setFeedback("");
            setDiagnosticsResults(data);
        }
    } catch (e: any) {
        setFeedback(`❌ Error: ${e.message}`);
    }
  };

  const getWebhook = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/telegram/webhook/get`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ botToken: configs.botToken }) });
          if (!res.ok) return;
          const data = await res.json();
          setWebhookInfo(data);
      } catch (e) {
          console.error("Failed to get webhook info", e);
      }
  };

  const setWebhook = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/telegram/webhook/set`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ botToken: configs.botToken, url: webhookUrl }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.description || "Failed to set webhook");
          
          setFeedback(data.ok ? "✅ Webhook Configured" : `❌ Error: ${data.description}`);
          getWebhook();
      } catch (e: any) {
          setFeedback(`❌ Error: ${e.message}`);
      }
  };

  const deleteWebhook = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/telegram/webhook/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ botToken: configs.botToken }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.description || "Failed to delete webhook");

          setFeedback(data.ok ? "✅ Webhook Removed" : `❌ Error: ${data.description}`);
          getWebhook();
      } catch (e: any) {
          setFeedback(`❌ Error: ${e.message}`);
      }
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/telegram/settings`).then(res => res.json()).then(data => {
        if (data.botToken) setConfigs(data);
    });
    const interval = setInterval(async () => {
        const res = await fetch(`${API_BASE}/api/telegram/polling/status`);
        if (res.ok) setPollingStatus(await res.json());
    }, 2000);
    getWebhook();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Telegram Settings</h2>
      {feedback && <div className="mb-6 p-4 bg-slate-800 rounded-xl text-white text-sm whitespace-pre-wrap">{feedback}</div>}
      
      {diagnosticsResults && (
        <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-white/10 text-sm">
          <h3 className="font-bold text-white mb-2">Debug Panel (Results)</h3>
          {Object.entries(diagnosticsResults).map(([key, val]) => (
              <div key={key} className="mb-4">
                  <span className="font-bold text-blue-400 block mb-1">{key}</span>
                  <pre className="text-xs bg-black p-2 rounded overflow-auto max-h-40">{JSON.stringify(val, null, 2)}</pre>
              </div>
          ))}
        </div>
      )}
      
      {pollingStatus && (
        <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-white/10 text-sm">
          <h3 className="font-bold text-white mb-2">Polling Debug Panel</h3>
          <div className="text-slate-300 space-y-1">
             <div>Status: {pollingStatus.isRunning ? "✅ Running" : "❌ Stopped"}</div>
             <div>Updates Received: {pollingStatus.receivedCount}</div>
             <div>Last Update ID: {pollingStatus.lastUpdateId || "None"}</div>
             <div>Last User ID: {pollingStatus.lastUserId || "None"}</div>
             <div>Last Command: {pollingStatus.lastCommand || "None"}</div>
             <div>Last Error: {pollingStatus.lastError || "None"}</div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-950 rounded-xl border border-white/10">
        <button onClick={() => fetch(`${API_BASE}/api/telegram/polling/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ botToken: configs.botToken }) })} 
                className="px-4 py-2 bg-green-600 rounded-lg text-white font-bold">Start Polling</button>
        <button onClick={() => fetch(`${API_BASE}/api/telegram/polling/stop`, { method: "POST" })} 
                className="px-4 py-2 bg-red-600 rounded-lg text-white font-bold">Stop Polling</button>
        <button onClick={() => fetch(`${API_BASE}/api/telegram/polling/restart`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ botToken: configs.botToken }) })} 
                className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold">Restart Polling</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-400">Bot Token</label>
          <input type="text" value={configs.botToken} onChange={e => setConfigs({...configs, botToken: e.target.value})} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
          <label className="block text-sm font-medium text-slate-400">Chat ID</label>
          <input type="text" value={configs.chatId} onChange={e => setConfigs({...configs, chatId: e.target.value})} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-400">Force Join Channel</label>
          <input type="text" placeholder="https://t.me/example" value={configs.channelLink} onChange={e => setConfigs({...configs, channelLink: e.target.value})} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
          {configs.channelLink && <p className="text-xs text-blue-400">Preview: @{extractUsername(configs.channelLink)}</p>}
          <label className="block text-sm font-medium text-slate-400">Force Join Group</label>
          <input type="text" placeholder="https://t.me/example" value={configs.groupLink} onChange={e => setConfigs({...configs, groupLink: e.target.value})} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
          {configs.groupLink && <p className="text-xs text-blue-400">Preview: @{extractUsername(configs.groupLink)}</p>}
        </div>
      </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-400">Storage Channel ID</label>
          <input type="text" placeholder="-100..." value={configs.storageChannelId} onChange={e => setConfigs({...configs, storageChannelId: e.target.value})} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-400">Telegram Direct Link (BotFather)</label>
          <input type="text" placeholder="https://t.me/BotUsername/appname" value={(configs as any).miniAppUrl} onChange={e => setConfigs({...configs, miniAppUrl: e.target.value})} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
          <p className="text-[10px] text-slate-500 mt-1">Example: https://t.me/Roysharearn_bot/app</p>
        </div>

      {!isPollingMode && (
        <div className="mt-8 border-t border-white/10 pt-8">
            <h3 className="text-lg font-bold text-white mb-4">Webhook Diagnostics</h3>
            {webhookInfo && (
                <div className="text-sm text-slate-300 space-y-1 mb-4">
                    <p>URL: {webhookInfo.url || "Not set"}</p>
                    <p>Pending: {webhookInfo.pending_update_count || 0}</p>
                    <p>Last Error: {webhookInfo.last_error_message || "None"}</p>
                    <p>Last Error Date: {webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toLocaleString() : "N/A"}</p>
                </div>
            )}
            <div className="space-y-4">
                <input type="text" placeholder="New Webhook URL..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full p-3 bg-slate-950 rounded-xl border border-white/10 text-white" />
                <div className="flex flex-wrap gap-4">
                    <button onClick={setWebhook} className="flex items-center gap-2 px-6 py-3 bg-green-600 rounded-xl text-white"><Webhook className="w-5 h-5"/> Set Webhook</button>
                    <button onClick={deleteWebhook} className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-xl text-white"><Trash2 className="w-5 h-5"/> Delete Webhook</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-8">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white font-bold"><Save className="w-5 h-5"/> Save Configuration</button>
        <button onClick={runMembershipTest} className="flex items-center gap-2 px-6 py-3 bg-slate-800 rounded-xl text-white"><Terminal className="w-5 h-5"/> Membership Test</button>
        <button onClick={runDiagnostics} className="flex items-center gap-2 px-6 py-3 bg-slate-800 rounded-xl text-white"><ShieldCheck className="w-5 h-5"/> Diagnostics</button>
      </div>
    </div>
  );
}
