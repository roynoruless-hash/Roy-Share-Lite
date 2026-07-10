import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  History, 
  CheckCircle2, 
  Zap, 
  Smartphone, 
  Layout, 
  Wallet, 
  Layers, 
  Sparkles, 
  Star, 
  Lightbulb, 
  Check, 
  TrendingUp,
  Package,
  Clock
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const changelogData = [
  {
    version: "1.0.0",
    status: "Latest Release",
    color: "emerald",
    added: [
      "Google Drive Integration",
      "Telegram Integration",
      "Large File Upload",
      "Smart Links",
      "Premium Homepage",
      "Dashboard",
      "Help Center",
      "Legal Pages"
    ],
    fixes: [
      "Upload stability improved",
      "Better mobile responsiveness",
      "Faster loading speed",
      "Improved animations",
      "Fixed Google Drive upload issues",
      "Better Telegram notifications"
    ],
    improvements: [
      "Better UI",
      "Better Security",
      "Better Performance",
      "Better Navigation"
    ]
  }
];

const nextFeatures = [
  { icon: Smartphone, title: "Android App", desc: "Native experience for Android users." },
  { icon: Layout, title: "Better Dashboard", desc: "Advanced analytics and insights." },
  { icon: Wallet, title: "Wallet Upgrade", desc: "Multiple withdrawal methods." },
  { icon: Layers, title: "PWA Support", desc: "Install RoyShare on any device." },
  { icon: Sparkles, title: "AI Features", desc: "Smart file categorization & optimization." },
];

const ChangelogPage = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <History className="w-3 h-3" /> Product Updates
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Change<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">log</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Track every improvement, feature and fix released on RoyShare. We are building the future of file sharing together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-6 px-8 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Version</span>
              <span className="text-xl font-bold text-white">v1.0.0</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Updated</span>
              <span className="text-xl font-bold text-white">{currentDate}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Changelog Timeline */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {changelogData.map((log, i) => (
            <motion.div
              key={log.version}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative pl-8 pb-16 last:pb-0"
            >
              {/* Timeline Connector */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 to-transparent" />
              <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

              <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-500">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Package className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Version {log.version}</h2>
                      <p className="text-slate-500 text-sm font-medium">{currentDate}</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {log.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Added */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                      Added
                    </h3>
                    <ul className="space-y-4">
                      {log.added.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 group">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500/50 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-slate-400 group-hover:text-white transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-10">
                    {/* Fixes */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                        Fixes
                      </h3>
                      <ul className="space-y-3">
                        {log.fixes.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 group">
                            <Check className="w-4 h-4 text-blue-500/50 mt-1 group-hover:text-blue-500 transition-colors" />
                            <span className="text-slate-500 text-sm group-hover:text-slate-300 transition-colors">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-purple-500 rounded-full" />
                        Improvements
                      </h3>
                      <ul className="space-y-3">
                        {log.improvements.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 group">
                            <Zap className="w-4 h-4 text-purple-500/50 mt-1 group-hover:text-purple-500 transition-colors" />
                            <span className="text-slate-500 text-sm group-hover:text-slate-300 transition-colors">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Coming Next */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400" /> Coming Next
            </h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {nextFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 mx-auto border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto p-12 sm:p-16 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Enjoying RoyShare?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Your feedback drives our development. Help us shape the future of file sharing by sharing your thoughts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/contact'}
              >
                <Star className="w-6 h-6" />
                Send Feedback
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/contact'}
              >
                <Lightbulb className="w-6 h-6" />
                Suggest Feature
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(ChangelogPage);
