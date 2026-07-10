import { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";
import { Clock, ShieldAlert, ArrowRight, Download, ExternalLink, CheckCircle2, Share2, Copy, Check, FileIcon } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";


// ----------------- No ads here -----------------


// ----------------- No ads here -----------------
// ----------------- Error Boundary ---------------------------
interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught uncaught render error inside MultiPageEngine:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      return (
        <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden bg-slate-950">
          <AnimatedBackground />
          <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900/95 border border-rose-500/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                <span>⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white">Application Render Error</h2>
              <p className="text-slate-400 text-sm">
                A JavaScript error occurred while rendering the page content.
              </p>
              <div className="text-left bg-slate-950/60 p-4 rounded-xl border border-white/5 font-mono text-xs text-rose-300 max-h-40 overflow-y-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
              >
                🔄 Reload Page
              </button>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PageConfig {
  pageNumber: number;
  timerDuration: number;
  humanVerification: boolean;
  selectedAdIds: string[];
  instructions?: string;
  verifyBtnText?: string;
  continueBtnText?: string;
}

interface MultiPageEngineProps {
  type: "shortener" | "download";
  id: string; // shortLink alias/id or fileId
}

function MultiPageEngineInner({ type, id }: MultiPageEngineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagesConfig, setPagesConfig] = useState<PageConfig[]>([]);
  const currentPageConfig = pagesConfig.find((p) => p.pageNumber === currentPage);
  
  // Timer & interactive states
  const [timer, setTimer] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordVerifying, setPasswordVerifying] = useState(false);

  const handlePasswordSubmit = async () => {
     if (!passwordInput) return;
     setPasswordVerifying(true);
     setPasswordError("");
     try {
       const res = await fetch(`${API_BASE}/api/smart-links/session/verify-password`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ sessionId, password: passwordInput })
       });
       const data = await res.json();
       if (res.ok && data.success) {
          setIsPasswordProtected(false);
       } else {
          setPasswordError("❌ Incorrect Password");
       }
     } catch (err) {
       setPasswordError("An error occurred");
     }
     setPasswordVerifying(false);
  };

  const [mathQuestion, setMathQuestion] = useState("");
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [verifyClicked, setVerifyClicked] = useState(false);


  // Bottom scroll reference
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };
  
  // Final action states
  const [finalCountdown, setFinalCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Redesign Download Page Custom States & Helpers
  const [copiedShare, setCopiedShare] = useState(false);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const getFileType = (fileName?: string) => {
    if (!fileName) return "Unknown Document";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext) return "Unknown Document";
    
    const mimeMap: Record<string, string> = {
      pdf: "PDF Document",
      doc: "Word Document",
      docx: "Word Document",
      xls: "Excel Spreadsheet",
      xlsx: "Excel Spreadsheet",
      ppt: "PowerPoint Presentation",
      pptx: "PowerPoint Presentation",
      txt: "Plain Text File",
      zip: "ZIP Archive",
      rar: "RAR Archive",
      tar: "TAR Archive",
      gz: "Gzipped Archive",
      "7z": "7-Zip Archive",
      png: "PNG Image",
      jpg: "JPEG Image",
      jpeg: "JPEG Image",
      gif: "GIF Image",
      mp3: "MP3 Audio",
      wav: "WAV Audio",
      mp4: "MP4 Video",
      mkv: "MKV Video",
      avi: "AVI Video",
      mov: "QuickTime Video",
      html: "HTML File",
      css: "CSS Stylesheet",
      js: "JavaScript File",
      ts: "TypeScript File"
    };
    
    return mimeMap[ext] || `${ext.toUpperCase()} File`;
  };

  useEffect(() => {
    if (type === "download" && itemData?.fileName) {
      const fetchRelated = async () => {
        try {
          const ext = itemData.fileName.split(".").pop()?.toLowerCase() || "";
          const { db } = await import("../lib/firebase");
          const { collection, getDocs, limit, query, where } = await import("firebase/firestore");
          
          const q = query(collection(db, "uploads"), where("status", "==", "active"), limit(12));
          const snap = await getDocs(q);
          const list: any[] = [];
          snap.forEach((doc) => {
            const data = doc.data();
            if (doc.id !== id) {
              list.push({ id: doc.id, ...data });
            }
          });
          
          let filtered = list.filter((f) => f.fileName?.toLowerCase().endsWith(`.${ext}`));
          if (filtered.length < 3) {
            const otherFiles = list.filter((f) => !f.fileName?.toLowerCase().endsWith(`.${ext}`));
            filtered = [...filtered, ...otherFiles];
          }
          setRelatedFiles(filtered.slice(0, 3));
        } catch (err) {
          console.error("Error fetching related files:", err);
        }
      };
      fetchRelated();
    }
  }, [type, itemData, id]);
  
  // Security
  const [securityChecked, setSecurityChecked] = useState(false);
  const [securityBlockReason, setSecurityBlockReason] = useState<string | null>(null);

  const currentPageAds: any[] = [];

  // Initialize session and fetch target item details
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log(`[MultiPageEngine] initSession triggered. Type="${type}", ID="${id}"`);
        setLoading(true);
        // Get user device details for tracking
        const ua = navigator.userAgent;
        let device = "Desktop";
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
          device = "Mobile";
        }
        
        let browser = "Unknown";
        if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari")) browser = "Safari";
        else if (ua.includes("Edge")) browser = "Edge";

        console.log(`[MultiPageEngine] Client Environment details: Device=${device}, Browser=${browser}, UserAgent="${ua}"`);

        let country = "Unknown";
        try {
          console.log("[MultiPageEngine] Fetching geolocation data...");
          const geoRes = await fetch("https://ipapi.co/json/").catch(() => null);
          if (geoRes && geoRes.ok) {
            const geoData = await geoRes.json();
            country = geoData.country_name || "Unknown";
            console.log("[MultiPageEngine] Geolocation lookup success. Country:", country);
          } else {
            console.warn("[MultiPageEngine] Geolocation response was not successful.");
          }
        } catch (e) {
          console.error("[MultiPageEngine] Geolocation lookup error:", e);
        }

        console.log("[MultiPageEngine] Initializing secure routing session...");
        const initRes = await fetch(`${API_BASE}/api/smart-links/session/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            id,
            browser,
            device,
            country,
            referrer: document.referrer || "Direct"
          })
        });

        console.log(`[MultiPageEngine] Session API raw response status: ${initRes.status} ${initRes.statusText}`);
        const initData = await initRes.json();
        console.log("[MultiPageEngine] Session API parsed data:", initData);

        if (!initRes.ok || !initData.success) {
          const errMsg = initData.message || `Session API error (status: ${initRes.status})`;
          console.error("[MultiPageEngine] Session initiation failed:", errMsg);
          setError(errMsg);
          setLoading(false);
          return;
        }

        // Check security blocks
        if (initData.securityBlocked) {
          console.warn("[MultiPageEngine] Access blocked due to security policies:", initData.securityReason);
          setSecurityBlockReason(initData.securityReason);
          setLoading(false);
          return;
        }

        console.log("[MultiPageEngine] Session claims authorized. Active SessionID:", initData.sessionId);
        setItemData(initData.data);
        setSessionId(initData.sessionId);
        if (initData.isPasswordProtected) {
           setIsPasswordProtected(true);
        }
        setTotalPages(initData.totalPages || 1);
        setPagesConfig(initData.pagesConfig || []);
        
        // Setup Page 1 Timer
        const page1Config = initData.pagesConfig?.find((p: any) => p.pageNumber === 1);
        const duration = page1Config ? Number(page1Config.timerDuration) : 5;
        console.log(`[MultiPageEngine] Page 1 config located. Timer duration: ${duration}s`);
        setTimer(duration);
        setIsTimerActive(true);
        setShowVerifyButton(false);
        setVerifyClicked(false);
        setHumanVerified(false);
        setIsPageComplete(false);

        setLoading(false);
        console.log("[MultiPageEngine] Session initialization completed. Render stage active.");
      } catch (err: any) {
        console.error("[MultiPageEngine] Fatal error during session initiation:", err);
        setError("Error establishing a secure session: " + (err.message || String(err)));
        setLoading(false);
      }
    };

    initSession();
  }, [type, id]);

  // Handle countdown timer
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerActive) {
      setIsTimerActive(false);
      // Show the Verify button when the countdown finishes
      setShowVerifyButton(true);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  // Generate simple math captcha for human verification
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setMathQuestion(`${num1} + ${num2}`);
    setCaptchaAnswer(String(num1 + num2));
    setCaptchaInput("");
    setCaptchaError(false);
    setHumanVerified(false);
  };

  const handleVerifyClick = () => {
    setVerifyClicked(true);
    const currentPageConfig = pagesConfig.find((p) => p.pageNumber === currentPage);
    const requiresCaptcha = currentPageConfig ? currentPageConfig.humanVerification : (itemData?.humanVerification !== false);

    if (requiresCaptcha) {
      generateCaptcha();
      scrollToBottom();
    } else {
      setHumanVerified(true);
      const isLast = currentPage === totalPages;
      if (type === "shortener" && isLast) {
        handleClaim();
      } else {
        setIsPageComplete(true);
      }
      scrollToBottom();
    }
  };

  const handleVerifyCaptcha = () => {
    if (captchaInput.trim() === captchaAnswer) {
      setHumanVerified(true);
      setCaptchaError(false);
      const isLast = currentPage === totalPages;
      if (type === "shortener" && isLast) {
        handleClaim();
      } else {
        setIsPageComplete(true);
      }
      scrollToBottom();
    } else {
      setCaptchaError(true);
    }
  };

  // Move to next page
  const handleNextPage = async () => {
    if (!isPageComplete || !sessionId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/smart-links/session/page-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pageNumber: currentPage
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save progress.");
        setLoading(false);
        return;
      }

      const next = data.nextPage;
      setCurrentPage(next);
      setIsPageComplete(false);
      setHumanVerified(false);
      setShowVerifyButton(false);
      setVerifyClicked(false);
      
      // Load next page config
      const nextConfig = pagesConfig.find((p) => p.pageNumber === next);
      setTimer(nextConfig ? nextConfig.timerDuration : 5);
      setIsTimerActive(true);
      
      setLoading(false);
    } catch (err) {
      console.error("Error progressing to next page:", err);
      setError("Failed to sync progress with the server.");
      setLoading(false);
    }
  };

  

  

  

  // Final Action: Claim Destination URL or Secure Download
  const handleClaim = async () => {
    if (!sessionId) {
      console.warn("[MultiPageEngine] Cannot claim. Missing sessionId.");
      return;
    }
    console.log(`[MultiPageEngine] handleClaim triggered for sessionId: "${sessionId}", currentPage: ${currentPage}, totalPages: ${totalPages}`);
    setRedirecting(true);
    try {
      // If we are on the last step of a shortener, we must first report this last page as complete to the server!
      if (type === "shortener" && currentPage === totalPages) {
        console.log(`[MultiPageEngine] Reporting final page (${currentPage}) as complete before claiming...`);
        const pCompRes = await fetch(`${API_BASE}/api/smart-links/session/page-complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            pageNumber: currentPage
          })
        });
        const pCompData = await pCompRes.json();
        console.log("[MultiPageEngine] Final page-complete response:", pCompData);
        if (!pCompRes.ok || !pCompData.success) {
          const errMsg = pCompData.message || "Failed to complete final step verification.";
          console.error("[MultiPageEngine] Final page complete failed:", errMsg);
          setError(errMsg);
          setRedirecting(false);
          return;
        }
        // Sync current page state to nextPage
        setCurrentPage(pCompData.nextPage || (currentPage + 1));
      }

      console.log("[MultiPageEngine] Calling session claim API...");
      const res = await fetch(`${API_BASE}/api/smart-links/session/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      console.log("[MultiPageEngine] Session claim response status:", res.status);
      const data = await res.json();
      console.log("[MultiPageEngine] Session claim response body:", data);

      if (!res.ok || !data.success) {
        const errMsg = data.message || "Claim validation failed.";
        console.error("[MultiPageEngine] Claim failed:", errMsg);
        setError(errMsg);
        setRedirecting(false);
        return;
      }

      if (type === "shortener") {
        if (!data.destinationUrl) {
          const errMsg = "The target destination URL is missing or unavailable. Please contact the administrator.";
          console.error("[MultiPageEngine] Destination URL is missing:", data);
          setError(errMsg);
          setRedirecting(false);
          return;
        }

        console.log("[MultiPageEngine] Claimed destination URL successfully:", data.destinationUrl);
        setDestinationUrl(data.destinationUrl);

        
        // Start auto-redirect countdown if enabled
        if (itemData?.autoRedirect !== false) {
          const delay = itemData?.finalRedirectDelay !== undefined ? Number(itemData.finalRedirectDelay) : 5;
          console.log(`[MultiPageEngine] Auto-redirect is enabled. Starting countdown of ${delay}s...`);
          setFinalCountdown(delay);
          
          let cd = delay;
          const rdInterval = setInterval(() => {
            cd--;
            setFinalCountdown(cd);
            console.log(`[MultiPageEngine] Redirecting in ${cd}s to:`, data.destinationUrl);
            if (cd <= 0) {
              clearInterval(rdInterval);
              console.log("[MultiPageEngine] Redirecting now to:", data.destinationUrl);
              window.location.href = data.destinationUrl;
            }
          }, 1000);
        } else {
          console.log("[MultiPageEngine] Auto-redirect is disabled. User must click manually.");
        }
      } else {
        if (!data.downloadUrl) {
          const errMsg = "The secure file download URL is missing or expired. Please contact the administrator.";
          console.error("[MultiPageEngine] Download URL is missing:", data);
          setError(errMsg);
          setRedirecting(false);
          return;
        }

        console.log("[MultiPageEngine] Claimed secure file download URL successfully:", data.downloadUrl);
        setDownloadUrl(data.downloadUrl);
        // Automatically open file download link in a new tab if available
        if (data.downloadUrl) {
          console.log("[MultiPageEngine] Opening download URL in a new tab:", data.downloadUrl);
          window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err: any) {
      console.error("[MultiPageEngine] Error claiming target:", err);
      setError("An error occurred during final redirection: " + (err.message || String(err)));
      setRedirecting(false);
    }
  };

  const isFinalStep = currentPage > totalPages;

  if (loading) {
    return (
      <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden">
        <AnimatedBackground />
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <span className="text-slate-400 font-medium">
            {currentPage === 1 ? "Verifying security parameters and loading center..." : `Synchronizing with security portal (Step ${currentPage})...`}
          </span>
        </main>
      </div>
    );
  }

  if (isPasswordProtected) {
    return (
      <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden">
        <AnimatedBackground />
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-700 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-white">This link is password protected.</h2>
            {passwordError && <p className="text-rose-400 text-sm font-semibold">{passwordError}</p>}
            <div className="text-left space-y-2">
              <label className="block text-sm font-medium text-slate-400">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="Enter password..."
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
              />
            </div>
            <button
              onClick={handlePasswordSubmit}
              disabled={passwordVerifying || !passwordInput}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition"
            >
              {passwordVerifying ? "Verifying..." : "Unlock Button"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (securityBlockReason) {
    return (
      <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden">
        <AnimatedBackground />
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/90 border border-rose-500/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert size={36} />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Access Restricted</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{securityBlockReason}</p>
            <div className="text-xs text-slate-500 border-t border-white/5 pt-4">
              Your IP and session signatures are registered for security compliance.
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden">
        <AnimatedBackground />
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/90 border border-rose-500/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400 animate-pulse">
              <ShieldAlert size={36} />
            </div>
            <h2 className="text-xl font-bold text-white">An Error Occurred</h2>
            <p className="text-slate-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
            >
              🔄 Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/20 backdrop-blur-sm">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">
          RoyShare Center
        </span>
        <div className="text-xs text-slate-400 font-medium bg-slate-900/80 px-3 py-1 rounded-full border border-white/5">
          {!isFinalStep ? `Step ${currentPage} of ${totalPages}` : "Final Verification"}
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-7xl mx-auto">

        <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl space-y-6">
          <AnimatePresence mode="wait">
            {!isFinalStep ? (
              <motion.div
                key={`step-${currentPage}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Step Instructions */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                    <span>🔗</span> {type === "download" ? "RoyShare Secure File Portal" : "RoyShare Smart URL Hub"}
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {currentPageConfig ? currentPageConfig.instructions || itemData?.instructions : itemData?.instructions || "Follow the instructions below to unlock your destination link."}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="bg-slate-950/60 rounded-xl p-6 border border-white/5 space-y-4 text-sm relative overflow-hidden">
                  {/* Step status bar */}
                  <div className="flex justify-between items-center text-xs font-mono text-slate-500">
                    <span>Task Verification Step {currentPage} of {totalPages}</span>
                    <span className="text-teal-400">
                      {isPageComplete ? "Status: Verification Successful" : "Status: In Progress"}
                    </span>
                  </div>

                  <div className="h-px bg-white/5"></div>

                  {/* Timer or Verification Logic */}
                  {timer > 0 ? (
                    <div className="text-center py-4 space-y-2">
                      <div className="text-5xl font-black text-teal-400 tracking-tight animate-pulse">{timer}s</div>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <Clock size={12} className="animate-spin" /> Seconds remaining until page unlocks
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-4">
                      {/* Show the Verify button if they haven't clicked verify yet */}
                      {!verifyClicked ? (
                        <div className="py-2">
                          <button
                            id="verify-btn"
                            onClick={handleVerifyClick}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl transition duration-200 transform active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>✅</span> {currentPageConfig?.verifyBtnText || itemData?.verifyButtonText || "Verify This Step"}
                          </button>
                        </div>
                      ) : (
                        currentPageConfig?.humanVerification && !humanVerified ? (
                          <div className="bg-slate-900 border border-white/10 rounded-xl p-4 space-y-3 max-w-sm mx-auto text-left">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">Solve Math Challenge</p>
                            <div className="flex items-center justify-center gap-3">
                              <span className="font-mono text-lg font-bold text-teal-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5">
                                {mathQuestion}
                              </span>
                              <span className="text-slate-400 font-bold">=</span>
                              <input
                                id="captcha-input"
                                type="number"
                                placeholder="Answer"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleVerifyCaptcha()}
                                className="w-24 bg-slate-950 border border-slate-800 rounded-lg py-1.5 text-center font-mono text-lg text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            {captchaError && (
                              <p className="text-[11px] text-rose-400 font-semibold text-center">❌ Incorrect response. Try again!</p>
                            )}
                            <button
                              id="submit-captcha-btn"
                              onClick={handleVerifyCaptcha}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                            >
                              Verify Human
                            </button>
                          </div>
                        ) : (
                          type === "shortener" && currentPage === totalPages ? (
                            redirecting ? (
                              destinationUrl ? (
                                itemData?.autoRedirect !== false ? (
                                  <div className="space-y-3 py-2">
                                    <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 py-1.5 px-3 rounded border border-emerald-500/10">Preparing Destination...</p>
                                    <p className="text-slate-300 font-semibold text-xs">Redirecting in...</p>
                                    <div className="text-5xl font-black text-teal-400 animate-pulse">{finalCountdown}s</div>
                                  </div>
                                ) : (
                                  <div className="space-y-4 py-2">
                                    <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 py-1.5 px-3 rounded border border-emerald-500/10">Preparing Destination...</p>
                                    <div className="pt-2">
                                      <a
                                        id="destination-link"
                                        href={destinationUrl}
                                        className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                                      >
                                        🚀 Continue to Destination <ExternalLink size={14} />
                                      </a>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="py-4 space-y-2">
                                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                  <p className="text-slate-400 text-xs">Securing your redirect token...</p>
                                </div>
                              )
                            ) : (
                              <p className="text-emerald-400 font-semibold text-sm flex items-center justify-center gap-1.5 bg-emerald-500/10 py-2 px-4 rounded-lg border border-emerald-500/15">
                                ✅ Verification completed successfully!
                              </p>
                            )
                          ) : (
                            <p className="text-emerald-400 font-semibold text-sm flex items-center justify-center gap-1.5 bg-emerald-500/10 py-2 px-4 rounded-lg border border-emerald-500/15">
                              ✅ Verification completed successfully!
                            </p>
                          )
                        )
                      )}
                    </div>
                  )}
                </div>



                {/* Progression Control */}
                {isPageComplete && (type !== "shortener" || currentPage < totalPages) && (
                  <div className="pt-2">
                    <button
                      id="continue-btn"
                      onClick={handleNextPage}
                      className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-lg shadow-teal-500/10 cursor-pointer transition duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {currentPageConfig?.continueBtnText || itemData?.continueButtonText || "Proceed to Next Step"} <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* Scroll reference anchor */}
                <div ref={bottomRef} className="h-2" />
              </motion.div>
            ) : (
              <motion.div
                key="final-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">🎉 Verification Completed</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      All steps successfully completed. Access is now fully authorized!
                    </p>
                  </div>
                </div>

                 {type === "download" ? (
                  <div className="space-y-6">
                    {downloadUrl ? (
                      /* ANIMATED SUCCESS SCREEN AFTER DOWNLOAD */
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-emerald-950/20 rounded-xl p-6 border border-emerald-500/20 text-center space-y-4"
                      >
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse relative">
                          <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping"></div>
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-400">Secure Download Started!</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Your secure file transfer has been authorized and started. If it didn't begin automatically, please click below:
                        </p>
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                        >
                          <Download size={14} /> Re-download File
                        </a>

                        {/* SHARE BUTTONS - ONLY AFTER SUCCESSFUL DOWNLOAD */}
                        <div className="h-px bg-white/5 my-4"></div>
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left flex items-center gap-1.5">
                            <Share2 size={12} /> Share this file link
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Download this secure file on RoyShare: " + window.location.href)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/10 rounded-xl text-xs font-semibold transition text-center block"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Secure File Shared via RoyShare")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 rounded-xl text-xs font-semibold transition text-center block"
                            >
                              Telegram
                            </a>
                            <button
                              onClick={handleCopyShare}
                              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 relative"
                            >
                              {copiedShare ? (
                                <>
                                  <Check size={12} className="text-emerald-400" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} /> Copy Link
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* READY STAGE FOR FILE DOWNLOAD */
                      <div className="bg-slate-950/60 rounded-xl p-6 border border-white/5 space-y-4 text-sm text-left">
                        <p className="text-slate-400 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Secure file is ready for download:
                        </p>
                        <div className="h-px bg-white/5 my-2"></div>
                        <div className="space-y-3 font-medium">
                          <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="text-slate-500">File Name:</span>
                            <span className="text-white font-bold break-all">{itemData?.fileName || "Unknown File"}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="text-slate-500">File Size:</span>
                            <span className="text-teal-400 font-semibold">
                              {typeof itemData?.fileSize === "number"
                                ? (itemData.fileSize / (1024 * 1024)).toFixed(2) + " MB"
                                : itemData?.fileSize || "Unknown"}
                            </span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="text-slate-500">File Type:</span>
                            <span className="text-indigo-400 font-semibold">{getFileType(itemData?.fileName)}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="text-slate-500">Upload Date:</span>
                            <span className="text-slate-300">{itemData?.uploadDate || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RELATED FILES SECTION */}
                    {relatedFiles && relatedFiles.length > 0 && (
                      <div className="space-y-3 pt-2 text-left">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileIcon size={12} className="text-indigo-400" /> Related Files
                        </h4>
                        <div className="space-y-2">
                          {relatedFiles.map((rf) => (
                            <a
                              key={rf.id}
                              href={`/download/${rf.id}`}
                              className="flex items-center gap-3 p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-white/5 rounded-xl transition group"
                            >
                              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20 transition">
                                <FileIcon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition">
                                  {rf.fileName || "Unnamed File"}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {typeof rf.fileSize === "number"
                                    ? (rf.fileSize / (1024 * 1024)).toFixed(2) + " MB"
                                    : rf.fileSize || "Unknown size"}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-400 opacity-60 group-hover:opacity-100 transition uppercase tracking-wider bg-indigo-500/5 group-hover:bg-indigo-500/10 px-2 py-1 rounded">
                                View
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // SHORTENER FINAL CORE VIEW
                  <div className="bg-slate-950/60 rounded-xl p-6 border border-white/5 text-center">
                    {destinationUrl ? (
                      itemData?.autoRedirect !== false ? (
                        <div className="space-y-2 py-2">
                          <p className="text-slate-300 font-semibold text-sm">Redirecting you to your destination...</p>
                          <div className="text-4xl font-extrabold text-teal-400 animate-pulse">{finalCountdown}s</div>
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Seconds remaining</p>
                        </div>
                      ) : (
                        <div className="text-emerald-400 font-semibold text-sm py-2">
                          Destination unlocked and ready below!
                        </div>
                      )
                    ) : (
                      <p className="text-slate-400 text-sm">Unlock your secure target link below.</p>
                    )}
                  </div>
                )}

                {/* Final Trigger CTA */}
                <div className="pt-2">
                  {type === "download" ? (
                    !downloadUrl && (
                      <button
                        onClick={handleClaim}
                        disabled={redirecting}
                        className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-lg shadow-teal-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {redirecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating download payload...
                          </>
                        ) : (
                          <>
                            <Download size={16} /> Unlock Download Link
                          </>
                        )}
                      </button>
                    )
                  ) : destinationUrl ? (
                    <a
                      href={destinationUrl}
                      className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      🚀 Continue to Destination <ExternalLink size={14} />
                    </a>
                  ) : (
                    <button
                      onClick={handleClaim}
                      disabled={redirecting}
                      className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-lg shadow-teal-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {redirecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying session authentication...
                        </>
                      ) : (
                        <>
                          🔓 Claim Destination URL <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Below Verify OnClickA Banners */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* OnClickA Bottom Banners */}


  
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 border-t border-white/5 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} RoyShare Center. All rights reserved.
      </footer>
    </div>
  );
}

export default function MultiPageEngine(props: MultiPageEngineProps) {
  return (
    <ErrorBoundary>
      <MultiPageEngineInner {...props} />
    </ErrorBoundary>
  );
}
