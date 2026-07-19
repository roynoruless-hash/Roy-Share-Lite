import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { API_BASE } from "../config/api";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot
} from "firebase/firestore";
import { 
  Gift, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Users, 
  Coins, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Loader2,
  RefreshCw,
  XCircle,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatFriendlyKolkata, formatInKolkata } from "../lib/dateUtils";

export default function LuckyNumberGiveawayAdminManager() {
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Create / Edit Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formBannerUrl, setFormBannerUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrizeAmount, setFormPrizeAmount] = useState(100);
  const [formTotalWinners, setFormTotalWinners] = useState(10);
  const [formNumberRange, setFormNumberRange] = useState<string>("1 to 100");
  const [formMinNumber, setFormMinNumber] = useState(1);
  const [formMaxNumber, setFormMaxNumber] = useState(100);
  const [formAdsType, setFormAdsType] = useState<"Reward" | "Interstitial" | "Task">("Reward");
  const [formNumberVisibility, setFormNumberVisibility] = useState<"Hide Remaining Numbers" | "Show Remaining Numbers" | "Show Hot Numbers">("Show Remaining Numbers");
  const [formStatus, setFormStatus] = useState<"Draft" | "Live" | "Paused" | "Ended" | "Drawing Winners" | "Completed">("Draft");
  const [autoPostChannel, setAutoPostChannel] = useState(false);
  
  // New States
  const [formEntryLimitPerUser, setFormEntryLimitPerUser] = useState(1);
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formAutoResult, setFormAutoResult] = useState(false);
  const [formRewardAdsEnabled, setFormRewardAdsEnabled] = useState(true);

  // Active Detail View State
  const [activeGiveawayId, setActiveGiveawayId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"entries" | "verification" | "analytics" | "audit-logs">("entries");
  
  const [entries, setEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // UI Helpers
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [drawingWinner, setDrawingWinner] = useState(false);
  const [verifyingWinner, setVerifyingWinner] = useState(false);
  const [resettingCampaign, setResettingCampaign] = useState(false);
  const [botUsername, setBotUsername] = useState("Roysharearn_bot");

  // Rejection Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectIndex, setRejectIndex] = useState<number | null>(null);

  // Fetch bot settings for telegram deep link
  useEffect(() => {
    const fetchBotSettings = async () => {
      try {
        const docSnap = await getDocs(query(collection(db, "settings")));
        const tgDoc = docSnap.docs.find(d => d.id === "telegram");
        if (tgDoc && tgDoc.exists()) {
          const username = tgDoc.data().botUsername;
          if (username) {
            setBotUsername(username.replace("@", ""));
          }
        }
      } catch (err) {
        console.error("Error fetching bot settings:", err);
      }
    };
    fetchBotSettings();
  }, []);

  // Fetch giveaways (Campaigns)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "lucky_number_campaigns"), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setGiveaways(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading giveaways:", err);
        setError("Failed to load giveaways from database.");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Handle Image Upload (Banner)
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64: base64String
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setFormBannerUrl(data.url);
          setSuccessMsg("Banner uploaded successfully!");
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setError(data.error || "Failed to upload banner image.");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Banner upload error:", err);
      setError("Banner upload failed. Make sure server is running.");
      setUploading(false);
    }
  };

  // Submit Giveaway Save/Edit
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formTitle.trim()) return setError("Title is required.");
    if (!formBannerUrl.trim()) return setError("Banner image is required.");
    if (formPrizeAmount <= 0) return setError("Prize amount must be greater than zero.");
    if (formTotalWinners <= 0) return setError("Total winners must be greater than zero.");
    if (formNumberRange === "Manual Range" && formMinNumber >= formMaxNumber) {
      return setError("Minimum number must be less than maximum number.");
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/save-giveaway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: formTitle,
          bannerUrl: formBannerUrl,
          description: formDescription,
          prizeAmount: Number(formPrizeAmount),
          totalWinners: Number(formTotalWinners),
          numberRange: formNumberRange === "Manual Range" ? "Manual" : formNumberRange.replace(" to ", "-"),
          minNumber: Number(formMinNumber),
          maxNumber: Number(formMaxNumber),
          adsType: formAdsType,
          numberVisibility: formNumberVisibility,
          status: formStatus,
          autoPostChannel,
          entryLimitPerUser: Number(formEntryLimitPerUser || 1),
          startTime: formStartTime || null,
          endTime: formEndTime || null,
          autoResult: formAutoResult,
          rewardAdsEnabled: formRewardAdsEnabled
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(editingId ? "Lucky Board updated successfully!" : "Lucky Board created & published successfully!");
        if (data.channelPostSuccess) {
          setSuccessMsg(prev => prev + " 📣 Auto-posted to Telegram Channel!");
        }
        setTimeout(() => setSuccessMsg(""), 4500);
        resetForm();
      } else {
        setError(data.error || "Failed to save giveaway.");
      }
    } catch (err: any) {
      console.error("Save giveaway error:", err);
      setError(err.message || "Failed to save giveaway.");
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormBannerUrl("");
    setFormDescription("");
    setFormPrizeAmount(100);
    setFormTotalWinners(10);
    setFormNumberRange("1 to 100");
    setFormMinNumber(1);
    setFormMaxNumber(100);
    setFormAdsType("Reward");
    setFormNumberVisibility("Show Remaining Numbers");
    setFormStatus("Draft");
    setAutoPostChannel(false);
    setFormEntryLimitPerUser(1);
    setFormStartTime("");
    setFormEndTime("");
    setFormAutoResult(false);
    setFormRewardAdsEnabled(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (giveaway: any) => {
    setEditingId(giveaway.id);
    setFormTitle(giveaway.title || "");
    setFormBannerUrl(giveaway.bannerUrl || "");
    setFormDescription(giveaway.description || "");
    setFormPrizeAmount(giveaway.prizeAmount || 100);
    setFormTotalWinners(giveaway.totalWinners || 10);
    
    const rangeStr = giveaway.numberRange === "Manual" ? "Manual Range" : (giveaway.numberRange || "1-100").replace("-", " to ");
    setFormNumberRange(rangeStr);
    setFormMinNumber(giveaway.minNumber || 1);
    setFormMaxNumber(giveaway.maxNumber || 100);
    setFormAdsType(giveaway.adsType || "Reward");
    setFormNumberVisibility(giveaway.numberVisibility || "Show Remaining Numbers");
    setFormStatus(giveaway.status || "Draft");
    setAutoPostChannel(false);
    
    setFormEntryLimitPerUser(giveaway.entryLimitPerUser || 1);
    setFormStartTime(giveaway.startTime ? formatInKolkata(giveaway.startTime) : "");
    setFormEndTime(giveaway.endTime ? formatInKolkata(giveaway.endTime) : "");
    setFormAutoResult(giveaway.autoResult === true);
    setFormRewardAdsEnabled(giveaway.rewardAdsEnabled !== false);
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Lucky Number Board? All active selections and winner logs will be wiped!")) return;
    try {
      await deleteDoc(doc(db, "lucky_number_campaigns", id));
      setSuccessMsg("Lucky Board deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError("Failed to delete giveaway: " + err.message);
    }
  };

  const handleCopyLink = (giveawayId: string) => {
    const link = `https://t.me/${botUsername}?startapp=${giveawayId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(giveawayId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Real-time synchronization of Entries
  useEffect(() => {
    if (!activeGiveawayId) return;
    
    setEntriesLoading(true);
    const q = query(
      collection(db, "lucky_number_entries"),
      where("campaignId", "==", activeGiveawayId)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter duplicate records since we save both user and number doc keys
      const uniqueList = list.filter(item => item.id.includes("_num_"));
      uniqueList.sort((a: any, b: any) => new Date(b.reservedAt || 0).getTime() - new Date(a.reservedAt || 0).getTime());
      setEntries(uniqueList);
      setEntriesLoading(false);
    }, (err) => {
      console.error("Error loading entries snapshot:", err);
      setEntriesLoading(false);
    });

    return unsub;
  }, [activeGiveawayId]);

  // Load Analytics
  const loadAnalytics = async (giveawayId: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/analytics/${giveawayId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalyticsData(data.analytics);
      } else {
        setError(data.error || "Failed to load analytics.");
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load Audit Logs
  const loadAuditLogs = async (giveawayId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/audit-logs/${giveawayId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAuditLogs(data.logs);
      } else {
        setError(data.error || "Failed to load audit logs.");
      }
    } catch (err) {
      console.error("Audit log fetch error:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeGiveawayId) {
      if (viewTab === "analytics") {
        loadAnalytics(activeGiveawayId);
      } else if (viewTab === "audit-logs") {
        loadAuditLogs(activeGiveawayId);
      }
    }
  }, [activeGiveawayId, viewTab]);

  // WINNER ACTIONS

  // 1. Draw Winner
  const handleDrawWinner = async (winnerIndex: number) => {
    if (!activeGiveawayId) return;
    setDrawingWinner(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/draw-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId: activeGiveawayId, winnerIndex })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`🎲 Winner #${winnerIndex + 1} drawn successfully! Selected Number: ${data.winner.selectedNumber}, Name: ${data.winner.name}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setError(data.error || "Failed to draw winner.");
      }
    } catch (err: any) {
      console.error("Draw winner error:", err);
      setError("Server error while picking random winner.");
    } finally {
      setDrawingWinner(false);
    }
  };

  // 2. Approve Winner (Wallet credit + Notify)
  const handleApproveWinner = async (winnerIndex: number, allocatedPrize: number) => {
    if (!activeGiveawayId) return;
    if (!confirm(`Confirm Winner #${winnerIndex + 1} verification? This will instantly credit ₹${allocatedPrize} to their Roy Share Wallet and notify them!`)) return;
    setVerifyingWinner(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/approve-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId: activeGiveawayId, winnerIndex })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`🎉 Winner #${winnerIndex + 1} verified and approved! Payout of ₹${allocatedPrize} credited instantly.`);
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        setError(data.error || "Failed to approve winner.");
      }
    } catch (err: any) {
      console.error("Approve winner error:", err);
      setError("Server error while approving winner.");
    } finally {
      setVerifyingWinner(false);
    }
  };

  // 3. Reject Winner
  const handleRejectWinner = async () => {
    if (!activeGiveawayId || rejectIndex === null) return;
    setVerifyingWinner(true);
    setError("");
    setShowRejectModal(false);

    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/reject-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          giveawayId: activeGiveawayId,
          winnerIndex: rejectIndex,
          reason: rejectionReason.trim() || "Verification failed / Rule violation"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`❌ Winner #${rejectIndex + 1} successfully rejected and notified!`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "Failed to reject winner.");
      }
    } catch (err) {
      console.error("Reject winner error:", err);
      setError("Network error while rejecting winner.");
    } finally {
      setVerifyingWinner(false);
      setRejectIndex(null);
    }
  };

  // 4. Redraw Winner
  const handleRedrawWinner = async (winnerIndex: number) => {
    if (!activeGiveawayId) return;
    if (!confirm(`🔄 Are you sure you want to REDRAW Winner #${winnerIndex + 1}? This will select a different random participant for this spot!`)) return;
    setDrawingWinner(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/redraw-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId: activeGiveawayId, winnerIndex })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`🔄 Redraw success! Winner #${winnerIndex + 1} Selected Number: ${data.winner.selectedNumber}, Name: ${data.winner.name}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setError(data.error || "Failed to redraw winner.");
      }
    } catch (err: any) {
      console.error("Redraw error:", err);
      setError("Server error while redrawing winner.");
    } finally {
      setDrawingWinner(false);
    }
  };

  // Reset Campaign / Draw
  const handleResetCampaign = async (giveawayId: string) => {
    if (!confirm("🔄 ALERT: This will clear all winner logs and revert the Lucky Number Board back to Live. Proceed?")) return;
    setResettingCampaign(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/lucky-number-giveaway/reset-giveaway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("🔄 Lucky Board has been reset back to Live successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "Failed to reset giveaway.");
      }
    } catch (err) {
      console.error("Reset error:", err);
      setError("Server error while resetting campaign.");
    } finally {
      setResettingCampaign(false);
    }
  };

  const handleExportEntries = () => {
    if (entries.length === 0) return alert("No selections to export.");
    const headers = ["Selected Number", "Telegram ID", "Name", "Username", "Selection Date", "Status"];
    const rows = entries.map(e => [
      e.selectedNumber,
      e.telegramId || "",
      e.firstName || "",
      e.username ? `@${e.username}` : "",
      formatFriendlyKolkata(e.reservedAt),
      e.status || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `giveaway_${activeGiveawayId}_lucky_selections.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedGiveaway = giveaways.find(g => g.id === activeGiveawayId);

  // Stats calculators
  const totalNum = selectedGiveaway ? (selectedGiveaway.maxNumber - selectedGiveaway.minNumber + 1) : 0;
  const activeSelectionsCount = entries.filter(e => e.status === "Confirmed" || e.status === "Winner").length;
  const availNum = Math.max(0, totalNum - activeSelectionsCount);

  // Compute bucketing counts to find Popular & Least Selected Ranges
  const getBucketsStats = () => {
    if (!selectedGiveaway) return { popular: "-", least: "-" };
    
    const bucketSize = Math.ceil(totalNum / 5);
    const buckets: { label: string; count: number }[] = [];
    
    for (let i = 0; i < 5; i++) {
      const bMin = selectedGiveaway.minNumber + i * bucketSize;
      const bMax = Math.min(selectedGiveaway.maxNumber, bMin + bucketSize - 1);
      if (bMin <= selectedGiveaway.maxNumber) {
        buckets.push({
          label: `${bMin}-${bMax}`,
          count: entries.filter(e => {
            const n = Number(e.selectedNumber);
            return n >= bMin && n <= bMax && (e.status === "Confirmed" || e.status === "Winner");
          }).length
        });
      }
    }

    let popular = "-";
    let least = "-";
    let maxC = -1;
    let minC = Infinity;

    buckets.forEach(b => {
      if (b.count > maxC && b.count > 0) {
        maxC = b.count;
        popular = `${b.label} (${b.count} selections)`;
      }
      if (b.count < minC) {
        minC = b.count;
        least = `${b.label} (${b.count} selections)`;
      }
    });

    return { popular, least };
  };

  const bucketsStats = getBucketsStats();

  return (
    <div className="space-y-6 text-slate-100 p-1">
      
      {/* Alert Banners */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left side (Form / List), Right Side (Active Giveaway Detail Dashboard) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Giveaway Manager Form / Campaigns List) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Header Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Gift className="w-6 h-6 text-emerald-500" />
                Lucky Number Giveaway
              </h2>
              <p className="text-xs text-slate-400">Manage interactive real-time number draws</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create New Board
              </button>
            )}
          </div>

          {/* CREATE / EDIT FORM PANEL */}
          {showForm && (
            <motion.form 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSaveGiveaway}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4"
            >
              <h3 className="text-sm font-black text-white border-b border-slate-800 pb-2">
                {editingId ? "✏️ Edit Lucky Board Campaign" : "✨ Create New Lucky Board"}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Title */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 font-bold">Campaign Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Weekly Lucky Number Board Draw"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Banner Upload */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 font-bold block">Banner Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="https://example.com/banner.png"
                      value={formBannerUrl}
                      onChange={(e) => setFormBannerUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <label className="px-3.5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl cursor-pointer flex items-center justify-center font-bold">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 font-bold">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe selection bounds and wallet payout details..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* Prize Amount */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Prize Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formPrizeAmount}
                    onChange={(e) => setFormPrizeAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    This is the <b>total budget</b>, NOT the individual prize. It will be randomly split among all winners.
                  </p>
                </div>

                {/* Total Winners */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Total Winners</label>
                  <input
                    type="number"
                    required
                    value={formTotalWinners}
                    onChange={(e) => setFormTotalWinners(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Total number of winner slots. Budget must be greater than or equal to total winners (min ₹1 per slot).
                  </p>
                </div>

                {/* Number Range Option */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Number Board Range</label>
                  <select
                    value={formNumberRange}
                    onChange={(e) => setFormNumberRange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="1 to 50">1 to 50</option>
                    <option value="1 to 100">1 to 100</option>
                    <option value="1 to 200">1 to 200</option>
                    <option value="1 to 300">1 to 300</option>
                    <option value="1 to 500">1 to 500</option>
                    <option value="1 to 600">1 to 600</option>
                    <option value="Manual Range">Manual Range (Custom Min/Max)</option>
                  </select>
                </div>

                {/* Ads Type */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Sponsor Ad Type</label>
                  <select
                    value={formAdsType}
                    onChange={(e) => setFormAdsType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Reward">Reward</option>
                    <option value="Interstitial">Interstitial</option>
                    <option value="Task">Task</option>
                  </select>
                </div>

                {/* Conditional Manual Range Limits */}
                {formNumberRange === "Manual Range" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Min Lucky Number</label>
                      <input
                        type="number"
                        value={formMinNumber}
                        onChange={(e) => setFormMinNumber(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Max Lucky Number</label>
                      <input
                        type="number"
                        value={formMaxNumber}
                        onChange={(e) => setFormMaxNumber(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Number Visibility option */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 font-bold">Board Visibility Mode</label>
                  <select
                    value={formNumberVisibility}
                    onChange={(e) => setFormNumberVisibility(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Show Remaining Numbers">Show Remaining Numbers</option>
                    <option value="Hide Remaining Numbers">Hide Remaining Numbers</option>
                    <option value="Show Hot Numbers">Show Hot Numbers (least selected ranges)</option>
                  </select>
                </div>

                {/* Status selection */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 font-bold">Board Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Live">Live</option>
                    <option value="Paused">Paused</option>
                    <option value="Ended">Ended</option>
                  </select>
                </div>

                {/* Advanced Giveaway Settings */}
                <div className="col-span-2 border-t border-slate-800/60 my-4 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    ⚙️ Advanced Entry & Timing Rules
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold text-xs">Entry Limit Per User</label>
                      <input
                        type="number"
                        min="1"
                        value={formEntryLimitPerUser}
                        onChange={(e) => setFormEntryLimitPerUser(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                        placeholder="Default 1"
                      />
                    </div>
                    
                    <div className="space-y-1 flex flex-col justify-center">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={formRewardAdsEnabled}
                          onChange={(e) => setFormRewardAdsEnabled(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
                        />
                        <span>Enable Reward Ad on Entry</span>
                      </label>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                        Require users to successfully complete a video ad before confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold text-xs">Start Time (IST)</label>
                      <input
                        type="datetime-local"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold text-xs">End Time (IST)</label>
                      <input
                        type="datetime-local"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={formAutoResult}
                        onChange={(e) => setFormAutoResult(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
                      />
                      <span>⚡ Automatically draw and approve winners when countdown hits 0</span>
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal ml-5">
                      If enabled, when the end time passes, the server will pick random verified winners, credit their wallets, and notify them via the Telegram bot automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Autopost config */}
              {!editingId && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 py-2">
                  <input
                    type="checkbox"
                    checked={autoPostChannel}
                    onChange={(e) => setAutoPostChannel(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
                  />
                  <span>📣 Auto-publish Board to registered Telegram Channel</span>
                </label>
              )}

              {/* Form buttons */}
              <div className="flex gap-2 justify-end pt-3 text-xs">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-black text-slate-950 rounded-xl transition cursor-pointer"
                >
                  {editingId ? "Save Changes" : "Publish Lucky Board"}
                </button>
              </div>
            </motion.form>
          )}

          {/* CAMPAIGNS LIST PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Lucky Draw Campaigns</h3>
            
            {giveaways.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                <Gift className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">No Lucky Number boards created yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {giveaways.map(g => {
                  const isActive = g.id === activeGiveawayId;
                  return (
                    <div 
                      key={g.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive ? "bg-emerald-950/20 border-emerald-500/30" : "bg-slate-950/60 border-slate-900 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 cursor-pointer" onClick={() => setActiveGiveawayId(g.id)}>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            g.status === "Live" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                          }`}>
                            {g.status}
                          </span>
                          <h4 className="font-bold text-sm text-slate-100">{g.title}</h4>
                          <p className="text-[10px] text-slate-500">Prize Amount: ₹{g.prizeAmount} | Winners: {g.totalWinners}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopyLink(g.id)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition"
                            title="Copy Mini App Link"
                          >
                            {copiedId === g.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(g)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition"
                            title="Edit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(g.id)}
                            className="p-1.5 hover:bg-slate-850 rounded-lg text-rose-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Detail Dashboard of Selected Campaign */}
        <div className="xl:col-span-7">
          <AnimatePresence mode="wait">
            {selectedGiveaway ? (
              <motion.div
                key={selectedGiveaway.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative"
              >
                {/* Detail Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">Active Board Dashboard</span>
                    <h3 className="text-lg font-black text-white">{selectedGiveaway.title}</h3>
                    <p className="text-xs text-slate-500">Board bounds: {selectedGiveaway.minNumber} to {selectedGiveaway.maxNumber}</p>
                  </div>
                  <div className="flex gap-2 self-start md:self-auto">
                    <button
                      onClick={() => handleResetCampaign(selectedGiveaway.id)}
                      disabled={resettingCampaign}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="Clear results & re-open selections"
                    >
                      {resettingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Reset Draw
                    </button>
                  </div>
                </div>

                {/* REAL-TIME DASHBOARD COUNTERS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Numbers</span>
                    <span className="text-xl font-black text-slate-200">{totalNum}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Selected</span>
                    <span className="text-xl font-black text-emerald-400">{activeSelectionsCount}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Remaining</span>
                    <span className="text-xl font-black text-amber-500">{availNum}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Participants</span>
                    <span className="text-xl font-black text-white">{entries.length}</span>
                  </div>
                </div>

                {/* Popular & Least selected ranges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
                  <div className="text-xs space-y-0.5">
                    <span className="text-slate-500 font-bold block uppercase text-[9px]">🔥 Popular Number Range</span>
                    <span className="font-bold text-emerald-400">{bucketsStats.popular}</span>
                  </div>
                  <div className="text-xs space-y-0.5 border-t md:border-t-0 md:border-l border-slate-800 pt-2.5 md:pt-0 md:pl-4">
                    <span className="text-slate-500 font-bold block uppercase text-[9px]">💡 Least Selected Range</span>
                    <span className="font-bold text-amber-400">{bucketsStats.least}</span>
                  </div>
                </div>

                {/* SUB-PAGES TAB NAVIGATION */}
                <div className="flex border-b border-slate-800 text-xs">
                  <button
                    onClick={() => setViewTab("entries")}
                    className={`pb-3 px-4 font-black transition relative ${
                      viewTab === "entries" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Selections Feed ({entries.length})
                  </button>
                  <button
                    onClick={() => setViewTab("verification")}
                    className={`pb-3 px-4 font-black transition relative ${
                      viewTab === "verification" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Winner Verification
                  </button>
                  <button
                    onClick={() => setViewTab("analytics")}
                    className={`pb-3 px-4 font-black transition relative ${
                      viewTab === "analytics" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Analytics Insights
                  </button>
                  <button
                    onClick={() => setViewTab("audit-logs")}
                    className={`pb-3 px-4 font-black transition relative ${
                      viewTab === "audit-logs" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Audit Logs
                  </button>
                </div>

                {/* TAB OUTCOME 1: SELECTIONS FEED */}
                {viewTab === "entries" && (
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Real-time Selections Feed</span>
                      <button
                        onClick={handleExportEntries}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg flex items-center gap-1 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                      </button>
                    </div>

                    {entriesLoading ? (
                      <div className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                        Loading feed...
                      </div>
                    ) : entries.length === 0 ? (
                      <div className="py-12 text-center text-slate-500">No lucky selections recorded on this board yet.</div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-950 rounded-2xl bg-slate-950/60 max-h-96">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-950 text-slate-400 uppercase font-black tracking-widest text-[9px]">
                              <th className="p-3">Lucky Number</th>
                              <th className="p-3">User Profile</th>
                              <th className="p-3">Telegram ID</th>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entries.map(e => (
                              <tr key={e.id} className="border-b border-slate-900/65 hover:bg-slate-950/30">
                                <td className="p-3">
                                  <span className="px-2.5 py-1 bg-slate-900 text-emerald-400 rounded-lg font-black border border-slate-800">
                                    {String(e.selectedNumber).padStart(2, '0')}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-200">{e.firstName || "Anonymous"}</div>
                                  <div className="text-[10px] text-slate-500">@{e.username || "no_username"}</div>
                                </td>
                                <td className="p-3 font-mono text-slate-400">{e.telegramId}</td>
                                <td className="p-3 text-slate-400">{formatFriendlyKolkata(e.reservedAt)}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    e.status === "Confirmed" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" :
                                    e.status === "Winner" ? "bg-amber-500/15 text-amber-400 border border-amber-500/10 animate-pulse" :
                                    e.status === "Rejected" ? "bg-red-500/15 text-red-400 border border-red-500/10" : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {e.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB OUTCOME 2: WINNER VERIFICATION */}
                {viewTab === "verification" && (
                  <div className="space-y-6 text-xs text-slate-300">
                    <div className="p-5 bg-slate-950 border border-slate-900 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Campaign Winner Target</span>
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            🏁 Winning Target: {selectedGiveaway.totalWinners} Lucky Winners
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedGiveaway.status === "Completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {selectedGiveaway.status === "Completed" ? "Completed" : "Active Board"}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        To pick winners, press the corresponding <b>Draw Winner</b> button in the slots below. The total budget of <b>₹{selectedGiveaway.prizeAmount}</b> has been randomly pre-split across all slots. No winner can get ₹0 or negative amounts, and the sum of all payouts will equal the total prize amount exactly.
                      </p>
                    </div>

                    {/* Multi-Winner Slot Allocations */}
                    <div className="space-y-4">
                      {Array.from({ length: selectedGiveaway.totalWinners || 1 }).map((_, i) => {
                        const winner = selectedGiveaway.drawnWinners?.[i];
                        const allocatedPrize = selectedGiveaway.prizeAllocations?.[i] || Math.floor(selectedGiveaway.prizeAmount / (selectedGiveaway.totalWinners || 1));
                        
                        return (
                          <div key={i} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/35">
                            <div className="p-4 bg-slate-900/60 border-b border-slate-800/60 flex justify-between items-center">
                              <span className="font-bold text-slate-200">Winner #{i + 1} Allocation</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-950 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-900 font-bold">
                                  Allocated Prize: ₹{allocatedPrize}
                                </span>
                                {winner ? (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    winner.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                    winner.status === "Rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                                    "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                  }`}>
                                    {winner.status || "Pending"}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
                                    Awaiting Draw
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-5 space-y-4">
                              {winner ? (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-500 uppercase font-bold">Selected Lucky Number</span>
                                      <div className="text-2xl font-black text-emerald-400">
                                        🍀 Card {String(winner.selectedNumber).padStart(2, '0')}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-500 uppercase font-bold">Winner Profile</span>
                                      <div className="font-black text-white text-base">
                                        {winner.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        Telegram ID: {winner.telegramId} {winner.username && `| @${winner.username}`}
                                      </div>
                                      {winner.rejectionReason && (
                                        <div className="text-[10px] text-red-400 font-bold italic mt-1">
                                          Reason Rejected: {winner.rejectionReason}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* ACTION BUTTONS (Approve, Reject, Redraw) */}
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                                    {winner.status === "Pending" && (
                                      <>
                                        <button
                                          onClick={() => handleApproveWinner(i, allocatedPrize)}
                                          disabled={verifyingWinner}
                                          className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                          {verifyingWinner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                          Approve Winner (Pay ₹{allocatedPrize})
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRejectionReason("");
                                            setRejectIndex(i);
                                            setShowRejectModal(true);
                                          }}
                                          disabled={verifyingWinner}
                                          className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 disabled:opacity-50 text-red-400 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          Reject Winner
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={() => handleRedrawWinner(i)}
                                      disabled={drawingWinner || selectedGiveaway.status === "Completed"}
                                      className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Redraw Winner
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="py-6 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl space-y-3 bg-slate-950/20">
                                  <span className="text-slate-500 text-xs">No winner drawn for Winner #{i + 1} yet.</span>
                                  <button
                                    onClick={() => handleDrawWinner(i)}
                                    disabled={drawingWinner || selectedGiveaway.status === "Completed" || entries.length === 0}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                                  >
                                    {drawingWinner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "🎲"}
                                    Draw Winner #{i + 1} (Pay ₹{allocatedPrize})
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB OUTCOME 3: ANALYTICS INSIGHTS */}
                {viewTab === "analytics" && (
                  <div className="space-y-4 text-xs">
                    {analyticsLoading ? (
                      <div className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                        Loading analytics data...
                      </div>
                    ) : analyticsData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 space-y-3">
                          <h4 className="font-bold text-white border-b border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-emerald-400">Campaign Budget Analysis</h4>
                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-400">Maximum Budget Target:</span>
                            <span className="font-bold text-slate-200">₹{selectedGiveaway.prizeAmount}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-400">Total Payouts Credited:</span>
                            <span className="font-bold text-emerald-400">₹{analyticsData.distributedBudget}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Remaining Budget Pool:</span>
                            <span className="font-bold text-amber-500">₹{analyticsData.remainingBudget}</span>
                          </div>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 space-y-3">
                          <h4 className="font-bold text-white border-b border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-emerald-400">Activity & Conversion Metrics</h4>
                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-400">Total Registered Board Members:</span>
                            <span className="font-bold text-slate-200">{analyticsData.totalEntries}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-400">LMA Participation Rate:</span>
                            <span className="font-bold text-slate-200">{analyticsData.participationRate}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Watch-Ad-Pending sessions:</span>
                            <span className="font-bold text-slate-400">{analyticsData.pendingAdEntries}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500">Failed to load analytics details.</div>
                    )}
                  </div>
                )}

                {/* TAB OUTCOME 4: AUDIT LOGS */}
                {viewTab === "audit-logs" && (
                  <div className="space-y-4 text-xs">
                    <span className="text-slate-400 font-bold block">Board Verification Audit Logs</span>
                    {logsLoading ? (
                      <div className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                        Loading logs...
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="py-12 text-center text-slate-500">No audit logs found for this campaign.</div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 max-h-80 overflow-y-auto space-y-3">
                        {auditLogs.map(log => (
                          <div key={log.id} className="border-b border-slate-900/60 pb-2.5 last:border-b-0 space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-black text-emerald-400">{log.action}</span>
                              <span className="text-slate-500">{formatFriendlyKolkata(log.timestamp)}</span>
                            </div>
                            {log.details && (
                              <p className="text-[10px] text-slate-400 font-mono break-all bg-slate-900/40 p-1.5 rounded-lg border border-slate-900/50">
                                {JSON.stringify(log.details)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="h-full bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 flex flex-col justify-center items-center gap-3">
                <Gift className="w-12 h-12 text-slate-600 animate-pulse" />
                <div>
                  <h3 className="font-black text-slate-300">Select a Campaign Board</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Click any Lucky Draw Campaign from the left list to open its live real-time entries, analytics, audit logs, and pick winners.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* REJECTION REASON MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">Specify Rejection Reason</h3>
                <p className="text-xs text-slate-400">
                  Provide a brief reason why this entry is being rejected. The user will be notified instantly via the Telegram Bot.
                </p>
              </div>

              <input
                type="text"
                placeholder="e.g., Suspicious Telegram bot user profile / rule violation"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none text-xs focus:border-red-500"
              />

              <div className="flex gap-2 justify-end text-xs">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectWinner}
                  className="px-4.5 py-2.5 bg-red-600 hover:bg-red-500 font-black text-white rounded-xl transition cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
