import LinkAnalyticsPage from "./LinkAnalyticsPage";
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, deleteDoc, writeBatch, orderBy } from "firebase/firestore";
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
  Gift,
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
  Plus,
  Trash,
  Edit,
  Gamepad2,
  X,
  Upload,
  Image,
  FolderPlus,
  Save,
  Coins,
  ArrowRight,
  Code,
  FlaskConical,
  Settings,
  Monitor,
  Laptop,
  Tablet,
  Send,
  MessageSquare,
} from "lucide-react";


import React from 'react';
import ReferralAdminManager from "../components/ReferralAdminManager";
import UserDetailsModal from "../components/UserDetailsModal";
import TelegramBroadcastCenter from "../components/TelegramBroadcastCenter";
import buildInfo from "../build-info.json";
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
  const [copiedBuildInfo, setCopiedBuildInfo] = useState(false);

  const handleCopyBuildInfo = () => {
    const isProduction = import.meta.env.PROD;
    const textToCopy = `Build v${buildInfo.buildVersion}
Commit: ${buildInfo.commitSha}
Message: ${buildInfo.commitMessage}
Committed: ${buildInfo.commitDate}
Built: ${buildInfo.buildDateTime}
Environment: ${isProduction ? "Production" : "Development"}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedBuildInfo(true);
        setTimeout(() => setCopiedBuildInfo(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy build info:", err);
      });
  };
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

  // Ads.txt state definitions
  const [adsTxtContent, setAdsTxtContent] = useState("");
  const [originalAdsTxtContent, setOriginalAdsTxtContent] = useState("");
  const [adsTxtUpdatedAt, setAdsTxtUpdatedAt] = useState<string | null>(null);
  const [adsTxtLoading, setAdsTxtLoading] = useState(false);
  const [adsTxtSaving, setAdsTxtSaving] = useState(false);
  const [adsTxtError, setAdsTxtError] = useState("");
  const [adsTxtSuccess, setAdsTxtSuccess] = useState(false);
  const [showAdsTxtPreview, setShowAdsTxtPreview] = useState(false);

  // Ads.txt modular providers manager state definitions
  interface AdsTxtProvider {
    id?: string;
    providerName: string;
    providerType: "Game Provider" | "Ad Network" | "Custom";
    snippet: string;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  const [adsTxtProviders, setAdsTxtProviders] = useState<AdsTxtProvider[]>([]);
  const [adsTxtProvidersLoading, setAdsTxtProvidersLoading] = useState(false);
  const [adsTxtProvidersSaving, setAdsTxtProvidersSaving] = useState(false);
  const [providerNameField, setProviderNameField] = useState("");
  const [providerTypeField, setProviderTypeField] = useState<"Game Provider" | "Ad Network" | "Custom">("Game Provider");
  const [providerSnippetField, setProviderSnippetField] = useState("");
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providersError, setProvidersError] = useState("");
  const [providersSuccess, setProvidersSuccess] = useState("");

  // ImgBB integration state definitions
  const [imgbbApiKey, setImgbbApiKey] = useState("");
  const [imgbbVerified, setImgbbVerified] = useState(false);
  const [imgbbStatus, setImgbbStatus] = useState("Not Verified");
  const [imgbbLoading, setImgbbLoading] = useState(false);
  const [imgbbSaving, setImgbbSaving] = useState(false);
  const [imgbbVerifying, setImgbbVerifying] = useState(false);
  const [imgbbSuccess, setImgbbSuccess] = useState("");
  const [imgbbError, setImgbbError] = useState("");
  const [imgbbTestSuccess, setImgbbTestSuccess] = useState("");
  const [imgbbTestError, setImgbbTestError] = useState("");
  const [imgbbTestUrl, setImgbbTestUrl] = useState("");
  const [imgbbTestDisplayUrl, setImgbbTestDisplayUrl] = useState("");
  const [imgbbTestingUpload, setImgbbTestingUpload] = useState(false);

  // GamePix integration state definitions
  const [gamePixRssUrl, setGamePixRssUrl] = useState("");
  const [gamePixLoading, setGamePixLoading] = useState(false);
  const [gamePixSaving, setGamePixSaving] = useState(false);
  const [gamePixTesting, setGamePixTesting] = useState(false);
  const [gamePixError, setGamePixError] = useState("");
  const [gamePixSuccessMessage, setGamePixSuccessMessage] = useState("");
  const [gamePixTestSuccess, setGamePixTestSuccess] = useState<string | null>(null);
  const [gamePixTestError, setGamePixTestError] = useState<string | null>(null);
  
  // GamePix Sync details
  const [gamePixTotalImported, setGamePixTotalImported] = useState<number>(0);
  const [gamePixLastSync, setGamePixLastSync] = useState<string>("");
  const [gamePixSyncStatus, setGamePixSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [gamePixSyncResult, setGamePixSyncResult] = useState<{ imported: number; updated: number; failed: number } | null>(null);

  // Game Reward Settings state definitions
  const [gameRewardSettings, setGameRewardSettings] = useState<any>({
    enabled: true,
    requiredPlayTime: 180,
    rewardCoins: 100,
    conversionCoins: 1000,
    conversionInr: 1,
    dailyCoinLimit: 5000,
    cooldownMinutes: 5,
    maxDailyRewards: 50,
    minActiveTime: 120,
    minInteractions: 5,
    chromeOnly: false,
    allowWebView: true,
    requireWalkthrough: false,
    externalBrowserMode: false
  });
  const [gameRewardSettingsLoading, setGameRewardSettingsLoading] = useState(false);
  const [gameRewardSettingsSaving, setGameRewardSettingsSaving] = useState(false);
  const [gameRewardSettingsSuccess, setGameRewardSettingsSuccess] = useState("");
  const [gameRewardSettingsError, setGameRewardSettingsError] = useState("");

  // Game Analytics States
  const [gameAnalytics, setGameAnalytics] = useState<any>(null);
  const [gameAnalyticsLoading, setGameAnalyticsLoading] = useState(false);

  // Catalog State
  const [catalogGames, setCatalogGames] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState("All"); // All, Added, Not Added, Featured, Disabled

  // Custom Game Form State
  const [customGameTitle, setCustomGameTitle] = useState("");
  const [customGameDescription, setCustomGameDescription] = useState("");
  const [customGameCategory, setCustomGameCategory] = useState("Casual");
  const [customGameProvider, setCustomGameProvider] = useState<string>("");
  const [customGameTags, setCustomGameTags] = useState("");
  const [customGameInstructions, setCustomGameInstructions] = useState("");
  const [customGameBannerUrl, setCustomGameBannerUrl] = useState("");
  const [customGameThumbnailUrl, setCustomGameThumbnailUrl] = useState("");
  const [customGameUrl, setCustomGameUrl] = useState("");
  const [customGameOrientation, setCustomGameOrientation] = useState("landscape");
  const [customGameWidth, setCustomGameWidth] = useState("");
  const [customGameHeight, setCustomGameHeight] = useState("");
  const [customGameRequiredTime, setCustomGameRequiredTime] = useState(300); // Seconds internally or Minutes in UI? User says "Minutes" in UI.
  const [customGameMinActiveTime, setCustomGameMinActiveTime] = useState(120);
  const [customGameChromeOnly, setCustomGameChromeOnly] = useState(false);
  const [customGameAllowWebView, setCustomGameAllowWebView] = useState(true);
  const [customGameRequireWalkthrough, setCustomGameRequireWalkthrough] = useState(false);
  const [customGameExternalBrowserMode, setCustomGameExternalBrowserMode] = useState(false);
  const [customGameRewardCoins, setCustomGameRewardCoins] = useState(100);
  const [customGameDisplayMode, setCustomGameDisplayMode] = useState("smart");
  const [customGameFeatured, setCustomGameFeatured] = useState(false);
  const [customGameEnabled, setCustomGameEnabled] = useState(true);
  const [customGameWalkthroughEnabled, setCustomGameWalkthroughEnabled] = useState(false);
  const [customGameWalkthroughMode, setCustomGameWalkthroughMode] = useState<"config" | "raw">("config");
  const [customGameWalkthroughData, setCustomGameWalkthroughData] = useState<any>({
    gameName: "",
    gameId: "",
    width: "100%",
    height: "480",
    themeColor: "#4f46e5",
    showAds: true,
    enabled: true,
    mode: "config",
    rawCode: ""
  });
  const [customGameError, setCustomGameError] = useState("");
  const [customGameSuccess, setCustomGameSuccess] = useState("");
  const [customGameSaving, setCustomGameSaving] = useState(false);

  // GameMonetize Walkthrough Manager States
  const [walkthroughs, setWalkthroughs] = useState<any[]>([]);
  const [walkthroughSettings, setWalkthroughSettings] = useState<any>({
    enabled: true,
    themeColor: "#4f46e5",
    defaultWidth: "100%",
    defaultHeight: "480",
    showAds: true
  });
  const [walkthroughsLoading, setWalkthroughsLoading] = useState(false);
  const [walkthroughSettingsSaving, setWalkthroughSettingsSaving] = useState(false);
  const [walkthroughForm, setWalkthroughForm] = useState<any>(null); // null means list view, {} means new, {id...} means edit
  const [walkthroughPreview, setWalkthroughPreview] = useState<any>(null);
  const [walkthroughsSuccess, setWalkthroughsSuccess] = useState("");
  const [walkthroughsError, setWalkthroughsError] = useState("");

  // Improved Category Management State
  const [gameCategories, setGameCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Improved Upload States
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailOption, setThumbnailOption] = useState<"upload" | "url">("upload");

  // Published Games Management State
  const [publishedGames, setPublishedGames] = useState<any[]>([]);
  const [publishedGamesLoading, setPublishedGamesLoading] = useState(false);
  const [publishedSearch, setPublishedSearch] = useState("");
  
  // Game Preview State (Modal / Iframe)
  const [previewGame, setPreviewGame] = useState<any | null>(null);

  // Edit Game Modal State
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const [editGameError, setEditGameError] = useState("");
  const [editGameSuccess, setEditGameSuccess] = useState("");
  const [editGameSaving, setEditGameSaving] = useState(false);
  const [editBannerUploading, setEditBannerUploading] = useState(false);
  const [editBannerUploadProgress, setEditBannerUploadProgress] = useState(0);
  const [editThumbnailUploading, setEditThumbnailUploading] = useState(false);
  const [editThumbnailUploadProgress, setEditThumbnailUploadProgress] = useState(0);

  // Telegram Official Settings State (Requested Section)
  const [telegramOfficialSettings, setTelegramOfficialSettings] = useState<any>({
    botToken: "",
    botUsername: "",
    channelUsername: "",
    channelChatId: "",
    groupUsername: "",
    groupChatId: "",
    adminChatId: "",
    defaultTarget: "channel"
  });
  const [telegramOfficialLoading, setTelegramOfficialLoading] = useState(false);
  const [telegramOfficialSaving, setTelegramOfficialSaving] = useState(false);
  const [telegramOfficialSuccess, setTelegramOfficialSuccess] = useState("");
  const [telegramOfficialError, setTelegramOfficialError] = useState("");

  const [testBotLoading, setTestBotLoading] = useState(false);
  const [testBotStatus, setTestBotStatus] = useState<any>(null);

  const [verifyChannelLoading, setVerifyChannelLoading] = useState(false);
  const [verifyChannelStatus, setVerifyChannelStatus] = useState<any>(null);

  const [verifyGroupLoading, setVerifyGroupLoading] = useState(false);
  const [verifyGroupStatus, setVerifyGroupStatus] = useState<any>(null);

  const fetchTelegramOfficialSettings = async () => {
    setTelegramOfficialLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/telegram-settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        setTelegramOfficialSettings({
          botToken: data.settings.botToken || "",
          botUsername: data.settings.botUsername || "",
          channelUsername: data.settings.channelUsername || "",
          channelChatId: data.settings.channelChatId || "",
          groupUsername: data.settings.groupUsername || "",
          groupChatId: data.settings.groupChatId || "",
          adminChatId: data.settings.adminChatId || "",
          defaultTarget: data.settings.defaultTarget || "channel"
        });
      }
    } catch (err: any) {
      console.error("Error fetching telegram settings:", err);
    } finally {
      setTelegramOfficialLoading(false);
    }
  };

  const handleTestBotConnection = async () => {
    setTestBotLoading(true);
    setTestBotStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/telegram-settings/test-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: telegramOfficialSettings.botToken })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestBotStatus({ success: true, message: `✅ Connected! Bot: @${data.botUsername}` });
        setTelegramOfficialSettings((prev: any) => ({ ...prev, botUsername: `@${data.botUsername}` }));
      } else {
        setTestBotStatus({ success: false, message: `❌ Error: ${data.error || "Connection failed"}` });
      }
    } catch (err: any) {
      setTestBotStatus({ success: false, message: `❌ Network error: ${err.message}` });
    } finally {
      setTestBotLoading(false);
    }
  };

  const handleVerifyChannelAccess = async () => {
    setVerifyChannelLoading(true);
    setVerifyChannelStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/telegram-settings/verify-channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramOfficialSettings.botToken,
          channelUsername: telegramOfficialSettings.channelUsername,
          channelChatId: telegramOfficialSettings.channelChatId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyChannelStatus({ success: true, message: `✅ Access confirmed for "${data.chat.title || "Channel"}"` });
      } else {
        setVerifyChannelStatus({ success: false, message: `❌ Access Denied: ${data.error || "Verification failed"}` });
      }
    } catch (err: any) {
      setVerifyChannelStatus({ success: false, message: `❌ Network error: ${err.message}` });
    } finally {
      setVerifyChannelLoading(false);
    }
  };

  const handleVerifyGroupAccess = async () => {
    setVerifyGroupLoading(true);
    setVerifyGroupStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/telegram-settings/verify-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramOfficialSettings.botToken,
          groupUsername: telegramOfficialSettings.groupUsername,
          groupChatId: telegramOfficialSettings.groupChatId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyGroupStatus({ success: true, message: `✅ Access confirmed for "${data.chat.title || "Group"}"` });
      } else {
        setVerifyGroupStatus({ success: false, message: `❌ Access Denied: ${data.error || "Verification failed"}` });
      }
    } catch (err: any) {
      setVerifyGroupStatus({ success: false, message: `❌ Network error: ${err.message}` });
    } finally {
      setVerifyGroupLoading(false);
    }
  };

  const saveTelegramOfficialSettings = async () => {
    setTelegramOfficialSaving(true);
    setTelegramOfficialSuccess("");
    setTelegramOfficialError("");
    
    // Validation
    const formatUsername = (val: string) => {
      if (!val) return "";
      let cleaned = val.trim().replace(/\s+/g, "");
      if (cleaned && !cleaned.startsWith("@") && !cleaned.startsWith("-") && isNaN(Number(cleaned))) {
        cleaned = "@" + cleaned;
      }
      return cleaned;
    };

    const updatedSettings = {
      botToken: telegramOfficialSettings.botToken || "",
      botUsername: formatUsername(telegramOfficialSettings.botUsername),
      channelUsername: formatUsername(telegramOfficialSettings.channelUsername),
      channelChatId: telegramOfficialSettings.channelChatId || "",
      groupUsername: formatUsername(telegramOfficialSettings.groupUsername),
      groupChatId: telegramOfficialSettings.groupChatId || "",
      adminChatId: telegramOfficialSettings.adminChatId || "",
      defaultTarget: telegramOfficialSettings.defaultTarget || "channel"
    };

    if (!updatedSettings.botToken) {
      setTelegramOfficialError("❌ Bot Token is required");
      setTelegramOfficialSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/telegram-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      const data = await res.json();
      if (data.success) {
        setTelegramOfficialSettings(updatedSettings);
        setTelegramOfficialSuccess("✅ Telegram Settings Saved Successfully");
        setTimeout(() => setTelegramOfficialSuccess(""), 3000);
      } else {
        setTelegramOfficialError("❌ Failed to save settings");
      }
    } catch (err: any) {
      setTelegramOfficialError("❌ Network error: " + err.message);
    } finally {
      setTelegramOfficialSaving(false);
    }
  };

  const testTelegramOfficialLink = (username: string) => {
    if (!username) return;
    const cleanUsername = username.replace("@", "");
    window.open(`https://t.me/${cleanUsername}`, "_blank");
  };

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
    announcementChannelId: "",
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
          chatId: data.chatId || data.adminChatId || "",
          storageChannelId: data.storageChannelId || "",
          channelUsername: data.channelUsername || "",
          groupUsername: data.groupUsername || "",
          supportUsername: data.supportUsername || "",
          botName: data.botName || "",
          botUsername: data.botUsername || "",
          announcementChannelId: data.announcementChannelId || "",
          updatedAt: data.updatedAt || "",
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
      const payload = {
        ...telegramConfigs,
        chatId: telegramConfigs.chatId || "",
        adminChatId: telegramConfigs.chatId || "",
        updatedAt: new Date().toISOString()
      };
      const res = await fetch(`${API_BASE}/api/telegram/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setTelegramFeedback("✅ Settings Saved Successfully");
        setTelegramConfigs(payload);
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

  const fetchGameRewardSettings = async () => {
    setGameRewardSettingsLoading(true);
    setGameRewardSettingsError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/game-reward-settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        setGameRewardSettings(data.settings);
      } else {
        setGameRewardSettingsError(data.error || "Unable to load Game Reward Settings.");
      }
    } catch (err) {
      console.error("Error fetching game reward settings:", err);
      setGameRewardSettingsError("Unable to load Game Reward Settings.");
    } finally {
      setGameRewardSettingsLoading(false);
    }
  };

  const saveGameRewardSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setGameRewardSettingsSaving(true);
    setGameRewardSettingsError("");
    setGameRewardSettingsSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/game-reward-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameRewardSettings)
      });

      const data = await res.json();
      if (data.success) {
        setGameRewardSettingsSuccess("✅ Game Reward Settings Saved Successfully");
        setTimeout(() => setGameRewardSettingsSuccess(""), 5000);
      } else {
        setGameRewardSettingsError(data.error || "Failed to save settings.");
      }
    } catch (err: any) {
      console.error(err);
      setGameRewardSettingsError("Network error saving settings: " + err.message);
    } finally {
      setGameRewardSettingsSaving(false);
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

  // GameMonetize Walkthrough Manager Functions
  const fetchWalkthroughSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamemonetize/walkthroughs/settings`);
      const data = await res.json();
      if (data.success) setWalkthroughSettings(data.settings);
    } catch (err) {
      console.error("Error fetching walkthrough settings:", err);
    }
  };

  const saveWalkthroughSettings = async () => {
    setWalkthroughSettingsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamemonetize/walkthroughs/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walkthroughSettings)
      });
      const data = await res.json();
      if (data.success) {
        setWalkthroughsSuccess("Settings saved successfully!");
        setTimeout(() => setWalkthroughsSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error saving walkthrough settings:", err);
    } finally {
      setWalkthroughSettingsSaving(false);
    }
  };

  const fetchWalkthroughs = async () => {
    setWalkthroughsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamemonetize/walkthroughs`);
      const data = await res.json();
      if (data.success) setWalkthroughs(data.walkthroughs);
    } catch (err) {
      console.error("Error fetching walkthroughs:", err);
    } finally {
      setWalkthroughsLoading(false);
    }
  };

  const saveWalkthrough = async (e: React.FormEvent) => {
    e.preventDefault();

    setWalkthroughsLoading(true);
    try {
      const payload = { 
        ...walkthroughForm, 
        mode: "raw" 
      };
      const res = await fetch(`${API_BASE}/api/admin/gamemonetize/walkthroughs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setWalkthroughForm(null);
        fetchWalkthroughs();
        setWalkthroughsSuccess("Walkthrough saved successfully!");
        setTimeout(() => setWalkthroughsSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error saving walkthrough:", err);
    } finally {
      setWalkthroughsLoading(false);
    }
  };





  const deleteWalkthrough = async (id: string) => {
    if (!confirm("Are you sure you want to delete this walkthrough?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamemonetize/walkthroughs/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchWalkthroughs();
        setWalkthroughsSuccess("Walkthrough deleted!");
        setTimeout(() => setWalkthroughsSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting walkthrough:", err);
    }
  };



  const handleTestWalkthrough = async (w: any) => {
    setWalkthroughPreview(w);
    setWalkthroughsSuccess("✅ Preview Loaded Successfully");
    setTimeout(() => setWalkthroughsSuccess(""), 3000);
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

  // ==========================================
  // 🎁 Gift Rewards State & Handlers
  // ==========================================
  const [gifts, setGifts] = useState<any[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [giftForm, setGiftForm] = useState({
    name: "",
    codesText: "",
  });
  const [generatedLink, setGeneratedLink] = useState("");

  const [giftClaims, setGiftClaims] = useState<any[]>([]);
  const [giftClaimsLoading, setGiftClaimsLoading] = useState(false);
  const [giftClaimsSearch, setGiftClaimsSearch] = useState("");

  const generateGiftId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchGifts = async () => {
    setGiftsLoading(true);
    try {
      const q = query(collection(db, "gifts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setGifts(list);
    } catch (err) {
      console.error("Error fetching gifts:", err);
    } finally {
      setGiftsLoading(false);
    }
  };

  const fetchGiftClaims = async () => {
    setGiftClaimsLoading(true);
    try {
      const q = query(collection(db, "gift_claims"), orderBy("claimedAt", "desc"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setGiftClaims(list);
    } catch (err) {
      console.error("Error fetching claims:", err);
    } finally {
      setGiftClaimsLoading(false);
    }
  };

  const handleSaveGift = async () => {
    if (!giftForm.name.trim()) {
      alert("Gift Name is required.");
      return;
    }
    const parsedCodes = giftForm.codesText
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (parsedCodes.length === 0) {
      alert("Please enter at least one gift code.");
      return;
    }

    const uniqueCodes = Array.from(new Set(parsedCodes));
    setGiftsLoading(true);
    try {
      const giftId = generateGiftId();
      const giftData = {
        id: giftId,
        name: giftForm.name.trim(),
        totalCodes: uniqueCodes.length,
        claimedCodes: 0,
        remainingCodes: uniqueCodes.length,
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "gifts", giftId), giftData);

      const batch = writeBatch(db);
      uniqueCodes.forEach((code) => {
        const codeRef = doc(db, "gifts", giftId, "codes", code);
        batch.set(codeRef, {
          code,
          claimed: false,
          claimedBy: null,
          claimedByUsername: null,
          claimedByFirstName: null,
          claimedAt: null,
        });
      });
      await batch.commit();

      const newLink = `https://t.me/Roysharearn_bot?startapp=gift_${giftId}`;
      setGeneratedLink(newLink);
      alert("Gift Link generated successfully!");
      setGiftForm({ name: "", codesText: "" });
      fetchGifts();
    } catch (err) {
      console.error("Error saving gift:", err);
      alert("Failed to generate gift link.");
    } finally {
      setGiftsLoading(false);
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm("Are you sure you want to delete this gift and all its codes? This action cannot be undone.")) return;
    setGiftsLoading(true);
    try {
      const codesSnap = await getDocs(collection(db, "gifts", giftId, "codes"));
      const batch = writeBatch(db);
      codesSnap.forEach((cSnap) => {
        batch.delete(doc(db, "gifts", giftId, "codes", cSnap.id));
      });
      await batch.commit();

      await deleteDoc(doc(db, "gifts", giftId));

      alert("Gift deleted successfully!");
      fetchGifts();
    } catch (err) {
      console.error("Error deleting gift:", err);
      alert("Failed to delete gift.");
    } finally {
      setGiftsLoading(false);
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

  const fetchAdsTxt = async () => {
    setAdsTxtLoading(true);
    setAdsTxtError("");
    setAdsTxtSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ads-txt`);
      if (res.ok) {
        const data = await res.json();
        setAdsTxtContent(data.content || "");
        setOriginalAdsTxtContent(data.content || "");
        setAdsTxtUpdatedAt(data.updatedAt || null);
      } else {
        setAdsTxtError("Failed to fetch ads.txt from server.");
      }
    } catch (err: any) {
      console.error(err);
      setAdsTxtError("Network error fetching ads.txt: " + err.message);
    } finally {
      setAdsTxtLoading(false);
    }
  };

  const saveAdsTxt = async () => {
    if (!adsTxtContent.trim()) {
      const confirmEmpty = window.confirm("The ads.txt content is empty. Saving this will clear your ads.txt. Do you want to proceed?");
      if (!confirmEmpty) return;
    }

    setAdsTxtSaving(true);
    setAdsTxtError("");
    setAdsTxtSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ads-txt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: adsTxtContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setOriginalAdsTxtContent(adsTxtContent);
        setAdsTxtUpdatedAt(data.updatedAt);
        setAdsTxtSuccess(true);
        setTimeout(() => setAdsTxtSuccess(false), 5000);
      } else {
        setAdsTxtError("Failed to save ads.txt settings.");
      }
    } catch (err: any) {
      console.error(err);
      setAdsTxtError("Network error saving ads.txt: " + err.message);
    } finally {
      setAdsTxtSaving(false);
    }
  };

  const fetchAdsTxtProviders = async () => {
    setAdsTxtProvidersLoading(true);
    setProvidersError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ads-txt-providers`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdsTxtProviders(data.providers || []);
        } else {
          setProvidersError(data.error || "Failed to load ads.txt providers.");
        }
      } else {
        setProvidersError("Failed to load ads.txt providers.");
      }
    } catch (err: any) {
      console.error(err);
      setProvidersError("Network error loading providers: " + err.message);
    } finally {
      setAdsTxtProvidersLoading(false);
    }
  };

  const saveAdsTxtProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvidersError("");
    setProvidersSuccess("");

    const name = providerNameField.trim();
    const type = providerTypeField;
    const snippet = providerSnippetField.trim();

    if (!name) {
      setProvidersError("Provider Name is required.");
      return;
    }
    if (!snippet) {
      setProvidersError("Snippet content cannot be empty.");
      return;
    }

    // Client-side duplicate check
    const isDuplicate = adsTxtProviders.some(
      (p) => p.providerName.toLowerCase() === name.toLowerCase() && p.id !== editingProviderId
    );
    if (isDuplicate) {
      setProvidersError(`A provider with the name "${name}" already exists.`);
      return;
    }

    setAdsTxtProvidersSaving(true);
    try {
      const url = editingProviderId
        ? `${API_BASE}/api/admin/ads-txt-providers/${editingProviderId}`
        : `${API_BASE}/api/admin/ads-txt-providers`;
      const method = editingProviderId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: name,
          providerType: type,
          snippet,
          enabled: true, // default to enabled on save/create
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProvidersSuccess(
          editingProviderId
            ? "Provider updated successfully!"
            : "Provider added successfully!"
        );
        // Clear form
        setProviderNameField("");
        setProviderTypeField("Game Provider");
        setProviderSnippetField("");
        setEditingProviderId(null);
        // Refresh list
        await fetchAdsTxtProviders();
        // Hide success alert after 5s
        setTimeout(() => setProvidersSuccess(""), 5000);
      } else {
        setProvidersError(data.error || "Failed to save provider.");
      }
    } catch (err: any) {
      console.error(err);
      setProvidersError("Network error saving provider: " + err.message);
    } finally {
      setAdsTxtProvidersSaving(false);
    }
  };

  const deleteAdsTxtProvider = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the ads.txt snippet for "${name}"?`)) {
      return;
    }
    setProvidersError("");
    setProvidersSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ads-txt-providers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProvidersSuccess(`Successfully deleted provider "${name}".`);
        if (editingProviderId === id) {
          // Reset editing form if deleted the active edit
          setProviderNameField("");
          setProviderTypeField("Game Provider");
          setProviderSnippetField("");
          setEditingProviderId(null);
        }
        await fetchAdsTxtProviders();
        setTimeout(() => setProvidersSuccess(""), 5000);
      } else {
        setProvidersError(data.error || "Failed to delete provider.");
      }
    } catch (err: any) {
      console.error(err);
      setProvidersError("Network error deleting provider: " + err.message);
    }
  };

  const toggleAdsTxtProvider = async (id: string, currentStatus: boolean, name: string) => {
    setProvidersError("");
    setProvidersSuccess("");
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`${API_BASE}/api/admin/ads-txt-providers/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProvidersSuccess(`Successfully ${newStatus ? "enabled" : "disabled"} "${name}".`);
        await fetchAdsTxtProviders();
        setTimeout(() => setProvidersSuccess(""), 5000);
      } else {
        setProvidersError(data.error || "Failed to toggle provider status.");
      }
    } catch (err: any) {
      console.error(err);
      setProvidersError("Network error toggling provider status: " + err.message);
    }
  };

  const startEditingProvider = (provider: AdsTxtProvider) => {
    setEditingProviderId(provider.id || null);
    setProviderNameField(provider.providerName);
    setProviderTypeField(provider.providerType);
    setProviderSnippetField(provider.snippet);
    setProvidersError("");
    setProvidersSuccess("");
  };

  const clearProviderForm = () => {
    setEditingProviderId(null);
    setProviderNameField("");
    setProviderTypeField("Game Provider");
    setProviderSnippetField("");
    setProvidersError("");
    setProvidersSuccess("");
  };

  const fetchImgbbConfig = async () => {
    setImgbbLoading(true);
    setImgbbError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/imgbb/config`);
      if (res.ok) {
        const data = await res.json();
        setImgbbApiKey(data.apiKey || "");
        setImgbbVerified(!!data.verified);
        setImgbbStatus(data.testStatus || "Not Verified");
      } else {
        setImgbbError("Failed to fetch ImgBB configuration.");
      }
    } catch (err: any) {
      console.error(err);
      setImgbbError("Network error loading ImgBB config: " + err.message);
    } finally {
      setImgbbLoading(false);
    }
  };

  const saveImgbbApiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setImgbbError("");
    setImgbbSuccess("");

    const key = imgbbApiKey.trim();
    if (!key) {
      setImgbbError("ImgBB API Key is required.");
      return;
    }

    setImgbbSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/imgbb/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          verified: imgbbVerified,
          testStatus: imgbbStatus
        })
      });

      if (res.ok) {
        setImgbbSuccess("✅ ImgBB API Key Saved Successfully");
        setTimeout(() => setImgbbSuccess(""), 5000);
      } else {
        const data = await res.json();
        setImgbbError(data.error || "Failed to save API Key.");
      }
    } catch (err: any) {
      console.error(err);
      setImgbbError("Network error saving API Key: " + err.message);
    } finally {
      setImgbbSaving(false);
    }
  };

  const verifyImgbbApi = async () => {
    setImgbbError("");
    setImgbbSuccess("");
    const key = imgbbApiKey.trim();
    if (!key) {
      setImgbbError("ImgBB API Key cannot be empty to verify.");
      return;
    }

    setImgbbVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/imgbb/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImgbbVerified(true);
        setImgbbStatus("Connected");
        setImgbbSuccess("✅ API Verified Successfully");
        setTimeout(() => setImgbbSuccess(""), 5000);
      } else {
        setImgbbVerified(false);
        setImgbbStatus("Not Verified");
        setImgbbError(data.error || "❌ Invalid API Key");
      }
    } catch (err: any) {
      console.error(err);
      setImgbbVerified(false);
      setImgbbStatus("Not Verified");
      setImgbbError("❌ Unable to connect to ImgBB");
    } finally {
      setImgbbVerifying(false);
    }
  };

  const handleImgbbTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImgbbTestError("");
    setImgbbTestSuccess("");
    setImgbbTestUrl("");
    setImgbbTestDisplayUrl("");

    const file = e.target.files?.[0];
    if (!file) return;

    setImgbbTestingUpload(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch(`${API_BASE}/api/admin/imgbb/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: base64String })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setImgbbTestUrl(data.url);
            setImgbbTestDisplayUrl(data.displayUrl || data.url);
            setImgbbTestSuccess("✅ Upload Successful");
          } else {
            setImgbbTestError(data.error || "❌ Upload Failed. Please try again.");
          }
        } catch (err: any) {
          console.error(err);
          setImgbbTestError("❌ Upload Failed. Please try again.");
        } finally {
          setImgbbTestingUpload(false);
        }
      };
      reader.onerror = () => {
        setImgbbTestError("Error reading image file.");
        setImgbbTestingUpload(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setImgbbTestError("Failed to initiate file upload.");
      setImgbbTestingUpload(false);
    }
  };

  const fetchGameAnalytics = async () => {
    setGameAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/game/analytics`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          setGameAnalytics(data.analytics);
        }
      }
    } catch (e) {
      console.error("Error loading game analytics in admin:", e);
    } finally {
      setGameAnalyticsLoading(false);
    }
  };

  const saveGameRewardsSettings = async () => {
    // Redundant function removed
  };

  const fetchGamePixConfig = async () => {
    setGamePixLoading(true);
    setGamePixError("");
    setGamePixSuccessMessage("");
    setGamePixTestSuccess(null);
    setGamePixTestError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamepix/config`);
      if (res.ok) {
        const data = await res.json();
        setGamePixRssUrl(data.rssUrl || "");
        setGamePixTotalImported(data.totalImportedGames || 0);
        setGamePixLastSync(data.lastSyncTime || "");
      } else {
        setGamePixError("Failed to fetch GamePix configuration from server.");
      }
      
      // Load Rewards & Analytics
      await fetchGameRewardSettings();
      await fetchGameAnalytics();
    } catch (err: any) {
      console.error(err);
      setGamePixError("Network error fetching GamePix configuration: " + err.message);
    } finally {
      setGamePixLoading(false);
    }
  };

  const syncGamePix = async () => {
    setGamePixSyncStatus("syncing");
    setGamePixSyncResult(null);
    setGamePixError("");
    setGamePixSuccessMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamepix/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGamePixSyncStatus("success");
        setGamePixSyncResult({
          imported: data.imported,
          updated: data.updated,
          failed: data.failed
        });
        setGamePixTotalImported(data.totalImportedGames);
        setGamePixLastSync(data.lastSyncTime);
        setGamePixSuccessMessage("🎮 GamePix catalog fetched and updated successfully!");
        fetchCatalogGames();
      } else {
        setGamePixSyncStatus("error");
        setGamePixError(data.error || "Failed to synchronize games catalog.");
      }
    } catch (err: any) {
      console.error(err);
      setGamePixSyncStatus("error");
      setGamePixError("Network error synchronizing games catalog: " + err.message);
    }
  };

  const saveGamePixConfig = async () => {
    setGamePixSaving(true);
    setGamePixError("");
    setGamePixSuccessMessage("");
    setGamePixTestSuccess(null);
    setGamePixTestError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamepix/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: gamePixRssUrl }),
      });
      if (res.ok) {
        setGamePixSuccessMessage("✅ Configuration Saved Successfully");
        setTimeout(() => setGamePixSuccessMessage(""), 5000);
      } else {
        setGamePixError("Failed to save GamePix configuration.");
      }
    } catch (err: any) {
      console.error(err);
      setGamePixError("Network error saving GamePix configuration: " + err.message);
    } finally {
      setGamePixSaving(false);
    }
  };

  const testGamePixConnection = async () => {
    setGamePixTesting(true);
    setGamePixError("");
    setGamePixSuccessMessage("");
    setGamePixTestSuccess(null);
    setGamePixTestError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamepix/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: gamePixRssUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGamePixTestSuccess("✅ RSS Feed Connected Successfully");
      } else {
        setGamePixTestError("❌ Unable to connect.");
      }
    } catch (err: any) {
      console.error(err);
      setGamePixTestError("❌ Unable to connect.");
    } finally {
      setGamePixTesting(false);
    }
  };

  const fetchCatalogGames = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamepix/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalogGames(data.games || []);
      }
    } catch (err) {
      console.error("Error fetching catalog:", err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const addToRoyShare = async (gameId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/gamepix/add-to-royshare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          gameId,
          autoAnnounce: supportSettings?.autoAnnounceGames
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh catalog to update isAdded status immediately
        fetchCatalogGames();
        fetchPublishedGames();
      } else {
        alert(data.error || "Failed to add game to RoyShare.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error publishing game: " + err.message);
    }
  };

  const fetchPublishedGames = async () => {
    setPublishedGamesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/games`);
      if (res.ok) {
        const data = await res.json();
        setPublishedGames(data.games || []);
      }
    } catch (err) {
      console.error("Error fetching published games:", err);
    } finally {
      setPublishedGamesLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoryError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/game-categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setGameCategories(data.categories);
          // If the customGameCategory is not set to any loaded category, set it to the first category's name
          if (data.categories.length > 0 && !data.categories.some(c => c.name === customGameCategory)) {
            setCustomGameCategory(data.categories[0].name);
          }
        }
      } else {
        throw new Error("Failed to load categories");
      }
    } catch (err: any) {
      console.error("Error fetching game categories:", err);
      setCategoryError(err.message || "Failed to load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryError("Category Name is required.");
      return;
    }
    setCategorySaving(true);
    setCategoryError(null);
    try {
      const url = categoryEditingId 
        ? `${API_BASE}/api/admin/game-categories/${categoryEditingId}`
        : `${API_BASE}/api/admin/game-categories`;
      const method = categoryEditingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: newCategoryIcon.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCategoryName("");
        setNewCategoryIcon("");
        setCategoryEditingId(null);
        await fetchCategories();
      } else {
        setCategoryError(data.error || "Failed to save category.");
      }
    } catch (err: any) {
      console.error("Error saving category:", err);
      setCategoryError(err.message || "Network error while saving category.");
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    setCategoryError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/game-categories/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchCategories();
      } else {
        setCategoryError(data.error || "Failed to delete category.");
      }
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setCategoryError(err.message || "Network error while deleting category.");
    }
  };

  const uploadGameImage = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file size and formats
      const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedFormats.includes(file.type)) {
        reject(new Error("Allowed formats are: JPG, JPEG, PNG, WEBP"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Maximum allowed file size is 5 MB."));
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        let progress = 5;
        onProgress(progress);
        const progressTimer = setInterval(() => {
          if (progress < 90) {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress > 90) progress = 90;
            onProgress(progress);
          }
        }, 120);

        try {
          const res = await fetch(`${API_BASE}/api/admin/imgbb/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              base64
            })
          });

          clearInterval(progressTimer);

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Upload failed");
          }

          const data = await res.json();
          onProgress(100);
          if (data.success && data.url) {
            resolve(data.url);
          } else {
            throw new Error("Invalid response from server");
          }
        } catch (err: any) {
          clearInterval(progressTimer);
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsDataURL(file);
    });
  };

  const saveCustomGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGameTitle || !customGameUrl || !customGameBannerUrl || !customGameThumbnailUrl) {
      setCustomGameError("Please fill in all required fields (Name, Play URL, Banner, and Thumbnail).");
      return;
    }

    setCustomGameSaving(true);
    setCustomGameError("");
    setCustomGameSuccess("");
    try {
      // 🛡️ Final URL Validation
      const valRes = await fetch(`${API_BASE}/api/admin/games/validate-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: customGameUrl })
      });
      const valData = await valRes.json();
      if (!valData.success) {
        setCustomGameError(`URL Validation Failed: ${valData.error}`);
        setCustomGameSaving(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/games/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customGameTitle,
          description: customGameDescription,
          category: customGameCategory,
          provider: customGameProvider,
          tags: customGameTags,
          instructions: customGameInstructions,
          bannerUrl: customGameBannerUrl,
          thumbnailUrl: customGameThumbnailUrl,
          url: customGameUrl,
          orientation: customGameOrientation,
          width: customGameWidth,
          height: customGameHeight,
          requiredTime: customGameRequiredTime,
          minActiveTime: customGameMinActiveTime,
          chromeOnly: customGameChromeOnly,
          allowWebView: customGameAllowWebView,
          requireWalkthrough: customGameRequireWalkthrough,
          externalBrowserMode: customGameExternalBrowserMode,
          rewardCoins: customGameRewardCoins,
          displayMode: customGameDisplayMode,
          featured: customGameFeatured,
          enabled: customGameEnabled,
          walkthrough: customGameWalkthroughEnabled ? customGameWalkthroughData : null,
          autoAnnounce: supportSettings?.autoAnnounceGames
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let successMsg = "✅ Game Saved Successfully";
        if (data.walkthroughSaved) {
          successMsg += "\n✅ Walkthrough Saved Successfully";
        }
        setCustomGameSuccess(successMsg);
        
        // Reset manual form
        setCustomGameTitle("");
        setCustomGameDescription("");
        setCustomGameCategory(gameCategories.length > 0 ? gameCategories[0].name : "Casual");
        setCustomGameProvider("");
        setCustomGameTags("");
        setCustomGameInstructions("");
        setCustomGameBannerUrl("");
        setCustomGameThumbnailUrl("");
        setCustomGameUrl("");
        setCustomGameOrientation("landscape");
        setCustomGameWidth("");
        setCustomGameHeight("");
        setCustomGameRequiredTime(300);
        setCustomGameMinActiveTime(120);
        setCustomGameChromeOnly(false);
        setCustomGameAllowWebView(true);
        setCustomGameRequireWalkthrough(false);
        setCustomGameExternalBrowserMode(false);
        setCustomGameRewardCoins(100);
        setCustomGameFeatured(false);
        setCustomGameEnabled(true);
        setCustomGameWalkthroughEnabled(false);
        setCustomGameWalkthroughData({
          gameName: "",
          gameId: "",
          width: "100%",
          height: "480",
          themeColor: "#4f46e5",
          showAds: true,
          enabled: true,
          mode: "config",
          rawCode: ""
        });
        setBannerPreview(null);
        setThumbnailPreview(null);
        fetchPublishedGames();
        fetchCatalogGames();
        setTimeout(() => setCustomGameSuccess(""), 5000);
      } else {
        setCustomGameError(data.error || "Failed to add game.");
      }
    } catch (err: any) {
      console.error(err);
      setCustomGameError("Network error: " + err.message);
    } finally {
      setCustomGameSaving(false);
    }
  };

  const updatePublishedGameStatus = async (gameId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPublishedGames();
        fetchCatalogGames();
      } else {
        alert(data.error || "Failed to update game status.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error updating game status: " + err.message);
    }
  };

  const saveEditedGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !editingGame.title || !editingGame.url) {
      setEditGameError("Title and Play URL are required.");
      return;
    }
    setEditGameSaving(true);
    setEditGameError("");
    setEditGameSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/games/${editingGame.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingGame)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditGameSuccess("✅ Game updated successfully!");
        setTimeout(() => {
          setEditingGame(null);
          setEditGameSuccess("");
        }, 1200);
        fetchPublishedGames();
        fetchCatalogGames();
      } else {
        setEditGameError(data.error || "Failed to update game details.");
      }
    } catch (err: any) {
      console.error(err);
      setEditGameError("Network error: " + err.message);
    } finally {
      setEditGameSaving(false);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game? This will remove it from the RoyShare Mini App Game Center.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/games/${gameId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPublishedGames();
        fetchCatalogGames();
      } else {
        alert(data.error || "Failed to delete game.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error deleting game: " + err.message);
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
      fetchImgbbConfig();
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
    } else if (activeTab === "📄 Ads.txt Manager") {
      fetchAdsTxt();
      fetchAdsTxtProviders();
    } else if (activeTab === "🎮 GamePix Integration") {
      fetchGamePixConfig();
    } else if (activeTab === "🎮 Game Catalog") {
      fetchCatalogGames();
    } else if (activeTab === "✏️ Manage Games") {
      fetchPublishedGames();
      fetchCategories();
    } else if (activeTab === "➕ Add Custom Game") {
      fetchCategories();
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
                    {(selectedWithdrawal.method === "USDT" || selectedWithdrawal.method === "USDT (TRC20)") ? `${selectedWithdrawal.amount} USDT` : `₹${selectedWithdrawal.amount}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Processing Fee ({(selectedWithdrawal.method === "USDT" || selectedWithdrawal.method === "USDT (TRC20)") ? "Fixed" : "5%"})</span>
                  <span>
                    {(selectedWithdrawal.method === "USDT" || selectedWithdrawal.method === "USDT (TRC20)") ? `${selectedWithdrawal.processingFee || 1} USDT` : `₹${selectedWithdrawal.processingFee || (selectedWithdrawal.amount * 0.05).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50 font-semibold text-emerald-400">
                  <span>Estimated Receive</span>
                  <span className="text-base font-bold text-emerald-400">
                    {(selectedWithdrawal.method === "USDT" || selectedWithdrawal.method === "USDT (TRC20)") ? `${selectedWithdrawal.receiveAmount || (selectedWithdrawal.amount - 1)} USDT` : `₹${selectedWithdrawal.receiveAmount || (selectedWithdrawal.amount * 0.95).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  💳 Payment Method: <span className="text-indigo-400 font-bold">{selectedWithdrawal.method}</span>
                </h4>

                {(selectedWithdrawal.method === "UPI" || selectedWithdrawal.method === "UPI ID") && (
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-500">UPI ID</span>
                    <span className="font-mono text-sm text-white select-all bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 block">{selectedWithdrawal.upiId || "N/A"}</span>
                  </div>
                )}

                {(selectedWithdrawal.method === "Bank" || selectedWithdrawal.method === "Bank Account") && (
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

                {(selectedWithdrawal.method === "USDT" || selectedWithdrawal.method === "USDT (TRC20)") && (
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
      <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex-1">
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

        {/* Build Info & Refresh Actions Panel */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
          {/* Production Build Information Badge */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full xl:w-[480px] shadow-lg">
            <div className="text-xs font-mono space-y-1 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-white font-sans font-semibold text-sm">Build v{buildInfo.buildVersion}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wide border ${
                  import.meta.env.PROD 
                    ? "text-indigo-400 bg-indigo-400/10 border-indigo-500/20" 
                    : "text-amber-400 bg-amber-400/10 border-amber-500/20"
                }`}>
                  {import.meta.env.PROD ? "Production" : "Development"}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-slate-400">
                <span className="text-slate-500 font-sans font-medium text-[11px] uppercase tracking-wider min-w-[70px] inline-block">Commit:</span> 
                <span className="text-slate-300 font-semibold bg-slate-950 px-1.5 py-0.5 rounded text-[11px] border border-slate-800">{buildInfo.commitSha}</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-400 max-w-sm">
                <span className="text-slate-500 font-sans font-medium text-[11px] uppercase tracking-wider min-w-[70px] inline-block mt-0.5">Message:</span> 
                <span className="text-slate-300 break-all leading-tight line-clamp-2" title={buildInfo.commitMessage}>{buildInfo.commitMessage}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-slate-500 font-sans font-medium text-[11px] uppercase tracking-wider min-w-[70px] inline-block">Committed:</span> 
                <span className="text-slate-300">{buildInfo.commitDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-slate-500 font-sans font-medium text-[11px] uppercase tracking-wider min-w-[70px] inline-block">Built:</span> 
                <span className="text-slate-300">{buildInfo.buildDateTime}</span>
              </div>
            </div>
            <button
              onClick={handleCopyBuildInfo}
              className="flex items-center justify-center gap-1.5 self-end sm:self-center px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer select-none"
            >
              {copiedBuildInfo ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Info</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 xl:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 cursor-pointer h-full"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Dashboard</span>
          </button>
        </div>
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
              "📢 Telegram Broadcast Center",
              "💰 Verified Tasks",
              "🛡 Security Center",
              "📜 Activity Logs",
              "📥 Backup & Restore",
              "🚀 Referral System",
              "⚙️ System Settings",
              "📄 Ads.txt Manager",
              "🎥 GameMonetize Walkthroughs",
              "🎮 Game Rewards",
              "🎮 GamePix Integration",
              "🎮 Game Catalog",
              "➕ Add Custom Game",
              "✏️ Manage Games",
              "📱 Telegram Settings",
              "🎁 Gift Link Generator",
              "📊 Gift Claims History",
            ].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  setActiveTab(btn);
                  if (btn === "💰 Verified Tasks") fetchVerifiedTasks();
                  if (btn === "🎮 Game Rewards") fetchGameRewardSettings();
                  if (btn === "🎥 GameMonetize Walkthroughs") {
                    fetchWalkthroughSettings();
                    fetchWalkthroughs();
                  }
                  if (btn === "📱 Telegram Settings") fetchTelegramOfficialSettings();
                  if (btn === "🎁 Gift Link Generator") fetchGifts();
                  if (btn === "📊 Gift Claims History") fetchGiftClaims();
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

          {activeTab === "🎥 GameMonetize Walkthroughs" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Header & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Total Walkthroughs</span>
                  <span className="text-2xl font-black text-white block mt-1">{walkthroughs.length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Enabled</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-1">{walkthroughs.filter(w => w.enabled).length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Disabled</span>
                  <span className="text-2xl font-black text-rose-400 block mt-1">{walkthroughs.filter(w => !w.enabled).length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Last Updated</span>
                  <span className="text-sm font-bold text-slate-400 block mt-2">
                    {walkthroughs.length > 0 
                      ? new Date(Math.max(...walkthroughs.map(w => new Date(w.updatedAt || 0).getTime()))).toLocaleDateString() 
                      : "Never"}
                  </span>
                </div>
              </div>

              {/* General Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    ⚙️ General Settings
                  </h3>
                  <button
                    onClick={saveWalkthroughSettings}
                    disabled={walkthroughSettingsSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {walkthroughSettingsSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Settings
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl cursor-pointer hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${walkthroughSettings.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                          <Tv size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Enable Walkthroughs</p>
                          <p className="text-[10px] text-slate-500">Globally show or hide all walkthroughs</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={walkthroughSettings.enabled}
                        onChange={(e) => setWalkthroughSettings({...walkthroughSettings, enabled: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl cursor-pointer hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${walkthroughSettings.showAds ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-500"}`}>
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Show Ads</p>
                          <p className="text-[10px] text-slate-500">Enable video ads before walkthrough</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={walkthroughSettings.showAds}
                        onChange={(e) => setWalkthroughSettings({...walkthroughSettings, showAds: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                      />
                    </label>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">🎨 Theme Color</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color"
                          value={walkthroughSettings.themeColor}
                          onChange={(e) => setWalkthroughSettings({...walkthroughSettings, themeColor: e.target.value})}
                          className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={walkthroughSettings.themeColor}
                          onChange={(e) => setWalkthroughSettings({...walkthroughSettings, themeColor: e.target.value})}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">📏 Default Width</label>
                      <input 
                        type="text"
                        value={walkthroughSettings.defaultWidth}
                        onChange={(e) => setWalkthroughSettings({...walkthroughSettings, defaultWidth: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                        placeholder="e.g. 100%"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">📐 Default Height</label>
                      <input 
                        type="text"
                        value={walkthroughSettings.defaultHeight}
                        onChange={(e) => setWalkthroughSettings({...walkthroughSettings, defaultHeight: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                        placeholder="e.g. 480"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Walkthrough List / Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                {walkthroughForm ? (
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                        {walkthroughForm.id ? "✏️ Edit Walkthrough" : "➕ Add Walkthrough"}
                      </h3>
                      <button
                        onClick={() => setWalkthroughForm(null)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={saveWalkthrough} className="space-y-8">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Game Name</label>
                            <input 
                              required
                              type="text"
                              value={walkthroughForm.gameName || ""}
                              onChange={(e) => setWalkthroughForm({...walkthroughForm, gameName: e.target.value})}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 transition-all"
                              placeholder="Enter game title"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Game ID (Reference)</label>
                            <input 
                              required
                              type="text"
                              value={walkthroughForm.gameId || ""}
                              onChange={(e) => setWalkthroughForm({...walkthroughForm, gameId: e.target.value})}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono"
                              placeholder="e.g. 12345"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              📜 Walkthrough Embed Code
                            </h4>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleTestWalkthrough(walkthroughForm)}
                                className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-2"
                              >
                                <Eye size={14} />
                                🔍 Test Walkthrough
                              </button>
                            </div>
                          </div>
                          <textarea 
                            required
                            rows={15}
                            value={walkthroughForm.rawCode || ""}
                            onChange={(e) => setWalkthroughForm({...walkthroughForm, rawCode: e.target.value})}
                            className="w-full bg-black border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 leading-relaxed focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder={`Paste official GameMonetize embed code here...`}
                          />
                        </div>

                        <div className="flex gap-4">
                          <label className="flex-1 flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl cursor-pointer hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${walkthroughForm.enabled !== false ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                                <CheckCircle size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">Status</p>
                                <p className="text-[10px] text-slate-500">{walkthroughForm.enabled !== false ? "Enabled" : "Disabled"}</p>
                              </div>
                            </div>
                            <input 
                              type="checkbox"
                              checked={walkthroughForm.enabled !== false}
                              onChange={(e) => setWalkthroughForm({...walkthroughForm, enabled: e.target.checked})}
                              className="w-5 h-5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <button
                          type="submit"
                          disabled={walkthroughsLoading}
                          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
                        >
                          {walkthroughsLoading ? "Saving..." : walkthroughForm.id ? "Update Walkthrough" : "Create Walkthrough"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalkthroughForm(null)}
                          className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div>
                    <div className="p-8 flex items-center justify-between border-b border-slate-800">
                      <div>
                        <h3 className="text-xl font-black text-white">🎥 Game Walkthroughs</h3>
                        <p className="text-sm text-slate-500">Manage GameMonetize video walkthroughs</p>
                      </div>
                      <button
                        onClick={() => setWalkthroughForm({ enabled: true, showAds: true })}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/20"
                      >
                        <Plus size={20} />
                        Add Walkthrough
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-950/50 border-b border-slate-800">
                          <tr>
                            <th className="px-6 py-4">Game</th>
                            <th className="px-6 py-4">Game ID</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {walkthroughsLoading ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">Loading walkthroughs...</td>
                            </tr>
                          ) : walkthroughs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">No walkthroughs found. Add your first one!</td>
                            </tr>
                          ) : (
                            walkthroughs.map((w) => (
                              <tr key={w.id} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="px-6 py-4 font-bold text-white">{w.gameName}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{w.gameId}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${w.enabled !== false ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                    {w.enabled !== false ? "Active" : "Disabled"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleTestWalkthrough(w)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                                    title="Preview"
                                  >
                                    <Eye size={16} />
                                  </button>

                                  <button
                                    onClick={() => setWalkthroughForm(w)}
                                    className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteWalkthrough(w.id)}
                                    className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Modal */}
              {walkthroughPreview && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl animate-in zoom-in duration-300">
                    <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="font-black text-white flex items-center gap-2">
                        🎥 Walkthrough Preview: {walkthroughPreview.gameName}
                      </h4>
                      <button 
                        onClick={() => setWalkthroughPreview(null)}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-8 bg-black flex justify-center items-center min-h-[480px]">
                      <div className="w-full flex flex-col items-center">
                        <div 
                          className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative group w-full"
                          style={{ 
                              height: walkthroughPreview.height || "480px" 
                          }}
                        >
                          <iframe 
                              title="Walkthrough Preview"
                              srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <style>
                                      body { margin: 0; padding: 0; background: black; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                                      #gamemonetize-video { width: 100% !important; height: 100% !important; }
                                      iframe { width: 100% !important; height: 100% !important; border: none; }
                                    </style>
                                  </head>
                                  <body>
                                    ${walkthroughPreview.rawCode}
                                  </body>
                                </html>
                              `}
                              frameBorder="0" 
                              scrolling="no" 
                              width="100%" 
                              height="100%"
                              className="w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-mono">Game ID: {walkthroughPreview.gameId}</span>
                      <button 
                        onClick={() => setWalkthroughPreview(null)}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {walkthroughsSuccess && (
                <div className="fixed bottom-10 right-10 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500 z-[300] font-black flex items-center gap-3">
                  <CheckCircle size={24} />
                  {walkthroughsSuccess}
                </div>
              )}
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
                    onClick={() => setAnalyticsView("Game Analytics")}
                    className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-all ${analyticsView === "Game Analytics" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    🎮 Game Analytics
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
              ) : analyticsView === "Game Analytics" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider mb-1">
                      Total Game Opens
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {analyticsData.gameAnalytics?.totalOpens || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">
                      Total Completions
                    </h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      {analyticsData.gameAnalytics?.totalCompletions || 0}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-1">
                      Total Reward Claims
                    </h3>
                    <p className="text-2xl font-bold text-amber-400">
                      {analyticsData.gameAnalytics?.totalClaims || 0}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-purple-500/80 uppercase tracking-wider mb-1">
                      Avg Play Time (min)
                    </h3>
                    <p className="text-2xl font-bold text-purple-400">
                      {Math.round((analyticsData.gameAnalytics?.avgPlayTime || 0) / 60)}
                    </p>
                  </div>
                  <div className="bg-slate-500/10 border border-slate-500/20 rounded-2xl p-4 col-span-2">
                    <h3 className="text-xs font-semibold text-slate-500/80 uppercase tracking-wider mb-1">
                      Completion Rate
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.gameAnalytics?.totalOpens > 0 
                        ? Math.round((analyticsData.gameAnalytics?.totalCompletions / analyticsData.gameAnalytics?.totalOpens) * 100)
                        : 0}%
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
          {activeTab === "📢 Telegram Broadcast Center" && (
            <TelegramBroadcastCenter onOpenSettings={() => setActiveTab("📱 Telegram Settings")} />
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

          {activeTab === "🎮 GamePix Integration" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🎮 GamePix Integration
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Configure the GamePix RSS/JSON Feed URL to integrate premium HTML5 games into RoyShare.
                  </p>
                </div>
              </div>

              {gamePixLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
                      <span className="text-xs font-semibold text-slate-400">Total Games in Catalog</span>
                      <span className="text-2xl font-black text-white mt-1">{gamePixTotalImported}</span>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
                      <span className="text-xs font-semibold text-slate-400">Last Synced (Downloaded Feed)</span>
                      <span className="text-sm font-semibold text-slate-200 mt-2">
                        {gamePixLastSync ? new Date(gamePixLastSync).toLocaleString() : "Never Synced"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-200">
                      RSS Feed URL
                    </label>
                    <input
                      type="text"
                      value={gamePixRssUrl}
                      onChange={(e) => setGamePixRssUrl(e.target.value)}
                      placeholder="https://feed.gamepix.com/v1/json"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">
                      Typically GamePix provides a JSON-formatted RSS feed. Defaults to <code>https://feed.gamepix.com/v1/json</code> if left empty.
                    </p>
                  </div>

                  {gamePixError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{gamePixError}</span>
                    </div>
                  )}

                  {gamePixSuccessMessage && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{gamePixSuccessMessage}</span>
                    </div>
                  )}

                  {gamePixTestSuccess && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex flex-col gap-1 whitespace-pre-line">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Connection Verified</span>
                      </div>
                      <p className="text-xs opacity-90">{gamePixTestSuccess}</p>
                    </div>
                  )}

                  {gamePixTestError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex flex-col gap-1 whitespace-pre-line">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Connection Failed</span>
                      </div>
                      <p className="text-xs opacity-90">{gamePixTestError}</p>
                    </div>
                  )}

                  {gamePixSyncStatus === "syncing" && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-sm flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span>Fetching latest games into local catalog...</span>
                    </div>
                  )}

                  {gamePixSyncStatus === "success" && gamePixSyncResult && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex flex-col gap-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Fetch Completed Successfully</span>
                      </div>
                      <p className="text-xs opacity-90">
                        Downloaded feed. Loaded {gamePixSyncResult.imported} new games into <strong>gamepix_catalog</strong>, Updated {gamePixSyncResult.updated} games, Failed {gamePixSyncResult.failed}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={saveGamePixConfig}
                      disabled={gamePixSaving || gamePixTesting || gamePixSyncStatus === "syncing"}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 text-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {gamePixSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Save
                        </>
                      )}
                    </button>

                    <button
                      onClick={testGamePixConnection}
                      disabled={gamePixSaving || gamePixTesting || gamePixSyncStatus === "syncing"}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {gamePixTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Testing...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" /> Test Connection
                        </>
                      )}
                    </button>

                    <button
                      onClick={syncGamePix}
                      disabled={gamePixSaving || gamePixTesting || gamePixSyncStatus === "syncing"}
                      className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 text-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {gamePixSyncStatus === "syncing" ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" /> Fetch Games
                        </>
                      )}
                    </button>
                  </div>

                  {/* ==========================================
                      GAME PERFORMANCE & ANALYTICS INSIGHTS
                     ========================================== */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl mt-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        📊 Game Performance & Analytics
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Live dashboard compiling global gaming interactions, play retention, and CTR inside RoyShare.
                      </p>
                    </div>

                    {gameAnalyticsLoading ? (
                      <div className="flex justify-center py-6">
                        <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                    ) : gameAnalytics ? (
                      <div className="space-y-6">
                        {/* Core KPI widgets */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Total Plays</span>
                            <span className="text-xl font-black text-white block mt-1">{gameAnalytics.totalPlays}</span>
                          </div>
                          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Valid Plays (30s+)</span>
                            <span className="text-xl font-black text-emerald-400 block mt-1">{gameAnalytics.validPlays}</span>
                          </div>
                          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Avg Play Time</span>
                            <span className="text-xl font-black text-purple-400 block mt-1">
                              {Math.floor(gameAnalytics.avgPlayTime / 60)}m {Math.floor(gameAnalytics.avgPlayTime % 60)}s
                            </span>
                          </div>
                          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Unique Players</span>
                            <span className="text-xl font-black text-blue-400 block mt-1">{gameAnalytics.uniquePlayers}</span>
                          </div>
                          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Valid Rate</span>
                            <span className="text-xl font-black text-white block mt-1">
                              {Number(gameAnalytics.completionRate || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Est. CTR</span>
                            <span className="text-xl font-black text-amber-400 block mt-1">
                              {Number(gameAnalytics.ctr || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Staggered progress columns represent play timeline */}
                        <div className="space-y-3 pt-2">
                          <span className="text-xs font-semibold text-slate-300 block">Play Frequency Timeline</span>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Today</span>
                              <span className="font-bold text-white">{gameAnalytics.todayPlays} Plays</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((gameAnalytics.todayPlays / Math.max(gameAnalytics.weeklyPlays, 1)) * 100, 100)}%` }} />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2">
                              <span className="text-slate-400">Weekly Plays</span>
                              <span className="font-bold text-white">{gameAnalytics.weeklyPlays} Plays</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((gameAnalytics.weeklyPlays / Math.max(gameAnalytics.monthlyPlays, 1)) * 100, 100)}%` }} />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2">
                              <span className="text-slate-400">Monthly Plays</span>
                              <span className="font-bold text-white">{gameAnalytics.monthlyPlays} Plays</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No gameplay session logs available yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "🎮 Game Catalog" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🎮 Game Catalog
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Select premium games from GamePix catalog to publish directly inside the RoyShare Mini App.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span>Catalog size: <strong>{catalogGames.length}</strong></span>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search games by title, description or category..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Filter:</span>
                  {[
                    { label: "All", value: "All" },
                    { label: "Added", value: "Added" },
                    { label: "Not Added", value: "Not Added" },
                    { label: "Featured", value: "Featured" },
                    { label: "Disabled", value: "Disabled" }
                  ].map((f) => {
                    const count = catalogGames.filter(g => {
                      if (f.value === "All") return true;
                      if (f.value === "Added") return g.isAdded;
                      if (f.value === "Not Added") return !g.isAdded;
                      if (f.value === "Featured") return g.featured;
                      if (f.value === "Disabled") return g.isAdded && g.enabled === false;
                      return true;
                    }).length;

                    return (
                      <button
                        key={f.value}
                        onClick={() => setCatalogFilter(f.value)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${catalogFilter === f.value ? "bg-purple-600 text-white shadow-md shadow-purple-900/30" : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"}`}
                      >
                        {f.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {catalogLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Games Cards Grid */}
                  {(() => {
                    const filtered = catalogGames.filter((g) => {
                      // Apply search
                      const matchesSearch =
                        g.title?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        g.category?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        g.description?.toLowerCase().includes(catalogSearch.toLowerCase());

                      if (!matchesSearch) return false;

                      // Apply filter
                      if (catalogFilter === "Added") return g.isAdded;
                      if (catalogFilter === "Not Added") return !g.isAdded;
                      if (catalogFilter === "Featured") return g.featured;
                      if (catalogFilter === "Disabled") return g.isAdded && g.enabled === false;

                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                          <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto animate-pulse" />
                          <h3 className="text-lg font-bold text-slate-300">No games match your criteria</h3>
                          <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Try adjusting your filters or search term, or click "Fetch Games" in the Integration tab to sync the latest feed.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((game) => (
                          <div
                            key={game.id}
                            className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition-all hover:-translate-y-1"
                          >
                            <div className="relative">
                              <img
                                src={game.bannerUrl}
                                alt={game.title}
                                className="w-full aspect-[16/9] object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-3 right-3 flex gap-1">
                                <span className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1 rounded-md uppercase">
                                  {game.orientation}
                                </span>
                                <span className="bg-purple-950/80 backdrop-blur-sm border border-purple-800 text-[10px] font-bold text-purple-300 px-2 py-1 rounded-md">
                                  {game.category}
                                </span>
                              </div>
                              
                              {/* Thumbnail overlapping */}
                              <div className="absolute left-4 -bottom-6">
                                <img
                                  src={game.thumbnailUrl}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded-xl border-2 border-slate-900 shadow-md"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="absolute right-4 -bottom-5 bg-slate-950/90 backdrop-blur-sm border border-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-amber-400 flex items-center gap-1 shadow-md">
                                ⭐️ {game.quality || "5.0"}
                              </div>
                            </div>

                            <div className="pt-8 px-5 pb-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-1.5">
                                <h3 className="font-extrabold text-white text-base line-clamp-1">{game.title}</h3>
                                <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-relaxed">
                                  {game.description || "Premium HTML5 Arcade game."}
                                </p>
                              </div>

                              {/* Footer Status Indicators */}
                              {game.isAdded && (
                                <div className="flex gap-2 flex-wrap pb-1">
                                  {game.featured && (
                                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                      ⭐️ Featured
                                    </span>
                                  )}
                                  {game.enabled === false ? (
                                    <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                      ⛔ Disabled
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                      ✅ Active
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                  onClick={() => setPreviewGame(game)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview
                                </button>

                                {game.isAdded ? (
                                  <button
                                    disabled
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-950/60 disabled:opacity-90"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Added
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => addToRoyShare(game.id)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-900/20 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add to RoyShare
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {activeTab === "➕ Add Custom Game" && (
            <div className="space-y-8 pb-20">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Plus className="w-8 h-8 text-purple-500" />
                    Manual Game Add System
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-xl">
                    Manually add premium games with custom assets, configurations, and walkthrough support. All data is saved exactly as entered.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Manual form */}
                <div className="lg:col-span-8 space-y-8">
                  <form
                    onSubmit={saveCustomGame}
                    className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden"
                  >
                    {/* Decorative Background Element */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-6 relative">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-800/60">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                          <Gamepad2 size={20} />
                        </div>
                        <h3 className="text-lg font-black text-white">Game Details</h3>
                      </div>

                      {customGameError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-3"
                        >
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="font-bold">{customGameError}</span>
                        </motion.div>
                      )}

                      {customGameSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-3"
                        >
                          <CheckCircle className="w-5 h-5 flex-shrink-0" />
                          <div className="flex flex-col">
                            {customGameSuccess.split('\n').map((line, i) => (
                              <span key={i} className="font-bold">{line}</span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Game Name <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={customGameTitle}
                            onChange={(e) => setCustomGameTitle(e.target.value)}
                            placeholder="Enter game title"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700 font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Provider (Optional)</label>
                          <select
                            value={customGameProvider}
                            onChange={(e) => setCustomGameProvider(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer font-bold appearance-none"
                          >
                            <option value="">Select Provider</option>
                            <option value="GamePix">GamePix</option>
                            <option value="GameMonetize">GameMonetize</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Play URL / Iframe URL <span className="text-rose-500">*</span></label>
                        <input
                          type="url"
                          required
                          value={customGameUrl}
                          onChange={(e) => setCustomGameUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Thumbnail URL <span className="text-rose-500">*</span></label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              required
                              value={customGameThumbnailUrl}
                              onChange={(e) => setCustomGameThumbnailUrl(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-slate-400 focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700"
                            />
                            <label className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl cursor-pointer transition-all flex items-center justify-center">
                              <Upload size={18} />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setThumbnailUploading(true);
                                  try {
                                    const url = await uploadGameImage(file, setThumbnailUploadProgress);
                                    setCustomGameThumbnailUrl(url);
                                  } catch (err: any) {
                                    alert(err.message || "Failed to upload thumbnail");
                                  } finally {
                                    setThumbnailUploading(false);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Banner URL <span className="text-rose-500">*</span></label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              required
                              value={customGameBannerUrl}
                              onChange={(e) => setCustomGameBannerUrl(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-slate-400 focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700"
                            />
                            <label className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl cursor-pointer transition-all flex items-center justify-center">
                              <Upload size={18} />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setBannerUploading(true);
                                  try {
                                    const url = await uploadGameImage(file, setBannerUploadProgress);
                                    setCustomGameBannerUrl(url);
                                  } catch (err: any) {
                                    alert(err.message || "Failed to upload banner");
                                  } finally {
                                    setBannerUploading(false);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Description</label>
                        <textarea
                          rows={3}
                          value={customGameDescription}
                          onChange={(e) => setCustomGameDescription(e.target.value)}
                          placeholder="Brief description of the game..."
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700 resize-none font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</label>
                          <div className="flex gap-2">
                            <select
                              value={customGameCategory}
                              onChange={(e) => setCustomGameCategory(e.target.value)}
                              className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer font-bold appearance-none"
                            >
                              {(gameCategories.length > 0 ? gameCategories : [
                                { name: "Casual" }, { name: "Action" }, { name: "Sports" }, { name: "Puzzle" }, { name: "Racing" }
                              ]).map((c: any) => (
                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setCategoryModalOpen(true)}
                              className="p-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-2xl transition-all flex items-center justify-center"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tags (Comma Separated)</label>
                          <input
                            type="text"
                            value={customGameTags}
                            onChange={(e) => setCustomGameTags(e.target.value)}
                            placeholder="action, racing, multiplayer"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700 font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Instructions</label>
                        <textarea
                          rows={2}
                          value={customGameInstructions}
                          onChange={(e) => setCustomGameInstructions(e.target.value)}
                          placeholder="How to play instructions..."
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder-slate-700 resize-none font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Orientation</label>
                          <select
                            value={customGameOrientation}
                            onChange={(e) => setCustomGameOrientation(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-white font-bold"
                          >
                            <option value="landscape">Landscape</option>
                            <option value="portrait">Portrait</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Width</label>
                          <input
                            type="text"
                            value={customGameWidth}
                            onChange={(e) => setCustomGameWidth(e.target.value)}
                            placeholder="100%"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Height</label>
                          <input
                            type="text"
                            value={customGameHeight}
                            onChange={(e) => setCustomGameHeight(e.target.value)}
                            placeholder="600"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Reward Coins</label>
                          <input
                            type="number"
                            value={customGameRewardCoins}
                            onChange={(e) => setCustomGameRewardCoins(Number(e.target.value))}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Display Mode</label>
                          <select
                            value={customGameDisplayMode}
                            onChange={(e) => setCustomGameDisplayMode(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-white font-bold outline-none appearance-none"
                          >
                            <option value="smart">Smart Auto (Recommended)</option>
                            <option value="contain">Contain (Letterbox)</option>
                            <option value="cover">Cover (Fill Screen)</option>
                            <option value="stretch">Stretch (Force Fill)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/40">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Required Play Time (Seconds)</label>
                          <input
                            type="number"
                            value={customGameRequiredTime}
                            onChange={(e) => setCustomGameRequiredTime(Number(e.target.value))}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold"
                          />
                          <p className="text-[9px] text-slate-500 ml-1">Total time needed to claim reward.</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Minimum Active Time (Seconds)</label>
                          <input
                            type="number"
                            value={customGameMinActiveTime}
                            onChange={(e) => setCustomGameMinActiveTime(Number(e.target.value))}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold"
                          />
                          <p className="text-[9px] text-slate-500 ml-1">Time user must be active/focused.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Chrome Only</label>
                          <button
                            type="button"
                            onClick={() => setCustomGameChromeOnly(!customGameChromeOnly)}
                            className={`w-full p-4 rounded-2xl border transition-all text-[9px] font-black uppercase flex items-center justify-center gap-2 ${customGameChromeOnly ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Globe size={14} />
                            {customGameChromeOnly ? "YES" : "NO"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Allow WebView</label>
                          <button
                            type="button"
                            onClick={() => setCustomGameAllowWebView(!customGameAllowWebView)}
                            className={`w-full p-4 rounded-2xl border transition-all text-[9px] font-black uppercase flex items-center justify-center gap-2 ${customGameAllowWebView ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Smartphone size={14} />
                            {customGameAllowWebView ? "YES" : "NO"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Require WT</label>
                          <button
                            type="button"
                            onClick={() => setCustomGameRequireWalkthrough(!customGameRequireWalkthrough)}
                            className={`w-full p-4 rounded-2xl border transition-all text-[9px] font-black uppercase flex items-center justify-center gap-2 ${customGameRequireWalkthrough ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Tv size={14} />
                            {customGameRequireWalkthrough ? "YES" : "NO"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ext Browser</label>
                          <button
                            type="button"
                            onClick={() => setCustomGameExternalBrowserMode(!customGameExternalBrowserMode)}
                            className={`w-full p-4 rounded-2xl border transition-all text-[9px] font-black uppercase flex items-center justify-center gap-2 ${customGameExternalBrowserMode ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <ExternalLink size={14} />
                            {customGameExternalBrowserMode ? "YES" : "NO"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Featured</label>
                          <button
                            type="button"
                            onClick={() => setCustomGameFeatured(!customGameFeatured)}
                            className={`w-full p-4 rounded-2xl border transition-all text-xs font-black uppercase flex items-center justify-center gap-2 ${customGameFeatured ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Sparkles size={14} />
                            {customGameFeatured ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${customGameEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                              <Activity size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-wider">Status</p>
                              <p className="text-[10px] text-slate-500">{customGameEnabled ? "Game is Active" : "Game is Inactive"}</p>
                            </div>
                         </div>
                         <button
                            type="button"
                            onClick={() => setCustomGameEnabled(!customGameEnabled)}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${customGameEnabled ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
                          >
                            {customGameEnabled ? "Active" : "Inactive"}
                          </button>
                      </div>
                    </div>

                    {/* WALKTHROUGH SECTION */}
                    <div className="space-y-6 pt-8 border-t border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${customGameWalkthroughEnabled ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-500"}`}>
                            <Tv size={20} />
                          </div>
                          <h3 className="text-lg font-black text-white">Game Walkthrough (Optional)</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomGameWalkthroughEnabled(!customGameWalkthroughEnabled)}
                          className={`w-12 h-6 rounded-full relative transition-all ${customGameWalkthroughEnabled ? "bg-blue-600" : "bg-slate-800"}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${customGameWalkthroughEnabled ? "left-7" : "left-1"}`} />
                        </button>
                      </div>

                      {customGameWalkthroughEnabled && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-6 bg-slate-950/50 p-6 rounded-2xl border border-blue-500/10"
                        >
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Paste Raw Embed Code</label>
                            <textarea
                              rows={12}
                              value={customGameWalkthroughData.rawCode}
                              onChange={(e) => setCustomGameWalkthroughData({...customGameWalkthroughData, rawCode: e.target.value, mode: 'raw'})}
                              placeholder="Paste GameMonetize official embed code here..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500 resize-none"
                            />
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!customGameWalkthroughData.rawCode) {
                                    setCustomGameError("❌ Please paste embed code first");
                                    setTimeout(() => setCustomGameError(""), 3000);
                                    return;
                                  }
                                  setWalkthroughPreview({ ...customGameWalkthroughData, mode: 'raw' });
                                  setCustomGameSuccess("✅ Preview Ready");
                                  setTimeout(() => setCustomGameSuccess(""), 3000);
                                }}
                                className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-2"
                              >
                                <Eye size={14} /> Preview Walkthrough
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomGameSuccess("✅ Walkthrough Saved Successfully");
                                  setTimeout(() => setCustomGameSuccess(""), 3000);
                                }}
                                className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-2"
                              >
                                <Save size={14} /> Save Walkthrough
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-8">
                      <button
                        type="submit"
                        disabled={customGameSaving}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-500/20 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-wider"
                      >
                        {customGameSaving ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
                        Save Game Configuration
                      </button>
                    </div>
                  </form>
                </div>

                {/* PREVIEW SIDEBAR */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6 sticky top-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Eye size={16} className="text-purple-400" />
                      Live Previews
                    </h3>

                    {/* CARD PREVIEW */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">Card Preview</p>
                      <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
                        <div className="relative aspect-[16/9] bg-slate-900">
                          {customGameBannerUrl ? (
                            <img src={customGameBannerUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-800"><Image size={40} /></div>
                          )}
                          <div className="absolute top-3 right-3 flex gap-1.5">
                            <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase">{customGameOrientation}</span>
                            <span className="px-2 py-1 bg-purple-600/80 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase">{customGameCategory}</span>
                          </div>
                          <div className="absolute left-4 -bottom-6 w-12 h-12 bg-slate-900 rounded-xl border-4 border-slate-950 overflow-hidden">
                             {customGameThumbnailUrl ? (
                               <img src={customGameThumbnailUrl} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-800"><Plus size={20} /></div>
                             )}
                          </div>
                        </div>
                        <div className="p-4 pt-8 space-y-1">
                          <h4 className="text-sm font-black text-white truncate">{customGameTitle || "Game Title"}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{customGameDescription || "Game description will appear here..."}</p>
                          <div className="flex gap-2 pt-2">
                            {customGameFeatured && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[8px] font-black">FEATURED</span>}
                            {customGameEnabled && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black">ACTIVE</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MULTI-DEVICE PREVIEWS */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                       <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">Device Viewport Simulation</p>
                       
                       <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => {
                              if (!customGameUrl) return;
                              setPreviewGame({ title: customGameTitle, url: customGameUrl, orientation: customGameOrientation, mode: 'mobile' });
                            }}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white flex flex-col items-center gap-1 transition-all"
                          >
                            <Smartphone size={18} />
                            <span className="text-[8px] font-black">MOBILE</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (!customGameUrl) return;
                              setPreviewGame({ title: customGameTitle, url: customGameUrl, orientation: customGameOrientation, mode: 'tablet' });
                            }}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white flex flex-col items-center gap-1 transition-all"
                          >
                            <Tablet size={18} />
                            <span className="text-[8px] font-black">TABLET</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (!customGameUrl) return;
                              setPreviewGame({ title: customGameTitle, url: customGameUrl, orientation: customGameOrientation, mode: 'desktop' });
                            }}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white flex flex-col items-center gap-1 transition-all"
                          >
                            <Monitor size={18} />
                            <span className="text-[8px] font-black">DESKTOP</span>
                          </button>
                       </div>

                       <button
                         onClick={() => {
                           if (!customGameUrl) return;
                           setPreviewGame({ title: customGameTitle, url: customGameUrl, orientation: customGameOrientation });
                         }}
                         className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                       >
                         <ExternalLink size={14} />
                         Full Screen Preview
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Category Management Modal */}
              {categoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
                  <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryModalOpen(false);
                        setCategoryEditingId(null);
                        setNewCategoryName("");
                        setNewCategoryIcon("");
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                      <FolderPlus className="w-6 h-6 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">Manage Game Categories</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-1">
                      {/* Left Side: Create / Edit Form */}
                      <form onSubmit={saveCategory} className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          {categoryEditingId ? "✏️ Edit Category" : "➕ Create Category"}
                        </h4>

                        {categoryError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{categoryError}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Category Name <span className="text-purple-400">*</span></label>
                          <input
                            type="text"
                            required
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Multiplayer, Fighting"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 placeholder-slate-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Category Icon (Optional Emoji)</label>
                          <input
                            type="text"
                            value={newCategoryIcon}
                            onChange={(e) => setNewCategoryIcon(e.target.value)}
                            placeholder="e.g. 🎮, 👾, 🎯"
                            maxLength={4}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 placeholder-slate-600"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={categorySaving}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {categorySaving ? "Saving..." : categoryEditingId ? "Update Category" : "Create Category"}
                          </button>
                          {categoryEditingId && (
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryEditingId(null);
                                setNewCategoryName("");
                                setNewCategoryIcon("");
                              }}
                              className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Right Side: Manage Categories List */}
                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Categories List
                        </h4>
                        <div className="border border-slate-800 rounded-xl bg-slate-950 divide-y divide-slate-800/60 max-h-[40vh] overflow-y-auto">
                          {categoriesLoading ? (
                            <div className="p-4 text-center text-xs text-slate-500">Loading categories...</div>
                          ) : gameCategories.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">No categories found.</div>
                          ) : (
                            gameCategories.map((cat) => (
                              <div key={cat.id} className="flex justify-between items-center p-3 hover:bg-slate-900/40 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{cat.icon || "🎮"}</span>
                                  <span className="text-sm font-semibold text-slate-200">{cat.name}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategoryEditingId(cat.id);
                                      setNewCategoryName(cat.name);
                                      setNewCategoryIcon(cat.icon || "");
                                    }}
                                    className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteCategory(cat.id)}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "✏️ Manage Games" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    ✏️ Published Games Manager
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Directly supervise, edit, disable/enable, feature, and review stats of active RoyShare games.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span>Total Active Published: <strong>{publishedGames.length}</strong></span>
                </div>
              </div>

              {/* Search published games */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <Search className="w-5 h-5 text-slate-400 absolute left-8 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={publishedSearch}
                  onChange={(e) => setPublishedSearch(e.target.value)}
                  placeholder="Search published games by title or category..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>

              {publishedGamesLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {(() => {
                    const filtered = publishedGames.filter((g) => {
                      return (
                        g.title?.toLowerCase().includes(publishedSearch.toLowerCase()) ||
                        g.category?.toLowerCase().includes(publishedSearch.toLowerCase())
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                          <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto animate-pulse" />
                          <h3 className="text-lg font-bold text-slate-300">No published games found</h3>
                          <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Go to <strong>🎮 Game Catalog</strong> to import fetched GamePix titles or <strong>➕ Add Custom Game</strong> to register a custom game.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((game) => (
                          <div
                            key={game.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl"
                          >
                            <div className="relative">
                              <img
                                src={game.bannerUrl}
                                alt={game.title}
                                className="w-full aspect-[16/9] object-cover opacity-90"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-3 right-3 flex gap-1.5">
                                {game.featured && (
                                  <span className="bg-amber-500 border border-amber-400 text-[10px] font-extrabold text-slate-950 px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-md">
                                    ⭐️ Featured
                                  </span>
                                )}
                                <span className={`border text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md ${game.enabled !== false ? "bg-emerald-500/90 border-emerald-400 text-slate-950" : "bg-red-500/90 border-red-400 text-slate-950"}`}>
                                  {game.enabled !== false ? "Active" : "Disabled"}
                                </span>
                              </div>

                              {/* Thumbnail overlaid */}
                              <div className="absolute left-4 -bottom-6">
                                <img
                                  src={game.thumbnailUrl}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded-xl border-2 border-slate-900 shadow-md"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>

                            <div className="pt-8 px-5 pb-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-extrabold text-white text-base line-clamp-1">{game.title}</h3>
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {game.category}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                  {game.description || "Active HTML5 arcade game."}
                                </p>
                              </div>

                              {/* Analytics & Coins configuration summary (FUTURE READY DATA) */}
                              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px]">
                                <div className="space-y-0.5">
                                  <span className="text-slate-500 font-semibold uppercase text-[9px]">Play Count:</span>
                                  <div className="text-slate-200 font-bold">{game.playCount || 0} plays</div>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-500 font-semibold uppercase text-[9px]">Reward Rate:</span>
                                  <div className="text-purple-400 font-bold">{game.rewardSettings?.coinsPerMin || 10} coins/m</div>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-500 font-semibold uppercase text-[9px]">Clicks:</span>
                                  <div className="text-slate-200 font-bold">{game.clicks || 0}</div>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-500 font-semibold uppercase text-[9px]">Favorites:</span>
                                  <div className="text-slate-200 font-bold">{game.favoritesCount || 0}</div>
                                </div>
                              </div>

                              {/* Control switches row */}
                              <div className="flex gap-2 justify-between items-center text-xs text-slate-400 py-1">
                                <button
                                  onClick={() => updatePublishedGameStatus(game.id, { featured: !game.featured })}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${game.featured ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-950 border-slate-800 hover:bg-slate-800 hover:text-slate-300"}`}
                                >
                                  ⭐️ {game.featured ? "Unfeature" : "Feature Game"}
                                </button>

                                <button
                                  onClick={() => updatePublishedGameStatus(game.id, { enabled: game.enabled === false })}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${game.enabled !== false ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
                                >
                                  {game.enabled !== false ? "Disable" : "Enable"}
                                </button>
                              </div>

                              {/* Row Buttons */}
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50">
                                <button
                                  onClick={() => setPreviewGame(game)}
                                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Play
                                </button>
                                
                                <button
                                  onClick={() => setEditingGame({ ...game })}
                                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Edit
                                </button>

                                <button
                                  onClick={() => deleteGame(game.id)}
                                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-red-950/40 hover:bg-red-900 border border-red-900/60 text-red-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  <Trash className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* =======================================================================
              LIVE MODAL OVERLAYS (PREVIEW MODAL & EDIT MODAL)
              ======================================================================= */}
          <AnimatePresence>
            {/* Live Play Frame Preview Modal */}
            {previewGame && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative"
                >
                  <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-extrabold text-white">{previewGame.title}</h3>
                      <span className="text-xs uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {previewGame.orientation || "landscape"}
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewGame(null)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 bg-slate-950 p-2 flex items-center justify-center relative">
                    <iframe
                      src={previewGame.url}
                      width={previewGame.width || "100%"}
                      height={previewGame.height || "100%"}
                      className="w-full h-full border-0 rounded-lg shadow-inner bg-slate-950"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Edit Published Game Details Modal */}
            {editingGame && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col my-8"
                >
                  <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-2">
                      <Edit className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-extrabold text-white">Edit Published Game</h3>
                    </div>
                    <button
                      onClick={() => {
                        setEditingGame(null);
                        setEditGameError("");
                        setEditGameSuccess("");
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={saveEditedGame} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {editGameError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{editGameError}</span>
                      </div>
                    )}

                    {editGameSuccess && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{editGameSuccess}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Game Name</label>
                        <input
                          type="text"
                          required
                          value={editingGame.title}
                          onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Category</label>
                        <select
                          value={editingGame.category}
                          onChange={(e) => setEditingGame({ ...editingGame, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        >
                          {(gameCategories.length > 0 ? gameCategories : [
                            { name: "Casual" },
                            { name: "Action" },
                            { name: "Sports" },
                            { name: "Puzzle" },
                            { name: "Racing" },
                            { name: "Adventure" },
                            { name: "Strategy" },
                            { name: "Arcade" },
                            { name: "Simulation" }
                          ]).map((c) => (
                            <option key={c.id || c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Play URL</label>
                      <input
                        type="url"
                        required
                        value={editingGame.url}
                        onChange={(e) => setEditingGame({ ...editingGame, url: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Description</label>
                      <textarea
                        rows={2}
                        value={editingGame.description || ""}
                        onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Banner Image Upload */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex justify-between items-center">
                          <span>Banner Image</span>
                          <span className="text-[10px] text-slate-500">1600 × 900 • Max 5MB</span>
                        </label>

                        {editingGame.bannerUrl ? (
                          <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-slate-800 bg-slate-950 group">
                            <img
                              src={editingGame.bannerUrl}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                              <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg">
                                Replace Image
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditBannerUploading(true);
                                    setEditBannerUploadProgress(0);
                                    try {
                                      const url = await uploadGameImage(file, setEditBannerUploadProgress);
                                      setEditingGame({ ...editingGame, bannerUrl: url });
                                    } catch (err: any) {
                                      alert(err.message || "Failed to upload banner image");
                                    } finally {
                                      setEditBannerUploading(false);
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGame({ ...editingGame, bannerUrl: "" });
                                }}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (!file) return;
                              setEditBannerUploading(true);
                              setEditBannerUploadProgress(0);
                              try {
                                const url = await uploadGameImage(file, setEditBannerUploadProgress);
                                setEditingGame({ ...editingGame, bannerUrl: url });
                              } catch (err: any) {
                                  alert(err.message || "Failed to upload banner image");
                              } finally {
                                setEditBannerUploading(false);
                              }
                            }}
                            className="border-2 border-dashed border-slate-800 hover:border-purple-500/60 bg-slate-950 hover:bg-purple-950/5 rounded-xl aspect-[16/9] flex flex-col items-center justify-center text-center p-4 transition-all group relative cursor-pointer overflow-hidden"
                          >
                            {editBannerUploading ? (
                              <div className="w-full max-w-[200px] space-y-3">
                                <div className="flex justify-between text-xs text-slate-300 font-bold">
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> Uploading...
                                  </span>
                                  <span>{editBannerUploadProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-150"
                                    style={{ width: `${editBannerUploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-500 group-hover:text-purple-400 transition-colors mb-2" />
                                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                                  📤 Upload Banner Image
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1">
                                  Drag & Drop or click to browse
                                </span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditBannerUploading(true);
                                    setEditBannerUploadProgress(0);
                                    try {
                                      const url = await uploadGameImage(file, setEditBannerUploadProgress);
                                      setEditingGame({ ...editingGame, bannerUrl: url });
                                    } catch (err: any) {
                                      alert(err.message || "Failed to upload banner image");
                                    } finally {
                                      setEditBannerUploading(false);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Thumbnail Image Upload */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex justify-between items-center">
                          <span>Thumbnail Image</span>
                          <span className="text-[10px] text-slate-500">1:1 Square • Max 5MB</span>
                        </label>

                        {editingGame.thumbnailUrl ? (
                          <div className="relative rounded-xl overflow-hidden aspect-square border border-slate-800 bg-slate-950 w-28 group">
                            <img
                              src={editingGame.thumbnailUrl}
                              alt="Thumbnail Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                              <label className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[9px] rounded-md transition-all cursor-pointer shadow-md">
                                Replace
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditThumbnailUploading(true);
                                    setEditThumbnailUploadProgress(0);
                                    try {
                                      const url = await uploadGameImage(file, setEditThumbnailUploadProgress);
                                      setEditingGame({ ...editingGame, thumbnailUrl: url });
                                    } catch (err: any) {
                                      alert(err.message || "Failed to upload thumbnail");
                                    } finally {
                                      setEditThumbnailUploading(false);
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGame({ ...editingGame, thumbnailUrl: "" });
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] rounded-md transition-all cursor-pointer shadow-md"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (!file) return;
                              setEditThumbnailUploading(true);
                              setEditThumbnailUploadProgress(0);
                              try {
                                const url = await uploadGameImage(file, setEditThumbnailUploadProgress);
                                setEditingGame({ ...editingGame, thumbnailUrl: url });
                              } catch (err: any) {
                                alert(err.message || "Failed to upload thumbnail");
                              } finally {
                                setEditThumbnailUploading(false);
                              }
                            }}
                            className="border-2 border-dashed border-slate-800 hover:border-purple-500/60 bg-slate-950 hover:bg-purple-950/5 rounded-xl w-28 aspect-square flex flex-col items-center justify-center text-center p-2 transition-all group relative cursor-pointer overflow-hidden"
                          >
                            {editThumbnailUploading ? (
                              <div className="w-full space-y-2 px-1">
                                <span className="text-[10px] text-slate-300 font-bold block text-center">
                                  {editThumbnailUploadProgress}%
                                </span>
                                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                                  <div
                                    className="bg-purple-600 h-1 rounded-full transition-all duration-150"
                                    style={{ width: `${editThumbnailUploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <Upload className="w-6 h-6 text-slate-500 group-hover:text-purple-400 transition-colors mb-1" />
                                <span className="text-[10px] font-bold text-slate-200 group-hover:text-white transition-colors">
                                  Upload
                                </span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditThumbnailUploading(true);
                                    setEditThumbnailUploadProgress(0);
                                    try {
                                      const url = await uploadGameImage(file, setEditThumbnailUploadProgress);
                                      setEditingGame({ ...editingGame, thumbnailUrl: url });
                                    } catch (err: any) {
                                      alert(err.message || "Failed to upload thumbnail");
                                    } finally {
                                      setEditThumbnailUploading(false);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Orientation</label>
                        <select
                          value={editingGame.orientation}
                          onChange={(e) => setEditingGame({ ...editingGame, orientation: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="landscape">Landscape</option>
                          <option value="portrait">Portrait</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Width</label>
                        <input
                          type="text"
                          value={editingGame.width || ""}
                          onChange={(e) => setEditingGame({ ...editingGame, width: e.target.value })}
                          placeholder="100%"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Height</label>
                        <input
                          type="text"
                          value={editingGame.height || ""}
                          onChange={(e) => setEditingGame({ ...editingGame, height: e.target.value })}
                          placeholder="600px"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* FUTURE READY PARAMS EDIT */}
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Future Ready Features Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">Play Count Stat override</label>
                          <input
                            type="number"
                            value={editingGame.playCount || 0}
                            onChange={(e) => setEditingGame({ ...editingGame, playCount: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">Reward Coins Per Minute</label>
                          <input
                            type="number"
                            value={editingGame.rewardSettings?.coinsPerMin || 10}
                            onChange={(e) => setEditingGame({
                              ...editingGame,
                              rewardSettings: {
                                ...(editingGame.rewardSettings || {}),
                                coinsPerMin: parseInt(e.target.value) || 10
                              }
                            })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGame.featured}
                          onChange={(e) => setEditingGame({ ...editingGame, featured: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs font-bold text-slate-300">Featured</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGame.enabled !== false}
                          onChange={(e) => setEditingGame({ ...editingGame, enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs font-bold text-slate-300">Active Enabled</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGame(null);
                          setEditGameError("");
                          setEditGameSuccess("");
                        }}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={editGameSaving}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {editGameSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {activeTab === "📱 Telegram Settings" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📱 Telegram Settings
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Configure your official Telegram bots, channels, and groups for seamless broadcasting and system routing.
                  </p>
                </div>
              </div>

              {/* Status Notifications */}
              {(telegramOfficialSuccess || telegramOfficialError) && (
                <div className="max-w-4xl">
                  {telegramOfficialSuccess && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                      <span>{telegramOfficialSuccess}</span>
                    </div>
                  )}
                  {telegramOfficialError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold flex items-center gap-2">
                      <span>{telegramOfficialError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bot Credentials & Connection */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl hover:border-purple-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                      <Laptop className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Bot Credentials</h3>
                      <p className="text-xs text-slate-500">Official Telegram bot configuration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bot Token</label>
                      <input
                        type="password"
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        value={telegramOfficialSettings.botToken}
                        onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, botToken: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bot Username</label>
                      <input
                        type="text"
                        placeholder="@MyOfficialBot"
                        value={telegramOfficialSettings.botUsername}
                        onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, botUsername: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleTestBotConnection}
                        disabled={testBotLoading}
                        className="w-full bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {testBotLoading ? <RefreshCw className="animate-spin" size={14} /> : null}
                        Test Bot Connection
                      </button>
                    </div>

                    {testBotStatus && (
                      <div className={`p-3.5 rounded-xl text-xs font-semibold ${testBotStatus.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {testBotStatus.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Routing & Admin Configuration */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                      <Settings className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">System Settings</h3>
                      <p className="text-xs text-slate-500">Routing and admin alerts setup</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Admin Chat ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 987654321"
                        value={telegramOfficialSettings.adminChatId}
                        onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, adminChatId: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <p className="text-[10px] text-slate-500 ml-1">Telegram Chat ID of the system administrator.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 block mb-1">Default Broadcast Target</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["channel", "group", "both"].map((target) => (
                          <button
                            key={target}
                            type="button"
                            onClick={() => setTelegramOfficialSettings({...telegramOfficialSettings, defaultTarget: target})}
                            className={`py-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer uppercase ${
                              telegramOfficialSettings.defaultTarget === target
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                            }`}
                          >
                            {target}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Channel Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                      <Send className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Official Channel</h3>
                      <p className="text-xs text-slate-500">Public/private channel configuration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Channel Username</label>
                        <input
                          type="text"
                          placeholder="@MyOfficialChannel"
                          value={telegramOfficialSettings.channelUsername}
                          onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, channelUsername: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Channel Chat ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. -100123456789"
                          value={telegramOfficialSettings.channelChatId}
                          onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, channelChatId: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => testTelegramOfficialLink(telegramOfficialSettings.channelUsername)}
                        disabled={!telegramOfficialSettings.channelUsername}
                        className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <ExternalLink size={14} /> View Link
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyChannelAccess}
                        disabled={verifyChannelLoading}
                        className="flex-1 bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {verifyChannelLoading ? <RefreshCw className="animate-spin" size={12} /> : null}
                        Verify Access
                      </button>
                    </div>

                    {verifyChannelStatus && (
                      <div className={`p-3.5 rounded-xl text-xs font-semibold ${verifyChannelStatus.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {verifyChannelStatus.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Community Group Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Community Group</h3>
                      <p className="text-xs text-slate-500">Public/private group configuration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Group Username</label>
                        <input
                          type="text"
                          placeholder="@MyCommunityGroup"
                          value={telegramOfficialSettings.groupUsername}
                          onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, groupUsername: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Group Chat ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. -100987654321"
                          value={telegramOfficialSettings.groupChatId}
                          onChange={(e) => setTelegramOfficialSettings({...telegramOfficialSettings, groupChatId: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => testTelegramOfficialLink(telegramOfficialSettings.groupUsername)}
                        disabled={!telegramOfficialSettings.groupUsername}
                        className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <ExternalLink size={14} /> View Link
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyGroupAccess}
                        disabled={verifyGroupLoading}
                        className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {verifyGroupLoading ? <RefreshCw className="animate-spin" size={12} /> : null}
                        Verify Access
                      </button>
                    </div>

                    {verifyGroupStatus && (
                      <div className={`p-3.5 rounded-xl text-xs font-semibold ${verifyGroupStatus.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {verifyGroupStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Master Save Bar */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={saveTelegramOfficialSettings}
                  disabled={telegramOfficialSaving}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-w-[200px]"
                >
                  {telegramOfficialSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} 
                  {telegramOfficialSaving ? "Saving Settings..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "🎁 Gift Link Generator" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🎁 Gift Link Generator
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Generate dynamic, standalone link-based gift pages with auto-claiming capabilities and Telegram join verification.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Link Generator Form */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Generate New Gift Page</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                          Gift Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none placeholder-slate-600 font-medium transition"
                          placeholder="e.g. Play Store ₹100"
                          value={giftForm.name}
                          onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                          Gift Codes (one per line) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={8}
                          className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none placeholder-slate-600 font-mono text-sm transition"
                          placeholder="ABCD-EFGH-1111&#10;ZXCV-ASDF-2222&#10;QWER-TYUI-3333"
                          value={giftForm.codesText}
                          onChange={(e) => setGiftForm({ ...giftForm, codesText: e.target.value })}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-500">
                            Count: {giftForm.codesText.split("\n").filter(c => c.trim().length > 0).length} codes
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveGift}
                        disabled={giftsLoading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        {giftsLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Generate Gift Page</>
                        )}
                      </button>
                    </div>
                  </div>

                  {generatedLink && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">Gift Link Generated!</h4>
                          <p className="text-xs text-slate-400">Share this link with your users</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          className="flex-1 bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono px-3 py-2.5 rounded-xl outline-none select-all"
                          value={generatedLink}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLink);
                            alert("Link copied to clipboard!");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 rounded-xl transition"
                        >
                          Copy
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Panel: Gift Links List */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white">Active Gift Links ({gifts.length})</h3>
                      <button
                        onClick={fetchGifts}
                        disabled={giftsLoading}
                        className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition"
                      >
                        <RefreshCw className={`w-4 h-4 ${giftsLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {giftsLoading && gifts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-xs text-slate-400">Loading gift pages...</p>
                      </div>
                    ) : gifts.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                        <p className="text-sm text-slate-500">No gift links generated yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {gifts.map((gift) => {
                          const link = `https://t.me/Roysharearn_bot?startapp=gift_${gift.id}`;
                          return (
                            <div
                              key={gift.id}
                              className="bg-slate-950 border border-slate-850 rounded-2xl p-4 hover:border-slate-800 transition space-y-3"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="text-base font-black text-white">{gift.name}</h4>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Generated: {new Date(gift.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteGift(gift.id)}
                                  className="text-xs font-black text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/10 transition"
                                >
                                  Delete
                                </button>
                              </div>

                              <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 p-2 rounded-xl">
                                <span className="flex-1 font-mono text-[11px] text-blue-400 truncate select-all px-1">
                                  {link}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(link);
                                    alert("Link copied to clipboard!");
                                  }}
                                  className="text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg transition"
                                >
                                  Copy
                                </button>
                              </div>

                              <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="bg-slate-900/50 p-2 rounded-xl text-center">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total</span>
                                  <span className="text-sm font-black text-white block mt-0.5">{gift.totalCodes}</span>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded-xl text-center">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Claimed</span>
                                  <span className="text-sm font-black text-emerald-400 block mt-0.5">{gift.claimedCodes || 0}</span>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded-xl text-center">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Remaining</span>
                                  <span className="text-sm font-black text-blue-400 block mt-0.5">{gift.remainingCodes ?? gift.totalCodes}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "📊 Gift Claims History" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📊 Gift Claim History
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Review and search history of claimed gift codes by username, gift, or Telegram ID.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by User, Gift Name, Telegram ID..."
                    value={giftClaimsSearch}
                    onChange={(e) => setGiftClaimsSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <button
                  onClick={fetchGiftClaims}
                  disabled={giftClaimsLoading}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  🔄 Refresh History
                </button>
              </div>

              {giftClaimsLoading && giftClaims.length === 0 ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : giftClaims.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-2xl text-center text-slate-500">
                  No gift claims recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {giftClaims
                    .filter((claim) => {
                      const s = giftClaimsSearch.toLowerCase();
                      return (
                        (claim.username || "").toLowerCase().includes(s) ||
                        (claim.giftName || "").toLowerCase().includes(s) ||
                        (claim.telegramId || "").toString().toLowerCase().includes(s)
                      );
                    })
                    .map((claim) => (
                      <div
                        key={claim.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between gap-4 shadow-xl"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                <Award className="w-4 h-4 text-pink-500 shrink-0" />
                                {claim.giftName}
                              </h4>
                            </div>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {claim.status || "Claimed"}
                            </span>
                          </div>

                          <div className="border-t border-slate-800/80 pt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Name:</span>
                              <span className="text-white font-medium">{claim.firstName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Username:</span>
                              <span className="text-white font-medium">@{claim.username || "Anonymous"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Telegram ID:</span>
                              <span className="font-mono text-xs text-blue-400">{claim.telegramId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Claimed Code:</span>
                              <span className="font-mono text-sm bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-indigo-400 font-bold tracking-wider select-all">
                                {claim.claimedCode}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-[11px] text-slate-500">
                          <span>Claim Date & Time</span>
                          <span>{claim.claimedAt ? new Date(claim.claimedAt).toLocaleString() : "N/A"}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "📄 Ads.txt Manager" && (
            <div className="space-y-6">
              {/* Header Panel */}
              <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🛡 Ads.txt Manager
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Store, manage, and toggle ads.txt configuration snippets from multiple advertising & game providers.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-xs font-semibold">
                  🚀 Phase 1: Storage & Toggle Active
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-2.5 backdrop-blur-sm">
                <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">ℹ️ Note on Merging & Publishing</p>
                  <p>
                    At this stage, you can store, edit, and toggle provider snippets. 
                    The merge, preview, and public publish features to the main domain will be unlocked in the next system update.
                  </p>
                </div>
              </div>

              {/* Toast Alerts */}
              {providersSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{providersSuccess}</span>
                </motion.div>
              )}

              {providersError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{providersError}</span>
                </motion.div>
              )}

              {/* Core Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Section 1: Add/Edit Snippet Form (Span 5) */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {editingProviderId ? "✏️ Edit ads.txt Snippet" : "➕ Add ads.txt Snippet"}
                      </h3>
                      {editingProviderId && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[10px] font-bold">
                          Edit Mode
                        </span>
                      )}
                    </div>

                    <form onSubmit={saveAdsTxtProvider} className="space-y-4">
                      {/* Provider preset selector for convenient typing */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Select Provider Preset
                        </label>
                        <select
                          value={
                            ["GamePix", "GameMonetize", "Google AdSense", "Adsterra", "Monetag"].includes(providerNameField)
                              ? providerNameField
                              : providerNameField === ""
                              ? ""
                              : "Custom"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Custom") {
                              setProviderNameField("");
                              setProviderTypeField("Custom");
                            } else {
                              setProviderNameField(val);
                              // Auto assign corresponding type for preset
                              if (["GamePix", "GameMonetize"].includes(val)) {
                                setProviderTypeField("Game Provider");
                              } else if (["Google AdSense", "Adsterra", "Monetag"].includes(val)) {
                                setProviderTypeField("Ad Network");
                              }
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                        >
                          <option value="">-- Choose a Preset --</option>
                          <option value="GamePix">GamePix</option>
                          <option value="GameMonetize">GameMonetize</option>
                          <option value="Google AdSense">Google AdSense</option>
                          <option value="Adsterra">Adsterra</option>
                          <option value="Monetag">Monetag</option>
                          <option value="Custom">Custom / Other Provider</option>
                        </select>
                      </div>

                      {/* Provider Name Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Provider Name
                        </label>
                        <input
                          type="text"
                          value={providerNameField}
                          onChange={(e) => setProviderNameField(e.target.value)}
                          placeholder="e.g. MyAdPlatform"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      {/* Provider Type */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Provider Type
                        </label>
                        <select
                          value={providerTypeField}
                          onChange={(e) => setProviderTypeField(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                        >
                          <option value="Game Provider">Game Provider</option>
                          <option value="Ad Network">Ad Network</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      {/* Snippet Content Area */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Paste ads.txt Snippet Here
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Paste multi-line raw definitions exactly as provided (no modified formatting).
                        </p>
                        <textarea
                          value={providerSnippetField}
                          onChange={(e) => setProviderSnippetField(e.target.value)}
                          placeholder="google.com, pub-100200300400500, DIRECT, f08c47fec0942fa0"
                          className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500 whitespace-pre scrollbar-thin"
                          required
                        />
                      </div>

                      {/* Form Button Actions */}
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={clearProviderForm}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700 text-xs text-center active:scale-95"
                        >
                          🗑 Clear
                        </button>
                        <button
                          type="submit"
                          disabled={adsTxtProvidersSaving}
                          className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1 shadow-lg active:scale-95 disabled:opacity-50"
                        >
                          {adsTxtProvidersSaving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" /> {editingProviderId ? "Update Snippet" : "Save Snippet"}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Section 2: Saved Providers List (Span 7) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      📋 Saved Providers
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-full font-black">
                        {adsTxtProviders.length}
                      </span>
                    </h3>
                  </div>

                  {adsTxtProvidersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                      <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                      <p className="text-xs text-slate-400">Loading saved provider snippets...</p>
                    </div>
                  ) : adsTxtProviders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-center p-6 space-y-3 shadow-xl">
                      <FileCode className="w-12 h-12 text-slate-600" />
                      <p className="text-sm font-bold text-slate-300">No advertising providers configured yet</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Use the form on the left to add GamePix, Google AdSense, or other networks to begin tracking and publishing your ads.txt components.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adsTxtProviders.map((provider) => {
                        const typeColors = {
                          "Game Provider": "bg-sky-500/10 text-sky-400 border-sky-500/20",
                          "Ad Network": "bg-purple-500/10 text-purple-400 border-purple-500/20",
                          "Custom": "bg-slate-500/10 text-slate-400 border-slate-500/20",
                        };
                        const typeBadge = typeColors[provider.providerType] || typeColors["Custom"];

                        return (
                          <div
                            key={provider.id}
                            className={`bg-slate-900 border transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 relative overflow-hidden group ${
                              editingProviderId === provider.id ? "border-purple-500" : "border-slate-800"
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Provider title line & status toggle */}
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-white text-base tracking-tight leading-tight">
                                    {provider.providerName}
                                  </h4>
                                  <span className={`inline-block px-2 py-0.5 border rounded text-[10px] font-bold ${typeBadge}`}>
                                    {provider.providerType}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleAdsTxtProvider(provider.id!, provider.enabled, provider.providerName)}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    provider.enabled
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                      : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                  }`}
                                  title={provider.enabled ? "Click to Disable" : "Click to Enable"}
                                >
                                  {provider.enabled ? "● Active" : "○ Disabled"}
                                </button>
                              </div>

                              {/* Dates block */}
                              <div className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                                <p>Created: {provider.createdAt ? new Date(provider.createdAt).toLocaleDateString() : "Unknown"}</p>
                                <p>Updated: {provider.updatedAt ? new Date(provider.updatedAt).toLocaleDateString() : "Unknown"}</p>
                              </div>

                              {/* Snippet Preview */}
                              <div className="pt-2">
                                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg max-h-24 overflow-y-auto font-mono text-[10px] text-slate-400 whitespace-pre scrollbar-thin">
                                  {provider.snippet}
                                </div>
                              </div>
                            </div>

                            {/* Actions block */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                              <button
                                onClick={() => startEditingProvider(provider)}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                              >
                                <Edit className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => deleteAdsTxtProvider(provider.id!, provider.providerName)}
                                className="flex-1 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 text-xs font-bold rounded-lg border border-red-900/30 transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === "🎮 Game Rewards" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🎮 Game Reward Settings
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGameRewardSettings({
                      enabled: true,
                      requiredPlayTime: 180,
                      rewardCoins: 100,
                      conversionCoins: 1000,
                      conversionInr: 1,
                      dailyCoinLimit: 5000,
                      cooldownMinutes: 5,
                      maxDailyRewards: 50
                    })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all border border-slate-700 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                  <button
                    onClick={saveGameRewardSettings}
                    disabled={gameRewardSettingsSaving || gameRewardSettingsLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {gameRewardSettingsSaving ? "Saving..." : "💾 Save Settings"}
                  </button>
                </div>
              </div>

              {gameRewardSettingsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Settings...</p>
                </div>
              ) : (
                <>
                  {gameRewardSettingsSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="font-bold uppercase tracking-widest text-xs">{gameRewardSettingsSuccess}</p>
                    </div>
                  )}

                  {gameRewardSettingsError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5" />
                      <p className="font-bold text-sm">{gameRewardSettingsError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Configuration */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-white uppercase tracking-tighter">Core Configuration</h3>
                          <p className="text-xs text-slate-500 font-medium">Toggle rewards and basic play requirements.</p>
                        </div>
                        <button
                          onClick={() => setGameRewardSettings({...gameRewardSettings, enabled: !gameRewardSettings.enabled})}
                          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${gameRewardSettings.enabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${gameRewardSettings.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Required Play Time</label>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={Number(gameRewardSettings.requiredPlayTime || 0)}
                              onChange={(e) => setGameRewardSettings({...gameRewardSettings, requiredPlayTime: Number(e.target.value)})}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={60}>1 Minute</option>
                              <option value={120}>2 Minutes</option>
                              <option value={180}>3 Minutes</option>
                              <option value={300}>5 Minutes</option>
                              <option value={600}>10 Minutes</option>
                              <option value={0}>Custom (Seconds)</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Or enter seconds..."
                              value={Number(gameRewardSettings.requiredPlayTime || 0)}
                              onChange={(e) => setGameRewardSettings({...gameRewardSettings, requiredPlayTime: Number(e.target.value)})}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 italic">User must play for this duration before claiming reward.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Minimum Active Time (Seconds)</label>
                          <input
                            type="number"
                            value={Number(gameRewardSettings.minActiveTime || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, minActiveTime: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-500 italic">User must be active/focused for this long.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Required Interactions</label>
                          <input
                            type="number"
                            value={Number(gameRewardSettings.minInteractions || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, minInteractions: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-500 italic">Minimum number of interactions (clicks/keys) required.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Reward Coins</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={Number(gameRewardSettings.rewardCoins || 0)}
                              onChange={(e) => setGameRewardSettings({...gameRewardSettings, rewardCoins: Number(e.target.value)})}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                            />
                            <Coins className="absolute left-3 top-3.5 w-4 h-4 text-amber-500" />
                          </div>
                          <p className="text-[10px] text-slate-500 italic">Amount of coins awarded per successful play session.</p>
                        </div>
                      </div>
                    </div>

                    {/* Security Configuration */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Security & Browser</h3>
                        <p className="text-xs text-slate-500 font-medium">Global platform restrictions and security logic.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Chrome Only</label>
                          <button
                            onClick={() => setGameRewardSettings({...gameRewardSettings, chromeOnly: !gameRewardSettings.chromeOnly})}
                            className={`w-full p-4 rounded-2xl border transition-all text-xs font-black uppercase flex items-center justify-center gap-2 ${gameRewardSettings.chromeOnly ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Globe size={14} />
                            {gameRewardSettings.chromeOnly ? "ON" : "OFF"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Allow WebView</label>
                          <button
                            onClick={() => setGameRewardSettings({...gameRewardSettings, allowWebView: !gameRewardSettings.allowWebView})}
                            className={`w-full p-4 rounded-2xl border transition-all text-xs font-black uppercase flex items-center justify-center gap-2 ${gameRewardSettings.allowWebView ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Smartphone size={14} />
                            {gameRewardSettings.allowWebView ? "ON" : "OFF"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Require WT</label>
                          <button
                            onClick={() => setGameRewardSettings({...gameRewardSettings, requireWalkthrough: !gameRewardSettings.requireWalkthrough})}
                            className={`w-full p-4 rounded-2xl border transition-all text-xs font-black uppercase flex items-center justify-center gap-2 ${gameRewardSettings.requireWalkthrough ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <Tv size={14} />
                            {gameRewardSettings.requireWalkthrough ? "ON" : "OFF"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ext Browser</label>
                          <button
                            onClick={() => setGameRewardSettings({...gameRewardSettings, externalBrowserMode: !gameRewardSettings.externalBrowserMode})}
                            className={`w-full p-4 rounded-2xl border transition-all text-xs font-black uppercase flex items-center justify-center gap-2 ${gameRewardSettings.externalBrowserMode ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-slate-950/50 border-slate-800 text-slate-500"}`}
                          >
                            <ExternalLink size={14} />
                            {gameRewardSettings.externalBrowserMode ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Economic Configuration */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Coin Conversion</h3>
                        <p className="text-xs text-slate-500 font-medium">Define the monetary value of arcade coins.</p>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Coins</label>
                          <input
                            type="number"
                            value={Number(gameRewardSettings.conversionCoins || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, conversionCoins: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="pt-6">
                          <ArrowRight className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={Number(gameRewardSettings.conversionInr || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, conversionInr: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <p className="text-xs text-blue-400 text-center font-bold">
                          Current Rate: {Number(gameRewardSettings.conversionCoins || 0)} Coins = ₹{Number(gameRewardSettings.conversionInr || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Limits Configuration */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Limits & Cooldowns</h3>
                        <p className="text-xs text-slate-500 font-medium">Control the pace of earnings to prevent abuse.</p>
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Coin Limit</label>
                          <input
                            type="number"
                            value={Number(gameRewardSettings.dailyCoinLimit || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, dailyCoinLimit: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-500 italic">Total coins a user can earn per day (0 for unlimited).</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Max Rewards Per Day</label>
                          <input
                            type="number"
                            value={Number(gameRewardSettings.maxDailyRewards || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, maxDailyRewards: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-500 italic">Maximum number of sessions rewarded per user per day.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cooldown (Minutes)</label>
                          <select
                            value={Number(gameRewardSettings.cooldownMinutes || 0)}
                            onChange={(e) => setGameRewardSettings({...gameRewardSettings, cooldownMinutes: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value={0}>0 Min (Instantly)</option>
                            <option value={2}>2 Min</option>
                            <option value={5}>5 Min</option>
                            <option value={10}>10 Min</option>
                            <option value={30}>30 Min</option>
                            <option value={60}>1 Hour</option>
                          </select>
                          <p className="text-[10px] text-slate-500 italic">Waiting time required between two rewarded sessions.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
                      "🖼 Image Hosting (ImgBB)",
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
                              Announcement Channel ID
                            </label>
                            <input
                              type="text"
                              value={telegramConfigs.announcementChannelId || ""}
                              onChange={(e) =>
                                setTelegramConfigs({
                                  ...telegramConfigs,
                                  announcementChannelId: e.target.value,
                                })
                              }
                              placeholder="e.g. -1001234567890"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Channel where game announcements will be posted.</p>
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
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                              Control Panel Utilities
                            </h4>
                            {telegramConfigs.updatedAt && (
                              <span className="text-xs text-slate-500 font-mono">
                                🕒 Last Updated: {new Date(telegramConfigs.updatedAt).toLocaleString()}
                              </span>
                            )}
                          </div>

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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Report Bug Link / Contact
                              </label>
                              <input
                                type="text"
                                value={supportSettings.reportBugUrl || ""}
                                onChange={(e) =>
                                  setSupportSettings({
                                    ...supportSettings,
                                    reportBugUrl: e.target.value,
                                  })
                                }
                                placeholder="@RoyShare_Dev"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Business Contact
                              </label>
                              <input
                                type="text"
                                value={supportSettings.businessContact || ""}
                                onChange={(e) =>
                                  setSupportSettings({
                                    ...supportSettings,
                                    businessContact: e.target.value,
                                  })
                                }
                                placeholder="biz@royshare.online"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 md:col-span-2 mt-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-300">
                                  📢 Auto Game Announcement (Telegram Channel)
                                </label>
                                <p className="text-[10px] text-slate-500 font-medium">Whenever you publish a new game, it will be automatically posted to your configured Telegram Channel.</p>
                              </div>
                              <button
                                onClick={() =>
                                  setSupportSettings({
                                    ...supportSettings,
                                    autoAnnounceGames: !supportSettings.autoAnnounceGames,
                                  })
                                }
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${supportSettings.autoAnnounceGames ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "bg-slate-800 text-slate-400"}`}
                              >
                                {supportSettings.autoAnnounceGames ? "ENABLED" : "DISABLED"}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              FAQ Settings (JSON Array)
                            </label>
                            <textarea
                              value={supportSettings.faqJson || "[]"}
                              onChange={(e) =>
                                setSupportSettings({
                                  ...supportSettings,
                                  faqJson: e.target.value,
                                })
                              }
                              rows={5}
                              placeholder='[{"q": "How to earn?", "a": "Share links!"}]'
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
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

                    {settingsTab === "🖼 Image Hosting (ImgBB)" && (
                      <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                🖼 Image Hosting (ImgBB)
                              </h4>
                              <p className="text-slate-400 text-xs mt-1">
                                Configure ImgBB image hosting to replace Firebase Storage.
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${imgbbVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                              {imgbbStatus}
                            </span>
                          </div>

                          {imgbbSuccess && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                              {imgbbSuccess}
                            </div>
                          )}

                          {imgbbError && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
                              {imgbbError}
                            </div>
                          )}

                          <form onSubmit={saveImgbbApiKey} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">
                                ImgBB API Key
                              </label>
                              <input
                                type="password"
                                value={imgbbApiKey}
                                onChange={(e) => setImgbbApiKey(e.target.value)}
                                placeholder="Paste your ImgBB API Key"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                Get your API key from your ImgBB account settings (under API tab).
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={imgbbSaving || imgbbLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-900/20 text-sm animate-none"
                              >
                                {imgbbSaving ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>✅ Save API Key</>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={verifyImgbbApi}
                                disabled={imgbbVerifying || imgbbLoading || !imgbbApiKey}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-sm animate-none"
                              >
                                {imgbbVerifying ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Verifying...
                                  </>
                                ) : (
                                  <>🔍 Verify API</>
                                )}
                              </button>
                            </div>
                          </form>

                          {/* Connection details box */}
                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500 text-xs block">Status:</span>
                              <span className={`font-semibold ${imgbbVerified ? "text-emerald-400" : "text-amber-400"}`}>
                                {imgbbVerified ? "Connected" : "Disconnected"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-xs block">Provider:</span>
                              <span className="font-semibold text-white">ImgBB</span>
                            </div>
                          </div>
                        </div>

                        {/* Test Upload Card */}
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                          <div>
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                              🧪 Test Image Upload
                            </h4>
                            <p className="text-slate-400 text-xs mt-1">
                              Verify the image hosting is working by uploading a local asset.
                            </p>
                          </div>

                          {imgbbTestSuccess && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                              {imgbbTestSuccess}
                            </div>
                          )}

                          {imgbbTestError && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
                              {imgbbTestError}
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  {imgbbTestingUpload ? (
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                      <p className="text-sm text-slate-400">Uploading to ImgBB...</p>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-2xl mb-1">📁</span>
                                      <p className="text-sm text-slate-300 font-medium">Click to select a test image</p>
                                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                                    </>
                                  )}
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImgbbTestUpload}
                                  disabled={imgbbTestingUpload || !imgbbVerified}
                                />
                              </label>
                            </div>

                            {imgbbTestUrl && (
                              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                                <div>
                                  <span className="text-slate-500 text-xs block mb-1">Uploaded Image URL:</span>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={imgbbTestUrl}
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(imgbbTestUrl);
                                        alert("URL Copied!");
                                      }}
                                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg font-medium border border-slate-700 shrink-0 transition-colors"
                                    >
                                      📋 Copy
                                    </button>
                                    <a
                                      href={imgbbTestUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-lg font-medium shrink-0 transition-colors flex items-center"
                                    >
                                      🔗 Open
                                    </a>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800/60">
                                  <span className="text-slate-500 text-xs block mb-2">Image Preview:</span>
                                  <div className="max-w-xs bg-slate-950 p-2 rounded-xl border border-slate-800">
                                    <img
                                      src={imgbbTestDisplayUrl}
                                      alt="ImgBB Test Preview"
                                      referrerPolicy="no-referrer"
                                      className="w-full max-h-48 object-contain rounded-lg"
                                    />
                                  </div>
                                </div>
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