import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { API_BASE } from "../config/api";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  onSnapshot
} from "firebase/firestore";
import { 
  Gift, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Users, 
  TrendingUp, 
  Coins, 
  Image as ImageIcon, 
  Calendar, 
  Settings2, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  DollarSign,
  Trophy,
  Loader2,
  RefreshCw,
  FileText,
  XCircle,
  Info,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseInKolkata, formatInKolkata, formatFriendlyKolkata } from "../lib/dateUtils";

export default function UpiGiveawayAdminManager() {
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
  const [formTotalBudget, setFormTotalBudget] = useState(1000);
  const [formTotalWinners, setFormTotalWinners] = useState(10);
  const [formMinReward, setFormMinReward] = useState(10);
  const [formMaxReward, setFormMaxReward] = useState(100);
    const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState<"Draft" | "Live" | "Paused" | "Ended" | "Drawing Winners" | "Completed">("Draft");
  const [autoPostChannel, setAutoPostChannel] = useState(false);
  
  // Entry Rules State
  const [ruleTgLogin, setRuleTgLogin] = useState(true);
  const [ruleChannelVerify, setRuleChannelVerify] = useState(true);
  const [ruleGroupVerify, setRuleGroupVerify] = useState(true);
  const [ruleOneEntry, setRuleOneEntry] = useState(true);
  const [ruleAllowUpi, setRuleAllowUpi] = useState(true);
  const [ruleAllowQr, setRuleAllowQr] = useState(true);
  const [ruleWarnDuplicateUpi, setRuleWarnDuplicateUpi] = useState(true);

  // Active View / Sub-pages
  const [activeGiveawayId, setActiveGiveawayId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"entries" | "winners" | "analytics" | "audit-logs">("entries");
  
  const [entries, setEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // UI Helpers
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewingWinners, setPreviewingWinners] = useState(false);
  const [confirmingWinners, setConfirmingWinners] = useState(false);
  const [resettingCampaign, setResettingCampaign] = useState(false);
  const [payingEntryId, setPayingEntryId] = useState<string | null>(null);
  const [rejectingEntryId, setRejectingEntryId] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState("Roysharearn_bot");

  // Rejection Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch bot settings for links
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

  // Fetch giveaways
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "upi_giveaways"), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        const res = await fetch(`${API_BASE}/api/upi-giveaway/upload`, {
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
    if (formTotalBudget <= 0) return setError("Total budget must be greater than zero.");
    if (formTotalWinners <= 0) return setError("Total winners must be greater than zero.");
    if (formMinReward <= 0) return setError("Minimum reward must be greater than zero.");
    if (formMaxReward < formMinReward) return setError("Maximum reward cannot be less than minimum reward.");
    if (formMinReward * formTotalWinners > formTotalBudget) {
      return setError(`Total Budget is ₹${formTotalBudget} but minimum rewards for ${formTotalWinners} winners requires at least ₹${formMinReward * formTotalWinners}. Please increase budget or reduce winners/min reward.`);
    }
        if (!formEndDate) return setError("End date & time is required.");
    
    try {
      const giveawayId = editingId || `giveaway_${Date.now()}`;
      
      const res = await fetch(`${API_BASE}/api/upi-giveaway/save-giveaway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: formTitle,
          bannerUrl: formBannerUrl,
          description: formDescription,
          totalBudget: Number(formTotalBudget),
          totalWinners: Number(formTotalWinners),
          minReward: Number(formMinReward),
          maxReward: Number(formMaxReward),
                    endDate: formEndDate,
          status: formStatus,
          entryRules: {
            telegramLoginRequired: ruleTgLogin,
            channelVerificationRequired: ruleChannelVerify,
            groupVerificationRequired: ruleGroupVerify,
            oneEntryPerTelegramAccount: ruleOneEntry,
            allowUpiId: ruleAllowUpi,
            allowQrUpload: ruleAllowQr,
            warnDuplicateUpi: ruleWarnDuplicateUpi
          },
          autoPostChannel
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(editingId ? "Giveaway updated successfully!" : "Giveaway created & published successfully!");
        if (data.channelPostSuccess) {
          setSuccessMsg(prev => prev + " 📣 Auto-posted to Telegram Channel successfully!");
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
    setFormTotalBudget(1000);
    setFormTotalWinners(10);
    setFormMinReward(10);
    setFormMaxReward(100);
        setFormEndDate("");
    setFormStatus("Draft");
    setAutoPostChannel(false);
    setRuleTgLogin(true);
    setRuleChannelVerify(true);
    setRuleGroupVerify(true);
    setRuleOneEntry(true);
    setRuleAllowUpi(true);
    setRuleAllowQr(true);
    setRuleWarnDuplicateUpi(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (giveaway: any) => {
    setEditingId(giveaway.id);
    setFormTitle(giveaway.title || "");
    setFormBannerUrl(giveaway.bannerUrl || "");
    setFormDescription(giveaway.description || "");
    setFormTotalBudget(giveaway.totalBudget || 1000);
    setFormTotalWinners(giveaway.totalWinners || 10);
    setFormMinReward(giveaway.minReward || 10);
    setFormMaxReward(giveaway.maxReward || 100);
        setFormEndDate(formatInKolkata(giveaway.endDate));
    setFormStatus(giveaway.status || "Draft");
    setAutoPostChannel(false);
    
    setRuleTgLogin(giveaway.entryRules?.telegramLoginRequired ?? true);
    setRuleChannelVerify(giveaway.entryRules?.channelVerificationRequired ?? true);
    setRuleGroupVerify(giveaway.entryRules?.groupVerificationRequired ?? true);
    setRuleOneEntry(giveaway.entryRules?.oneEntryPerTelegramAccount ?? true);
    setRuleAllowUpi(giveaway.entryRules?.allowUpiId ?? true);
    setRuleAllowQr(giveaway.entryRules?.allowQrUpload ?? true);
    setRuleWarnDuplicateUpi(giveaway.entryRules?.warnDuplicateUpi ?? true);

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this giveaway? All submissions and settings will be permanently lost.")) return;
    try {
      await deleteDoc(doc(db, "upi_giveaways", id));
      setSuccessMsg("Giveaway deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError("Failed to delete giveaway: " + err.message);
    }
  };

  // Copy bot start link
  const handleCopyLink = (giveawayId: string) => {
    const link = `https://t.me/${botUsername}?startapp=upi_${giveawayId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(giveawayId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Load Entries for active giveaway
  useEffect(() => {
    if (!activeGiveawayId) return;
    
    setEntriesLoading(true);
    const q = query(
      collection(db, "upi_giveaway_entries"),
      where("giveawayId", "==", activeGiveawayId)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
      setEntries(list);
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
      const res = await fetch(`${API_BASE}/api/upi-giveaway/analytics/${giveawayId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalyticsData(data.analytics);
      } else {
        setError(data.error || "Failed to load analytics.");
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Could not reach server to load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load Audit Logs
  const loadAuditLogs = async (giveawayId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/audit-logs/${giveawayId}`);
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

  // Phase 1: Preview Winners (Generate Temporary Preview)
  const handleGeneratePreview = async (giveawayId: string) => {
    setPreviewingWinners(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/preview-winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("🎲 Temporary Winner Preview Generated! Review the candidates below before locking.");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setError(data.error || "Failed to generate preview winners.");
      }
    } catch (err) {
      console.error("Preview winners error:", err);
      setError("Server error while generating winner preview.");
    } finally {
      setPreviewingWinners(false);
    }
  };

  // Phase 2: Confirm & Lock Winners Permanently
  const handleConfirmWinners = async (giveawayId: string) => {
    if (!confirm("⚠️ ALERT: Confirmed winners will be locked permanently. This will deduct budget, update entry records, and dispatch direct winner notifications via Telegram Bot. Proceed?")) return;
    setConfirmingWinners(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/confirm-winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "🎉 Winners permanently confirmed and notified via Bot!");
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        setError(data.error || "Failed to confirm winners.");
      }
    } catch (err) {
      console.error("Confirm winners error:", err);
      setError("Server error while confirming winners.");
    } finally {
      setConfirmingWinners(false);
    }
  };

  // Reset Campaign / Draw
  const handleResetCampaign = async (giveawayId: string) => {
    if (!confirm("🔄 WARNING: Resetting the draw will wipe all confirmed winners, clear payment statuses, and revert all submissions back to 'Pending' (Live). Use this only if you intend to redraw. Proceed?")) return;
    setResettingCampaign(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/reset-giveaway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("🔄 Giveaway campaign reset successfully! Entries re-opened.");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "Failed to reset giveaway.");
      }
    } catch (err) {
      console.error("Reset giveaway error:", err);
      setError("Server error while resetting campaign.");
    } finally {
      setResettingCampaign(false);
    }
  };

  // Handle Mark as Paid
  const handleMarkAsPaid = async (entry: any) => {
    if (!confirm(`Mark winner ${entry.firstName} (Reward: ₹${entry.rewardAmount}) as Paid and send congratulatory bot notification?`)) return;
    setPayingEntryId(entry.id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/mark-as-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Winner ${entry.firstName} marked as Paid! Telegram notification sent.`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "Failed to mark as paid.");
      }
    } catch (err) {
      console.error("Mark paid error:", err);
      setError("Server error while updating payment status.");
    } finally {
      setPayingEntryId(null);
    }
  };

  // Handle Reject Entry / Payment
  const openRejectionModal = (entryId: string) => {
    setRejectionTargetId(entryId);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleConfirmRejection = async () => {
    if (!rejectionTargetId) return;
    setRejectingEntryId(rejectionTargetId);
    setError("");
    setShowRejectModal(false);

    try {
      const res = await fetch(`${API_BASE}/api/upi-giveaway/reject-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          entryId: rejectionTargetId,
          reason: rejectionReason.trim() || "Violation of campaign rules"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Entry successfully rejected and notified!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "Failed to reject entry.");
      }
    } catch (err) {
      console.error("Reject entry error:", err);
      setError("Network error while rejecting entry.");
    } finally {
      setRejectingEntryId(null);
      setRejectionTargetId(null);
    }
  };

  // CSV Exporters
  const handleExportEntries = async () => {
    if (entries.length === 0) return alert("No entries to export.");
    const headers = ["Telegram Name", "Username", "Telegram ID", "UPI ID", "QR URL", "Entry Date", "Status", "Duplicate UPI Warning"];
    const rows = entries.map(e => [
      e.firstName || "",
      e.username ? `@${e.username}` : "",
      e.telegramId || "",
      e.upiId || "",
      e.qrUrl || "",
      formatFriendlyKolkata(e.entryTime),
      e.status || "",
      e.isDuplicateUpi ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `giveaway_${activeGiveawayId}_entries.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Audit Log for Export
    await fetch(`${API_BASE}/api/upi-giveaway/log-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giveawayId: activeGiveawayId,
        giveawayTitle: selectedGiveaway?.title || "UPI Giveaway",
        action: "Export Downloaded",
        details: { type: "Entries CSV", count: entries.length }
      })
    });
  };

  const handleExportWinners = async () => {
    const winnersList = entries.filter(e => e.status === "Winner");
    if (winnersList.length === 0) return alert("No confirmed winners to export.");
    const headers = ["Winner Name", "Username", "Telegram ID", "UPI ID", "Winning Amount", "Payment Status", "QR Code URL", "Confirmed Date"];
    const rows = winnersList.map(e => [
      e.firstName || "",
      e.username ? `@${e.username}` : "",
      e.telegramId || "",
      e.upiId || "",
      `₹${e.rewardAmount || 0}`,
      e.paymentStatus || "",
      e.qrUrl || "",
      e.drawConfirmedAt ? formatFriendlyKolkata(e.drawConfirmedAt) : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `giveaway_${activeGiveawayId}_winners.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Audit Log for Export
    await fetch(`${API_BASE}/api/upi-giveaway/log-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giveawayId: activeGiveawayId,
        giveawayTitle: selectedGiveaway?.title || "UPI Giveaway",
        action: "Export Downloaded",
        details: { type: "Winners CSV", count: winnersList.length }
      })
    });
  };

  const selectedGiveaway = giveaways.find(g => g.id === activeGiveawayId);

  return (
    <div className="space-y-8 text-white max-w-7xl mx-auto pb-12">
      
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Coins className="w-44 h-44 text-emerald-400" />
        </div>
        <div className="space-y-1.5 relative z-10">
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
            🏆 Advanced UPI Giveaway Manager
          </h2>
          <p className="text-slate-400 text-xs">
            Host lucky-draw giveaways with random dynamic rewards, duplicate account protection, manual rejection, and audit log history.
          </p>
        </div>
        
        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-black uppercase tracking-wider transition duration-300 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
        >
          {showForm ? "Cancel Form" : <><Plus className="w-4 h-4" /> Create New Giveaway</>}
        </button>
      </div>

      {/* Notifications banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Campaign Form */}
      {showForm && (
        <form onSubmit={handleSaveGiveaway} className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-emerald-400" />
              {editingId ? "Edit UPI Giveaway Campaign" : "New UPI Giveaway Campaign"}
            </h3>
            <p className="text-slate-400 text-xs">Configure budget bounds, timing, validation rules and instant Telegram integration.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Col */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Campaign Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Weekly UPI Mega Jackpot! 💰"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Campaign Description</label>
                <textarea
                  placeholder="Write terms, details, links or rules clearly..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Giveaway Banner (Image Upload)</label>
                <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <input
                    type="file"
                    accept="image/*"
                    id="banner-file"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="banner-file"
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {uploading ? "Uploading..." : "Select Banner Image"}
                  </label>
                  
                  {formBannerUrl ? (
                    <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                      <img src={formBannerUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs">No image uploaded</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Total Campaign Budget (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTotalBudget}
                    onChange={(e) => setFormTotalBudget(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Total Winners Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTotalWinners}
                    onChange={(e) => setFormTotalWinners(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Min Reward Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMinReward}
                    onChange={(e) => setFormMinReward(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Max Reward Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMaxReward}
                    onChange={(e) => setFormMaxReward(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                  />
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none text-xs transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Campaign Status</label>
                <select
                  value={formStatus}
                  onChange={(e: any) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-slate-200 focus:outline-none text-sm transition"
                >
                  <option value="Draft">Draft</option>
                  <option value="Live">Live</option>
                  <option value="Paused">Paused</option>
                  <option value="Ended">Ended</option>
                  <option value="Drawing Winners">Drawing Winners</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-850 space-y-4">
                <span className="text-xs font-black text-slate-400 block uppercase tracking-wider">Campaign Rules & Validations</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={ruleTgLogin}
                      onChange={(e) => setRuleTgLogin(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    Verify Telegram Login
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={ruleChannelVerify}
                      onChange={(e) => setRuleChannelVerify(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    Join Telegram Channel
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={ruleGroupVerify}
                      onChange={(e) => setRuleGroupVerify(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    Join Telegram Group
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={ruleOneEntry}
                      disabled
                      className="rounded border-slate-800 text-slate-500 w-4 h-4"
                    />
                    <span>One Entry Per TG Account <span className="text-[10px] text-emerald-400 font-bold">(Locked)</span></span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={ruleAllowUpi}
                      onChange={(e) => setRuleAllowUpi(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    Allow UPI ID Submissions
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={ruleAllowQr}
                      onChange={(e) => setRuleAllowQr(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    Allow QR Image Upload
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300 md:col-span-2 border-t border-slate-850/60 pt-3">
                    <input
                      type="checkbox"
                      checked={ruleWarnDuplicateUpi}
                      onChange={(e) => setRuleWarnDuplicateUpi(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    ⚠️ Warn if same UPI ID submitted more than once
                  </label>
                </div>
              </div>

              {/* Bot Channel Autopost checkbox */}
              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/60">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoPostChannel}
                    onChange={(e) => setAutoPostChannel(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4.5 h-4.5"
                  />
                  <div>
                    <span className="block font-black text-slate-200">📣 Auto-post to configured Telegram Channel on Publish</span>
                    <span className="block text-[10px] text-slate-500 font-normal">This will automatically dispatch the banner, description, and "Participate Now" button.</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/20"
            >
              <CheckCircle className="w-4 h-4" />
              {editingId ? "Update Campaign" : "Publish Campaign"}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Giveaways */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-slate-900/20 rounded-3xl border border-slate-850">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : giveaways.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-slate-850 space-y-4">
          <Gift className="w-12 h-12 mx-auto text-slate-500 animate-pulse" />
          <h3 className="text-slate-300 font-bold">No Giveaway Campaigns Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">Publish your first lucky UPI dynamic draw to start accepting entries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {giveaways.map((giveaway) => {
            const isLive = giveaway.status === "Live";
            const isCompleted = giveaway.status === "Completed" || giveaway.winnersDrawn;
            const parsedEnd = parseInKolkata(giveaway.endDate);
            const isEnded = giveaway.status === "Ended" || new Date() > parsedEnd;
            const statusColor = 
              giveaway.status === "Live" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
              giveaway.status === "Completed" ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" :
              giveaway.status === "Drawing Winners" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" :
              giveaway.status === "Ended" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
              giveaway.status === "Paused" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
              "text-blue-400 bg-blue-500/10 border-blue-500/20"; // Draft

            return (
              <div 
                key={giveaway.id} 
                className={`bg-slate-900/30 backdrop-blur-xl border rounded-3xl p-6 space-y-6 transition duration-300 relative ${activeGiveawayId === giveaway.id ? "border-emerald-500/40 shadow-emerald-950/10 shadow-2xl" : "border-slate-800/80 hover:border-slate-700/80"}`}
              >
                {/* Header info */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                    <img src={giveaway.bannerUrl} alt={giveaway.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${statusColor}`}>
                        {giveaway.status}
                      </span>
                      {giveaway.winnersDrawn && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-0.5 uppercase tracking-wider">
                          🏆 LOCKED
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm truncate">{giveaway.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Ends: {formatFriendlyKolkata(giveaway.endDate)}
                    </p>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-900 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Budget</span>
                    <span className="text-xs font-black text-emerald-400">₹{giveaway.totalBudget}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Winners Limit</span>
                    <span className="text-xs font-black text-white">{giveaway.totalWinners}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Payout Range</span>
                    <span className="text-xs font-bold text-slate-300">₹{giveaway.minReward}-{giveaway.maxReward}</span>
                  </div>
                </div>

                {/* Deep link copy */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Bot Campaign Deep Link</span>
                  <div className="flex gap-2 items-center bg-slate-950/80 border border-slate-850 px-3 py-2 rounded-xl text-[10px] text-slate-400 font-mono select-all">
                    <span className="truncate flex-1">https://t.me/{botUsername}?startapp=upi_{giveaway.id}</span>
                    <button
                      onClick={() => handleCopyLink(giveaway.id)}
                      className="p-1.5 hover:bg-slate-850 rounded text-slate-300 transition shrink-0 cursor-pointer"
                      title="Copy Telegram Link"
                    >
                      {copiedId === giveaway.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(giveaway)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-300 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(giveaway.id)}
                      className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/50 rounded-lg text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Phase 1 helper indicator */}
                    {!giveaway.winnersDrawn && giveaway.previewWinners?.length > 0 && (
                      <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black px-2 py-1 rounded-md uppercase tracking-wider">
                        ⏳ Preview Ready
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (activeGiveawayId === giveaway.id) {
                          setActiveGiveawayId(null);
                        } else {
                          setActiveGiveawayId(giveaway.id);
                          setViewTab("entries");
                        }
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${activeGiveawayId === giveaway.id ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-900/80 hover:bg-slate-800 border-slate-850 text-slate-300"}`}
                    >
                      {activeGiveawayId === giveaway.id ? "Close Panel" : "Manage Draw ⚙️"}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Active Giveaway Detail Dashboard */}
      <AnimatePresence>
        {activeGiveawayId && selectedGiveaway && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
          >
            {/* Header info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Currently Managing Dashboard</span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-400" />
                  {selectedGiveaway.title}
                </h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setViewTab("entries")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${viewTab === "entries" ? "bg-slate-800 text-white border-slate-700" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                >
                  📝 Submissions ({entries.length})
                </button>
                <button
                  onClick={() => setViewTab("winners")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${viewTab === "winners" ? "bg-slate-800 text-white border-slate-700" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                >
                  🏆 Winner Draw ({selectedGiveaway.winnersDrawn ? entries.filter(e => e.status === "Winner").length : selectedGiveaway.previewWinners?.length || 0})
                </button>
                <button
                  onClick={() => setViewTab("analytics")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${viewTab === "analytics" ? "bg-slate-800 text-white border-slate-700" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                >
                  📈 Analytics & Metrics
                </button>
                <button
                  onClick={() => setViewTab("audit-logs")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${viewTab === "audit-logs" ? "bg-slate-800 text-white border-slate-700" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                >
                  📋 Audit Log Trail
                </button>
              </div>
            </div>

            {/* TAB CONTENT: SUBMISSIONS (ENTRIES) */}
            {viewTab === "entries" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Entries History</span>
                    <button 
                      onClick={handleExportEntries}
                      className="px-3 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Entries (CSV)
                    </button>
                  </div>
                  <span className="text-xs bg-slate-950 text-slate-400 px-3 py-1 rounded-full border border-slate-900 font-bold font-mono">
                    Total: {entries.length} Enrolled
                  </span>
                </div>

                {entriesLoading ? (
                  <div className="flex justify-center items-center py-20 bg-slate-950/10 border border-slate-850 rounded-2xl">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-16 bg-slate-950/10 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                    No users have submitted entries yet for this giveaway.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-850">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-850 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-4">Telegram Name</th>
                          <th className="p-4">Username</th>
                          <th className="p-4">Telegram ID</th>
                          <th className="p-4">UPI ID</th>
                          <th className="p-4 text-center">QR Code</th>
                          <th className="p-4">Entry Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/10">
                        {entries.map((entry) => {
                          const hasDuplicateWarning = entry.isDuplicateUpi && selectedGiveaway.entryRules?.warnDuplicateUpi;
                          return (
                            <tr key={entry.id} className="hover:bg-slate-900/30 transition">
                              <td className="p-4 font-black text-slate-200">
                                {entry.firstName}
                                {hasDuplicateWarning && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold rounded flex items-center gap-0.5 inline-flex" title="Same UPI ID is used by another entry">
                                    <ShieldAlert className="w-2.5 h-2.5" /> DUPLICATE UPI
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-slate-300">
                                {entry.username ? (
                                  <a 
                                    href={`https://t.me/${entry.username}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                                  >
                                    @{entry.username}
                                  </a>
                                ) : (
                                  <span className="text-slate-600">N/A</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-400 font-mono select-all">{entry.telegramId}</td>
                              <td className="p-4 font-mono font-bold text-slate-300">
                                {entry.upiId || <span className="text-slate-600">-</span>}
                              </td>
                              <td className="p-4 text-center">
                                {entry.qrUrl ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <a 
                                      href={entry.qrUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/20 transition flex items-center gap-1 text-[10px]"
                                      title="View QR Code"
                                    >
                                      <Eye className="w-3 h-3" /> View
                                    </a>
                                    <a 
                                      href={entry.qrUrl} 
                                      download={`QR_${entry.telegramId}.png`} 
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                                      title="Download QR Code"
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">None</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-400">
                                {formatFriendlyKolkata(entry.entryTime)}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                  entry.status === "Winner" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                  entry.status === "Not Selected" ? "bg-slate-800 border-slate-700 text-slate-400" :
                                  entry.status === "Rejected" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                  "bg-amber-500/10 border-amber-500/20 text-amber-400" // Pending
                                }`}>
                                  {entry.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {entry.status === "Pending" && (
                                  <button
                                    onClick={() => openRejectionModal(entry.id)}
                                    className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 text-[10px] font-bold rounded-lg transition"
                                  >
                                    Reject Entry
                                  </button>
                                )}
                                {entry.status === "Rejected" && (
                                  <span className="text-[10px] text-slate-500 block italic max-w-xs truncate" title={entry.rejectionReason}>
                                    Reason: {entry.rejectionReason}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: WINNERS DRAWN (TWO-PHASE FLOW) */}
            {viewTab === "winners" && (
              <div className="space-y-6">
                
                {/* Status-specific Panels */}
                {!selectedGiveaway.winnersDrawn ? (
                  /* PHASE 1 & 2 DRAFT FLOW */
                  <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-850 space-y-4">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-900 pb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                          <Trophy className="w-4.5 h-4.5 text-purple-400 animate-bounce" />
                          Winner Selection Flow
                        </h4>
                        <p className="text-slate-400 text-xs">
                          Follow the two-phase workflow: first preview temporary winners, then lock and announce permanently.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGeneratePreview(selectedGiveaway.id)}
                          disabled={previewingWinners}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 rounded-xl text-xs font-black text-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          {previewingWinners ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
                          {selectedGiveaway.previewWinners?.length > 0 ? "Regenerate Preview 🔄" : "Preview Winners 🎲"}
                        </button>

                        {selectedGiveaway.previewWinners?.length > 0 && (
                          <button
                            onClick={() => handleConfirmWinners(selectedGiveaway.id)}
                            disabled={confirmingWinners}
                            className="px-4.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/20"
                          >
                            {confirmingWinners ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirm Winners & Notify 🏆
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step Alerts */}
                    {selectedGiveaway.previewWinners?.length > 0 ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex gap-3 text-xs leading-relaxed">
                        <Info className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black uppercase tracking-wider">⚠️ WINNERS PREVIEW IS TEMPORARY</p>
                          <p className="mt-1">
                            This candidate list is randomly generated and NOT saved to the permanent collection yet. 
                            You can review, audit duplicates, or regenerate unlimited times. 
                            Once satisfied, click <strong>Confirm Winners & Notify</strong> to finalize payments and send Telegram Bot winner notifications.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900 p-4 rounded-xl flex gap-3 text-xs text-slate-400">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>No preview generated yet. Click "Preview Winners" above to randomly draft potential winners from active enrollments based on your budget limits.</p>
                      </div>
                    )}

                    {/* Preview list display */}
                    {selectedGiveaway.previewWinners?.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Draft Preview Candidates</span>
                        <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/40">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-900 uppercase tracking-wider text-[9px]">
                              <tr>
                                <th className="p-3">Candidate Name</th>
                                <th className="p-3">Username</th>
                                <th className="p-3">Telegram ID</th>
                                <th className="p-3">UPI ID</th>
                                <th className="p-3 text-emerald-400">Preview Reward</th>
                                <th className="p-3 text-center">QR Code</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                              {selectedGiveaway.previewWinners.map((candidate: any) => (
                                <tr key={candidate.id} className="hover:bg-slate-900/10">
                                  <td className="p-3 font-bold text-slate-200">
                                    {candidate.firstName}
                                    {candidate.isDuplicateUpi && selectedGiveaway.entryRules?.warnDuplicateUpi && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold rounded inline-flex">
                                        DUPLICATE UPI
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-300">
                                    {candidate.username ? `@${candidate.username}` : <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="p-3 text-slate-400 font-mono">{candidate.telegramId}</td>
                                  <td className="p-3 font-mono font-bold text-slate-300">{candidate.upiId || "-"}</td>
                                  <td className="p-3 text-emerald-400 font-black">₹{candidate.rewardAmount}</td>
                                  <td className="p-3 text-center">
                                    {candidate.qrUrl ? (
                                      <a href={candidate.qrUrl} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline">
                                        View QR
                                      </a>
                                    ) : (
                                      <span className="text-slate-600">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* LOCKED CONFIRMED WINNERS FLOW */
                  <div className="bg-indigo-950/10 border border-indigo-900/30 p-6 rounded-3xl space-y-4">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-indigo-400" />
                          Winners List Confirmed & Locked
                        </h4>
                        <p className="text-slate-400 text-xs">
                          The campaign is successfully drawn and completed. Manage direct rewards payouts and manually trigger verification resets.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={handleExportWinners}
                          className="px-3.5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Download className="w-4 h-4" /> Export Winners (CSV)
                        </button>

                        <button
                          onClick={() => handleResetCampaign(selectedGiveaway.id)}
                          disabled={resettingCampaign}
                          className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {resettingCampaign ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <RefreshCw className="w-3.5 h-3.5 text-amber-500" />}
                          Reset Draw Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main list of Confirmed Winners */}
                {selectedGiveaway.winnersDrawn && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Locked Awardees Dashboard</span>
                      <span className="text-xs bg-slate-950 text-slate-400 px-3 py-1 rounded-full border border-slate-900 font-bold font-mono">
                        Winners Count: {entries.filter(e => e.status === "Winner").length}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-850 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-4">Winner Name</th>
                            <th className="p-4">Username</th>
                            <th className="p-4">Telegram ID</th>
                            <th className="p-4">UPI ID</th>
                            <th className="p-4 text-emerald-400">Winning Amount</th>
                            <th className="p-4 text-center">QR Code</th>
                            <th className="p-4">Entry Date</th>
                            <th className="p-4">Payment Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {entries.filter(e => e.status === "Winner").map((winner) => (
                            <tr key={winner.id} className="hover:bg-slate-900/30 transition">
                              <td className="p-4 font-black text-purple-400 flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                                {winner.firstName}
                              </td>
                              <td className="p-4 text-slate-300">
                                {winner.username ? (
                                  <a href={`https://t.me/${winner.username}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline">
                                    @{winner.username}
                                  </a>
                                ) : (
                                  <span className="text-slate-600">N/A</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-400 font-mono">{winner.telegramId}</td>
                              <td className="p-4 font-mono font-bold text-slate-300">{winner.upiId || "-"}</td>
                              <td className="p-4 text-emerald-400 font-black text-sm">₹{winner.rewardAmount}</td>
                              <td className="p-4 text-center">
                                {winner.qrUrl ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <a 
                                      href={winner.qrUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="px-2 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-[10px]"
                                    >
                                      View
                                    </a>
                                    <a 
                                      href={winner.qrUrl} 
                                      download={`QR_Winner_${winner.telegramId}.png`} 
                                      className="px-2 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-[10px]"
                                    >
                                      Download
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">None</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-500">
                                {formatFriendlyKolkata(winner.entryTime)}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                  winner.paymentStatus === "Paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                  winner.paymentStatus === "Rejected" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                  "bg-amber-500/10 border-amber-500/20 text-amber-400" // Pending
                                }`}>
                                  {winner.paymentStatus || "Pending"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {winner.paymentStatus === "Pending" ? (
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      onClick={() => handleMarkAsPaid(winner)}
                                      disabled={payingEntryId === winner.id}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg transition text-[10px] uppercase tracking-wider cursor-pointer"
                                    >
                                      {payingEntryId === winner.id ? "Updating..." : "Paid 💸"}
                                    </button>
                                    <button
                                      onClick={() => openRejectionModal(winner.id)}
                                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-red-400 font-bold border border-slate-700 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : winner.paymentStatus === "Rejected" ? (
                                  <span className="text-[10px] text-rose-500 italic block">Rejected</span>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">💸 Paid</span>
                                )}
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

            {/* TAB CONTENT: LIVE ANALYTICS */}
            {viewTab === "analytics" && (
              <div className="space-y-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Campaign Live Stats & Metrics</span>

                {analyticsLoading ? (
                  <div className="flex justify-center items-center py-20 bg-slate-950/10 border border-slate-850 rounded-2xl">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : !analyticsData ? (
                  <div className="text-center py-16 bg-slate-950/10 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                    Failed to fetch campaign metrics.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    
                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Total Submitted Entries</span>
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-2xl font-black text-white block">{analyticsData.totalEntries}</span>
                      <span className="text-[10px] text-slate-500 block">Total enrollment requests logged</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Verified Active Entries</span>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-2xl font-black text-emerald-400 block">{analyticsData.verifiedEntries}</span>
                      <span className="text-[10px] text-slate-500 block">Active entries ready to be selected</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Rejected / Filtered Entries</span>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="text-2xl font-black text-slate-400 block">{analyticsData.rejectedEntries}</span>
                      <span className="text-[10px] text-slate-500 block">Disqualified or abusive entries</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Preview Draft Winners</span>
                        <Trophy className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-2xl font-black text-amber-400 block">{analyticsData.previewWinners}</span>
                      <span className="text-[10px] text-slate-500 block">Temporary winner count draft</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Confirmed Locked Winners</span>
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-2xl font-black text-purple-400 block">{analyticsData.confirmedWinners}</span>
                      <span className="text-[10px] text-slate-500 block">Final selected locked winners count</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Paid Winners</span>
                        <Coins className="w-4 h-4 text-teal-400" />
                      </div>
                      <span className="text-2xl font-black text-teal-400 block">{analyticsData.paidWinners}</span>
                      <span className="text-[10px] text-slate-500 block">Winners marked paid and approved</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Remaining Budget</span>
                        <DollarSign className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="text-2xl font-black text-rose-400 block">₹{analyticsData.remainingBudget}</span>
                      <span className="text-[10px] text-slate-500 block">Free remaining campaign balance</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Distributed Budget</span>
                        <Coins className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-2xl font-black text-emerald-400 block">₹{analyticsData.distributedBudget}</span>
                      <span className="text-[10px] text-slate-500 block">Allocated campaign rewards</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Video Ads Played</span>
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-2xl font-black text-white block">{analyticsData.totalEntries}</span>
                      <span className="text-[10px] text-slate-500 block">Ads triggered during entry submissions</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Completed Video Ads</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-2xl font-black text-emerald-400 block">{analyticsData.totalEntries}</span>
                      <span className="text-[10px] text-slate-500 block">Ads finished playing before entry</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Estimated Ad Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-2xl font-black text-emerald-400 block">₹{Number(analyticsData.totalEntries * 0.15).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 block">Approx. revenue from completed ads</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Participation Rate</span>
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-2xl font-black text-white block">{analyticsData.participationRate}%</span>
                      <span className="text-[10px] text-slate-500 block">Percentage of active Telegram users enrolled</span>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: AUDIT LOG TRAIL */}
            {viewTab === "audit-logs" && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Audit Log Trail History</span>

                {logsLoading ? (
                  <div className="flex justify-center items-center py-16 bg-slate-950/10 border border-slate-850 rounded-2xl">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-16 bg-slate-950/10 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                    No logs recorded for this giveaway yet.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 ml-3.5 space-y-6">
                    {auditLogs.map((log) => {
                      const iconMap: any = {
                        "Giveaway Created": <Plus className="w-3.5 h-3.5 text-blue-400" />,
                        "Giveaway Updated": <Settings2 className="w-3.5 h-3.5 text-slate-400" />,
                        "Entry Submitted": <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
                        "Preview Generated": <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
                        "Winners Confirmed": <Trophy className="w-3.5 h-3.5 text-purple-400" />,
                        "Payment Approved": <Coins className="w-3.5 h-3.5 text-emerald-400" />,
                        "Payment Rejected": <XCircle className="w-3.5 h-3.5 text-rose-400" />,
                        "Export Downloaded": <Download className="w-3.5 h-3.5 text-teal-400" />,
                        "Giveaway Reset": <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                      };

                      return (
                        <div key={log.id} className="relative pl-7 group">
                          {/* Circle Timeline Bullet */}
                          <div className="absolute -left-3.5 top-1 bg-slate-950 border border-slate-800 rounded-full w-7 h-7 flex items-center justify-center">
                            {iconMap[log.action] || <FileText className="w-3.5 h-3.5 text-slate-300" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-sm text-slate-200">{log.action}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{formatFriendlyKolkata(log.timestamp)}</span>
                            </div>
                            
                            {log.details && (
                              <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-[11px] text-slate-400 font-mono select-all">
                                {JSON.stringify(log.details)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Rejection Modal Dialog */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
              <div className="space-y-1">
                <h4 className="font-black text-slate-100 flex items-center gap-1.5">
                  <XCircle className="w-5 h-5 text-rose-500" />
                  Reject Winner / Entry
                </h4>
                <p className="text-slate-400 text-[10px]">Provide a short justification. The user will be notified instantly via Bot.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Rejection Reason</label>
                <input
                  type="text"
                  placeholder="e.g., Multiple fake profiles detected"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-[11px] transition cursor-pointer"
                >
                  Reject Candidate ❌
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
