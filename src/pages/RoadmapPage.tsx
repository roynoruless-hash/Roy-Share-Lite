import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Map, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Lightbulb, 
  Rocket, 
  MessageSquare, 
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Globe,
  Layout,
  Cpu,
  Share2,
  Smartphone,
  Layers,
  Settings,
  Bell,
  Search,
  Monitor,
  Users,
  Code,
  Sparkles,
  Briefcase
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const phases = [
  {
    id: 1,
    title: "Phase 1: Foundation",
    status: "Completed",
    color: "emerald",
    icon: CheckCircle2,
    items: [
      { text: "Telegram Login", icon: Zap },
      { text: "Google Drive Integration", icon: Globe },
      { text: "Large File Upload", icon: Rocket },
      { text: "Smart Links", icon: Share2 },
      { text: "Premium Homepage", icon: Layout },
      { text: "Legal Pages", icon: Shield }
    ]
  },
  {
    id: 2,
    title: "Phase 2: Growth",
    status: "In Progress",
    color: "amber",
    icon: Clock,
    items: [
      { text: "Wallet Improvements", icon: Settings },
      { text: "Better Dashboard", icon: Layout },
      { text: "Referral Enhancements", icon: Users },
      { text: "Faster Upload Engine", icon: Zap },
      { text: "Better Analytics", icon: Activity }
    ]
  },
  {
    id: 3,
    title: "Phase 3: Expansion",
    status: "Planned",
    color: "blue",
    icon: Circle,
    items: [
      { text: "Android App", icon: Smartphone },
      { text: "PWA Support", icon: Layers },
      { text: "Dark/Light Theme", icon: Layout },
      { text: "Multi-language Support", icon: Globe },
      { text: "Notification Center", icon: Bell },
      { text: "Better Search", icon: Search }
    ]
  },
  {
    id: 4,
    title: "Phase 4: Future",
    status: "Future",
    color: "slate",
    icon: Circle,
    items: [
      { text: "Desktop Application", icon: Monitor },
      { text: "Team Workspaces", icon: Users },
      { text: "Public API", icon: Code },
      { text: "Developer SDK", icon: Code },
      { text: "AI File Assistant", icon: Sparkles },
      { text: "Enterprise Features", icon: Briefcase }
    ]
  }
];

const RoadmapPage = () => {
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
            <Map className="w-3 h-3" /> Product Evolution
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            RoyShare <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Roadmap</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Follow our journey and see what's coming next. We are constantly innovating to build the ultimate file sharing and rewards platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 text-sm font-bold uppercase tracking-widest"
          >
            Last Updated: {currentDate}
          </motion.div>
        </div>
      </section>

      {/* Vertical Timeline */}
      <section className="py-12 px-6 relative">
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent hidden md:block" />
          
          <div className="space-y-12">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className="flex-1 w-full">
                  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 relative group">
                    <div className={`absolute top-6 ${i % 2 === 0 ? '-right-3' : '-left-3'} hidden md:block`}>
                      <div className={`w-6 h-6 rotate-45 bg-white/5 border-t border-l border-white/10 ${i % 2 === 0 ? 'border-t border-r' : 'border-t border-l'}`} />
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white tracking-tight">{phase.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        phase.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        phase.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        phase.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {phase.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {phase.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-3 text-slate-400 text-sm group/item">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-white/10 transition-colors">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="group-hover/item:text-white transition-colors">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center Node */}
                <div className="relative z-10 hidden md:block">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
                    phase.color === 'emerald' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                    phase.color === 'amber' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                    phase.color === 'blue' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                    'bg-slate-500/20 border-slate-500/30 text-slate-400'
                  }`}>
                    <phase.icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Empty Space for layout */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Request */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-white/10 backdrop-blur-xl relative overflow-hidden group text-center"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <Lightbulb className="w-40 h-40 text-blue-400" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                <Lightbulb className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Have an idea?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                We'd love to hear your suggestions. Many of our best features come directly from our community's feedback.
              </p>
              <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-[2rem] hover:bg-white/10 transition-all flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Suggest a Feature
              </button>
            </div>
          </motion.div>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Help us build the future of RoyShare.</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Start sharing and earning today. Join thousands of creators who trust RoyShare for their file management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Rocket className="w-6 h-6" />
                Start Sharing
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/contact'}
              >
                <MessageSquare className="w-6 h-6" />
                Contact Support
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(RoadmapPage);
