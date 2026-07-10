import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Cloud, 
  Send, 
  Link2, 
  Wallet, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Zap, 
  ArrowRight 
} from "lucide-react";

const features = [
  { 
    icon: Cloud, 
    title: "Google Drive Cloud Storage", 
    description: "Store files securely with unlimited scalability.",
    href: "/features/google-drive"
  },
  { 
    icon: Send, 
    title: "Telegram Bot Integration", 
    description: "Manage uploads directly from Telegram.",
    href: "/features/telegram-bot"
  },
  { 
    icon: Link2, 
    title: "Smart URL Shortener", 
    description: "Create monetized smart links with multi-step verification.",
    href: "/features/smart-links"
  },
  { 
    icon: Wallet, 
    title: "Reward Earnings", 
    description: "Earn from downloads and shortened links.",
    href: "/features/reward-earnings"
  },
  { 
    icon: BarChart3, 
    title: "Real-Time Analytics", 
    description: "Track downloads, clicks, earnings and performance.",
    href: "/features/analytics"
  },
  { 
    icon: Users, 
    title: "Referral Program", 
    description: "Invite friends and earn commission on their activity.",
    href: "/features/referral"
  },
  { 
    icon: ShieldCheck, 
    title: "Enterprise Security", 
    description: "Encrypted storage and secure download system.",
    href: "/features/security"
  },
  { 
    icon: Zap, 
    title: "Fast Global Delivery", 
    description: "High-speed downloads with optimized infrastructure.",
    href: "/features/delivery"
  },
];

const FeatureCard = memo(({ feature, index }: { feature: typeof features[0], index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
    className="relative p-8 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden group transition-all duration-300 will-change-transform"
  >
    {/* Subtle gradient background on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <feature.icon className="w-7 h-7 text-blue-400 group-hover:text-blue-300" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
      <p className="text-slate-400 leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
        {feature.description}
      </p>
      
      <a 
        href={feature.href || "#"}
        className="flex items-center gap-2 text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors uppercase tracking-wider"
      >
        Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  </motion.div>
));

FeatureCard.displayName = "FeatureCard";

const Features = memo(() => {
  return (
    <section id="features" className="relative py-20 sm:py-24 px-6 bg-slate-950 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4"
          >
            Capabilities
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white tracking-tight"
          >
            Everything you need to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              scale your sharing.
            </span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});

Features.displayName = "Features";

export default Features;
