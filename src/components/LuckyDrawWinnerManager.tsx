import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
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
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatFriendlyKolkata } from "../lib/dateUtils";

import WinnerCardGenerator from "./WinnerCardGenerator";

export default function LuckyDrawWinnerManager() {
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [botUsername, setBotUsername] = useState("Roysharearn_bot");
  const [miniAppShortName, setMiniAppShortName] = useState("app");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Expanded state to show winners for a giveaway card
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [winnersMap, setWinnersMap] = useState<{ [giveawayId: string]: any[] }>({});
  const [winnersLoading, setWinnersLoading] = useState<{ [giveawayId: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch bot and mini app settings for link generation
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
        console.error("Error fetching bot settings for Lucky Draw Links:", err);
      }
    };
    fetchSettings();
  }, []);

  // Fetch giveaways from Firestore
  useEffect(() => {
    const q = query(collection(db, "upi_giveaways"));
    const unsub = onSnapshot(q, 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt descending
        list.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setGiveaways(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading giveaways:", err);
        setError("Failed to load campaigns.");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Fetch winners when a giveaway card is expanded
  const handleToggleExpand = async (giveawayId: string) => {
    if (expandedId === giveawayId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(giveawayId);

    if (winnersMap[giveawayId]) return; // Already loaded

    setWinnersLoading(prev => ({ ...prev, [giveawayId]: true }));
    try {
      const q = query(
        collection(db, "upi_giveaway_entries"),
        where("giveawayId", "==", giveawayId),
        where("status", "==", "Winner")
      );
      const querySnap = await getDocs(q);
      const winnersList = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWinnersMap(prev => ({ ...prev, [giveawayId]: winnersList }));
    } catch (err) {
      console.error(`Error loading winners for giveaway ${giveawayId}:`, err);
    } finally {
      setWinnersLoading(prev => ({ ...prev, [giveawayId]: false }));
    }
  };

  const handleCopyLink = (giveawayId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const directLink = `https://t.me/${botUsername}/${miniAppShortName}?startapp=${giveawayId}`;
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedId(giveawayId);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  const filteredGiveaways = giveaways.filter(g => 
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading giveaways and links...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" /> 🎁 Lucky Draw Winner Links
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Copy and publish direct Telegram Mini App landing URLs for specific campaigns.
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5" /> Direct Launch Configured
        </div>
      </div>

      {/* Warning/Guide Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 flex items-start gap-3 backdrop-blur-sm">
        <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="font-bold text-slate-200">ℹ️ Automatic Mini App Navigation</p>
          <p className="leading-relaxed">
            Each link below contains a specialized <code className="text-amber-400 font-mono px-1 py-0.5 bg-slate-950 border border-slate-800 rounded">startapp</code> parameter containing the unique ID of the giveaway.
            When users click this link, Telegram will open your Mini App and transition them directly to the active Lucky Draw page, bypassing the home page entirely. No manual selection is required.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by campaign title or ID..."
          className="w-full bg-slate-900 border border-slate-800/80 focus:border-amber-500/60 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Campaigns list */}
      {filteredGiveaways.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Gift className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No campaigns found matching your query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGiveaways.map((giveaway) => {
            const directLink = `https://t.me/${botUsername}/${miniAppShortName}?startapp=${giveaway.id}`;
            const isExpanded = expandedId === giveaway.id;
            const winners = winnersMap[giveaway.id] || [];
            const isWinnersLoading = winnersLoading[giveaway.id] || false;

            return (
              <div 
                key={giveaway.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl transition hover:border-slate-700/80 overflow-hidden"
              >
                {/* Main Card Header */}
                <div 
                  onClick={() => handleToggleExpand(giveaway.id)}
                  className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-200 text-base truncate">{giveaway.title || "Untitled Giveaway"}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        giveaway.status === "Live" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse" 
                          : giveaway.status === "Completed"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-slate-950 text-slate-500 border border-slate-800"
                      }`}>
                        {giveaway.status || "Draft"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-400">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" /> Budget: ₹{giveaway.totalBudget || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-400" /> Winners Limit: {giveaway.totalWinners || 0}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                        ID: {giveaway.id}
                      </span>
                    </div>
                  </div>

                  {/* Actions right aligned */}
                  <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end border-t border-slate-800/60 pt-3 md:pt-0 md:border-t-0">
                    <button
                      onClick={(e) => handleCopyLink(giveaway.id, e)}
                      className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 transition shrink-0 cursor-pointer"
                    >
                      {copiedId === giveaway.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy TMA URL</span>
                        </>
                      )}
                    </button>

                    <div className="p-1 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-800">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Direct Link Info Sub-strip */}
                <div className="px-5 pb-4 pt-1 border-t border-slate-800/40 bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-mono overflow-hidden">
                    <span className="shrink-0 uppercase text-[9px] tracking-wider text-slate-600 font-bold">Mini App Link:</span>
                    <span className="truncate select-all text-slate-400">{directLink}</span>
                  </div>
                  <a
                    href={directLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300 font-bold shrink-0 flex items-center gap-1 select-none cursor-pointer"
                  >
                    Open Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Expanded Winners Drawer Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-800/80 bg-slate-950/40"
                    >
                      <div className="p-5 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" /> Lucky Draw Winners List
                        </h4>

                        {isWinnersLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin mr-2" />
                            <span className="text-xs text-slate-400">Loading winners...</span>
                          </div>
                        ) : winners.length === 0 ? (
                          <div className="text-center py-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-800/80">
                            <Users className="w-7 h-7 text-slate-600 mx-auto mb-1.5" />
                            <p className="text-xs text-slate-500">
                              {giveaway.status === "Draft" || giveaway.status === "Live" 
                                ? "No winners drawn yet. Draw the winners from the UPI Giveaway manager."
                                : "No winners found."}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {winners.map((winner) => (
                                <div 
                                  key={winner.id}
                                  className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-xs text-slate-200">
                                        {winner.firstName || "Anonymous"} {winner.lastName || ""}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        @{winner.username || "no_username"}
                                      </p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                      ₹{winner.rewardAmount || 0}
                                    </span>
                                  </div>

                                  <div className="space-y-1 text-[11px] border-t border-slate-800/50 pt-2 text-slate-400">
                                    <div className="flex justify-between">
                                      <span>UPI ID:</span>
                                      <span className="font-mono text-slate-200 truncate max-w-[140px] select-all">{winner.upiId || "None"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Payment:</span>
                                      <span className={`font-bold uppercase text-[10px] ${
                                        winner.paymentStatus === "Paid" ? "text-emerald-400" : "text-amber-400"
                                      }`}>
                                        {winner.paymentStatus || "Pending"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="pt-4 mt-4 border-t border-slate-800/80">
                              <WinnerCardGenerator giveaway={giveaway} winners={winners} />
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
