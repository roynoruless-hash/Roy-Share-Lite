import React, { useState, useEffect } from "react";
import { watchdog, StepStatus } from "../lib/startupWatchdog";
import { AlertCircle, RefreshCw, ChevronRight, CheckCircle2, XCircle, Info, Sparkles, Terminal } from "lucide-react";

export const StartupWatchdogOverlay: React.FC = () => {
  const [isHung, setIsHung] = useState(watchdog.getHangState());
  const [steps, setSteps] = useState<Record<string, StepStatus>>({ ...watchdog.steps });
  const [logs, setLogs] = useState(watchdog.getLogs());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = watchdog.subscribe((w) => {
      setIsHung(w.getHangState());
      setSteps({ ...w.steps });
      setLogs(w.getLogs());
    });
    return unsubscribe;
  }, []);

  if (!isHung) return null;

  // Render a gorgeous diagnostic board
  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[9999] flex flex-col justify-center items-center p-6 font-sans overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mx-auto shadow-xl shadow-blue-500/5 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Initializing Roy Share Earn...</h2>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            We are setting up a secure connection. This is taking slightly longer than expected due to network latency.
          </p>
        </div>

        {/* Diagnostic Status Cards */}
        <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            <span>Critical Milestones</span>
            <span className="text-blue-400">Live Status</span>
          </div>
          
          {Object.values(steps)
            .filter((step) => ['1', '2', '4', '5', '6', '13'].includes(step.id))
            .map((step) => (
              <div key={step.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-900/40 text-xs">
                <span className="font-semibold text-slate-300">{step.name}</span>
                <span className="flex items-center gap-1.5 font-bold font-mono">
                  {step.status === 'COMPLETED' && (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
                  )}
                  {step.status === 'FAILED' && (
                    <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Failed</span>
                  )}
                  {step.status === 'IN_PROGRESS' && (
                    <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-1" />
                      Loading...
                    </span>
                  )}
                  {step.status === 'NOT_STARTED' && (
                    <span className="text-slate-600 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Queued</span>
                  )}
                </span>
              </div>
            ))}
        </div>

        {/* Console logs expansion */}
        <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full p-3 flex justify-between items-center text-xs text-slate-400 hover:bg-slate-900/40 transition-colors"
          >
            <span className="flex items-center gap-2 font-mono"><Terminal className="w-4 h-4 text-blue-400" /> Diagnostics Console Logs</span>
            <ChevronRight className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          
          {expanded && (
            <div className="p-3 border-t border-slate-800/40 max-h-40 overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1">
              {logs.slice(-15).reverse().map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600">[{log.elapsedMs}ms]</span>
                  <span className={
                    log.status === 'SUCCESS' ? 'text-emerald-400' :
                    log.status === 'FAILED' ? 'text-rose-400 font-bold' : 'text-blue-400'
                  }>
                    {log.stepId}
                  </span>
                  <span className="text-slate-400">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-800 active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </button>
          
          <button
            onClick={() => {
              console.log("[WATCHDOG] Force bypass triggered by user action.");
              watchdog.markAppReady();
            }}
            className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            Proceed to App <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
