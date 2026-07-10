import { motion } from "motion/react";
import React from "react";

const AnimatedBackground = React.memo(() => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Static gradients instead of infinite animations for performance */}
      <div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/20 rounded-full blur-[120px] will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/20 rounded-full blur-[120px] will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      />
    </div>
  );
});

AnimatedBackground.displayName = "AnimatedBackground";

export default AnimatedBackground;
