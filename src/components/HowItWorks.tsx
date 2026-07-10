import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Send, 
  FileUp, 
  Link2, 
  ShieldCheck, 
  Share2, 
  UserCheck, 
  Wallet, 
  ArrowRight,
  Zap
} from "lucide-react";

const steps = [
  {
    icon: Send,
    title: "Connect Telegram",
    description: "Login securely using Telegram."
  },
  {
    icon: FileUp,
    title: "Upload File or Create Smart Link",
    description: "Upload files to Google Drive or shorten any URL."
  },
  {
    icon: ShieldCheck,
    title: "RoyShare Generates Secure Link",
    description: "Instantly create a protected earning link."
  },
  {
    icon: Share2,
    title: "Share Anywhere",
    description: "Share on Telegram, WhatsApp, Facebook, Instagram, YouTube or your website."
  },
  {
    icon: UserCheck,
    title: "Visitors Complete Verification",
    description: "Users complete secure verification before accessing your content."
  },
  {
    icon: Wallet,
    title: "Earn Rewards",
    description: "Track downloads, clicks and earnings in your dashboard."
  }
];

const TimelineStep = memo(({ step, index }: { step: typeof steps[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex flex-col items-center group w-full"
    >
      {/* Connector Line (Desktop) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-blue-500/50 to-transparent z-0" />
      )}
      
      {/* Connector Line (Mobile) */}
      {index < steps.length - 1 && (
        <div className="lg:hidden absolute top-24 left-1/2 w-px h-full bg-gradient-to-b from-blue-500/50 to-transparent z-0" />
      )}

      {/* Number Circle */}
      <div className="relative z-10 w-24 h-24 mb-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-blue-500/50 transition-colors duration-300">
        <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="relative flex flex-col items-center">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Step</span>
          <span className="text-2xl font-display font-bold text-white">0{index + 1}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 w-full max-w-[280px] p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group-hover:scale-105 will-change-transform">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
          <step.icon className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 leading-tight">{step.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
      </div>
    </motion.div>
  );
});

TimelineStep.displayName = "TimelineStep";

const HowItWorks = memo(() => {
  return (
    <section className="relative py-20 sm:py-24 px-6 bg-slate-950 overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Zap className="w-3 h-3" /> Step-by-Step
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight"
          >
            🚀 How RoyShare Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Start earning in just a few simple steps.
          </motion.p>
        </div>

        {/* Timeline Container */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-0 relative">
          {steps.map((step, index) => (
            <TimelineStep key={index} step={step} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center"
        >
          <motion.a
            href="https://t.me/Roysharearn_bot"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-bold text-xl shadow-xl transition-all group"
          >
            Start Sharing Now
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
});

HowItWorks.displayName = "HowItWorks";

export default HowItWorks;
