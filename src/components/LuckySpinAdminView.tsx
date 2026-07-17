import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore";
import {
  Sparkles,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  Users,
  Eye,
  Award,
  List,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Image as ImageIcon
} from "lucide-react";
import { LuckySpinEvent, LuckySpinParticipant, LuckySpinWinner } from "../types/LuckySpin";
import { API_BASE } from "../config/api";

const PRESET_BANNERS = [
  {
    name: "Gold Casino Glow",
    url: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Cosmic Nebula",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Neon Fortune Wave",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
  }
];

export const LuckySpinAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "winners" | "settings">("dashboard");
  const [events, setEvents] = useState<LuckySpinEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<LuckySpinEvent | null>(null);
  const [participants, setParticipants] = useState<LuckySpinParticipant[]>([]);
  const [winners, setWinners] = useState<LuckySpinWinner[]>([]);
  const [viewersCount, setViewersCount] = useState(0);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0].url);
  const [prizePerWinner, setPrizePerWinner] = useState<number>(100);
  const [totalWinners, setTotalWinners] = useState<number>(1);
  const [maxParticipants, setMaxParticipants] = useState<number>(50);
  const [adsType, setAdsType] = useState<"Disabled" | "Reward Ad" | "Interstitial Ad" | "Task Ad">("Disabled");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all events
  useEffect(() => {
    const eventsQuery = query(collection(db, "lucky_spin_events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const list: LuckySpinEvent[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data() as LuckySpinEvent, id: docSnap.id });
      });
      setEvents(list);

      // Keep active control event updated in real-time
      if (selectedEvent) {
        const updated = list.find((e) => e.id === selectedEvent.id);
        if (updated) setSelectedEvent(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedEvent?.id]);

  // Real-time listener for current control event (participants & viewers)
  useEffect(() => {
    if (!selectedEvent) return;

    // Listen to participants of this event
    const participantsQuery = query(
      collection(db, "lucky_spin_participants"),
      where("eventId", "==", selectedEvent.id),
      orderBy("joinTime", "asc")
    );
    const unsubParticipants = onSnapshot(participantsQuery, (snapshot) => {
      const list: LuckySpinParticipant[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as LuckySpinParticipant);
      });
      setParticipants(list);
    });

    // Listen to viewers count
    const viewersQuery = query(
      collection(db, "lucky_spin_viewers"),
      where("eventId", "==", selectedEvent.id)
    );
    const unsubViewers = onSnapshot(viewersQuery, (snapshot) => {
      let activeCount = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.lastActive) activeCount++;
      });
      setViewersCount(Math.max(activeCount, 0));
    });

    // Listen to winners of this event
    const winnersQuery = query(
      collection(db, "lucky_spin_winners"),
      where("eventId", "==", selectedEvent.id),
      orderBy("winningTime", "desc")
    );
    const unsubWinners = onSnapshot(winnersQuery, (snapshot) => {
      const list: LuckySpinWinner[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as LuckySpinWinner);
      });
      setWinners(list);
    });

    return () => {
      unsubParticipants();
      unsubViewers();
      unsubWinners();
    };
  }, [selectedEvent?.id]);

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setFormError("Event Name and Description are required");
      return;
    }
    if (prizePerWinner <= 0) {
      setFormError("Prize must be greater than 0");
      return;
    }
    if (totalWinners <= 0) {
      setFormError("Total Winners must be at least 1");
      return;
    }
    if (maxParticipants <= 0) {
      setFormError("Max Participants must be at least 1");
      return;
    }

    setLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/lucky-spin/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          bannerUrl,
          prizePerWinner,
          totalWinners,
          maxParticipants,
          adsType
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Failed to create event");
      }

      setFormSuccess("Event Created Successfully!");
      setName("");
      setDescription("");
      setActiveTab("dashboard");
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/lucky-spin/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete event");
      }

      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // CONTROL ACTIONS
  const handleUpdateStatus = async (status: "Draft" | "Live" | "Paused" | "Ended") => {
    if (!selectedEvent) return;
    try {
      await fetch(`${API_BASE}/api/admin/lucky-spin/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, status })
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleStartCountdown = async () => {
    if (!selectedEvent) return;
    try {
      await fetch(`${API_BASE}/api/admin/lucky-spin/trigger-countdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id })
      });
    } catch (err) {
      console.error("Failed to start countdown", err);
    }
  };

  const handlePauseResumeWheel = async (action: "pause" | "resume") => {
    if (!selectedEvent) return;
    try {
      await fetch(`${API_BASE}/api/admin/lucky-spin/pause-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, action })
      });
    } catch (err) {
      console.error("Failed to pause/resume wheel", err);
    }
  };

  const handleManualSpin = async () => {
    if (!selectedEvent) return;
    if (participants.length === 0) {
      alert("No participants in lobby to spin the wheel!");
      return;
    }
    try {
      await fetch(`${API_BASE}/api/admin/lucky-spin/trigger-spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id })
      });
    } catch (err) {
      console.error("Failed to trigger spin", err);
    }
  };

  const handleReplayDraw = async () => {
    if (!selectedEvent) return;
    try {
      await fetch(`${API_BASE}/api/admin/lucky-spin/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id })
      });
    } catch (err) {
      console.error("Failed to replay draw", err);
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans space-y-6">
      {/* HEADER PANELS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            🎡 Lucky Spin Live Event Manager
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Create, trigger, pause, and log real-time interactive giveaway draws.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => {
              setSelectedEvent(null);
              setActiveTab("dashboard");
            }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setActiveTab("create");
            }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === "create"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Event
          </button>
        </div>
      </div>

      {selectedEvent ? (
        /* LIVE CONTROL ROOM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="w-full h-40 relative">
                {selectedEvent.bannerUrl && (
                  <img src={selectedEvent.bannerUrl} alt={selectedEvent.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 border border-slate-800 rounded-full flex items-center gap-1.5 text-xs">
                  <Eye className="w-4 h-4 text-blue-400 animate-pulse" /> {viewersCount} Live Viewers
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedEvent.name}</h2>
                    <p className="text-slate-400 text-xs mt-1">{selectedEvent.description}</p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      selectedEvent.status === "Live"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : selectedEvent.status === "Paused"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>

                {/* Event Setup stats */}
                <div className="grid grid-cols-4 gap-4 bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Prize Pool</span>
                    <span className="text-emerald-400 font-black text-base">₹{selectedEvent.prizePerWinner}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Winners Limit</span>
                    <span className="text-blue-400 font-black text-base">{selectedEvent.totalWinners}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Participants Joined</span>
                    <span className="text-white font-black text-base">{participants.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Ads Setup</span>
                    <span className="text-yellow-400 font-black text-xs block mt-1">{selectedEvent.adsType}</span>
                  </div>
                </div>

                {/* REAL-TIME STATE BOARD */}
                <div className="p-4 bg-gradient-to-r from-slate-950 to-indigo-950/20 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Sync Wheel State</span>
                    <p className="text-base font-black text-white mt-1">
                      {selectedEvent.spinState.status === "waiting" && "⏳ Waiting for Draw Launch"}
                      {selectedEvent.spinState.status === "countdown" && "⚡ Countdown Starting..."}
                      {selectedEvent.spinState.status === "spinning" && "🎡 Wheel Spinning Live"}
                      {selectedEvent.spinState.status === "paused" && "⏸ Spin Paused"}
                      {selectedEvent.spinState.status === "winner_selected" && "🏆 Winner Drawn!"}
                      {selectedEvent.spinState.status === "ended" && "🏁 Draw Concluded"}
                    </p>
                  </div>

                  {selectedEvent.spinState.status === "countdown" && (
                    <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl animate-bounce">
                      {selectedEvent.spinState.countdown}
                    </div>
                  )}
                </div>

                {/* CONTROLLER ACTION BUTTONS */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Draw Controller Actions</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleStartCountdown}
                      disabled={selectedEvent.spinState.status !== "waiting" || participants.length === 0}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Countdown
                    </button>

                    <button
                      onClick={() => handlePauseResumeWheel(selectedEvent.spinState.status === "paused" ? "resume" : "pause")}
                      disabled={selectedEvent.spinState.status !== "spinning" && selectedEvent.spinState.status !== "paused"}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <Pause className="w-4 h-4 fill-white" /> {selectedEvent.spinState.status === "paused" ? "Resume Wheel" : "Pause Wheel"}
                    </button>

                    <button
                      onClick={handleManualSpin}
                      disabled={
                        (selectedEvent.spinState.status !== "waiting" && selectedEvent.spinState.status !== "winner_selected") ||
                        participants.length === 0 ||
                        winners.length >= selectedEvent.totalWinners
                      }
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4 fill-white" /> Spin & Draw Winner
                    </button>

                    <button
                      onClick={handleReplayDraw}
                      disabled={selectedEvent.spinState.status !== "winner_selected" && selectedEvent.spinState.status !== "ended"}
                      className="bg-slate-850 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" /> Replay Animation
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedEvent.status === "Live" ? "Paused" : "Live")}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white py-3 px-4 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <Pause className="w-4 h-4" /> {selectedEvent.status === "Live" ? "Pause Event Lobby" : "Activate Event Lobby"}
                    </button>

                    <button
                      onClick={() => handleUpdateStatus("Ended")}
                      disabled={selectedEvent.status === "Ended"}
                      className="bg-red-950/40 border border-red-900/60 hover:bg-red-950/60 disabled:opacity-50 text-red-400 py-3 px-4 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <StopCircle className="w-4 h-4" /> End & Close Event
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PARTICIPANT TABLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm uppercase text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Event Participants ({participants.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Real Name</th>
                      <th className="py-3 px-2">Username</th>
                      <th className="py-3 px-2">Telegram ID</th>
                      <th className="py-3 px-2">Joined Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-600 italic font-bold">
                          No entries inside the lobby yet.
                        </td>
                      </tr>
                    ) : (
                      participants.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/30">
                          <td className="py-3 px-2 font-bold text-white">{p.realName}</td>
                          <td className="py-3 px-2 text-slate-400">@{p.username}</td>
                          <td className="py-3 px-2 text-slate-400">{p.telegramId}</td>
                          <td className="py-3 px-2 text-slate-500">
                            {new Date(p.joinTime).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Winner Logs Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="font-black text-sm uppercase text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="w-4 h-4 text-amber-400" /> Draw Winner Logs
              </h3>

              <div className="space-y-4">
                {winners.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 italic font-bold">
                    No winners selected yet.
                  </div>
                ) : (
                  winners.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950 border border-slate-800/60 rounded-2xl space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-white text-sm">{w.winnerName}</p>
                          <p className="text-[10px] text-slate-500">@{w.username} • ID: {w.telegramId}</p>
                        </div>
                        <span className="text-emerald-400 font-black text-sm">₹{w.prize}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] border-t border-slate-900 pt-2">
                        <span className="text-slate-500">{new Date(w.winningTime).toLocaleTimeString()}</span>
                        <span
                          className={`font-black uppercase px-2 py-0.5 rounded ${
                            w.walletStatus === "Credited"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {w.walletStatus === "Credited" ? "🟢 Credited" : "⏳ Pending"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW TABS */
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.length === 0 ? (
                  <div className="md:col-span-3 py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                    <p className="text-slate-400 font-bold mb-2">No Lucky Spin Events Yet</p>
                    <p className="text-slate-600 text-xs mb-4">Create your first live interactive spin event now!</p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-2.5 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Create Event
                    </button>
                  </div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        {ev.bannerUrl && (
                          <div className="w-full h-32 relative">
                            <img src={ev.bannerUrl} alt={ev.name} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-white">
                              {ev.status}
                            </div>
                          </div>
                        )}

                        <div className="p-5 space-y-3">
                          <h3 className="text-base font-black text-white">{ev.name}</h3>
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{ev.description}</p>

                          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl text-center text-xs">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block">Prize</span>
                              <span className="font-bold text-emerald-400">₹{ev.prizePerWinner}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block">Participants</span>
                              <span className="font-bold text-white">{ev.participantsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 border-t border-slate-850 flex gap-2">
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" /> Launch Controller
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="bg-red-950/40 border border-red-900/40 hover:bg-red-950/60 p-2 rounded-xl text-red-400 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "create" && (
            <motion.div
              key="create-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
            >
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-indigo-400" /> Create New Lucky Spin Event
                </h3>
                <p className="text-slate-400 text-xs mt-1">Configure event prizes, participants limits, and ads.</p>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Event Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Weekly VIP Live Spin Draw"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Description / Terms
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain how to enter and how winners will be announced."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Predefined Banners */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Event Banner Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_BANNERS.map((preset) => (
                        <button
                          type="button"
                          key={preset.name}
                          onClick={() => setBannerUrl(preset.url)}
                          className={`p-2 bg-slate-950 border rounded-xl overflow-hidden transition-all text-left space-y-1.5 cursor-pointer ${
                            bannerUrl === preset.url
                              ? "border-blue-500 ring-2 ring-blue-500/20"
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-12 object-cover rounded-lg" />
                          <span className="text-[9px] text-slate-300 font-bold block truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Prize Per Winner (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={prizePerWinner}
                      onChange={(e) => setPrizePerWinner(Number(e.target.value))}
                      placeholder="e.g. 100"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Total Winners Limit
                    </label>
                    <input
                      type="number"
                      required
                      value={totalWinners}
                      onChange={(e) => setTotalWinners(Number(e.target.value))}
                      placeholder="e.g. 1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      required
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      placeholder="e.g. 50"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      AdsGram Integration
                    </label>
                    <select
                      value={adsType}
                      onChange={(e: any) => setAdsType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Disabled">Disabled (Free Entry)</option>
                      <option value="Reward Ad">Reward Ad (Watch before entry)</option>
                      <option value="Interstitial Ad">Interstitial Ad</option>
                      <option value="Task Ad">Task Ad</option>
                    </select>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Create & Publish Event"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
