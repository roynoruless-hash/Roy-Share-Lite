import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { authenticatedFetch } from "../lib/api";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Sparkles,
  Send,
  Calendar,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Settings,
  HelpCircle,
  Clock,
  TrendingUp,
  BarChart2,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  MousePointer,
  Play
} from "lucide-react";

interface InlineButton {
  text: string;
  action: "mini_app" | "bot" | "channel" | "group" | "url" | "custom_url";
  url: string;
  clicks?: number;
}

interface Broadcast {
  id?: string;
  message: string;
  language: string;
  tone: string;
  length: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  buttons: InlineButton[][];
  status: "Draft" | "Scheduled" | "Sent" | "Failed";
  scheduledAt?: string | null;
  createdTime: string;
  createdBy: string;
  sentTime?: string | null;
  totalClicks?: number;
  miniAppOpens?: number;
}

interface TelegramBroadcastCenterProps {
  onOpenSettings?: () => void;
}

export default function TelegramBroadcastCenter({ onOpenSettings }: TelegramBroadcastCenterProps) {
  // Broadcaster config
  const [telegramSettings, setTelegramSettings] = useState<any>({
    channelUsername: "",
    groupUsername: "",
    botUsername: "",
    miniAppShortName: "app"
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  const hasSettings = !!(telegramSettings && telegramSettings.botToken);

  // Active Editor State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("Exciting");
  const [length, setLength] = useState("Medium");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [buttonRows, setButtonRows] = useState<InlineButton[][]>([[]]);
  const [scheduleType, setScheduleType] = useState<"immediately" | "specific_time">("immediately");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [testTarget, setTestTarget] = useState("");

  // UI Utilities
  const [aiLoading, setAiLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<Broadcast[]>([]);
  const [activeTab, setActiveTab] = useState<"composer" | "history" | "settings">("composer");

  // Load Settings and History on init
  useEffect(() => {
    fetchSettings();
    fetchHistory();
  }, []);

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await authenticatedFetch("/api/admin/telegram-settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setTelegramSettings(data.settings);
      }
    } catch (err) {
      console.error("Error loading Telegram settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await authenticatedFetch("/api/admin/telegram-broadcast/list");
      const data = await res.json();
      if (data.success && data.list) {
        setHistoryList(data.list);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper to map and format a button's target URL
  const getButtonUrl = (btn: InlineButton) => {
    const botUser = (telegramSettings?.botUsername || "").replace(/^@/, "");
    const chanUser = (telegramSettings?.channelUsername || "").replace(/^@/, "");
    const grpUser = (telegramSettings?.groupUsername || "").replace(/^@/, "");
    const miniAppShort = telegramSettings?.miniAppShortName || "app";

    switch (btn.action) {
      case "mini_app":
        return `https://t.me/${botUser}/${miniAppShort}`;
      case "bot":
        return `https://t.me/${botUser}`;
      case "channel":
        return `https://t.me/${chanUser}`;
      case "group":
        return `https://t.me/${grpUser}`;
      case "url":
      case "custom_url":
      default:
        return btn.url;
    }
  };

  // Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        if (type === "image") setImageUploading(true);
        else setThumbnailUploading(true);
        const res = await fetch(`${API_BASE}/api/admin/imgbb/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: base64String })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (type === "image") {
            setImageUrl(data.url);
          } else {
            setThumbnailUrl(data.url);
          }
        } else {
          alert("Upload failed: " + (data.error || "Upload Error"));
        }
      } catch (err: any) {
        alert("Upload error: " + err.message);
      } finally {
        setImageUploading(false);
        setThumbnailUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Message Generator Call
  const handleGenerateAI = async (action: "generate" | "regenerate" | "improve") => {
    if (action !== "generate" && !message) {
      alert("Please generate or write some text first before regenerating or improving.");
      return;
    }

    try {
      setAiLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/telegram-broadcast/generate-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          language: language,
          tone: tone,
          length: length,
          action: action,
          originalText: message
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.text);
      } else {
        alert("AI Generation failed: " + (data.error || "Unknown Error"));
      }
    } catch (err: any) {
      alert("AI Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Inline Button Builder Operations
  const handleAddRow = () => {
    setButtonRows([...buttonRows, []]);
  };

  const handleRemoveRow = (rIdx: number) => {
    const updated = buttonRows.filter((_, idx) => idx !== rIdx);
    setButtonRows(updated.length === 0 ? [[]] : updated);
  };

  const handleAddButton = (rIdx: number) => {
    const updated = [...buttonRows];
    updated[rIdx].push({
      text: "New Button",
      action: "mini_app",
      url: ""
    });
    setButtonRows(updated);
  };

  const handleRemoveButton = (rIdx: number, bIdx: number) => {
    const updated = [...buttonRows];
    updated[rIdx] = updated[rIdx].filter((_, idx) => idx !== bIdx);
    setButtonRows(updated);
  };

  const handleButtonChange = (rIdx: number, bIdx: number, field: keyof InlineButton, value: any) => {
    const updated = [...buttonRows];
    updated[rIdx][bIdx] = {
      ...updated[rIdx][bIdx],
      [field]: value
    };
    setButtonRows(updated);
  };

  // Submit Broadcast / Draft / Test
  const handleSubmitBroadcast = async (actionType: "send_now" | "send_test" | "save_draft" | "schedule") => {
    if (!message) {
      alert("Please enter a message to broadcast.");
      return;
    }

    let scheduledAtStr: string | null = null;
    if (actionType === "schedule") {
      if (!scheduleDate || !scheduleTime) {
        alert("Please specify both date and time for scheduled broadcasts.");
        return;
      }
      scheduledAtStr = `${scheduleDate}T${scheduleTime}:00`;
    }

    // Map rows of buttons to store finalized tracking URLs
    const resolvedButtonRows = buttonRows.map((row) =>
      row.map((btn) => ({
        ...btn,
        url: getButtonUrl(btn)
      }))
    );

    try {
      setSubmitLoading(true);
      const payload = {
        id: activeId,
        message,
        language,
        tone,
        length,
        imageUrl,
        thumbnailUrl,
        buttons: resolvedButtonRows,
        status: actionType === "schedule" ? "Scheduled" : actionType === "save_draft" ? "Draft" : "Sent",
        scheduledAt: scheduledAtStr,
        action: actionType,
        testTarget: actionType === "send_test" ? testTarget : undefined,
        origin: window.location.origin,
        createdTime: new Date().toISOString(),
        createdBy: "Admin"
      };

      const res = await fetch(`${API_BASE}/api/admin/telegram-broadcast/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Broadcast action [${actionType}] completed successfully!`);
        if (actionType !== "send_test") {
          handleResetComposer();
          fetchHistory();
          setActiveTab("history");
        }
      } else {
        alert("Action failed: " + (data.error || "Unknown Error"));
      }
    } catch (err: any) {
      alert("Broadcast error: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast record?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/telegram-broadcast/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchHistory();
      } else {
        alert("Delete failed.");
      }
    } catch (err: any) {
      alert("Delete error: " + err.message);
    }
  };

  const handleLoadDraft = (b: Broadcast) => {
    setActiveId(b.id || null);
    setMessage(b.message);
    setLanguage(b.language);
    setTone(b.tone);
    setLength(b.length);
    setImageUrl(b.imageUrl || "");
    setThumbnailUrl(b.thumbnailUrl || "");
    setButtonRows(b.buttons && b.buttons.length > 0 ? b.buttons : [[]]);
    if (b.scheduledAt) {
      setScheduleType("specific_time");
      try {
        const parts = b.scheduledAt.split("T");
        setScheduleDate(parts[0]);
        setScheduleTime(parts[1].substring(0, 5));
      } catch (e) {}
    } else {
      setScheduleType("immediately");
    }
    setActiveTab("composer");
  };

  const handleResetComposer = () => {
    setActiveId(null);
    setMessage("");
    setPrompt("");
    setImageUrl("");
    setThumbnailUrl("");
    setButtonRows([[]]);
    setScheduleType("immediately");
    setScheduleDate("");
    setScheduleTime("");
  };

  return (
    <div className="space-y-6">
      {!settingsLoading && !hasSettings && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <h4 className="text-amber-400 font-bold flex items-center gap-2">
              ⚠️ Telegram Broadcast Center is Not Configured
            </h4>
            <p className="text-xs text-slate-300">
              Please configure your Telegram Bot Token, Bot Username, and other settings to begin using the Broadcast Center.
            </p>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Settings size={14} /> Open Telegram Settings
            </button>
          )}
        </div>
      )}

      {/* Module Title & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📢 Telegram Broadcast Center
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Build and deliver rich Telegram Channel posts with advanced AI copywriting and inline interactive button builders.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("composer")}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
              activeTab === "composer"
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
            }`}
          >
            ✍️ Composer
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
              activeTab === "history"
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
            }`}
          >
            📊 History & Analytics
          </button>
        </div>
      </div>

      {activeTab === "composer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Controls - 7 Cols */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* AI Generator Panel */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  AI Message Generator
                </h3>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-medium">
                  Powered by Gemini
                </span>
              </div>

              {/* Configurations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Hinglish">Hinglish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Exciting">Exciting</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Rewards">Rewards</option>
                    <option value="Viral">Viral</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Short">Short (~1-2 sentences)</option>
                    <option value="Medium">Medium (Scannable, Bullets)</option>
                    <option value="Long">Long (Detailed bulletin)</option>
                  </select>
                </div>
              </div>

              {/* Topic Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Describe what the post should contain (Optional Prompt)
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Announce a massive reward giveaway for playing custom mini games"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Generation Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleGenerateAI("generate")}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Message
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleGenerateAI("regenerate")}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                  title="Regenerate unique variation"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleGenerateAI("improve")}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                  title="Improve formatting, CTR, and grammar"
                >
                  Improve
                </button>
              </div>
            </div>

            {/* Media & Text Editor */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                Message Content & Media
              </h3>

              {/* Message Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-400">Message Body (Supports Markdown/HTML)</label>
                  <span className="text-slate-500 text-xs font-mono">{message.length} chars</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your beautiful message or generate it with AI above..."
                  className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                />
              </div>

              {/* Media Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Broadcast Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400">Broadcast Image (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste Image URL"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors shrink-0">
                      {imageUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "image")}
                        disabled={imageUploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Thumbnail Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400">Thumbnail Upload (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Paste Thumbnail URL"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors shrink-0">
                      {thumbnailUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "thumbnail")}
                        disabled={thumbnailUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline Button Builder */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Inline Button Builder
                </h3>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Button Row
                </button>
              </div>

              <div className="space-y-4">
                {buttonRows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3 relative group/row"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Row {rIdx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddButton(rIdx)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          + Add Button
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(rIdx)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors"
                          title="Delete entire row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {row.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">No buttons in this row. Click "+ Add Button" to start.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {row.map((btn, bIdx) => (
                          <div
                            key={bIdx}
                            className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 relative space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase">Button {bIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveButton(rIdx, bIdx)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Button Text</label>
                                <input
                                  type="text"
                                  value={btn.text}
                                  onChange={(e) => handleButtonChange(rIdx, bIdx, "text", e.target.value)}
                                  placeholder="e.g. 🎮 Play Now"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Action Type</label>
                                <select
                                  value={btn.action}
                                  onChange={(e) => handleButtonChange(rIdx, bIdx, "action", e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                >
                                  <option value="mini_app">Open Mini App</option>
                                  <option value="bot">Open Telegram Bot</option>
                                  <option value="channel">Open Telegram Channel</option>
                                  <option value="group">Open Telegram Group</option>
                                  <option value="url">Open URL</option>
                                  <option value="custom_url">Custom URL</option>
                                </select>
                              </div>

                              {(btn.action === "url" || btn.action === "custom_url") ? (
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Target URL</label>
                                  <input
                                    type="text"
                                    value={btn.url}
                                    onChange={(e) => handleButtonChange(rIdx, bIdx, "url", e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Dynamic Target (Read Only)</label>
                                  <div className="w-full bg-slate-950/50 border border-slate-800/40 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-500 font-mono truncate">
                                    {getButtonUrl(btn)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast Settings & Scheduling */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Broadcast Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Options */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-400">When to deliver</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType("immediately")}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        scheduleType === "immediately"
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-850 text-slate-400"
                      }`}
                    >
                      🚀 Immediately
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType("specific_time")}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        scheduleType === "specific_time"
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-850 text-slate-400"
                      }`}
                    >
                      ⏰ Specific Time
                    </button>
                  </div>

                  {scheduleType === "specific_time" && (
                    <div className="grid grid-cols-2 gap-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Target Information Display */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="text-xs font-bold text-slate-400">Selected Broadcast Targets</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Channel Link:</span>
                      <span className="font-mono text-indigo-400 font-semibold">{telegramSettings?.channelUsername || "Not Configured"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Group Link:</span>
                      <span className="font-mono text-indigo-400 font-semibold">{telegramSettings?.groupUsername || "Not Configured"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Broadcaster Bot:</span>
                      <span className="font-mono text-indigo-400 font-semibold">{telegramSettings?.botUsername || "Not Configured"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Action Panel */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                {/* Save Draft */}
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => handleSubmitBroadcast("save_draft")}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-55 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex-1"
                >
                  Save Draft
                </button>

                {/* Send Test */}
                <div className="flex flex-1 min-w-[200px] gap-1">
                  <input
                    type="text"
                    value={testTarget}
                    onChange={(e) => setTestTarget(e.target.value)}
                    placeholder="Test User Handle/ID"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none flex-1"
                  />
                  <button
                    type="button"
                    disabled={submitLoading}
                    onClick={() => handleSubmitBroadcast("send_test")}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-55 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Send Test
                  </button>
                </div>

                {/* Main Deliver Action */}
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() =>
                    handleSubmitBroadcast(scheduleType === "specific_time" ? "schedule" : "send_now")
                  }
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {submitLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : scheduleType === "specific_time" ? (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      Schedule Broadcast
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Now
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Telegram-style Live Preview - 5 Cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6 space-y-4">
              <div className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-500" />
                Live Telegram Preview
              </div>

              {/* Main Mock Phone Wrapper */}
              <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 max-w-sm mx-auto shadow-2xl relative overflow-hidden flex flex-col aspect-[9/16] max-h-[700px]">
                
                {/* Phone Notch/Status Header */}
                <div className="flex justify-between items-center px-4 pt-1 pb-3 text-slate-500 text-[10px] font-semibold border-b border-slate-900">
                  <div className="font-mono">11:11</div>
                  <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-850 absolute left-1/2 -translate-x-1/2 top-2"></div>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-4 h-2 bg-slate-600 rounded-sm"></div>
                  </div>
                </div>

                {/* Chat Channel Header */}
                <div className="flex items-center gap-3 py-2 border-b border-slate-900">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-sm border border-slate-700 shadow-inner">
                    {telegramSettings?.channelUsername ? telegramSettings.channelUsername.charAt(1).toUpperCase() : "T"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {telegramSettings?.channelUsername ? telegramSettings.channelUsername : "@TelegramChannel"}
                    </div>
                    <div className="text-[10px] text-indigo-400 font-medium">broadcast channel</div>
                  </div>
                </div>

                {/* Live Chat Window Background (Classic Star/Grid Texture or solid) */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none bg-indigo-950/10">
                  
                  {/* Telegram Message Bubble */}
                  <div className="max-w-[88%] bg-slate-900 border border-slate-850 rounded-2xl shadow-lg overflow-hidden animate-in fade-in-30 duration-300">
                    
                    {/* Media Image display */}
                    {imageUrl && (
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-850/30">
                        <img
                          src={imageUrl}
                          alt="Broadcast Media"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Thumbnail representation (if Thumbnail URL provided but no main Image, or represented as card layout) */}
                    {thumbnailUrl && !imageUrl && (
                      <div className="p-2 border-b border-slate-850/30 bg-slate-950/40 flex items-center gap-2">
                        <img
                          src={thumbnailUrl}
                          alt="Thumbnail preview"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                        />
                        <span className="text-[10px] text-slate-500 italic">Thumbnail Attached</span>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="p-3.5 space-y-1">
                      <div className="text-xs text-slate-100 font-sans leading-relaxed whitespace-pre-wrap select-text">
                        {message || "Drafting announcement message..."}
                      </div>
                      <div className="flex justify-end items-center text-[9px] text-slate-500 font-medium font-mono pt-1">
                        11:11 AM
                      </div>
                    </div>
                  </div>

                  {/* Inline Buttons Layout */}
                  {buttonRows.length > 0 && buttonRows[0].length > 0 && (
                    <div className="max-w-[88%] space-y-1.5 animate-in slide-in-from-bottom-2 duration-300">
                      {buttonRows.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5 w-full">
                          {row.map((btn, bIdx) => (
                            <div
                              key={bIdx}
                              className="flex-1 bg-indigo-950/40 hover:bg-indigo-950/60 active:bg-indigo-950/80 border border-indigo-500/20 rounded-xl py-2 px-3 text-center text-[10px] text-indigo-300 font-semibold cursor-pointer select-none transition-all shadow-sm truncate"
                            >
                              {btn.text || "New Button"}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-sm font-semibold text-slate-300">Broadcast Log History</span>
            <button
              onClick={fetchHistory}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center p-12 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-sm font-medium">No Broadcast logs found</p>
              <p className="text-xs text-slate-650 mt-1">Generate and deliver your very first broadcast inside the Composer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {historyList.map((b) => {
                const totalRowButtons = (b.buttons || []).flat();
                return (
                  <div
                    key={b.id}
                    className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all flex flex-col md:flex-row justify-between gap-6 relative group"
                  >
                    <div className="space-y-4 flex-1">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md">ID: {b.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          b.status === "Sent"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : b.status === "Scheduled"
                            ? "bg-indigo-500/10 text-indigo-400"
                            : b.status === "Failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {b.status}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          By {b.createdBy}
                        </span>
                      </div>

                      {/* Content excerpt */}
                      <p className="text-sm text-slate-200 line-clamp-3 whitespace-pre-wrap">
                        {b.message}
                      </p>

                      {/* Media badge indicator */}
                      {(b.imageUrl || b.thumbnailUrl) && (
                        <div className="flex gap-2">
                          {b.imageUrl && (
                            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-1 rounded-md flex items-center gap-1.5">
                              🖼 Image Attached
                            </span>
                          )}
                          {b.thumbnailUrl && (
                            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-1 rounded-md flex items-center gap-1.5">
                              🖼 Thumbnail Attached
                            </span>
                          )}
                        </div>
                      )}

                      {/* Scheduling & Delivery time metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-850/50">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(b.createdTime).toLocaleString()}</span>
                        </div>
                        {b.sentTime && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Send className="w-4 h-4" />
                            <span>Delivered: {new Date(b.sentTime).toLocaleString()}</span>
                          </div>
                        )}
                        {b.status === "Scheduled" && b.scheduledAt && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                            <Calendar className="w-4 h-4" />
                            <span>Scheduled: {new Date(b.scheduledAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Analytics panel / buttons breakdown */}
                    <div className="flex flex-col justify-between items-end gap-4 border-l border-slate-850/50 pl-0 md:pl-6 shrink-0 min-w-full md:min-w-[220px]">
                      {/* Metric Display */}
                      <div className="w-full space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Metrics</div>
                        
                        <div className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 flex items-center gap-1">
                            <MousePointer className="w-3.5 h-3.5" /> Total Clicks
                          </span>
                          <span className="font-bold font-mono text-white text-sm">{b.totalClicks || 0}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Mini App Opens
                          </span>
                          <span className="font-bold font-mono text-white text-sm">{b.miniAppOpens || 0}</span>
                        </div>
                      </div>

                      {/* Operation Actions */}
                      <div className="flex gap-2 w-full pt-2">
                        {b.status === "Draft" || b.status === "Scheduled" ? (
                          <button
                            onClick={() => handleLoadDraft(b)}
                            className="flex-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold rounded-lg transition-all"
                          >
                            ✏️ Edit & Load
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDeleteBroadcast(b.id!)}
                          className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 rounded-lg text-xs transition-all"
                          title="Delete history"
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
      )}
    </div>
  );
}
