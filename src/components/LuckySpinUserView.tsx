import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import {
  Sparkles,
  Award,
  Users,
  Eye,
  Volume2,
  VolumeX,
  Share2,
  Download,
  ArrowLeft,
  Tv,
  List,
  History,
  CheckCircle2,
  AlertTriangle,
  PlayCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { LuckySpinEvent, LuckySpinParticipant, LuckySpinWinner } from "../types/LuckySpin";
import { API_BASE } from "../config/api";

// Sound Generator using Web Audio API to avoid external file dependencies
const playSound = (type: "countdown" | "spin" | "winner" | "celebration", isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "countdown") {
      // Short high pitched beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "spin") {
      // Click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "winner") {
      // Fanfare: quick succession of ascending chords
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        gain.gain.setValueAtTime(0, now + index * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + index * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.45);
      });
    } else if (type === "celebration") {
      // Beautiful harmonic swell
      const now = ctx.currentTime;
      const chords = [261.63, 329.63, 392.00, 523.25, 659.25]; // C chord notes
      chords.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        // Add subtle vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 6; // 6 Hz vibrato
        lfoGain.gain.value = 4;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.6);
        lfo.stop(now + 1.6);
      });
    }
  } catch (err) {
    console.error("Web Audio API not supported or blocked by policy", err);
  }
};

interface LuckySpinUserViewProps {
  onBack: () => void;
  initialEventId?: string | null;
  initialMode?: "join" | "live" | null;
  clearInitialParams?: () => void;
}

