import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Award, Gift, ShieldCheck, CheckCircle2, 
  HelpCircle, ExternalLink, Loader2, Sparkles, MessageCircle, BookOpen, AlertCircle
} from "lucide-react";
import { API_BASE } from "../config/api";

interface ReferrerInfo {
  id: string;
  name: string;
  level: string;
  referrals: number;
  earnings: number;
  avatar: string | null;
}

export default function ReferralLandingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: verifying token, 2: landing page, 3: success page
  const [inviteToken, setInviteToken] = useState("");
  const [rewardAmount, setRewardAmount] = useState<number>(10);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  
  const [telegramConfig, setTelegramConfig] = useState<{
    clientId: string;
    botUsername: string;
    miniAppShortName: string;
    redirectUri: string;
    trustedOrigin: string;
  } | null>(null);

  // Extract referral token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("success");
    const verifiedParam = params.get("verified");
    let token = params.get("code") || params.get("ref") || params.get("startapp") || params.get("start_param");
    
    if (!token) {
      const pathMatch = window.location.pathname.match(/^\/ref\/([a-zA-Z0-9_-]+)/) ||
                          window.location.pathname.match(/^\/r\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) {
        token = pathMatch[1];
      }
    }

    const isSuccessState = window.location.pathname === "/referral-success" || successParam === "true" || verifiedParam === "1";

    if (isSuccessState) {
      setStep(3);
      setVerifying(false);
      if (token) {
        setInviteToken(token);
        // Fetch referrer details quietly without blocking loading state
        fetch(`${API_BASE}/api/referral/verify-code?code=${encodeURIComponent(token.trim())}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setReferrer(data.referrer);
              if (data.rewardAmount) {
                setRewardAmount(data.rewardAmount);
              }
            }
          })
          .catch(err => console.error("Error loading referrer quietly:", err));
      }
      return;
    }

    if (token) {
      setInviteToken(token);
      verifyReferralToken(token);
    } else {
      setVerifying(false);
      setStep(2); // continue to landing page even without a referrer
    }

    // Fetch Telegram public config
    fetch(`${API_BASE}/api/telegram-config`)
      .then(res => res.json())
      .then(config => {
        console.log("Backend Telegram config response:", config);
        setTelegramConfig(config);
      })
      .catch(err => {
        console.error("Error loading Telegram config:", err);
        setTelegramConfig({
          clientId: "",
          botUsername: "Roysharearn_bot",
          miniAppShortName: "earn",
          redirectUri: "",
          trustedOrigin: "",
        });
      });
  }, []);

  const verifyReferralToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/referral/verify-code?code=${encodeURIComponent(tokenToVerify.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReferrer(data.referrer);
        if (data.rewardAmount) {
          setRewardAmount(data.rewardAmount);
        }
        setStep(2); // move to beautiful landing page
      } else {
        setReferrer(null);
        setError(data.message || "Invalid or expired referral code. You can still register directly!");
        setStep(2);
      }
    } catch (err) {
      console.error("Error verifying code:", err);
      setError("Unable to contact verification server. Direct registration available.");
      setStep(2);
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenTelegram = () => {
    let botUser = telegramConfig?.botUsername || "Roysharearn_bot";
    botUser = botUser.replace(/^@/, '');
    const cleanToken = inviteToken.startsWith("ref_") ? inviteToken.substring(4) : inviteToken;
    const codeParam = cleanToken ? `ref_${cleanToken}` : "none";
    const webLink = `https://t.me/${botUser}?start=${codeParam}`;
    
    // The t.me link automatically attempts to open the Telegram app if installed,
    // and falls back to the browser preview page if not.
    window.location.href = webLink;
  };

  const handleSimulatedTestLogin = () => {
    // Navigate straight to step 3 (success) for development preview testing
    setStep(3);
  };

  const getBotDeepLink = () => {
    let botUser = telegramConfig?.botUsername || "Roysharearn_bot";
    botUser = botUser.replace(/^@/, '');
    const cleanToken = inviteToken.startsWith("ref_") ? inviteToken.substring(4) : inviteToken;
    const codeParam = cleanToken ? `ref_${cleanToken}` : "none";
    return `https://t.me/${botUser}?start=${codeParam}`;
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4 animate-duration-500"></div>
        <p className="text-slate-400 font-medium tracking-wide animate-pulse">Securing connection & verifying invitation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between items-center p-4 relative overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <div className="w-full max-w-lg flex justify-between items-center py-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-white bg-clip-text">
            RoyShare <span className="text-indigo-400">Earn</span>
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] font-mono text-indigo-400">
          V5.0.0 • Secure
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 2 ? (
          <motion.div 
            key="landing-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-lg bg-slate-950/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-950/20 relative z-10 space-y-6 my-auto"
            id="referral-landing-card"
          >
            {/* Referrer Details */}
            {referrer ? (
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full border-2 border-indigo-500/40 p-1 mx-auto bg-slate-900 overflow-hidden shadow-lg shadow-indigo-500/10 flex items-center justify-center">
                    {referrer.avatar ? (
                      <img src={referrer.avatar} alt={referrer.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 font-bold text-2xl">
                        {referrer.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-1/2 translate-x-10 bg-indigo-500 text-white rounded-full p-1 border-2 border-slate-950 shadow-md">
                    <CheckCircle2 className="w-4 h-4 fill-indigo-500 text-white" />
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase">You've Been Invited By</h2>
                  <h1 className="text-2xl font-black text-white flex items-center justify-center gap-1.5 mt-1">
                    {referrer.name}
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold tracking-wide uppercase">
                      Verified
                    </span>
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">
                    Join their network to unlock premium benefits and high-commission multipliers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-indigo-950/50 border border-indigo-500/20 rounded-2xl mx-auto flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Join RoyShare Earn</h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Connect via Telegram to instantly start earning high-commissions on file sharing.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex gap-3 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Program Benefits Grid */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-indigo-400" />
                Your Signup Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex gap-2 items-start bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40">
                  <span className="text-indigo-400 font-bold mt-0.5">💰</span>
                  <div>
                    <span className="font-bold text-white block">₹{rewardAmount} Welcome Reward</span>
                    Instant balance after first login.
                  </div>
                </div>
                <div className="flex gap-2 items-start bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40">
                  <span className="text-indigo-400 font-bold mt-0.5">🚀</span>
                  <div>
                    <span className="font-bold text-white block">25% Commission</span>
                    Get high payouts on referrals.
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                How It Works
              </h3>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center shrink-0">1</span>
                  <p>Click the button below to launch our verified Telegram bot.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center shrink-0">2</span>
                  <p>Claim your invitation reward instantly through deep-link verification.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center shrink-0">3</span>
                  <p>Open the Mini App to instantly manage your earnings!</p>
                </div>
              </div>
            </div>

            {/* Referral Deep Link Action Button */}
            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={handleOpenTelegram}
                className="w-full bg-[#229ED9] hover:bg-[#1d8db2] text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-indigo-950/20 flex items-center justify-center gap-2 text-sm transition-all tracking-wide cursor-pointer active:scale-[0.98]"
                id="btn-open-telegram-referral"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#229ED9]" />
                🚀 Open Telegram & Claim Reward
              </button>

              {/* simulated/fallback button for dev preview environment */}
              {(process.env.NODE_ENV !== "production" || (typeof window !== "undefined" && !window.location.hostname.includes("royshare.online"))) && (
                <button
                  type="button"
                  onClick={handleSimulatedTestLogin}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-2xl py-3 px-4 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-4"
                  id="btn-simulated-login"
                >
                  <span>🔧 Dev Sandbox Fallback: Bypass to Success Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        ) : step === 3 ? (
          <motion.div 
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-slate-950/80 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-emerald-950/20 text-center relative z-10 space-y-6 my-auto"
            id="referral-success-card"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Referral Verified Successfully</h1>
              <p className="text-emerald-400 text-sm font-semibold tracking-wide">
                ✅ Connected • ✅ Reward Claimed
              </p>
              <p className="text-slate-400 text-xs px-2 leading-relaxed mt-2">
                Your secure referral link has been recorded and the welcome bonus of ₹{rewardAmount} has been added to your account balance! Click below to start earning or check your bot settings.
              </p>
            </div>

            <a 
              href={getBotDeepLink()}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm transition-all tracking-wide"
              id="btn-open-bot-success"
            >
              <MessageCircle className="w-5 h-5 fill-white text-emerald-500" />
              Open Telegram Bot
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Footer Policy & Terms links */}
      <div className="w-full max-w-lg flex justify-between items-center py-6 border-t border-slate-900 text-[11px] text-slate-500 font-medium relative z-10">
        <a href="/privacy" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          Privacy Policy
        </a>
        <span>•</span>
        <a href="/terms" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Terms of Service
        </a>
        <span>•</span>
        <a href="/support" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          Support
        </a>
      </div>
    </div>
  );
}
