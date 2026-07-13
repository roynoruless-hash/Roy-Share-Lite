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

  const handleWatchAds = async () => {
    try {
      setStep("watching");
      const fingerprint = await generateFingerprint();
      const existingToken = localStorage.getItem(`video_task_session_${taskId}`);
      
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
      setWatchTimeLeft(parseInt(data.countdown) || 0);
      localStorage.setItem(`video_task_session_${taskId}`, data.token);
      
      // Inject Script safely
      let scriptLoaded = false;
      let scriptExecuted = false;
      if (scriptContainerRef.current && data.script) {
        scriptContainerRef.current.innerHTML = "";
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.script, 'text/html');
        Array.from(doc.body.childNodes).forEach((node) => {
          if (node.nodeName.toLowerCase() === 'script') {
            const scriptEl = document.createElement("script");
            const oldScript = node as HTMLScriptElement;
            Array.from(oldScript.attributes).forEach(attr => scriptEl.setAttribute(attr.name, attr.value));
            scriptEl.text = oldScript.text;
            scriptEl.onload = () => { scriptLoaded = true; };
            if (oldScript.text) { scriptLoaded = true; scriptExecuted = true; }
            scriptContainerRef.current?.appendChild(scriptEl);
          } else {
            scriptContainerRef.current?.appendChild(node.cloneNode(true));
          }
        });
        setTimeout(() => { scriptExecuted = true; }, 1000);
      }

      setStep("readyToClaim");
      (window as any)._videoAdFlags = { scriptLoaded: true, scriptExecuted: true };
      
      // Start Heartbeat
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(async () => {
         try {
            await fetch(`${API_BASE}/api/video-tasks/heartbeat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: data.token,
                userId,
                taskId,
                fingerprint: await generateFingerprint(),
                documentHidden: document.hidden || document.visibilityState === 'hidden',
                devToolsDetected: detectDevTools(),
                automationDetected: automationDetected || (clickCountRef.current > 50)
              })
            });
            clickCountRef.current = 0; // Reset
         } catch(e) {}
      }, 5000);
      
    } catch (e: any) {
      setError("Failed to start ad session.");
      setStep("readyToWatch");
    }
  };

  
  // Active watch timer (pauses when hidden)
  useEffect(() => {
    let timer: any;
    if (step === "readyToClaim" && watchTimeLeft > 0) {
      timer = setInterval(() => {
        if (!document.hidden && document.visibilityState !== 'hidden') {
          setWatchTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, watchTimeLeft]);

  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // Automation Detection
  useEffect(() => {
    const clickHandler = () => {
      clickCountRef.current += 1;
      const now = Date.now();
      if (now - lastInteractionTimeRef.current < 50) {
        // Super fast click, might be bot
        if (clickCountRef.current > 10) setAutomationDetected(true);
      }
      lastInteractionTimeRef.current = now;
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  // Claim Delay Hook
  useEffect(() => {
    if (step === "readyToClaim" && timeLeft <= 0 && !claimDelay) {
      setClaimDelay(true);
      const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5s delay
      setTimeout(() => setClaimDelay(false), delay);
    }
  }, [step, timeLeft]);




  const handleClaim = async () => {
    if (!sessionToken) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/video-tasks/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, taskId, token: sessionToken })
      });
      const data = await res.json();
      if (data.success) {
        setStep("claimed");
      } else {
        setError(data.error || "Verification failed");
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
                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Watching Advertisement...</h3>
                  <p className="text-amber-400 text-sm">Please watch the ad completely. Do not close this page.</p>
                </div>
                
                {/* Ad Container */}
                <div ref={scriptContainerRef} className="min-h-[100px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center flex-col relative z-20">
                  <span className="text-slate-600 text-xs my-8">Advertisement Loading...</span>
                </div>
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
