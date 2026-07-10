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
  Link as LinkIcon,
  MousePointerClick,
  AlertTriangle
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

interface MyLinksPageProps {
  user: any;
  onBack: () => void;
  onViewAnalytics: (linkId: string) => void;
}

export const MyLinksPage: React.FC<MyLinksPageProps> = ({ user, onBack, onViewAnalytics }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  // Edit Link State
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAlias, setEditAlias] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "links"), 
        where("userId", "==", String(user.id))
      );
      const snap = await getDocs(q);
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.status !== "deleted")
        .sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      setLinks(items);
    } catch (err) {
      console.error("Error fetching links:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  const handleCopy = (linkText: string, linkId: string) => {
    navigator.clipboard.writeText(linkText);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (link: any) => {
    const shareText = `Check out this link: ${link.shortUrl}`;
    
    // Check if we are inside Telegram WebApp and use its Telegram Share link if available
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.sendData) {
      // Telegram Mini Apps can use deep linking to share
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link.shortUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: "Share Link",
          text: shareText,
          url: link.shortUrl
        });
        setSharedId(link.linkId);
        setTimeout(() => setSharedId(null), 2000);
      } catch (e) {
        // Fallback
        handleCopy(link.shortUrl, link.linkId);
      }
    } else {
      // Fallback open Telegram Web Share
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link.shortUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      const linkRef = doc(db, "links", linkId);
      await updateDoc(linkRef, { status: "deleted" });
      setLinks(prev => prev.filter(l => l.linkId !== linkId));
      setDeletingLinkId(null);
    } catch (err) {
      console.error("Error deleting link:", err);
    }
  };

  const startEdit = (link: any) => {
    setEditingLink(link);
    setEditUrl(link.originalUrl || link.destinationUrl || "");
    setEditPassword(link.password || "");
    setEditAlias(link.alias || "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editUrl) {
      setEditError("Original Destination URL is required.");
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const cleanAlias = editAlias.trim();
      
      // If alias is changed, check if it's already taken
      if (cleanAlias && cleanAlias !== editingLink.alias) {
        if (!/^[a-zA-Z0-9_-]+$/.test(cleanAlias)) {
          setEditError("Alias must only contain letters, numbers, dashes, and underscores.");
          setSaving(false);
          return;
        }

        // Check links collection
        const qLinks = query(collection(db, "links"), where("alias", "==", cleanAlias));
        const linksSnap = await getDocs(qLinks);
        
        // Check smart_links collection
        const qSmart = query(collection(db, "smart_links"), where("alias", "==", cleanAlias));
        const smartSnap = await getDocs(qSmart);

        if (!linksSnap.empty || !smartSnap.empty) {
          setEditError("This custom alias is already in use. Please choose another.");
          setSaving(false);
          return;
        }
      }

      const linkRef = doc(db, "links", editingLink.linkId);
      const updateData: any = {
        originalUrl: editUrl.trim(),
        destinationUrl: editUrl.trim(),
        password: editPassword.trim(),
        isPasswordProtected: !!editPassword.trim()
      };

      if (cleanAlias) {
        updateData.alias = cleanAlias;
        // Re-construct shortUrl with new alias
        const rawAppUrl = process.env.APP_URL || window.location.origin || "https://www.royshare.online";
        const baseDomain = rawAppUrl.replace(/\/$/, "");
        updateData.shortUrl = `${baseDomain}/lnk/${cleanAlias}`;
      } else {
        // If alias was cleared, fallback to using linkId
        const rawAppUrl = process.env.APP_URL || window.location.origin || "https://www.royshare.online";
        const baseDomain = rawAppUrl.replace(/\/$/, "");
        updateData.shortUrl = `${baseDomain}/lnk/${editingLink.linkId}`;
        updateData.alias = "";
      }

      await updateDoc(linkRef, updateData);
      
      // Refresh list
      await fetchLinks();
      setEditingLink(null);
    } catch (err: any) {
      console.error("Error updating link:", err);
      setEditError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">My Short Links</h2>
          <p className="text-xs text-slate-400">Manage and track your shortened URLs</p>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Retrieving your links...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-850 rounded-2xl p-6 space-y-4">
            <LinkIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <p className="text-slate-300 font-bold">No Shortened Links Yet</p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                Create your first shortened link from the Telegram bot to track click statistics and earn payouts!
              </p>
            </div>
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => {
              const isProtected = !!link.password || !!link.isPasswordProtected;
              const hasAlias = !!link.alias;
              const clicks = link.views || link.clicks || 0;

              return (
                <motion.div
                  key={link.linkId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors relative"
                >
                  {/* Top line with copy & share */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 overflow-hidden flex-1">
                      <p className="text-indigo-400 font-mono font-bold text-sm truncate select-all pr-4">
                        {link.shortUrl}
                      </p>
                      <p className="text-slate-400 text-xs truncate">
                        Original: <span className="text-slate-300 font-mono text-[11px]">{link.originalUrl || link.destinationUrl}</span>
                      </p>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(link.shortUrl, link.linkId)}
                        className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 transition-colors text-slate-300"
                        title="Copy Short URL"
                      >
                        {copiedId === link.linkId ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleShare(link)}
                        className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 transition-colors text-slate-300"
                        title="Share Link"
                      >
                        {sharedId === link.linkId ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Clicks badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold">
                      <MousePointerClick className="w-3 h-3" />
                      <span>{clicks} Clicks</span>
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
                        <span>Alias: {link.alias}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions line */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/60 text-center">
                    <button
                      onClick={() => onViewAnalytics(link.linkId)}
                      className="py-2.5 bg-slate-950 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Analytics
                    </button>
                    <button
                      onClick={() => startEdit(link)}
                      className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingLinkId(link.linkId)}
                      className="py-2.5 bg-slate-950 hover:bg-rose-600/10 border border-slate-800 hover:border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                    <a
                      href={link.shortUrl}
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

      {/* Edit Link Modal Overlay */}
      <AnimatePresence>
        {editingLink && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-400" />
                  Edit Link Settings
                </h3>
                <button 
                  onClick={() => setEditingLink(null)}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Destination URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Original Destination URL *
                  </label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://example.com/some/long/link"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm focus:outline-none text-white font-mono"
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm focus:outline-none text-white font-mono"
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm focus:outline-none text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Only lowercase letters, numbers, hyphens, and underscores are allowed.
                  </p>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingLink(null)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
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

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deletingLinkId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
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
                  <h3 className="text-base font-bold text-white">Delete Short Link</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Are you sure you want to permanently delete this shortened link? Any active traffic will immediately fail. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingLinkId(null)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingLinkId)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Yes, Delete Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
