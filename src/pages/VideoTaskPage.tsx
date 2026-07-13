import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { motion } from "motion/react";
import { ArrowLeft, Clock, ShieldCheck, PlayCircle, Gift, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

export default function VideoTaskPage({ taskId, userId, onBack }: { taskId: string; userId: string; onBack: () => void }) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<"countdown" | "readyToWatch" | "humanVerification" | "watching" | "verifying" | "readyToClaim" | "claimed">("countdown");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  
  // Anti-fraud Secure Verification States
  const [isHolding, setIsHolding] = useState(false);
  const [humanVerifyProgress, setHumanVerifyProgress] = useState(0);
  const [watchTimeLeft, setWatchTimeLeft] = useState(0);
  const [claimDelay, setClaimDelay] = useState(false);
  const [automationDetected, setAutomationDetected] = useState(false);

  const heartbeatIntervalRef = useRef<any>(null);
  const clickCountRef = useRef<number>(0);
  const lastInteractionTimeRef = useRef<number>(0);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user || { id: "12345678", username: "test_user" };

  const generateFingerprint = async (): Promise<string> => {
    let fp = localStorage.getItem("device_fingerprint");
    if (!fp) {
      fp = "fp_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("device_fingerprint", fp);
    }
    return fp;
  };

  const detectDevTools = (): boolean => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    return widthThreshold || heightThreshold;
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/video-tasks`);
      const data = await res.json();
      const t = data.find((x: any) => x.id === taskId);
      if (t) {
        setTask(t);
        setTimeLeft(parseInt(t.countdown) || 30);
      } else {
        setError("Task not found or inactive.");
      }
    } catch (e) {
      setError("Failed to load task.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "countdown" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep("readyToWatch");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  
  
  
  useEffect(() => {
    let interval: any;
    if (isHolding && humanVerifyProgress < 100) {
      interval = setInterval(() => {
        setHumanVerifyProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    } else if (!isHolding && humanVerifyProgress < 100) {
      setHumanVerifyProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, humanVerifyProgress]);

  useEffect(() => {
    if (humanVerifyProgress >= 100 && step === "humanVerification") {
      handleWatchAds();
    }
  }, [humanVerifyProgress, step]);

  useEffect(() => {
    const checkExistingSession = async () => {
      const existingToken = localStorage.getItem(`video_task_session_${taskId}`);
      if (existingToken) {
        try {
          const res = await fetch(`${API_BASE}/api/video-tasks/session-status?token=${existingToken}`);
          const data = await res.json();
          if (data.status === "pending" || data.status === "verified") {
            setSessionToken(existingToken);
            if (data.status === "verified") {
              setStep("readyToClaim");
            } else {
              setStep("watching");
            }
          } else {
            localStorage.removeItem(`video_task_session_${taskId}`);
          }
        } catch (e) {
          console.error("Error checking existing session:", e);
        }
      }
    };
    if (userId && taskId) {
      checkExistingSession();
    }
  }, [userId, taskId]);

  const handleWatchAds = async () => {
    try {
      setStep("watching");
      setError(null);
      const fingerprint = await generateFingerprint();
      const existingToken = localStorage.getItem(`video_task_session_${taskId}`) || undefined;
      
      const res = await fetch(`${API_BASE}/api/video-tasks/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          taskId, 
          fingerprint, 
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          chatId: tgUser?.id?.toString() || "Unknown",
          existingToken
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setStep("readyToWatch");
        return;
      }
      
      setSessionToken(data.token);
      localStorage.setItem(`video_task_session_${taskId}`, data.token);
      
      // Open the dedicated browser watch page in a new window/tab
      const watchUrl = `${window.location.origin}/watch/${data.token}`;
      if ((window as any).Telegram?.WebApp?.openLink) {
        (window as any).Telegram.WebApp.openLink(watchUrl);
      } else {
        window.open(watchUrl, "_blank");
      }
    } catch (e: any) {
      setError("Failed to start ad session.");
      setStep("readyToWatch");
    }
  };

  // Poll session status in backend to verify completion
  useEffect(() => {
    let pollInterval: any;
    if (step === "watching" && sessionToken) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/video-tasks/session-status?token=${sessionToken}`);
          const data = await res.json();
          if (data.status === "verified" || data.status === "completed" || data.status === "claimed") {
            setStep("readyToClaim");
            clearInterval(pollInterval);
          } else if (data.status === "invalidated") {
            setError(data.reason || "Ad session was invalidated due to security check.");
            setStep("readyToWatch");
            clearInterval(pollInterval);
          }
        } catch (e) {
          console.error("Polling status error:", e);
        }
      }, 1500);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, sessionToken]);

  const handleClaim = async () => {
    if (!sessionToken) return;
    setClaiming(true);
    setError(null);
    try {
      const fp = await generateFingerprint();
      const res = await fetch(`${API_BASE}/api/video-tasks/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          taskId, 
          token: sessionToken,
          fingerprint: fp,
          scriptLoaded: true,
          scriptExecuted: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setStep("claimed");
        console.log("Reward Credited");
      } else {
        setError(data.error || "Verification failed");
        console.log("Claim Failed:", data.error || "Verification failed");
      }
    } catch (e: any) {
      setError("Network error while claiming");
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading Task Details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Task Unavailable</h2>
          <p className="text-red-400">{error || "Task not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 pb-32">
      <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors font-medium">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Tasks
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="p-6 md:p-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-white">{task.name}</h1>
            <span className="bg-blue-600/20 text-blue-400 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-blue-500/30">
              <Gift className="w-4 h-4" />
              ₹{task.rewardAmount}
            </span>
          </div>

          <p className="text-slate-400 mb-8 leading-relaxed">{task.description}</p>

          <div className="space-y-6">
            {task.rules && (
              <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Rules & Requirements
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-slate-400" dangerouslySetInnerHTML={{ __html: task.rules }} />
              </div>
            )}

            {task.claimProcess && (
              <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-blue-400" /> Claim Process
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-slate-400" dangerouslySetInnerHTML={{ __html: task.claimProcess }} />
              </div>
            )}
          </div>

          {/* Action Section */}
          <div className="mt-10 p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            {step === "countdown" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                  <span className="text-2xl font-black text-white">{timeLeft}</span>
                </div>
                <p className="text-slate-400 text-sm">Please read the rules carefully. You can start the task in {timeLeft} seconds.</p>
                <button disabled className="w-full py-4 rounded-xl font-bold bg-slate-800 text-slate-500 cursor-not-allowed transition-all">
                  Watch Ads (Wait {timeLeft}s)
                </button>
              </div>
            )}

            {step === "readyToWatch" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-900/30 flex items-center justify-center border-4 border-blue-500/50">
                  <PlayCircle className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-slate-300 text-sm">Task is ready. Please click below to start watching the video ad.</p>
                <button onClick={() => setStep("humanVerification")} className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                  Start & Watch Ads
                </button>
              </div>
            )}

            
            {step === "humanVerification" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-indigo-900/30 rounded-full flex items-center justify-center border-4 border-indigo-500/30">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Security Check</h3>
                  <p className="text-slate-400 text-sm">Please press and hold the button below to verify you are human.</p>
                </div>
                
                <div 
                  className="relative w-full h-20 bg-slate-800 rounded-2xl overflow-hidden cursor-pointer select-none border border-slate-700"
                  onMouseDown={() => setIsHolding(true)}
                  onMouseUp={() => setIsHolding(false)}
                  onMouseLeave={() => setIsHolding(false)}
                  onTouchStart={() => setIsHolding(true)}
                  onTouchEnd={() => setIsHolding(false)}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-100" 
                    style={{ width: `${humanVerifyProgress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-white z-10 pointer-events-none">
                    {humanVerifyProgress < 100 ? "Press & Hold to Verify" : "Verified!"}
                  </div>
                </div>
              </div>
            )}
            
            {step === "watching" && (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border-4 border-amber-500 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-black text-white">Ad Opened in New Window</h3>
                  <p className="text-slate-400 text-xs px-4 mt-1 leading-relaxed">
                    Please keep this page open. Watch the video advertisement completely in the newly opened tab.
                  </p>
                  <p className="text-amber-400 text-xs mt-3 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                    ⏱️ Claim button will automatically activate here when done.
                  </p>
                </div>
                
                {/* Reopen Helper button */}
                <button 
                  onClick={() => {
                    if (sessionToken) {
                      const url = `${window.location.origin}/watch/${sessionToken}`;
                      if ((window as any).Telegram?.WebApp?.openLink) {
                        (window as any).Telegram.WebApp.openLink(url);
                      } else {
                        window.open(url, "_blank");
                      }
                    }
                  }}
                  className="w-full py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 font-bold text-xs transition-all active:scale-[0.98]"
                >
                  🌐 Reopen Advertisement Page
                </button>
              </div>
            )}

            {step === "readyToClaim" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-900/30 flex items-center justify-center border-4 border-emerald-500/50">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Ad Verification Successful</h3>
                <p className="text-slate-400 text-sm">You have successfully watched the ad. You can now claim your reward.</p>
                <button 
                  onClick={handleClaim} 
                  disabled={claiming}
                  className="w-full py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70"
                >
                  {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
                  {claiming ? "Processing Claim..." : "Claim Reward"}
                </button>
              </div>
            )}

            {step === "claimed" && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-900/30 flex items-center justify-center border-4 border-blue-500/50">
                  <CheckCircle2 className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-black text-white">Reward Claimed!</h3>
                <p className="text-blue-200">₹{task.rewardAmount} has been added to your wallet.</p>
                <button onClick={onBack} className="w-full mt-4 py-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all">
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
