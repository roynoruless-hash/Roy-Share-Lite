import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

export default function AdsbitvexTestPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Live Runtime Status States
  const [sdkLoaded, setSdkLoaded] = useState("NO");
  const [showadsbitvexAvailable, setShowadsbitvexAvailable] = useState("NO");
  const [showadsbitvexInitAvailable, setShowadsbitvexInitAvailable] = useState("NO");
  const [headScriptFound, setHeadScriptFound] = useState("NO");

  // Debug Panel metrics
  const [sdkLoadTime, setSdkLoadTime] = useState("N/A");
  const [rewardTestResult, setRewardTestResult] = useState("Not Tested");
  const [initTestResult, setInitTestResult] = useState("Not Tested");
  const [runtimeErrors, setRuntimeErrors] = useState<string[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const addConsoleLog = (type: "LOG" | "ERROR", msg: string) => {
    setConsoleLogs(prev => [...prev, `[${type}] ${msg}`].slice(-30));
  };

  useEffect(() => {
    // Intercept console.log and console.error
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      addConsoleLog("LOG", msg);
    };

    console.error = (...args) => {
      originalError(...args);
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      addConsoleLog("ERROR", msg);
      setRuntimeErrors(prev => [...prev, msg].slice(-10));
    };

    // Load current config
    fetch(`${API_BASE}/api/adsbitvex-config`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
        if (data && data.finalSdkUrl) {
          injectSdkScript(data.finalSdkUrl);
        }
      })
      .catch(err => {
        console.error("Error fetching AdsBitvex configuration:", err);
        setError("Failed to fetch AdsBitvex configuration from server.");
        setLoading(false);
      });

    // Periodically inspect window object and head script
    const interval = setInterval(() => {
      const hasSdk = typeof (window as any).showadsbitvex === "function";
      const hasSdkInit = typeof (window as any).showadsbitvex_init === "function";
      setShowadsbitvexAvailable(hasSdk ? "YES" : "NO");
      setShowadsbitvexInitAvailable(hasSdkInit ? "YES" : "NO");

      const headPresent = !!document.querySelector('script[data-dynamic-adsbitvex="true"]');
      setHeadScriptFound(headPresent ? "YES" : "NO");
    }, 1000);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      clearInterval(interval);
    };
  }, []);

  const injectSdkScript = (url: string) => {
    const startTime = performance.now();
    // Check if script is already present
    const existing = document.querySelector('script[data-dynamic-adsbitvex="true"]');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.setAttribute("data-dynamic-adsbitvex", "true");

    script.onload = () => {
      const endTime = performance.now();
      setSdkLoadTime(`${(endTime - startTime).toFixed(1)}ms`);
      setSdkLoaded("YES");
      const hasSdk = typeof (window as any).showadsbitvex === "function";
      const hasSdkInit = typeof (window as any).showadsbitvex_init === "function";
      setShowadsbitvexAvailable(hasSdk ? "YES" : "NO");
      setShowadsbitvexInitAvailable(hasSdkInit ? "YES" : "NO");
      console.log("[Test Page] SDK script loaded successfully!");
    };

    script.onerror = () => {
      setSdkLoaded("NO");
      console.error(`[Test Page] Failed to download script from: ${url}`);
    };

    document.head.appendChild(script);
  };

  const handleWatchRewardAd = async () => {
    setRewardTestResult("Testing...");
    
    // Check if function exists
    if (typeof (window as any).showadsbitvex !== "function") {
      const errorMsg = "window.showadsbitvex is undefined. SDK may not be loaded.";
      setRewardTestResult("❌ window.showadsbitvex() is undefined");
      setRuntimeErrors(prev => [...prev, errorMsg]);
      console.error(`[Test Page] ${errorMsg}`);
      return;
    }

    try {
      console.log("[Test Page] Calling window.showadsbitvex()...");
      const resultPromise = (window as any).showadsbitvex();
      
      if (resultPromise && typeof resultPromise.then === "function") {
        resultPromise
          .then(() => {
            setRewardTestResult("✅ Reward Ad Completed Successfully");
            console.log("[Test Page] window.showadsbitvex promise resolved successfully!");
          })
          .catch((err: any) => {
            const errStr = err?.message || JSON.stringify(err) || String(err);
            setRewardTestResult(`❌ Ad closed or error: ${errStr}`);
            console.error(`[Test Page] window.showadsbitvex promise rejected: ${errStr}`);
          });
      } else {
        // Safe fallback in case they execute without returning promise
        setRewardTestResult("✅ Reward Ad Completed Successfully");
        console.log("[Test Page] window.showadsbitvex executed successfully (no promise returned).");
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      setRewardTestResult(`❌ Error: ${errMsg}`);
      setRuntimeErrors(prev => [...prev, errMsg]);
      console.error(`[Test Page] Execution crashed: ${errMsg}`);
    }
  };

  const handleTestInitAd = async () => {
    setInitTestResult("Testing...");

    if (typeof (window as any).showadsbitvex_init !== "function") {
      const errorMsg = "window.showadsbitvex_init is undefined. SDK may not be loaded.";
      setInitTestResult(`❌ window.showadsbitvex_init() is undefined`);
      setRuntimeErrors(prev => [...prev, errorMsg]);
      console.error(`[Test Page] ${errorMsg}`);
      return;
    }

    try {
      console.log("[Test Page] Calling window.showadsbitvex_init()...");
      const resultPromise = (window as any).showadsbitvex_init();

      if (resultPromise && typeof resultPromise.then === "function") {
        resultPromise
          .then(() => {
            setInitTestResult("✅ Init Ad Completed");
            console.log("[Test Page] window.showadsbitvex_init promise resolved successfully!");
          })
          .catch((err: any) => {
            const errStr = err?.message || JSON.stringify(err) || String(err);
            setInitTestResult(`❌ Error: ${errStr}`);
            console.error(`[Test Page] window.showadsbitvex_init promise rejected: ${errStr}`);
          });
      } else {
        setInitTestResult("✅ Init Ad Completed");
        console.log("[Test Page] window.showadsbitvex_init executed successfully (no promise returned).");
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      setInitTestResult(`❌ Error: ${errMsg}`);
      setRuntimeErrors(prev => [...prev, errMsg]);
      console.error(`[Test Page] Execution crashed: ${errMsg}`);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/adsbitvex-config`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
        if (data && data.finalSdkUrl) {
          injectSdkScript(data.finalSdkUrl);
        }
      })
      .catch(err => {
        console.error("Error reloading config:", err);
        setError("Failed to refresh configuration from server.");
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Loading AdsBitvex configurations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 font-sans select-none">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-200 flex items-center gap-2">
            🔌 <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AdsBitvex Integration Test Environment</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic, isolated sandbox to verify full AdsBitvex SDK operations.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
        >
          🔄 Refresh Page State
        </button>
      </div>

      {error && (
        <div className="w-full max-w-4xl bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 text-sm text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {/* Main Core Section */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Test Buttons (Center of screen) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-850 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl flex flex-col items-center justify-center">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Test Playground
            </span>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Trigger real-time monetization promises and view interactive response codes below.
            </p>
          </div>

          {/* Watch Reward Ad (The Primary Big Button) */}
          <div className="w-full space-y-3 pt-4">
            <button
              onClick={handleWatchRewardAd}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              🎁 Watch Reward Ad
            </button>
            <div className={`text-xs font-mono p-3 rounded-xl border text-center ${
              rewardTestResult.startsWith("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              rewardTestResult.startsWith("❌") ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
              rewardTestResult === "Testing..." ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
              "bg-slate-950 border-slate-800/80 text-slate-400"
            }`}>
              Result: {rewardTestResult}
            </div>
          </div>

          {/* Test Init Ad */}
          <div className="w-full space-y-3 pt-2">
            <button
              onClick={handleTestInitAd}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 active:scale-[0.99] text-slate-200 font-bold rounded-2xl border border-slate-700 text-sm sm:text-base transition-all flex items-center justify-center gap-2"
            >
              ⚡ Test Init Ad
            </button>
            <div className={`text-xs font-mono p-3 rounded-xl border text-center ${
              initTestResult.startsWith("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              initTestResult.startsWith("❌") ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
              initTestResult === "Testing..." ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
              "bg-slate-950 border-slate-800/80 text-slate-400"
            }`}>
              Result: {initTestResult}
            </div>
          </div>
        </div>

        {/* Right Side: Status Boxes & Quick Status Check */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Live Status Checker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Live Status Checker
            </h3>
            
            <div className="space-y-2">
              {[
                { label: "SDK Loaded", val: sdkLoaded },
                { label: "window.showadsbitvex Available", val: showadsbitvexAvailable },
                { label: "window.showadsbitvex_init Available", val: showadsbitvexInitAvailable },
                { label: "Head Script Found", val: headScriptFound }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50 text-xs">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${
                    item.val === "YES" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info block */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-xs text-slate-400 space-y-2 leading-relaxed">
            <h4 className="font-semibold text-slate-300">About the sandbox</h4>
            <p>
              This sandbox fetches and loads the same script saved in your main settings panel.
              It allows you to simulate and confirm the monetization promise chain without any risk to live user statistics.
            </p>
          </div>

        </div>

      </div>

      {/* Debug & Diagnostic Panel at bottom */}
      <div className="w-full max-w-4xl mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            ⚙️ Debug & Diagnostic Panel
          </h3>
          <button
            onClick={() => {
              setConsoleLogs([]);
              setRuntimeErrors([]);
            }}
            className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
          >
            Clear Log Feeds
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Metadata Parameters */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">SDK Script URL</span>
              <div className="font-mono text-[11px] text-slate-300 truncate mt-0.5">{config?.finalSdkUrl || "Not Loaded"}</div>
            </div>
            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">App ID</span>
              <div className="font-mono text-[11px] text-slate-300 truncate mt-0.5">{config?.appId || "Not Configured"}</div>
            </div>
            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Script Load Time</span>
              <div className="font-mono text-[11px] text-slate-300 mt-0.5">{sdkLoadTime}</div>
            </div>
            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Reward Test Status</span>
              <div className="font-mono text-[11px] text-slate-300 mt-0.5">{rewardTestResult}</div>
            </div>
            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Init Test Status</span>
              <div className="font-mono text-[11px] text-slate-300 mt-0.5">{initTestResult}</div>
            </div>
          </div>

          {/* Live System Detectors */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">window.showadsbitvex Detected</span>
              <div className="font-mono text-[11px] text-slate-300 mt-0.5">{showadsbitvexAvailable}</div>
            </div>
            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">window.showadsbitvex_init Detected</span>
              <div className="font-mono text-[11px] text-slate-300 mt-0.5">{showadsbitvexInitAvailable}</div>
            </div>
            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">SDK Loaded State</span>
              <div className="font-mono text-[11px] text-slate-300 mt-0.5">{sdkLoaded}</div>
            </div>
          </div>
        </div>

        {/* Console Log Interceptor & Runtime errors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Runtime Errors ({runtimeErrors.length})</span>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl h-36 overflow-y-auto font-mono text-[10px] text-rose-400 space-y-1 select-text">
              {runtimeErrors.length > 0 ? (
                runtimeErrors.map((err, i) => <div key={i}>• {err}</div>)
              ) : (
                <span className="text-slate-600 italic">No runtime errors logged.</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Intercepted Console Feed ({consoleLogs.length})</span>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl h-36 overflow-y-auto font-mono text-[9px] text-blue-300 space-y-1 select-text">
              {consoleLogs.length > 0 ? (
                consoleLogs.map((log, i) => <div key={i}>{log}</div>)
              ) : (
                <span className="text-slate-600 italic">No console logs caught yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
