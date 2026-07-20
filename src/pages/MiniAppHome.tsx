import React, { useState, useEffect, lazy, Suspense } from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  TrendingUp, 
  Award, 
  Share2, 
  Gift, 
  CreditCard, 
  History, 
  Settings, 
  PlayCircle, 
  ClipboardList, 
  Users, 
  Star, 
  Zap, 
  ArrowLeft, 
  MessageSquare, 
  Copy, 
  CheckCircle2, 
  LayoutDashboard,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Phone,
  Lock,
  ShieldAlert,
  Smartphone,
  KeyRound,
  Link as LinkIcon,
  FolderOpen,
  ShieldCheck,
  Send,
  ExternalLink,
  AlertCircle,
  Upload,
  Bell,
  Cloud,
  Youtube,
  Gamepad2,
  Coins,
  Clock,
  Trophy,
  Grid,
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { getGiveawayStatus, getGiveawayTimeLeft } from "../lib/dateUtils";
import { StandardTaskCard } from "../components/StandardTaskCard";
import { ShortenerTaskCard } from "../components/ShortenerTaskCard";

import { API_BASE } from "../config/api";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import { navigate } from "../lib/navigation";

const DriveUploadPage = lazy(() => import("./DriveUploadPage"));
const CustomerSupportPage = lazy(() => import("./CustomerSupportPage"));
const AnnouncementsPage = lazy(() => import("./AnnouncementsPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const ShortenPage = lazy(() => import("./ShortenPage"));
const RewardEarningsPage = lazy(() => import("./RewardEarningsPage"));
const PublicLuckyNumberGiveawayPage = lazy(() => import("./PublicLuckyNumberGiveawayPage"));
const PublicLuckyDrawPage = lazy(() => import("./PublicLuckyDrawPage"));
const RPSHome = lazy(() => import("../components/rock-paper-scissors/RPSHome"));
const RPSMatch = lazy(() => import("../components/rock-paper-scissors/RPSMatch"));
import RPSErrorBoundary from "../components/rock-paper-scissors/RPSErrorBoundary";

const TTTHome = lazy(() => import("../components/tic-tac-toe/TTTHome"));
const TTTMatch = lazy(() => import("../components/tic-tac-toe/TTTMatch"));
import TTTErrorBoundary from "../components/tic-tac-toe/TTTErrorBoundary";

// Lazy loaded views
const SurveyPage = lazy(() => import("./SurveyPage").then(m => ({ default: m.SurveyPage })));
const WalletPage = lazy(() => import("./WalletPage").then(m => ({ default: m.WalletPage })));
const DashboardPage = lazy(() => import("./DashboardPage"));
const RewardTasksPage = lazy(() => import("./RewardTasksPage"));
const MyLinksPage = lazy(() => import("./MyLinksPage").then(m => ({ default: m.MyLinksPage })));
const UrlShortenerAnalyticsPage = lazy(() => import("./UrlShortenerAnalyticsPage").then(m => ({ default: m.UrlShortenerAnalyticsPage })));
const MyContentPage = lazy(() => import("./MyContentPage").then(m => ({ default: m.MyContentPage })));
const ReferralCenter = lazy(() => import("./ReferralCenter"));
const LuckySpinUserView = lazy(() => import("../components/LuckySpinUserView").then(m => ({ default: m.LuckySpinUserView })));

interface MembershipVerificationProps {
  user: any;
  onVerified: () => void;
  tgSettingsProp?: any;
}

const MembershipVerification: React.FC<MembershipVerificationProps> = ({ user, tgSettingsProp }) => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tgSettings, setTgSettings] = useState<any>(tgSettingsProp || null);

  useEffect(() => {
    if (tgSettingsProp) {
      setTgSettings(tgSettingsProp);
      return;
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/telegram-settings`);
        const data = await res.json();
        if (data.success) setTgSettings(data.settings);
      } catch (e) {
        console.error("Failed to load telegram settings:", e);
      }
    };
    fetchSettings();
  }, [tgSettingsProp]);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/user/verify-membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setError(data.error || "Please join both channels first!");
      }
    } catch (err) {
      setError("Failed to verify membership. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const getCleanLink = (username: string) => {
    if (!username) return "#";
    const clean = username.replace("@", "");
    return `https://t.me/${clean}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-400 mx-auto shadow-xl shadow-blue-900/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Channel Verification</h2>
          <p className="text-slate-400 text-sm leading-relaxed">To access RoyShare Earn and start earning, you must join our official channels.</p>
        </div>

        <div className="space-y-3">
          <a 
            href={getCleanLink(tgSettings?.channelUsername || "RoyShareEarn")} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Join Official Channel</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </a>
          
          <a 
            href={getCleanLink(tgSettings?.groupUsername || "RoyShareCommunity")} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Join Community Group</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </a>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
        >
          {verifying ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Verify Membership</>
          )}
        </button>
      </motion.div>
    </div>
  );
};

interface PhoneVerificationProps {
  user: any;
  onVerified: () => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ user, onVerified }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizePhone = (num: string): string => {
    const digits = num.replace(/\D/g, "");
    return digits.slice(-10); // get last 10 digits
  };

  const handleSendOtp = async () => {
    const norm = normalizePhone(phoneNumber);
    if (norm.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: phoneNumber,
          telegramId: user.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStep('otp');
      } else {
        setErrorMessage(data.error || "Failed to send OTP. Please check your number or try again later.");
      }
    } catch (err: any) {
      console.error("[PhoneVerification] Send OTP error:", err);
      setErrorMessage("Could not send OTP. Check your connection or if you have started the bot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }
    
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: phoneNumber,
          otp: otpCode,
          telegramId: user.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem(`verified_phone_${user.id}`, "true");
        onVerified();
      } else {
        setErrorMessage(data.error || "Invalid verification code. Please check and try again.");
      }
    } catch (err: any) {
      console.error("[PhoneVerification] Verify OTP error:", err);
      setErrorMessage("An error occurred during verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl"
        >
          {/* Logo / Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/5">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">Secure Verification</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Verify your mobile number to unlock Self Earning.
            </p>
          </div>

          <div className="space-y-6">
            {step === 'phone' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-bold text-lg font-sans">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPhoneNumber(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-2xl py-4 pl-14 pr-4 text-left text-lg font-bold font-sans tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-white"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Enter your mobile number to receive a verification OTP.
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2 text-red-400 text-xs items-center">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={phoneNumber.length < 10 || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Mobile Number
                  </label>
                  <div className="text-slate-300 font-bold font-sans text-lg mb-4 flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                    <span>+91 {phoneNumber}</span>
                    <button
                      onClick={() => {
                        setStep('phone');
                        setOtpCode("");
                        setErrorMessage(null);
                      }}
                      disabled={isSubmitting}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="------"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOtpCode(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-2xl py-4 text-center text-2xl font-bold font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-white"
                  />
                  <div className="flex justify-end items-center mt-3 px-1 text-xs">
                    <button
                      onClick={handleSendOtp}
                      disabled={isSubmitting}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2 text-red-400 text-xs items-center">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length < 6 || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify OTP
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const MiniAppHome: React.FC = () => {
  const { user, loading, error, startParam, isInsideTelegram } = useTelegramAuth();
  const [tgSettings, setTgSettings] = useState<any>(null);
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loadingGiveaways, setLoadingGiveaways] = useState<boolean>(true);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    console.log("[MiniAppHome] Mounted. Initial state: ", { user, loading, error, isInsideTelegram });
    setIsRendered(true);
  }, []);

  console.log("[MiniAppHome] Render start. loading:", loading, "user:", user?.id, "error:", error);


  useEffect(() => {
    const q = collection(db, "lucky_number_campaigns");
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setGiveaways(list);
      setLoadingGiveaways(false);
    }, (err) => {
      console.error("Error listening to lucky_number_campaigns:", err);
      setLoadingGiveaways(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/telegram-settings`);
        const data = await res.json();
        if (data.success) setTgSettings(data.settings);
      } catch (e) {
        console.error("Failed to load telegram settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const [currentView, setCurrentView] = useState<string>(() => {
    console.log("[MiniAppHome] Initializing view. Pathname:", window.location.pathname, "Search:", window.location.search);
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    if (page === "referral" || window.location.pathname === "/referral") return "referral";
    if (page === "content") return "dashboard";
    if (page === "files") return "my-content";
    if (page === "links") return "my-links";
    if (page === "analytics") return "link-analytics";
    if (page === "upload" || window.location.pathname === "/drive-upload" || window.location.pathname === "/drive-upload/") return "upload";
    return params.get("view") || "home";
  });
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("linkId");
  });
  const [uploadType, setUploadType] = useState<"select" | "large">("select");

  useEffect(() => {
    setUploadType("select");
  }, [currentView]);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const queryUserId = searchParams?.get("userId");
  const isMiniApp = isInsideTelegram || !!queryUserId;

  const activeUser: any = user || null;
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(!isMiniApp);

  const prevViewRef = React.useRef<string>(currentView);
  useEffect(() => {
    console.log(`[MiniAppHome] [View State Transition] Changed from "${prevViewRef.current}" to "${currentView}". Stacktrace:`, new Error().stack);
    prevViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    if (!isMiniApp) {
      setIsPhoneVerified(true);
    } else if (activeUser) {
      const localVerified = localStorage.getItem(`verified_phone_${activeUser.id}`) === "true";
      const dbVerified = !!activeUser.phoneVerifiedInMiniApp || !!activeUser.phone || !!activeUser.mobile;
      setIsPhoneVerified(localVerified || dbVerified);
    }
  }, [activeUser, isMiniApp]);

  useEffect(() => {
    console.log("[MiniAppHome] Pathname useEffect trigger. window.location.pathname:", window.location.pathname, "currentView:", currentView);
    if (window.location.pathname === "/referral" && currentView !== "referral") {
      console.log("[MiniAppHome] Pathname useEffect MATCHED '/referral'. Calling setCurrentView('referral')");
      setCurrentView("referral");
    } else if (window.location.pathname === "/" || window.location.pathname === "") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      if (viewParam) {
        setCurrentView(viewParam);
      }
    }
  }, [window.location.pathname]);

  const [hasCheckedDeepLink, setHasCheckedDeepLink] = useState(false);
  const [luckySpinInitialEventId, setLuckySpinInitialEventId] = useState<string | null>(null);
  const [luckySpinInitialMode, setLuckySpinInitialMode] = useState<"join" | "live" | null>(null);

  // Deep Link Handling
  useEffect(() => {
    if (activeUser?.membershipVerified && startParam && !hasCheckedDeepLink) {
      if (startParam.startsWith("luckyspin_join_")) {
        const eventId = startParam.replace("luckyspin_join_", "");
        console.log(`[MiniAppHome] Deep link detected for lucky spin join: ${eventId}`);
        setHasCheckedDeepLink(true);
        setLuckySpinInitialEventId(eventId);
        setLuckySpinInitialMode("join");
        setCurrentView("lucky-spin");
      } else if (startParam.startsWith("luckyspin_live_")) {
        const eventId = startParam.replace("luckyspin_live_", "");
        console.log(`[MiniAppHome] Deep link detected for lucky spin live: ${eventId}`);
        setHasCheckedDeepLink(true);
        setLuckySpinInitialEventId(eventId);
        setLuckySpinInitialMode("live");
        setCurrentView("lucky-spin");
      } else if (startParam.startsWith("join_")) {
        const eventId = startParam.replace("join_", "");
        console.log(`[MiniAppHome] Deep link detected for lucky spin join (legacy): ${eventId}`);
        setHasCheckedDeepLink(true);
        setLuckySpinInitialEventId(eventId);
        setLuckySpinInitialMode("join");
        setCurrentView("lucky-spin");
      } else if (startParam.startsWith("live_")) {
        const eventId = startParam.replace("live_", "");
        console.log(`[MiniAppHome] Deep link detected for lucky spin live (legacy): ${eventId}`);
        setHasCheckedDeepLink(true);
        setLuckySpinInitialEventId(eventId);
        setLuckySpinInitialMode("live");
        setCurrentView("lucky-spin");
      } else if (startParam.startsWith("upi_")) {
        const giveawayId = startParam.replace("upi_", "");
        console.log(`[MiniAppHome] Deep link detected for lucky number giveaway: ${giveawayId}`);
        setHasCheckedDeepLink(true);
        setCurrentView(`upi-${giveawayId}`);
      } else if (startParam.startsWith("lucky_")) {
        const giveawayId = startParam.replace("lucky_", "");
        console.log(`[MiniAppHome] Deep link detected for giveaway (legacy): ${giveawayId}`);
        setHasCheckedDeepLink(true);
        if (giveawayId.startsWith("LD-")) {
          setCurrentView(`lucky-${giveawayId}`);
        } else {
          setCurrentView(`upi-${giveawayId}`);
        }
      } else if (!startParam.startsWith("ref_") && !startParam.startsWith("gift_")) {
        console.log(`[MiniAppHome] Direct deep link detected for giveaway: ${startParam}`);
        setHasCheckedDeepLink(true);
        if (startParam.startsWith("LD-")) { 
          setCurrentView(`lucky-${startParam}`); 
        } else { 
          setCurrentView(`upi-${startParam}`); 
        }
      }
    }
  }, [activeUser?.membershipVerified, isPhoneVerified, startParam, hasCheckedDeepLink]);

  const displayName = activeUser ? (activeUser.enteredName || `${activeUser.firstName || ""} ${activeUser.lastName || ""}`.trim() || activeUser.username || "User") : "User";

  const displayBalance = activeUser ? (
    (activeUser.fileEarnings || 0) + 
    (activeUser.linkEarnings || 0) + 
    (activeUser.referralEarnings || 0) + 
    (activeUser.bonusBalance !== undefined ? activeUser.bonusBalance : (activeUser.bonus || 0)) + 
    (activeUser.rewardBalance || 0) + 
    (activeUser.balance || 0) - 
    (activeUser.withdrawnAmount !== undefined ? activeUser.withdrawnAmount : (activeUser.totalWithdrawn || 0)) - 
    (activeUser.pendingWithdrawals || 0)
  ) : 0;

  const displayTotalEarnings = activeUser ? (
    (activeUser.fileEarnings || 0) + 
    (activeUser.linkEarnings || 0) + 
    (activeUser.referralEarnings || 0) + 
    (activeUser.bonusBalance !== undefined ? activeUser.bonusBalance : (activeUser.bonus || 0)) + 
    (activeUser.rewardBalance || 0)
  ) : 0;

  // Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Earn Rewards Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [gpTasks, setGpTasks] = useState<any[]>([]);
  const [loadingGpTasks, setLoadingGpTasks] = useState(false);
  const [completedGpTaskIds, setCompletedGpTaskIds] = useState<string[]>([]);
  
  const [userRewardTab, setUserRewardTab] = useState<"standard" | "gp">("standard");

  // Copy Feedback State
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleStartTask = (taskId: string, shortenerUrl: string, type: "task" | "gplink") => {
    if (!shortenerUrl) {
      alert("No shortener URL provided for this task.");
      return;
    }
    localStorage.setItem("pending_verification_taskId", taskId);
    localStorage.setItem("pending_verification_type", type);

    let finalUrl = shortenerUrl;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && !finalUrl.startsWith("/")) {
       finalUrl = "https://" + finalUrl;
    }

    const tgApp = (window as any).Telegram?.WebApp;
    if (finalUrl.startsWith("/") || !tgApp || !tgApp.openLink) {
       window.location.href = finalUrl;
    } else {
       tgApp.openLink(finalUrl, { try_instant_view: false });
    }
  };

  // Fetch Leaderboard when that view is active
  useEffect(() => {
    if (currentView === "leaderboard") {
      setLoadingLeaderboard(true);
      getDocs(collection(db, "users"))
        .then((usersSnap) => {
          const users: any[] = [];
          usersSnap.forEach((doc) => {
            const data = doc.data();
            users.push({
              id: doc.id,
              firstName: data.firstName || "User",
              lastName: data.lastName || "",
              username: data.username || "",
              enteredName: data.enteredName || "",
              balance: data.balance || 0,
              earnings: data.earnings || data.totalEarnings || 0,
              level: data.level || 1,
            });
          });
          // Sort by earnings desc
          users.sort((a, b) => b.earnings - a.earnings);
          setLeaderboardData(users.slice(0, 10));
        })
        .catch((err) => console.error("Error loading leaderboard:", err))
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [currentView]);

  // Fetch Tasks when Earn Rewards is active
  useEffect(() => {
    if (currentView === "earn-rewards") {
      setLoadingTasks(true);
      getDocs(collection(db, "tasks"))
        .then((tasksSnap) => {
          const fetchedTasks: any[] = [];
          tasksSnap.forEach((doc) => {
            const d = doc.data();
            fetchedTasks.push({
              id: doc.id,
              name: d.title || d.name || "",
              amount: Number(d.rewardAmount) || 0,
              status: d.status || "🟢 Active",
              description: d.description || "",
              shortenerUrl: d.shortenerUrl || "",
            });
          });
          // Filter to active tasks, excluding shortener tasks
          const activeTasks = fetchedTasks.filter((t) => 
            (t.status === "🟢 Active" || String(t.status || "").toLowerCase().includes("active")) &&
            !t.shortenerUrl && 
            t.provider !== "Other" && 
            t.provider !== "GPLinks"
          );
          setTasks(activeTasks);
        })
        .catch((err) => console.error("Error loading tasks:", err))
        .finally(() => setLoadingTasks(false));



      fetch(`${API_BASE}/api/gplinks-tasks`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setGpTasks(data);
          }
        })
        .catch((err) => console.error("Error loading GP links tasks:", err))
        .finally(() => setLoadingGpTasks(false));

      if (activeUser?.id) {
        getDocs(query(collection(db, "gplinks_task_completions"), where("userId", "==", activeUser.id)))
          .then((snap) => {
            const completedIds = snap.docs.map((doc) => doc.data().taskId);
            setCompletedGpTaskIds(completedIds);
          })
          .catch((err) => console.error("Error loading GP completions:", err));
      }
    }
  }, [currentView, activeUser]);

  // Remove blocking loader, let UI render with skeleton/placeholders
  // Only show Authentication Failed if NOT loading, and error exists, and no user
  if (isMiniApp && !loading && (error || !activeUser || !activeUser.id)) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center text-red-400">
        <div>
          <p className="font-bold text-lg">Authentication Failed</p>
          <p className="text-sm mt-2">{error || "Could not identify user. Please restart."}</p>
        </div>
      </div>
    );
  }

  // If we are still loading the active user, bypass these verification screens
  // They will be rendered later if verification is actually missing
  if (activeUser && !activeUser.membershipVerified) {
    return (
      <MembershipVerification 
        user={activeUser} 
        tgSettingsProp={tgSettings}
        onVerified={() => {
          // Handled by Firebase onSnapshot in TelegramAuthContext
        }} 
      />
    );
  }

  if (activeUser && activeUser.membershipVerified && !isPhoneVerified) {
    return (
      <PhoneVerification 
        user={activeUser} 
        onVerified={() => setIsPhoneVerified(true)} 
      />
    );
  }

  // Render Sub-Views

  if (currentView === "my-content") {
    return (
      <MyContentPage 
        user={activeUser} 
        onBack={() => setCurrentView("home")} 
      />
    );
  }

  if (currentView === "my-links") {
    return (
      <MyLinksPage 
        user={activeUser} 
        onBack={() => setCurrentView("home")} 
        onViewAnalytics={(linkId) => {
          setSelectedLinkId(linkId);
          setCurrentView("link-analytics");
        }}
      />
    );
  }

  if (currentView === "link-analytics") {
    return (
      <UrlShortenerAnalyticsPage 
        linkId={selectedLinkId || ""} 
        onBack={() => {
          setSelectedLinkId(null);
          setCurrentView("my-links");
        }}
      />
    );
  }

  if (currentView === "upload") {
    return (
      <RouteErrorBoundary componentName="DriveUploadPage">
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <DriveUploadPage onBack={() => setCurrentView("home")} />
        </Suspense>
      </RouteErrorBoundary>
    );
  }

  if (currentView === "lucky-spin") {
    return (
      <LuckySpinUserView
        onBack={() => setCurrentView("home")}
        initialEventId={luckySpinInitialEventId}
        initialMode={luckySpinInitialMode}
        clearInitialParams={() => {
          setLuckySpinInitialEventId(null);
          setLuckySpinInitialMode(null);
        }}
      />
    );
  }

  if (currentView === "dashboard") {
    return (
      <RouteErrorBoundary componentName="DashboardPage">
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <DashboardPage onBack={() => setCurrentView("home")} onNavigate={setCurrentView} />
        </Suspense>
      </RouteErrorBoundary>
    );
  }

  if (currentView === "surveys") {
    return (
      <RouteErrorBoundary componentName="SurveyPage">
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <SurveyPage onBack={() => setCurrentView("home")} />
        </Suspense>
      </RouteErrorBoundary>
    );
  }

  if (currentView === "wallet" || currentView === "balance" || currentView === "withdraw" || currentView === "history") {
    const initialTab = currentView === "balance" || currentView === "wallet" ? "wallet" : currentView;
    return (
      <RouteErrorBoundary componentName="WalletPage">
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <WalletPage onBack={() => setCurrentView("home")} initialTab={initialTab} />
        </Suspense>
      </RouteErrorBoundary>
    );
  }


  if (currentView === "referral") {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (!activeUser || !activeUser.id) {
      return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-4">You must be authenticated to view the Referral Center.</p>
          <button onClick={() => setCurrentView("home")} className="bg-slate-800 hover:bg-slate-750 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors">
            Go Back
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#020617]">
        <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h2 className="text-xl font-bold text-white">Referral Center</h2>
        </header>
        <ReferralCenter user={activeUser} />
      </div>
    );
  }

  if (activeTaskId) {
    return (
      <RewardTasksPage 
        userIdProp={activeUser?.id || ""} 
        taskIdProp={activeTaskId} 
        onBack={() => setActiveTaskId(null)} 
      />
    );
  }

  const cleanBotUser = tgSettings?.botUsername ? tgSettings.botUsername.replace(/^@/, '') : "Roysharearn_bot";
  const referralLink = activeUser?.id ? `https://t.me/${cleanBotUser}?start=ref_${activeUser.id}` : "";

  const earningButtons = [
    { id: "lucky-number", label: "Lucky Number Giveaway", icon: Gift, color: "bg-gradient-to-r from-red-500 to-amber-500", shadow: "shadow-red-500/20" },
    { id: "rps-battle", label: "RPS Battle", icon: Gamepad2, color: "bg-gradient-to-r from-indigo-600 to-orange-500", shadow: "shadow-indigo-500/20" },
    { id: "ttt-battle", label: "Tic Tac Toe Battle", icon: Grid, color: "bg-gradient-to-r from-emerald-600 to-indigo-500", shadow: "shadow-emerald-500/20" },
    { id: "lucky-spin", label: "Lucky Spin Live", icon: Sparkles, color: "bg-gradient-to-r from-pink-550 to-violet-600", shadow: "shadow-pink-500/20" },
    { id: "earn-rewards", label: "Reward Tasks", icon: ClipboardList, color: "bg-yellow-500", shadow: "shadow-yellow-500/20" },
  ];

  const navigationButtons = [
    { id: "self-earning", label: "Self Earning", icon: Star, color: "bg-blue-500", shadow: "shadow-blue-500/20" },
    { id: "upload-file", label: "Upload File", icon: Upload, color: "bg-emerald-600", shadow: "shadow-emerald-500/20" },
    { id: "url-shortener", label: "URL Shortener", icon: LinkIcon, color: "bg-indigo-600", shadow: "shadow-indigo-500/20" },
    { id: "my-content", label: "My Content", icon: FolderOpen, color: "bg-sky-500", shadow: "shadow-sky-500/20" },
    { id: "my-links", label: "My Links", icon: Share2, color: "bg-indigo-500", shadow: "shadow-indigo-500/20" },
    { id: "withdraw", label: "Withdraw", icon: CreditCard, color: "bg-rose-500", shadow: "shadow-rose-500/20" },
    { id: "refer", label: "Refer & Earn", icon: Users, color: "bg-indigo-600", shadow: "shadow-indigo-500/20" },
    { id: "announcements", label: "Announcements", icon: Bell, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
    { id: "settings", label: "Settings", icon: Settings, color: "bg-slate-500", shadow: "shadow-slate-500/20" },
    { id: "support", label: "Contact Support", icon: MessageSquare, color: "bg-teal-500", shadow: "shadow-teal-500/20" },
  ];

  const handleAction = (id: string) => {
    console.log("[MiniAppHome] handleAction called with id:", id, "currentView before change:", currentView);
    if (id === "lucky-number") {
      const liveGiveaways = giveaways.filter(g => g.status === "Live" && getGiveawayStatus(g) === "LIVE");
      if (liveGiveaways.length === 1) {
        setCurrentView(`upi-${liveGiveaways[0].id}`);
      } else if (liveGiveaways.length > 1) {
        setCurrentView("lucky-number-list");
      } else {
        setCurrentView("lucky-number-no-active");
      }
      return;
    }
    if (id === "upload-file") {
      setCurrentView("upload-file");
      return;
    }
    if (id === "refer") {
      console.log("[MiniAppHome] handleAction MATCHED 'refer'. Setting view to 'referral'.");
      setCurrentView("referral");
      return;
    }
    if (id === "self-earning") {
      setCurrentView("earn-rewards");
      return;
    }
    if (id === "url-shortener") {
      // URL shortener usually opens in a new tab or a specific view
      setCurrentView("shorten");
      return;
    }
    if (id === "my-links") {
      setCurrentView("my-links");
      return;
    }
    console.log(`[MiniAppHome] handleAction calling setCurrentView('${id}')`);
    setCurrentView(id);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden pb-12 font-sans">
      <AnimatePresence mode="wait">
        {currentView === "home" && (
          <motion.div
            key="home-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header / Brand */}
            <header className="relative pt-12 pb-20 px-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full border-2 border-slate-800 p-0.5 bg-slate-900 mb-4 shadow-xl"
                >
                  <img 
                    src={activeUser?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`} 
                    alt={activeUser?.username || "user"}
                    className="w-full h-full rounded-full object-cover"
                  />
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-black tracking-tight text-white mb-1 bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300"
                >
                  Roy Share Earn
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-400 text-sm mb-4"
                >
                  Welcome, {displayName} (@{activeUser?.username || "user"})
                </motion.p>
                
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400" /> {activeUser?.level || 1} Level
                  </span>
                  {activeUser?.isPremium && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </header>

            {/* Wallet Balance Card representing Balance */}
            <div className="px-6 -mt-12 relative z-20">
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setCurrentView("balance")}
                className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl shadow-black/50 cursor-pointer hover:border-slate-700 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Wallet Balance</p>
                    <h3 className="text-3xl font-black tracking-tight">₹{displayBalance.toLocaleString()}</h3>
                  </div>
                  <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-lg">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Today's Earnings</p>
                    <p className="text-emerald-400 font-bold text-sm">+₹{activeUser?.todayEarnings || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Earnings</p>
                    <p className="text-blue-400 font-bold text-sm">₹{displayTotalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Self Earning Section */}
            <section className="px-6 pt-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Self Earning</h4>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3"
              >
                {earningButtons.map((btn, idx) => {
                  const isActiveGiveaway = btn.id === "lucky-number" && giveaways.some(g => g.status === "Live" && getGiveawayStatus(g) === "LIVE");
                  const badgeText = btn.id === "lucky-number" 
                    ? (isActiveGiveaway ? "LIVE" : "NEW") 
                    : (btn.id === "ttt-battle" ? "MULTIPLAYER" : null);
                  
                  return (
                    <motion.button
                      key={btn.id}
                      variants={itemVariants}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAction(btn.id)}
                      className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60 transition-all group relative cursor-pointer"
                    >
                      {badgeText && (
                        <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${btn.id === 'ttt-battle' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-500'} flex items-center gap-1 z-10`}>
                          {btn.id !== 'ttt-battle' && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />}
                          {badgeText}
                        </span>
                      )}
                      <div className={`w-11 h-11 ${btn.color} ${btn.shadow} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                        <btn.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">{btn.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </section>

            {/* Menu Buttons Grid */}
            <section className="px-6 pt-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Navigation Menu</h4>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3"
              >
                {navigationButtons.map((btn, idx) => (
                  <motion.button
                    key={btn.id}
                    variants={itemVariants}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAction(btn.id)}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60 transition-all group cursor-pointer"
                  >
                    <div className={`w-11 h-11 ${btn.color} ${btn.shadow} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <btn.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">{btn.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </section>
          </motion.div>
        )}

        {/* 👥 Refer & Earn Dedicated View (Removed - Replaced by /refer) */}

        {/* 🏆 Leaderboard Dedicated View */}
        {currentView === "support" && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <CustomerSupportPage onBack={() => setCurrentView("dashboard")} />
          </Suspense>
        )}

        {currentView === "upload-file" && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            {uploadType === "large" ? (
              <DriveUploadPage onBack={() => setUploadType("select")} />
            ) : (
              <motion.div
                key="upload-select-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="min-h-screen bg-[#020617] text-white pb-12"
              >
                <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                  <button onClick={() => setCurrentView("dashboard")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                  </button>
                  <h2 className="text-xl font-bold text-white">Upload File</h2>
                </header>

                <main className="p-6 space-y-8 max-w-md mx-auto">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/5">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight">Choose Upload Option</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Select your file size or storage type below. High speed, secure and auto-credited earnings.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Small File Upload */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (activeUser?.id) {
                          fetch("/api/bot/trigger-upload-prompt", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: activeUser.id })
                          }).catch(err => console.error("Failed to trigger upload prompt:", err));
                        }
                        const tgApp = (window as any).Telegram?.WebApp;
                        if (tgApp) {
                          tgApp.close();
                        } else {
                          alert("Please use the Telegram Bot to send small files.");
                        }
                      }}
                      className="w-full text-left p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all flex items-start gap-4 group"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          Small File Upload
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold uppercase tracking-wider">Bot</span>
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Files up to 20 MB. Upload directly inside the Telegram Bot chat. Ideal for PDFs, APKs, Images & small files.
                        </p>
                      </div>
                    </motion.button>

                    {/* Large File Upload */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUploadType("large")}
                      className="w-full text-left p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/70 transition-all flex items-start gap-4 group"
                    >
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Cloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          Large File Upload
                          <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/10 font-bold uppercase tracking-wider">Cloud</span>
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Files up to 10 GB. Upload securely using connected Google Drive. Supported on all modern browsers and speeds.
                        </p>
                      </div>
                    </motion.button>
                  </div>
                </main>
              </motion.div>
            )}
          </Suspense>
        )}

        {currentView === "announcements" && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <AnnouncementsPage onBack={() => setCurrentView("dashboard")} />
          </Suspense>
        )}

        {currentView === "settings" && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <SettingsPage onBack={() => setCurrentView("dashboard")} />
          </Suspense>
        )}

        {currentView === "shorten" && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <ShortenPage onBack={() => setCurrentView("dashboard")} />
          </Suspense>
        )}

        {currentView === "rps-battle" && (
          <RPSErrorBoundary onReset={() => setCurrentView("home")}>
            <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <RPSHome onBack={() => setCurrentView("home")} onJoinMatch={(matchId) => setCurrentView(`rps-match-${matchId}`)} userId={activeUser?.id} />
            </Suspense>
          </RPSErrorBoundary>
        )}

        {currentView.startsWith("rps-match-") && (
          <RPSErrorBoundary onReset={() => setCurrentView("rps-battle")}>
            <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <RPSMatch matchId={currentView.replace("rps-match-", "")} onBack={() => setCurrentView("rps-battle")} userId={activeUser?.id} />
            </Suspense>
          </RPSErrorBoundary>
        )}

        {currentView === "ttt-battle" && (
          <TTTErrorBoundary onReset={() => setCurrentView("home")}>
            <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <TTTHome onBack={() => setCurrentView("home")} onJoinMatch={(matchId) => setCurrentView(`ttt-match-${matchId}`)} userId={activeUser?.id} />
            </Suspense>
          </TTTErrorBoundary>
        )}

        {currentView.startsWith("ttt-match-") && (
          <TTTErrorBoundary onReset={() => setCurrentView("ttt-battle")}>
            <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <TTTMatch matchId={currentView.replace("ttt-match-", "")} onBack={() => setCurrentView("ttt-battle")} userId={activeUser?.id} />
            </Suspense>
          </TTTErrorBoundary>
        )}

        {currentView.startsWith("lucky-") && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <PublicLuckyDrawPage giveawayId={currentView.replace("lucky-", "")} onBack={() => setCurrentView("home")} />
          </Suspense>
        )}
        {currentView.startsWith("upi-") && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <PublicLuckyNumberGiveawayPage giveawayId={currentView.replace("upi-", "")} onBack={() => setCurrentView("home")} onNavigate={(view) => setCurrentView(view)} />
          </Suspense>
        )}

        {currentView === "lucky-number-no-active" && (
          <motion.div
            key="lucky-number-no-active-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen bg-[#020617] text-white flex flex-col justify-between pb-12"
          >
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <h2 className="text-xl font-bold text-white">Lucky Number Giveaway</h2>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-sm bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl space-y-6 shadow-2xl relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-slate-800 backdrop-blur-md shadow-xl">
                  <Gift className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
                <div className="pt-6 space-y-2">
                  <h3 className="text-xl font-black text-white">No Active Giveaway</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    There is currently no active lucky number giveaway board live. Please check back soon or tap Refresh to check for updates!
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setLoadingGiveaways(true);
                    try {
                      const snap = await getDocs(collection(db, "lucky_number_campaigns"));
                      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                      setGiveaways(list);
                      
                      const liveGiveaways = list.filter(g => g.status === "Live" && getGiveawayStatus(g) === "LIVE");
                      if (liveGiveaways.length === 1) {
                        setCurrentView(`upi-${liveGiveaways[0].id}`);
                      } else if (liveGiveaways.length > 1) {
                        setCurrentView("lucky-number-list");
                      }
                    } catch (e) {
                      console.error("Error refreshing campaigns:", e);
                    } finally {
                      setLoadingGiveaways(false);
                    }
                  }}
                  disabled={loadingGiveaways}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/20"
                >
                  {loadingGiveaways ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Refresh 🔄"
                  )}
                </button>
              </div>
            </main>
          </motion.div>
        )}

        {currentView === "lucky-number-list" && (
          <motion.div
            key="lucky-number-list-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen bg-[#020617] text-white flex flex-col pb-12"
          >
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <h2 className="text-xl font-bold text-white">Active Giveaways</h2>
            </header>

            <main className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Multiple Live Boards
                </p>
                <h3 className="text-lg font-black text-slate-100">Select a Giveaway Board to Join</h3>
              </div>

              <div className="space-y-4">
                {giveaways
                  .filter(g => g.status === "Live" && getGiveawayStatus(g) === "LIVE")
                  .map((g) => {
                    const timeLeftObj = getGiveawayTimeLeft(g);
                    return (
                      <motion.div
                        key={g.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl"
                      >
                        {g.bannerUrl && (
                          <div className="h-32 w-full overflow-hidden relative">
                            <img
                              src={g.bannerUrl}
                              alt={g.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                          </div>
                        )}
                        <div className="p-5 space-y-4">
                          <div className="space-y-1">
                            <h4 className="text-lg font-black text-white">{g.title}</h4>
                            {g.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {g.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Coins className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Prize Pool</p>
                                <p className="text-xs font-black text-emerald-400">₹{g.prizeAmount}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Trophy className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Winners</p>
                                <p className="text-xs font-black text-amber-400">{g.totalWinners} Slots</p>
                              </div>
                            </div>
                          </div>

                          {!timeLeftObj.isExpired && (
                            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-500/5 border border-rose-500/10 px-3 py-2 rounded-xl">
                              <Clock className="w-4 h-4 animate-pulse" />
                              <span>
                                Ends in: {timeLeftObj.days > 0 ? `${timeLeftObj.days}d ` : ""}
                                {String(timeLeftObj.hours).padStart(2, "0")}h:
                                {String(timeLeftObj.minutes).padStart(2, "0")}m:
                                {String(timeLeftObj.seconds).padStart(2, "0")}s
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => setCurrentView(`upi-${g.id}`)}
                            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 font-black rounded-xl text-xs transition cursor-pointer text-center tracking-wider uppercase text-white shadow-lg shadow-red-950/20"
                          >
                            Enter Board 🎯
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </main>
          </motion.div>
        )}

        {currentView === "my-links" && (
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <RewardEarningsPage onBack={() => setCurrentView("dashboard")} />
          </Suspense>
        )}

        {currentView === "leaderboard" && (
          <motion.div
            key="leaderboard-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen bg-[#020617] text-white pb-12"
          >
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            </header>

            <main className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <Award className="w-14 h-14 mx-auto text-amber-400 animate-pulse" />
                <h3 className="text-lg font-bold">Top Creators & Earners</h3>
                <p className="text-xs text-slate-400">Ranks are updated automatically based on performance.</p>
              </div>

              {loadingLeaderboard ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-850">
                  {leaderboardData.map((leader, index) => {
                    const isCurrentUser = user && leader.id === user.id;
                    return (
                      <div 
                        key={leader.id} 
                        className={`p-4 flex items-center justify-between ${isCurrentUser ? "bg-indigo-500/10 border-y border-indigo-500/20" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm ${
                            index === 0 ? "bg-amber-400 text-black font-black" :
                            index === 1 ? "bg-slate-300 text-black font-black" :
                            index === 2 ? "bg-amber-600 text-white font-black" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">
                              {leader.enteredName || `${leader.firstName || ""} ${leader.lastName || ""}`.trim() || leader.username || "User"} {isCurrentUser && " (You)"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {leader.username ? `@${leader.username}` : "User"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-indigo-400 text-sm">₹{leader.earnings.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase">Level {leader.level}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </motion.div>
        )}

        {/* 🎯 Earn Rewards Dedicated View */}
        {currentView === "earn-rewards" && (
          <motion.div
            key="earn-rewards-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen bg-[#020617] text-white pb-12"
          >
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <h2 className="text-xl font-bold text-white">Earn Rewards</h2>
            </header>

            <main className="p-6 space-y-6">
              <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 flex gap-4 items-center">
                <Sparkles className="w-10 h-10 text-yellow-400 animate-spin-slow shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Task Center</h3>
                  <p className="text-xs text-slate-400 mt-1">Complete instant-reward tasks to instantly credit your wallet balance.</p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setUserRewardTab("standard")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${userRewardTab === "standard" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  📋 Standard Tasks ({tasks.length})
                </button>
                <button
                  onClick={() => setUserRewardTab("gp")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${userRewardTab === "gp" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  🔗 Shortener Tasks ({gpTasks.length})
                </button>
              </div>

              {userRewardTab === "standard" ? (
                <>
                  {loadingTasks ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No tasks available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <StandardTaskCard 
                          key={task.id} 
                          task={task} 
                          onStart={(id) => setActiveTaskId(id)} 
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loadingGpTasks ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : gpTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No tasks available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {gpTasks.map((task) => {
                        const isCompleted = completedGpTaskIds.includes(task.id);
                        return (
                          <ShortenerTaskCard 
                            key={task.id} 
                            task={task} 
                            isCompleted={isCompleted} 
                            onStart={(id, url) => handleStartTask(id, url, "gplink")} 
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </main>
          </motion.div>
        )}

        {/* 🆘 Support Dedicated View */}
        {currentView === "support" && (
          <motion.div
            key="support-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen bg-[#020617] text-white pb-12"
          >
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <h2 className="text-xl font-bold text-white">Support Help Center</h2>
            </header>

            <main className="p-6 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                <HelpCircle className="w-10 h-10 text-teal-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">How can we help?</h3>
                  <p className="text-xs text-slate-400 mt-1">Get instant assistance from the RoyShare team.</p>
                </div>
              </div>

              {/* FAQ Accordion Placeholder */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Frequently Asked Questions</h4>
                <div className="space-y-3">
                  {[
                    { q: "How is my payout calculated?", a: "Earnings depend on completed tasks and dynamic survey rates. Payouts are made in INR." },
                    { q: "What is the minimum withdrawal?", a: "The minimum withdrawal is specified in your wallet section depending on your tier." },
                    { q: "How long does verification take?", a: "Security verification processes payouts automatically within 24 to 48 hours." },
                  ].map((faq, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 space-y-1.5">
                      <p className="font-bold text-xs text-white flex items-center gap-2">
                        <span className="text-teal-400">Q.</span> {faq.q}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed pl-4">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Support Button */}
              <div className="pt-4">
                <a 
                  href="https://t.me/RoyShareCommunity" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/10"
                >
                  <MessageSquare className="w-4 h-4" /> Message Support Community
                </a>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
