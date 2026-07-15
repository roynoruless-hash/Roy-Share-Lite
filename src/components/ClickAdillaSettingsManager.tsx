import React, { useState, useEffect } from "react";
import { authenticatedFetch } from "../lib/api";
import { 
  Save, 
  RefreshCw, 
  Trash2, 
  Play, 
  Code, 
  Settings2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ClickAdillaSettingsManager() {
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [spotId, setSpotId] = useState("");
  const [js, setJs] = useState("");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; httpStatus?: number; error?: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  

  

  // Fetch initial settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authenticatedFetch("/api/admin/clickadilla/settings");
      const data = await res.json();
      if (data) {
        setEnabled(!!data.enabled);
        setApiKey(data.apiKey || "");
        setSpotId(data.spotId || "");
        setJs(data.js || "");
        setHtml(data.html || "");
        setCss(data.css || "");
      }
    } catch (err: any) {
      console.error("Error fetching ClickAdilla settings:", err);
      setError("Failed to load ClickAdilla settings from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await authenticatedFetch("/api/admin/clickadilla/settings", {
        method: "POST",
        body: JSON.stringify({
          enabled,
          apiKey,
          spotId,
          js,
          html,
          css
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("ClickAdilla settings saved successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.error || "Failed to save settings.");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Network error. Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestAd = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await authenticatedFetch("/api/admin/clickadilla/test-connection", {
        method: "POST",
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      console.error("Error testing connection:", err);
      setTestResult({ status: "failed", error: err.message || "Failed to connect to publisher API" });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setEnabled(false);
    setApiKey("");
    setSpotId("");
    setJs("");
    setHtml("");
    setCss("");
    setTestResult(null);
    setError("");
    setSuccess("Fields cleared. Remember to Save All to persist changes.");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleOpenLivePreview = () => {
    const newWin = window.open("", "_blank", "width=800,height=600");
    if (!newWin) {
      alert("Popup blocked! Please allow popups to preview the ad.");
      return;
    }

    const escapedJs = (js || "").replace(/<\/(script)>/ig, "<\\/$1>");

    newWin.document.open();
    newWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ClickAdilla Live Preview</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #f1f5f9;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-height: 100vh;
            }
            .ad-container {
              width: 100%;
              max-width: 800px;
              background: #fff;
              border: 1px solid #e2e8f0;
              padding: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            ${css}
          </style>
        </head>
        <body>
          <h2 style="color: #0f172a; margin-bottom: 8px;">Live Ad Preview</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">This window executes your ad script in a real browser environment.</p>
          <div class="ad-container" id="ad-container">
            ${html}
          </div>
          <script>
            try {
              ${escapedJs}
            } catch (err) {
              console.error("Ad Script Error:", err);
              document.body.innerHTML += '<div style="color:red; margin-top: 20px;">Error executing ad script: ' + err.message + '</div>';
            }
          </script>
        </body>
      </html>
    `);
    newWin.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading ClickAdilla settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📊 ClickAdilla Ads Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure ClickAdilla global spots, custom display codes, and tracking parameters.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold">
          ⚡ Publisher Controls Live
        </div>
      </div>

      {/* Info Warning */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-2.5 backdrop-blur-sm">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-200">ℹ️ ClickAdilla Integration Guide</p>
          <p>
            This manager stores the ClickAdilla tracking script and custom HTML snippets. Turning on <strong>Enable Ads</strong> will propagate these global placements to all designated user mini app reward pages instantly.
          </p>
        </div>
      </div>

      {/* Toast Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Fields (Left Col) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings2 className="w-4.5 h-4.5 text-blue-400" /> General Config
            </h3>

            {/* Enable Ads Toggle */}
            <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <div>
                <span className="text-sm font-bold text-slate-200 block">Enable Ads</span>
                <span className="text-[11px] text-slate-500">Toggle whether ads are loaded in the Mini App</span>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className="focus:outline-none transition-colors"
              >
                {enabled ? (
                  <ToggleRight className="w-12 h-12 text-blue-500 cursor-pointer" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-slate-600 cursor-pointer" />
                )}
              </button>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">ClickAdilla API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter publishers api key..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>

            {/* Spot ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Spot ID</label>
              <input
                type="text"
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                placeholder="e.g. 439210"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          {/* Advertisement Assets Custom Editors */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Code className="w-4.5 h-4.5 text-blue-400" /> Ad Assets & Code
            </h3>

            {/* Advertisement HTML */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Advertisement HTML</label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={4}
                placeholder="<div id='clickadilla-spot'></div>"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
              />
            </div>

            {/* Advertisement CSS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Advertisement CSS</label>
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                rows={4}
                placeholder="#clickadilla-spot { width: 100%; height: 250px; }"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
              />
            </div>

            {/* Advertisement JavaScript */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Advertisement JavaScript</label>
              <textarea
                value={js}
                onChange={(e) => setJs(e.target.value)}
                rows={6}
                placeholder="// API Spot injection script"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Live Preview & Actions (Right Col) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Buttons Panel */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
              Publisher Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save All
              </button>

              <button
                onClick={handleTestAd}
                disabled={testing}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 font-bold py-2.5 px-4 border border-slate-700 rounded-xl text-xs transition cursor-pointer"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Test Connection
              </button>

              <button
                onClick={handleOpenLivePreview}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2.5 px-4 border border-slate-700 rounded-xl text-xs transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Open Live Preview
              </button>

              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold py-2.5 px-4 border border-red-900/20 rounded-xl text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {/* Test Connection Result Box */}
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3.5 rounded-xl text-xs font-mono space-y-1.5 border overflow-hidden ${
                    testResult.status === "connected"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {testResult.status === "connected" ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    Connection Status: {testResult.status.toUpperCase()}
                  </p>
                  {testResult.httpStatus && <p>HTTP Code: {testResult.httpStatus}</p>}
                  {testResult.error && <p className="text-[10px]">Error: {testResult.error}</p>}
                  {testResult.status === "connected" && <p className="text-[10px] text-slate-400">Successfully fetched and validated spots from ClickAdilla publisher API endpoints.</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sandbox Render Preview Panel */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4 flex flex-col h-[340px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-400" /> Ad Sandbox Preview
              </h3>
              <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">
                External Tab
              </span>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-6 text-center">
               <Eye className="w-12 h-12 text-slate-700 mb-3" />
               <h4 className="text-sm font-bold text-slate-300 mb-1">Preview Requires Real Browser Window</h4>
               <p className="text-xs text-slate-500 max-w-sm mb-4">
                 Due to iframe security restrictions (X-Frame-Options, CSP, and Cross-Origin policies), ClickAdilla scripts cannot be reliably executed inside the isolated sandbox.
               </p>
               <button
                 onClick={handleOpenLivePreview}
                 className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
               >
                 <Play className="w-4 h-4" />
                 Open Ad in New Window
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}