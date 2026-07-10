import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";

export default function TelegramOrb({ onTriggerAdmin }: { onTriggerAdmin: () => void }) {
  const [progress, setProgress] = useState(0);
  const pressTimer = useRef<number | null>(null);
  const isTouch = useRef(false);
  
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearInterval(pressTimer.current);
      }
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = window.setTimeout(() => setTapCount(0), 2000);
    if (tapCount + 1 === 2) {
        onTriggerAdmin();
        setTapCount(0);
        clearTimeout(tapTimerRef.current!);
    }
  };

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === "touchstart") {
      isTouch.current = true;
    } else if (e.type === "mousedown" && isTouch.current) {
      return;
    }

    if (pressTimer.current) {
      clearInterval(pressTimer.current);
    }

    let startTime = Date.now();
    pressTimer.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 2000) * 100, 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        if (pressTimer.current) {
          clearInterval(pressTimer.current);
          pressTimer.current = null;
        }
        onTriggerAdmin();
        setProgress(0);
      }
    }, 50);
  };

  const endPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === "touchend" || e.type === "touchcancel") {
      setTimeout(() => {
        isTouch.current = false;
      }, 500);
    }

    if (pressTimer.current) {
        clearInterval(pressTimer.current);
        pressTimer.current = null;
    }
    setProgress(0);
  };

  return (
    <motion.button
      onClick={handleTap}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      whileHover={{ scale: 1.05 }}
      className="relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 mb-8 mx-auto cursor-pointer will-change-transform"
    >
      {/* Progress Ring */}
      <svg className="absolute w-full h-full -rotate-90 z-20 pointer-events-none">
          <circle 
            cx="50%" cy="50%" r="48%" 
            className="stroke-white/5 fill-none"
            strokeWidth="2"
          />
          <motion.circle 
            cx="50%" cy="50%" r="48%" 
            className="stroke-blue-500 fill-none"
            strokeWidth="2"
            style={{ pathLength: progress / 100 }}
          />
      </svg>

      {/* Main Glow - Keep only this pulse for performance */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-blue-500/30 blur-3xl z-0 pointer-events-none"
      />
      
      {/* Orb Body - Glassmorphism (Reduced blur for performance) */}
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-full flex items-center justify-center shadow-xl border border-white/20 z-10">
        <div className="absolute inset-2 rounded-full bg-blue-500/5 blur-sm" />
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full shadow-inner">
          <Send className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
      </div>
    </motion.button>
  );
}
