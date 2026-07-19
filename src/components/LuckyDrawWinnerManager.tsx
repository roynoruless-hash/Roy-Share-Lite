import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { 
  Trophy, 
  Copy, 
  Check, 
  Gift, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  Coins, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Filter,
  X,
  Share2,
  QrCode,
  Play,
  Pause,
  RotateCcw,
  Info,
  Sliders,
  Settings,
  Eye,
  ListFilter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageUpload } from "./ImageUpload";
import { formatFriendlyKolkata, parseInKolkata } from "../lib/dateUtils";
import WinnerCardGenerator from "./WinnerCardGenerator";
import { API_BASE } from "../config/api";

export default function LuckyDrawWinnerManager() {
  // --- REAL-TIME FIRESTORE LISTS ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Active, Draft, Paused, Ended, Upcoming, Completed

  // Bot configuration for link generation
  const [botUsername, setBotUsername] = useState("Roysharearn_bot");
  const [miniAppShortName, setMiniAppShortName] = useState("app");

  // --- STATS ---
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalParticipants: 0,
    prizePool: 0,
    totalWinners: 0
  });

  // --- COMPONENT MODALS & FORM STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "duplicate">("create");
  const [activeTab, setActiveTab] = useState<'basic' | 'prize' | 'schedule' | 'rules' | 'advanced'>('basic');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Form Fields
  const [formId, setFormId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBannerUrl, setFormBannerUrl] = useState("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState("");
  const [formStatus, setFormStatus] = useState<'Draft' | 'Active' | 'Paused' | 'Ended'>('Draft');
  const [formAdsgramType, setFormAdsgramType] = useState<"Reward" | "Interstitial" | "Task">("Reward");

  const [formPrizeType, setFormPrizeType] = useState<'Cash' | 'UPI' | 'Gift' | 'Coupon' | 'Custom'>('Cash');
  const [formPrizeAmount, setFormPrizeAmount] = useState<number>(100);
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formWinnerCount, setFormWinnerCount] = useState<number>(5);

      const [formEndDate, setFormEndDate] = useState("");
  const [formEndTime, setFormEndTime] = useState("");

  const [formRequireTgChannel, setFormRequireTgChannel] = useState(false);
  const [formRequireTgGroup, setFormRequireTgGroup] = useState(false);
  const [formMinReferrals, setFormMinReferrals] = useState<number>(0);
  const [formMinRewardTasks, setFormMinRewardTasks] = useState<number>(0);
  const [formRequireAccountVerification, setFormRequireAccountVerification] = useState(false);
  const [formRequireWalletConnected, setFormRequireWalletConnected] = useState(false);
  const [formRequireMobileVerification, setFormRequireMobileVerification] = useState(false);
  const [formRequireEmailVerification, setFormRequireEmailVerification] = useState(false);
  const [formMaxParticipants, setFormMaxParticipants] = useState<number>(1000);

  const [formVisibility, setFormVisibility] = useState<'Public' | 'Private' | 'Hidden'>('Public');

  const [formThemeColor, setFormThemeColor] = useState("#3b82f6");
  const [formButtonColor, setFormButtonColor] = useState("#2563eb");
  const [formBackground, setFormBackground] = useState("slate-950");
  const [formWinnerAnimation, setFormWinnerAnimation] = useState("Confetti");
  const [formAutoPublish, setFormAutoPublish] = useState(true);
  const [formAutoEnd, setFormAutoEnd] = useState(true);
  const [formAutoNotify, setFormAutoNotify] = useState(true);

  // Active / Selected Giveaway contexts
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Participants Sub-Drawer States
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantsSearch, setParticipantsSearch] = useState("");
  const [participantsFilter, setParticipantsFilter] = useState("All"); // All, Eligible, Ineligible
  const [participantsPage, setParticipantsPage] = useState(1);
  const [isScanningUsers, setIsScanningUsers] = useState(false);

  // Pick Winner Modal States
  const [isPickWinnerModalOpen, setIsPickWinnerModalOpen] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnWinners, setDrawnWinners] = useState<any[]>([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  const [tempWinnerName, setTempWinnerName] = useState("");

  // Preview / Simulated Display States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Helper: Show custom premium toast notifications
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper: Autogenerate Campaign ID
  const generateCampaignId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "LD-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Initialize bot settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const querySnap = await getDocs(query(collection(db, "settings")));
        const tgDoc = querySnap.docs.find(d => d.id === "telegram");
        if (tgDoc && tgDoc.exists()) {
          const data = tgDoc.data();
          if (data.botUsername) {
            setBotUsername(data.botUsername.replace("@", "").trim());
          }
          if (data.miniAppShortName) {
            setMiniAppShortName(data.miniAppShortName.trim());
          }
        }
      } catch (err) {
        console.error("[LuckyDraw] Error fetching bot settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Set up real-time listener for Campaigns (lucky_draws)
  useEffect(() => {
    console.log("[LuckyDraw] Initializing real-time lucky_draws listener");
    const q = query(collection(db, "lucky_draws"));
    const unsub = onSnapshot(q, 
      (snap) => {
        const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        // Sort by createdAt descending
        list.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setCampaigns(list);
        setLoading(false);
      },
      (err) => {
        console.error("[LuckyDraw] Error loading campaigns:", err);
        setError("Failed to load campaigns.");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Set up real-time listener for Statistics calculation
  useEffect(() => {
    if (loading) return;

    // We can pull the dynamic active stats based on real-time snapshots
    let activeCount = 0;
    let completedCount = 0;
    let totalPSize = 0;
    let totalWinnersPicked = 0;

    campaigns.forEach(c => {
      if (c.status === "Active") activeCount++;
      if (c.status === "Ended") completedCount++;
      totalPSize += (Number(c.prizeAmount || 0) * Number(c.winnerCount || 1));
    });

    // Realtime Winner Count
    const unsubWinners = onSnapshot(collection(db, "lucky_draw_winners"), (snap) => {
      totalWinnersPicked = snap.size;

      // Realtime Participants Count
      onSnapshot(collection(db, "lucky_draw_participants"), (pSnap) => {
        setStats({
          totalCampaigns: campaigns.length,
          activeCampaigns: activeCount,
          completedCampaigns: completedCount,
          totalParticipants: pSnap.size,
          prizePool: totalPSize,
          totalWinners: totalWinnersPicked
        });
      });
    });

    return () => {
      // Best-effort cleanup
    };
  }, [campaigns, loading]);

  // Real-time listen for winners of the active campaign context
  useEffect(() => {
    if (!selectedCampaign) return;
    const q = query(
      collection(db, "lucky_draw_winners"),
      where("campaignId", "==", selectedCampaign.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setWinners(list);
    });
    return unsub;
  }, [selectedCampaign]);

  // Real-time listen for participants of the active campaign context
  useEffect(() => {
    if (!selectedCampaign || !isParticipantsModalOpen) return;
    const q = query(
      collection(db, "lucky_draw_participants"),
      where("campaignId", "==", selectedCampaign.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setParticipants(list);
    });
    return unsub;
  }, [selectedCampaign, isParticipantsModalOpen]);

  // Helper: Evaluate Eligibility dynamically
  const checkEligibility = (p: any, c: any) => {
    const reasons: string[] = [];
    const rules = c.rules || {};

    if (rules.requireTgChannel && !p.membershipVerified) {
      reasons.push("Telegram Channel not joined");
    }
    if (rules.requireTgGroup && !p.membershipVerified) {
      reasons.push("Telegram Group not joined");
    }
    if (rules.minReferrals && (p.referralCount || 0) < Number(rules.minReferrals)) {
      reasons.push(`Under ${rules.minReferrals} referrals (has ${p.referralCount || 0})`);
    }
    if (rules.minRewardTasks && (p.rewardTasksCompleted || 0) < Number(rules.minRewardTasks)) {
      reasons.push(`Under ${rules.minRewardTasks} reward tasks completed (has ${p.rewardTasksCompleted || 0})`);
    }
    if (rules.requireAccountVerification && !p.isVerified) {
      reasons.push("Account not verified");
    }
    if (rules.requireWalletConnected && !p.isWalletConnected) {
      reasons.push("Wallet not connected");
    }
    if (rules.requireMobileVerification && !p.isMobileVerified) {
      reasons.push("Mobile not verified");
    }
    if (rules.requireEmailVerification && !p.isEmailVerified) {
      reasons.push("Email not verified");
    }

    return {
      isEligible: reasons.length === 0,
      reasons
    };
  };

  // Action: Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormId(generateCampaignId());
    setFormTitle("");
    setFormDescription("");
    setFormBannerUrl("");
    setFormThumbnailUrl("");
    setFormStatus("Active");
    
    setFormPrizeType("UPI");
    setFormPrizeAmount(100);
    setFormCurrency("INR");
    setFormWinnerCount(5);

    // Default dates to today & tomorrow
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            setFormEndDate(tomorrow.toISOString().split("T")[0]);
    setFormEndTime("12:00");

    setFormRequireTgChannel(false);
    setFormRequireTgGroup(false);
    setFormMinReferrals(0);
    setFormMinRewardTasks(0);
    setFormRequireAccountVerification(false);
    setFormRequireWalletConnected(false);
    setFormRequireMobileVerification(false);
    setFormRequireEmailVerification(false);
    setFormMaxParticipants(1000);

    setFormVisibility("Public");

    setFormThemeColor("#3b82f6");
    setFormButtonColor("#2563eb");
    setFormBackground("slate-950");
    setFormWinnerAnimation("Confetti");
    setFormAutoPublish(true);
    setFormAutoEnd(true);
    setFormAutoNotify(true);
    setFormAdsgramType("Reward");

    setActiveTab("basic");
    setIsModalOpen(true);
  };

  // Action: Open Edit Modal
  const handleOpenEditModal = (c: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setModalMode("edit");
    setFormId(c.id);
    setFormTitle(c.title || "");
    setFormDescription(c.description || "");
    setFormBannerUrl(c.bannerUrl || "");
    setFormThumbnailUrl(c.thumbnailUrl || "");
    setFormStatus(c.status || "Draft");

    setFormPrizeType(c.prizeType || "Cash");
    setFormPrizeAmount(c.prizeAmount || 100);
    setFormCurrency(c.currency || "INR");
    setFormWinnerCount(c.winnerCount || 5);

            setFormEndDate(c.endDate || "");
    setFormEndTime(c.endTime || "");

    const rules = c.rules || {};
    setFormRequireTgChannel(!!rules.requireTgChannel);
    setFormRequireTgGroup(!!rules.requireTgGroup);
    setFormMinReferrals(Number(rules.minReferrals || 0));
    setFormMinRewardTasks(Number(rules.minRewardTasks || 0));
    setFormRequireAccountVerification(!!rules.requireAccountVerification);
    setFormRequireWalletConnected(!!rules.requireWalletConnected);
    setFormRequireMobileVerification(!!rules.requireMobileVerification);
    setFormRequireEmailVerification(!!rules.requireEmailVerification);
    setFormMaxParticipants(Number(rules.maxParticipants || 1000));

    setFormVisibility(c.visibility || "Public");

    const adv = c.advanced || {};
    setFormThemeColor(adv.themeColor || "#3b82f6");
    setFormButtonColor(adv.buttonColor || "#2563eb");
    setFormBackground(adv.background || "slate-950");
    setFormWinnerAnimation(adv.winnerAnimation || "Confetti");
    setFormAutoPublish(adv.autoPublish !== false);
    setFormAutoEnd(adv.autoEnd !== false);
    setFormAutoNotify(adv.autoNotify !== false);
    setFormAdsgramType(c.adsgramType || "Reward");

    setActiveTab("basic");
    setIsModalOpen(true);
  };

  // Action: Duplicate Campaign
  const handleDuplicateCampaign = (c: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setModalMode("duplicate");
    setFormId(generateCampaignId());
    setFormTitle(`${c.title} - Copy`);
    setFormDescription(c.description || "");
    setFormBannerUrl(c.bannerUrl || "");
    setFormThumbnailUrl(c.thumbnailUrl || "");
    setFormStatus("Draft"); // default duplicate to draft

    setFormPrizeType(c.prizeType || "Cash");
    setFormPrizeAmount(c.prizeAmount || 100);
    setFormCurrency(c.currency || "INR");
    setFormWinnerCount(c.winnerCount || 5);

            setFormEndDate(c.endDate || "");
    setFormEndTime(c.endTime || "");

    const rules = c.rules || {};
    setFormRequireTgChannel(!!rules.requireTgChannel);
    setFormRequireTgGroup(!!rules.requireTgGroup);
    setFormMinReferrals(Number(rules.minReferrals || 0));
    setFormMinRewardTasks(Number(rules.minRewardTasks || 0));
    setFormRequireAccountVerification(!!rules.requireAccountVerification);
    setFormRequireWalletConnected(!!rules.requireWalletConnected);
    setFormRequireMobileVerification(!!rules.requireMobileVerification);
    setFormRequireEmailVerification(!!rules.requireEmailVerification);
    setFormMaxParticipants(Number(rules.maxParticipants || 1000));

    setFormVisibility(c.visibility || "Public");

    const adv = c.advanced || {};
    setFormThemeColor(adv.themeColor || "#3b82f6");
    setFormButtonColor(adv.buttonColor || "#2563eb");
    setFormBackground(adv.background || "slate-950");
    setFormWinnerAnimation(adv.winnerAnimation || "Confetti");
    setFormAutoPublish(adv.autoPublish !== false);
    setFormAutoEnd(adv.autoEnd !== false);
    setFormAutoNotify(adv.autoNotify !== false);
    setFormAdsgramType(c.adsgramType || "Reward");

    setActiveTab("basic");
    setIsModalOpen(true);
  };

  // Save Giveaway Doc
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // Validations
    if (!formTitle.trim()) {
      showToast("Please provide a title for the giveaway.", "error");
      return;
    }

    if (!formId.trim()) {
      showToast("Campaign ID cannot be empty.", "error");
      return;
    }

    if (!formPrizeAmount || formPrizeAmount <= 0) {
      showToast("Please enter a valid Prize Amount greater than 0.", "error");
      return;
    }

    if (!formWinnerCount || formWinnerCount <= 0) {
      showToast("Please enter a valid Total Winners count greater than 0.", "error");
      return;
    }

    // Check unique ID on create/duplicate
    if (modalMode === "create" || modalMode === "duplicate") {
      const exists = campaigns.some(c => c.id.toLowerCase() === formId.trim().toLowerCase());
      if (exists) {
        showToast(`Campaign ID "${formId}" already exists. Please choose another one.`, "error");
        return;
      }
    }



    setIsSaving(true);
    try {
      const docRef = doc(db, "lucky_draws", formId.trim());
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        bannerUrl: formBannerUrl.trim(),
        thumbnailUrl: formThumbnailUrl.trim(),
        status: formStatus,
        prizeType: formPrizeType,
        prizeAmount: Number(formPrizeAmount || 0),
        currency: formCurrency.trim(),
        winnerCount: Number(formWinnerCount || 1),
        adsgramType: formAdsgramType,
                        endDate: formEndDate,
        endTime: formEndTime,
        rules: {
          requireTgChannel: formRequireTgChannel,
          requireTgGroup: formRequireTgGroup,
          minReferrals: Number(formMinReferrals || 0),
          minRewardTasks: Number(formMinRewardTasks || 0),
          requireAccountVerification: formRequireAccountVerification,
          requireWalletConnected: formRequireWalletConnected,
          requireMobileVerification: formRequireMobileVerification,
          requireEmailVerification: formRequireEmailVerification,
          maxParticipants: Number(formMaxParticipants || 1000)
        },
        visibility: formVisibility,
        advanced: {
          themeColor: formThemeColor,
          buttonColor: formButtonColor,
          background: formBackground,
          winnerAnimation: formWinnerAnimation,
          autoPublish: formAutoPublish,
          autoEnd: formAutoEnd,
          autoNotify: formAutoNotify
        },
        views: modalMode === "create" ? 0 : (campaigns.find(c => c.id === formId)?.views || 0),
        participantsCount: modalMode === "create" ? 0 : (campaigns.find(c => c.id === formId)?.participantsCount || 0),
        createdAt: modalMode === "create" ? new Date().toISOString() : (campaigns.find(c => c.id === formId)?.createdAt || new Date().toISOString())
      };

      await setDoc(docRef, payload, { merge: true });
      showToast(
        `Successfully ${modalMode === "create" ? "created" : modalMode === "duplicate" ? "duplicated" : "saved"} lucky draw!`, 
        "success"
      );
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("[LuckyDraw] Save error:", err);
      showToast("Failed to save Campaign: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Pause/Resume Status Quick Action
  const handleToggleStatus = async (c: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const newStatus = c.status === "Active" ? "Paused" : "Active";
    try {
      await updateDoc(doc(db, "lucky_draws", c.id), { status: newStatus });
      showToast(`Campaign ${newStatus === "Active" ? "resumed" : "paused"} successfully!`, "info");
    } catch (err: any) {
      showToast("Status change failed: " + err.message, "error");
    }
  };

  // Delete Campaign Doc
  const handleDeleteCampaign = async (c: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${c.title}" permanently? This will not delete historical winner records.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "lucky_draws", c.id));
      showToast("Giveaway campaign deleted successfully.", "success");
    } catch (err: any) {
      showToast("Deletion failed: " + err.message, "error");
    }
  };

  // Scan & Populate eligible users from Database (Express API Proxy / Users collection)
  const handleScanAndAddUsers = async (c: any) => {
    setIsScanningUsers(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      if (!res.ok) throw new Error("Failed to reach users database.");
      const dbUsers = await res.json();

      // Read current participants in lucky_draw_participants
      const querySnap = await getDocs(
        query(collection(db, "lucky_draw_participants"), where("campaignId", "==", c.id))
      );
      const existingTgIds = new Set(querySnap.docs.map(docSnap => docSnap.data().telegramId));

      let added = 0;
      for (const u of dbUsers) {
        const telId = String(u.telegramId);
        if (existingTgIds.has(telId)) continue;

        // Form evaluate participant record
        const pObj = {
          membershipVerified: !!u.membershipVerified,
          referralCount: Number(u.referrals || 0),
          rewardTasksCompleted: Number(u.tasksCompleted || 0),
          isVerified: !!u.verified,
          isWalletConnected: !!(u.walletAddress || u.isWalletConnected),
          isMobileVerified: !!(u.phone || u.isMobileVerified),
          isEmailVerified: !!(u.email || u.isEmailVerified),
        };

        const eligibility = checkEligibility(pObj, c);

        const participantRef = doc(db, "lucky_draw_participants", `${c.id}_${telId}`);
        await setDoc(participantRef, {
          campaignId: c.id,
          telegramId: telId,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.enteredName || "Anonymous User",
          username: u.username || "no_username",
          joinedAt: new Date().toISOString(),
          referralCount: pObj.referralCount,
          rewardTasksCompleted: pObj.rewardTasksCompleted,
          isVerified: pObj.isVerified,
          isWalletConnected: pObj.isWalletConnected,
          isMobileVerified: pObj.isMobileVerified,
          isEmailVerified: pObj.isEmailVerified,
          isEligible: eligibility.isEligible,
          eligibilityReasons: eligibility.reasons
        });
        added++;
      }

      showToast(`Registered ${added} users into participants!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Scanning failed: " + err.message, "error");
    } finally {
      setIsScanningUsers(false);
    }
  };

  // Draw Winner Randomly
  const handleDrawWinners = async (c: any) => {
    if (isDrawing) return;
    setIsDrawing(true);
    setTempWinnerName("");

    try {
      // 1. Load latest participants list
      const participantsSnap = await getDocs(
        query(collection(db, "lucky_draw_participants"), where("campaignId", "==", c.id))
      );
      const allParticipants = participantsSnap.docs.map(docSnap => docSnap.data());

      // 2. Load latest winners list to avoid duplicates
      const winnersSnap = await getDocs(
        query(collection(db, "lucky_draw_winners"), where("campaignId", "==", c.id))
      );
      const existingWinnerIds = new Set(winnersSnap.docs.map(docSnap => docSnap.data().telegramId));

      // 3. Filter strictly eligible and non-winner participants
      const eligibleList = allParticipants.filter((p: any) => p.isEligible && !existingWinnerIds.has(p.telegramId));

      if (eligibleList.length === 0) {
        throw new Error("No eligible, unique participants found. Ensure you populate and scan eligible users first.");
      }

      const totalDrawn = existingWinnerIds.size;
      const remainingToDraw = c.winnerCount - totalDrawn;

      if (remainingToDraw <= 0) {
        throw new Error(`Already drawn maximum limit of ${c.winnerCount} winners.`);
      }

      // We'll draw 1 winner at a time or draw a batch. Let's draw 1 for visual premium effect!
      const randomIndex = Math.floor(Math.random() * eligibleList.length);
      const selectedWinner: any = eligibleList[randomIndex];

      // Play selection spin effect in state
      setShowWinnerAnimation(true);
      
      // Shuffle names quickly for a visual rotating slots effect
      const interval = setInterval(() => {
        const tempIndex = Math.floor(Math.random() * eligibleList.length);
        setTempWinnerName(`@${eligibleList[tempIndex].username || "no_username"}`);
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 2500));
      clearInterval(interval);
      setTempWinnerName(`🎉 @${selectedWinner.username || "no_username"}`);

      // Save Winner Document
      const winnerDocId = `winner_${c.id}_${selectedWinner.telegramId}`;
      await setDoc(doc(db, "lucky_draw_winners", winnerDocId), {
        winnerId: winnerDocId,
        campaignId: c.id,
        telegramId: selectedWinner.telegramId,
        username: selectedWinner.username || "no_username",
        name: selectedWinner.name || "Anonymous",
        prize: `${c.prizeAmount} ${c.currency} (${c.prizeType})`,
        selectedAt: new Date().toISOString(),
        selectedBy: "Admin"
      });

      // Update local drawn winner state to render results
      setDrawnWinners([selectedWinner]);

      // Check if this was the last winner to automatically end the campaign
      if (totalDrawn + 1 >= c.winnerCount) {
        await updateDoc(doc(db, "lucky_draws", c.id), { status: "Ended" });
      }

      // Auto-generate Announcement Text
      const text = `🎉 **LUCKY DRAW GIVEAWAY WINNER SELECTED!** 🎉\n\n` +
        `Campaign: **${c.title}**\n` +
        `ID: \`${c.id}\`\n` +
        `Prize: **${c.prizeAmount} ${c.currency} ${c.prizeType}**\n\n` +
        `Congratulations to our selected lucky winner:\n` +
        `👉 @${selectedWinner.username || "no_username"} (${selectedWinner.name})\n\n` +
        `Check your balance or wallet inside the Roy Share Mini App! 🎁🚀`;
      
      setAnnouncementText(text);
      showToast("Selected a winner successfully!", "success");

    } catch (err: any) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setIsDrawing(false);
    }
  };

  // Helper: Format Countdown Date / Ends In Text
  const getEndsInText = (c: any) => {
    if (c.status === "Ended") return "Ended";
    if (c.status === "Draft") return "Draft";
    if (c.status === "Paused") return "Paused";

    if (!c.endDate) return "No End Date";

    const now = new Date();
    const parsedEnd = parseInKolkata(`${c.endDate}T${c.endTime || "00:00"}`);
    const diffMs = parsedEnd.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Ended";
    }

    const secs = Math.floor(diffMs / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${mins % 60}m remaining`;
    }
    if (mins > 0) {
      return `${mins}m remaining`;
    }
    return `${secs}s remaining`;
  };

  // Action: Open Direct Link Modal
  const handleOpenCopyLinkModal = (c: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCampaign(c);
    setIsCopyModalOpen(true);
  };

  const handleCopyLinkText = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(link);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  // Filter & Search Logic
  const filteredCampaigns = campaigns.filter(c => {
    // Search filter
    const matchesSearch = 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.prizeType?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status Filter
    if (statusFilter === "All") return true;
    if (statusFilter === "Active") return c.status === "Active";
    if (statusFilter === "Draft") return c.status === "Draft";
    if (statusFilter === "Paused") return c.status === "Paused";
    if (statusFilter === "Ended") return c.status === "Ended";
    
    if (statusFilter === "Upcoming") {
      return false;
    }
    if (statusFilter === "Completed") {
      return c.status === "Ended" || c.winnersDrawn;
    }

    return true;
  });

  // Filter participants of the sub-drawer
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(participantsSearch.toLowerCase()) ||
      p.username?.toLowerCase().includes(participantsSearch.toLowerCase()) ||
      p.telegramId?.toLowerCase().includes(participantsSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (participantsFilter === "All") return true;
    if (participantsFilter === "Eligible") return p.isEligible;
    if (participantsFilter === "Ineligible") return !p.isEligible;

    return true;
  });

  const participantsPerPage = 8;
  const paginatedParticipants = filteredParticipants.slice(
    (participantsPage - 1) * participantsPerPage,
    participantsPage * participantsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Premium Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[9999] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              toast.type === "success" 
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
                : toast.type === "error"
                ? "bg-red-950/80 border-red-500/30 text-red-300"
                : "bg-blue-950/80 border-blue-500/30 text-blue-300"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : toast.type === "error" ? <XCircle className="w-5 h-5 text-red-400" /> : <Info className="w-5 h-5 text-blue-400" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-blue-500" /> 🎁 Lucky Draw Giveaway Module
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Create, schedule, customize, and pick random winners for premium giveaways inside the Roy Share ecosystem.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          id="btn-create-giveaway"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Giveaway
        </button>
      </div>

      {/* STATISTICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Campaigns", val: stats.totalCampaigns, color: "text-blue-400", bg: "from-blue-500/10 to-indigo-500/5", border: "border-blue-500/15" },
          { label: "Active Campaigns", val: stats.activeCampaigns, color: "text-emerald-400", bg: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/15" },
          { label: "Completed", val: stats.completedCampaigns, color: "text-slate-400", bg: "from-slate-500/10 to-slate-500/5", border: "border-slate-800" },
          { label: "Total Entries", val: stats.totalParticipants, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5", border: "border-cyan-500/15" },
          { label: "Total Budget", val: `₹${stats.prizePool}`, color: "text-amber-400", bg: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/15" },
          { label: "Total Winners", val: stats.totalWinners, color: "text-purple-400", bg: "from-purple-500/10 to-pink-500/5", border: "border-purple-500/15" }
        ].map((item, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-b ${item.bg} border ${item.border} rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition cursor-default shadow-md backdrop-blur-sm`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{item.label}</span>
            <span className={`text-2xl font-extrabold ${item.color} mt-2`}>{item.val}</span>
          </div>
        ))}
      </div>

      {/* SEARCH, FILTERS & CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        {/* Real-time search bar */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaign name, campaign ID, status, prize type..."
            className="w-full bg-slate-900 border border-slate-800/80 focus:border-blue-500/50 focus:bg-slate-950 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Active", "Draft", "Paused", "Ended", "Upcoming"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none ${
                statusFilter === filter
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-400 font-bold"
                  : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CAMPAIGNS CARD GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/10 border border-slate-900/40 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading lucky draw campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl backdrop-blur-sm">
          <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Giveaway Campaigns Found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            Get started by creating your first promotional lucky draw campaign to reward active members.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((c) => {
            const countdown = getEndsInText(c);

            return (
              <div 
                key={c.id} 
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-3xl transition duration-300 hover:border-slate-700 overflow-hidden flex flex-col justify-between group relative shadow-lg hover:shadow-2xl hover:shadow-blue-500/5 backdrop-blur-md"
              >
                {/* Banner Header Image or Placeholder */}
                <div className="h-36 w-full relative bg-gradient-to-tr from-slate-950 to-slate-900 overflow-hidden shrink-0 border-b border-slate-800/50">
                  {c.bannerUrl ? (
                    <img 
                      src={c.bannerUrl} 
                      alt={c.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-500/10 blur-xl"></div>
                      <Trophy className="w-10 h-10 text-blue-500/30 mb-1" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <span className={`absolute top-4 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    c.status === "Active" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" 
                      : c.status === "Paused"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-slate-950 text-slate-500 border-slate-800"
                  }`}>
                    {c.status || "Draft"}
                  </span>

                  {/* Visibility Badge */}
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[9px] font-mono font-bold text-slate-400 uppercase">
                    {c.visibility || "Public"}
                  </span>

                  {/* Ends In Count Strip */}
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center bg-slate-950/70 border border-slate-800/50 px-3 py-1.5 rounded-xl text-[10px] backdrop-blur-md">
                    <span className="text-slate-400 flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5 text-blue-400" /> Ends In:</span>
                    <span className={`font-bold ${countdown === "Ended" ? "text-red-400" : "text-amber-400 font-mono"}`}>{countdown}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-slate-100 text-base leading-snug group-hover:text-blue-400 transition truncate max-w-[200px]">
                        {c.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 select-all font-medium">#{c.id}</span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>

                  {/* Prize Details & Sub Stats */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Prize Info</span>
                      <p className="text-xs font-extrabold text-slate-200 mt-0.5 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" /> 
                        {c.prizeType === "UPI" || c.prizeType === "Cash" ? "₹" : ""}{c.prizeAmount} {c.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Limit / Winners</span>
                      <p className="text-xs font-extrabold text-slate-200 mt-0.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-400" /> {c.winnerCount} Selected
                      </p>
                    </div>
                  </div>

                  {/* Sub stats row */}
                  <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800/40 pt-3">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Participants: <strong className="text-slate-300 font-semibold">{c.participantsCount || 0}</strong></span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Views: <strong className="text-slate-300 font-semibold">{c.views || 0}</strong></span>
                  </div>
                </div>

                {/* Admin Actions Tray */}
                <div className="px-5 py-3.5 bg-slate-950/40 border-t border-slate-800/50 flex flex-wrap items-center gap-2 justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    {/* Edit */}
                    <button
                      onClick={(e) => handleOpenEditModal(c, e)}
                      title="Edit Campaign"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={(e) => handleDuplicateCampaign(c, e)}
                      title="Duplicate Campaign"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={(e) => handleToggleStatus(c, e)}
                      title={c.status === "Active" ? "Pause Campaign" : "Resume Campaign"}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      {c.status === "Active" ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={(e) => handleOpenCopyLinkModal(c, e)}
                      title="Generate Direct Launch Link"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteCampaign(c, e)}
                      title="Delete Campaign"
                      className="p-1.5 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Participants */}
                    <button
                      onClick={() => {
                        setSelectedCampaign(c);
                        setIsParticipantsModalOpen(true);
                      }}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Entries
                    </button>

                    {/* Pick Winner */}
                    <button
                      onClick={() => {
                        setSelectedCampaign(c);
                        setDrawnWinners([]);
                        setAnnouncementText("");
                        setIsPickWinnerModalOpen(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[10px] font-extrabold text-white px-2.5 py-1.5 rounded-lg transition shadow shadow-blue-500/10 cursor-pointer"
                    >
                      🎲 Draw
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- PREMIUM CREATE & EDIT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-blue-500" />
                    {modalMode === "create" ? "Create Giveaway Campaign" : modalMode === "duplicate" ? "Duplicate Giveaway" : "Modify Giveaway Campaign"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure prize pools, participation parameters, and custom schedules.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multi-Tab Sidebar / Header Selector */}
              <div className="flex border-b border-slate-800 bg-slate-950/20 px-4 py-2 overflow-x-auto gap-1 shrink-0">
                {[
                  { id: "basic", label: "Basic Info", icon: Info },
                  { id: "prize", label: "Prizes", icon: Coins },
                  { id: "schedule", label: "Schedule", icon: Calendar },
                  { id: "rules", label: "Participation", icon: Sliders },
                  { id: "advanced", label: "Advanced", icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 select-none cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Form Content Body */}
              <form onSubmit={handleSaveGiveaway} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. BASIC INFORMATION TAB */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Campaign Title *</label>
                        <input
                          type="text"
                          required
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="e.g., Weekly Super Sunday Draw"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Campaign ID (Unique) *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            disabled={modalMode === "edit"}
                            value={formId}
                            onChange={(e) => setFormId(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                            placeholder="e.g., SUNDAY-500"
                            className="w-full bg-slate-950 disabled:opacity-50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 outline-none uppercase font-mono"
                          />
                          {modalMode !== "edit" && (
                            <button
                              type="button"
                              onClick={() => setFormId(generateCampaignId())}
                              className="px-3.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Campaign Description</label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Provide details about this promotional giveaway, how prizes will be distributed, etc."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageUpload 
                        label="Banner Image"
                        value={formBannerUrl}
                        onChange={setFormBannerUrl}
                        placeholder="https://example.com/banner.png"
                      />

                      <ImageUpload 
                        label="Thumbnail Image"
                        value={formThumbnailUrl}
                        onChange={setFormThumbnailUrl}
                        placeholder="https://example.com/thumb.png"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Initial Status</label>
                      <select
                        value={formStatus}
                        onChange={(e: any) => setFormStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                      >
                        <option value="Active">Active / Live</option>
                        <option value="Draft">Draft</option>
                        <option value="Paused">Paused</option>
                        <option value="Ended">Ended</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 2. PRIZES TAB */}
                {activeTab === "prize" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Prize Type</label>
                        <select
                          value={formPrizeType}
                          onChange={(e: any) => setFormPrizeType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                        >
                          <option value="Cash">Cash (Manual Claim)</option>
                          <option value="UPI">UPI Direct Transfer</option>
                          <option value="Gift">Gift Cards / Physical Reward</option>
                          <option value="Coupon">Promotional Coupons</option>
                          <option value="Custom">Custom Token/Credits</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Currency Unit</label>
                        <input
                          type="text"
                          value={formCurrency}
                          onChange={(e) => setFormCurrency(e.target.value)}
                          placeholder="INR, USD, COINS, etc."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Prize Amount / Value per Winner</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={formPrizeAmount}
                          onChange={(e) => setFormPrizeAmount(Number(e.target.value))}
                          placeholder="e.g., 500"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Total Winners to Pick</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={formWinnerCount}
                          onChange={(e) => setFormWinnerCount(Number(e.target.value))}
                          placeholder="e.g., 5"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Auto Calculate budget display */}
                    <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Calculated Total Prize Pool:</span>
                      <strong className="text-base font-extrabold text-blue-400">₹{(formPrizeAmount || 0) * (formWinnerCount || 1)} {formCurrency}</strong>
                    </div>
                  </div>
                )}

                {/* 3. SCHEDULE TAB */}
                {activeTab === "schedule" && (
                  <div className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> End Date</label>
                        <input
                          type="date"
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> End Time (Kolkata)</label>
                        <input
                          type="time"
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Real-time calculated countdown preview */}
                    {formEndDate && (
                      <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Live Countdown Preview:</span>
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          {getEndsInText({ endDate: formEndDate, endTime: formEndTime, status: "Active" })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. PARTICIPATION RULES TAB */}
                {activeTab === "rules" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gate Participation behind verification rules</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-850 cursor-pointer hover:border-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={formRequireTgChannel}
                          onChange={(e) => setFormRequireTgChannel(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-800 rounded focus:ring-blue-500 focus:ring-opacity-25"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Require TG Channel Join</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Locks entry until member is verified in target channel.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-850 cursor-pointer hover:border-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={formRequireTgGroup}
                          onChange={(e) => setFormRequireTgGroup(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-800 rounded focus:ring-blue-500 focus:ring-opacity-25"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Require TG Group Join</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Locks entry until member joins linked discussion group.</p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Minimum Referrals Required</label>
                        <input
                          type="number"
                          min={0}
                          value={formMinReferrals}
                          onChange={(e) => setFormMinReferrals(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Minimum Reward Tasks Completed</label>
                        <input
                          type="number"
                          min={0}
                          value={formMinRewardTasks}
                          onChange={(e) => setFormMinRewardTasks(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      {[
                        { checked: formRequireAccountVerification, setChecked: setFormRequireAccountVerification, label: "Verified Account" },
                        { checked: formRequireWalletConnected, setChecked: setFormRequireWalletConnected, label: "Wallet Linked" },
                        { checked: formRequireMobileVerification, setChecked: setFormRequireMobileVerification, label: "Mobile OTP Verified" },
                        { checked: formRequireEmailVerification, setChecked: setFormRequireEmailVerification, label: "Email Verified" }
                      ].map((item, index) => (
                        <label key={index} className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setChecked(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-400">Maximum Allowed Participants limit</label>
                      <input
                        type="number"
                        min={1}
                        value={formMaxParticipants}
                        onChange={(e) => setFormMaxParticipants(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* 5. ADVANCED TAB */}
                {activeTab === "advanced" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Visibility Setting</label>
                        <select
                          value={formVisibility}
                          onChange={(e: any) => setFormVisibility(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                        >
                          <option value="Public">Public (Searchable & Listed)</option>
                          <option value="Private">Private (Accessible only via Direct Link)</option>
                          <option value="Hidden">Hidden (Completely Invisible)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Winner Animation Effect</label>
                        <select
                          value={formWinnerAnimation}
                          onChange={(e) => setFormWinnerAnimation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                        >
                          <option value="Confetti">Confetti Spray 🎉</option>
                          <option value="Fireworks">Fireworks Explosion 🎆</option>
                          <option value="Spin">Spinning Slots Wheel 🎡</option>
                          <option value="None">Instant Display</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Theme Base Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={formThemeColor}
                            onChange={(e) => setFormThemeColor(e.target.value)}
                            className="w-10 h-10 border border-slate-800 rounded-xl bg-transparent overflow-hidden shrink-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formThemeColor}
                            onChange={(e) => setFormThemeColor(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500/50 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Button CTA Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={formButtonColor}
                            onChange={(e) => setFormButtonColor(e.target.value)}
                            className="w-10 h-10 border border-slate-800 rounded-xl bg-transparent overflow-hidden shrink-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formButtonColor}
                            onChange={(e) => setFormButtonColor(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500/50 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Background Preset</label>
                        <select
                          value={formBackground}
                          onChange={(e) => setFormBackground(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none"
                        >
                          <option value="slate-950">Slate Nebula (Dark)</option>
                          <option value="indigo-950">Midnight Blue</option>
                          <option value="emerald-950">Forest Emerald</option>
                          <option value="zinc-950">Deep Charcoal</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400">Ads Type</label>
                        <select
                          value={formAdsgramType}
                          onChange={(e: any) => setFormAdsgramType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none"
                        >
                          <option value="Reward">Reward</option>
                          <option value="Interstitial">Interstitial</option>
                          <option value="Task">Task</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automation Settings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formAutoPublish}
                            onChange={(e) => setFormAutoPublish(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-300">Auto Publish</span>
                            <p className="text-[9px] text-slate-500">Starts automatically on schedule</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formAutoEnd}
                            onChange={(e) => setFormAutoEnd(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-300">Auto Close</span>
                            <p className="text-[9px] text-slate-500">Locks entries on end schedule</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formAutoNotify}
                            onChange={(e) => setFormAutoNotify(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-300">Auto Notify</span>
                            <p className="text-[9px] text-slate-500">Broadcast winner via telegram</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

              </form>

              {/* Action Footer */}
              <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleSaveGiveaway}
                  className={`px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2 ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PARTICIPANTS SUB-DRAWER MODAL --- */}
      <AnimatePresence>
        {isParticipantsModalOpen && selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Campaign Entries: <span className="text-blue-400 font-extrabold font-sans">"{selectedCampaign.title}"</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Review active registered participants, filter requirements, and audit user eligibility.</p>
                </div>
                <button 
                  onClick={() => setIsParticipantsModalOpen(false)}
                  className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar Controls */}
              <div className="p-4 bg-slate-950/30 border-b border-slate-800/50 flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center shrink-0">
                <div className="flex flex-col md:flex-row gap-3 flex-1">
                  {/* Participant Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={participantsSearch}
                      onChange={(e) => {
                        setParticipantsSearch(e.target.value);
                        setParticipantsPage(1);
                      }}
                      placeholder="Search participant name, username, telegram ID..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500/50 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>

                  {/* Eligibility Filter */}
                  <div className="flex items-center gap-1.5">
                    {["All", "Eligible", "Ineligible"].map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setParticipantsFilter(f);
                          setParticipantsPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition select-none cursor-pointer ${
                          participantsFilter === f
                            ? "bg-blue-600/10 border-blue-500/20 text-blue-400 font-bold"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Import/Sync Database Users */}
                <button
                  type="button"
                  onClick={() => handleScanAndAddUsers(selectedCampaign)}
                  disabled={isScanningUsers}
                  className="flex items-center gap-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-bold px-3.5 py-2 rounded-xl text-xs transition shrink-0 cursor-pointer select-none"
                >
                  {isScanningUsers ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      <span>Scanning DB...</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Scan & Add Users</span>
                    </>
                  )}
                </button>
              </div>

              {/* Table Data list */}
              <div className="flex-1 overflow-auto">
                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-20 bg-slate-950/10">
                    <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-semibold">No participants registered yet</p>
                    <p className="text-slate-500 text-[10px] mt-1 max-w-sm mx-auto">
                      Click "Scan & Add Users" to scan the local users directory and automatically evaluate eligibility for this campaign.
                    </p>
                  </div>
                ) : (
                  <div className="min-w-full divide-y divide-slate-850">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-950/80 border-b border-slate-850 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <tr>
                          <th className="px-5 py-3">User Profile</th>
                          <th className="px-5 py-3">Telegram ID</th>
                          <th className="px-5 py-3">Joined Date</th>
                          <th className="px-5 py-3 text-center">Referrals</th>
                          <th className="px-5 py-3 text-center">Task Done</th>
                          <th className="px-5 py-3 text-right">Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 bg-slate-900/10 text-xs">
                        {paginatedParticipants.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-950/30 transition">
                            <td className="px-5 py-3.5">
                              <div>
                                <p className="font-bold text-slate-200 text-xs">{p.name || "Anonymous User"}</p>
                                <p className="text-[10px] text-slate-500">@{p.username || "no_username"}</p>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400 select-all">{p.telegramId}</td>
                            <td className="px-5 py-3.5 text-slate-400 text-[11px]">{p.joinedAt ? formatFriendlyKolkata(p.joinedAt).split(",")[0] : "N/A"}</td>
                            <td className="px-5 py-3.5 text-center font-bold text-slate-300">{p.referralCount || 0}</td>
                            <td className="px-5 py-3.5 text-center font-bold text-slate-300">{p.rewardTasksCompleted || 0}</td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                p.isEligible 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}>
                                {p.isEligible ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Eligible
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-red-400" /> Ineligible
                                  </>
                                )}
                              </span>
                              {!p.isEligible && p.eligibilityReasons && p.eligibilityReasons.length > 0 && (
                                <p className="text-[9px] text-red-500/80 mt-1 font-sans font-medium max-w-[180px] ml-auto line-clamp-1" title={p.eligibilityReasons.join(", ")}>
                                  Reason: {p.eligibilityReasons.join(", ")}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              {filteredParticipants.length > participantsPerPage && (
                <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    Showing {Math.min(filteredParticipants.length, (participantsPage - 1) * participantsPerPage + 1)}-{Math.min(filteredParticipants.length, participantsPage * participantsPerPage)} of {filteredParticipants.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={participantsPage === 1}
                      onClick={() => setParticipantsPage(p => p - 1)}
                      className="px-3 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-300 transition cursor-pointer select-none"
                    >
                      Previous
                    </button>
                    <button
                      disabled={participantsPage * participantsPerPage >= filteredParticipants.length}
                      onClick={() => setParticipantsPage(p => p + 1)}
                      className="px-3 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-300 transition cursor-pointer select-none"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DRAW WINNERS MODAL --- */}
      <AnimatePresence>
        {isPickWinnerModalOpen && selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Draw Campaign Winners
                </h3>
                <button 
                  onClick={() => setIsPickWinnerModalOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Visual Target campaign info */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{selectedCampaign.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Target: {selectedCampaign.winnerCount} Winners limit • ₹{selectedCampaign.prizeAmount} {selectedCampaign.currency}</span>
                  </div>
                  <button
                    type="button"
                    disabled={isDrawing}
                    onClick={() => handleDrawWinners(selectedCampaign)}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/10 cursor-pointer"
                  >
                    🎲 Draw 1 Winner
                  </button>
                </div>

                {/* Animated Draw screen */}
                {isDrawing && (
                  <div className="p-10 border border-dashed border-amber-500/20 bg-amber-500/5 rounded-3xl text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-amber-400 animate-bounce mx-auto" />
                    <p className="text-xs text-amber-300 font-bold animate-pulse">Shuffling eligible participant pool...</p>
                    {tempWinnerName && (
                      <p className="text-xl font-black text-white font-mono">{tempWinnerName}</p>
                    )}
                  </div>
                )}

                {/* Winners loaded lists */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> Drawn Campaign Winners List ({winners.length}/{selectedCampaign.winnerCount})</h4>
                  
                  {winners.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/20 border border-slate-850 rounded-2xl">
                      <Users className="w-8 h-8 text-slate-700 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-500">No winners drawn yet for this giveaway campaign.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {winners.map((winner, index) => (
                        <div key={winner.id} className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🥇</span>
                            <div>
                              <p className="font-bold text-xs text-slate-200">{winner.name}</p>
                              <p className="text-[10px] text-slate-500">@{winner.username}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold font-mono">₹{selectedCampaign.prizeAmount} {selectedCampaign.currency}</span>
                            <p className="text-[9px] text-slate-500 mt-1 font-mono">{winner.selectedAt ? formatFriendlyKolkata(winner.selectedAt).split(",")[0] : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Autogenerated Telegram Announcement */}
                {announcementText && (
                  <div className="space-y-2 border-t border-slate-800 pt-5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">📢 Telegram Auto-Announcement Text</span>
                      <button
                        onClick={() => handleCopyLinkText(announcementText)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold transition shrink-0 cursor-pointer"
                      >
                        {copiedId === announcementText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === announcementText ? "Copied" : "Copy Announcement"}
                      </button>
                    </div>
                    <pre className="w-full bg-slate-950 p-4 border border-slate-850 rounded-2xl text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                      {announcementText}
                    </pre>
                  </div>
                )}

                {/* Capture Winner cards preview */}
                {winners.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <WinnerCardGenerator giveaway={selectedCampaign} winners={winners} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/40 shrink-0">
                <button
                  onClick={() => setIsPickWinnerModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- COPY LINK & QR CODE GENERATOR MODAL --- */}
      <AnimatePresence>
        {isCopyModalOpen && selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 w-full max-w-md rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  Direct Launch Link Generator
                </h3>
                <button 
                  onClick={() => setIsCopyModalOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Direct TMA URL Generator */}
              {(() => {
                const directLink = `https://t.me/${botUsername}?startapp=${selectedCampaign.id}`;
                const legacyLink = `https://t.me/${botUsername}/${miniAppShortName || "app"}?startapp=${selectedCampaign.id}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(directLink)}`;

                return (
                  <div className="p-6 space-y-6 text-center">
                    
                    {/* QR Code Container */}
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
                      <img 
                        src={qrUrl} 
                        alt="QR Code Link" 
                        referrerPolicy="no-referrer"
                        className="w-36 h-36 mx-auto object-contain" 
                      />
                    </div>

                    <p className="text-xs text-slate-400">Scan this QR Code to launch your premium Mini App instantly navigating straight to this Giveaway page.</p>

                    <div className="space-y-3.5 text-left">
                      
                      {/* Premium Startapp parameter Link */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Premium startapp link</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={directLink}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono outline-none"
                          />
                          <button
                            onClick={() => handleCopyLinkText(directLink)}
                            className="px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === directLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedId === directLink ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Legacy shortener link */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Legacy Mini App Link</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={legacyLink}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono outline-none"
                          />
                          <button
                            onClick={() => handleCopyLinkText(legacyLink)}
                            className="px-3 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === legacyLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedId === legacyLink ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 pt-4 border-t border-slate-800/60">
                      <a
                        href={directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        Open Link <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
