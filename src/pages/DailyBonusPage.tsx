import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Disc, AlertTriangle, ArrowLeft, Star, Package, CreditCard, ChevronRight, Trophy, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { loadAdsgramSDK, getAdsgramConfig } from "../lib/adsManager";

// --- Types ---
interface RewardItem {
  amount: number;
  weight: number;
  label: string;
}

interface BonusModuleStatus {
  enabled: boolean;
  dailyLimit: number;
  usageCount: number;
  cooldown: number;
  lastClaimAt: string | null;
  remaining: number;
  nextAvailableAt: string | null;
  isOnCooldown: boolean;
  cooldownRemaining: number;
  rewards?: RewardItem[];
  unlocked?: boolean;
}

interface BonusStatusResponse {
  success: boolean;
  dailyBonusEnabled: boolean;
  modules: {
    wheel: BonusModuleStatus;
    box: BonusModuleStatus;
    scratch: BonusModuleStatus;
  };
  pendingRewards?: any;
  currency: string;
}

// --- Helpers ---
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- Components ---

export default function DailyBonusPage() {
  const { user, tg, isInsideTelegram, waitForTelegramParams, showAd } = useTelegramAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<BonusStatusResponse | null>(null);
  const [activeView, setActiveView] = useState<'selection' | 'wheel' | 'box' | 'scratch'>('selection');

  // Reward States
  const [revealing, setRevealing] = useState(false);
  const [revealedReward, setRevealedReward] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  // Wheel States
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lightTick, setLightTick] = useState(0);

  useEffect(() => {
    if (revealing) return; // Blinking is driven by the requestAnimationFrame loop during spin
    const interval = setInterval(() => {
      setLightTick(prev => (prev + 1) % 2);
    }, 450);
    return () => clearInterval(interval);
  }, [revealing]);
  
  // Scratch Card States
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [unlockingScratch, setUnlockingScratch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Custom Scratch Drawing and Particle Refs
  const isScratchingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<any[]>([]);
  const isAnimatingParticlesRef = useRef(false);
  const hasTriggeredFiftyPercentRef = useRef(false);
  const lastCalculationTimeRef = useRef(0);



  // Initialization
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`daily_bonus_active_view_${user.id}`);
        if (saved && ['selection', 'wheel', 'box', 'scratch'].includes(saved)) {
          setActiveView(saved as any);
        }
      } catch (e) {}
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`daily_bonus_active_view_${user.id}`, activeView);
      } catch (e) {}
    }
  }, [activeView, user?.id]);

  const fetchStatus = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/daily-bonus/status?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setStatus(data);
    } catch (err) {
      console.error("Error fetching bonus status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // --- Actions ---

  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime); // Quick, clean wooden-click sound
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.04);
      
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // Ignored if audio context is blocked
    }
  };

  const autoClaimRewardForType = async (type: string, reward: any) => {
    if (!user?.id || !reward) return;
    setClaiming(true);
    try {
      const res = await fetch(`${API_BASE}/api/daily-bonus/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          type,
          adStatus: 'Verified'
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setClaimSuccess(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#fbbf24', '#10b981']
        });
        fetchStatus();
      } else {
        alert(data.error || "Failed to auto-claim reward.");
      }
    } catch (err) {
      console.error("Auto claim error:", err);
    } finally {
      setClaiming(false);
    }
  };

  const handleReveal = async (type: string, index?: number) => {
    if (revealing || !user?.id) return;
    
    // Prevent re-playing if reward already revealed but not claimed
    if (revealedReward && !claimSuccess) return;

    if (type === 'box' && index !== undefined) {
      setSelectedBox(index);
    }

    // For scratch, we need to check if it's unlocked in the status
    if (type === 'scratch') {
      const scratchMod = status?.modules.scratch;
      if (!scratchMod?.unlocked) {
        alert("Please unlock the scratch card first!");
        return;
      }
    }

    setRevealing(true);
    setRevealedReward(null);
    setClaimSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/daily-bonus/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Failed to reveal reward");
        setRevealing(false);
        return;
      }

      if (type === 'wheel') {
        const rewards = status?.modules.wheel.rewards || [];
        
        // Find correct index of the reward
        let rewardIndex = rewards.findIndex(r => r.label === data.reward.label);
        if (rewardIndex === -1) {
          rewardIndex = rewards.findIndex(r => Number(r.amount) === Number(data.reward.amount));
        }
        if (rewardIndex === -1) {
          rewardIndex = 0; // Fallback
        }

        const extraSpins = 6; // Spin 6 full turns for drama
        const segmentSize = 360 / (rewards.length || 6);
        
        // targetAngle places the centerline of the won segment exactly at 0 degrees (pointer is at top)
        const targetAngle = 360 - (rewardIndex * segmentSize + segmentSize / 2);
        
        const currentBaseRotation = wheelRotation - (wheelRotation % 360);
        const startRotation = wheelRotation;
        const endRotation = currentBaseRotation + (360 * extraSpins) + targetAngle;
        
        const spinTime = 5000; // 5 seconds smooth ease-out rotation
        
        let lastBoundaryIndex = Math.floor(startRotation / segmentSize);
        const startTime = performance.now();
        
        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / spinTime, 1);
          
          // Speed up outer lights blink during spin, slow down when stopping
          setLightTick(Math.floor(elapsed / (progress > 0.8 ? 250 : 60)));
          
          // Easing: easeOutQuart (starts extremely fast, slows down very smoothly near end)
          const ease = 1 - Math.pow(1 - progress, 4);
          const currentAngle = startRotation + (endRotation - startRotation) * ease;
          
          setWheelRotation(currentAngle);
          
          // Play tick sound whenever a segment boundary crosses the pointer
          const currentBoundaryIndex = Math.floor(currentAngle / segmentSize);
          if (currentBoundaryIndex !== lastBoundaryIndex) {
            playTickSound();
            lastBoundaryIndex = currentBoundaryIndex;
          }
          
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            // Spin complete!
            setRevealedReward(data.reward);
            setRevealing(false);
            
            // Confetti
            confetti({
              particleCount: 150,
              spread: 85,
              origin: { y: 0.6 },
              colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981', '#a855f7']
            });

            // Automatically claim/credit the reward
            if (Number(data.reward.amount) > 0) {
              autoClaimRewardForType('wheel', data.reward);
            } else {
              setClaimSuccess(true);
            }
          }
        };
        requestAnimationFrame(step);
      } else if (type === 'box') {
        setTimeout(() => {
          setRevealedReward(data.reward);
          setRevealing(false);
          // Auto-claim for box
          if (Number(data.reward.amount) > 0) {
            autoClaimRewardForType('box', data.reward);
          } else {
            setClaimSuccess(true);
          }
        }, 1200);
      } else if (type === 'scratch') {
        setRevealedReward(data.reward);
        setRevealing(false);
        initScratchCard();
      }
    } catch (err) {
      console.error("Reveal error:", err);
      setRevealing(false);
    }
  };



  const handleUnlockScratch = async () => {
    if (unlockingScratch || !user?.id) return;
    
    setUnlockingScratch(true);
    try {
      const scratchMod = status?.modules.scratch as any;
      const adType = scratchMod?.unlockAdType || "Reward";

      // Use the centralized showAd implementation
      await showAd(adType);

      // Step 2: Notify backend
      const res = await fetch(`${API_BASE}/api/daily-bonus/unlock-scratch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (res.ok) {
        fetchStatus();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to unlock scratch card.");
      }
    } catch (err: any) {
      console.error("Unlock scratch error:", err);
      alert("Please complete the task to unlock your scratch card.");
    } finally {
      setUnlockingScratch(false);
    }
  };

  const handleClaim = async () => {
    if (claiming || !user?.id || !revealedReward) return;

    setClaiming(true);
    try {
      // For scratch cards, show an ad before claiming
      if (activeView === 'scratch') {
        const scratchMod = status?.modules.scratch as any;
        const adType = scratchMod?.claimAdType || "Interstitial";

        // Use the centralized showAd implementation
        await showAd(adType);
      }

      const res = await fetch(`${API_BASE}/api/daily-bonus/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          type: activeView,
          adStatus: 'Verified'
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setClaimSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });
        fetchStatus();
      } else {
        alert(data.error || "Failed to claim reward. Ensure you completed the task fully.");
      }
    } catch (err: any) {
      console.error("Claim error:", err);
    } finally {
      setClaiming(false);
    }
  };

  // --- UI Helpers ---

  const initScratchCard = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ensure canvas size is set properly
      canvas.width = 280;
      canvas.height = 210;

      // 1. Create a Premium metallic silver gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#94a3b8'); // Slate-400
      grad.addColorStop(0.25, '#f1f5f9'); // Slate-100 (Bright metallic reflection)
      grad.addColorStop(0.5, '#cbd5e1'); // Slate-300
      grad.addColorStop(0.75, '#f8fafc'); // Slate-50 (Another highlight)
      grad.addColorStop(1, '#64748b'); // Slate-500
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Add metallic brushed textures / noise for high polish
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1.2, 1.2);
      }

      // Add horizontal brushed lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        const y = Math.random() * canvas.height;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + (Math.random() * 10 - 5));
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.04)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        const y = Math.random() * canvas.height;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + (Math.random() * 20 - 10));
        ctx.stroke();
      }

      // 3. Draw a premium gold frame around the inner texture
      ctx.strokeStyle = '#eab308'; // amber-500/yellow-600 gold color
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

      // 4. Add subtle dotted pattern for tactile feel
      ctx.fillStyle = 'rgba(71, 85, 105, 0.12)';
      for (let x = 15; x < canvas.width; x += 15) {
        for (let y = 15; y < canvas.height; y += 15) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Draw elegant typography with depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = '#1e293b'; // Slate-800
      ctx.font = '900 14px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ SCRATCH WITH FINGER ✨', canvas.width / 2, canvas.height / 2 - 25);
      
      ctx.fillStyle = '#475569'; // Slate-600
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.fillText('WIN UP TO ₹1,000.00 REAL CASH', canvas.width / 2, canvas.height / 2 + 5);

      ctx.fillStyle = '#d97706'; // Amber-600 gold
      ctx.font = '900 12px "Inter", sans-serif';
      ctx.fillText('🎫 SCRATCH HERE 🎫', canvas.width / 2, canvas.height / 2 + 32);

      // Reset canvas context shadow properties for other drawing operations
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      setScratchedPercent(0);
      hasTriggeredFiftyPercentRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (activeView !== 'selection' && status?.pendingRewards?.[activeView]) {
      const pending = status.pendingRewards[activeView];
      if (pending && !pending.claimed) {
        setRevealedReward({
          amount: pending.amount,
          label: pending.label,
          claimed: false
        });
        if (activeView === 'scratch') {
          initScratchCard();
        } else if (activeView === 'box' && selectedBox === null) {
          setSelectedBox(0);
        }
      }
    }
  }, [status, activeView]);

  const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const spawnParticles = (x: number, y: number, count: number) => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    
    if (canvas.width !== 280 || canvas.height !== 210) {
      canvas.width = 280;
      canvas.height = 210;
    }

    const colors = ['#cbd5e1', '#94a3b8', '#64748b', '#e2e8f0', '#f1f5f9', '#fbbf24'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        radius: Math.random() * 2.5 + 1.2,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    if (!isAnimatingParticlesRef.current) {
      isAnimatingParticlesRef.current = true;
      requestAnimationFrame(updateParticlesAndRender);
    }
  };

  const updateParticlesAndRender = () => {
    const canvas = particleCanvasRef.current;
    if (!canvas) {
      isAnimatingParticlesRef.current = false;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isAnimatingParticlesRef.current = false;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const particles = particlesRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.95; // friction
      p.alpha -= 0.035; // fade out

      if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y > canvas.height) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (particles.length > 0) {
      requestAnimationFrame(updateParticlesAndRender);
    } else {
      isAnimatingParticlesRef.current = false;
    }
  };

  const handleScratchStart = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas || claimSuccess) return;
    
    // Auto-reveal when scratch starts if not already revealed
    if (!revealedReward && !revealing) {
      handleReveal('scratch');
    }

    isScratchingRef.current = true;
    const { x, y } = getCoordinates(e, canvas);
    lastXRef.current = x;
    lastYRef.current = y;

    spawnParticles(x, y, 6);
  };

  const handleScratchMove = (e: any) => {
    if (!isScratchingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const { x, y } = getCoordinates(e, canvas);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 32;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    spawnParticles(x, y, 3);

    lastXRef.current = x;
    lastYRef.current = y;

    throttlePercentCalculation();
  };

  const handleScratchEnd = () => {
    if (!isScratchingRef.current) return;
    isScratchingRef.current = false;
    calculatePercent();
  };

  const throttlePercentCalculation = () => {
    const now = Date.now();
    if (now - lastCalculationTimeRef.current > 120) {
      lastCalculationTimeRef.current = now;
      calculatePercent();
    }
  };

  const calculatePercent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let transparent = 0;
      
      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 128) {
          transparent++;
        }
      }
      
      const totalSampledPixels = data.length / 16;
      const percent = (transparent / totalSampledPixels) * 100;
      
      setScratchedPercent(percent);

      if (percent > 50 && !hasTriggeredFiftyPercentRef.current) {
        hasTriggeredFiftyPercentRef.current = true;
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
        });
        if (navigator.vibrate) {
          try {
            navigator.vibrate(100);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Failed to calculate scratch percentage:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white font-sans p-6">
        <Disc className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Synchronizing Bonus System...</p>
      </div>
    );
  }

  if (!user?.id || !status || !status.dailyBonusEnabled) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{!user?.id ? "Access Denied" : "System Maintenance"}</h1>
        <p className="text-slate-400 max-w-sm mb-6">
          {!user?.id ? "Please open this page directly from the RoyShare Telegram Bot menu." : "Daily Bonus system is currently disabled by administrator. Please check back later."}
        </p>
      </div>
    );
  }

  // --- Sub-Views ---

  const SelectionView = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-white tracking-tight">🎁 Daily Bonus</h1>
        <p className="text-slate-400 text-sm">Choose your luck and win real rewards!</p>
      </div>

      <div className="grid gap-4">
        {[
          { id: 'wheel', name: 'Wheel Spin', icon: Disc, color: 'from-indigo-600 to-blue-600', emoji: '🎡' },
          { id: 'box', name: 'Mystery Box', icon: Package, color: 'from-purple-600 to-pink-600', emoji: '📦' },
          { id: 'scratch', name: 'Scratch Card', icon: CreditCard, color: 'from-amber-600 to-orange-600', emoji: '🎫' }
        ].map((mod) => {
          const modStatus = status?.modules?.[mod.id as keyof typeof status.modules];
          const hasPending = !!(status?.pendingRewards?.[mod.id] && !status.pendingRewards[mod.id].claimed);
          const isLocked = !modStatus?.enabled || (modStatus?.remaining === 0 && !hasPending) || (modStatus?.isOnCooldown && !hasPending);
          
          return (
            <motion.button
              key={mod.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isLocked && setActiveView(mod.id as any)}
              className={`relative overflow-hidden p-5 rounded-3xl border text-left transition-all ${
                isLocked ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'
              }`}
            >
              <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${mod.color}`} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${mod.color} text-white shadow-lg`}>
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {mod.name} {mod.emoji}
                      {hasPending && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black animate-pulse">
                          🎁 CLAIM
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {!status ? 'Loading...' : hasPending ? 'You have an unclaimed reward!' : modStatus?.isOnCooldown ? `Cooldown: ${formatTime(modStatus.cooldownRemaining)}` : `${modStatus?.remaining || 0} of ${modStatus?.dailyLimit || 0} available today`}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${mod.color} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, ((Number(modStatus?.usageCount) || 0) / (Number(modStatus?.dailyLimit) || 1)) * 100))}%` }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex items-center gap-3">
        <Trophy className="w-8 h-8 text-indigo-400 shrink-0" />
        <div>
          <p className="text-xs font-bold text-white uppercase tracking-wider">Pro Tip</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All rewards are credited instantly. Complete every daily task to maximize your rewards!
          </p>
        </div>
      </div>
    </div>
  );

  const WheelView = () => {
    const rewards = status?.modules.wheel.rewards || [];
    const segmentSize = 360 / (rewards.length || 6);

    const getSectorPath = (startAngle: number, endAngle: number) => {
      const r = 136; // Tiny gap from chassis at 144
      const cx = 150;
      const cy = 150;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = cx + r * Math.sin(startRad);
      const y1 = cy - r * Math.cos(startRad);
      const x2 = cx + r * Math.sin(endRad);
      const y2 = cy - r * Math.cos(endRad);
      
      return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
    };

    const getSegmentFill = (index: number, label: string) => {
      const lower = label.toLowerCase();
      const isBetterLuck = lower.includes("luck") || lower.includes("try") || lower.includes("again");
      if (isBetterLuck) {
        return "url(#slateGrad)";
      }
      
      const amountMatch = label.match(/₹\s*(\d+(\.\d+)?)/);
      if (amountMatch) {
        const amt = parseFloat(amountMatch[1]);
        if (amt >= 5) {
          return "url(#goldGrad)"; // Big reward
        }
      }

      return index % 2 === 0 ? "url(#indigoGrad)" : "url(#purpleGrad)";
    };

    const getCleanLabel = (label: string) => {
      if (!label) return "";
      const lower = label.toLowerCase();
      if (lower.includes("better luck") || lower.includes("better luck next time")) {
        return "Try Again";
      }
      return label;
    };

    const numBulbs = Math.max(12, rewards.length * 2);
    const bulbs = [];
    for (let j = 0; j < numBulbs; j++) {
      const angle = (j * 360) / numBulbs;
      const rad = (angle * Math.PI) / 180;
      const bx = 150 + 143 * Math.sin(rad);
      const by = 150 - 143 * Math.cos(rad);
      bulbs.push({ x: bx, y: by });
    }

    return (
      <div className="flex flex-col items-center space-y-8 py-4">
        {/* Outer card framing the wheel with a beautiful glassmorphic slot machine design */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative">
          
          {/* Glowing neon halo behind the wheel */}
          <div className="absolute inset-4 rounded-full bg-indigo-500/10 blur-3xl -z-10 animate-pulse" />
          
          <div className="relative select-none">
            {/* Premium 3D Gold Pointer */}
            <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]">
              <svg width="40" height="48" viewBox="0 0 40 48">
                <defs>
                  <linearGradient id="pointerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </linearGradient>
                </defs>
                {/* 3D Pointer body */}
                <path
                  d="M 20 44 L 4 10 A 16 16 0 0 1 36 10 Z"
                  fill="url(#pointerGold)"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                <path
                  d="M 20 40 L 7 12 A 13 13 0 0 1 33 12 Z"
                  fill="#ffffff"
                  opacity="0.25"
                />
                {/* Embedded ruby jewel */}
                <circle cx="20" cy="16" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>
            
            {/* Outer Marquee Ring Frame with Golden Bezel */}
            <div className="relative p-1.5 bg-slate-950 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.25)] border-4 border-indigo-900/40">
              <div
                className="relative w-80 h-80 rounded-full overflow-hidden"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <svg viewBox="0 0 300 300" className="w-full h-full select-none">
                  {/* SVG Custom gradients and filters */}
                  <defs>
                    <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#221e72" />
                    </linearGradient>
                    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#4c1d95" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#92400e" />
                    </linearGradient>
                    <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="goldChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="40%" stopColor="#ca8a04" />
                      <stop offset="100%" stopColor="#713f12" />
                    </linearGradient>
                    <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                  </defs>

                  {/* Golden Outer Chassis Ring */}
                  <circle cx="150" cy="150" r="148" fill="#020617" stroke="url(#goldChassis)" strokeWidth="4" />

                  {/* Wheel sectors */}
                  {rewards.map((r, i) => {
                    const startAngle = i * segmentSize;
                    const endAngle = (i + 1) * segmentSize;
                    const fill = getSegmentFill(i, r.label);
                    return (
                      <path
                        key={`slice-${i}`}
                        d={getSectorPath(startAngle, endAngle)}
                        fill={fill}
                        stroke="#020617"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {/* Inner golden divider ring */}
                  <circle cx="150" cy="150" r="136" fill="none" stroke="#fbbf24" strokeWidth="1.5" className="opacity-80" />

                  {/* Blinking Marquee LEDs */}
                  {bulbs.map((b, j) => {
                    const isOn = (lightTick + j) % 2 === 0;
                    return (
                      <circle
                        key={`bulb-${j}`}
                        cx={b.x}
                        cy={b.y}
                        r="3.5"
                        fill={isOn ? "#ffffff" : "#475569"}
                        stroke={isOn ? "#fef08a" : "#1e293b"}
                        strokeWidth="0.75"
                        style={{
                          filter: isOn ? "drop-shadow(0 0 3px #fef08a)" : "none",
                        }}
                      />
                    );
                  })}

                  {/* Segment labels - written vertically along each wedge's centerline */}
                  {rewards.map((r, i) => {
                    const cleanLabel = getCleanLabel(r.label);
                    const midAngle = i * segmentSize + segmentSize / 2;

                    let fontSize = 11;
                    if (rewards.length > 24) fontSize = 6.0;
                    else if (rewards.length > 18) fontSize = 7.0;
                    else if (rewards.length > 12) fontSize = 8.0;
                    else if (rewards.length > 8) fontSize = 9.0;

                    if (cleanLabel.length > 10) {
                      fontSize = Math.max(5.0, fontSize - 1.5);
                    }

                    return (
                      <g key={`label-g-${i}`} transform={`rotate(${midAngle} 150 150)`}>
                        <text
                          x="150"
                          y="48"
                          textAnchor="middle"
                          transform="rotate(-90 150 48)" // Radial alignment from rim to center
                          fill="#ffffff"
                          style={{
                            fontSize: `${fontSize}px`,
                            fontWeight: "900",
                            fontFamily: "Inter, sans-serif",
                            textShadow: "0px 2px 4px rgba(0,0,0,0.9)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {cleanLabel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Golden Casino Hub */}
                  <circle cx="150" cy="150" r="22" fill="#1e1b4b" stroke="url(#goldChassis)" strokeWidth="3" className="shadow-2xl" />
                  <circle cx="150" cy="150" r="16" fill="url(#hubGrad)" stroke="#1e1b4b" strokeWidth="1" />
                  <circle cx="150" cy="150" r="6" fill="#ffffff" className="animate-pulse" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Spin Wheel Trigger Action Button */}
        <button
          onClick={() => handleReveal('wheel')}
          disabled={revealing || (!!revealedReward && !claimSuccess)}
          className={`w-64 py-4.5 rounded-3xl font-black text-lg uppercase tracking-wider transition duration-300 shadow-2xl relative overflow-hidden group ${
            revealing || (!!revealedReward && !claimSuccess)
              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-indigo-500/20 active:scale-95 cursor-pointer hover:shadow-indigo-500/40 hover:brightness-110'
          }`}
        >
          {revealing ? (
            <div className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>SPINNING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>🎯 SPIN WHEEL</span>
            </div>
          )}
        </button>
      </div>
    );
  };

  const BoxView = () => (
    <div className="flex flex-col items-center space-y-12 py-10">
      <div className="grid grid-cols-3 gap-4 w-full">
        {[0, 1, 2].map((i) => (
          <motion.button
            key={i}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !revealedReward && handleReveal('box', i)}
            disabled={revealing || (!!revealedReward && !claimSuccess)}
            className={`aspect-square rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all ${
              revealing && selectedBox === i ? 'animate-bounce border-indigo-500' : ''
            } ${
              revealedReward ? (selectedBox === i ? 'bg-indigo-600/20 border-indigo-500 scale-105' : 'bg-slate-900 border-slate-800 opacity-40') : 'bg-slate-900 border-slate-800 hover:border-slate-600 shadow-xl'
            }`}
          >
            <Package className={`w-10 h-10 ${(revealing || revealedReward) && selectedBox === i ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase">Box {i+1}</span>
          </motion.button>
        ))}
      </div>
      <p className="text-slate-400 text-xs font-medium text-center">Tap any box to reveal your mystery reward!</p>
    </div>
  );

  const ScratchView = () => {
    const scratchMod = status?.modules.scratch;
    const isUnlocked = scratchMod?.unlocked || !!(status?.pendingRewards?.scratch && !status.pendingRewards.scratch.claimed);

    return (
      <div className="flex flex-col items-center space-y-8 py-4">
        {!isUnlocked ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="w-64 h-48 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center">
              <CreditCard className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm font-medium">Unlock your daily scratch card to win real rewards!</p>
            </div>
            <button 
              onClick={handleUnlockScratch} 
              disabled={unlockingScratch}
              className="w-64 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-amber-900/20 flex items-center justify-center gap-2"
            >
              {unlockingScratch ? (
                <>
                  <Disc className="w-5 h-5 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Unlock Card</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Scratch Card Frame */}
            <div className="relative w-full max-w-[280px] aspect-[4/3] bg-slate-900 rounded-3xl border-4 border-amber-600 shadow-2xl overflow-hidden group">
               
               {/* Underlying Mystery Reward - revealed when scratchPercent > 50 */}
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                  <Trophy className="w-12 h-12 text-amber-500 mb-2 opacity-25 animate-pulse" />
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
                     {scratchedPercent > 50 && revealedReward ? `₹${Number(revealedReward.amount).toFixed(2)}` : '₹??'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">
                     {scratchedPercent > 50 ? 'Your Won Reward' : 'Mystery Reward'}
                  </span>
               </div>
      
               {/* Scratchable coating canvas */}
               <canvas
                  ref={canvasRef}
                  width={280}
                  height={210}
                  className="absolute inset-0 cursor-crosshair touch-none z-10"
                  onMouseDown={handleScratchStart}
                  onMouseMove={handleScratchMove}
                  onMouseUp={handleScratchEnd}
                  onMouseLeave={handleScratchEnd}
                  onTouchStart={handleScratchStart}
                  onTouchMove={handleScratchMove}
                  onTouchEnd={handleScratchEnd}
               />
      
               {/* Particle layer canvas */}
               <canvas
                  ref={particleCanvasRef}
                  width={280}
                  height={210}
                  className="absolute inset-0 pointer-events-none z-20"
               />
      
               {/* Cleared state overlay */}
               {scratchedPercent > 50 && !revealedReward?.claimed && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none flex items-center justify-center z-30"
                  >
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-950">
                      ✨ Cleared! ✨
                    </div>
                  </motion.div>
               )}
            </div>
      
            {/* Helper Guidance Text */}
            <div className="text-center space-y-1">
              {!revealedReward ? (
                <p className="text-slate-400 text-xs font-semibold">
                  Start scratching to reveal your mystery card!
                </p>
              ) : scratchedPercent <= 50 ? (
                <>
                  <p className="text-slate-300 text-xs font-semibold">
                    Scratch at least 50% of the area to reveal reward.
                  </p>
                  <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    Scratched: {Math.floor(scratchedPercent)}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-emerald-400 text-xs font-bold">
                    Congratulations! Card cleared successfully!
                  </p>
                  <p className="text-slate-500 text-[10px] font-semibold">
                    Tap the Claim button below to claim your ₹{Number(revealedReward?.amount).toFixed(2)}.
                  </p>
                </>
              )}
            </div>
            
            {scratchedPercent > 50 && revealedReward && !claimSuccess && (
              <button 
                onClick={handleClaim} 
                disabled={claiming}
                className="w-64 py-4.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Disc className="w-5 h-5 animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>Claim Reward</span>
                  </>
                )}
              </button>
            )}

            {claimSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl text-center animate-bounce">
                <p className="text-emerald-400 font-black text-sm">REWARD CLAIMED! 🎉</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Credit added to your RoyShare Wallet</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="p-5 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeView !== 'selection' ? (
              <button onClick={() => { setActiveView('selection'); setRevealedReward(null); setClaimSuccess(false); }} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Gift className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-black tracking-wide uppercase">RoyShare Bonus</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {activeView === 'selection' ? 'Menu' : activeView.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-black text-white">Daily Rewards</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {activeView === 'selection' && (
            <motion.div key="selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SelectionView />
            </motion.div>
          )}
          {activeView === 'wheel' && (
            <motion.div key="wheel" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <WheelView />
            </motion.div>
          )}
          {activeView === 'box' && (
            <motion.div key="box" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <BoxView />
            </motion.div>
          )}
          {activeView === 'scratch' && (
            <motion.div key="scratch" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <ScratchView />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Claim Reward Popup */}
        <AnimatePresence>
          {revealedReward && (activeView !== 'scratch' || scratchedPercent > 50) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mt-10 bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl z-50"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              {Number(revealedReward?.amount) === 0 ? (
                <div className="py-4">
                  <span className="text-5xl block mb-4">🍀</span>
                  <h2 className="text-2xl font-black text-white mb-2">Better Luck Next Time!</h2>
                  <p className="text-slate-400 text-sm mb-6">Don't worry, you can try again on your next turn!</p>
                  <button 
                    onClick={() => { setActiveView('selection'); setRevealedReward(null); setClaimSuccess(false); fetchStatus(); }} 
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase"
                  >
                    Continue
                  </button>
                </div>
              ) : !claimSuccess ? (
                <>
                  <h2 className="text-xl font-black text-white mb-1">🎉 You Won!</h2>
                  <p className="text-slate-400 text-xs mb-4">Complete verification to claim reward</p>
                  
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      ₹{Number(revealedReward.amount).toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20"
                  >
                    {claiming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify & Claim Reward</span>
                    )}
                  </button>
                </>
              ) : (
                <div className="py-4 space-y-4">
                  <span className="text-5xl block animate-bounce">🏆</span>
                  <h2 className="text-2xl font-black text-white">Reward Claimed!</h2>
                  <p className="text-emerald-400 text-sm font-bold">₹{Number(revealedReward.amount).toFixed(2)} credited to your wallet</p>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto">
                    Your balance has been updated. You can view your transactions history from the profile tab.
                  </p>
                  <button 
                    onClick={() => { setActiveView('selection'); setRevealedReward(null); setClaimSuccess(false); fetchStatus(); }} 
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider"
                  >
                    Back to Menu
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
}
