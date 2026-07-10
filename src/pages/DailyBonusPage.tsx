import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Disc, AlertTriangle, ArrowLeft, Star, Package, CreditCard, ChevronRight, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

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
  const [userId, setUserId] = useState<string | null>(null);
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
  
  // Scratch Card States
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);



  // Initialization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId");
    const tg = (window as any).Telegram?.WebApp;
    if (tg) tg.expand();
    const tgUserId = tg?.initDataUnsafe?.user?.id;
    const resolvedId = queryUserId || (tgUserId ? String(tgUserId) : null);
    
    if (resolvedId) {
      setUserId(resolvedId);
      try {
        const saved = localStorage.getItem(`daily_bonus_active_view_${resolvedId}`);
        if (saved && ['selection', 'wheel', 'box', 'scratch'].includes(saved)) {
          setActiveView(saved as any);
        }
      } catch (e) {}
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      try {
        localStorage.setItem(`daily_bonus_active_view_${userId}`, activeView);
      } catch (e) {}
    }
  }, [activeView, userId]);

  const fetchStatus = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/daily-bonus/status?userId=${userId}`);
      const data = await res.json();
      if (data.success) setStatus(data);
    } catch (err) {
      console.error("Error fetching bonus status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, [userId]);

  // --- Actions ---

  const handleReveal = async (type: string, index?: number) => {
    if (revealing || !userId) return;
    
    // Prevent re-playing if reward already revealed but not claimed
    if (revealedReward && !claimSuccess) return;

    if (type === 'box' && index !== undefined) {
      setSelectedBox(index);
    }

    setRevealing(true);
    setRevealedReward(null);
    setClaimSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/daily-bonus/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Failed to reveal reward");
        setRevealing(false);
        return;
      }

      if (type === 'wheel') {
        const rewards = status?.modules.wheel.rewards || [];
        const rewardIndex = rewards.findIndex(r => r.label === data.reward.label);
        
        const spinTime = 4000;
        const extraSpins = 5;
        const segmentSize = 360 / (rewards.length || 6);
        
        // Calculate exact angle to stop at the center of the won segment
        // We add current rotation to keep it spinning forward
        const targetAngle = (rewards.length - rewardIndex) * segmentSize - (segmentSize / 2);
        const newRotation = wheelRotation + (360 * extraSpins) + (targetAngle - (wheelRotation % 360));
        
        setWheelRotation(newRotation);
        
        setTimeout(() => {
          setRevealedReward(data.reward);
          setRevealing(false);
        }, spinTime);
      } else if (type === 'box') {
        setTimeout(() => {
          setRevealedReward(data.reward);
          setRevealing(false);
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



  const handleClaim = async () => {
    if (claiming || !userId || !revealedReward) return;

    setClaiming(true);
    try {
      const res = await fetch(`${API_BASE}/api/daily-bonus/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
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
        alert(data.error || "Failed to claim reward. Ensure you watched the ad fully.");
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

      // Fill with gray silver color
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text pattern
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      for(let i=0; i<5; i++) {
        for(let j=0; j<5; j++) {
          ctx.fillText('SCRATCH', 40 + i*60, 30 + j*50);
        }
      }

      setScratchedPercent(0);
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
          setScratchedPercent(100);
        } else if (activeView === 'box' && selectedBox === null) {
          setSelectedBox(0);
        }
      }
    }
  }, [status, activeView]);

  const handleScratch = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas || revealedReward?.claimed || claimSuccess) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check percent
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] === 0) transparent++;
    }
    const percent = (transparent / (canvas.width * canvas.height)) * 100;
    setScratchedPercent(percent);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white font-sans p-6">
        <Disc className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Synchronizing Bonus System...</p>
      </div>
    );
  }

  if (!userId || !status || !status.dailyBonusEnabled) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{!userId ? "Access Denied" : "System Maintenance"}</h1>
        <p className="text-slate-400 max-w-sm mb-6">
          {!userId ? "Please open this page directly from the RoyShare Telegram Bot menu." : "Daily Bonus system is currently disabled by administrator. Please check back later."}
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
      const r = 140;
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

    const getSegmentColor = (index: number, totalCount: number) => {
      const colors = [
        "#4f46e5",
        "#7c3aed",
        "#06b6d4",
        "#10b981",
        "#f59e0b",
        "#db2777"
      ];
      if (totalCount % 2 === 0) {
        return index % 2 === 0 ? "#4f46e5" : "#7c3aed";
      } else if (totalCount % 3 === 0) {
        return ["#4f46e5", "#7c3aed", "#db2777"][index % 3];
      }
      return colors[index % colors.length];
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
        <div className="relative select-none">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-500 z-30 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
          
          <div className="relative p-1 bg-slate-900 rounded-full shadow-[0_0_50px_rgba(79,70,229,0.3)] border-4 border-indigo-500/20">
            <div
              className="relative w-72 h-72 rounded-full overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.25, 0.1, 0.25, 1)"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full select-none">
                <circle cx="150" cy="150" r="148" fill="#020617" />

                {rewards.map((r, i) => {
                  const startAngle = i * segmentSize;
                  const endAngle = (i + 1) * segmentSize;
                  const color = getSegmentColor(i, rewards.length);
                  return (
                    <path
                      key={`slice-${i}`}
                      d={getSectorPath(startAngle, endAngle)}
                      fill={color}
                      stroke="#020617"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  );
                })}

                <circle cx="150" cy="150" r="141" fill="none" stroke="#fbbf24" strokeWidth="2" className="opacity-90" />
                <circle cx="150" cy="150" r="145" fill="none" stroke="#4f46e5" strokeWidth="3" className="opacity-40" />

                {bulbs.map((b, j) => (
                  <circle
                    key={`bulb-${j}`}
                    cx={b.x}
                    cy={b.y}
                    r="2.5"
                    fill={j % 2 === 0 ? "#ffffff" : "#fef08a"}
                    className="animate-pulse"
                    style={{ animationDelay: `${(j * 150) % 1000}ms` }}
                  />
                ))}

                {rewards.map((r, i) => {
                  const cleanLabel = getCleanLabel(r.label);
                  const midAngle = i * segmentSize + segmentSize / 2;
                  const normAngle = ((midAngle % 360) + 360) % 360;
                  const isFlipped = normAngle > 90 && normAngle < 270;
                  const rotateAngle = isFlipped ? midAngle + 180 : midAngle;
                  const textAnchor = isFlipped ? "start" : "end";
                  const textX = isFlipped ? 22 : 122;

                  let fontSize = 11;
                  if (rewards.length > 24) fontSize = 6.5;
                  else if (rewards.length > 18) fontSize = 7.5;
                  else if (rewards.length > 12) fontSize = 8.5;
                  else if (rewards.length > 8) fontSize = 9.5;

                  if (cleanLabel.length > 10) {
                    fontSize = Math.max(5.5, fontSize - 1.5);
                  }

                  return (
                    <g key={`label-g-${i}`} transform={`rotate(${rotateAngle} 150 150)`}>
                      <text
                        x={150 + textX}
                        y={150}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        fill="#ffffff"
                        style={{
                          fontSize: `${fontSize}px`,
                          fontWeight: "950",
                          fontFamily: "Inter, sans-serif",
                          letterSpacing: "-0.01em",
                          textShadow: "0px 1px 3px rgba(0,0,0,0.8)"
                        }}
                      >
                        {cleanLabel}
                      </text>
                    </g>
                  );
                })}

                <circle cx="150" cy="150" r="18" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="3" className="shadow-lg" />
                <circle cx="150" cy="150" r="7" fill="#fbbf24" className="animate-pulse" />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleReveal('wheel')}
          disabled={revealing || (!!revealedReward && !claimSuccess)}
          className={`w-56 py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition shadow-xl ${
            revealing || (!!revealedReward && !claimSuccess) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {revealing ? 'Spinning...' : 'Spin Wheel'}
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

  const ScratchView = () => (
    <div className="flex flex-col items-center space-y-8 py-4">
      <div className="relative w-full max-w-[280px] aspect-[4/3] bg-slate-900 rounded-3xl border-4 border-amber-600 shadow-2xl overflow-hidden group">
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <Trophy className="w-12 h-12 text-amber-500 mb-2 opacity-20" />
            <span className="text-3xl font-black text-white">
               {scratchedPercent > 50 && revealedReward ? `₹${revealedReward.amount}` : '₹??'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Mystery Reward</span>
         </div>

         <canvas
            ref={canvasRef}
            width={280}
            height={210}
            className="absolute inset-0 cursor-crosshair touch-none"
            onMouseMove={handleScratch}
            onTouchMove={handleScratch}
         />

         {scratchedPercent > 50 && !revealedReward?.claimed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-transparent pointer-events-none flex items-center justify-center">
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Cleared!</div>
            </motion.div>
         )}
      </div>
      <p className="text-slate-400 text-xs font-medium">Scratch at least 50% of the area to reveal reward.</p>
      
      {!revealedReward && (
        <button 
          onClick={() => handleReveal('scratch')} 
          className="w-56 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-amber-900/20"
        >
          Get Scratch Card
        </button>
      )}
    </div>
  );

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
