import React, { memo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Send, Cloud, Shield, Zap, Folder, Wallet, ChevronDown, CheckCircle2 } from "lucide-react";
import TelegramOrb from "./TelegramOrb";

const FloatingChip = memo(({ icon: Icon, text, delay, x, y }: { icon: any, text: string, delay: number, x: string, y: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ 
      opacity: 1, 
      scale: 1
    }}
    transition={{ 
      duration: 1, 
      delay, 
      ease: "easeOut" 
    }}
    style={{ left: x, top: y }}
    className="absolute hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full shadow-xl z-20 pointer-events-none will-change-transform"
  >
    <Icon className="w-4 h-4 text-blue-400" />
    <span className="text-white/80 text-sm font-medium">{text}</span>
  </motion.div>
));

FloatingChip.displayName = "FloatingChip";

const TrustBadge = memo(({ icon: Icon, text }: { icon: any, text: string }) => (
  <motion.div
    whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl transition-all duration-300 will-change-transform"
  >
    <Icon className="w-4 h-4 text-blue-400" />
    <span className="text-white/70 text-sm font-medium">{text}</span>
  </motion.div>
));

TrustBadge.displayName = "TrustBadge";

const WorkflowStep = memo(({ icon: Icon, text, delay }: { icon: any, text: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all will-change-transform"
  >
    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-blue-400" />
    </div>
    <span className="text-white font-medium">{text}</span>
    <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.div>
));

WorkflowStep.displayName = "WorkflowStep";

const WorkflowCard = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1 }}
    className="relative p-6 lg:p-8 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl overflow-hidden group w-full max-w-md mx-auto lg:mx-0 will-change-transform"
  >
    {/* Decorative glow (Static for performance) */}
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />

    <div className="relative space-y-4">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-400" />
        RoyShare Workflow
      </h3>
      
      <WorkflowStep icon={Cloud} text="Upload File" delay={0.2} />
      
      <div className="flex justify-center py-1">
        <ChevronDown className="w-6 h-6 text-blue-400/50" />
      </div>

      <WorkflowStep icon={Folder} text="Google Drive" delay={0.4} />

      <div className="flex justify-center py-1">
        <ChevronDown className="w-6 h-6 text-blue-400/50" />
      </div>

      <WorkflowStep icon={Send} text="RoyShare Link" delay={0.6} />

      <div className="flex justify-center py-1">
        <ChevronDown className="w-6 h-6 text-blue-400/50" />
      </div>

      <WorkflowStep icon={Wallet} text="Wallet Rewards" delay={0.8} />
    </div>
  </motion.div>
));

WorkflowCard.displayName = "WorkflowCard";

export default function Hero({ onTriggerAdmin }: { onTriggerAdmin: () => void }) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <section className="relative min-h-[100dvh] lg:min-h-screen flex flex-col items-center lg:justify-center pt-24 pb-20 lg:py-20 px-4 sm:px-6 overflow-hidden bg-slate-950">
      {/* Background Elements - Static for performance */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/10 rounded-full blur-[80px] sm:blur-[120px] will-change-transform" 
          style={{ transform: "translate3d(0,0,0)" }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/10 rounded-full blur-[80px] sm:blur-[120px] will-change-transform" 
          style={{ transform: "translate3d(0,0,0)" }}
        />
      </div>

      <motion.div 
        style={{ opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full"
      >
        {/* Left Side: Content */}
        <div className="text-center lg:text-left relative flex flex-col items-center lg:items-start">
          <TelegramOrb onTriggerAdmin={onTriggerAdmin} />

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl xs:text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 tracking-tight leading-[1.1] w-full"
          >
            Share Smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">
              Earn Faster.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed px-2 sm:px-0"
          >
            Secure cloud file sharing powered by Telegram and Google Drive.
            <br className="hidden md:block" />
            Upload files, shorten URLs, track downloads and earn rewards from one powerful dashboard.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12 w-full sm:w-auto"
          >
            <motion.a
              href="https://t.me/Roysharearn_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000"
            >
              🚀 Start Sharing
            </motion.a>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-lg transition-all flex items-center justify-center"
            >
              ✨ View Features
            </motion.a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4"
          >
            <TrustBadge icon={Cloud} text="Google Drive Storage" />
            <TrustBadge icon={Send} text="Telegram Integration" />
            <TrustBadge icon={Shield} text="Secure Encryption" />
          </motion.div>
        </div>

        {/* Right Side: Workflow Visual */}
        <div className="relative w-full max-w-sm sm:max-w-md mx-auto lg:mx-0 pt-4 lg:pt-0">
          <WorkflowCard />
          
          {/* Floating Chips around the Workflow Card */}
          <FloatingChip icon={Zap} text="Fast" delay={0} x="85%" y="10%" />
          <FloatingChip icon={Cloud} text="Cloud" delay={1} x="-10%" y="20%" />
          <FloatingChip icon={Wallet} text="Rewards" delay={2} x="90%" y="60%" />
          <FloatingChip icon={Shield} text="Secure" delay={1.5} x="-5%" y="75%" />
          <FloatingChip icon={Folder} text="Upload" delay={0.5} x="10%" y="-5%" />
        </div>
      </motion.div>

      {/* Scroll Indicator - Made relative on mobile to flow naturally */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-20 lg:mt-0 lg:absolute lg:bottom-8 left-1/2 lg:-translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">Explore Features</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-2 rounded-full bg-white/5 border border-white/10"
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
