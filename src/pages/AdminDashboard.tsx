import LinkAnalyticsPage from "./LinkAnalyticsPage";
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { StatCard, HealthItem } from "../components/AdminComponents";
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Tv,
  Target,
  ShieldAlert,
  Award,
  Clock,
  AlertCircle,
  Info,
  Smartphone,
  MousePointer2,
  ClipboardCheck,
  Sparkles,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  UserPlus,
  Trash2,
  Search,
  User,
  Filter,
  Download,
  Users,
  Check,
  Terminal,
  Globe,
  RefreshCw,
  FileCode,
  Activity,
  Layers,
  Radio,
  XCircle,
  CheckCircle,
} from "lucide-react";


import React from 'react';
import ReferralAdminManager from "../components/ReferralAdminManager";
import UserDetailsModal from "../components/UserDetailsModal";
import TelegramLoginSettingsAdmin from "../components/TelegramLoginSettingsAdmin";
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("AdminDashboard Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-white p-10 bg-red-900 min-h-screen"><h1>CRASHED: {String(this.state.error)}</h1><pre>{this.state.error && this.state.error.stack}</pre></div>;
    }
    return this.props.children; 
  }
}

export default function AdminDashboard() {
  return <ErrorBoundary><AdminDashboardContent /></ErrorBoundary>;
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState<any>(null);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiGenSettings, setAiGenSettings] = useState<any>({});
  const [aiPreviewRewards, setAiPreviewRewards] = useState<any>(null);
  const [usersError, setUsersError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [adPlacements, setAdPlacements] = useState<any>({});
  const [adPlacementsLoading, setAdPlacementsLoading] = useState(false);
  const [rejectionType, setRejectionType] = useState("normal");
  const [activePageTab, setActivePageTab] = useState<number>(1);
  const [adForm, setAdForm] = useState<any>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnnouncing, setAiAnnouncing] = useState(false);
  const [aiGenMessage, setAiGenMessage] = useState<any>(null);
  
  
  const [aiReplying, setAiReplying] = useState(false);
  const [analyticsLinkId, setAnalyticsLinkId] = useState("");
  const [announcementForm, setAnnouncementForm] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [bonusHistory, setBonusHistory] = useState<any[]>([]);
  const [bonusHistoryLoading, setBonusHistoryLoading] = useState(false);
  const [bonusSearch, setBonusSearch] = useState("");
  const [bonusSettings, setBonusSettings] = useState<any>(null);
  const [bonusSettingsLoading, setBonusSettingsLoading] = useState(false);
  const [bonusView, setBonusView] = useState("");
  const [dailyBonusStats, setDailyBonusStats] = useState<any>(null);
  const [dailyBonusStatsLoading, setDailyBonusStatsLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [googleDriveAccounts, setGoogleDriveAccounts] = useState<any[]>([]);
  const [googleDriveError, setGoogleDriveError] = useState("");
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [modalInput, setModalInput] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [settingsTab, setSettingsTab] = useState("");
  const [shortenerSubTab, setShortenerSubTab] = useState("");
  const [smartLinkForm, setSmartLinkForm] = useState<any>(null);
  const [smartLinks, setSmartLinks] = useState<any[]>([]);
  const [smartLinkSearch, setSmartLinkSearch] = useState("");
  const [smartLinksError, setSmartLinksError] = useState("");
  const [smartLinksLoading, setSmartLinksLoading] = useState(false);
  const [supportSettings, setSupportSettings] = useState<any>(null);
  const [supportSettingsLoading, setSupportSettingsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [taskForm, setTaskForm] = useState<any>(null);
  const [taskLogs, setTaskLogs] = useState<any[]>([]);
  const [taskLogsLoading, setTaskLogsLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksError, setTasksError] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskView, setTaskView] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketsError, setTicketsError] = useState("");
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userShortenerSettings, setUserShortenerSettings] = useState<any>(null);
  const [userShortenerSettingsLoading, setUserShortenerSettingsLoading] = useState(false);
  const [userShortenerSettingsSaving, setUserShortenerSettingsSaving] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userView, setUserView] = useState("");
  const [verifiedTasks, setVerifiedTasks] = useState<any[]>([]);
  const [verifiedTasksLoading, setVerifiedTasksLoading] = useState(false);
  const [verifiedTasksSearch, setVerifiedTasksSearch] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsError, setWithdrawalsError] = useState("");
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const fetchGoogleDriveAccounts = async () => {
    setGoogleDriveLoading(true);
    setGoogleDriveError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/google-drive-accounts`);
      if (!res.ok) throw new Error("Failed to fetch Google Drive accounts");
      const json = await res.json();
      setGoogleDriveAccounts(json);
    } catch (err: any) {
      setGoogleDriveError(err.message);
    } finally {
      setGoogleDriveLoading(false);
    }
  };


  const handleDisconnectGoogleDrive = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect this Google Drive account? This will revoke access but won't delete user data.",
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/google-drive-accounts/${id}/disconnect`,
        {
          method: "POST",
        },
      );
      if (!res.ok) throw new Error("Failed to disconnect account");
      const result = await res.json();
      if (result.success) {
        alert("Account disconnected successfully!");
        fetchGoogleDriveAccounts();
      } else {
        throw new Error(result.error || "Failed to disconnect account");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const [shortenerTestLoading, setShortenerTestLoading] = useState(false);
  const [shortenerTestStatus, setShortenerTestStatus] = useState<string>("");
  const [showShortenerKey, setShowShortenerKey] = useState(false);

  const handleTestShortenerConnection = async () => {
    setShortenerTestLoading(true);
    setShortenerTestStatus("");
    try {
      const config = systemSettings?.urlShortener || {};
      const res = await fetch(
        `${API_BASE}/api/admin/shortener/test-connection`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: config.provider || "GPLinks",
            apiKey: config.apiKey || "",
            publisherId: config.publisherId || "",
          }),
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setShortenerTestStatus(
          `🟢 Success! Test shortened URL: ${data.shortenedUrl}`,
        );
        setSystemSettings({
          ...systemSettings,
          urlShortener: {
            ...systemSettings.urlShortener,
            testStatus: "🟢 Success",
            testedAt: new Date().toISOString(),
          },
        });
      } else {
        setShortenerTestStatus(
          `🔴 Failed: ${data.error || "Unknown error occurred"}`,
        );
        setSystemSettings({
          ...systemSettings,
          urlShortener: {
            ...systemSettings.urlShortener,
            testStatus: "🔴 Failed",
            testedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      setShortenerTestStatus(
        `🔴 Error: ${err.message || "Failed to make test request"}`,
      );
    } finally {
      setShortenerTestLoading(false);
    }
  };

  const [showApiKey, setShowApiKey] = useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState("");

  const handleTestConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionStatus("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/support/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey: supportSettings.geminiApiKey,
          geminiModel: supportSettings.geminiModel || "gemini-1.5-flash",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestConnectionStatus("✅ Connected");
        setSupportSettings((prev: any) => ({
          ...prev,
          connectionStatus: "✅ Connected",
          lastResponseTime: data.durationMs ? `${data.durationMs}ms` : "N/A",
          lastError: "None",
          testedAt: new Date().toISOString(),
        }));
      } else {
        setTestConnectionStatus(
          `❌ Invalid API Key: ${data.error || "Connection failed"}`,
        );
        setSupportSettings((prev: any) => ({
          ...prev,
          connectionStatus: "❌ Invalid API Key",
          lastError: data.error || "Connection failed",
          lastResponseTime: "-",
        }));
      }
    } catch (err: any) {
      setTestConnectionStatus(
        `❌ Connection Error: ${err.message || "Failed to connect"}`,
      );
      setSupportSettings((prev: any) => ({
        ...prev,
        connectionStatus: "❌ Connection Error",
        lastError: err.message || "Failed to connect",
        lastResponseTime: "-",
      }));
    } finally {
      setTestConnectionLoading(false);
    }
  };

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsView, setAnalyticsView] = useState("Overview");

  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);
  const [broadcastTab, setBroadcastTab] = useState("📝 Text Broadcast");
  const [broadcastForm, setBroadcastForm] = useState({
    type: "text",
    message: "",
    caption: "",
    mediaUrl: "",
    buttonText: "",
    buttonLink: "",
    targetAudience: "👥 All Users",
    scheduledAtDate: "",
    scheduledAtTime: "",
  });
  const [isScheduling, setIsScheduling] = useState(false);

  // AI message rewrite states
  const [isImprovingWithAi, setIsImprovingWithAi] = useState(false);
  const [aiOriginalText, setAiOriginalText] = useState("");
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [showAiView, setShowAiView] = useState(false);
  const [aiError, setAiError] = useState("");

  // Broadcast send progress / stats states
  const [sendStatus, setSendStatus] = useState<
    "idle" | "preparing" | "sending" | "success" | "failed"
  >("idle");
  const [broadcastStats, setBroadcastStats] = useState<{
    totalUsers: number;
    delivered: number;
    failed: number;
    skipped: number;
    timeTaken: string;
  } | null>(null);

  // Self test states
  const [isSelfTesting, setIsSelfTesting] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<{
    apiWorking: boolean;
    deliveryWorking: boolean;
    usersLoaded: boolean;
    buttonsWorking: boolean;
    completedSuccessfully: boolean;
  } | null>(null);
  const [selfTestError, setSelfTestError] = useState("");

  // AI Instruction Generation states
  const [aiGeneratingInstructions, setAiGeneratingInstructions] =
    useState(false);
  const [suggestedInstructions, setSuggestedInstructions] = useState<
    string | null
  >(null);

  // AI Task Generation states
  const [aiGeneratingTask, setAiGeneratingTask] = useState(false);
  const [aiTaskSuggestion, setAiTaskSuggestion] = useState<any | null>(null);
  const [aiTaskType, setAiTaskType] = useState("Watch Ads");

  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>({});
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityTab, setSecurityTab] = useState("Overview");

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLogsStats, setActivityLogsStats] = useState<any>({});
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogTab, setActivityLogTab] = useState("📋 View Logs");
  const [activityLogSearch, setActivityLogSearch] = useState("");

  // Telegram States
  const [telegramConfigs, setTelegramConfigs] = useState<any>({
    botToken: "",
    chatId: "",
    storageChannelId: "",
    channelUsername: "",
    groupUsername: "",
    supportUsername: "",
    botName: "",
    botUsername: "",
  });
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState("");
  const [diagnosticsReport, setDiagnosticsReport] = useState<any>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<any>({});
  const [showBotToken, setShowBotToken] = useState(false);

  const fetchTelegramSettings = async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/telegram/settings`);
      if (res.ok) {
        const data = await res.json();
        setTelegramConfigs({
          botToken: data.botToken || "",
          chatId: data.chatId || "",
          storageChannelId: data.storageChannelId || "",
          channelUsername: data.channelUsername || "",
          groupUsername: data.groupUsername || "",
          supportUsername: data.supportUsername || "",
          botName: data.botName || "",
          botUsername: data.botUsername || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTelegramLoading(false);
    }
  };

  const saveTelegramSettings = async () => {
    setTelegramLoading(true);
    setTelegramFeedback("");
    try {
      const res = await fetch(`${API_BASE}/api/telegram/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramConfigs),
      });
      if (res.ok) {
        setTelegramFeedback("✅ Settings Saved Successfully");
        setTimeout(() => setTelegramFeedback(""), 3000);
      } else {
        setTelegramFeedback("❌ Failed to save settings");
      }
    } catch (err: any) {
      setTelegramFeedback(`❌ Error: ${err.message}`);
    } finally {
      setTelegramLoading(false);
    }
  };

  const runTelegramAction = async (
    actionKey: string,
    endpoint: string,
    payload: any,
  ) => {
    setActionLoading((prev: any) => ({ ...prev, [actionKey]: true }));
    setTelegramFeedback("");
    try {
      const targetUrl = endpoint.startsWith("/")
        ? `${API_BASE}${endpoint}`
        : endpoint;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (actionKey === "runDiagnostics") {
          setDiagnosticsReport(data);
          setTelegramFeedback("✅ Diagnostics Completed Successfully");
        } else if (actionKey === "clearCache") {
          setTelegramFeedback(`✅ Cache Cleared: ${data.message || "Success"}`);
        } else {
          setTelegramFeedback(`✅ Action Completed: ${actionKey} Succeeded`);
        }
      } else {
        setTelegramFeedback(
          `❌ Action Failed: ${data.error || "Unknown Error"}`,
        );
      }
    } catch (err: any) {
      setTelegramFeedback(`❌ Action Error: ${err.message}`);
    } finally {
      setActionLoading((prev: any) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleSetWebhook = async () => {
    setActionLoading((prev: any) => ({ ...prev, setWebhook: true }));
    setTelegramFeedback("");
    try {
      const res = await fetch(`${API_BASE}/api/telegram/webhook/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramConfigs.botToken,
          url: "https://www.royshare.online/api/telegram/webhook",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramFeedback(
          `✅ Webhook Set & Verified Successfully!\nURL: ${data.webhookInfo?.url || "https://www.royshare.online/api/telegram/webhook"}`,
        );

        // Refresh the diagnostics panel automatically
        setActionLoading((prev: any) => ({ ...prev, runDiagnostics: true }));
        try {
          const diagRes = await fetch(`${API_BASE}/api/telegram/diagnostics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(telegramConfigs),
          });
          if (diagRes.ok) {
            const diagData = await diagRes.json();
            setDiagnosticsReport(diagData);
          }
        } catch (diagErr) {
          console.error(
            "Failed to automatically refresh diagnostics:",
            diagErr,
          );
        } finally {
          setActionLoading((prev: any) => ({ ...prev, runDiagnostics: false }));
        }
      } else {
        setTelegramFeedback(
          `❌ Action Failed: ${data.error || "Unknown Error"}`,
        );
      }
    } catch (err: any) {
      setTelegramFeedback(`❌ Action Error: ${err.message}`);
    } finally {
      setActionLoading((prev: any) => ({ ...prev, setWebhook: false }));
    }
  };

  const handleGenerateAiInstructions = async () => {
    setAiGeneratingInstructions(true);
    setAiError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/shortener/generate-instructions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: userShortenerSettings }),
        },
      );
      const data = await res.json();
      if (res.ok && data.text) {
        setSuggestedInstructions(data.text);
      } else {
        setAiError(data.error || "Failed to generate instructions");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to make request to AI");
    } finally {
      setAiGeneratingInstructions(false);
    }
  };

  const handleGenerateAiTask = async (
    field?: string,
    overrideType?: string,
    overrideAdNetwork?: string,
  ) => {
    const typeToUse = overrideType || aiTaskType;
    setAiGeneratingTask(true);
    setAiError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/tasks/generate-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType: typeToUse,
          field,
          currentTask: {
            ...taskForm,
            adNetwork: overrideAdNetwork || taskForm.adNetwork, // Use override if provided
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        if (field) {
          // If individual field generation, just update that field
          setTaskForm((prev) => ({ ...prev, [field]: data.task[field] }));
        } else {
          // If full generation, fill all fields automatically and also show suggestion panel for analytics
          // Ensure suggestion also reflects the current ad network if it's set
          if (data.task && (overrideAdNetwork || taskForm.adNetwork)) {
            data.task.adNetwork = overrideAdNetwork || taskForm.adNetwork;
          }

          setTaskForm((prev) => ({
            ...prev,
            ...data.task,
            // STRONGLY PRESERVE these fields - user's selection is the source of truth
            adNetwork: prev.adNetwork || data.task.adNetwork,
            status: prev.status,
          }));
          setAiTaskSuggestion(data);
        }
      } else {
        setAiError(
          data.error || "Failed to generate task. Please check API key.",
        );
      }
    } catch (err: any) {
      setAiError(
        err.message || "Failed to make request to AI. Server might be offline.",
      );
    } finally {
      setAiGeneratingTask(false);
    }
  };

  const applyAiTask = () => {
    if (aiTaskSuggestion && aiTaskSuggestion.task) {
      setTaskForm((prev) => ({
        ...prev,
        // Only update these fields, NOT the ad network or status
        title: aiTaskSuggestion.task.title || prev.title,
        description: aiTaskSuggestion.task.description || prev.description,
        rewardAmount: aiTaskSuggestion.task.rewardAmount || prev.rewardAmount,
        timerDuration:
          aiTaskSuggestion.task.timerDuration || prev.timerDuration,
        totalPages: aiTaskSuggestion.task.totalPages || prev.totalPages,
        imageUrl: aiTaskSuggestion.task.imageUrl || prev.imageUrl,
        // Keep existing selections as source of truth
        adNetwork: prev.adNetwork,
        status: prev.status,
      }));
      setAiTaskSuggestion(null);
    }
  };

  const useSuggestedInstructions = () => {
    if (suggestedInstructions) {
      setUserShortenerSettings((prev: any) => ({
        ...prev,
        instructions: suggestedInstructions,
      }));
      setSuggestedInstructions(null);
    }
  };

  const [monetagStats, setMonetagStats] = useState<any>(null);
  const [monetagStatsLoading, setMonetagStatsLoading] = useState(false);
  const [monetagTestResult, setMonetagTestResult] = useState<any>(null);
  const [monetagTesting, setMonetagTesting] = useState(false);

  const fetchMonetagStats = async () => {
    setMonetagStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/monetag/stats`);
      const data = await res.json();
      if (data.success) {
        setMonetagStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch Monetag stats:", e);
    } finally {
      setMonetagStatsLoading(false);
    }
  };

  const testMonetagPostback = async () => {
    setMonetagTesting(true);
    setMonetagTestResult(null);
    try {
      // Use the first user found or a dummy ID for testing
      const telegramId = data?.topEarners?.[0]?.telegramId || "123456789";
      const res = await fetch(`${API_BASE}/api/admin/monetag/test-postback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId }),
      });
      const result = await res.json();
      setMonetagTestResult(result);
      if (result.success) {
        fetchMonetagStats(); // Refresh stats
      }
    } catch (e: any) {
      setMonetagTestResult({ success: false, error: e.message });
    } finally {
      setMonetagTesting(false);
    }
  };

  const [backups, setBackups] = useState<any[]>([]);
  const [backupSettings, setBackupSettings] = useState<any>({
    autoBackupEnabled: false,
    backupFrequency: "Daily",
    retentionDays: 30,
  });
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupTab, setBackupTab] = useState("📦 Create Backup");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true);
    setWithdrawalsError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`);
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      const json = await res.json();
      setWithdrawals(json);
    } catch (err: any) {
      setWithdrawalsError(err.message);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    setTicketsError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const json = await res.json();
      setTickets(json);
    } catch (err: any) {
      setTicketsError(err.message);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements`);
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const json = await res.json();
      setAnnouncements(json);
    } catch (err: any) {
      setAnnouncementsError(err.message);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    setTasksError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const json = await res.json();
      setTasks(json);
    } catch (err: any) {
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchTaskLogs = async () => {
    setTaskLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/task-logs`);
      if (res.ok) {
        const json = await res.json();
        setTaskLogs(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskLogsLoading(false);
    }
  };

  const fetchVerifiedTasks = async () => {
    setVerifiedTasksLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/verified-tasks`);
      if (res.ok) {
        const json = await res.json();
        setVerifiedTasks(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifiedTasksLoading(false);
    }
  };

  const fetchBonusSettings = async () => {
    setBonusSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/daily-bonus/settings`);
      if (res.ok) {
        const data = await res.json();
        const defaults = {
          dailyBonusEnabled: true,
          resetTime: "00:00",
          wheel: { enabled: true, dailyLimit: 2, cooldown: 0, rewards: [] },
          box: { enabled: true, dailyLimit: 1, cooldown: 0, rewards: [] },
          scratch: { enabled: true, dailyLimit: 3, cooldown: 0, rewards: [] },
        };
        setBonusSettings({
          ...defaults,
          ...data,
          wheel: { ...defaults.wheel, ...data?.wheel },
          box: { ...defaults.box, ...data?.box },
          scratch: { ...defaults.scratch, ...data?.scratch },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBonusSettingsLoading(false);
    }
  };

  const fetchBonusHistory = async () => {
    setBonusHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/daily-bonus/history`);
      if (res.ok) setBonusHistory(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setBonusHistoryLoading(false);
    }
  };

  const fetchDailyBonusStats = async () => {
    setDailyBonusStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/daily-bonus/stats`);
      if (res.ok) setDailyBonusStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setDailyBonusStatsLoading(false);
    }
  };

  const saveBonusSettings = async (newSettings: any) => {
    try {
      const { totalSpins, totalRewardsDistributed, ...settingsToSave } =
        newSettings;
      const res = await fetch(`${API_BASE}/api/admin/daily-bonus/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave),
      });
      if (res.ok) {
        alert("Daily Bonus settings saved successfully!");
        fetchBonusSettings();
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    }
  };

  const handleAIGenerateRewards = async (type: string) => {
    if (aiGenSettings.slots < 5 || aiGenSettings.slots > 30) {
      alert("Number of Reward Slots must be between 5 and 30.");
      return;
    }
    if (
      aiGenSettings.minReward < 0 ||
      aiGenSettings.maxReward < aiGenSettings.minReward
    ) {
      alert("Please enter valid minimum and maximum reward limits.");
      return;
    }
    setGeneratingAI(true);
    setAiPreviewRewards(null);
    setAiGenMessage(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/daily-bonus/auto-generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiGenSettings),
        },
      );
      const data = await res.json();
      if (data.success) {
        setAiPreviewRewards(data.rewards);
        if (data.isLocalFallback) {
          setAiGenMessage({
            text: "AI Generator is temporarily unavailable. Using Smart Local Generator.",
            type: "warning",
          });
        } else {
          setAiGenMessage({
            text: `🤖 AI successfully generated ${data.rewards.length} reward slots! Please review the preview table and click "Save and Apply".`,
            type: "success",
          });
        }
      } else {
        // Handle failed AI generation with local fallback
        generateLocalRewardsAsFallback();
      }
    } catch (err) {
      console.error("AI Gen Error:", err);
      // Handle network or connection errors with local fallback
      generateLocalRewardsAsFallback();
    } finally {
      setGeneratingAI(false);
    }
  };

  const generateLocalRewardsAsFallback = () => {
    const numSlots = aiGenSettings.slots || 8;
    const minRew = aiGenSettings.minReward || 1;
    const maxRew = aiGenSettings.maxReward || 100;
    const blSlots = aiGenSettings.betterLuckSlots || 0;

    const rewards = [];
    // Generate normal rewards with inverse quadratic weights
    for (let i = 0; i < numSlots; i++) {
      const ratio = numSlots > 1 ? i / (numSlots - 1) : 0;
      const amount = Math.round(minRew + ratio * (maxRew - minRew));
      const weight = Math.max(1, Math.round(100 * Math.pow(1 - ratio, 2)));
      rewards.push({
        label: `₹${amount.toFixed(2)}`,
        amount,
        weight,
      });
    }

    // Generate Better Luck Next Time slots
    for (let i = 0; i < blSlots; i++) {
      rewards.push({
        label: "Better Luck Next Time 🍀",
        amount: 0,
        weight: 35,
      });
    }

    setAiPreviewRewards(rewards);
    setAiGenMessage({
      text: "AI Generator is temporarily unavailable. Using Smart Local Generator.",
      type: "warning",
    });
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteAllUsers = async () => {
    if (
      !confirm(
        "🚨 CRITICAL WARNING: Are you sure you want to DELETE ALL USERS in the database?\n\nThis action is irreversible and will wipe the entire user directory.",
      )
    )
      return;
    if (
      !confirm(
        "SECOND CONFIRMATION: You are about to delete EVERY registered account. Do you really want to proceed?",
      )
    )
      return;

    setModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/delete-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: "Admin" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, input?: string) => {
    if (
      action === "delete" &&
      !confirm("⚠️ Are you sure you want to permanently delete this user?")
    )
      return;
    if (
      action === "reset" &&
      !confirm(
        "Are you sure you want to reset this user? This will clear balance, rewards, and progress.",
      )
    )
      return;
    if (
      action === "re-register" &&
      !confirm(
        "Are you sure you want to reset this user's registration? They will have to complete the flow again.",
      )
    )
      return;
    if (
      action === "reset-balance" &&
      !confirm("Are you sure you want to reset this user's balance to 0?")
    )
      return;

    setModalLoading(true);
    try {
      let endpoint = "";
      let method = "POST";
      let body: any = { adminId: "Admin" };

      if (["add_balance", "deduct_balance", "add_bonus", "add_reward", "freeze", "unfreeze"].includes(action)) {
        endpoint = `${API_BASE}/api/admin/users/${userId}/wallet`;
        method = "PUT";
        const parsed = JSON.parse(input || "{}");
        body = {
          amount: parsed.amount,
          reason: parsed.reason,
          action: action,
        };
      } else {
        endpoint =
          action === "delete"
            ? `${API_BASE}/api/admin/users/${userId}`
            : `${API_BASE}/api/admin/users/${userId}/${action}`;
        method = action === "delete" ? "DELETE" : "POST";
      }

      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Action completed successfully");
        // Update users list and the selected user in the modal
        const updatedUsers = await (await fetch(`${API_BASE}/api/admin/users`)).json();
        setUsers(updatedUsers);
        if (selectedUser?.id === userId) {
          const updatedSelectedUser = updatedUsers.find((u: any) => u.id === userId);
          setSelectedUser(updatedSelectedUser);
        }
        
        // Only close modal if it wasn't a wallet action
        if (!["add_balance", "deduct_balance", "add_bonus", "add_reward", "freeze", "unfreeze"].includes(action) && modalAction === "view_user") {
          setModalAction("none");
        }
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBulkUserAction = async (action: string) => {
    if (selectedUserIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedUserIds.length} users?`,
      )
    )
      return;

    setUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/bulk-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUserIds,
          action,
          adminId: "Admin",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelectedUserIds([]);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleExportUsers = () => {
    window.open(`${API_BASE}/api/admin/users/export`, "_blank");
  };

  // END OF AD SETTINGS

  const fetchAdPlacements = async () => {
    setAdPlacementsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ad-placements`);
      if (res.ok) setAdPlacements(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setAdPlacementsLoading(false);
    }
  };

  const saveAdPlacements = async (newPlacements: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ad-placements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlacements),
      });
      if (res.ok) {
        setAdPlacements(newPlacements);
        alert("Ad placements saved successfully!");
      } else {
        alert("Failed to save ad placements");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving ad placements");
    }
  };

  const fetchSystemSettings = async () => {
    setSystemSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/system-settings`);
      if (res.ok) {
        const data = await res.json();
        const normalizedData = {
          ...data,
          urlShortener: data.urlShortener || {
            enabled: false,
            provider: "GPLinks",
            apiKey: "",
            publisherId: "",
            testStatus: "Not Tested",
            testedAt: "",
          },
        };
        setSystemSettings(normalizedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSystemSettingsLoading(false);
    }
  };

  const saveSystemSettings = async (settingsToSave: any = systemSettings) => {
    setSystemSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/system-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave),
      });
      if (res.ok) {
        alert("System settings saved successfully!");
        setSystemSettings(settingsToSave);
      } else {
        alert("Failed to save system settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving system settings.");
    } finally {
      setSystemSettingsLoading(false);
    }
  };

  const fetchSupportSettings = async () => {
    setSupportSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/support/settings`);
      if (res.ok) {
        const data = await res.json();
        setSupportSettings(data);
      }
    } catch (err) {
      console.error("Error fetching support settings:", err);
    } finally {
      setSupportSettingsLoading(false);
    }
  };

  const saveSupportSettings = async (settingsToSave: any = supportSettings) => {
    setSupportSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/support/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave),
      });
      if (res.ok) {
        alert("Support settings saved successfully!");
        setSupportSettings(settingsToSave);
      } else {
        alert("Failed to save support settings.");
      }
    } catch (err) {
      console.error("Error saving support settings:", err);
      alert("Error saving support settings.");
    } finally {
      setSupportSettingsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics-full`);
      if (res.ok) {
        setAnalyticsData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchBroadcasts = async () => {
    setBroadcastsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/broadcasts`);
      if (res.ok) {
        setBroadcasts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcastsLoading(false);
    }
  };

  const sendBroadcast = async (status: string) => {
    if (
      status === "Sent" &&
      !broadcastForm.message &&
      !broadcastForm.mediaUrl
    ) {
      alert("Please provide a message or media content.");
      return;
    }

    setBroadcastsLoading(true);
    setBroadcastStats(null);
    if (status === "Sent") {
      setSendStatus("preparing");
    }

    try {
      let scheduledAt = null;
      if (
        status === "Scheduled" &&
        broadcastForm.scheduledAtDate &&
        broadcastForm.scheduledAtTime
      ) {
        scheduledAt = `${broadcastForm.scheduledAtDate}T${broadcastForm.scheduledAtTime}:00`;
      }

      const payload = {
        type: broadcastForm.type,
        message: broadcastForm.message,
        caption: broadcastForm.caption,
        mediaUrl: broadcastForm.mediaUrl,
        buttonText: broadcastForm.buttonText,
        buttonLink: broadcastForm.buttonLink,
        targetAudience: broadcastForm.targetAudience,
        status,
        scheduledAt,
      };

      if (status === "Sent") {
        // Show preparing state for 600ms for high quality feedback
        await new Promise((r) => setTimeout(r, 600));
        setSendStatus("sending");
      }

      const res = await fetch(`${API_BASE}/api/admin/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        if (status === "Sent") {
          setSendStatus("success");
          setBroadcastStats({
            totalUsers: data.totalUsers,
            delivered: data.delivered,
            failed: data.failed,
            skipped: data.skipped,
            timeTaken: data.timeTaken,
          });

          // Automatically run a self-test after live broadcast is done
          setTimeout(() => {
            runSelfTest();
          }, 1500);
        } else {
          alert("✅ Broadcast Scheduled Successfully");
        }

        setBroadcastForm({
          type: "text",
          message: "",
          caption: "",
          mediaUrl: "",
          buttonText: "",
          buttonLink: "",
          targetAudience: "👥 All Users",
          scheduledAtDate: "",
          scheduledAtTime: "",
        });
        setIsScheduling(false);
        if (broadcastTab === "📊 Broadcast History") fetchBroadcasts();
      } else {
        if (status === "Sent") {
          setSendStatus("failed");
        } else {
          alert(
            "Failed to schedule broadcast: " + (data.error || "Unknown error"),
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      if (status === "Sent") {
        setSendStatus("failed");
      } else {
        alert("Error sending broadcast: " + err.message);
      }
    } finally {
      setBroadcastsLoading(false);
    }
  };

  const runSelfTest = async () => {
    setIsSelfTesting(true);
    setSelfTestError("");
    setSelfTestResults(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/broadcasts/self-test`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSelfTestResults(data);
      } else {
        setSelfTestError(data.error || "Self-test failed.");
      }
    } catch (err: any) {
      console.error("Self-test error:", err);
      setSelfTestError(err.message || "Network error running self-test.");
    } finally {
      setIsSelfTesting(false);
    }
  };

  const improveWithAi = async () => {
    const originalText =
      broadcastForm.type === "text" || broadcastTab === "🎯 Targeted Broadcast"
        ? broadcastForm.message
        : broadcastForm.caption;

    if (!originalText || originalText.trim() === "") {
      alert("Please enter some text before clicking 'Improve with AI'.");
      return;
    }

    setIsImprovingWithAi(true);
    setAiOriginalText(originalText);
    setAiGeneratedText("");
    setAiError("");
    setShowAiView(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/broadcasts/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiGeneratedText(data.improvedText);
      } else {
        setAiError(data.error || "AI Generation failed.");
      }
    } catch (err: any) {
      console.error("AI Improvement error:", err);
      setAiError(err.message || "Network error. Please check Gemini settings.");
    } finally {
      setIsImprovingWithAi(false);
    }
  };

  const handleTicketAiAnalyze = async (ticketId: string) => {
    if (aiAnalyzing) return;
    setAiAnalyzing(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/tickets/${ticketId}/ai-analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (res.ok) {
        const updatedSelected = { ...selectedTicket, ...data };
        setSelectedTicket(updatedSelected);
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data } : t)),
        );
      } else {
        alert(data.error || "Failed to analyze ticket with AI.");
      }
    } catch (err: any) {
      console.error("Ticket AI Analyze error:", err);
      alert(err.message || "Failed to analyze ticket.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleTicketAiSuggestReply = async (ticketId: string) => {
    if (aiReplying) return;
    setAiReplying(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/tickets/${ticketId}/ai-suggest-reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setModalInput(data.suggestedReply);
      } else {
        alert(data.error || "Failed to generate reply with AI.");
      }
    } catch (err: any) {
      console.error("Ticket AI Suggested Reply error:", err);
      alert(err.message || "Failed to generate suggested reply.");
    } finally {
      setAiReplying(false);
    }
  };

  const handleAnnouncementAiImprove = async () => {
    if (aiAnnouncing) return;
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert(
        "Please fill in both the Title and Message before using AI Assistance.",
      );
      return;
    }
    setAiAnnouncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementForm.title,
          message: announcementForm.message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncementForm((prev) => ({
          ...prev,
          title: data.improvedTitle,
          message: data.improvedMessage,
        }));
      } else {
        alert(data.error || "Failed to improve announcement with AI.");
      }
    } catch (err: any) {
      console.error("Announcement AI Improve error:", err);
      alert(err.message || "Failed to improve announcement.");
    } finally {
      setAiAnnouncing(false);
    }
  };

  const fetchSecurityData = async () => {
    setSecurityLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/security`);
      if (res.ok) {
        const data = await res.json();
        setSecurityLogs(data.logs || []);
        setSecurityStats(data.stats || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSecurityAction = async (
    logId: string | null,
    userId: string | null,
    action: string,
    reason?: string,
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/security/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, userId, action, reason }),
      });
      if (res.ok) {
        alert(`Action ${action} successful`);
        fetchSecurityData();
      } else {
        alert("Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error performing action");
    }
  };

  const fetchActivityLogs = async () => {
    setActivityLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/activity-logs`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs || []);
        setActivityLogsStats(data.stats || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const fetchBackups = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/backups`);
      if (res.ok) setBackups(await res.json());
      const settingsRes = await fetch(`${API_BASE}/api/admin/backup-settings`);
      if (settingsRes.ok) setBackupSettings(await settingsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Manual" }),
      });
      if (res.ok) {
        const newBackup = await res.json();
        alert(
          `✅ Backup Created Successfully\n\nBackup ID: ${newBackup.backupId}\nDate: ${new Date(newBackup.backupDate).toLocaleString()}\nSize: ${newBackup.backupSize}`,
        );
        fetchBackups();
      } else {
        alert("Failed to create backup.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (id: string, backupId: string) => {
    if (
      !confirm(
        `⚠️ WARNING: Restoring a backup may overwrite current data.\n\nAre you sure you want to restore Backup ID: ${backupId}?`,
      )
    )
      return;

    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/backups/${id}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        alert(`✅ Backup Restored Successfully\n\nBackup ID: ${backupId}`);
        fetchBackups();
      } else {
        alert("Failed to restore backup.");
      }
    } catch (err) {
      console.error(err);
      alert("Error restoring backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (
      !confirm(
        "⚠️ WARNING: Deleted backups cannot be recovered.\n\nAre you sure you want to delete this backup?",
      )
    )
      return;

    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/backups/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchBackups();
      } else {
        alert("Failed to delete backup.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleUpdateBackupSettings = async (newSettings: any) => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/backup-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        setBackupSettings(newSettings);
        alert("Settings updated successfully.");
      } else {
        alert("Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating settings");
    } finally {
      setBackupLoading(false);
    }
  };

  const fetchSmartLinks = async () => {
    setSmartLinksLoading(true);
    setSmartLinksError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/smart-links`);
      if (res.ok) {
        const data = await res.json();
        setSmartLinks(data || []);
      } else {
        setSmartLinksError("Failed to fetch smart links.");
      }
    } catch (e: any) {
      setSmartLinksError(e.message || "Error fetching smart links.");
    } finally {
      setSmartLinksLoading(false);
    }
  };

  const fetchUserShortenerSettings = async () => {
    setUserShortenerSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/user-shortener-settings`);
      if (res.ok) {
        const data = await res.json();
        setUserShortenerSettings({
          ...data,
        });
      }
    } catch (e) {
      console.error("Error fetching user shortener settings:", e);
    } finally {
      setUserShortenerSettingsLoading(false);
    }
  };

  const saveUserShortenerSettings = async (updatedConfig?: any) => {
    setUserShortenerSettingsSaving(true);
    try {
      const configToSave = updatedConfig || userShortenerSettings;
      const res = await fetch(`${API_BASE}/api/admin/user-shortener-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configToSave),
      });
      if (res.ok) {
        alert("User Mode Shortener settings updated successfully!");
      } else {
        alert("Failed to save User Mode Shortener settings.");
      }
    } catch (e: any) {
      alert("Error saving User Mode Shortener settings: " + e.message);
    } finally {
      setUserShortenerSettingsSaving(false);
    }
  };

  const handleUserTotalPagesChange = (num: number) => {
    const val = Math.max(1, Math.min(20, num));
    setUserShortenerSettings((prev: any) => {
      const prevPages = prev.pagesConfig || [];
      const newPages = [];
      for (let i = 1; i <= val; i++) {
        const existing = prevPages.find((p: any) => p.pageNumber === i);
        newPages.push(
          existing || {
            pageNumber: i,
            timerDuration: 10,
            instructions: `Complete step ${i} verification.`,
            selectedAdIds: [],
            numberOfAds: 3,
            humanVerification: true,
            verifyBtnText: `Verify Step ${i}`,
            continueBtnText: `Proceed`,
          },
        );
      }
      return {
        ...prev,
        totalPages: val,
        pagesConfig: newPages,
      };
    });
  };

  useEffect(() => {
    let supportInterval: any = null;
    if (activeTab === "Overview") {
      fetchDashboardData();
    } else if (activeTab === "🔗 Smart URL Shortener") {
      fetchSmartLinks();
      fetchUserShortenerSettings();
    } else if (activeTab === "💸 Withdrawals") {
      fetchWithdrawals();
    } else if (activeTab === "🎫 Support") {
      fetchTickets();
      supportInterval = setInterval(fetchTickets, 5000);
    } else if (activeTab === "📢 Announcements") {
      fetchAnnouncements();
    } else if (activeTab === "💰 Rewards") {
      fetchTasks();
      if (taskView === "stats") {
        fetchTaskLogs();
      }
    } else if (activeTab === "🎁 Daily Bonus") {
      if (
        [
          "settings",
          "wheel-rewards",
          "box-rewards",
          "scratch-rewards",
          "stats",
        ].includes(bonusView)
      ) {
        fetchBonusSettings();
      }
      if (bonusView === "history") {
        fetchBonusHistory();
      }
      if (bonusView === "stats") {
        fetchDailyBonusStats();
      }
    } else if (activeTab === "👥 Users") {
      fetchUsers();
    } else if (activeTab === "📈 Analytics") {
      fetchAnalytics();
    } else if (activeTab === "📢 Broadcast") {
      if (broadcastTab === "📊 Broadcast History") fetchBroadcasts();
    } else if (activeTab === "⚙️ System Settings") {
      fetchSystemSettings();
      fetchTelegramSettings();
      fetchSupportSettings();
      fetchBonusSettings();
    } else if (activeTab === "🛡 Security Center") {
      fetchSecurityData();
    } else if (activeTab === "📜 Activity Logs") {
      fetchActivityLogs();
    } else if (activeTab === "📥 Backup & Restore") {
      fetchBackups();
    } else if (activeTab === "💰 Monetag Postback") {
      fetchMonetagStats();
    } else if (activeTab === "📥 Google Drive Accounts") {
      fetchGoogleDriveAccounts();
    }

    return () => {
      if (supportInterval) {
        clearInterval(supportInterval);
      }
    };
  }, [activeTab, taskView, bonusView, analyticsView, broadcastTab]);

  const handleActionSubmit = async () => {
    // Simplified guard logic
    const isTicketAction = modalAction.endsWith("_ticket");
    const isAnnouncementAction = modalAction.endsWith("_announcement");
    const isTaskAction = modalAction.endsWith("_task");
    const isAdAction = modalAction.endsWith("_ad");
    const isUserAction = [
      "add_balance",
      "deduct_balance",
      "ban_user",
      "unban_user",
      "message_user",
    ].includes(modalAction);
    const isWithdrawalAction =
      !isTicketAction &&
      !isAnnouncementAction &&
      !isTaskAction &&
      !isAdAction &&
      !isUserAction;

    if (isTicketAction && !selectedTicket) return;
    if (isAnnouncementAction && !announcementForm) return;
    if (isTaskAction && !taskForm) return;
    if (isAdAction && !adForm) return;
    if (isUserAction && !selectedUser) return;
    if (isWithdrawalAction && !selectedWithdrawal) return;
    setModalLoading(true);
    try {
      let endpoint = "";
      let body: any = {};
      let method = "POST";
      if (modalAction === "approve") {
        endpoint = `/api/admin/withdrawals/${selectedWithdrawal.id}/approve`;
      } else if (modalAction === "paid") {
        endpoint = `/api/admin/withdrawals/${selectedWithdrawal.id}/paid`;
        body = { transactionReference: modalInput };
      } else if (modalAction === "reject") {
        endpoint = `/api/admin/withdrawals/${selectedWithdrawal.id}/reject`;
        body = { rejectReason: modalInput, rejectionType };
      } else if (modalAction === "reply_ticket") {
        endpoint = `/api/admin/tickets/${selectedTicket.id}/reply`;
        body = { replyMessage: modalInput };
      } else if (modalAction === "resolve_ticket") {
        endpoint = `/api/admin/tickets/${selectedTicket.id}/resolve`;
      } else if (modalAction === "close_ticket") {
        endpoint = `/api/admin/tickets/${selectedTicket.id}/close`;
      } else if (modalAction === "delete_ticket") {
        endpoint = `/api/admin/tickets/${selectedTicket.id}`;
        method = "DELETE";
      } else if (modalAction === "change_status_ticket") {
        endpoint = `/api/admin/tickets/${selectedTicket.id}/status`;
        body = { status: modalInput };
      } else if (modalAction === "create_announcement") {
        endpoint = `/api/admin/announcements`;
        body = announcementForm;
      } else if (modalAction === "edit_announcement") {
        endpoint = `/api/admin/announcements/${(announcementForm as any).id}`;
        method = "PUT";
        body = announcementForm;
      } else if (modalAction === "create_smart_link") {
        if (!smartLinkForm.destinationUrl?.trim()) {
          alert("Destination URL is required.");
          setModalLoading(false);
          return;
        }
        endpoint = "/api/admin/smart-links";
        body = {
          ...smartLinkForm,
          customAlias: smartLinkForm.autoGenerateAlias
            ? ""
            : smartLinkForm.customAlias,
        };
      } else if (modalAction === "edit_smart_link") {
        if (!smartLinkForm.destinationUrl?.trim()) {
          alert("Destination URL is required.");
          setModalLoading(false);
          return;
        }
        endpoint = `/api/admin/smart-links/${(smartLinkForm as any).id}`;
        method = "PUT";
        body = {
          ...smartLinkForm,
          customAlias: smartLinkForm.autoGenerateAlias
            ? ""
            : smartLinkForm.customAlias,
        };
      } else if (modalAction === "create_task") {
        console.log("Creating task with form:", taskForm);
        endpoint = `/api/admin/tasks`;
        let finalForm = {
          ...taskForm,
          rewardAmount: Number(taskForm.rewardAmount) || 0,
          timerDuration: Number(taskForm.timerDuration) || 0,
          totalPages: Number(taskForm.totalPages) || 0,
        };
        if (taskForm.adNetwork === "Monetag Mini App") {
          (finalForm as any).provider = "monetag_mini";
          (finalForm as any).adType = "rewarded_interstitial";
        }
        body = finalForm;
      } else if (modalAction === "edit_task") {
        console.log("Editing task with form:", taskForm);
        endpoint = `/api/admin/tasks/${(taskForm as any).id}`;
        method = "PUT";
        let finalForm = {
          ...taskForm,
          rewardAmount: Number(taskForm.rewardAmount) || 0,
          timerDuration: Number(taskForm.timerDuration) || 0,
          totalPages: Number(taskForm.totalPages) || 0,
        };
        if (taskForm.adNetwork === "Monetag Mini App") {
          (finalForm as any).provider = "monetag_mini";
          (finalForm as any).adType = "rewarded_interstitial";
        }
        body = finalForm;
      } else if (modalAction === "create_ad") {
        if (!adForm.scriptCode?.trim()) {
          alert("Ad Script/URL cannot be empty.");
          setModalLoading(false);
          return;
        }
        endpoint = `/api/admin/ads`;
        body = adForm;
      } else if (modalAction === "edit_ad") {
        if (!adForm.scriptCode?.trim()) {
          alert("Ad Script/URL cannot be empty.");
          setModalLoading(false);
          return;
        }
        endpoint = `/api/admin/ads/${(adForm as any).id}`;
        method = "PUT";
        body = adForm;
      } else if (
        [
          "add_balance",
          "deduct_balance",
          "add_bonus",
          "add_reward",
          "freeze",
          "unfreeze",
        ].includes(modalAction)
      ) {
        endpoint = `/api/admin/users/${selectedUser.id}/wallet`;
        method = "PUT";
        const parsed = JSON.parse(modalInput || "{}");
        body = {
          amount: parsed.amount,
          reason: parsed.reason,
          action: modalAction,
        };
      } else if (modalAction === "ban_user") {
        endpoint = `/api/admin/users/${selectedUser.id}/status`;
        method = "PUT";
        body = { status: "Banned", reason: modalInput };
      } else if (modalAction === "unban_user") {
        endpoint = `/api/admin/users/${selectedUser.id}/status`;
        method = "PUT";
        body = { status: "Active", reason: null };
      } else if (modalAction === "message_user") {
        endpoint = `/api/admin/users/${selectedUser.id}/message`;
        method = "POST";
        const parsed = JSON.parse(modalInput || "{}");
        body = { type: parsed.type, content: parsed.content };
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {}

      if (!res.ok) throw new Error(data.error || "Action failed");

      setModalAction("none");
      setModalInput("");
      if (modalAction.endsWith("_ticket")) {
        fetchTickets();
      } else if (modalAction.endsWith("_announcement")) {
        fetchAnnouncements();
      } else if (modalAction.endsWith("_smart_link")) {
        fetchSmartLinks();
        alert("Smart Link saved successfully!");
      } else if (modalAction.endsWith("_task")) {
        fetchTasks();
        alert("Task saved successfully!");
      } else if (modalAction.endsWith("_ad")) {
        alert("Ad saved successfully!");
      } else if (
        [
          "add_balance",
          "deduct_balance",
          "ban_user",
          "unban_user",
          "message_user",
        ].includes(modalAction)
      ) {
        fetchUsers();
      } else {
        fetchWithdrawals();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  
  let pendingCount = 0, approvedCount = 0, paidCount = 0, rejectedCount = 0;
  try {
    const withdrawalsArr = Array.isArray(withdrawals) ? withdrawals : [];
    pendingCount = withdrawalsArr.filter((w) => w.status === "Pending").length;
    approvedCount = withdrawalsArr.filter((w) => w.status === "Approved").length;
    paidCount = withdrawalsArr.filter((w) => w.status === "Paid").length;
    rejectedCount = withdrawalsArr.filter((w) => w.status === "Rejected").length;
  } catch (e) {
    console.error("Error calculating withdrawal counts:", e);
  }
  
  
  
  

  return (
    <>
      {analyticsLinkId && (
         <div className="fixed inset-0 z-[100] bg-[#020617] overflow-y-auto">
            <LinkAnalyticsPage linkId={analyticsLinkId} onBack={() => setAnalyticsLinkId(null)} />
         </div>
      )}

      {modalAction === "view_user" && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setModalAction("none");
            setSelectedUser(null);
          }}
          onAction={handleUserAction}
        />
      )}

      {modalAction === "view_withdrawal" && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 relative my-8 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                💸 Withdrawal Details
              </h3>
              <button
                onClick={() => {
                  setModalAction("none");
                  setSelectedWithdrawal(null);
                }}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-full transition cursor-pointer font-bold text-xs"
              >
                ✖
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Request ID</span>
                  <span className="font-mono text-xs text-indigo-400 font-semibold">{selectedWithdrawal.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                    selectedWithdrawal.status === "Pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : selectedWithdrawal.status === "Approved"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : selectedWithdrawal.status === "Paid"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                  }`}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">User</span>
                  <span className="font-medium text-white block">{selectedWithdrawal.firstName} {selectedWithdrawal.lastName}</span>
                  <span className="block text-[10px] text-slate-400">@{selectedWithdrawal.username || "unknown"} (TG: {selectedWithdrawal.userId})</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Submitted Date</span>
                  <span className="text-xs">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Amount and fee details */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                  <span className="text-slate-400 font-medium">Requested Amount</span>
                  <span className="text-lg font-bold text-white">
                    {selectedWithdrawal.method === "USDT" ? `${selectedWithdrawal.amount} USDT` : `₹${selectedWithdrawal.amount}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Processing Fee ({selectedWithdrawal.method === "USDT" ? "Fixed" : "5%"})</span>
                  <span>
                    {selectedWithdrawal.method === "USDT" ? `${selectedWithdrawal.processingFee || 1} USDT` : `₹${selectedWithdrawal.processingFee || (selectedWithdrawal.amount * 0.05).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50 font-semibold text-emerald-400">
                  <span>Estimated Receive</span>
                  <span className="text-base font-bold text-emerald-400">
                    {selectedWithdrawal.method === "USDT" ? `${selectedWithdrawal.receiveAmount || (selectedWithdrawal.amount - 1)} USDT` : `₹${selectedWithdrawal.receiveAmount || (selectedWithdrawal.amount * 0.95).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  💳 Payment Method: <span className="text-indigo-400 font-bold">{selectedWithdrawal.method}</span>
                </h4>

                {selectedWithdrawal.method === "UPI" && (
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-500">UPI ID</span>
                    <span className="font-mono text-sm text-white select-all bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 block">{selectedWithdrawal.upiId || "N/A"}</span>
                  </div>
                )}

                {selectedWithdrawal.method === "Bank" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Account Holder Name</span>
                      <span className="text-sm text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 block">{selectedWithdrawal.accountHolderName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Bank Name</span>
                      <span className="text-xs text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 block">{selectedWithdrawal.bankName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">IFSC Code</span>
                      <span className="font-mono text-xs text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 block select-all">{selectedWithdrawal.ifscCode || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Account Number</span>
                      <span className="font-mono text-sm text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 block select-all">{selectedWithdrawal.accountNumber || "N/A"}</span>
                    </div>
                  </div>
                )}

                {selectedWithdrawal.method === "USDT" && (
                  <div className="space-y-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Wallet Address</span>
                      <span className="font-mono text-xs text-white select-all bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 block break-all">{selectedWithdrawal.walletAddress || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Network</span>
                      <span className="text-xs text-white bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 block">TRC20 (Fixed)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* If marked paid, display reference */}
              {selectedWithdrawal.status === "Paid" && selectedWithdrawal.transactionReference && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-blue-400">Transaction Reference</span>
                  <span className="font-mono text-sm text-white block select-all">{selectedWithdrawal.transactionReference}</span>
                </div>
              )}

              {/* If rejected, display reason */}
              {selectedWithdrawal.status === "Rejected" && selectedWithdrawal.rejectReason && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-red-400">Rejection Reason</span>
                  <span className="text-sm text-white block">{selectedWithdrawal.rejectReason}</span>
                </div>
              )}
            </div>

            {/* Action buttons inside modal */}
            {selectedWithdrawal.status === "Pending" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to approve this withdrawal request?")) {
                      setModalLoading(true);
                      try {
                        const res = await fetch(`${API_BASE}/api/admin/withdrawals/${selectedWithdrawal.id}/approve`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" }
                        });
                        const resData = await res.json();
                        if (res.ok) {
                          alert(resData.message || "Withdrawal approved successfully!");
                          fetchWithdrawals();
                          setModalAction("none");
                          setSelectedWithdrawal(null);
                        } else {
                          alert(resData.error || "Approval failed.");
                        }
                      } catch (err: any) {
                        alert(err.message);
                      } finally {
                        setModalLoading(false);
                      }
                    }
                  }}
                  disabled={modalLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 text-center text-sm"
                >
                  🟢 Approve Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = prompt("Enter rejection reason:");
                    if (reason === null) return; // Cancelled
                    if (!reason.trim()) {
                      alert("Rejection reason is required.");
                      return;
                    }
                    setModalLoading(true);
                    fetch(`${API_BASE}/api/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ rejectReason: reason, rejectionType: "normal" })
                    })
                      .then(async (res) => {
                        const resData = await res.json();
                        if (res.ok) {
                          alert(resData.message || "Withdrawal rejected.");
                          fetchWithdrawals();
                          setModalAction("none");
                          setSelectedWithdrawal(null);
                        } else {
                          alert(resData.error || "Rejection failed.");
                        }
                      })
                      .catch((err) => alert(err.message))
                      .finally(() => setModalLoading(false));
                  }}
                  disabled={modalLoading}
                  className="flex-1 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 text-center text-sm"
                >
                  🔴 Reject Request
                </button>
              </div>
            )}

            {selectedWithdrawal.status === "Approved" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    const reference = prompt("Enter TX reference / Payment Transaction ID:");
                    if (reference === null) return; // Cancelled
                    if (!reference.trim()) {
                      alert("Transaction reference is required to mark as paid.");
                      return;
                    }
                    setModalLoading(true);
                    try {
                      const res = await fetch(`${API_BASE}/api/admin/withdrawals/${selectedWithdrawal.id}/paid`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transactionReference: reference })
                      });
                      const resData = await res.json();
                      if (res.ok) {
                        alert(resData.message || "Withdrawal marked as Paid!");
                        fetchWithdrawals();
                        setModalAction("none");
                        setSelectedWithdrawal(null);
                      } else {
                        alert(resData.error || "Failed to mark as paid.");
                      }
                    } catch (err: any) {
                      alert(err.message);
                    } finally {
                      setModalLoading(false);
                    }
                  }}
                  disabled={modalLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 text-center text-sm"
                >
                  💸 Mark as Paid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = prompt("Enter rejection reason:");
                    if (reason === null) return; // Cancelled
                    if (!reason.trim()) {
                      alert("Rejection reason is required.");
                      return;
                    }
                    setModalLoading(true);
                    fetch(`${API_BASE}/api/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ rejectReason: reason, rejectionType: "normal" })
                    })
                      .then(async (res) => {
                        const resData = await res.json();
                        if (res.ok) {
                          alert(resData.message || "Withdrawal rejected.");
                          fetchWithdrawals();
                          setModalAction("none");
                          setSelectedWithdrawal(null);
                        } else {
                          alert(resData.error || "Rejection failed.");
                        }
                      })
                      .catch((err) => alert(err.message))
                      .finally(() => setModalLoading(false));
                  }}
                  disabled={modalLoading}
                  className="flex-1 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 text-center text-sm"
                >
                  🔴 Reject Request
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalAction("none");
                  setSelectedWithdrawal(null);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {(modalAction === "create_smart_link" || modalAction === "edit_smart_link") && smartLinkForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {modalAction === "create_smart_link" ? "➕ Create Smart URL" : "✏️ Edit Smart URL"}
              </h3>
              <button
                onClick={() => setModalAction("none")}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-full transition cursor-pointer font-bold"
              >
                ✖
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Destination URL *
                </label>
                <input
                  type="url"
                  required
                  value={smartLinkForm.destinationUrl || ""}
                  onChange={(e) => setSmartLinkForm({ ...smartLinkForm, destinationUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="https://example.com/target-page"
                />
              </div>

              {/* Password Protected Link */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 space-y-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password Protected Link
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordProtected"
                      checked={!smartLinkForm.isPasswordProtected}
                      onChange={() => setSmartLinkForm({ ...smartLinkForm, isPasswordProtected: false, password: "" })}
                      className="text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 border-slate-800"
                    />
                    No (Default)
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordProtected"
                      checked={!!smartLinkForm.isPasswordProtected}
                      onChange={() => setSmartLinkForm({ ...smartLinkForm, isPasswordProtected: true })}
                      className="text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 border-slate-800"
                    />
                    Yes
                  </label>
                </div>
                {smartLinkForm.isPasswordProtected && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      type="text"
                      required
                      value={smartLinkForm.password || ""}
                      onChange={(e) => setSmartLinkForm({ ...smartLinkForm, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Enter a secure password"
                    />
                  </div>
                )}
              </div>

              {/* Custom Alias */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 space-y-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Custom Alias
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="customAliasOption"
                      checked={!!smartLinkForm.autoGenerateAlias}
                      onChange={() => setSmartLinkForm({ ...smartLinkForm, autoGenerateAlias: true, customAlias: "" })}
                      className="text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 border-slate-800"
                    />
                    No (Default)
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="customAliasOption"
                      checked={!smartLinkForm.autoGenerateAlias}
                      onChange={() => setSmartLinkForm({ ...smartLinkForm, autoGenerateAlias: false })}
                      className="text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 border-slate-800"
                    />
                    Yes
                  </label>
                </div>
                {!smartLinkForm.autoGenerateAlias && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Alias
                    </label>
                    <input
                      type="text"
                      required
                      value={smartLinkForm.customAlias || smartLinkForm.alias || ""}
                      onChange={(e) => setSmartLinkForm({ ...smartLinkForm, customAlias: e.target.value.trim() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="my-custom-alias"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Only letters, numbers, dash (-) and underscore (_) allowed. Must be unique.
                    </p>
                  </div>
                )}
              </div>

              {/* Total Pages */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Total Pages (1-20)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={smartLinkForm.totalPages || 1}
                    onChange={(e) => setSmartLinkForm({ ...smartLinkForm, totalPages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={smartLinkForm.status || "Enabled"}
                    onChange={(e) => setSmartLinkForm({ ...smartLinkForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Enabled">🟢 Enabled</option>
                    <option value="Disabled">🔴 Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalAction("none")}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={modalLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-900/20 cursor-pointer disabled:opacity-50"
              >
                {modalLoading ? "⏳ Saving..." : "💾 Save Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans pt-20">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
            📊 RoyShare Admin Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              🟢 System Status: Online
            </span>
            <span className="text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              📅 Current Date: {currentTime.toLocaleDateString()}
            </span>
            <span className="text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              🕒 Current Time: {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        >
          🔄 Refresh Dashboard
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center">
          <p className="text-lg font-medium">⚠️ No dashboard data available.</p>
          <p className="text-sm mt-2 opacity-80">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3">
            {[
              "Overview",
              "👥 Users",
              "💸 Withdrawals",
              "🎫 Support",
              "📢 Announcements",
              "💰 Rewards",
              "🎁 Daily Bonus",
              "🔗 Smart URL Shortener",
              "📥 Google Drive Accounts",
              "📉 Analytics",
              "📢 Broadcast",
              "💰 Verified Tasks",
              "🛡 Security Center",
              "📜 Activity Logs",
              "📥 Backup & Restore",
              "🚀 Referral System",
              "⚙️ System Settings",
              "🤖 Telegram Login Settings",
            ].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  setActiveTab(btn);
                  if (btn === "💰 Verified Tasks") fetchVerifiedTasks();
                }}
                className={`px-4 py-2 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-medium transition-colors ${activeTab === btn ? "bg-blue-600 text-white border-blue-500" : "bg-slate-900 text-slate-300"}`}
              >
                {btn}
              </button>
            ))}
          </div>

          {activeTab === "🚀 Referral System" && (
            <div className="p-8 text-center text-slate-500">
              Referral System UI under development.
            </div>
          )}

          {activeTab === "💰 Verified Tasks" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  💰 Verified Task Completions
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search Telegram ID..."
                    value={verifiedTasksSearch}
                    onChange={(e) => setVerifiedTasksSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
                  />
                  <button
                    onClick={fetchVerifiedTasks}
                    disabled={verifiedTasksLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 border border-slate-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Telegram ID</th>
                        <th className="px-4 py-3">Task ID</th>
                        <th className="px-4 py-3">Reward</th>
                        <th className="px-4 py-3">Network</th>
                        <th className="px-4 py-3">Claimed</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">YMID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedTasks
                        .filter(
                          (t) =>
                            t.telegram_id?.includes(verifiedTasksSearch) ||
                            t.userId?.includes(verifiedTasksSearch),
                        )
                        .map((t: any) => (
                          <tr
                            key={t.id}
                            className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-white">
                              {t.telegram_id || t.userId}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {t.taskId}
                            </td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">
                              ₹{t.rewardAmount || 0.56}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {t.adNetwork || "Monetag"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.claimed ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}
                              >
                                {t.claimed ? "YES (Claimed)" : "NO (Verified)"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {new Date(
                                t.created_at || t.completedAt,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-slate-600">
                              {t.ymid}
                            </td>
                          </tr>
                        ))}
                      {verifiedTasks.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-slate-500"
                          >
                            No verified tasks found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Overview Cards */}
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">⚡</span> Overview Cards
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <StatCard
                      title="👥 Total Users"
                      value={data.overview.totalUsers}
                    />
                    <StatCard
                      title="📤 Total Uploads"
                      value={data.overview.totalUploads}
                    />
                    <StatCard
                      title="🔗 Total Short Links"
                      value={data.overview.totalLinks}
                    />
                    <StatCard
                      title="💰 Total User Earnings"
                      value={`$${data.overview.totalEarnings}`}
                    />
                    <StatCard
                      title="💸 Total Withdrawals"
                      value={data.overview.totalWithdrawals}
                    />
                    <StatCard
                      title="🎁 Total Bonus Claims"
                      value={data.overview.totalBonusClaims}
                    />
                    <StatCard
                      title="💰 Total Reward Claims"
                      value={data.overview.totalRewardClaims}
                    />
                    <StatCard
                      title="👥 Total Referrals"
                      value={data.overview.totalReferrals}
                    />
                    <StatCard
                      title="🎫 Open Support Tickets"
                      value={data.overview.openTickets}
                      highlight={data.overview.openTickets > 0}
                    />
                    <StatCard
                      title="📢 Total Announcements"
                      value={data.overview.totalAnnouncements}
                    />
                  </div>
                </section>

                {/* Quick Statistics */}
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-emerald-400">📅</span> Today
                    Statistics
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard
                      title="👤 New Users Today"
                      value={data.today.newUsersToday}
                      bg="bg-emerald-900/20"
                      border="border-emerald-500/20"
                    />
                    <StatCard
                      title="📤 Uploads Today"
                      value={data.today.uploadsToday}
                      bg="bg-emerald-900/20"
                      border="border-emerald-500/20"
                    />
                    <StatCard
                      title="🔗 Links Created Today"
                      value={data.today.linksToday}
                      bg="bg-emerald-900/20"
                      border="border-emerald-500/20"
                    />
                    <StatCard
                      title="💰 Rewards Claimed Today"
                      value={data.today.rewardsClaimedToday}
                      bg="bg-emerald-900/20"
                      border="border-emerald-500/20"
                    />
                    <StatCard
                      title="🎁 Bonus Claims Today"
                      value={data.today.bonusClaimsToday}
                      bg="bg-emerald-900/20"
                      border="border-emerald-500/20"
                    />
                    <StatCard
                      title="💸 Withdraw Requests Today"
                      value={data.today.withdrawalsToday}
                      bg="bg-emerald-900/20"
                      border="border-emerald-500/20"
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                {/* Latest Activities */}
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-purple-400">🔔</span> Latest
                    Activities
                  </h2>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    {data.activities.length > 0 ? (
                      <div className="space-y-4">
                        {data.activities.map((act: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 border-b border-slate-800/50 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="text-xl">
                              {act.type === "system" ? "⚙️" : "👤"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200">
                                {act.text}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(act.time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="text-xs text-slate-500 pt-2 text-center italic">
                          More activities hidden
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </section>

                {/* System Health */}
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-400">❤️‍🩹</span> System Health
                    Section
                  </h2>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <HealthItem
                      name="🟢 Firestore Status"
                      status={data.health.firestore}
                    />
                    <HealthItem
                      name="🟢 Telegram Bot Status"
                      status={data.health.telegram}
                    />
                    <HealthItem
                      name="🟢 Web Server Status"
                      status={data.health.web}
                    />
                    <HealthItem
                      name="🟢 Reward System Status"
                      status={data.health.rewards}
                    />
                    <HealthItem
                      name="🟢 Bonus System Status"
                      status={data.health.bonus}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === "💸 Withdrawals" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  💸 Withdrawal Manager
                </h2>
                <button
                  onClick={fetchWithdrawals}
                  disabled={withdrawalsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 border border-slate-700"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                    🟡 Pending
                  </h3>
                  <p className="text-2xl font-bold text-yellow-400">
                    {pendingCount}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                    🟢 Approved
                  </h3>
                  <p className="text-2xl font-bold text-emerald-400">
                    {approvedCount}
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                    💸 Paid
                  </h3>
                  <p className="text-2xl font-bold text-blue-400">
                    {paidCount}
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                    🔴 Rejected
                  </h3>
                  <p className="text-2xl font-bold text-red-400">
                    {rejectedCount}
                  </p>
                </div>
              </div>

              {withdrawalsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : withdrawalsError ? (
                <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">
                  {withdrawalsError}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
                  No withdrawal requests found.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((w: any) => (
                          <tr
                            key={w.id}
                            className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs">
                              {w.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">
                                {w.firstName} {w.lastName}
                              </div>
                              <div className="text-xs text-slate-400">
                                @{w.username || "unknown"} | TG: {w.userId}
                              </div>
                              {w.mobile && (
                                <div className="text-xs text-slate-500">
                                  📞 {w.mobile}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-400">
                              ${w.amount}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {w.method}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  w.status === "Pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : w.status === "Approved"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : w.status === "Paid"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {w.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {new Date(w.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(w);
                                  setModalAction("view_withdrawal");
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                👁 View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "🎫 Support" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🎫 Support Manager
                </h2>
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search ID, Ticket ID, User..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full md:w-64"
                  />
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full md:w-auto"
                  >
                    <option value="all">🌐 All Statuses</option>
                    <option value="open">🟡 Open</option>
                    <option value="in_progress">🔵 Pending</option>
                    <option value="replied">💬 Replied</option>
                    <option value="resolved">🟢 Resolved</option>
                    <option value="closed">🔴 Closed</option>
                  </select>
                  <button
                    onClick={fetchTickets}
                    disabled={ticketsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 border border-slate-700 shrink-0 w-full md:w-auto justify-center"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                    🟡 Open
                  </h3>
                  <p className="text-2xl font-bold text-yellow-400">
                    {tickets.filter((t) => t.status === "open").length}
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                    🔵 Pending
                  </h3>
                  <p className="text-2xl font-bold text-blue-400">
                    {
                      tickets.filter(
                        (t) =>
                          t.status === "in_progress" || t.status === "pending",
                      ).length
                    }
                  </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-purple-500/80 uppercase tracking-wider mb-1">
                    💬 Replied
                  </h3>
                  <p className="text-2xl font-bold text-purple-400">
                    {tickets.filter((t) => t.status === "replied").length}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                    🟢 Resolved
                  </h3>
                  <p className="text-2xl font-bold text-emerald-400">
                    {tickets.filter((t) => t.status === "resolved").length}
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                    🔴 Closed
                  </h3>
                  <p className="text-2xl font-bold text-red-400">
                    {tickets.filter((t) => t.status === "closed").length}
                  </p>
                </div>
              </div>

              {ticketsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : ticketsError ? (
                <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">
                  {ticketsError}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
                  No support tickets found.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Ticket ID</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets
                          .filter((t) => {
                            const matchesSearch =
                              ticketSearch === "" ||
                              t.id
                                .toLowerCase()
                                .includes(ticketSearch.toLowerCase()) ||
                              (t.ticketId || "")
                                .toLowerCase()
                                .includes(ticketSearch.toLowerCase()) ||
                              String(t.userId).includes(ticketSearch) ||
                              (t.username || "")
                                .toLowerCase()
                                .includes(ticketSearch.toLowerCase());

                            const matchesStatus =
                              ticketStatusFilter === "all" ||
                              t.status === ticketStatusFilter;

                            return matchesSearch && matchesStatus;
                          })
                          .map((t: any) => (
                            <tr
                              key={t.id}
                              className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                            >
                              <td className="px-4 py-3 font-mono text-xs text-indigo-400 font-bold">
                                {t.ticketId ||
                                  t.id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-white">
                                  {t.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  @{t.username || "unknown"}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {t.category || t.issueType}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    t.priority === "High"
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                      : t.priority === "Medium"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-slate-500/10 text-slate-400"
                                  }`}
                                >
                                  {t.priority || "Medium"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    t.status === "open"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : t.status === "in_progress"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : t.status === "replied"
                                          ? "bg-purple-500/20 text-purple-400"
                                          : t.status === "resolved"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {t.status === "open"
                                    ? "🟡 Open"
                                    : t.status === "in_progress"
                                      ? "🔵 In Progress"
                                      : t.status === "replied"
                                        ? "💬 Replied"
                                        : t.status === "resolved"
                                          ? "🟢 Resolved"
                                          : "🔴 Closed"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedTicket(t);
                                    setModalAction("view_ticket");
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium rounded-lg transition-colors border border-indigo-500/20"
                                >
                                  👁 View
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this ticket?",
                                      )
                                    ) {
                                      setSelectedTicket(t);
                                      setModalAction("delete_ticket");
                                      // Trigger immediate submit
                                      setTimeout(() => {
                                        const btn = document.querySelector(
                                          "#submit-modal-btn",
                                        ) as HTMLButtonElement;
                                        if (btn) btn.click();
                                      }, 100);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-medium rounded-lg transition-colors border border-rose-500/20"
                                >
                                  🗑 Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "📢 Announcements" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📢 Announcement Manager
                </h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => {
                      setAnnouncementForm({
                        title: "",
                        message: "",
                        imageUrl: "",
                        videoUrl: "",
                        buttonText: "",
                        buttonLink: "",
                        type: "📢 Update",
                        priority: "🟢 Normal",
                        status: "Published",
                        scheduledAt: "",
                      });
                      setModalAction("create_announcement");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
                  >
                    ➕ Create Announcement
                  </button>
                  <button
                    onClick={fetchAnnouncements}
                    disabled={announcementsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 border border-slate-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    📢 Total
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {announcements.length}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                    🟢 Published
                  </h3>
                  <p className="text-2xl font-bold text-emerald-400">
                    {
                      announcements.filter((a) => a.status === "Published")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                    🟡 Scheduled
                  </h3>
                  <p className="text-2xl font-bold text-yellow-400">
                    {
                      announcements.filter((a) => a.status === "Scheduled")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                    🔴 Drafts
                  </h3>
                  <p className="text-2xl font-bold text-red-400">
                    {announcements.filter((a) => a.status === "Draft").length}
                  </p>
                </div>
              </div>

              {announcementsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : announcementsError ? (
                <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">
                  {announcementsError}
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
                  No announcements found.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Views</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.map((a: any) => (
                          <tr
                            key={a.id}
                            className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs">
                              {a.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 font-medium text-white">
                              {a.title}
                            </td>
                            <td className="px-4 py-3">{a.type}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  a.status === "Published"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : a.status === "Scheduled"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-slate-500/20 text-slate-400"
                                }`}
                              >
                                {a.status === "Published"
                                  ? "🟢 Published"
                                  : a.status === "Scheduled"
                                    ? "🟡 Scheduled"
                                    : "🔴 Draft"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-blue-400">
                              {a.viewCount || 0}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setAnnouncementForm(a);
                                    setModalAction("view_announcement");
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                                  title="View/Edit"
                                >
                                  👁
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this announcement?",
                                      )
                                    ) {
                                      // inline delete for simplicity since it's just one request
                                      fetch(
                                        `${API_BASE}/api/admin/announcements/${a.id}`,
                                        { method: "DELETE" },
                                      ).then(() => fetchAnnouncements());
                                    }
                                  }}
                                  className="p-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "💰 Rewards" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  💰 Reward Task Manager
                </h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => {
                      setTaskForm({
                        title: "",
                        description: "",
                        rewardAmount: "",
                        timerDuration: "",
                        totalPages: "",
                        imageUrl: "",
                        status: "🟢 Active",
                        adNetwork: "",
                        selectedAdIds: [],
                      });
                      setModalAction("create_task");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
                  >
                    ➕ Create Task
                  </button>
                  <button
                    onClick={() => setTaskView("tasks")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${taskView === "tasks" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📋 View Tasks
                  </button>
                  <button
                    onClick={() => {
                      setTaskView("stats");
                      fetchTaskLogs();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${taskView === "stats" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 Task Statistics
                  </button>
                  <button
                    onClick={() => {
                      if (taskView === "tasks") fetchTasks();
                      else fetchTaskLogs();
                    }}
                    disabled={tasksLoading || taskLogsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 border border-slate-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {taskView === "tasks" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        📋 Total Tasks
                      </h3>
                      <p className="text-2xl font-bold text-white">
                        {tasks.length}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                        🟢 Active Tasks
                      </h3>
                      <p className="text-2xl font-bold text-emerald-400">
                        {tasks.filter((t) => t.status === "🟢 Active").length}
                      </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                        🔴 Disabled Tasks
                      </h3>
                      <p className="text-2xl font-bold text-red-400">
                        {tasks.filter((t) => t.status === "🔴 Disabled").length}
                      </p>
                    </div>
                  </div>

                  {tasksLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : tasksError ? (
                    <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">
                      {tasksError}
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
                      No tasks found.
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Task ID</th>
                              <th className="px-4 py-3">📝 Task Name</th>
                              <th className="px-4 py-3">💰 Reward</th>
                              <th className="px-4 py-3">📄 Pages</th>
                              <th className="px-4 py-3">📌 Status</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((t: any) => (
                              <tr
                                key={t.id}
                                className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                              >
                                <td className="px-4 py-3 font-mono text-xs">
                                  {t.id.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-3 font-medium text-white">
                                  {t.title}
                                </td>
                                <td className="px-4 py-3 font-medium text-yellow-400">
                                  ₹{t.rewardAmount}
                                </td>
                                <td className="px-4 py-3">{t.totalPages}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-bold ${
                                      t.status === "🟢 Active"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setTaskForm({
                                          ...t,
                                          adNetwork: t.adNetwork || "",
                                          selectedAdIds: t.selectedAdIds || [],
                                        });
                                        setModalAction("view_task");
                                      }}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                                      title="View"
                                    >
                                      👁
                                    </button>
                                    <button
                                      onClick={() => {
                                        setTaskForm({
                                          ...t,
                                          adNetwork: t.adNetwork || "",
                                          selectedAdIds: t.selectedAdIds || [],
                                        });
                                        setModalAction("edit_task");
                                      }}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newStatus =
                                          t.status === "🟢 Active"
                                            ? "🔴 Disabled"
                                            : "🟢 Active";
                                        fetch(
                                          `${API_BASE}/api/admin/tasks/${t.id}`,
                                          {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              status: newStatus,
                                            }),
                                          },
                                        ).then(() => fetchTasks());
                                      }}
                                      className={`p-1.5 rounded-lg transition-colors ${t.status === "🟢 Active" ? "bg-red-900/30 hover:bg-red-900/50 text-red-400" : "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400"}`}
                                      title={
                                        t.status === "🟢 Active"
                                          ? "Disable"
                                          : "Enable"
                                      }
                                    >
                                      {t.status === "🟢 Active" ? "🔴" : "🟢"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            "Are you sure you want to delete this task?",
                                          )
                                        ) {
                                          fetch(
                                            `${API_BASE}/api/admin/tasks/${t.id}`,
                                            { method: "DELETE" },
                                          ).then(() => fetchTasks());
                                        }
                                      }}
                                      className="p-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                                      title="Delete"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {taskView === "stats" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        👥 Total Participants
                      </h3>
                      <p className="text-2xl font-bold text-white">
                        {taskLogs.length}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                        ✅ Completed
                      </h3>
                      <p className="text-2xl font-bold text-emerald-400">
                        {
                          taskLogs.filter((l) => l.status === "completed")
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                        ❌ Failed
                      </h3>
                      <p className="text-2xl font-bold text-red-400">
                        {taskLogs.filter((l) => l.status === "failed").length}
                      </p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                        💰 Rewards Distributed
                      </h3>
                      <p className="text-2xl font-bold text-yellow-400">
                        ₹
                        {taskLogs
                          .filter((l) => l.status === "completed")
                          .reduce(
                            (sum, l) => sum + (Number(l.rewardEarned) || 0),
                            0,
                          )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                      <h3 className="font-bold text-white">
                        Task Completion Logs
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-3">📅 Date</th>
                            <th className="px-4 py-3">👤 User</th>
                            <th className="px-4 py-3">📋 Task</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">💰 Earned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskLogsLoading ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8">
                                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              </td>
                            </tr>
                          ) : taskLogs.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="text-center py-8 text-slate-500"
                              >
                                No logs found
                              </td>
                            </tr>
                          ) : (
                            taskLogs.map((log: any) => (
                              <tr
                                key={log.id}
                                className="border-b border-slate-800/50"
                              >
                                <td className="px-4 py-3 text-xs text-slate-400">
                                  {new Date(
                                    log.completedAt || log.createdAt,
                                  ).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-white">
                                    {log.userName || "Unknown"}
                                  </p>
                                  <p className="text-xs font-mono text-slate-500">
                                    {log.userId?.substring(0, 8)}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-white">
                                  {log.taskName || log.taskId}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-bold ${
                                      log.status === "completed"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {log.status === "completed"
                                      ? "✅ Completed"
                                      : "❌ Failed"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-yellow-400">
                                  {log.status === "completed"
                                    ? `₹${log.rewardEarned}`
                                    : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "🎁 Daily Bonus" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🎁 Daily Bonus Manager
                </h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => setBonusView("settings")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${bonusView === "settings" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => setBonusView("wheel-rewards")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${bonusView === "wheel-rewards" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🎡 Wheel
                  </button>
                  <button
                    onClick={() => setBonusView("box-rewards")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${bonusView === "box-rewards" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📦 Box
                  </button>
                  <button
                    onClick={() => setBonusView("scratch-rewards")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${bonusView === "scratch-rewards" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🎫 Scratch
                  </button>
                  <button
                    onClick={() => setBonusView("stats")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${bonusView === "stats" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 Stats
                  </button>
                  <button
                    onClick={() => setBonusView("history")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${bonusView === "history" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📜 History
                  </button>
                  <button
                    onClick={() => {
                      if (bonusView === "history") fetchBonusHistory();
                      else if (bonusView === "stats") fetchDailyBonusStats();
                      else fetchBonusSettings();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {bonusSettingsLoading &&
              bonusView !== "history" &&
              bonusView !== "stats" ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : bonusView === "settings" && bonusSettings ? (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4">
                      ⚙️ General Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div>
                          <p className="font-bold text-white">
                            Daily Bonus System
                          </p>
                          <p className="text-sm text-slate-400">
                            Enable or disable the entire daily bonus feature
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            saveBonusSettings({
                              ...bonusSettings,
                              dailyBonusEnabled:
                                !bonusSettings.dailyBonusEnabled,
                            })
                          }
                          className={`px-4 py-2 font-bold rounded-xl transition-all ${bonusSettings.dailyBonusEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                        >
                          {bonusSettings.dailyBonusEnabled
                            ? "🟢 Enabled"
                            : "🔴 Disabled"}
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          🕒 Global Reset Time (UTC)
                        </label>
                        <input
                          type="time"
                          value={bonusSettings.resetTime || "00:00"}
                          onChange={(e) =>
                            setBonusSettings({
                              ...bonusSettings,
                              resetTime: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["wheel", "box", "scratch"].map((type) => (
                      <div
                        key={type}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                      >
                        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                          <h4 className="font-bold text-white capitalize">
                            {type} Module
                          </h4>
                          <button
                            onClick={() =>
                              setBonusSettings({
                                ...bonusSettings,
                                [type]: {
                                  ...(bonusSettings[type] || {}),
                                  enabled: !bonusSettings[type]?.enabled,
                                },
                              })
                            }
                            className={`w-10 h-5 rounded-full relative transition-colors ${bonusSettings[type]?.enabled ? "bg-indigo-600" : "bg-slate-700"}`}
                          >
                            <div
                              className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${bonusSettings[type]?.enabled ? "left-6" : "left-1"}`}
                            />
                          </button>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                              Daily Limit
                            </label>
                            <input
                              type="number"
                              value={bonusSettings[type]?.dailyLimit ?? 0}
                              onChange={(e) =>
                                setBonusSettings({
                                  ...bonusSettings,
                                  [type]: {
                                    ...bonusSettings[type],
                                    dailyLimit: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                              Cooldown (Min)
                            </label>
                            <input
                              type="number"
                              value={bonusSettings[type]?.cooldown ?? 0}
                              onChange={(e) =>
                                setBonusSettings({
                                  ...bonusSettings,
                                  [type]: {
                                    ...bonusSettings[type],
                                    cooldown: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-bold text-slate-400">
                              Require Ad
                            </span>
                            <button
                              onClick={() =>
                                setBonusSettings({
                                  ...bonusSettings,
                                  [type]: {
                                    ...bonusSettings[type],
                                    adRequired:
                                      !bonusSettings[type]?.adRequired,
                                  },
                                })
                              }
                              className={`text-[10px] px-2 py-1 rounded font-black ${bonusSettings[type]?.adRequired ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"}`}
                            >
                              {bonusSettings[type]?.adRequired ? "YES" : "NO"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => saveBonusSettings(bonusSettings)}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-900/20"
                  >
                    💾 Save All Module Settings
                  </button>
                </div>
              ) : (bonusView === "wheel-rewards" ||
                  bonusView === "box-rewards" ||
                  bonusView === "scratch-rewards") &&
                bonusSettings ? (
                <div className="space-y-6">
                  {/* AI Reward Generator Input Panel */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">
                          🤖 {bonusView.split("-")[0]} AI Reward Generator
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Use Gemini AI to instantly generate a balanced,
                          profitable reward pool.
                        </p>
                      </div>
                      <span className="bg-indigo-600/15 text-indigo-400 font-bold text-xs px-3 py-1.5 rounded-full border border-indigo-500/10">
                        Gemini Powered
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                          Minimum Reward (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={aiGenSettings.minReward}
                          onChange={(e) =>
                            setAiGenSettings({
                              ...aiGenSettings,
                              minReward: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                          Maximum Reward (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={aiGenSettings.maxReward}
                          onChange={(e) =>
                            setAiGenSettings({
                              ...aiGenSettings,
                              maxReward: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                          Slots count (5-30)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={aiGenSettings.slots}
                          onChange={(e) =>
                            setAiGenSettings({
                              ...aiGenSettings,
                              slots: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                          Better Luck Slots
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={aiGenSettings.betterLuckSlots}
                          onChange={(e) =>
                            setAiGenSettings({
                              ...aiGenSettings,
                              betterLuckSlots: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                          Daily Budget (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={aiGenSettings.dailyBudget}
                          onChange={(e) =>
                            setAiGenSettings({
                              ...aiGenSettings,
                              dailyBudget: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleAIGenerateRewards(bonusView.split("-")[0])
                      }
                      disabled={generatingAI}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2"
                    >
                      {generatingAI ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Gemini is Crafting Rewards...</span>
                        </>
                      ) : (
                        <>
                          <span>🤖 Generate Rewards with Gemini AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preview Generated Rewards */}
                  {aiPreviewRewards ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-fade-in">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-md font-bold text-emerald-400">
                            👀 Generated Rewards Preview
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Please review the probability and weight balance
                            generated by AI.
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          Preview Mode
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Slot No</th>
                              <th className="px-4 py-3">Label</th>
                              <th className="px-4 py-3">Amount (₹)</th>
                              <th className="px-4 py-3">Weight</th>
                              <th className="px-4 py-3 text-right">
                                Probability
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const totalWeight = aiPreviewRewards.reduce(
                                (sum, r) => sum + (Number(r.weight) || 0),
                                0,
                              );
                              return aiPreviewRewards.map((reward, idx) => {
                                const prob =
                                  totalWeight > 0
                                    ? (
                                        ((Number(reward.weight) || 0) /
                                          totalWeight) *
                                        100
                                      ).toFixed(1)
                                    : "0.0";
                                return (
                                  <tr
                                    key={idx}
                                    className="border-b border-slate-800/40 bg-slate-950/10 hover:bg-slate-950/30"
                                  >
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                      #{idx + 1}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-white">
                                      {reward.label}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-emerald-400">
                                      ₹{Number(reward.amount).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                      {reward.weight}
                                    </td>
                                    <td className="px-4 py-3 text-right text-indigo-400 font-bold">
                                      {prob}%
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          onClick={() => setAiPreviewRewards(null)}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all uppercase"
                        >
                          ❌ Cancel Preview
                        </button>
                        <button
                          onClick={async () => {
                            const type = bonusView.split("-")[0];
                            const updatedSettings = {
                              ...bonusSettings,
                              dailyBudget: aiGenSettings.dailyBudget, // Save the daily budget parameter to main setting!
                              [type]: {
                                ...bonusSettings[type],
                                rewards: aiPreviewRewards,
                              },
                            };
                            await saveBonusSettings(updatedSettings);
                            setAiPreviewRewards(null);
                          }}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-950/30 uppercase flex items-center gap-2"
                        >
                          <span>
                            💾 Save and Apply to{" "}
                            {bonusView.split("-")[0].toUpperCase()}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Active Config Pool fallback */
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-md font-bold text-white mb-4">
                        📋 Currently Configured Reward Pool
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Slot</th>
                              <th className="px-4 py-3">Label</th>
                              <th className="px-4 py-3">Amount (₹)</th>
                              <th className="px-4 py-3">Weight</th>
                              <th className="px-4 py-3 text-right">
                                Probability
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const type = bonusView.split("-")[0];
                              const activeRewards =
                                bonusSettings[type]?.rewards || [];
                              if (activeRewards.length === 0) {
                                return (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-4 py-8 text-center text-slate-500"
                                    >
                                      No rewards configured. Use the AI
                                      generator above to build the pool!
                                    </td>
                                  </tr>
                                );
                              }
                              const totalWeight = activeRewards.reduce(
                                (sum: number, r: any) =>
                                  sum + (Number(r.weight) || 0),
                                0,
                              );
                              return activeRewards.map(
                                (reward: any, idx: number) => {
                                  const prob =
                                    totalWeight > 0
                                      ? (
                                          ((Number(reward.weight) || 0) /
                                            totalWeight) *
                                          100
                                        ).toFixed(1)
                                      : "0.0";
                                  return (
                                    <tr
                                      key={idx}
                                      className="border-b border-slate-800/40 bg-slate-950/10"
                                    >
                                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                        #{idx + 1}
                                      </td>
                                      <td className="px-4 py-3 text-slate-300">
                                        {reward.label}
                                      </td>
                                      <td className="px-4 py-3 font-bold text-emerald-400">
                                        ₹{Number(reward.amount).toFixed(2)}
                                      </td>
                                      <td className="px-4 py-3 text-slate-400">
                                        {reward.weight}
                                      </td>
                                      <td className="px-4 py-3 text-right text-indigo-400 font-semibold">
                                        {prob}%
                                      </td>
                                    </tr>
                                  );
                                },
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : bonusView === "stats" ? (
                <div className="space-y-6">
                  {/* Global Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        🎡 Global Total Spins
                      </h3>
                      <p className="text-2xl font-bold text-white">
                        {dailyBonusStats?.global?.totalSpins || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                        💰 Global Rewards
                      </h3>
                      <p className="text-2xl font-bold text-yellow-400">
                        ₹
                        {Number(
                          dailyBonusStats?.global?.totalRewardsDistributed || 0,
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-indigo-500/80 uppercase tracking-wider mb-1">
                        ✅ Global Claims
                      </h3>
                      <p className="text-2xl font-bold text-indigo-400">
                        {dailyBonusStats?.global?.totalClaims || 0}
                      </p>
                    </div>
                  </div>

                  {/* Today Stats */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-black text-white">
                          Today's Activity 📅
                        </h3>
                        <p className="text-xs text-slate-500">
                          Real-time stats for {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                        Live Sync
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                          Unique Users
                        </span>
                        <span className="text-2xl font-black text-white">
                          {dailyBonusStats?.today?.uniqueUsers || 0}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                          Total Claims
                        </span>
                        <span className="text-2xl font-black text-white">
                          {dailyBonusStats?.today?.totalClaims || 0}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                          Rewards Won
                        </span>
                        <span className="text-2xl font-black text-emerald-400">
                          ₹
                          {Number(
                            dailyBonusStats?.today?.totalRewards || 0,
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                          Avg Reward
                        </span>
                        <span className="text-2xl font-black text-indigo-400">
                          ₹
                          {Number(
                            dailyBonusStats?.today?.averageReward || 0,
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Top Winners */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                          🏆 Top Winners (All Time)
                        </h4>
                        <div className="space-y-3">
                          {(dailyBonusStats?.topWinners || []).map(
                            (winner: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? "bg-yellow-500/20 text-yellow-500" : "bg-slate-800 text-slate-500"}`}
                                  >
                                    {i + 1}
                                  </div>
                                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                                    {winner.userName || "Anonymous"}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-emerald-400">
                                  ₹{Number(winner.amount).toFixed(2)}
                                </span>
                              </div>
                            ),
                          )}
                          {(dailyBonusStats?.topWinners || []).length === 0 && (
                            <p className="text-[10px] text-slate-600 italic">
                              No big wins yet
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Module Stats */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                          📦 Module Performance (Today)
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                              🎡 Wheel Spins
                            </span>
                            <span className="text-xs font-black text-white">
                              {dailyBonusStats?.today?.wheelSpins || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                              📦 Box Opens
                            </span>
                            <span className="text-xs font-black text-white">
                              {dailyBonusStats?.today?.boxOpens || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                              🎫 Scratch Cards
                            </span>
                            <span className="text-xs font-black text-white">
                              {dailyBonusStats?.today?.scratchClaims || 0}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-medium text-amber-500 flex items-center gap-2">
                              💀 Better Luck Hits
                            </span>
                            <span className="text-xs font-black text-amber-500">
                              {dailyBonusStats?.today?.betterLuckCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {dailyBonusStatsLoading && (
                    <div className="text-center py-4">
                      <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">
                        Refreshing Live Data...
                      </p>
                    </div>
                  )}
                </div>
              ) : bonusView === "history" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-wrap gap-4 items-center justify-between">
                    <h3 className="font-bold text-white">📜 Claim History</h3>
                    <input
                      type="text"
                      placeholder="Search User ID or Name..."
                      value={bonusSearch}
                      onChange={(e) => setBonusSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">📅 Date & Time</th>
                          <th className="px-4 py-3">🎮 Type</th>
                          <th className="px-4 py-3">👤 User</th>
                          <th className="px-4 py-3">🆔 User ID</th>
                          <th className="px-4 py-3">💰 Reward Won</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bonusHistoryLoading ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8">
                              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </td>
                          </tr>
                        ) : bonusHistory.filter(
                            (h) =>
                              !bonusSearch ||
                              h.userId?.includes(bonusSearch) ||
                              h.userName
                                ?.toLowerCase()
                                .includes(bonusSearch.toLowerCase()),
                          ).length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 text-slate-500"
                            >
                              No history found
                            </td>
                          </tr>
                        ) : (
                          bonusHistory
                            .filter(
                              (h) =>
                                !bonusSearch ||
                                h.userId?.includes(bonusSearch) ||
                                h.userName
                                  ?.toLowerCase()
                                  .includes(bonusSearch.toLowerCase()),
                            )
                            .map((h: any) => (
                              <tr
                                key={h.id}
                                className="border-b border-slate-800/50"
                              >
                                <td className="px-4 py-3 text-xs text-slate-400">
                                  {new Date(h.date).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                      h.type === "wheel"
                                        ? "bg-indigo-500/20 text-indigo-400"
                                        : h.type === "box"
                                          ? "bg-purple-500/20 text-purple-400"
                                          : "bg-amber-500/20 text-amber-400"
                                    }`}
                                  >
                                    {h.type || "wheel"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-white">
                                  {h.userName || "Unknown"}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                  {h.userId}
                                </td>
                                <td className="px-4 py-3 font-bold text-yellow-400">
                                  ₹{h.amount}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {activeTab === "👥 Users" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="text-indigo-400" size={28} />
                  User Manager
                </h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => {
                      setUserView("all");
                      setSelectedUserIds([]);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${userView === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📋 All Users
                  </button>
                  <button
                    onClick={() => {
                      setUserView("banned");
                      setSelectedUserIds([]);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${userView === "banned" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🚫 Banned Users
                  </button>
                  <button
                    onClick={() => setUserView("stats")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${userView === "stats" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 User Statistics
                  </button>
                  <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-20">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : userView === "stats" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Total Users
                      </h3>
                      <Users size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-3xl font-black text-white">
                      {users.length}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest">
                        Active
                      </h3>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    <p className="text-3xl font-black text-emerald-400">
                      {users.filter((u) => u.status !== "Banned").length}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-red-500/80 uppercase tracking-widest">
                        Banned
                      </h3>
                      <ShieldAlert size={16} className="text-red-400" />
                    </div>
                    <p className="text-3xl font-black text-red-400">
                      {users.filter((u) => u.status === "Banned").length}
                    </p>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-indigo-500/80 uppercase tracking-widest">
                        Total Balance
                      </h3>
                      <Zap size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-3xl font-black text-indigo-400">
                      ₹
                      {users
                        .reduce(
                          (acc, u) => acc + Number(u.availableBalance || 0),
                          0,
                        )
                        .toFixed(0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-6">
                  <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="font-black text-white flex items-center gap-2">
                        {userView === "banned"
                          ? "🚫 Banned Users"
                          : "📋 All Users"}
                        <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded-full text-slate-400">
                          {
                            users.filter((u) =>
                              userView === "banned"
                                ? u.status === "Banned"
                                : true,
                            ).length
                          }
                        </span>
                      </h3>
                      <div className="relative group">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search by ID, Username, Phone, Name..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="bg-slate-950/50 border border-slate-800 focus:border-indigo-500/50 rounded-2xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none w-full md:w-96 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <AnimatePresence>
                        {selectedUserIds.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-3 py-1.5"
                          >
                            <span className="text-xs font-black text-indigo-400">
                              {selectedUserIds.length} Selected
                            </span>
                            <div className="h-4 w-px bg-slate-700 mx-1"></div>
                            <button
                              onClick={() => handleBulkUserAction("delete")}
                              className="text-[10px] font-black text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Delete
                            </button>
                            <button
                              onClick={() => handleBulkUserAction("reset")}
                              className="text-[10px] font-black text-yellow-400 hover:text-yellow-300 px-2 py-1 bg-yellow-500/10 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RotateCcw size={10} /> Reset
                            </button>
                            <button
                              onClick={() => setSelectedUserIds([])}
                              className="p-1 text-slate-500 hover:text-white transition-colors"
                            >
                              <EyeOff size={14} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        onClick={handleExportUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-900/40"
                      >
                        <Download size={14} />
                        EXPORT CSV
                      </button>
                      <button
                        onClick={handleDeleteAllUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-red-900/40"
                      >
                        <Trash2 size={14} />
                        DELETE ALL
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-300 border-collapse">
                      <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-950/20 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                checked={
                                  selectedUserIds.length > 0 &&
                                  selectedUserIds.length === users.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked)
                                    setSelectedUserIds(users.map((u) => u.id));
                                  else setSelectedUserIds([]);
                                }}
                              />
                            </div>
                          </th>
                          <th className="px-6 py-4 tracking-widest">
                            👤 Identity
                          </th>
                          <th className="px-6 py-4 tracking-widest">
                            📱 Mobile & Registration
                          </th>
                          <th className="px-6 py-4 tracking-widest">
                            💰 Wealth & Earnings
                          </th>
                          <th className="px-6 py-4 tracking-widest">
                            🛡️ Verification & Status
                          </th>
                          <th className="px-6 py-4 text-right tracking-widest">
                            Command
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {(() => {
                          const filtered = users
                            .filter((u) =>
                              userView === "banned"
                                ? u.status === "Banned"
                                : true,
                            )
                            .filter((u) => {
                              const s = userSearch.toLowerCase();
                              return (
                                !userSearch ||
                                String(u.id || "").includes(s) ||
                                String(u.telegramId || "").includes(s) ||
                                String(u.username || "")
                                  .toLowerCase()
                                  .includes(s) ||
                                String(u.phone || "").includes(s) ||
                                String(u.firstName || "")
                                  .toLowerCase()
                                  .includes(s) ||
                                String(u.lastName || "")
                                  .toLowerCase()
                                  .includes(s) ||
                                String(u.name || "")
                                  .toLowerCase()
                                  .includes(s)
                              );
                            });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="text-center py-20">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-2">
                                      <Users size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold">
                                      No Users Found
                                    </p>
                                    <p className="text-xs text-slate-600">
                                      Try adjusting your search or filters
                                    </p>
                                    <button
                                      onClick={() => {
                                        setUserSearch("");
                                        setUserView("all");
                                      }}
                                      className="text-xs font-bold text-indigo-400 hover:underline mt-2"
                                    >
                                      Clear all filters
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((u: any) => (
                            <tr
                              key={u.id}
                              className={`group transition-all duration-300 ${selectedUserIds.includes(u.id) ? "bg-indigo-500/10" : "hover:bg-slate-800/30"}`}
                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                  checked={selectedUserIds.includes(u.id)}
                                  onChange={() => {
                                    if (selectedUserIds.includes(u.id))
                                      setSelectedUserIds((prev) =>
                                        prev.filter((id) => id !== u.id),
                                      );
                                    else
                                      setSelectedUserIds((prev) => [
                                        ...prev,
                                        u.id,
                                      ]);
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                    {(u.firstName ||
                                      u.name ||
                                      "?")[0].toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-black text-white text-sm tracking-tight">
                                      {u.firstName || u.name || "Anonymous"}{" "}
                                      {u.lastName || ""}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                        @{u.username || "unknown"}
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        ID: {u.telegramId || u.id}
                                      </span>
                                    </div>
                                    {u.phone && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Smartphone
                                          size={10}
                                          className="text-emerald-500"
                                        />
                                        <span className="text-[10px] text-emerald-400/80 font-bold">
                                          {u.phone}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-black text-slate-400">
                                      ₹
                                    </span>
                                    <span className="text-lg font-black text-emerald-400 tracking-tighter">
                                      {Number(
                                        u.availableBalance || 0,
                                      ).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        REWARD
                                      </span>
                                      <span className="text-[10px] font-black text-yellow-500">
                                        ₹{Number(u.rewards || 0).toFixed(0)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        REF
                                      </span>
                                      <span className="text-[10px] font-black text-blue-400">
                                        {u.referrals || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-black text-slate-600">
                                    <span>Identity Status</span>
                                    <div className="flex gap-2">
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${u.membershipVerified ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"}`}
                                        ></div>
                                        <span
                                          className={
                                            u.membershipVerified
                                              ? "text-emerald-500"
                                              : "text-red-500"
                                          }
                                        >
                                          JOIN
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${u.contactVerified ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"}`}
                                        ></div>
                                        <span
                                          className={
                                            u.contactVerified
                                              ? "text-emerald-500"
                                              : "text-red-500"
                                          }
                                        >
                                          CONTACT
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      <Clock size={10} />
                                      <span>
                                        Joined:{" "}
                                        <span className="text-slate-200 font-bold">
                                          {u.joinDate
                                            ? new Date(
                                                u.joinDate,
                                              ).toLocaleDateString("en-GB")
                                            : "N/A"}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      <Timer size={10} />
                                      <span>
                                        Last:{" "}
                                        <span className="text-slate-200 font-bold">
                                          {u.lastActive
                                            ? new Date(
                                                u.lastActive,
                                              ).toLocaleDateString("en-GB")
                                            : "N/A"}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUser(u);
                                      setModalAction("view_user");
                                    }}
                                    className="w-8 h-8 flex items-center justify-center bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20"
                                    title="View & Edit"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUserAction(u.id, "reset")
                                    }
                                    className="w-8 h-8 flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white rounded-xl transition-all border border-yellow-500/20"
                                    title="Reset User"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUserAction(u.id, "re-register")
                                    }
                                    className="w-8 h-8 flex items-center justify-center bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl transition-all border border-purple-500/20"
                                    title="Force Re-registration"
                                  >
                                    <UserPlus size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "🔗 Smart URL Shortener" && (
            <div className="space-y-6">
              {/* Dual Mode Switcher */}
              <div className="flex border-b border-slate-800">
                <button
                  id="self-mode-tab"
                  onClick={() => setShortenerSubTab("self")}
                  className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                    shortenerSubTab === "self"
                      ? "border-indigo-500 text-white bg-slate-800/20"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  💼 SELF MODE (Admin Links)
                </button>
                <button
                  id="user-mode-tab"
                  onClick={() => {
                    setShortenerSubTab("user");
                    fetchUserShortenerSettings();
                  }}
                  className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                    shortenerSubTab === "user"
                      ? "border-indigo-500 text-white bg-slate-800/20"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  👥 USER MODE (User Created Links)
                </button>
              </div>

              {shortenerSubTab === "self" ? (
                <div className="space-y-6">
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">✨ Recently Created</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[...smartLinks]
                        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                        .slice(0, 3)
                        .map(link => (
                          <div key={link.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                             <div className="flex justify-between items-start gap-2">
                               <div className="flex flex-col min-w-0">
                                 <span className="text-white font-bold text-sm truncate max-w-[200px]" title={link.destinationUrl}>{link.destinationUrl}</span>
                                 <span className="text-indigo-400 text-xs font-mono truncate">{link.shortUrl}</span>
                               </div>
                               <div className="flex flex-col gap-1 items-end text-right shrink-0">
                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${link.status === "Enabled" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"}`}>
                                   {link.status === "Enabled" ? "Active" : "Disabled"}
                                 </span>
                                 {link.isPasswordProtected && (
                                   <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                     Password Protected
                                   </span>
                                 )}
                                 {link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) && (
                                   <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                     Custom Alias
                                   </span>
                                 )}
                               </div>
                             </div>
                             <div className="flex flex-wrap gap-2 mt-auto">
                                <button onClick={() => {
                                    if (navigator.clipboard) {
                                       navigator.clipboard.writeText(link.shortUrl || link.destinationUrl);
                                       alert("Copied to clipboard!");
                                    }
                                }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition">📋 Copy</button>
                                <button onClick={() => {
                                    const shareData = { title: 'Link', url: link.shortUrl || link.destinationUrl };
                                    if (navigator.share && navigator.canShare(shareData)) {
                                       navigator.share(shareData);
                                    } else {
                                       alert("Share not supported");
                                    }
                                }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition">📤 Share</button>
                                <button onClick={() => setAnalyticsLinkId(link.id || link.alias)} className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-xs rounded transition">📊 Analytics</button>
                                <button onClick={() => {
                                  setSmartLinkForm({
                                    ...link,
                                    autoGenerateAlias: link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) ? false : true,
                                    customAlias: link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) ? link.alias : "",
                                    isPasswordProtected: !!link.isPasswordProtected,
                                    password: link.password || "",
                                  });
                                  setModalAction("edit_smart_link");
                                }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition">✏️ Edit</button>
                                <button onClick={async () => {
                                  if (confirm("Delete this smart link?")) {
                                    try {
                                      const res = await fetch(`/api/admin/smart-links/${link.id}`, { method: "DELETE" });
                                      if (res.ok) fetchSmartLinks();
                                    } catch(e) {}
                                  }
                                }} className="px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs rounded transition">🗑️ Delete</button>
                             </div>
                          </div>
                        ))}
                      {smartLinks.length === 0 && <p className="text-slate-500 text-sm">No links found.</p>}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      🔗 Self-Hosted Smart URL Shortener (SELF MODE)
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setSmartLinkForm({
                            destinationUrl: "",
                            customAlias: "",
                            autoGenerateAlias: true,
                            totalPages: 1,
                            autoRedirect: true,
                            finalRedirectDelay: 5,
                            instructions: "",
                            reward: 0,
                            status: "Enabled",
                            pagesConfig: [],
                          });
                          setModalAction("create_smart_link");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                      >
                        ➕ Create Smart Link
                      </button>
                      <button
                        onClick={() => fetchSmartLinks()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 cursor-pointer"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        🔗 Total Links
                      </h3>
                      <p className="text-2xl font-bold text-white">
                        {smartLinks.length}
                      </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        👀 Total Views
                      </h3>
                      <p className="text-2xl font-bold text-blue-300">
                        {smartLinks.reduce(
                          (acc, l) => acc + Number(l.views || 0),
                          0,
                        )}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                        🚀 Completed Redirects
                      </h3>
                      <p className="text-2xl font-bold text-emerald-300">
                        {smartLinks.reduce(
                          (acc, l) => acc + Number(l.completedRedirects || 0),
                          0,
                        )}
                      </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                        📈 Average Conversion
                      </h3>
                      <p className="text-2xl font-bold text-purple-300">
                        {(() => {
                          const v = smartLinks.reduce(
                            (acc, l) => acc + Number(l.views || 0),
                            0,
                          );
                          const r = smartLinks.reduce(
                            (acc, l) => acc + Number(l.completedRedirects || 0),
                            0,
                          );
                          return v > 0
                            ? ((r / v) * 100).toFixed(2) + "%"
                            : "0.00%";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Links Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <h3 className="font-bold text-white text-sm">
                        Monetized Link Records
                      </h3>
                      <input
                        type="text"
                        placeholder="Search links by alias or destination..."
                        value={smartLinkSearch}
                        onChange={(e) => setSmartLinkSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                      />
                    </div>

                    {smartLinksLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : smartLinksError ? (
                      <p className="text-center py-8 text-rose-400 text-sm font-semibold">
                        {smartLinksError}
                      </p>
                    ) : smartLinks.length === 0 ? (
                      <p className="text-center py-12 text-slate-500 text-sm">
                        No self-hosted smart links found. Create your first
                        monetized link above!
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-4">Short URL</th>
                              <th className="p-4">Destination URL</th>
                              <th className="p-4 text-center">Pages</th>
                              <th className="p-4 text-center">
                                Views / Unique
                              </th>
                              <th className="p-4 text-center">
                                Redirects / CR
                              </th>
                              <th className="p-4">Created At</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {smartLinks
                              .filter(
                                (l) =>
                                  (l.alias || "")
                                    .toLowerCase()
                                    .includes(smartLinkSearch.toLowerCase()) ||
                                  (l.destinationUrl || "")
                                    .toLowerCase()
                                    .includes(smartLinkSearch.toLowerCase()) ||
                                  (l.shortUrl || "")
                                    .toLowerCase()
                                    .includes(smartLinkSearch.toLowerCase()),
                              )
                              .map((link) => (
                                <tr
                                  key={link.id}
                                  className="hover:bg-slate-850/30 transition-colors"
                                >
                                  <td className="p-4 font-mono">
                                    <div className="flex items-center gap-2">
                                      <span className="text-indigo-400 font-semibold">
                                        {link.shortUrl}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            link.shortUrl,
                                          );
                                          alert("Short Link Copied!");
                                        }}
                                        className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded transition cursor-pointer"
                                        title="Copy Link"
                                      >
                                        📋
                                      </button>
                                      <a
                                        href={link.shortUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded transition cursor-pointer"
                                        title="Visit Link"
                                      >
                                        🌐
                                      </a>
                                    </div>
                                  </td>
                                  <td
                                    className="p-4 max-w-xs truncate"
                                    title={link.destinationUrl}
                                  >
                                    <span className="text-slate-300 font-medium">
                                      {link.destinationUrl}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center font-bold text-white">
                                    {link.totalPages}
                                  </td>
                                  <td className="p-4 text-center font-mono">
                                    <span className="text-slate-300 font-bold">
                                      {link.views || 0}
                                    </span>
                                    <span className="text-slate-500 mx-1">
                                      /
                                    </span>
                                    <span className="text-slate-400">
                                      {link.uniqueViews || 0}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center font-mono">
                                    <span className="text-emerald-400 font-bold">
                                      {link.completedRedirects || 0}
                                    </span>
                                    <span className="text-slate-500 mx-1">
                                      /
                                    </span>
                                    <span className="text-purple-400 font-semibold">
                                      {link.conversionRate || 0}%
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-400 font-mono">
                                    {link.createdAt
                                      ? new Date(
                                          link.createdAt,
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1 items-start">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${link.status === "Enabled" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"}`}
                                      >
                                        {link.status === "Enabled" ? "Active" : "Disabled"}
                                      </span>
                                      {link.isPasswordProtected && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                          Password Protected
                                        </span>
                                      )}
                                      {link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                          Custom Alias
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => {
                                            if (navigator.clipboard) {
                                               navigator.clipboard.writeText(link.shortUrl || link.destinationUrl);
                                               alert("Copied to clipboard!");
                                            }
                                        }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer">
                                        📋 Copy
                                      </button>
                                      <button onClick={() => {
                                            const shareData = { title: 'Link', url: link.shortUrl || link.destinationUrl };
                                            if (navigator.share && navigator.canShare(shareData)) {
                                               navigator.share(shareData);
                                            } else {
                                               alert("Share not supported. Copy instead!");
                                            }
                                        }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer">
                                        📤 Share
                                      </button>
                                      <button onClick={() => setAnalyticsLinkId(link.id || link.alias)} className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded font-medium transition cursor-pointer border border-blue-500/30">
                                        📊 Analytics
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSmartLinkForm({
                                            ...link,
                                            autoGenerateAlias: link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) ? false : true,
                                            customAlias: link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) ? link.alias : "",
                                            isPasswordProtected: !!link.isPasswordProtected,
                                            password: link.password || "",
                                          });
                                          setModalAction("edit_smart_link");
                                        }}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (
                                            confirm(
                                              "Are you sure you want to delete this smart link?",
                                            )
                                          ) {
                                            try {
                                              const res = await fetch(
                                                `${API_BASE}/api/admin/smart-links/${link.id}`,
                                                { method: "DELETE" },
                                              );
                                              if (res.ok) {
                                                fetchSmartLinks();
                                                alert("Smart Link Deleted");
                                              } else {
                                                alert("Failed to delete link.");
                                              }
                                            } catch (err: any) {
                                              alert(err.message);
                                            }
                                          }
                                        }}
                                        className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded font-medium transition cursor-pointer"
                                      >
                                        🗑 Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* USER MODE SETTINGS */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        👥 User Created Links Configuration Defaults (USER MODE)
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Configure global redirection and monetization defaults
                        applied to all short links created by normal users.
                      </p>
                    </div>
                    <button
                      id="save-user-settings-btn"
                      onClick={() => saveUserShortenerSettings()}
                      disabled={userShortenerSettingsSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/20 cursor-pointer"
                    >
                      {userShortenerSettingsSaving
                        ? "⏳ Saving Defaults..."
                        : "💾 Save Settings"}
                    </button>
                  </div>

                  {userShortenerSettingsLoading || !userShortenerSettings ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Global Settings Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-850 pb-1">
                            ⚙️ Global Redirection Options
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Total Pages (1-20)
                              </label>
                              <input
                                id="user-total-pages-input"
                                type="number"
                                min="1"
                                max="20"
                                value={userShortenerSettings.totalPages || 1}
                                onChange={(e) =>
                                  handleUserTotalPagesChange(
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Auto Scroll Down
                              </label>
                              <select
                                id="user-auto-scroll"
                                value={
                                  userShortenerSettings.autoScroll !== false
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    autoScroll: e.target.value === "true",
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="true">🟢 Enabled</option>
                                <option value="false">🔴 Disabled</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Auto Redirect (Last Page)
                              </label>
                              <select
                                id="user-auto-redirect"
                                value={
                                  userShortenerSettings.autoRedirect !== false
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    autoRedirect: e.target.value === "true",
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="true">
                                  🟢 Enabled (Countdown Auto)
                                </option>
                                <option value="false">
                                  🔴 Disabled (Show Button)
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Default Math Verification
                              </label>
                              <select
                                id="user-human-verification"
                                value={
                                  userShortenerSettings.humanVerification !==
                                  false
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    humanVerification:
                                      e.target.value === "true",
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="true">🟢 Enabled</option>
                                <option value="false">🔴 Disabled</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Global Instructions Text
                              </label>
                              <button
                                onClick={handleGenerateAiInstructions}
                                disabled={aiGeneratingInstructions}
                                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg transition-colors border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {aiGeneratingInstructions
                                  ? "⏳ Generating..."
                                  : "✨ AI Generate"}
                              </button>
                            </div>
                            {aiError && (
                              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex justify-between items-center">
                                <span>{aiError}</span>
                                <button
                                  onClick={() => setAiError("")}
                                  className="hover:text-red-300"
                                >
                                  ✖
                                </button>
                              </div>
                            )}
                            <textarea
                              id="user-global-instructions"
                              rows={3}
                              value={userShortenerSettings.instructions || ""}
                              onChange={(e) =>
                                setUserShortenerSettings((prev: any) => ({
                                  ...prev,
                                  instructions: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                              placeholder="Follow the steps to reach destination URL..."
                            />
                            {suggestedInstructions && (
                              <div className="mt-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                    ✨ AI Suggested Instructions
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleGenerateAiInstructions}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded transition-colors"
                                    >
                                      🔄 Regenerate
                                    </button>
                                    <button
                                      onClick={useSuggestedInstructions}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded transition-colors"
                                    >
                                      ✅ Use This
                                    </button>
                                    <button
                                      onClick={() =>
                                        setSuggestedInstructions(null)
                                      }
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded transition-colors"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                </div>
                                <div className="text-xs text-slate-300 whitespace-pre-wrap italic">
                                  {suggestedInstructions}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-850 pb-1">
                            🛡️ Security & Integrity
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Anti-VPN/Anti-Proxy Protection
                              </label>
                              <select
                                id="user-vpn-detection"
                                value={
                                  userShortenerSettings.vpnDetection === true
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    vpnDetection: e.target.value === "true",
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="true">
                                  🟢 Enabled (IP Check)
                                </option>
                                <option value="false">🔴 Disabled</option>
                              </select>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Queries IP-API to block non-residential traffic.
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Bot Detection
                              </label>
                              <select
                                id="user-bot-detection"
                                value={
                                  userShortenerSettings.botDetection !== false
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    botDetection: e.target.value === "true",
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="true">
                                  🟢 Enabled (Agent Filtering)
                                </option>
                                <option value="false">🔴 Disabled</option>
                              </select>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Filters spider, web crawl and headless browser
                                traffic.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Verify Button Label
                              </label>
                              <input
                                id="user-verify-label"
                                type="text"
                                value={
                                  userShortenerSettings.verifyButtonText || ""
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    verifyButtonText: e.target.value,
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Verify This Step"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Continue Button Label
                              </label>
                              <input
                                id="user-continue-label"
                                type="text"
                                value={
                                  userShortenerSettings.continueButtonText || ""
                                }
                                onChange={(e) =>
                                  setUserShortenerSettings((prev: any) => ({
                                    ...prev,
                                    continueButtonText: e.target.value,
                                  }))
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Proceed to Next Page"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Page Specific Settings Section */}
                      <div className="border-t border-slate-800 pt-6 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <h4 className="text-base font-bold text-slate-200">
                            📄 Dynamic Step Configurations (PAGE SETTINGS)
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            Select a page step to configure individual settings
                          </span>
                        </div>

                        {/* Horizontal selector for activePageTab */}
                        <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-2 border border-slate-850 rounded-xl">
                          {Array.from({
                            length: userShortenerSettings.totalPages || 1,
                          }).map((_, index) => {
                            const pNum = index + 1;
                            return (
                              <button
                                key={pNum}
                                onClick={() => setActivePageTab(pNum)}
                                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  activePageTab === pNum
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                                    : "text-slate-400 hover:text-white hover:bg-slate-850/50"
                                }`}
                              >
                                Page {pNum}
                              </button>
                            );
                          })}
                        </div>

                        {/* Active Page configurations editor */}
                        {(() => {
                          // Find or build page config
                          const pages = userShortenerSettings.pagesConfig || [];
                          let pageConf = pages.find(
                            (p: any) => p.pageNumber === activePageTab,
                          );
                          if (!pageConf) {
                            pageConf = {
                              pageNumber: activePageTab,
                              timerDuration: 10,
                              instructions: `Complete step ${activePageTab} verification.`,
                              selectedAdIds: [],
                              numberOfAds: 3,
                              humanVerification: true,
                            };
                          }

                          const updatePageConfField = (
                            field: string,
                            val: any,
                          ) => {
                            setUserShortenerSettings((prev: any) => {
                              const currentPages = prev.pagesConfig || [];
                              const updated = currentPages.map((p: any) => {
                                if (p.pageNumber === activePageTab) {
                                  return { ...p, [field]: val };
                                }
                                return p;
                              });
                              // In case page configuration was missing from array
                              if (
                                !updated.some(
                                  (p: any) => p.pageNumber === activePageTab,
                                )
                              ) {
                                updated.push({ ...pageConf, [field]: val });
                              }
                              return { ...prev, pagesConfig: updated };
                            });
                          };

                          return (
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                                <span className="text-xl">📄</span>
                                <span className="font-bold text-white text-sm">
                                  Step {activePageTab} Configuration
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Timer Duration (Seconds)
                                  </label>
                                  <input
                                    type="number"
                                    value={pageConf.timerDuration}
                                    onChange={(e) =>
                                      updatePageConfField(
                                        "timerDuration",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Page InstructionsOverride
                                  </label>
                                  <input
                                    type="text"
                                    value={pageConf.instructions || ""}
                                    onChange={(e) =>
                                      updatePageConfField(
                                        "instructions",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="Follow the guidelines below..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Verify Button / Captcha Toggle
                                  </label>
                                  <select
                                    value={
                                      pageConf.humanVerification !== false
                                        ? "true"
                                        : "false"
                                    }
                                    onChange={(e) =>
                                      updatePageConfField(
                                        "humanVerification",
                                        e.target.value === "true",
                                      )
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="true">
                                      🟢 Enabled (Verify + Captcha)
                                    </option>
                                    <option value="false">
                                      🔴 Disabled (Direct Unlock)
                                    </option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "📈 Analytics" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📈 RoyShare Analytics Center
                </h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => setAnalyticsView("Overview")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Overview" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 Overview
                  </button>
                  <button
                    onClick={() => setAnalyticsView("User Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "User Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 User Analytics
                  </button>
                  <button
                    onClick={() => setAnalyticsView("Earnings Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Earnings Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    💰 Earnings Analytics
                  </button>
                  <button
                    onClick={() => setAnalyticsView("Withdrawal Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Withdrawal Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    💸 Withdrawal Analytics
                  </button>
                  <button
                    onClick={() => setAnalyticsView("Upload Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Upload Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📤 Upload Analytics
                  </button>
                  <button
                    onClick={() => setAnalyticsView("Referral Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Referral Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    👥 Referral Analytics
                  </button>
                  <button
                    onClick={() => setAnalyticsView("Ad Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Ad Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📢 Ad Analytics
                  </button>
                  <button
                    onClick={() =>
                      alert("Export functionality to be implemented")
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                  >
                    📥 Export Reports
                  </button>
                  <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {analyticsLoading || !analyticsData ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : analyticsView === "Overview" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      👥 Total Users
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.overview?.totalUsers}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      📤 Total Uploads
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.overview?.totalUploads}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      🔗 Total Links
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.overview?.totalLinks}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      💰 Total Earnings
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      $
                      {Number(
                        analyticsData.overview?.totalEarnings || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                      💸 Total Withdrawals
                    </h3>
                    <p className="text-2xl font-bold text-red-400">
                      {analyticsData.overview?.totalWithdrawals}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                      🎁 Total Bonus Claims
                    </h3>
                    <p className="text-2xl font-bold text-yellow-400">
                      {analyticsData.overview?.totalBonusClaims}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                      💰 Total Reward Claims
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {analyticsData.overview?.totalRewardClaims}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-purple-500/80 uppercase tracking-wider mb-1">
                      👥 Total Referrals
                    </h3>
                    <p className="text-2xl font-bold text-purple-400">
                      {analyticsData.overview?.totalReferrals}
                    </p>
                  </div>
                </div>
              ) : analyticsView === "User Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      👥 Total Users
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.userAnalytics?.totalUsers}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      🟢 Active Users
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      {analyticsData.userAnalytics?.activeUsers}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                      🆕 New Users Today
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {analyticsData.userAnalytics?.newUsersToday}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-purple-500/80 uppercase tracking-wider mb-1">
                      📅 New This Week
                    </h3>
                    <p className="text-2xl font-bold text-purple-400">
                      {analyticsData.userAnalytics?.newUsersThisWeek}
                    </p>
                  </div>
                </div>
              ) : analyticsView === "Earnings Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Today's Earnings
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      $
                      {Number(
                        analyticsData.earningsAnalytics?.todayEarnings || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Weekly Earnings
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      $
                      {Number(
                        analyticsData.earningsAnalytics?.weeklyEarnings || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Monthly Earnings
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      $
                      {Number(
                        analyticsData.earningsAnalytics?.monthlyEarnings || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Lifetime Earnings
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      $
                      {Number(
                        analyticsData.earningsAnalytics?.lifetimeEarnings || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : analyticsView === "Withdrawal Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                      Pending
                    </h3>
                    <p className="text-2xl font-bold text-yellow-400">
                      {analyticsData.withdrawalAnalytics?.pendingWithdrawals}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                      Approved
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {analyticsData.withdrawalAnalytics?.approvedWithdrawals}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Paid
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      {analyticsData.withdrawalAnalytics?.paidWithdrawals}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                      Rejected
                    </h3>
                    <p className="text-2xl font-bold text-red-400">
                      {analyticsData.withdrawalAnalytics?.rejectedWithdrawals}
                    </p>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-indigo-500/80 uppercase tracking-wider mb-1">
                      Total Amount
                    </h3>
                    <p className="text-2xl font-bold text-indigo-400">
                      $
                      {Number(
                        analyticsData.withdrawalAnalytics
                          ?.totalWithdrawAmount || 0,
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : analyticsView === "Upload Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Uploaded Today
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.uploadAnalytics?.filesUploadedToday}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Uploaded This Week
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.uploadAnalytics?.filesUploadedThisWeek}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Uploaded This Month
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.uploadAnalytics?.filesUploadedThisMonth}
                    </p>
                  </div>
                </div>
              ) : analyticsView === "Referral Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-purple-500/80 uppercase tracking-wider mb-1">
                      Total Referrals
                    </h3>
                    <p className="text-2xl font-bold text-purple-400">
                      {analyticsData.referralAnalytics?.totalReferrals}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Valid Referrals
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      {analyticsData.referralAnalytics?.validReferrals}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                      Rejected Referrals
                    </h3>
                    <p className="text-2xl font-bold text-red-400">
                      {analyticsData.referralAnalytics?.rejectedReferrals}
                    </p>
                  </div>
                </div>
              ) : analyticsView === "Ad Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                      Total Ad Views
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {analyticsData.adAnalytics?.totalAdViews}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Total Ad Clicks
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      {analyticsData.adAnalytics?.totalAdClicks}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                      Overall CTR
                    </h3>
                    <p className="text-2xl font-bold text-yellow-400">
                      {analyticsData.adAnalytics?.ctr}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {activeTab === "📢 Broadcast" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📢 Broadcast Center
                </h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => {
                      setBroadcastTab("📝 Text Broadcast");
                      setBroadcastForm({ ...broadcastForm, type: "text" });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${broadcastTab === "📝 Text Broadcast" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📝 Text
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastTab("🖼 Image Broadcast");
                      setBroadcastForm({ ...broadcastForm, type: "image" });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${broadcastTab === "🖼 Image Broadcast" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🖼 Image
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastTab("🎥 Video Broadcast");
                      setBroadcastForm({ ...broadcastForm, type: "video" });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${broadcastTab === "🎥 Video Broadcast" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🎥 Video
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastTab("📄 Document Broadcast");
                      setBroadcastForm({ ...broadcastForm, type: "document" });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${broadcastTab === "📄 Document Broadcast" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📄 Document
                  </button>
                  <button
                    onClick={() => setBroadcastTab("🎯 Targeted Broadcast")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${broadcastTab === "🎯 Targeted Broadcast" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🎯 Targeted
                  </button>
                  <button
                    onClick={() => setBroadcastTab("📊 Broadcast History")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${broadcastTab === "📊 Broadcast History" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 History
                  </button>
                </div>
              </div>

              {broadcastTab === "📊 Broadcast History" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  {broadcastsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Target</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">
                              Stats (Delivered / Failed)
                            </th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {broadcasts.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-8 text-slate-500"
                              >
                                No broadcast history found.
                              </td>
                            </tr>
                          ) : (
                            broadcasts.map((b: any) => (
                              <tr
                                key={b.id}
                                className="border-b border-slate-800/50 hover:bg-slate-800/20"
                              >
                                <td className="px-4 py-3 font-medium text-white">
                                  {b.type.toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {new Date(b.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {b.targetAudience}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-bold ${b.status === "Sent" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}
                                  >
                                    {b.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2 text-xs">
                                    <span className="text-emerald-400">
                                      ✅ {b.deliveredCount}
                                    </span>
                                    <span className="text-red-400">
                                      ❌ {b.failedCount}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                  <button
                                    onClick={async () => {
                                      if (
                                        confirm("Delete broadcast history?")
                                      ) {
                                        await fetch(
                                          `${API_BASE}/api/admin/broadcasts/${b.id}`,
                                          { method: "DELETE" },
                                        );
                                        fetchBroadcasts();
                                      }
                                    }}
                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-xs transition-colors"
                                  >
                                    🗑 Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Form Side */}
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                      {broadcastTab}
                    </h3>

                    <div className="space-y-4">
                      {broadcastTab === "🎯 Targeted Broadcast" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">
                            🎯 Select Audience
                          </label>
                          <select
                            value={broadcastForm.targetAudience}
                            onChange={(e) =>
                              setBroadcastForm({
                                ...broadcastForm,
                                targetAudience: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="👥 All Users">👥 All Users</option>
                            <option value="🆕 New Users">🆕 New Users</option>
                            <option value="💰 Users With Balance">
                              💰 Users With Balance
                            </option>
                            <option value="💸 Users With Pending Withdrawals">
                              💸 Users With Pending Withdrawals
                            </option>
                            <option value="👥 Users With Referrals">
                              👥 Users With Referrals
                            </option>
                            <option value="📤 Active Uploaders">
                              📤 Active Uploaders
                            </option>
                          </select>
                        </div>
                      )}

                      {broadcastTab === "📝 Text Broadcast" ||
                      broadcastTab === "🎯 Targeted Broadcast" ? (
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">
                            📝 Message
                          </label>
                          <textarea
                            value={broadcastForm.message}
                            onChange={(e) =>
                              setBroadcastForm({
                                ...broadcastForm,
                                message: e.target.value,
                              })
                            }
                            placeholder="Enter your message here..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white h-32 resize-none focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={improveWithAi}
                            disabled={
                              isImprovingWithAi || !broadcastForm.message
                            }
                            className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg shadow-md transition-all duration-200"
                          >
                            {isImprovingWithAi ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Improving with AI...
                              </>
                            ) : (
                              <>
                                <span>✨</span> Improve with AI
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              {broadcastTab.includes("Image")
                                ? "🖼 Image URL"
                                : broadcastTab.includes("Video")
                                  ? "🎥 Video URL"
                                  : "📄 Document URL"}
                            </label>
                            <input
                              type="text"
                              value={broadcastForm.mediaUrl}
                              onChange={(e) =>
                                setBroadcastForm({
                                  ...broadcastForm,
                                  mediaUrl: e.target.value,
                                })
                              }
                              placeholder="https://..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              📄 Caption
                            </label>
                            <textarea
                              value={broadcastForm.caption}
                              onChange={(e) =>
                                setBroadcastForm({
                                  ...broadcastForm,
                                  caption: e.target.value,
                                })
                              }
                              placeholder="Media caption..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white h-24 resize-none focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={improveWithAi}
                              disabled={
                                isImprovingWithAi || !broadcastForm.caption
                              }
                              className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg shadow-md transition-all duration-200"
                            >
                              {isImprovingWithAi ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                  Improving with AI...
                                </>
                              ) : (
                                <>
                                  <span>✨</span> Improve with AI
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}

                      {/* AI Composer View */}
                      {showAiView && (
                        <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-violet-500/30 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h4 className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                              <span>✨</span> AI Broadcast Composer
                            </h4>
                            {isImprovingWithAi && (
                              <span className="text-[10px] text-violet-300 animate-pulse">
                                AI is crafting message...
                              </span>
                            )}
                          </div>

                          {aiError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                              ⚠️ {aiError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                                Original Message
                              </span>
                              <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 min-h-[80px] border border-slate-800/50 whitespace-pre-wrap">
                                {aiOriginalText}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-violet-400 block mb-1 uppercase tracking-wider">
                                AI Generated Message
                              </span>
                              <div className="p-3 bg-slate-900 rounded-lg text-xs text-white min-h-[80px] border border-violet-500/20 whitespace-pre-wrap relative">
                                {isImprovingWithAi ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                                    <span className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></span>
                                  </div>
                                ) : (
                                  aiGeneratedText || (
                                    <span className="text-slate-500 italic">
                                      Writing version...
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                            <button
                              onClick={() => setShowAiView(false)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-all"
                            >
                              ❌ Cancel
                            </button>
                            <button
                              onClick={improveWithAi}
                              disabled={isImprovingWithAi}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-violet-400 font-medium text-xs rounded-lg border border-violet-500/30 transition-all flex items-center gap-1"
                            >
                              <span>🔄</span> Regenerate
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  broadcastForm.type === "text" ||
                                  broadcastTab === "🎯 Targeted Broadcast"
                                ) {
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    message: aiGeneratedText,
                                  });
                                } else {
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    caption: aiGeneratedText,
                                  });
                                }
                                setShowAiView(false);
                              }}
                              disabled={isImprovingWithAi || !aiGeneratedText}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-all"
                            >
                              ✅ Use This Version
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">
                            Optional Button Text
                          </label>
                          <input
                            type="text"
                            value={broadcastForm.buttonText}
                            onChange={(e) =>
                              setBroadcastForm({
                                ...broadcastForm,
                                buttonText: e.target.value,
                              })
                            }
                            placeholder="e.g. Click Here"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">
                            Optional Button Link
                          </label>
                          <input
                            type="text"
                            value={broadcastForm.buttonLink}
                            onChange={(e) =>
                              setBroadcastForm({
                                ...broadcastForm,
                                buttonLink: e.target.value,
                              })
                            }
                            placeholder="https://..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {isScheduling && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-4">
                          <h4 className="font-bold text-white text-sm">
                            📅 Schedule Time
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <input
                                type="date"
                                value={broadcastForm.scheduledAtDate}
                                onChange={(e) =>
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    scheduledAtDate: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <input
                                type="time"
                                value={broadcastForm.scheduledAtTime}
                                onChange={(e) =>
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    scheduledAtTime: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                        {isScheduling ? (
                          <>
                            <button
                              onClick={() => setIsScheduling(false)}
                              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
                            >
                              ❌ Cancel
                            </button>
                            <button
                              onClick={() => sendBroadcast("Scheduled")}
                              disabled={broadcastsLoading}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all"
                            >
                              ✅ Confirm Schedule
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsScheduling(true)}
                              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-all"
                            >
                              ⏰ Schedule
                            </button>
                            <button
                              onClick={() => sendBroadcast("Sent")}
                              disabled={broadcastsLoading}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all"
                            >
                              📤 Send Now
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Integrated Self-Test Panel inside left column */}
                    <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-1.5 font-sans">
                            <span>🧪</span> Automated System Self-Test
                          </h4>
                          <p className="text-xs text-slate-400">
                            Test API, Telegram delivery to admin, database
                            users, and inline buttons.
                          </p>
                        </div>
                        <button
                          onClick={runSelfTest}
                          disabled={isSelfTesting}
                          className="self-start sm:self-center px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5"
                        >
                          {isSelfTesting ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Running...
                            </>
                          ) : (
                            "Run Self-Test"
                          )}
                        </button>
                      </div>

                      {selfTestError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-4 whitespace-pre-wrap font-sans">
                          ⚠️ {selfTestError}
                        </div>
                      )}

                      {selfTestResults && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900/50 p-4 rounded-xl border border-slate-800 font-sans">
                          <div className="flex items-center gap-2">
                            <span>
                              {selfTestResults.apiWorking ? "✅" : "❌"}
                            </span>
                            <span className="text-slate-300 font-medium">
                              Broadcast API Working
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>
                              {selfTestResults.deliveryWorking ? "✅" : "❌"}
                            </span>
                            <span className="text-slate-300 font-medium">
                              Telegram Delivery Working
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>
                              {selfTestResults.usersLoaded ? "✅" : "❌"}
                            </span>
                            <span className="text-slate-300 font-medium">
                              Database Users Loaded
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>
                              {selfTestResults.buttonsWorking ? "✅" : "❌"}
                            </span>
                            <span className="text-slate-300 font-medium font-sans">
                              Inline Buttons Working
                            </span>
                          </div>
                          <div className="col-span-1 md:col-span-2 border-t border-slate-800/60 pt-2 mt-1 flex items-center justify-between">
                            <span className="text-slate-400 font-medium">
                              Result:
                            </span>
                            <span
                              className={`font-bold ${selfTestResults.completedSuccessfully ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {selfTestResults.completedSuccessfully
                                ? "All Tests Passed Successfully"
                                : "Some Tests Failed"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Side */}
                  <div className="w-full lg:w-80">
                    <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                      👁 Preview Broadcast
                    </h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
                      <div className="bg-slate-800 px-4 py-2 text-xs font-bold text-center border-b border-slate-700">
                        Message Preview
                      </div>
                      <div className="p-4 bg-slate-950/50 min-h-[220px]">
                        {broadcastForm.message ||
                        broadcastForm.caption ||
                        broadcastForm.mediaUrl ||
                        showAiView ? (
                          <div className="space-y-3">
                            {broadcastForm.mediaUrl && (
                              <div className="w-full h-32 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                                {broadcastForm.type === "image" && (
                                  <img
                                    src={broadcastForm.mediaUrl}
                                    className="w-full h-full object-cover"
                                    alt="Preview"
                                  />
                                )}
                                {broadcastForm.type === "video" && (
                                  <div className="text-2xl">🎥</div>
                                )}
                                {broadcastForm.type === "document" && (
                                  <div className="text-2xl">📄</div>
                                )}
                              </div>
                            )}
                            {(broadcastForm.message ||
                              broadcastForm.caption ||
                              showAiView) && (
                              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {showAiView
                                  ? isImprovingWithAi
                                    ? aiGeneratedText ||
                                      "✨ AI is crafting message..."
                                    : aiGeneratedText ||
                                      broadcastForm.message ||
                                      broadcastForm.caption
                                  : broadcastForm.type === "text" ||
                                      broadcastTab === "🎯 Targeted Broadcast"
                                    ? broadcastForm.message
                                    : broadcastForm.caption}
                              </p>
                            )}
                            {isImprovingWithAi && (
                              <div className="flex items-center gap-2 text-[10px] text-violet-400 font-medium animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>
                                <span>AI is rewriting...</span>
                              </div>
                            )}
                            {broadcastForm.buttonText && (
                              <div className="w-full text-center py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-bold border border-indigo-500/20 hover:bg-indigo-600/30 transition-all duration-200">
                                {broadcastForm.buttonText}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center py-12 text-slate-600 text-sm italic">
                            Empty preview
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Broadcast Send Progress Overlay Modal */}
                  {sendStatus !== "idle" && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
                        <div className="text-center space-y-3">
                          {sendStatus === "preparing" && (
                            <>
                              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <h3 className="text-xl font-bold text-white">
                                Preparing Broadcast...
                              </h3>
                              <p className="text-sm text-slate-400">
                                Filtering database audience and establishing
                                connection...
                              </p>
                            </>
                          )}
                          {sendStatus === "sending" && (
                            <>
                              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <h3 className="text-xl font-bold text-white">
                                Sending...
                              </h3>
                              <p className="text-sm text-slate-400">
                                Delivering messages to Telegram users with rate
                                limiting...
                              </p>
                            </>
                          )}
                          {sendStatus === "success" && (
                            <>
                              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto border border-emerald-500/30">
                                ✅
                              </div>
                              <h3 className="text-xl font-bold text-emerald-400 font-sans">
                                Success
                              </h3>
                              <p className="text-sm text-slate-400 font-medium">
                                The broadcast has been completed and logged.
                              </p>
                            </>
                          )}
                          {sendStatus === "failed" && (
                            <>
                              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-2xl mx-auto border border-red-500/30">
                                ❌
                              </div>
                              <h3 className="text-xl font-bold text-red-400 font-sans">
                                Broadcast Failed
                              </h3>
                              <p className="text-sm text-slate-400">
                                An error occurred during delivery. Please check
                                logs.
                              </p>
                            </>
                          )}
                        </div>

                        {broadcastStats && (
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-sm font-sans">
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Total Users
                              </span>
                              <span className="font-semibold text-white">
                                {broadcastStats.totalUsers}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-400">
                                Delivered
                              </span>
                              <span className="font-semibold text-emerald-400">
                                {broadcastStats.delivered}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-400">Failed</span>
                              <span className="font-semibold text-red-400">
                                {broadcastStats.failed}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Skipped</span>
                              <span className="font-semibold text-white">
                                {broadcastStats.skipped}
                              </span>
                            </div>
                            <div className="border-t border-slate-800/80 pt-2 flex justify-between text-xs uppercase tracking-wider font-semibold">
                              <span className="text-slate-400">Time Taken</span>
                              <span className="text-white">
                                {broadcastStats.timeTaken}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={() => setSendStatus("idle")}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all duration-200"
                          >
                            Close Status Panel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === "🛡 Security Center" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🛡 RoyShare Security Center
                </h2>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <button
                    onClick={() => setSecurityTab("Overview")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "Overview" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setSecurityTab("User Security")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "User Security" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    👥 User Security
                  </button>
                  <button
                    onClick={() => setSecurityTab("Referral Protection")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "Referral Protection" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    👥 Referral Protection
                  </button>
                  <button
                    onClick={() => setSecurityTab("Reward Protection")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "Reward Protection" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    💰 Reward Protection
                  </button>
                  <button
                    onClick={() => setSecurityTab("Bonus Protection")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "Bonus Protection" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🎁 Bonus Protection
                  </button>
                  <button
                    onClick={() => setSecurityTab("VPN Detection")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "VPN Detection" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🌐 VPN Detection
                  </button>
                  <button
                    onClick={() => setSecurityTab("Device Detection")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "Device Detection" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📱 Device Detection
                  </button>
                  <button
                    onClick={() => setSecurityTab("Security Logs")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${securityTab === "Security Logs" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📜 Security Logs
                  </button>
                  <button
                    onClick={fetchSecurityData}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 flex items-center gap-2 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {securityLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : securityTab === "Overview" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-1">
                      🚨 Fraud Alerts
                    </h3>
                    <p className="text-2xl font-bold text-red-400">
                      {securityStats.fraudAlerts || 0}
                    </p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-orange-500/80 uppercase tracking-wider mb-1">
                      🚫 Banned Users
                    </h3>
                    <p className="text-2xl font-bold text-orange-400">
                      {securityStats.bannedUsers || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">
                      ⚠️ Suspicious Users
                    </h3>
                    <p className="text-2xl font-bold text-yellow-400">
                      {securityStats.suspiciousUsers || 0}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                      🔍 Pending Reviews
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {securityStats.pendingReviews || 0}
                    </p>
                  </div>
                </div>
              ) : securityTab === "Security Logs" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">User ID</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Risk Level</th>
                          <th className="px-4 py-3 text-right">
                            Admin Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 text-slate-500"
                            >
                              No security logs found.
                            </td>
                          </tr>
                        ) : (
                          securityLogs.map((log: any) => (
                            <tr
                              key={log.id}
                              className="border-b border-slate-800/50 hover:bg-slate-800/20"
                            >
                              <td className="px-4 py-3 text-xs">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono">
                                {log.userId}
                              </td>
                              <td className="px-4 py-3">{log.actionDesc}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    log.riskLevel === "Critical"
                                      ? "bg-red-500/20 text-red-400"
                                      : log.riskLevel === "High"
                                        ? "bg-orange-500/20 text-orange-400"
                                        : log.riskLevel === "Medium"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : "bg-emerald-500/20 text-emerald-400"
                                  }`}
                                >
                                  {log.riskLevel === "Critical"
                                    ? "🚨"
                                    : log.riskLevel === "High"
                                      ? "🔴"
                                      : log.riskLevel === "Medium"
                                        ? "🟡"
                                        : "🟢"}{" "}
                                  {log.riskLevel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  onClick={() =>
                                    handleSecurityAction(
                                      log.id,
                                      log.userId,
                                      "Warn",
                                    )
                                  }
                                  className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/20 text-xs transition-colors"
                                >
                                  ⚠️ Warn User
                                </button>
                                <button
                                  onClick={() =>
                                    handleSecurityAction(
                                      log.id,
                                      log.userId,
                                      "Ban",
                                    )
                                  }
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-xs transition-colors"
                                >
                                  🚫 Ban User
                                </button>
                                <button
                                  onClick={() =>
                                    handleSecurityAction(
                                      log.id,
                                      log.userId,
                                      "Whitelist",
                                    )
                                  }
                                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20 text-xs transition-colors"
                                >
                                  🟢 Whitelist User
                                </button>
                                <button
                                  onClick={() =>
                                    handleSecurityAction(log.id, null, "Ignore")
                                  }
                                  className="px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 rounded border border-slate-500/20 text-xs transition-colors"
                                >
                                  ❌ Ignore Alert
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  <div className="mb-4">
                    {securityTab === "User Security" &&
                      "Detecting Multiple Accounts, Duplicate Devices, Duplicate Telegram IDs, and Repeated Abuse Attempts..."}
                    {securityTab === "Referral Protection" &&
                      "Detecting Self Referrals, Circular Referrals, Duplicate Referrals, and Fake Referral Chains..."}
                    {securityTab === "Reward Protection" &&
                      "Preventing Duplicate Reward Claims, Task Abuse, Multi-Account Reward Farming, and Repeated Task Completions..."}
                    {securityTab === "Bonus Protection" &&
                      "Preventing Multiple Daily Claims, Spin Abuse, and Bonus Farming..."}
                    {securityTab === "VPN Detection" &&
                      "Status: 🟢 Clean | ⚠️ Possible VPN | 🚨 High Risk VPN"}
                    {securityTab === "Device Detection" &&
                      "Tracking Device ID, Browser Fingerprint, Platform, and Last Active..."}
                  </div>
                  <p className="text-sm italic">
                    Detailed view for {securityTab} is actively monitoring but
                    no suspicious records matched the current filter.
                  </p>
                </div>
              )}

              {securityTab === "Overview" && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Security Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                      <p className="text-sm text-slate-400 uppercase">
                        🚨 Total Alerts
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {securityStats.totalAlerts || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                      <p className="text-sm text-slate-400 uppercase">
                        🚫 Total Bans
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {securityStats.totalBans || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                      <p className="text-sm text-slate-400 uppercase">
                        ⚠️ Pending Reviews
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {securityStats.pendingReviews || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                      <p className="text-sm text-slate-400 uppercase">
                        🟢 Whitelisted Users
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {securityStats.whitelistedUsers || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "📜 Activity Logs" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📜 Admin Activity Logs
                </h2>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <button
                    onClick={() => setActivityLogTab("📋 View Logs")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${activityLogTab === "📋 View Logs" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📋 View Logs
                  </button>
                  <button
                    onClick={() => setActivityLogTab("🔍 Search Logs")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${activityLogTab === "🔍 Search Logs" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🔍 Search Logs
                  </button>
                  <button
                    onClick={() => setActivityLogTab("📊 Statistics")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${activityLogTab === "📊 Statistics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📊 Statistics
                  </button>
                  <button
                    onClick={() => alert("Exporting PDF...")}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 font-medium rounded-xl transition-all border border-emerald-600/30 text-sm"
                  >
                    📥 Export Logs
                  </button>
                  <button
                    onClick={fetchActivityLogs}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {activityLogsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : activityLogTab === "📋 View Logs" ? (
                <div className="space-y-4">
                  {activityLogs.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                      No activity logs found.
                    </div>
                  ) : (
                    activityLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <span>
                            🕒{" "}
                            {new Date(log.createdAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-slate-300">
                            👤 {log.adminName || "Admin"}
                          </span>
                        </div>
                        <h4 className="text-white font-bold mb-1 flex items-center gap-2">
                          {log.actionDesc || log.action}
                        </h4>
                        {log.targetId && (
                          <div className="text-sm text-slate-400 mt-2 bg-slate-950 inline-block px-3 py-1.5 rounded-lg border border-slate-800">
                            <span className="opacity-70">
                              {log.targetType || "Target"} ID:
                            </span>{" "}
                            <span className="font-mono text-indigo-400">
                              {log.targetId}
                            </span>
                          </div>
                        )}
                        {log.description && (
                          <p className="text-sm text-slate-300 mt-2">
                            {log.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : activityLogTab === "🔍 Search Logs" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="mb-6 flex gap-3">
                    <input
                      type="text"
                      placeholder="Search by User ID, Username, Ticket ID, Announcement ID..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      value={activityLogSearch}
                      onChange={(e) => setActivityLogSearch(e.target.value)}
                    />
                    <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20">
                      Search
                    </button>
                  </div>
                  <div className="space-y-4">
                    {activityLogs
                      .filter(
                        (log: any) =>
                          !activityLogSearch ||
                          (log.targetId &&
                            log.targetId.includes(activityLogSearch)) ||
                          (log.actionDesc &&
                            log.actionDesc
                              .toLowerCase()
                              .includes(activityLogSearch.toLowerCase())) ||
                          (log.description &&
                            log.description
                              .toLowerCase()
                              .includes(activityLogSearch.toLowerCase())),
                      )
                      .map((log: any) => (
                        <div
                          key={log.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                            <span>
                              🕒 {new Date(log.createdAt).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-slate-300">
                              👤 {log.adminName || "Admin"}
                            </span>
                          </div>
                          <h4 className="text-white font-medium">
                            {log.actionDesc || log.action}
                          </h4>
                          {log.targetId && (
                            <div className="text-xs text-slate-500 mt-1">
                              {log.targetType || "ID"}: {log.targetId}
                            </div>
                          )}
                        </div>
                      ))}
                    {activityLogs.filter(
                      (log: any) =>
                        !activityLogSearch ||
                        (log.targetId &&
                          log.targetId.includes(activityLogSearch)) ||
                        (log.actionDesc &&
                          log.actionDesc
                            .toLowerCase()
                            .includes(activityLogSearch.toLowerCase())) ||
                        (log.description &&
                          log.description
                            .toLowerCase()
                            .includes(activityLogSearch.toLowerCase())),
                    ).length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        No logs match your search.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        👤 Total Admin Actions
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {activityLogsStats.totalActions || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        📅 Today's Actions
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {activityLogsStats.todayActions || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        📅 Weekly Actions
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {activityLogsStats.weeklyActions || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        📅 Monthly Actions
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {activityLogsStats.monthlyActions || 0}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Most Common Action
                      </h3>
                      <p className="text-xl font-bold text-indigo-400">
                        {activityLogsStats.mostCommonAction || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Most Active Admin
                      </h3>
                      <p className="text-xl font-bold text-emerald-400">
                        {activityLogsStats.mostActiveAdmin || "Admin"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "📥 Backup & Restore" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📥 Backup & Restore Center
                </h2>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <button
                    onClick={() => setBackupTab("📦 Create Backup")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${backupTab === "📦 Create Backup" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📦 Create Backup
                  </button>
                  <button
                    onClick={() => setBackupTab("📂 View Backups")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${backupTab === "📂 View Backups" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    📂 View Backups
                  </button>
                  <button
                    onClick={() => setBackupTab("⚙️ Automatic Backup")}
                    className={`px-4 py-2 font-medium rounded-xl transition-all text-sm ${backupTab === "⚙️ Automatic Backup" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    ⚙️ Automatic Backup
                  </button>
                  <button
                    onClick={fetchBackups}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    📦 Total Backups
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {backups.length}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    📅 Last Backup Date
                  </p>
                  <p className="text-lg font-bold text-white mt-2">
                    {backups.length > 0
                      ? new Date(backups[0].backupDate).toLocaleDateString()
                      : "None"}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    💾 Backup Storage Used
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {backups
                      .reduce(
                        (acc, b) => acc + parseFloat(b.backupSize || "0"),
                        0,
                      )
                      .toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              </div>

              {backupLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : backupTab === "📦 Create Backup" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Create Manual Backup
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Create a secure snapshot of your current database state.
                    This backup will include:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <span className="text-sm font-medium text-white">
                        Users
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <span className="text-sm font-medium text-white">
                        Balances
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">💸</span>
                      <span className="text-sm font-medium text-white">
                        Withdrawals
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">🎫</span>
                      <span className="text-sm font-medium text-white">
                        Support Tickets
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">📢</span>
                      <span className="text-sm font-medium text-white">
                        Announcements
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <span className="text-sm font-medium text-white">
                        Reward Tasks
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">🎁</span>
                      <span className="text-sm font-medium text-white">
                        Daily Bonus Data
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <span className="text-2xl">⚙️</span>
                      <span className="text-sm font-medium text-white">
                        System Settings
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCreateBackup}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">📦</span> Start Full Backup
                    </button>
                  </div>
                </div>
              ) : backupTab === "📂 View Backups" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Backup ID</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-8 text-slate-500"
                            >
                              No backups found.
                            </td>
                          </tr>
                        ) : (
                          backups.map((bkp: any) => (
                            <tr
                              key={bkp.id}
                              className="border-b border-slate-800/50 hover:bg-slate-800/20"
                            >
                              <td className="px-4 py-3 font-mono text-indigo-400">
                                {bkp.backupId}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {new Date(bkp.backupDate).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {bkp.backupSize}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${bkp.backupType === "Auto" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}
                                >
                                  {bkp.backupType}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${bkp.backupStatus === "Completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}
                                >
                                  {bkp.backupStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  onClick={() =>
                                    alert(JSON.stringify(bkp, null, 2))
                                  }
                                  className="px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 rounded border border-slate-500/20 text-xs transition-colors"
                                >
                                  👁 View
                                </button>
                                <button
                                  onClick={() =>
                                    handleRestoreBackup(bkp.id, bkp.backupId)
                                  }
                                  className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded border border-orange-500/20 text-xs transition-colors"
                                >
                                  📤 Restore
                                </button>
                                <button
                                  onClick={() => handleDeleteBackup(bkp.id)}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-xs transition-colors"
                                >
                                  🗑 Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">
                    Automatic Backup Settings
                  </h3>

                  <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <h4 className="font-medium text-white mb-1">
                          Enable Auto Backup
                        </h4>
                        <p className="text-sm text-slate-400">
                          Automatically create backups on a schedule.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={backupSettings.autoBackupEnabled}
                          onChange={(e) =>
                            setBackupSettings({
                              ...backupSettings,
                              autoBackupEnabled: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Backup Frequency
                        </label>
                        <select
                          value={backupSettings.backupFrequency}
                          onChange={(e) =>
                            setBackupSettings({
                              ...backupSettings,
                              backupFrequency: e.target.value,
                            })
                          }
                          disabled={!backupSettings.autoBackupEnabled}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        >
                          <option value="Daily">📅 Daily</option>
                          <option value="Weekly">📅 Weekly</option>
                          <option value="Monthly">📅 Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Backup Retention Days
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={backupSettings.retentionDays}
                          onChange={(e) =>
                            setBackupSettings({
                              ...backupSettings,
                              retentionDays: parseInt(e.target.value) || 30,
                            })
                          }
                          disabled={!backupSettings.autoBackupEnabled}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          Backups older than this number of days will be
                          automatically deleted.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() =>
                          handleUpdateBackupSettings(backupSettings)
                        }
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                      >
                        💾 Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "💰 Monetag Postback" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Monetag Postback Settings
                    </h2>
                    <p className="text-sm text-slate-400">
                      Manage your Server-Side Postback integration
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={testMonetagPostback}
                    disabled={monetagTesting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                  >
                    {monetagTesting ? "⏳ Testing..." : "🚀 Test Endpoint"}
                  </button>
                  <button
                    onClick={fetchMonetagStats}
                    disabled={monetagStatsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                  >
                    🔄 Refresh Stats
                  </button>
                </div>
              </div>

              {monetagStatsLoading && !monetagStats ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Stats & Settings */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* URL Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors"></div>

                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        🔗 Server-Side Postback URL
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Copy this URL and paste it into your Monetag Dashboard
                        under{" "}
                        <span className="text-blue-400 font-mono">
                          Settings → Postback
                        </span>
                        .
                      </p>

                      <div className="relative group">
                        <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-12 text-blue-400 font-mono text-xs break-all leading-relaxed h-32 overflow-y-auto scrollbar-hide">
                          {monetagStats?.postbackUrl ||
                            "Loading postback URL..."}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              monetagStats?.postbackUrl || "",
                            );
                            alert("Postback URL copied to clipboard!");
                          }}
                          className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 shadow-xl"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                            Live & Ready
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                          <ShieldAlert size={14} className="text-blue-400" />
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                            Secure Verification
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/30 transition-colors">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Total Postbacks
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {monetagStats?.globalStats?.totalPostbacks || 0}
                        </p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/30 transition-colors">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Successful
                        </p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {monetagStats?.globalStats?.successCount || 0}
                        </p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/30 transition-colors">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Today's Revenue
                        </p>
                        <p className="text-2xl font-bold text-blue-400">
                          $
                          {(
                            monetagStats?.todayStats?.totalRevenue || 0
                          ).toFixed(4)}
                        </p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/30 transition-colors">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Today's Rewards
                        </p>
                        <p className="text-2xl font-bold text-amber-400">
                          {monetagStats?.todayStats?.totalRewards || 0}
                        </p>
                      </div>
                    </div>

                    {/* Test Result Section */}
                    <AnimatePresence>
                      {monetagTestResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`p-6 border rounded-3xl ${monetagTestResult.success ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4
                              className={`font-bold ${monetagTestResult.success ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {monetagTestResult.success
                                ? "✅ Test Successful"
                                : "❌ Test Failed"}
                            </h4>
                            <button
                              onClick={() => setMonetagTestResult(null)}
                              className="text-slate-500 hover:text-white transition-colors"
                            >
                              <Zap className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                          <div className="bg-black/40 rounded-xl p-4 font-mono text-xs space-y-2 overflow-x-auto">
                            <p>
                              <span className="text-slate-500">Status:</span>{" "}
                              <span
                                className={
                                  monetagTestResult.success
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }
                              >
                                {monetagTestResult.status}
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-500">Response:</span>{" "}
                              <span className="text-blue-300">
                                {monetagTestResult.response}
                              </span>
                            </p>
                            <p className="text-[10px] opacity-50">
                              <span className="text-slate-500">Test URL:</span>{" "}
                              {monetagTestResult.testUrl}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Macros Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-4">
                        Processed Macros
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          {
                            name: "telegram_id",
                            desc: "User Unique ID from Telegram",
                          },
                          {
                            name: "ymid",
                            desc: "Monetag Unique Click/Event ID",
                          },
                          { name: "zone_id", desc: "Advertising Zone ID" },
                          {
                            name: "event_type",
                            desc: "Type of event (ad_completed)",
                          },
                          {
                            name: "reward_event_type",
                            desc: "Verification status (yes/no)",
                          },
                          {
                            name: "estimated_price",
                            desc: "Estimated revenue generated",
                          },
                          {
                            name: "request_var",
                            desc: "Custom variable (Task ID)",
                          },
                        ].map((m) => (
                          <div
                            key={m.name}
                            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800/50 rounded-xl"
                          >
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                              <CheckCircle2
                                size={14}
                                className="text-blue-400"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                {m.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {m.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LIVE SDK DEBUGGER */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl border-l-4 border-l-amber-500">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          🔍 Live Monetag SDK Debugger
                        </h3>
                        <div className="px-2 py-1 bg-amber-500/10 rounded text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">
                          Live Session
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">
                            Telegram Identity
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                typeof Telegram:
                              </span>
                              <span className="text-xs font-mono font-bold text-blue-400">
                                {typeof (window as any).Telegram}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                typeof WebApp:
                              </span>
                              <span className="text-xs font-mono font-bold text-blue-400">
                                {typeof (window as any).Telegram?.WebApp}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                TG Version:
                              </span>
                              <span className="text-xs font-mono font-bold text-blue-400">
                                {(window as any).Telegram?.WebApp?.version ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                TG Platform:
                              </span>
                              <span className="text-xs font-mono font-bold text-blue-400">
                                {(window as any).Telegram?.WebApp?.platform ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-2">
                              <span className="text-xs text-slate-400 font-bold">
                                User ID:
                              </span>
                              <span
                                className={`text-xs font-mono font-bold ${(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ? "text-emerald-400" : "text-red-400"}`}
                              >
                                {(window as any).Telegram?.WebApp
                                  ?.initDataUnsafe?.user?.id || "NOT DETECTED"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                Environment:
                              </span>
                              <span
                                className={`text-xs font-bold ${(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ? "text-emerald-400" : "text-red-400"}`}
                              >
                                {(window as any).Telegram?.WebApp
                                  ?.initDataUnsafe?.user?.id
                                  ? "Telegram Mini App"
                                  : "Browser/Desktop"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">
                            SDK Availability
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                Rewarded SDK:
                              </span>
                              <span
                                className={`text-xs font-bold ${typeof (window as any).show_11210088 === "function" ? "text-emerald-400" : "text-slate-600"}`}
                              >
                                {typeof (window as any).show_11210088 ===
                                "function"
                                  ? "✅ Loaded (11210088)"
                                  : "❌ Not Loaded"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">
                                Postback Ready:
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                ✅ Enabled
                              </span>
                            </div>
                            <div className="pt-2 border-t border-slate-800 mt-2">
                              <p className="text-[10px] text-slate-500 uppercase mb-1">
                                User Object
                              </p>
                              <div className="bg-black/40 p-2 rounded text-[9px] font-mono text-blue-300 overflow-x-auto">
                                {JSON.stringify(
                                  (window as any).Telegram?.WebApp
                                    ?.initDataUnsafe?.user || "No User Object",
                                  null,
                                  2,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Raw initData
                            </p>
                            <span className="text-[10px] text-slate-600 font-mono">
                              ENCODED STRING
                            </span>
                          </div>
                          <div className="bg-black/60 rounded-xl p-4 font-mono text-[9px] text-emerald-500/80 max-h-20 overflow-y-auto scrollbar-hide border border-slate-800">
                            {(window as any).Telegram?.WebApp?.initData ||
                              "Empty"}
                          </div>
                        </div>
                        <div className="group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Raw initDataUnsafe
                            </p>
                            <span className="text-[10px] text-slate-600 font-mono">
                              JSON
                            </span>
                          </div>
                          <div className="bg-black/60 rounded-xl p-4 font-mono text-[9px] text-emerald-500/80 max-h-40 overflow-y-auto scrollbar-hide border border-slate-800 group-hover:border-slate-700 transition-colors">
                            <pre>
                              {JSON.stringify(
                                (window as any).Telegram?.WebApp
                                  ?.initDataUnsafe || {
                                  error: "No Telegram context",
                                },
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        </div>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                          <h4 className="text-xs font-bold text-amber-500 mb-3 flex items-center gap-2">
                            💡 SDK Integration Checklist
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div
                                className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ? "bg-emerald-500" : "bg-red-500"}`}
                              ></div>
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                <span className="font-bold text-white">
                                  Telegram ID Check:
                                </span>{" "}
                                {(window as any).Telegram?.WebApp
                                  ?.initDataUnsafe?.user?.id
                                  ? "Successfully identified as numeric ID. Postback will be attributed correctly."
                                  : 'MISSING ID. Monetag will receive "{ext_id}" or "Unknown", which will FAIL verification.'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div
                                className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${typeof (window as any).show_11210088 === "function" ? "bg-emerald-500" : "bg-slate-600"}`}
                              ></div>
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                <span className="font-bold text-white">
                                  SDK Show Function:
                                </span>{" "}
                                {typeof (window as any).show_11210088 ===
                                "function"
                                  ? "Function window.show_11210088 is globally available and ready to trigger rewarded ads."
                                  : "SDK not found. Ensure you are using the official Monetag script for Mini Apps."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Recent Events */}
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full max-h-[800px]">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        🕒 Recent Postback Events
                      </h3>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                        {monetagStats?.recentEvents?.length > 0 ? (
                          monetagStats.recentEvents.map((event: any) => {
                            // Resolve raw user ID using priority:
                            // 1. telegram_id
                            // 2. userId
                            // 3. ext_id (only if it is not empty and not equal to "{ext_id}")
                            // Otherwise Unknown
                            let rawId = null;
                            if (event.params?.telegram_id) {
                              rawId = event.params.telegram_id;
                            } else if (event.userId) {
                              rawId = event.userId;
                            } else if (event.params?.userId) {
                              rawId = event.params.userId;
                            } else if (
                              event.params?.ext_id &&
                              event.params.ext_id !== "{ext_id}" &&
                              event.params.ext_id.trim() !== ""
                            ) {
                              rawId = event.params.ext_id;
                            }

                            let displayUser = "Unknown";
                            if (rawId) {
                              const idStr = String(rawId).trim();
                              const matchedUser = users?.find((usr: any) => {
                                return (
                                  String(usr.id).trim() === idStr ||
                                  String(usr.telegramId).trim() === idStr ||
                                  String(usr.userId).trim() === idStr
                                );
                              });

                              if (matchedUser) {
                                const fullName =
                                  `${matchedUser.firstName || matchedUser.name || ""} ${matchedUser.lastName || ""}`.trim() ||
                                  "Anonymous";
                                const usernameDisplay = matchedUser.username
                                  ? ` (@${matchedUser.username})`
                                  : "";
                                displayUser = `${fullName}${usernameDisplay} - ${matchedUser.telegramId || matchedUser.id}`;
                              } else {
                                displayUser = idStr;
                              }
                            }

                            return (
                              <div
                                key={event.id}
                                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all group"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      event.status === "success"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : event.status === "failed"
                                          ? "bg-red-500/10 text-red-400"
                                          : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    {event.status}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(
                                      event.timestamp,
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 font-bold mb-1">
                                  User: {displayUser}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                                  <div className="text-slate-500">
                                    Reward:{" "}
                                    <span className="text-emerald-400 font-bold">
                                      {event.rewardAmount || 0}
                                    </span>
                                  </div>
                                  <div className="text-slate-500">
                                    Rev:{" "}
                                    <span className="text-blue-400 font-bold">
                                      ${event.params?.estimated_price || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-800/50">
                                  <p className="text-[8px] text-slate-500 font-mono mb-1">
                                    Payload:
                                  </p>
                                  <pre className="text-[8px] text-slate-400 bg-black/40 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(event.params, null, 2)}
                                  </pre>
                                  {event.error && (
                                    <p className="text-[8px] text-red-500 mt-1 font-bold">
                                      Error: {event.error}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10">
                            <p className="text-slate-500 text-sm italic">
                              No events received yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <Info size={16} /> Integration Help
                      </h4>
                      <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                        Server-Side Postback (SSP) is the most secure way to
                        verify user rewards. It prevents users from bypassing
                        ads using browser scripts.
                      </p>
                      <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <ExternalLink size={14} /> Documentation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "📥 Google Drive Accounts" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Download className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Google Drive Connected Accounts
                    </h2>
                    <p className="text-sm text-slate-400">
                      Manage and monitor linked Google Drive accounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchGoogleDriveAccounts}
                  disabled={googleDriveLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 disabled:opacity-50"
                >
                  🔄 Refresh List
                </button>
              </div>

              {googleDriveError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                  ⚠️ {googleDriveError}
                </div>
              )}

              {googleDriveLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-4">Telegram ID</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Gmail Address</th>
                          <th className="px-6 py-4">Connected Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                        {googleDriveAccounts.length > 0 ? (
                          googleDriveAccounts.map((account) => (
                            <tr
                              key={account.id}
                              className="hover:bg-slate-800/20 transition-colors"
                            >
                              <td className="px-6 py-4 font-mono font-medium text-slate-400">
                                {account.userId || account.id}
                              </td>
                              <td className="px-6 py-4 font-semibold text-white">
                                {account.name}
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-300">
                                {account.email}
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {account.connectedAt}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                    account.status === "connected"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${account.status === "connected" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}
                                  ></span>
                                  {account.status === "connected"
                                    ? "Connected"
                                    : "Disconnected"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {account.status === "connected" && (
                                  <button
                                    onClick={() =>
                                      handleDisconnectGoogleDrive(account.id)
                                    }
                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 text-xs font-semibold rounded-lg hover:text-white transition-all border border-rose-500/20"
                                  >
                                    Disconnect
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-12 text-slate-500 italic"
                            >
                              No connected Google Drive accounts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "🤖 Telegram Login Settings" && (
            <TelegramLoginSettingsAdmin />
          )}
          {activeTab === "⚙️ System Settings" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  ⚙️ RoyShare System Settings
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveSystemSettings(systemSettings)}
                    disabled={systemSettingsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                  >
                    💾 Save Settings
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Reset to default?")) {
                        const defaults = {
                          botSettings: {},
                          earningSettings: {},
                          withdrawalSettings: {},
                          referralSettings: {},
                          bonusSettings: {},
                          notificationSettings: {},
                          websiteSettings: {},
                          maintenanceMode: "🟢 OFF",
                        };
                        saveSystemSettings(defaults);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                  >
                    🔄 Restore Defaults
                  </button>
                </div>
              </div>

              {systemSettingsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-64 space-y-1">
                    {[
                      "🤖 Bot Settings",
                      "💰 Earnings Settings",
                      "💸 Withdrawal Settings",
                      "👥 Referral Settings",
                      "🎁 Bonus Settings",
                      "📢 Notification Settings",
                      "🌐 Website Settings",
                      "🎫 Support Settings",
                      "🤖 AI Settings",
                      "🔗 URL Shortener",
                      "🔄 Maintenance Mode",
                    ].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSettingsTab(tab)}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${settingsTab === tab ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                      {settingsTab}
                    </h3>

                    {settingsTab === "🤖 Bot Settings" && (
                      <div className="space-y-6">
                        {telegramFeedback && (
                          <div className="p-4 bg-slate-800 rounded-xl text-white text-sm whitespace-pre-wrap flex justify-between items-center border border-indigo-500/30">
                            <span>{telegramFeedback}</span>
                            <button
                              onClick={() => setTelegramFeedback("")}
                              className="text-slate-400 hover:text-white font-bold ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Top Read Only Webhook Panel */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                              Automatic Webhook URL (Read-Only)
                            </span>
                            <code className="text-sm font-mono text-slate-300 select-all break-all">
                              https://www.royshare.online/api/telegram/webhook
                            </code>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                "https://www.royshare.online/api/telegram/webhook",
                              );
                              setTelegramFeedback(
                                "📋 Webhook URL Copied to Clipboard!",
                              );
                              setTimeout(() => setTelegramFeedback(""), 2000);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg font-medium transition-colors border border-slate-700 shrink-0"
                          >
                            📋 Copy Link
                          </button>
                        </div>

                        {/* Config Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Bot Token
                            </label>
                            <div className="relative">
                              <input
                                type={showBotToken ? "text" : "password"}
                                value={telegramConfigs.botToken}
                                onChange={(e) =>
                                  setTelegramConfigs({
                                    ...telegramConfigs,
                                    botToken: e.target.value,
                                  })
                                }
                                placeholder="1234567890:ABCdefGhI..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowBotToken(!showBotToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-medium"
                              >
                                {showBotToken ? "👁️ Hide" : "👁️ Show"}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Admin Chat ID
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.chatId}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  chatId: e.target.value,
                                })
                              }
                              placeholder="e.g. 987654321"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Private Storage Channel ID
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.storageChannelId}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  storageChannelId: e.target.value,
                                })
                              }
                              placeholder="e.g. -1001234567890"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Support Username
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.supportUsername}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  supportUsername: e.target.value,
                                })
                              }
                              placeholder="e.g. @RoyShareSupport"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Public Channel Username
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.channelUsername}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  channelUsername: e.target.value,
                                })
                              }
                              placeholder="e.g. @royshare_official"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Group Username
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.groupUsername}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  groupUsername: e.target.value,
                                })
                              }
                              placeholder="e.g. @RoyShareCommunity"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Bot Name
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.botName}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  botName: e.target.value,
                                })
                              }
                              placeholder="e.g. RoyShare Bot"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              Bot Username
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.botUsername}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  botUsername: e.target.value,
                                })
                              }
                              placeholder="e.g. @royshare_bot"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Core Save Settings & Run Diagnostics Button Toolbar */}
                        <div className="border-t border-slate-800 pt-6 space-y-4">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                            Control Panel Utilities
                          </h4>

                          <div className="flex flex-wrap gap-3">
                            {/* Database Operations */}
                            <button
                              onClick={saveTelegramSettings}
                              disabled={telegramLoading}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all"
                            >
                              💾{" "}
                              {telegramLoading ? "Saving..." : "Save Settings"}
                            </button>

                            {/* Diagnostics */}
                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "runDiagnostics",
                                  "/api/telegram/diagnostics",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["runDiagnostics"]}
                              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-950/20 transition-all"
                            >
                              🔍{" "}
                              {actionLoading["runDiagnostics"]
                                ? "Diagnosing..."
                                : "Run Full Diagnostics"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "runDiagnostics",
                                  "/api/telegram/diagnostics",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["runDiagnostics"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-all border border-slate-700 text-sm font-medium"
                            >
                              🔄{" "}
                              {actionLoading["runDiagnostics"]
                                ? "Refreshing..."
                                : "Refresh Diagnostics"}
                            </button>

                            {/* Webhook Operations */}
                            <button
                              onClick={handleSetWebhook}
                              disabled={actionLoading["setWebhook"]}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 rounded-xl transition-all border border-indigo-500/20 text-sm font-medium"
                            >
                              📡{" "}
                              {actionLoading["setWebhook"]
                                ? "Connecting..."
                                : "Set Webhook"}
                            </button>

                            <button
                              onClick={handleSetWebhook}
                              disabled={actionLoading["setWebhook"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 text-sm font-medium"
                            >
                              🔄{" "}
                              {actionLoading["setWebhook"]
                                ? "Refreshing..."
                                : "Refresh Webhook"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "deleteWebhook",
                                  "/api/telegram/webhook/delete",
                                  { botToken: telegramConfigs.botToken },
                                )
                              }
                              disabled={actionLoading["deleteWebhook"]}
                              className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-950/70 text-red-400 rounded-xl transition-all border border-red-500/20 text-sm font-medium"
                            >
                              🗑️{" "}
                              {actionLoading["deleteWebhook"]
                                ? "Removing..."
                                : "Delete Webhook"}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {/* Individual Tests */}
                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "sendTestMessage",
                                  "/api/telegram/send-test",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["sendTestMessage"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                            >
                              💬{" "}
                              {actionLoading["sendTestMessage"]
                                ? "Sending..."
                                : "Send Test Message"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "testChannel",
                                  "/api/telegram/test-channel",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["testChannel"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                            >
                              📢{" "}
                              {actionLoading["testChannel"]
                                ? "Testing..."
                                : "Test Channel"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "testGroup",
                                  "/api/telegram/test-group",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["testGroup"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                            >
                              👥{" "}
                              {actionLoading["testGroup"]
                                ? "Testing..."
                                : "Test Group"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "testUpload",
                                  "/api/telegram/test-upload",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["testUpload"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                            >
                              📤{" "}
                              {actionLoading["testUpload"]
                                ? "Uploading..."
                                : "Test Upload"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "testDownload",
                                  "/api/telegram/test-download",
                                  telegramConfigs,
                                )
                              }
                              disabled={actionLoading["testDownload"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                            >
                              📥{" "}
                              {actionLoading["testDownload"]
                                ? "Downloading..."
                                : "Test Download"}
                            </button>

                            <button
                              onClick={() =>
                                runTelegramAction(
                                  "clearCache",
                                  "/api/admin/clear-cache",
                                  {},
                                )
                              }
                              disabled={actionLoading["clearCache"]}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-red-900/30 hover:bg-red-950/10 text-slate-400 rounded-xl text-sm font-medium"
                            >
                              🧹{" "}
                              {actionLoading["clearCache"]
                                ? "Clearing..."
                                : "Clear Cache"}
                            </button>
                          </div>
                        </div>

                        {/* Diagnostics Cockpit Panel */}
                        {diagnosticsReport && (
                          <div className="border-t border-slate-800 pt-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                📡 Connection Diagnostics Cockpit
                              </h4>
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() =>
                                    runTelegramAction(
                                      "runDiagnostics",
                                      "/api/telegram/diagnostics",
                                      telegramConfigs,
                                    )
                                  }
                                  disabled={actionLoading["runDiagnostics"]}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-white rounded-lg font-medium transition-colors border border-slate-700"
                                >
                                  🔄{" "}
                                  {actionLoading["runDiagnostics"]
                                    ? "Refreshing..."
                                    : "Refresh Diagnostics"}
                                </button>
                                <span
                                  className={`px-4 py-1.5 rounded-full text-xs font-bold ${diagnosticsReport.overallStatus.includes("OPERATIONAL") ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
                                >
                                  {diagnosticsReport.overallStatus}
                                </span>
                              </div>
                            </div>

                            {/* Errors list if any */}
                            {diagnosticsReport.errors &&
                              diagnosticsReport.errors.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
                                  <h5 className="text-sm font-bold text-red-400">
                                    ⚠️ System Failures Found
                                  </h5>
                                  <ul className="list-disc pl-5 space-y-1 text-xs text-red-300 font-mono">
                                    {diagnosticsReport.errors.map(
                                      (err: string, idx: number) => (
                                        <li key={idx}>{err}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                            {/* System Status Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {Object.entries(diagnosticsReport.system).map(
                                ([sys, status]: any) => (
                                  <div
                                    key={sys}
                                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center"
                                  >
                                    <span className="text-xs text-slate-400 capitalize block mb-1">
                                      {sys.replace(/([A-Z])/g, " $1").trim()}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${status === "Online" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                                    >
                                      {status === "Online"
                                        ? "🟢 Online"
                                        : "🔴 Offline"}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Telegram Bot Panel */}
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                                <h5 className="font-bold text-indigo-400 border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                                  🤖 Telegram Bot
                                </h5>
                                <div className="space-y-1 font-mono text-xs text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Bot Name:
                                    </span>{" "}
                                    <span>{diagnosticsReport.bot.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Bot Username:
                                    </span>{" "}
                                    <span>
                                      {diagnosticsReport.bot.username}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Bot ID:
                                    </span>{" "}
                                    <span>{diagnosticsReport.bot.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Token Valid:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.bot.tokenValid ===
                                        "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.bot.tokenValid}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Connected:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.bot.connected ===
                                        "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.bot.connected}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Last Response:
                                    </span>{" "}
                                    <span className="text-slate-400">
                                      {diagnosticsReport.bot.lastResponse}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Webhook Panel */}
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                                <h5 className="font-bold text-indigo-400 border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                                  📡 Webhook Info
                                </h5>
                                <div className="space-y-1 font-mono text-xs text-slate-300">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-slate-500 shrink-0">
                                      Current URL:
                                    </span>{" "}
                                    <span
                                      className="truncate max-w-[200px]"
                                      title={diagnosticsReport.webhook.url}
                                    >
                                      {diagnosticsReport.webhook.url}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Connected:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.webhook.connected ===
                                        "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.webhook.connected}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Pending Updates:
                                    </span>{" "}
                                    <span>
                                      {diagnosticsReport.webhook.pendingUpdates}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Response Code:
                                    </span>{" "}
                                    <span>
                                      {
                                        diagnosticsReport.webhook
                                          .httpResponseCode
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <span className="text-slate-500 shrink-0">
                                      Last Telegram Error:
                                    </span>{" "}
                                    <span
                                      className="truncate max-w-[180px] text-red-400"
                                      title={
                                        diagnosticsReport.webhook.lastError
                                      }
                                    >
                                      {diagnosticsReport.webhook.lastError}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Storage Channel Panel */}
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                                <h5 className="font-bold text-indigo-400 border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                                  📦 Private Storage Channel
                                </h5>
                                <div className="space-y-1 font-mono text-xs text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Channel Found:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.privateStorage
                                          .channelFound === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {
                                        diagnosticsReport.privateStorage
                                          .channelFound
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Bot Admin:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.privateStorage
                                          .botAdmin === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {
                                        diagnosticsReport.privateStorage
                                          .botAdmin
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Upload Test:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.privateStorage
                                          .uploadTest === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {
                                        diagnosticsReport.privateStorage
                                          .uploadTest
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Download Test:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.privateStorage
                                          .downloadTest === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {
                                        diagnosticsReport.privateStorage
                                          .downloadTest
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Admin Chat ID & Resources Panel */}
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                                <h5 className="font-bold text-indigo-400 border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                                  👥 Group & Channels Status
                                </h5>
                                <div className="space-y-1 font-mono text-xs text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Admin Chat Valid:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.adminChat
                                          .chatIdValid === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.adminChat.chatIdValid}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Test Message Status:
                                    </span>{" "}
                                    <span>
                                      {
                                        diagnosticsReport.adminChat
                                          .testMessageStatus
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Public Channel Username:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.publicChannel
                                          .usernameFound === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {
                                        diagnosticsReport.publicChannel
                                          .usernameFound
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Public Channel Admin:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.publicChannel
                                          .botAdmin === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.publicChannel.botAdmin}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Group Username Found:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.group
                                          .usernameFound === "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.group.usernameFound}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      Group Bot Admin:
                                    </span>{" "}
                                    <span
                                      className={
                                        diagnosticsReport.group.botAdmin ===
                                        "Yes"
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {diagnosticsReport.group.botAdmin}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {settingsTab === "💰 Earnings Settings" && (
                      <div className="space-y-4 max-w-lg">
                        {[
                          "Minimum Reward Amount",
                          "Maximum Reward Amount",
                          "Reward Credit Delay",
                        ].map((field) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              {field}
                            </label>
                            <input
                              type="number"
                              value={
                                systemSettings?.earningSettings?.[field] || ""
                              }
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  earningSettings: {
                                    ...systemSettings.earningSettings,
                                    [field]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                        <div className="flex items-center gap-4 mt-6">
                          <label className="flex items-center gap-2 text-slate-300">
                            <input
                              type="radio"
                              name="earningsEnabled"
                              checked={
                                systemSettings?.earningSettings?.enabled ===
                                true
                              }
                              onChange={() =>
                                setSystemSettings({
                                  ...systemSettings,
                                  earningSettings: {
                                    ...systemSettings.earningSettings,
                                    enabled: true,
                                  },
                                })
                              }
                              className="w-4 h-4 text-indigo-600"
                            />
                            Enable Earnings
                          </label>
                          <label className="flex items-center gap-2 text-slate-300">
                            <input
                              type="radio"
                              name="earningsEnabled"
                              checked={
                                systemSettings?.earningSettings?.enabled ===
                                false
                              }
                              onChange={() =>
                                setSystemSettings({
                                  ...systemSettings,
                                  earningSettings: {
                                    ...systemSettings.earningSettings,
                                    enabled: false,
                                  },
                                })
                              }
                              className="w-4 h-4 text-indigo-600"
                            />
                            Disable Earnings
                          </label>
                        </div>
                      </div>
                    )}

                    {settingsTab === "💸 Withdrawal Settings" && (
                      <div className="space-y-4 max-w-lg">
                        {[
                          "Minimum Withdrawal",
                          "Maximum Withdrawal",
                          "Processing Time",
                        ].map((field) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              {field}
                            </label>
                            <input
                              type="text"
                              value={
                                systemSettings?.withdrawalSettings?.[field] ||
                                ""
                              }
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  withdrawalSettings: {
                                    ...systemSettings.withdrawalSettings,
                                    [field]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}

                        <div className="pt-6 mt-6 border-t border-slate-800">
                          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                            <span>📉 Withdrawal Tax Settings</span>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                              Automatic Refund
                            </span>
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">
                                Wrong UPI ID Tax (%)
                              </label>
                              <input
                                type="number"
                                value={
                                  systemSettings?.withdrawalTaxSettings
                                    ?.upiTax ?? 5
                                }
                                onChange={(e) =>
                                  setSystemSettings({
                                    ...systemSettings,
                                    withdrawalTaxSettings: {
                                      ...systemSettings.withdrawalTaxSettings,
                                      upiTax: parseFloat(e.target.value),
                                    },
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">
                                Wrong Bank Account Tax (%)
                              </label>
                              <input
                                type="number"
                                value={
                                  systemSettings?.withdrawalTaxSettings
                                    ?.bankTax ?? 10
                                }
                                onChange={(e) =>
                                  setSystemSettings({
                                    ...systemSettings,
                                    withdrawalTaxSettings: {
                                      ...systemSettings.withdrawalTaxSettings,
                                      bankTax: parseFloat(e.target.value),
                                    },
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">
                                Wrong USDT TRC20 Address Tax (%)
                              </label>
                              <input
                                type="number"
                                value={
                                  systemSettings?.withdrawalTaxSettings
                                    ?.usdtTax ?? 15
                                }
                                onChange={(e) =>
                                  setSystemSettings({
                                    ...systemSettings,
                                    withdrawalTaxSettings: {
                                      ...systemSettings.withdrawalTaxSettings,
                                      usdtTax: parseFloat(e.target.value),
                                    },
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                          <h4 className="font-bold text-white mb-4">
                            USDT (TRC20) Settings
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">
                                Network Fee (USDT)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  systemSettings?.withdrawalSettings
                                    ?.usdtNetworkFee ?? 1
                                }
                                onChange={(e) =>
                                  setSystemSettings({
                                    ...systemSettings,
                                    withdrawalSettings: {
                                      ...systemSettings.withdrawalSettings,
                                      usdtNetworkFee: parseFloat(
                                        e.target.value,
                                      ),
                                    },
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">
                                Market Adjustment Fee (%)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={
                                  systemSettings?.withdrawalSettings
                                    ?.usdtMarketAdjustmentPct ?? 5
                                }
                                onChange={(e) =>
                                  setSystemSettings({
                                    ...systemSettings,
                                    withdrawalSettings: {
                                      ...systemSettings.withdrawalSettings,
                                      usdtMarketAdjustmentPct: parseFloat(
                                        e.target.value,
                                      ),
                                    },
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-6">
                          <label className="flex items-center gap-2 text-slate-300">
                            <input
                              type="radio"
                              name="withdrawalsEnabled"
                              checked={
                                systemSettings?.withdrawalSettings?.enabled ===
                                true
                              }
                              onChange={() =>
                                setSystemSettings({
                                  ...systemSettings,
                                  withdrawalSettings: {
                                    ...systemSettings.withdrawalSettings,
                                    enabled: true,
                                  },
                                })
                              }
                              className="w-4 h-4 text-indigo-600"
                            />
                            Enable Withdrawals
                          </label>
                          <label className="flex items-center gap-2 text-slate-300">
                            <input
                              type="radio"
                              name="withdrawalsEnabled"
                              checked={
                                systemSettings?.withdrawalSettings?.enabled ===
                                false
                              }
                              onChange={() =>
                                setSystemSettings({
                                  ...systemSettings,
                                  withdrawalSettings: {
                                    ...systemSettings.withdrawalSettings,
                                    enabled: false,
                                  },
                                })
                              }
                              className="w-4 h-4 text-indigo-600"
                            />
                            Disable Withdrawals
                          </label>
                        </div>
                      </div>
                    )}

                    {settingsTab === "👥 Referral Settings" && (
                      <ReferralAdminManager systemSettings={systemSettings} setSystemSettings={setSystemSettings} />
                    )}

                    {settingsTab === "🎁 Bonus Settings" && bonusSettings && (
                      <div className="space-y-6">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-bold text-sm">
                              🎁 Daily Bonus Configuration
                            </h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                              Manage Wheel, Mystery Box, and Scratch Card
                              settings.
                            </p>
                          </div>
                          <button
                            onClick={() => saveBonusSettings(bonusSettings)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                          >
                            💾 Save All Settings
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                              Global Status
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  checked={
                                    bonusSettings?.dailyBonusEnabled === true
                                  }
                                  onChange={() =>
                                    setBonusSettings({
                                      ...bonusSettings,
                                      dailyBonusEnabled: true,
                                    })
                                  }
                                  className="w-4 h-4 text-indigo-600"
                                />{" "}
                                🟢 Enabled
                              </label>
                              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  checked={
                                    bonusSettings?.dailyBonusEnabled === false
                                  }
                                  onChange={() =>
                                    setBonusSettings({
                                      ...bonusSettings,
                                      dailyBonusEnabled: false,
                                    })
                                  }
                                  className="w-4 h-4 text-indigo-600"
                                />{" "}
                                🔴 Disabled
                              </label>
                            </div>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                              Daily Reset Time (HH:MM)
                            </label>
                            <input
                              type="time"
                              value={bonusSettings?.resetTime || "00:00"}
                              onChange={(e) =>
                                setBonusSettings({
                                  ...bonusSettings,
                                  resetTime: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                              Daily Budget (₹)
                            </label>
                            <input
                              type="number"
                              value={bonusSettings?.dailyBudget || 500}
                              onChange={(e) =>
                                setBonusSettings({
                                  ...bonusSettings,
                                  dailyBudget: parseFloat(e.target.value),
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* AI Generator Section */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm">
                                🤖 Smart AI Reward Generator
                              </h4>
                              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                                Balanced Distribution System
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                Min Reward
                              </label>
                              <input
                                type="number"
                                value={aiGenSettings.minReward}
                                onChange={(e) =>
                                  setAiGenSettings({
                                    ...aiGenSettings,
                                    minReward: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                Max Reward
                              </label>
                              <input
                                type="number"
                                value={aiGenSettings.maxReward}
                                onChange={(e) =>
                                  setAiGenSettings({
                                    ...aiGenSettings,
                                    maxReward: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                Slots
                              </label>
                              <input
                                type="number"
                                value={aiGenSettings.slots}
                                onChange={(e) =>
                                  setAiGenSettings({
                                    ...aiGenSettings,
                                    slots: parseInt(e.target.value),
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                Better Luck
                              </label>
                              <input
                                type="number"
                                value={aiGenSettings.betterLuckSlots}
                                onChange={(e) =>
                                  setAiGenSettings({
                                    ...aiGenSettings,
                                    betterLuckSlots:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                                Budget (₹)
                              </label>
                              <input
                                type="number"
                                value={aiGenSettings.dailyBudget}
                                onChange={(e) =>
                                  setAiGenSettings({
                                    ...aiGenSettings,
                                    dailyBudget: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAIGenerateRewards("wheel")}
                              disabled={generatingAI}
                              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase rounded-xl transition disabled:opacity-50"
                            >
                              Generate Wheel
                            </button>
                            <button
                              onClick={() => handleAIGenerateRewards("box")}
                              disabled={generatingAI}
                              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-xl transition disabled:opacity-50"
                            >
                              Generate Boxes
                            </button>
                            <button
                              onClick={() => handleAIGenerateRewards("scratch")}
                              disabled={generatingAI}
                              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase rounded-xl transition disabled:opacity-50"
                            >
                              Generate Scratch
                            </button>
                          </div>

                          {generatingAI && (
                            <div className="mt-4 p-3 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 text-xs font-medium flex items-center gap-2 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                              <span>
                                AI Generator is calculating optimal reward
                                distributions... Please wait...
                              </span>
                            </div>
                          )}

                          {aiGenMessage && (
                            <div
                              className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                aiGenMessage.type === "success"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : aiGenMessage.type === "warning"
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              }`}
                            >
                              <span>{aiGenMessage.text}</span>
                            </div>
                          )}
                          <div className="hidden"></div>
                        </div>

                        {/* Modular Settings */}
                        {["wheel", "box", "scratch"].map((type) => (
                          <div
                            key={type}
                            className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden"
                          >
                            <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                                {type === "wheel"
                                  ? "🎡 Wheel Spin"
                                  : type === "box"
                                    ? "📦 Mystery Box"
                                    : "🎫 Scratch Card"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  Status:
                                </span>
                                <button
                                  onClick={() =>
                                    setBonusSettings({
                                      ...bonusSettings,
                                      [type]: {
                                        ...(bonusSettings[type] || {}),
                                        enabled: !bonusSettings[type]?.enabled,
                                      },
                                    })
                                  }
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition ${bonusSettings[type]?.enabled ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-500"}`}
                                >
                                  {bonusSettings[type]?.enabled
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                                </button>
                              </div>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Daily Limit
                                  </label>
                                  <input
                                    type="number"
                                    value={bonusSettings[type]?.dailyLimit || 0}
                                    onChange={(e) =>
                                      setBonusSettings({
                                        ...bonusSettings,
                                        [type]: {
                                          ...(bonusSettings[type] || {}),
                                          dailyLimit: parseInt(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Cooldown (Minutes)
                                  </label>
                                  <input
                                    type="number"
                                    value={bonusSettings[type]?.cooldown || 0}
                                    onChange={(e) =>
                                      setBonusSettings({
                                        ...bonusSettings,
                                        [type]: {
                                          ...(bonusSettings[type] || {}),
                                          cooldown: parseInt(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Rewards Pool
                                  </label>
                                  <button
                                    onClick={() => {
                                      const newRewards = [
                                        ...(bonusSettings[type]?.rewards || []),
                                        {
                                          amount: 1,
                                          weight: 10,
                                          label: "₹1.00",
                                        },
                                      ];
                                      setBonusSettings({
                                        ...bonusSettings,
                                        [type]: {
                                          ...(bonusSettings[type] || {}),
                                          rewards: newRewards,
                                        },
                                      });
                                    }}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    + Add New Reward
                                  </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                  {(bonusSettings[type]?.rewards || [])
                                    .length === 0 && (
                                    <p className="text-[10px] text-slate-600 italic text-center py-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                                      No rewards added yet
                                    </p>
                                  )}
                                  {(bonusSettings[type]?.rewards || []).map(
                                    (reward: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex gap-2 items-center bg-slate-900/50 p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                                      >
                                        <div className="w-16">
                                          <input
                                            type="number"
                                            placeholder="Amt"
                                            value={reward.amount}
                                            onChange={(e) => {
                                              const newRewards = [
                                                ...bonusSettings[type].rewards,
                                              ];
                                              newRewards[idx].amount =
                                                parseFloat(e.target.value) || 0;
                                              setBonusSettings({
                                                ...bonusSettings,
                                                [type]: {
                                                  ...bonusSettings[type],
                                                  rewards: newRewards,
                                                },
                                              });
                                            }}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-emerald-400 font-bold focus:outline-none"
                                          />
                                        </div>
                                        <div className="w-16">
                                          <input
                                            type="number"
                                            placeholder="Weight"
                                            value={reward.weight}
                                            onChange={(e) => {
                                              const newRewards = [
                                                ...bonusSettings[type].rewards,
                                              ];
                                              newRewards[idx].weight =
                                                parseFloat(e.target.value) || 0;
                                              setBonusSettings({
                                                ...bonusSettings,
                                                [type]: {
                                                  ...bonusSettings[type],
                                                  rewards: newRewards,
                                                },
                                              });
                                            }}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <input
                                            type="text"
                                            placeholder="Label"
                                            value={reward.label}
                                            onChange={(e) => {
                                              const newRewards = [
                                                ...bonusSettings[type].rewards,
                                              ];
                                              newRewards[idx].label =
                                                e.target.value;
                                              setBonusSettings({
                                                ...bonusSettings,
                                                [type]: {
                                                  ...bonusSettings[type],
                                                  rewards: newRewards,
                                                },
                                              });
                                            }}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none"
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newRewards = bonusSettings[
                                              type
                                            ].rewards.filter(
                                              (_: any, i: number) => i !== idx,
                                            );
                                            setBonusSettings({
                                              ...bonusSettings,
                                              [type]: {
                                                ...bonusSettings[type],
                                                rewards: newRewards,
                                              },
                                            });
                                          }}
                                          className="text-red-500 hover:text-red-400 p-1.5 transition-colors"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            ></path>
                                          </svg>
                                        </button>
                                      </div>
                                    ),
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-500 mt-2 px-1">
                                  Probability is calculated as (Weight / Total
                                  Weights). Higher weight means higher chance.
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {settingsTab === "📢 Notification Settings" && (
                      <div className="space-y-4 max-w-lg">
                        {[
                          "Enable Bot Notifications",
                          "Enable Announcement Alerts",
                          "Enable Support Notifications",
                          "Enable Withdrawal Notifications",
                        ].map((field) => (
                          <label
                            key={field}
                            className="flex items-center gap-3 text-white bg-slate-950 p-4 rounded-xl border border-slate-800"
                          >
                            <input
                              type="checkbox"
                              checked={
                                systemSettings?.notificationSettings?.[
                                  field
                                ] === true
                              }
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  notificationSettings: {
                                    ...systemSettings.notificationSettings,
                                    [field]: e.target.checked,
                                  },
                                })
                              }
                              className="w-5 h-5 rounded text-indigo-600 bg-slate-900 border-slate-700"
                            />
                            {field}
                          </label>
                        ))}
                      </div>
                    )}

                    {settingsTab === "🌐 Website Settings" && (
                      <div className="space-y-4 max-w-lg">
                        {[
                          "Website Name",
                          "Website Logo",
                          "Website Footer Text",
                        ].map((field) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                              {field}
                            </label>
                            <input
                              type="text"
                              value={
                                systemSettings?.websiteSettings?.[field] || ""
                              }
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  websiteSettings: {
                                    ...systemSettings.websiteSettings,
                                    [field]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">
                            Website Description
                          </label>
                          <textarea
                            value={
                              systemSettings?.websiteSettings?.[
                                "Website Description"
                              ] || ""
                            }
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                websiteSettings: {
                                  ...systemSettings.websiteSettings,
                                  ["Website Description"]: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white h-24 resize-none focus:outline-none focus:border-indigo-500"
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {settingsTab === "🎫 Support Settings" && (
                      <div className="space-y-6 max-w-lg">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-bold text-sm">
                              🎫 Support Configuration
                            </h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                              Configure AI, Live Chat, and Contact Support
                              options.
                            </p>
                          </div>
                          <button
                            onClick={() => saveSupportSettings(supportSettings)}
                            disabled={supportSettingsLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                          >
                            {supportSettingsLoading
                              ? "Saving..."
                              : "💾 Save Settings"}
                          </button>
                        </div>

                        {/* AI Support Toggle */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <label className="block text-sm font-semibold text-white">
                                🤖 AI Support Assistant
                              </label>
                              <p className="text-xs text-slate-500">
                                Enable Gemini-powered AI help chat for users.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSupportSettings({
                                  ...supportSettings,
                                  aiEnabled: !supportSettings.aiEnabled,
                                })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${supportSettings.aiEnabled ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
                            >
                              {supportSettings.aiEnabled
                                ? "ENABLED"
                                : "DISABLED"}
                            </button>
                          </div>

                          {supportSettings.aiEnabled && (
                            <div className="space-y-1 pt-2 border-t border-slate-900">
                              <label className="block text-xs font-medium text-slate-400">
                                Gemini API Key (Optional Override)
                              </label>
                              <input
                                type="password"
                                value={supportSettings.geminiApiKey || ""}
                                onChange={(e) =>
                                  setSupportSettings({
                                    ...supportSettings,
                                    geminiApiKey: e.target.value,
                                  })
                                }
                                placeholder="Leaves blank to use process.env.GEMINI_API_KEY"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Live Chat Toggle */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                          <div>
                            <label className="block text-sm font-semibold text-white">
                              💬 Live Chat Support
                            </label>
                            <p className="text-xs text-slate-500">
                              Allow users to enter Live Chat box.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSupportSettings({
                                ...supportSettings,
                                liveChatEnabled:
                                  !supportSettings.liveChatEnabled,
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${supportSettings.liveChatEnabled ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
                          >
                            {supportSettings.liveChatEnabled
                              ? "ENABLED"
                              : "DISABLED"}
                          </button>
                        </div>

                        {/* Support Details */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                            📩 Contact Support Configuration
                          </h4>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Support Telegram Link / Username
                            </label>
                            <input
                              type="text"
                              value={supportSettings.supportTelegram || ""}
                              onChange={(e) =>
                                setSupportSettings({
                                  ...supportSettings,
                                  supportTelegram: e.target.value,
                                })
                              }
                              placeholder="@RoyShareSupport"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Support Email Address
                            </label>
                            <input
                              type="email"
                              value={supportSettings.supportEmail || ""}
                              onChange={(e) =>
                                setSupportSettings({
                                  ...supportSettings,
                                  supportEmail: e.target.value,
                                })
                              }
                              placeholder="support@royshare.com"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsTab === "🤖 AI Settings" && (
                      <div className="space-y-6 max-w-lg">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-bold text-sm">
                              🤖 AI Support Configuration
                            </h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                              Configure Gemini AI models and settings.
                            </p>
                          </div>
                          <button
                            onClick={() => saveSupportSettings(supportSettings)}
                            disabled={supportSettingsLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-900/20"
                          >
                            {supportSettingsLoading
                              ? "Saving..."
                              : "💾 Save Settings"}
                          </button>
                        </div>

                        {/* API Key and Model */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Gemini API Key
                            </label>
                            <div className="relative">
                              <input
                                type={showApiKey ? "text" : "password"}
                                value={supportSettings.geminiApiKey || ""}
                                onChange={(e) =>
                                  setSupportSettings({
                                    ...supportSettings,
                                    geminiApiKey: e.target.value,
                                  })
                                }
                                placeholder="Enter your Gemini API Key"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition text-xs font-semibold"
                              >
                                {showApiKey ? "🙈 Hide" : "👁 Show"}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Gemini Model
                            </label>
                            <select
                              value={
                                supportSettings.geminiModel ||
                                "gemini-1.5-flash"
                              }
                              onChange={(e) =>
                                setSupportSettings({
                                  ...supportSettings,
                                  geminiModel: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="gemini-1.5-flash">
                                gemini-1.5-flash (Balanced)
                              </option>
                              <option value="gemini-1.5-pro">
                                gemini-1.5-pro (High Quality)
                              </option>
                              <option value="gemini-1.0-pro">
                                gemini-1.0-pro (Fast)
                              </option>
                            </select>
                          </div>

                          <div className="pt-2 flex gap-3">
                            <button
                              type="button"
                              onClick={handleTestConnection}
                              disabled={testConnectionLoading}
                              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/30"
                            >
                              {testConnectionLoading
                                ? "⚡ Testing Connection..."
                                : "🔌 Test Connection"}
                            </button>
                          </div>

                          {testConnectionStatus && (
                            <div
                              className={`mt-3 p-3 rounded-xl border text-sm font-medium ${testConnectionStatus.includes("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                            >
                              {testConnectionStatus}
                            </div>
                          )}
                        </div>

                        {/* Diagnostics Panel */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                            <span>📊</span> AI Diagnostics & Status
                          </h4>
                          <div className="grid grid-cols-1 gap-3 text-xs">
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                API Key Saved
                              </span>
                              <span
                                className={`font-bold px-2 py-1 rounded ${supportSettings.geminiApiKey ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                              >
                                {supportSettings.geminiApiKey ? "Yes" : "No"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                Connection Status
                              </span>
                              <span className="font-bold text-white">
                                {supportSettings.connectionStatus ||
                                  "Not Checked"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                Model Name
                              </span>
                              <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {supportSettings.geminiModel ||
                                  "gemini-1.5-flash"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                Last Response Time
                              </span>
                              <span className="font-bold text-white font-mono">
                                {supportSettings.lastResponseTime || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900 flex-wrap gap-2">
                              <span className="text-slate-400 font-medium">
                                Last Error
                              </span>
                              <span className="font-bold text-red-400 text-right max-w-full break-all font-mono bg-red-950/20 px-2 py-0.5 rounded border border-red-900/20">
                                {supportSettings.lastError || "None"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsTab === "🔗 URL Shortener" && (
                      <div className="space-y-6 max-w-lg">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-bold text-sm">
                              🔗 URL Shortener Configuration
                            </h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                              Configure system-wide link shortener and
                              monetization providers.
                            </p>
                          </div>
                          <button
                            onClick={() => saveSystemSettings(systemSettings)}
                            disabled={systemSettingsLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-900/20"
                          >
                            {systemSettingsLoading
                              ? "Saving..."
                              : "💾 Save Settings"}
                          </button>
                        </div>

                        {/* Config Form */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Enable URL Shortener
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-white font-medium text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="shortenerEnabled"
                                  checked={
                                    systemSettings?.urlShortener?.enabled ===
                                    true
                                  }
                                  onChange={() =>
                                    setSystemSettings({
                                      ...systemSettings,
                                      urlShortener: {
                                        ...(systemSettings.urlShortener || {}),
                                        enabled: true,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                🟢 Enabled
                              </label>
                              <label className="flex items-center gap-2 text-white font-medium text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="shortenerEnabled"
                                  checked={
                                    systemSettings?.urlShortener?.enabled ===
                                    false
                                  }
                                  onChange={() =>
                                    setSystemSettings({
                                      ...systemSettings,
                                      urlShortener: {
                                        ...(systemSettings.urlShortener || {}),
                                        enabled: false,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                🔴 Disabled
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Provider Selection
                            </label>
                            <select
                              value={
                                systemSettings?.urlShortener?.provider ||
                                "GPLinks"
                              }
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  urlShortener: {
                                    ...(systemSettings.urlShortener || {}),
                                    provider: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="own">
                                🏠 Own Shortener (RoyShare)
                              </option>
                              <option value="GPLinks">
                                GPLinks (gplinks.in)
                              </option>
                              <option value="ShrinkMe">
                                ShrinkMe (shrinkme.io)
                              </option>
                              <option value="Droplink">
                                Droplink (droplink.co)
                              </option>
                              <option value="ShrinkEarn">
                                ShrinkEarn (shrinkearn.com)
                              </option>
                              <option value="Ouo.io">Ouo.io (ouo.io)</option>
                              <option value="Shorte.st">
                                Shorte.st (shorte.st)
                              </option>
                              <option value="AdFly">AdFly (adf.ly)</option>
                              <option value="Custom">
                                Custom / Generic API
                              </option>
                            </select>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                              {systemSettings?.urlShortener?.provider ===
                              "Custom"
                                ? "For Custom, use a URL containing {URL} placeholder in the API Key field, e.g., https://my-shortener.com/api?key=123&url={URL}"
                                : `Direct API integration for ${systemSettings?.urlShortener?.provider || "GPLinks"}.`}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              {systemSettings?.urlShortener?.provider ===
                              "Custom"
                                ? "API Request URL Template"
                                : "API Key / Token"}
                            </label>
                            <div className="relative">
                              <input
                                type={showShortenerKey ? "text" : "password"}
                                value={
                                  systemSettings?.urlShortener?.apiKey || ""
                                }
                                onChange={(e) =>
                                  setSystemSettings({
                                    ...systemSettings,
                                    urlShortener: {
                                      ...(systemSettings.urlShortener || {}),
                                      apiKey: e.target.value,
                                    },
                                  })
                                }
                                placeholder={
                                  systemSettings?.urlShortener?.provider ===
                                  "Custom"
                                    ? "https://example.com/api?key=mykey&url={URL}"
                                    : "Enter your provider API credentials"
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowShortenerKey(!showShortenerKey)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showShortenerKey ? "👁️" : "🙈"}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Publisher ID / User ID (Optional)
                            </label>
                            <input
                              type="text"
                              value={
                                systemSettings?.urlShortener?.publisherId || ""
                              }
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  urlShortener: {
                                    ...(systemSettings.urlShortener || {}),
                                    publisherId: e.target.value,
                                  },
                                })
                              }
                              placeholder="Enter your account publisher ID if required"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                            <p className="text-slate-500 text-xs mt-1">
                              Required only for AdFly or specific custom
                              shortener platforms.
                            </p>
                          </div>

                          {/* Connection Diagnostic */}
                          <div className="pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={handleTestShortenerConnection}
                              disabled={
                                shortenerTestLoading ||
                                !systemSettings?.urlShortener?.apiKey
                              }
                              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-white font-semibold rounded-xl text-xs transition border border-slate-700 flex items-center justify-center gap-2"
                            >
                              {shortenerTestLoading ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Testing Connection...
                                </>
                              ) : (
                                "📡 Test Provider Connection"
                              )}
                            </button>

                            {shortenerTestStatus && (
                              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs break-all text-slate-300 font-mono whitespace-pre-wrap">
                                {shortenerTestStatus}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Diagnostics Card */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                          <h4 className="text-white font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                            📡 API Connection Status
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                Provider Status
                              </span>
                              <span
                                className={`font-bold px-2 py-1 rounded ${systemSettings?.urlShortener?.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                              >
                                {systemSettings?.urlShortener?.enabled
                                  ? "Enabled"
                                  : "Disabled"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                Connection Test
                              </span>
                              <span className="font-bold text-white">
                                {systemSettings?.urlShortener?.testStatus ||
                                  "Not Tested"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                              <span className="text-slate-400 font-medium">
                                Active Provider
                              </span>
                              <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {systemSettings?.urlShortener?.provider ===
                                "own"
                                  ? "🏠 Own Shortener"
                                  : systemSettings?.urlShortener?.provider ||
                                    "GPLinks"}
                              </span>
                            </div>
                            {systemSettings?.urlShortener?.testedAt && (
                              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                                <span className="text-slate-400 font-medium">
                                  Last Tested At
                                </span>
                                <span className="font-bold text-slate-300 font-mono text-[10px]">
                                  {new Date(
                                    systemSettings.urlShortener.testedAt,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsTab === "🔄 Maintenance Mode" && (
                      <div className="space-y-6 max-w-lg">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                          <p className="text-yellow-400 text-sm font-medium">
                            When enabled, regular users will see a maintenance
                            page. You can still access the Admin Dashboard.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            Status
                          </label>
                          <select
                            value={systemSettings?.maintenanceMode || "🟢 OFF"}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                maintenanceMode: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="🟢 OFF">🟢 OFF</option>
                            <option value="🔴 ON">🔴 ON</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Ad Preview Modal removed */}
        </div>
      ) : null}
    </div>
    </>
  );
}