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
  Bell
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { SurveyPage } from "./SurveyPage";
import { WalletPage } from "./WalletPage";
import DailyBonusPage from "./DailyBonusPage";
import DashboardPage from "./DashboardPage";
import RewardTasksPage from "./RewardTasksPage";
import { API_BASE } from "../config/api";
import { MyLinksPage } from "./MyLinksPage";
import { UrlShortenerAnalyticsPage } from "./UrlShortenerAnalyticsPage";
import { MyContentPage } from "./MyContentPage";
import ReferralCenter from "./ReferralCenter";
import { GameCenterPage } from "./GameCenterPage";
import { GamePlayerPage } from "./GamePlayerPage";
import { navigate } from "../lib/navigation";

const DriveUploadPage = lazy(() => import("./DriveUploadPage"));
const CustomerSupportPage = lazy(() => import("./CustomerSupportPage"));
const AnnouncementsPage = lazy(() => import("./AnnouncementsPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const ShortenPage = lazy(() => import("./ShortenPage"));
const RewardEarningsPage = lazy(() => import("./RewardEarningsPage"));

interface MembershipVerificationProps {
  user: any;
  onVerified: () => void;
}

const MembershipVerification: React.FC<MembershipVerificationProps> = ({ user }) => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tgSettings, setTgSettings] = useState<any>(null);

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
  const { user, loading, error, startParam } = useTelegramAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    console.log("[MiniAppHome] Initializing view. Pathname:", window.location.pathname, "Search:", window.location.search);
    if (window.location.pathname.startsWith("/game/")) return "game-player";
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    if (page === "game-earn") return "game-earn";
    if (page === "game-center") return "game-center";
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
  const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const queryUserId = searchParams?.get("userId");
  const isMiniApp = !!(tg?.initData || queryUserId);

  const mockUser = {
    id: "12345678",
    telegramId: 12345678,
    username: "rohit_sharma",
    firstName: "Rohit",
    lastName: "Sharma",
    photoUrl: "",
    languageCode: "en",
    isPremium: false,
    enteredName: "Rohit Sharma",
    balance: 1250,
    availableBalance: 1250,
    totalEarnings: 1250,
    todayEarnings: 0,
    level: "Bronze" as const,
    referralCode: "RS123456",
    referredBy: null,
    profileCompleted: true,
    createdAt: "2023-10-01T00:00:00.000Z",
    updatedAt: "2023-10-01T00:00:00.000Z",
    lastActive: "2023-10-01T00:00:00.000Z",
    status: "Active" as const
  };

  const activeUser: any = user || (!isMiniApp ? mockUser : null);

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
    } else if (window.location.pathname.startsWith("/game/")) {
      setCurrentView("game-player");
    } else if (window.location.pathname === "/" || window.location.pathname === "") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      if (viewParam) {
        setCurrentView(viewParam);
      } else if (currentView === "game-player") {
        setCurrentView("game-center");
      }
    }
  }, [window.location.pathname]);

  const [hasCheckedDeepLink, setHasCheckedDeepLink] = useState(false);

  // Deep Link Handling
  useEffect(() => {
    if (activeUser?.membershipVerified && isPhoneVerified && startParam && !hasCheckedDeepLink) {
      if (startParam.startsWith("game_")) {
        const gameId = startParam.replace("game_", "");
        console.log(`[MiniAppHome] Deep link detected for game: ${gameId}`);
        setHasCheckedDeepLink(true);
        setCurrentView("game-player");
        // Update URL to match game-player expectations
        window.history.replaceState({}, "", `/game/${gameId}`);
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

  // Copy Feedback State
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
            });
          });
          // Filter to active tasks
          const activeTasks = fetchedTasks.filter((t) => 
            t.status === "🟢 Active" || 
            String(t.status || "").toLowerCase().includes("active")
          );
          setTasks(activeTasks);
        })
        .catch((err) => console.error("Error loading tasks:", err))
        .finally(() => setLoadingTasks(false));
    }
  }, [currentView]);

  if (loading && isMiniApp) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isMiniApp && (error || !activeUser || !activeUser.id)) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center text-red-400">
        <div>
          <p className="font-bold text-lg">Authentication Failed</p>
          <p className="text-sm mt-2">{error || "Could not identify user. Please restart."}</p>
        </div>
      </div>
    );
  }

  if (!activeUser?.membershipVerified) {
    return (
      <MembershipVerification 
        user={activeUser} 
        onVerified={() => {
          // Handled by Firebase onSnapshot in TelegramAuthContext
        }} 
      />
    );
  }

  if (!isPhoneVerified) {
    return (
      <PhoneVerification 
        user={activeUser} 
        onVerified={() => setIsPhoneVerified(true)} 
      />
    );
  }

  // Render Sub-Views
  if (currentView === "game-player") {
    const gameId = window.location.pathname.split("/game/")[1] || "";
    return (
      <GamePlayerPage 
        gameId={gameId}
        userId={activeUser.id}
        onBack={() => {
          navigate("/?view=game-center");
          setCurrentView("game-center");
        }}
      />
    );
  }

  if (currentView === "game-earn") {
    return (
      <GameCenterPage 
        userId={activeUser.id} 
        onBack={() => {
          navigate("/");
          setCurrentView("home");
        }} 
        initialView="intro"
      />
    );
  }

  if (currentView === "game-center") {
    return (
      <GameCenterPage 
        userId={activeUser.id} 
        onBack={() => {
          navigate("/");
          setCurrentView("home");
        }} 
        initialView="center"
      />
    );
  }

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
    return <DriveUploadPage onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "dashboard") {
    return <DashboardPage onBack={() => setCurrentView("home")} onNavigate={setCurrentView} />;
  }

  if (currentView === "surveys") {
    return <SurveyPage onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "wallet" || currentView === "balance" || currentView === "withdraw" || currentView === "history") {
    const initialTab = currentView === "balance" || currentView === "wallet" ? "wallet" : currentView;
    return <WalletPage onBack={() => setCurrentView("home")} initialTab={initialTab} />;
  }

  if (currentView === "daily-bonus" || currentView === "spin-wheel") {
    return (
      <div className="min-h-screen bg-[#020617]">
        <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => setCurrentView("home")} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h2 className="text-xl font-bold text-white">Daily Bonus</h2>
        </header>
        <DailyBonusPage />
      </div>
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
        userIdProp={activeUser.id} 
        taskIdProp={activeTaskId} 
        onBack={() => setActiveTaskId(null)} 
      />
    );
  }

  const referralLink = `https://t.me/Roysharearn_bot?start=ref_${activeUser.id}`;

  const actionButtons = [
    { id: "self-earning", label: "Self Earning", icon: Star, color: "bg-blue-500", shadow: "shadow-blue-500/20" },
    { id: "game-earn", label: "Game & Earn", icon: PlayCircle, color: "bg-purple-600", shadow: "shadow-purple-500/20" },
    { id: "upload-file", label: "Upload File", icon: Upload, color: "bg-emerald-600", shadow: "shadow-emerald-500/20" },
    { id: "url-shortener", label: "URL Shortener", icon: LinkIcon, color: "bg-indigo-600", shadow: "shadow-indigo-500/20" },
    { id: "my-content", label: "My Content", icon: FolderOpen, color: "bg-sky-500", shadow: "shadow-sky-500/20" },
    { id: "my-links", label: "My Links", icon: Share2, color: "bg-indigo-500", shadow: "shadow-indigo-500/20" },
    { id: "announcements", label: "Announcements", icon: Bell, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
    { id: "settings", label: "Settings", icon: Settings, color: "bg-slate-500", shadow: "shadow-slate-500/20" },
    { id: "support", label: "Contact Support", icon: MessageSquare, color: "bg-teal-500", shadow: "shadow-teal-500/20" },
  ];

  const handleAction = (id: string) => {
    console.log("[MiniAppHome] handleAction called with id:", id, "currentView before change:", currentView);
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
                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`} 
                    alt={user.username}
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
                  Welcome, {displayName} (@{user.username || "user"})
                </motion.p>
                
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400" /> {user.level || 1} Level
                  </span>
                  {user.isPremium && (
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
                    <p className="text-emerald-400 font-bold text-sm">+₹{user.todayEarnings}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Earnings</p>
                    <p className="text-blue-400 font-bold text-sm">₹{displayTotalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Menu Buttons Grid */}
            <section className="px-6 pt-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Navigation Menu</h4>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3"
              >
                {actionButtons.map((btn, idx) => (
                  <motion.button
                    key={btn.id}
                    variants={itemVariants}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAction(btn.id)}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60 transition-all group"
                  >
                    <div className={`w-11 h-11 ${btn.color} ${btn.shadow} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <btn.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{btn.label}</span>
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
            <DriveUploadPage onBack={() => setCurrentView("dashboard")} />
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
                    const isCurrentUser = leader.id === user.id;
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

              {loadingTasks ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No active tasks available. Check back soon!
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-white">{task.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1 rounded-xl text-right shrink-0">
                          <p className="text-[9px] uppercase tracking-wider font-bold">REWARD</p>
                          <p className="font-bold text-sm">₹{task.amount}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTaskId(task.id)}
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" /> Start Task
                      </button>
                    </div>
                  ))}
                </div>
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
