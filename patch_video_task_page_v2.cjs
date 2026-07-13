const fs = require('fs');

let pageCode = fs.readFileSync('src/pages/VideoTaskPage.tsx', 'utf8');

// Replace standard handleWatchAds step with humanVerification step logic
const newFingerprintCode = `
const generateFingerprint = async () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    !!window.indexedDB,
    typeof window.openDatabase !== 'undefined',
    navigator.cpuClass,
    navigator.platform,
    navigator.doNotTrack,
    navigator.hardwareConcurrency,
    navigator.maxTouchPoints
  ];
  const str = components.join('###');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// DevTools Detection
const detectDevTools = () => {
  const threshold = 160;
  if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
    return true;
  }
  return false;
};
`;

pageCode = pageCode.replace(/const generateFingerprint = async \(\) => \{[\s\S]*?return hash\.toString\(16\);\n\};\n/, newFingerprintCode);

// Add state variables and hooks for V2 logic
// Replace export default function VideoTaskPage() { ... with additional state
const functionStartRegex = /export default function VideoTaskPage\(\) \{([\s\S]*?)const \[sessionToken, setSessionToken\] = useState<string \| null>\(null\);/;
const functionStartMatch = pageCode.match(functionStartRegex);

if (functionStartMatch) {
  const extraState = `
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [humanVerifyProgress, setHumanVerifyProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [claimDelay, setClaimDelay] = useState(false);
  const [automationDetected, setAutomationDetected] = useState(false);
  
  // Heartbeat & Visibility refs
  const heartbeatIntervalRef = useRef<any>(null);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const clickCountRef = useRef<number>(0);
`;
  pageCode = pageCode.replace(functionStartRegex, `export default function VideoTaskPage() {${functionStartMatch[1]}${extraState}`);
}

// Update handleWatchAds logic to require human Verification step
// We change "readyToWatch" button to just switch to "humanVerification"
const readyToWatchButton = /onClick=\{handleWatchAds\} className="w-full py-4 rounded-xl font-bold bg-blue-600/;
pageCode = pageCode.replace(readyToWatchButton, `onClick={() => setStep("humanVerification")} className="w-full py-4 rounded-xl font-bold bg-blue-600`);

// Update handleWatchAds to actually start the session
const handleWatchAdsRegex = /const handleWatchAds = async \(\) => \{[\s\S]*?catch \(e: any\) \{[\s\S]*?setStep\("readyToWatch"\);\n    \}\n  \};/;

const newHandleWatchAds = `
  const handleWatchAds = async () => {
    try {
      setStep("watching");
      const fingerprint = await generateFingerprint();
      const existingToken = localStorage.getItem(\`video_task_session_\${taskId}\`);
      
      const res = await fetch(\`\${API_BASE}/api/video-tasks/session\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          taskId, 
          fingerprint, 
          userAgent: navigator.userAgent,
          screenResolution: \`\${screen.width}x\${screen.height}\`,
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
      localStorage.setItem(\`video_task_session_\${taskId}\`, data.token);
      
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
            await fetch(\`\${API_BASE}/api/video-tasks/heartbeat\`, {
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

`;

pageCode = pageCode.replace(handleWatchAdsRegex, newHandleWatchAds);

// Fix Human Verification logic & UI
const humanVerifyUI = `
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
                    style={{ width: \`\${humanVerifyProgress}%\` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-white z-10 pointer-events-none">
                    {humanVerifyProgress < 100 ? "Press & Hold to Verify" : "Verified!"}
                  </div>
                </div>
              </div>
            )}
            
            {step === "watching" && (
`;

// Also need a useEffect for humanVerifyProgress
const humanVerifyEffect = `
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
`;

pageCode = pageCode.replace(/\{step === "watching" && \(/, humanVerifyUI);
pageCode = pageCode.replace('const handleWatchAds = async () => {', humanVerifyEffect + '\n  const handleWatchAds = async () => {');

// Fix Claim Delay UI
// Change the claim button logic
const claimButtonRegex = /<button onClick=\{handleClaimReward\} disabled=\{timeLeft > 0\}[\s\S]*?\{timeLeft > 0 \? \`Claim Reward in \$\{timeLeft\}s\` : "Claim Reward"\}/;
const newClaimButton = `
                <button 
                  onClick={handleClaimReward} 
                  disabled={timeLeft > 0 || claimDelay} 
                  className={\`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all \${
                    (timeLeft > 0 || claimDelay) ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                  }\`}
                >
                  {timeLeft > 0 ? \`Claim Reward in \${timeLeft}s\` : claimDelay ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim Reward"}
`;
pageCode = pageCode.replace(claimButtonRegex, newClaimButton);

// Add missing ShieldCheck import if not present
if (!pageCode.includes('ShieldCheck')) {
  pageCode = pageCode.replace('import { PlayCircle, Loader2, DollarSign, CheckCircle2, Clock, AlertTriangle } from "lucide-react";', 'import { PlayCircle, Loader2, DollarSign, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";');
}

fs.writeFileSync('src/pages/VideoTaskPage.tsx', pageCode);
console.log('Successfully patched VideoTaskPage.tsx with V2 security.');