export const LuckySpinUserView: React.FC<LuckySpinUserViewProps> = ({
  onBack,
  initialEventId,
  initialMode,
  clearInitialParams
}) => {
  const { user, showAd } = useTelegramAuth();
  const [activeTab, setActiveTab] = useState<"events" | "history" | "global-winners">("events");
  const [events, setEvents] = useState<LuckySpinEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<LuckySpinEvent | null>(null);
  const [viewMode, setViewMode] = useState<"regular" | "join" | "live">("regular");

  // Deep Link specific event direct loader
  useEffect(() => {
    if (initialEventId) {
      const docRef = doc(db, "lucky_spin_events", initialEventId);
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as LuckySpinEvent;
          setSelectedEvent({ ...data, id: snap.id });
          if (initialMode) {
            setViewMode(initialMode);
          }
        }
      }).catch(console.error);
    }
  }, [initialEventId, initialMode]);
  const [tgSettings, setTgSettings] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/telegram-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTgSettings(data.settings);
      })
      .catch((err) => console.error("Error loading telegram settings:", err));
  }, []);

  const [participants, setParticipants] = useState<LuckySpinParticipant[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  const [userJoined, setUserJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // User History
  const [userHistory, setUserHistory] = useState<LuckySpinWinner[]>([]);
  const [userEventsJoined, setUserEventsJoined] = useState<any[]>([]);

  // Global Winners List
  const [globalWinners, setGlobalWinners] = useState<LuckySpinWinner[]>([]);

  // Participation Form
  const [realName, setRealName] = useState("");
  const [formError, setFormError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Canvas Ref & Animation state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [targetWinnerIndex, setTargetWinnerIndex] = useState<number | null>(null);
  const [winnerDetails, setWinnerDetails] = useState<LuckySpinWinner | null>(null);
  const [isWinnerPopupOpen, setIsWinnerPopupOpen] = useState(false);
  const [replayEvent, setReplayEvent] = useState<boolean>(false);

  const activeWinner = useMemo(() => {
    if (!selectedEvent) return null;
    const { winnerId, winnerName } = selectedEvent.spinState;
    if (!winnerId) return null;

    const matchedParticipant = participants.find((p) => String(p.telegramId) === String(winnerId));
    
    return {
      id: `${selectedEvent.id}_${winnerId}`,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      telegramId: winnerId,
      username: matchedParticipant?.username || "user",
      winnerName: winnerName || matchedParticipant?.realName || "Participant",
      prize: Number(selectedEvent.prizePerWinner || 0),
      winningTime: new Date().toISOString(),
      walletStatus: "Credited",
      creditStatus: "Wallet Balance Incremented"
    };
  }, [selectedEvent, participants]);

  // Share Card download ref
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Keep track of active viewer session
  useEffect(() => {
    if (!selectedEvent || !user) return;

    const viewerId = `${selectedEvent.id}_${user.id}`;
    const viewerDocRef = doc(db, "lucky_spin_viewers", viewerId);

    // Write viewer record on join
    setDoc(viewerDocRef, {
      eventId: selectedEvent.id,
      userId: user.id,
      lastActive: serverTimestamp()
    }).catch(console.error);

    // Heartbeat every 10s to keep viewer count alive
    const interval = setInterval(() => {
      setDoc(viewerDocRef, {
        eventId: selectedEvent.id,
        userId: user.id,
        lastActive: serverTimestamp()
      }).catch(console.error);
    }, 10000);

    return () => {
      clearInterval(interval);
      // Clean up viewer record
      setDoc(viewerDocRef, {
        eventId: selectedEvent.id,
        userId: user.id,
        lastActive: null // marks as inactive
      }).catch(console.error);
    };
  }, [selectedEvent?.id, user?.id]);

  // Fetch Events
  useEffect(() => {
    const eventsQuery = query(collection(db, "lucky_spin_events"));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const fetched: LuckySpinEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as LuckySpinEvent;
        if (data.status !== "Draft") {
          fetched.push({ ...data, id: doc.id });
        }
      });
      setEvents(fetched);

      // Keep selected event updated in real time
      if (selectedEvent) {
        const updated = fetched.find((e) => e.id === selectedEvent.id);
        if (updated) setSelectedEvent(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedEvent?.id]);

  // Listen to Active Event viewers, participants & spinState
  useEffect(() => {
    if (!selectedEvent) return;

    // Listen to participants
    const participantsQuery = query(
      collection(db, "lucky_spin_participants"),
      where("eventId", "==", selectedEvent.id)
    );
    const unsubParticipants = onSnapshot(participantsQuery, (snapshot) => {
      const parts: LuckySpinParticipant[] = [];
      snapshot.forEach((doc) => {
        parts.push(doc.data() as LuckySpinParticipant);
      });
      // Sort participants locally in memory
      parts.sort((a, b) => new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime());
      setParticipants(parts);

      // Check if current user is in participants
      if (user) {
        const isJoined = parts.some((p) => String(p.telegramId) === String(user.telegramId));
        setUserJoined(isJoined);
      }
    });

    // Listen to viewer counts
    const viewersQuery = query(
      collection(db, "lucky_spin_viewers"),
      where("eventId", "==", selectedEvent.id)
    );
    const unsubViewers = onSnapshot(viewersQuery, (snapshot) => {
      let activeCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastActive) activeCount++;
      });
      // Fallback: make it look highly energetic and live
      setViewersCount(Math.max(activeCount, 12));
    });

    // Listen to winners of this event
    const winnersQuery = query(
      collection(db, "lucky_spin_winners"),
      where("eventId", "==", selectedEvent.id)
    );
    const unsubWinners = onSnapshot(winnersQuery, (snapshot) => {
      if (!snapshot.empty) {
        const wDoc = snapshot.docs[0].data() as LuckySpinWinner;
        setWinnerDetails(wDoc);
      } else {
        setWinnerDetails(null);
      }
    });

    return () => {
      unsubParticipants();
      unsubViewers();
      unsubWinners();
    };
  }, [selectedEvent?.id, user?.telegramId]);

  const selectedEventRef = useRef(selectedEvent);
  useEffect(() => {
    selectedEventRef.current = selectedEvent;
  }, [selectedEvent]);

  // Handle countdown/sound/animations synchronization based on active event spinState
  const lastStateRef = useRef<string>("");
  const lastReplayRef = useRef<number>(0);
  const lastSpunIdRef = useRef<string>("");

  useEffect(() => {
    if (!selectedEvent) return;
    const { status, countdown, winnerId, replayCount } = selectedEvent.spinState;

    if (status !== "spinning" && status !== "paused") {
      spinElapsedRef.current = 0;
    }

    if (status === "countdown" && countdown > 0) {
      playSound("countdown", isMuted);
      setActivities((prev) => [`Countdown: ${countdown}...`, ...prev.slice(0, 15)]);
    }

    // Reset lastSpunId on transition out of spinning
    if (status !== "spinning") {
      lastSpunIdRef.current = "";
    }

    // If Admin trigger a manual replay, reset lastSpunId so we can spin again
    if (replayCount !== undefined && replayCount > (lastReplayRef.current || 0)) {
      lastReplayRef.current = replayCount;
      lastSpunIdRef.current = "";
      if (winnerId) {
        setActivities((prev) => ["Replaying Spin Event...", ...prev.slice(0, 15)]);
      }
    }

    // Trigger spin wheel if status is spinning, we haven't successfully spun for this winnerId yet, and participants list is loaded
    if (status === "spinning" && winnerId && lastSpunIdRef.current !== winnerId && participants.length > 0) {
      setActivities((prev) => ["Live Wheel Started Spinning! 🎡", ...prev.slice(0, 15)]);
      startSpinAnimation(winnerId);
      lastSpunIdRef.current = winnerId;
    }

    if (status === "winner_selected" && lastStateRef.current !== "winner_selected") {
      setActivities((prev) => ["Winner Drawn & Celebrated! 🏆", ...prev.slice(0, 15)]);
    }

    if (status === "paused" && lastStateRef.current !== "paused") {
      setActivities((prev) => ["Event Paused by Admin", ...prev.slice(0, 15)]);
    }

    if (status === "ended" && lastStateRef.current !== "ended") {
      setActivities((prev) => ["Lucky Spin Event Completed!", ...prev.slice(0, 15)]);
    }

    lastStateRef.current = status;
  }, [selectedEvent?.spinState, isMuted, participants, selectedEvent?.id]);

  // Load User History & Global Winners
  useEffect(() => {
    if (activeTab === "history" && user) {
      // User Joined events
      const joinedQuery = query(
        collection(db, "lucky_spin_participants"),
        where("telegramId", "==", String(user.telegramId))
      );
      getDocs(joinedQuery).then((snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push(doc.data()));
        setUserEventsJoined(list);
      });

      // User Winning events
      const winningQuery = query(
        collection(db, "lucky_spin_winners"),
        where("telegramId", "==", String(user.telegramId))
      );
      getDocs(winningQuery).then((snapshot) => {
        const list: LuckySpinWinner[] = [];
        snapshot.forEach((doc) => list.push(doc.data() as LuckySpinWinner));
        setUserHistory(list);
      });
    }

    if (activeTab === "global-winners") {
      const winnersQuery = query(collection(db, "lucky_spin_winners"), orderBy("winningTime", "desc"));
      getDocs(winnersQuery).then((snapshot) => {
        const list: LuckySpinWinner[] = [];
        snapshot.forEach((doc) => list.push(doc.data() as LuckySpinWinner));
        setGlobalWinners(list);
      });
    }
  }, [activeTab, user?.telegramId]);

  // Wheel Physics & Drawing
  const spinAngleRef = useRef(0);
  const isSpinningRef = useRef(false);
  const startRotationRef = useRef(0);
  const finalAngleRef = useRef(0);
  const spinElapsedRef = useRef(0);

  const startSpinAnimation = (winnerId?: string) => {
    if (!canvasRef.current || participants.length === 0 || isSpinningRef.current) return;

    const winnerIdx = participants.findIndex((p) => String(p.telegramId) === String(winnerId));
    if (winnerIdx === -1) return;

    isSpinningRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const numSlices = participants.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Target stop angle (slice aligns with pointer at the top -PI/2)
    // Pointer is at the top (-PI/2). To align sliceIdx with pointer:
    // rotation = 1.5 * Math.PI - (sliceIdx + 0.5) * sliceAngle
    const targetAngle = 1.5 * Math.PI - (winnerIdx + 0.5) * sliceAngle;

    if (spinElapsedRef.current === 0) {
      startRotationRef.current = spinAngleRef.current % (2 * Math.PI);
      finalAngleRef.current = targetAngle + 10 * 2 * Math.PI;
    }

    const duration = 6000; // 6 seconds spin
    const startTime = performance.now();

    const animateWheel = (now: number) => {
      if (selectedEventRef.current?.status === "Paused" || selectedEventRef.current?.spinState?.status === "paused") {
        isSpinningRef.current = false;
        spinElapsedRef.current += now - startTime;
        return;
      }
      const elapsed = (now - startTime) + spinElapsedRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic function for smooth slow down
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
      const easeValue = easeOut(progress);

      spinAngleRef.current = startRotationRef.current + easeValue * (finalAngleRef.current - startRotationRef.current);

      // Draw Wheel
      drawWheel(ctx, canvas, numSlices, spinAngleRef.current);

      // Tick sound effect on segment crossing
      const currentSegment = Math.floor((spinAngleRef.current / sliceAngle) % numSlices);
      if (animateWheel.lastSegment !== currentSegment && progress < 0.9) {
        playSound("spin", isMuted);
        animateWheel.lastSegment = currentSegment;
      }

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        isSpinningRef.current = false;
        spinElapsedRef.current = 0; // Reset for next spin
        // Winner finalized! Trigger confetti & sound
        playSound("winner", isMuted);
        triggerConfettiFanfare();
        setIsWinnerPopupOpen(true);
      }
    };

    animateWheel.lastSegment = -1;
    requestAnimationFrame(animateWheel);
  };

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    N: number,
    angleOffset: number
  ) => {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, W, H);

    const sliceAngle = (2 * Math.PI) / N;

    // Draw slices
    for (let i = 0; i < N; i++) {
      const startA = i * sliceAngle + angleOffset;
      const endA = (i + 1) * sliceAngle + angleOffset;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startA, endA);
      ctx.closePath();

      // Alternate luxurious dark background colors
      const colors = [
        "#1e1b4b", // Indigo
        "#311042", // Purple/Violet
        "#0f172a", // Slate
        "#022c22", // Emerald
        "#4c1d95"  // Dark violet
      ];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Golden border around slices
      ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Name labels
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Label styling
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${N > 30 ? "8px" : N > 15 ? "10px" : "12px"} sans-serif`;

      const truncatedName =
        participants[i].realName.length > 12
          ? participants[i].realName.slice(0, 12) + ".."
          : participants[i].realName;

      ctx.fillText(truncatedName, r - 25, 0);
      ctx.restore();
    }

    // Outer premium Gold ring border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center Golden peg / hub
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#eab308";
    ctx.fill();

    // Draw triangular indicator pointer on top
    ctx.fillStyle = "#ef4444"; // red pointer
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - r - 8);
    ctx.lineTo(cx + 15, cy - r - 8);
    ctx.lineTo(cx, cy - r + 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Re-draw initial static wheel when participants are loaded or changed
  useEffect(() => {
    if (canvasRef.current && participants.length > 0 && !isSpinningRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawWheel(ctx, canvas, participants.length, spinAngleRef.current);
      }
    }
  }, [participants, selectedEvent]);

  // Confetti Fanfare trigger
  const triggerConfettiFanfare = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    const end = Date.now() + 2 * 1000;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  };

  // Form Submission
  const handleParticipate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !user) return;

    // Form Validations
    const cleanedName = realName.trim();
    if (cleanedName.length < 3) {
      setFormError("Name must be minimum 3 characters");
      return;
    }
    if (cleanedName.length > 40) {
      setFormError("Name must be maximum 40 characters");
      return;
    }
    // Emojis and Special character check
    const isInvalid = /[^a-zA-Z\s]/.test(cleanedName);
    if (isInvalid) {
      setFormError("No emojis or special characters allowed. Letters and spaces only.");
      return;
    }

    setFormError("");
    setJoining(true);

    try {
      // Show AdsGram if enabled by Admin
      if (selectedEvent.adsType && selectedEvent.adsType !== "Disabled") {
        try {
          const typeMap: Record<string, string> = {
            "Reward Ad": "Reward",
            "Interstitial Ad": "Interstitial",
            "Task Ad": "Task"
          };
          await showAd(typeMap[selectedEvent.adsType] || "Reward");
        } catch (adError) {
          console.warn("Ad completed with error or skipped", adError);
        }
      }

      // Save user entry securely
      const response = await fetch(`${API_BASE}/api/lucky-spin/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          telegramId: String(user.telegramId),
          username: user.username || "user",
          realName: cleanedName
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to participate");
      }

      setJoinSuccess(true);
      setUserJoined(true);
      setTimeout(() => {
        setJoinSuccess(false);
      }, 3000);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // Download Share Card Image
  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, { cacheBust: true, quality: 1 });
      const link = document.createElement("a");
      link.download = `roy_share_lucky_spin_winner_${selectedEvent?.id || "card"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error creating download image:", err);
    } finally {
      setDownloading(false);
    }
  };

  const isJoinMode = viewMode === "join" || (viewMode === "regular" && !userJoined);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-indigo-500/30 overflow-y-auto pb-16">
      {/* HEADER SECTION */}
      <header className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 sticky top-0 z-40 backdrop-blur-md">
        <button
          onClick={() => {
            if (selectedEvent) {
              setSelectedEvent(null);
              setViewMode("regular");
              if (clearInitialParams) clearInitialParams();
            } else {
              if (clearInitialParams) clearInitialParams();
              onBack();
            }
          }}
          className="p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-lg font-black text-white tracking-wide uppercase bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">
          🎡 Lucky Spin Event
        </h1>

        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </header>

      {!selectedEvent ? (
        <div className="p-5 max-w-xl mx-auto space-y-6">
          {/* TAB BAR FOR VIEWS */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveTab("events")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "events"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Events
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <History className="w-3.5 h-3.5" /> History
            </button>
            <button
              onClick={() => setActiveTab("global-winners")}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "global-winners"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Winners
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "events" && (
              <motion.div
                key="events-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {events.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <p className="text-slate-400 font-bold mb-2">No Live Events Right Now</p>
                    <p className="text-slate-500 text-xs">Check back soon for the next live giveaway event!</p>
                  </div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl"
                    >
                      {ev.bannerUrl && (
                        <div className="w-full h-36 relative">
                          <img src={ev.bannerUrl} alt={ev.name} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 bg-indigo-600 border border-indigo-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                            {ev.status === "Live" ? "🟢 Live Now" : "⏸ Paused"}
                          </div>
                        </div>
                      )}

                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="text-lg font-black text-white">{ev.name}</h3>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                            {ev.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-800/40 p-3 rounded-2xl">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Prize Pool</span>
                            <span className="text-emerald-400 font-black text-sm">₹{ev.prizePerWinner} Per Winner</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Joined / Slots</span>
                            <span className="text-white font-black text-sm">
                              {ev.participantsCount} / {ev.maxParticipants}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl transition-all shadow-lg shadow-indigo-900/20 text-xs cursor-pointer"
                        >
                          {ev.status === "Ended" ? "View Event Winners" : "Enter Event Page"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <h3 className="font-black text-sm uppercase text-slate-400">My Profile Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Joined Spins</span>
                      <p className="text-xl font-black text-blue-400">{userEventsJoined.length}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Prizes Won</span>
                      <p className="text-xl font-black text-amber-400">{userHistory.length}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-sm uppercase text-slate-400 px-1">My Winning History</h3>
                  {userHistory.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-500 text-xs font-bold">
                      No events won yet. Join active events and watch the wheel live to win!
                    </div>
                  ) : (
                    userHistory.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black text-white text-sm">{w.eventName}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {new Date(w.winningTime).toLocaleDateString()} at{" "}
                            {new Date(w.winningTime).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            +₹{w.prize}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-2">
                            {w.walletStatus === "Credited" ? "🟢 Wallet Credited" : "⏳ Processing"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "global-winners" && (
              <motion.div
                key="global-winners-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {globalWinners.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-500 text-xs font-bold">
                    No winners recorded yet. Be the first winner of our Lucky Spin Event!
                  </div>
                ) : (
                  globalWinners.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                          🏆
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{w.winnerName}</p>
                          <span className="text-[10px] text-slate-500">@{w.username}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400 block">₹{w.prize}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {new Date(w.winningTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* DETAIL PAGE AND LIVE DRAW PAGE */
        <div className="p-5 max-w-xl mx-auto space-y-6">
          {/* Active Event Banner & Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {selectedEvent.bannerUrl && (
              <div className="w-full h-44 relative">
                <img src={selectedEvent.bannerUrl} alt={selectedEvent.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-black px-3 py-1 rounded-full text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> {viewersCount} Watching
                </div>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  🎡 Live Spin Event
                </span>
                <h2 className="text-xl font-black text-white mt-1">{selectedEvent.name}</h2>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Prize</span>
                  <p className="font-black text-emerald-400 text-sm">₹{selectedEvent.prizePerWinner}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Total Winners</span>
                  <p className="font-black text-blue-400 text-sm">{selectedEvent.totalWinners}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Slots Left</span>
                  <p className="font-black text-yellow-400 text-sm">
                    {Math.max(selectedEvent.maxParticipants - selectedEvent.participantsCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RENDERING PARTICIPATION FLOW VS LIVE DRAW */}
          {isJoinMode ? (
            /* JOIN PAGE */
            <div className="space-y-6">
              {!userJoined && selectedEvent.status !== "Ended" && selectedEvent.spinState.status === "waiting" ? (
                /* Participant Form */
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <h3 className="font-black text-sm uppercase text-slate-400 flex items-center gap-2">
                    ✍️ Participate in Giveaway
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter your Real Name below to claim your spot inside the wheel. One Telegram Account = One Entry.
                  </p>

                  <form onSubmit={handleParticipate} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Your Real Name (No special characters/emojis)
                      </label>
                      <input
                        type="text"
                        required
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                        placeholder="Enter Real Name (e.g. Ritik Rai)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 text-white font-medium"
                      />
                    </div>

                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {formError}
                      </div>
                    )}

                    {joinSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Successfully joined! Opening Live Spin lobby...
                      </div>
                    )}

                    {selectedEvent.adsType !== "Disabled" && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase block text-center">
                        ℹ️ Ads enabled. Ad will show before entry confirms.
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={joining || selectedEvent.participantsCount >= selectedEvent.maxParticipants}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-950/20 text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {joining ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing Entry...
                        </>
                      ) : selectedEvent.participantsCount >= selectedEvent.maxParticipants ? (
                        "Lobby Full"
                      ) : (
                        "Participate Now"
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Registered Success block with "Watch Live Spin" button */
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white">🎉 You are Registered!</h3>
                    <p className="text-xs text-slate-400">Your name has been added to the wheel. Get ready for the live draw!</p>
                  </div>
                  <button
                    onClick={() => {
                      const botUser = (tgSettings?.botUsername || "Roysharearn_bot").replace(/^@/, '');
                      const liveUrl = `https://t.me/${botUser}?startapp=luckyspin_live_${selectedEvent.id}`;
                      const tgApp = (window as any).Telegram?.WebApp;
                      if (tgApp?.openTelegramLink) {
                        tgApp.openTelegramLink(liveUrl);
                      } else {
                        window.open(liveUrl, "_blank");
                      }
                      setViewMode("live");
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-950/20 text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    🎡 Watch Live Spin
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* LIVE WATCH ONLY PAGE */
            <div className="space-y-6">
              {/* STATUS INDICATOR CARD */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Current Event Status</span>
                  <p className="font-black text-white text-base mt-0.5 animate-pulse">
                    {(selectedEvent.status === "Paused" || selectedEvent.spinState.status === "paused") && "⏸ Event Paused"}
                    {selectedEvent.spinState.status === "waiting" && selectedEvent.status !== "Paused" && "⏳ Waiting for Admin to Start"}
                    {selectedEvent.spinState.status === "countdown" && "⚡ Starting Countdown!"}
                    {selectedEvent.spinState.status === "ready" && "🎯 Wheel Ready to Spin!"}
                    {selectedEvent.spinState.status === "spinning" && "🎡 Wheel Spinning Live!"}
                    {selectedEvent.spinState.status === "winner_selected" && "🎉 Winner Selected!"}
                    {(selectedEvent.status === "Ended" || selectedEvent.spinState.status === "ended") && "🏁 Event Finished"}
                  </p>
                </div>

                {selectedEvent.spinState.status === "countdown" && (
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl animate-ping">
                    {selectedEvent.spinState.countdown}
                  </div>
                )}
              </div>

              {/* IMMERSIVE BIG COUNTDOWN SCREEN */}
              {selectedEvent.spinState.status === "countdown" && (
                <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 border-2 border-indigo-500/20 p-12 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_60%)] pointer-events-none" />
                  
                  {/* Outer circle glow */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 animate-pulse" />
                    
                    {/* Big pulsing number */}
                    <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 select-none filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-bounce">
                      {selectedEvent.spinState.countdown}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-widest uppercase">
                      🚀 GET READY!
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      The Live Lucky Spin will be READY in a few moments...
                    </p>
                  </div>
                </div>
              )}

              {/* WAITING STATE SCREEN */}
              {selectedEvent.spinState.status === "waiting" && selectedEvent.status !== "Paused" && (
                <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full filter blur-xl pointer-events-none animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 rounded-full filter blur-xl pointer-events-none animate-pulse" />
                  
                  <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto animate-[spin_12s_linear_infinite]">
                    <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-wide uppercase bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">
                      🎡 Lucky Spin Live
                    </h3>
                    <p className="text-sm font-bold text-slate-300">
                      Waiting for Admin
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Please stay connected. Your spin will automatically begin.
                    </p>
                  </div>

                  <div className="flex justify-center gap-1.5 py-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce delay-300"></span>
                  </div>
                </div>
              )}

              {/* EVENT PAUSED SCREEN */}
              {(selectedEvent.status === "Paused" || selectedEvent.spinState.status === "paused") && (
                <div className="bg-slate-900 border-2 border-amber-500/20 p-8 rounded-3xl text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                    <span className="text-2xl">⏸</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Event Paused</h3>
                    <p className="text-xs text-slate-400">Waiting for Admin to Resume...</p>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">The live wheel or countdown is temporarily frozen.</p>
                </div>
              )}

              {/* CONCLUDED EVENT SCREEN */}
              {(selectedEvent.status === "Ended" || selectedEvent.spinState.status === "ended") && (
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                  <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">Event Finished</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Thank you for participating in our Lucky Spin Live Event.
                    </p>
                  </div>
                   {activeWinner ? (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 text-left space-y-3">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Winner Drawn</span>
                        <p className="text-base font-black text-amber-400 mt-1">{activeWinner.winnerName}</p>
                        <p className="text-xs text-slate-400">@{activeWinner.username}</p>
                      </div>
                      <div className="border-t border-slate-900/60 pt-2 flex justify-between items-center">
                        <span className="text-xs font-black text-emerald-400">Prize: ₹{activeWinner.prize}</span>
                        <span className="text-[9px] text-slate-500">{new Date(activeWinner.winningTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No winners drawn for this event.</p>
                  )}
                </div>
              )}

              {/* LIVE WHEEL CANVAS (ONLY SHOW IF ACTIVE AND NOT COUNTDOWN / WAITING / PAUSED / ENDED) */}
              {selectedEvent.spinState.status !== "waiting" && 
               selectedEvent.status !== "Paused" && 
               selectedEvent.spinState.status !== "paused" && 
               selectedEvent.status !== "Ended" && 
               selectedEvent.spinState.status !== "ended" && 
               selectedEvent.spinState.status !== "countdown" && 
               participants.length > 0 && (
                <div className="flex flex-col items-center justify-center bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl relative shadow-2xl space-y-4">
                  <div className="relative w-72 h-72">
                    <canvas ref={canvasRef} width={288} height={288} className="w-full h-full" />
                  </div>

                  {/* If status is "ready", show "Waiting for Admin to Spin" card inside the wheel container */}
                  {selectedEvent.spinState.status === "ready" && (
                    <div className="w-full bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-2xl text-center space-y-1 animate-pulse">
                      <p className="text-xs font-black text-emerald-400">🎯 WHEEL IS READY!</p>
                      <p className="text-[10px] text-slate-300 font-bold">Waiting for Admin to Spin...</p>
                    </div>
                  )}

                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    Live Draw Slices • {participants.length} Participants Inside
                  </p>
                </div>
              )}

              {/* SHOW REPLAY OPTION IF EVENT HAS ENDED OR IS WINNER_SELECTED */}
              {selectedEvent.spinState.status === "winner_selected" && activeWinner && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
                  <h3 className="font-black text-sm uppercase text-slate-400">Winner Drawn!</h3>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60">
                    <p className="text-xs text-slate-500 uppercase font-bold">Winner</p>
                    <p className="text-lg font-black text-amber-400 mt-1">{activeWinner.winnerName}</p>
                    <p className="text-[10px] text-slate-500">@{activeWinner.username}</p>
                    <p className="text-xs font-black text-emerald-400 mt-2">Prize: ₹{activeWinner.prize}</p>
                  </div>
                </div>
              )}

              {/* REAL-TIME LOBBY FEED & PARTICIPANTS GRID */}
              {selectedEvent.status !== "Ended" && selectedEvent.spinState.status !== "ended" && (() => {
                const displayActivities = (selectedEvent as any).activities || activities;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lobby Activity Feed */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">
                        ⚡ Live Activity
                      </h4>
                      <div className="h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {displayActivities.length === 0 ? (
                          <p className="text-[11px] text-slate-600 font-bold italic text-center pt-8">
                            Lobby is quiet... waiting for live activities.
                          </p>
                        ) : (
                          displayActivities.map((act: string, i: number) => (
                            <div key={i} className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span>{act}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  {/* Joined Participants Grid */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>👥 Lobby Entries</span>
                      <span className="text-indigo-400 font-black">{participants.length}</span>
                    </h4>
                    <div className="h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {participants.length === 0 ? (
                        <p className="text-[11px] text-slate-600 font-bold italic text-center pt-8">
                          No participants yet.
                        </p>
                      ) : (
                        participants.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 bg-slate-950/50 rounded-lg text-xs"
                          >
                            <span className="font-bold text-slate-200">{p.realName}</span>
                            <span className="text-[10px] text-slate-500">@{p.username}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* FULL SCREEN WINNER CELEBRATION POPUP */}
      <AnimatePresence>
        {isWinnerPopupOpen && activeWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/95 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-md w-full space-y-6 text-center my-8">
              {/* Animated Award Trophy */}
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/20 border-2 border-yellow-300"
              >
                <Award className="w-12 h-12 text-slate-950" />
              </motion.div>

              <div className="space-y-2">
                <p className="text-sm font-black tracking-widest uppercase text-amber-400 animate-pulse">
                  🏆 Lucky Draw Winner
                </p>
                <h2 className="text-2xl font-black text-white">{activeWinner.winnerName}</h2>
                <p className="text-slate-400 text-xs">@{activeWinner.username}</p>
              </div>

              {/* USER RESULT CONDITIONAL CARD */}
              {user && String(user.telegramId) === String(activeWinner.telegramId) ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl space-y-3">
                  <span className="text-lg font-black text-emerald-400 block">🎉 Congratulations!</span>
                  <p className="text-xs text-slate-300">
                    You won the Lucky Spin Event prize of{" "}
                    <span className="font-black text-white text-base block mt-1">₹{activeWinner.prize}</span>
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/25 border border-emerald-500/40 px-3 py-1 rounded-full inline-block">
                    ✅ Wallet Credited Successfully
                  </span>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                  <span className="text-base font-black text-slate-400 block">❤️ Better Luck Next Time</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Thank you for watching the Live Spin! Wait for the next Lucky Spin Event to claim your victory.
                  </p>
                </div>
              )}

              {/* BEAUTIFUL PROFESSIONAL SHARE CARD */}
              {user && String(user.telegramId) === String(activeWinner.telegramId) && (
                <div className="space-y-3">
                  <div
                    ref={shareCardRef}
                    className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl relative text-left overflow-hidden shadow-2xl"
                    style={{ width: "360px", margin: "0 auto" }}
                  >
                    {/* Glowing design highlights */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/15 rounded-full filter blur-xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/15 rounded-full filter blur-xl pointer-events-none" />

                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase block">
                          Roy Share Giveaway
                        </span>
                        <h4 className="text-base font-black text-white mt-1">Lucky Spin Event</h4>
                      </div>
                      <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 font-bold">
                        🏆
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Winner Name</span>
                        <p className="text-lg font-black text-white">{activeWinner.winnerName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black block">Prize Amount</span>
                          <p className="text-base font-black text-emerald-400">₹{activeWinner.prize}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black block">Draw Date</span>
                          <p className="text-xs font-bold text-slate-300">
                            {new Date(activeWinner.winningTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 mt-6 pt-4 flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-400">Roy Share Logo</span>
                      <span className="text-[9px] font-bold text-slate-500">Verify Draw ID: LS_{selectedEvent.id}</span>
                    </div>
                  </div>

                  {/* Share/Download Buttons */}
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                    <button
                      onClick={() => {
                        const winText = `I won ₹${activeWinner.prize} in Roy Share Lucky Spin Live Event! 🎡 Join and earn now!`;
                        window.open(`https://t.me/share/url?url=https://t.me/Roysharearn_bot&text=${encodeURIComponent(winText)}`);
                      }}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs py-2.5 rounded-xl font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-slate-300 hover:text-white"
                    >
                      <Share2 className="w-4 h-4 text-blue-400" /> Telegram
                    </button>
                    <button
                      onClick={() => {
                        const winText = `I won ₹${activeWinner.prize} in Roy Share Lucky Spin Live Event! 🎡 Join and earn now!`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(winText)}`);
                      }}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs py-2.5 rounded-xl font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-slate-300 hover:text-white"
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" /> WhatsApp
                    </button>
                    <button
                      onClick={handleDownloadShareCard}
                      disabled={downloading}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs py-2.5 rounded-xl font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-slate-300 hover:text-white disabled:opacity-50"
                    >
                      {downloading ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Download className="w-4 h-4 text-amber-400" />
                      )}
                      Download
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsWinnerPopupOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-750 text-white font-black py-3 rounded-2xl text-xs transition-all max-w-sm mx-auto cursor-pointer block"
              >
                Close Celebration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
