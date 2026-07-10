import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  CheckCircle2, 
  Lock, 
  Tag, 
  BarChart2, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Save, 
  X,
  FileIcon,
  MousePointerClick,
  AlertTriangle,
  Globe,
  Monitor,
  Smartphone,
  Layout,
  ArrowRight,
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check
} from "lucide-react";
import { db } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc 
} from "firebase/firestore";

interface MyContentPageProps {
  user: any;
  onBack: () => void;
}

export const MyContentPage: React.FC<MyContentPageProps> = ({ user, onBack }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  // Edit File States
  const [editingFile, setEditingFile] = useState<any | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAlias, setEditAlias] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  // Analytics View State
  const [viewState, setViewState] = useState<'list' | 'analytics'>('list');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'7days' | '30days'>('7days');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "uploads"), 
        where("userId", "==", String(user.id))
      );
      const snap = await getDocs(q);
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.status !== "deleted")
        .sort((a: any, b: any) => {
          const timeA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
          const timeB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
          return timeB - timeA;
        });
      setFiles(items);
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileLink = (file: any) => {
    const rawAppUrl = window.location.origin || "https://www.royshare.online";
    const baseDomain = rawAppUrl.replace(/\/$/, "");
    return file.customAlias 
      ? `${baseDomain}/download/${file.customAlias}` 
      : `${baseDomain}/download/${file.id}`;
  };

  const handleCopy = (linkText: string, fileId: string) => {
    navigator.clipboard.writeText(linkText);
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (file: any) => {
    const fileLink = getFileLink(file);
    const shareText = `Download secure file: ${file.fileName || "Shared File"}`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(fileLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, "_blank");
    setSharedId(file.id);
    setTimeout(() => setSharedId(null), 2000);
  };

  const handleDelete = async (fileId: string) => {
    try {
      const fileRef = doc(db, "uploads", fileId);
      await updateDoc(fileRef, { status: "deleted" });
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setDeletingFileId(null);
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const startEdit = (file: any) => {
    setEditingFile(file);
    // strip out extension for editing if any, or just provide full filename
    setEditFileName(file.fileName || "");
    setEditPassword(file.password || "");
    setEditAlias(file.customAlias || "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editFileName.trim()) {
      setEditError("File Name is required.");
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const cleanAlias = editAlias.trim();
      
      // Check alias uniqueness across uploads if changed
      if (cleanAlias && cleanAlias !== editingFile.customAlias) {
        if (!/^[a-zA-Z0-9_-]+$/.test(cleanAlias)) {
          setEditError("Alias must only contain letters, numbers, dashes, and underscores.");
          setSaving(false);
          return;
        }

        // Query uploads collection
        const qUploads = query(collection(db, "uploads"), where("customAlias", "==", cleanAlias));
        const uploadsSnap = await getDocs(qUploads);
        
        // Query links collection
        const qLinks = query(collection(db, "links"), where("alias", "==", cleanAlias));
        const linksSnap = await getDocs(qLinks);

        // Query smart_links collection
        const qSmart = query(collection(db, "smart_links"), where("alias", "==", cleanAlias));
        const smartSnap = await getDocs(qSmart);

        if (!uploadsSnap.empty || !linksSnap.empty || !smartSnap.empty) {
          setEditError("This custom alias is already in use. Please choose another.");
          setSaving(false);
          return;
        }
      }

      const fileRef = doc(db, "uploads", editingFile.id);
      const updateData: any = {
        fileName: editFileName.trim(),
        password: editPassword.trim(),
        isPasswordProtected: !!editPassword.trim(),
        customAlias: cleanAlias
      };

      await updateDoc(fileRef, updateData);
      
      // Refresh list
      await fetchFiles();
      setEditingFile(null);
    } catch (err: any) {
      console.error("Error updating file:", err);
      setEditError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAnalytics = async (file: any) => {
    setSelectedFile(file);
    setViewState('analytics');
    setAnalyticsLoading(true);
    
    try {
      // Fetch analytics where type == "view" or similar for this file
      const q = query(
        collection(db, "shortener_analytics"),
        where("linkId", "==", file.id)
      );
      const snap = await getDocs(q);
      const records = snap.docs
        .map(d => d.data())
        .filter(d => d.type === "view" || !d.type);

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let downloadsToday = 0;
      let downloadsYesterday = 0;
      const countries: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      const osList: Record<string, number> = {};
      const referrers: Record<string, number> = {};

      const getDatesMap = (n: number) => {
        const map: Record<string, number> = {};
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const dStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          map[dStr] = 0;
        }
        return map;
      };

      const sevenDaysMap = getDatesMap(7);
      const thirtyDaysMap = getDatesMap(30);

      records.forEach(r => {
        const createdAtStr = r.createdAt || "";
        const rDateStr = createdAtStr.split('T')[0];
        
        if (rDateStr === today) downloadsToday++;
        if (rDateStr === yesterday) downloadsYesterday++;

        if (r.country) countries[r.country] = (countries[r.country] || 0) + 1;
        if (r.device) devices[r.device] = (devices[r.device] || 0) + 1;
        if (r.browser) browsers[r.browser] = (browsers[r.browser] || 0) + 1;
        
        let os = r.os;
        if (!os && r.device) {
          const devLower = r.device.toLowerCase();
          if (devLower.includes("windows")) os = "Windows";
          else if (devLower.includes("android")) os = "Android";
          else if (devLower.includes("iphone") || devLower.includes("ipad") || devLower.includes("ios")) os = "iOS";
          else if (devLower.includes("mac") || devLower.includes("macos")) os = "macOS";
          else if (devLower.includes("linux")) os = "Linux";
          else os = "Unknown";
        }
        if (os) osList[os] = (osList[os] || 0) + 1;

        const rawReferrer = r.referrer || "Direct";
        const cleanReferrer = rawReferrer.trim() === "" ? "Direct" : rawReferrer;
        referrers[cleanReferrer] = (referrers[cleanReferrer] || 0) + 1;

        if (createdAtStr) {
          const rDate = new Date(createdAtStr);
          const formattedLabel = rDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          
          if (sevenDaysMap[formattedLabel] !== undefined) {
            sevenDaysMap[formattedLabel]++;
          }
          if (thirtyDaysMap[formattedLabel] !== undefined) {
            thirtyDaysMap[formattedLabel]++;
          }
        }
      });

      setStats({
        total: records.length,
        today: downloadsToday,
        yesterday: downloadsYesterday,
        countries: Object.entries(countries).sort((a, b) => b[1] - a[1]),
        devices: Object.entries(devices).sort((a, b) => b[1] - a[1]),
        browsers: Object.entries(browsers).sort((a, b) => b[1] - a[1]),
        os: Object.entries(osList).sort((a, b) => b[1] - a[1]),
        referrers: Object.entries(referrers).sort((a, b) => b[1] - a[1]),
        timeline7: Object.entries(sevenDaysMap),
        timeline30: Object.entries(thirtyDaysMap)
      });

    } catch (err) {
      console.error("Error loading file downloads analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const activeTimeline = activeTab === '7days' ? stats?.timeline7 : stats?.timeline30;
  const maxClicks = Math.max(...(activeTimeline || []).map(([_, count]: any) => count), 1);

  const renderProgressList = (title: string, icon: any, data: [string, number][], totalSum: number) => (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
        {React.createElement(icon, { className: "w-4 h-4 text-blue-400" })}
        <span>{title}</span>
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-slate-500 text-xs">No downloads logged yet.</p>
        ) : (
          data.slice(0, 5).map(([key, count], i) => {
            const percentage = Math.round((count / (totalSum || 1)) * 100);
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate pr-4">{key || "Direct/Unknown"}</span>
                  <span className="font-bold text-slate-200">{count} downloads ({percentage}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-24">
      <AnimatePresence mode="wait">
        {viewState === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-0"
          >
            {/* Header */}
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">My Content</h2>
                <p className="text-xs text-slate-400">Manage and track your secure file uploads</p>
              </div>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm">Retrieving your files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-slate-850 rounded-2xl p-6 space-y-4">
                  <FileIcon className="w-12 h-12 text-slate-600 mx-auto" />
                  <div>
                    <p className="text-slate-300 font-bold">No Files Uploaded Yet</p>
                    <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                      Upload your first secure file from the web panel or Telegram to start sharing, tracking downloads, and earning rewards!
                    </p>
                  </div>
                  <button 
                    onClick={onBack}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => {
                    const isProtected = !!file.password || !!file.isPasswordProtected;
                    const hasAlias = !!file.customAlias;
                    const fileLink = getFileLink(file);
                    const downloadsCount = file.views || file.downloads || 0;

                    return (
                      <motion.div
                        key={file.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors relative"
                      >
                        {/* Top layout with copy & share */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3 items-start overflow-hidden flex-1">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 overflow-hidden">
                              <p className="text-white font-bold text-sm truncate select-all leading-tight">
                                {file.fileName || "Unnamed File"}
                              </p>
                              <p className="text-slate-400 text-xs flex items-center gap-1.5 font-mono">
                                <span className="text-slate-300 font-sans">{formatBytes(file.fileSize)}</span>
                                <span className="text-slate-600">•</span>
                                <span>{file.uploadDate || "N/A"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(fileLink, file.id)}
                              className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 transition-colors text-slate-300"
                              title="Copy Download Link"
                            >
                              {copiedId === file.id ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleShare(file)}
                              className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 transition-colors text-slate-300"
                              title="Share on Telegram"
                            >
                              {sharedId === file.id ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Badges line */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Downloads badge */}
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold">
                            <MousePointerClick className="w-3 h-3" />
                            <span>{downloadsCount} Downloads</span>
                          </div>

                          {/* Password protected badge */}
                          {isProtected && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold">
                              <Lock className="w-3 h-3" />
                              <span>Password Protected</span>
                            </div>
                          )}

                          {/* Custom Alias badge */}
                          {hasAlias && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-bold">
                              <Tag className="w-3 h-3" />
                              <span>Alias: {file.customAlias}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions drawer row */}
                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/60 text-center">
                          <button
                            onClick={() => handleOpenAnalytics(file)}
                            className="py-2.5 bg-slate-950 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <BarChart2 className="w-3.5 h-3.5" /> Analytics
                          </button>
                          <button
                            onClick={() => startEdit(file)}
                            className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingFileId(file.id)}
                            className="py-2.5 bg-slate-950 hover:bg-rose-600/10 border border-slate-800 hover:border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                          <a
                            href={fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Visit
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </main>
          </motion.div>
        ) : (
          /* FILE ANALYTICS DETAILED VIEW */
          <motion.div
            key="analytics-view"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-0 pb-12"
          >
            {/* Header */}
            <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setStats(null);
                  setViewState('list');
                }} 
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">File Analytics</h2>
                <p className="text-xs text-slate-400">Detailed download tracking logs</p>
              </div>
            </header>

            {analyticsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm">Processing download records...</p>
              </div>
            ) : (
              <main className="p-4 max-w-3xl mx-auto space-y-6">
                {selectedFile && (
                  <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 shrink-0 mt-0.5">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active File Portal</p>
                      <h3 className="font-bold text-sm text-white truncate leading-snug">{selectedFile.fileName}</h3>
                      <p className="text-xs text-blue-400 font-mono select-all truncate">
                        {getFileLink(selectedFile)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Core Count Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-wider mb-1">Downloads</p>
                    <h2 className="text-2xl font-black">{stats?.total || 0}</h2>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">Today</p>
                    <h2 className="text-2xl font-black">{stats?.today || 0}</h2>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-wider mb-1">Yesterday</p>
                    <h2 className="text-2xl font-black">{stats?.yesterday || 0}</h2>
                  </div>
                </div>

                {/* Timeline Chart */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span>Download Timeline</span>
                    </div>
                    {/* Range filters */}
                    <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
                      <button
                        onClick={() => setActiveTab('7days')}
                        className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-colors ${
                          activeTab === '7days' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        7 Days
                      </button>
                      <button
                        onClick={() => setActiveTab('30days')}
                        className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-colors ${
                          activeTab === '30days' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        30 Days
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-44 flex items-end justify-between gap-1.5 pt-6 border-b border-slate-800 px-2">
                      {activeTimeline && activeTimeline.map(([dateLabel, clicksCount]: any, i: number) => {
                        const heightPercentage = Math.max((clicksCount / maxClicks) * 100, 3);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                            <div className="relative w-full flex justify-center">
                              <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                                {clicksCount} downloads
                              </span>
                              <div 
                                className={`w-full rounded-t-sm transition-all duration-300 ${
                                  clicksCount > 0 ? "bg-blue-500 group-hover:bg-blue-400" : "bg-slate-950 border border-slate-850"
                                }`}
                                style={{ height: `${heightPercentage}%`, minHeight: '3px' }}
                              ></div>
                            </div>
                            <span className="text-[8px] text-slate-500 group-hover:text-slate-300 transform font-mono mt-2 truncate w-full text-center">
                              {dateLabel.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Log details */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Detailed Logs ({activeTab === '7days' ? "Last 7 Days" : "Last 30 Days"})</p>
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-850/50 bg-slate-950 border border-slate-850 rounded-xl">
                        {activeTimeline && [...activeTimeline].reverse().map(([dateLabel, clicksCount]: any, i: number) => (
                          <div key={i} className="p-3 flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-600" />
                              {dateLabel}
                            </span>
                            <span className="font-mono font-bold text-slate-200">{clicksCount} downloads</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribution panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderProgressList("Top Countries", Globe, stats?.countries || [], stats?.total || 1)}
                  {renderProgressList("Top Devices", Smartphone, stats?.devices || [], stats?.total || 1)}
                  {renderProgressList("Top Browsers", Layout, stats?.browsers || [], stats?.total || 1)}
                  {renderProgressList("Operating Systems", Monitor, stats?.os || [], stats?.total || 1)}
                  {renderProgressList("Traffic Referrers", ArrowRight, stats?.referrers || [], stats?.total || 1)}
                </div>
              </main>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit File Settings Overlay */}
      <AnimatePresence>
        {editingFile && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                  Edit File Settings
                </h3>
                <button 
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* File Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    File Name *
                  </label>
                  <input
                    type="text"
                    value={editFileName}
                    onChange={(e) => setEditFileName(e.target.value)}
                    placeholder="Document title"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm focus:outline-none text-white font-mono"
                  />
                </div>

                {/* Password Protection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Password Protection (Optional)
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Empty for no password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm focus:outline-none text-white font-mono"
                  />
                </div>

                {/* Custom Alias */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Custom Alias (Optional)
                  </label>
                  <input
                    type="text"
                    value={editAlias}
                    onChange={(e) => setEditAlias(e.target.value)}
                    placeholder="Leave empty for random ID"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-sm focus:outline-none text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Only letters, numbers, hyphens, and underscores are allowed.
                  </p>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingFile(null)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingFileId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 space-y-6 shadow-2xl"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Secure File</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Are you sure you want to permanently delete this file? Users will no longer be able to download it. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingFileId(null)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingFileId)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Yes, Delete File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
