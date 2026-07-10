import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  Zap, 
  Cloud, 
  Bot, 
  BarChart3, 
  Coins, 
  Globe, 
  Headphones,
  CheckCircle2
} from "lucide-react";

const trustReasons = [
  {
    icon: Shield,
    title: "Military Grade Security",
    description: "Your files and links are protected with secure infrastructure."
  },
  {
    icon: Zap,
    title: "Lightning Fast Performance",
    description: "Fast uploads and high-speed downloads worldwide."
  },
  {
    icon: Cloud,
    title: "Google Drive Cloud Storage",
    description: "Reliable cloud storage with secure delivery."
  },
  {
    icon: Bot,
    title: "Telegram Automation",
    description: "Powerful Telegram bot for uploads and account management."
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Monitor downloads, clicks, visitors and earnings instantly."
  },
  {
    icon: Coins,
    title: "Transparent Rewards",
    description: "Clear earning reports with detailed statistics."
  },
  {
    icon: Globe,
    title: "Global Availability",
    description: "Accessible from anywhere with optimized delivery."
  },
  {
    icon: Headphones,
    title: "24×7 Customer Support",
    description: "Quick assistance whenever you need help."
  }
];

const trustBadges = [
  "Secure Platform",
  "SSL Protected",
  "Cloud Powered",
  "Telegram Verified",
  "Google Drive Storage",
  "Privacy Focused"
];

const TrustCard = memo(({ reason, index }: { reason: typeof trustReasons[0], index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="relative p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group overflow-hidden will-change-transform"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
        <reason.icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{reason.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{reason.description}</p>
    </div>
  </motion.div>
));

TrustCard.displayName = "TrustCard";

const WhyChooseUs = memo(() => {
  return (
    <section className="relative py-20 sm:py-24 px-6 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight"
          >
            🛡️ Why Millions Trust RoyShare
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Built for creators who need speed, security and reliable earnings.
          </motion.p>
        </div>

        {/* 8 Premium Trust Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {trustReasons.map((reason, index) => (
            <TrustCard key={index} reason={reason} index={index} />
          ))}
        </div>

        {/* Premium Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-8 px-6 sm:px-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-20 overflow-hidden"
        >
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60 text-sm font-bold whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                {badge}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 text-center overflow-hidden group"
        >
          <div className="absolute inset-0 bg-blue-500/10 blur-[100px] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Ready to Start Earning?</h3>
            <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of creators already using RoyShare.
            </p>
            <motion.a
              href="https://t.me/Roysharearn_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-950 font-bold text-xl rounded-2xl transition-all"
            >
              🚀 Launch Telegram Bot
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

WhyChooseUs.displayName = "WhyChooseUs";

export default WhyChooseUs;
