import React, { memo, useState } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  Upload, 
  Link as LinkIcon, 
  Cloud, 
  Bot, 
  DollarSign, 
  User, 
  Lock, 
  Wrench, 
  FileText, 
  ArrowRight, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  HelpCircle,
  ChevronRight,
  Send
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const categories = [
  { icon: Upload, title: "Upload Files", count: "12 Articles", color: "blue" },
  { icon: LinkIcon, title: "Smart Links", count: "8 Articles", color: "purple" },
  { icon: Cloud, title: "Google Drive", count: "10 Articles", color: "emerald" },
  { icon: Bot, title: "Telegram Bot", count: "6 Articles", color: "amber" },
  { icon: DollarSign, title: "Rewards & Earnings", count: "15 Articles", color: "blue" },
  { icon: User, title: "Account", count: "9 Articles", color: "purple" },
  { icon: Lock, title: "Privacy & Security", count: "7 Articles", color: "emerald" },
  { icon: Wrench, title: "Troubleshooting", count: "11 Articles", color: "amber" },
];

const articles = [
  { 
    icon: Upload, 
    title: "How to Upload Large Files", 
    desc: "Learn the best practices and limits for uploading high-capacity files securely.",
    category: "Uploads"
  },
  { 
    icon: Cloud, 
    title: "How to Connect Google Drive", 
    desc: "A step-by-step guide to linking your Google Drive for seamless storage.",
    category: "Integration"
  },
  { 
    icon: Bot, 
    title: "How to Use Telegram Bot", 
    desc: "Master all the commands and features of our powerful Telegram integration.",
    category: "Bot"
  },
  { 
    icon: DollarSign, 
    title: "How Rewards Work", 
    desc: "Everything you need to know about our monetization and reward system.",
    category: "Earnings"
  },
  { 
    icon: LinkIcon, 
    title: "How Smart Links Work", 
    desc: "Optimize your traffic and earnings using our intelligent link shortening technology.",
    category: "Links"
  },
  { 
    icon: DollarSign, 
    title: "How to Withdraw Rewards", 
    desc: "Detailed instructions on minimum thresholds and payment processing times.",
    category: "Earnings"
  },
  { 
    icon: MessageSquare, 
    title: "How to Report a Problem", 
    desc: "Quickly reach our support team and track your ticket status effectively.",
    category: "Support"
  },
  { 
    icon: Lock, 
    title: "Account Safety Tips", 
    desc: "Best practices to keep your RoyShare account and data protected.",
    category: "Security"
  }
];

const quickActions = [
  { icon: MessageSquare, title: "Contact Support", desc: "Get help from our team", href: "/contact" },
  { icon: Bug, title: "Report a Bug", desc: "Help us improve RoyShare", href: "/contact" },
  { icon: Lightbulb, title: "Request a Feature", desc: "Share your ideas with us", href: "/contact" },
  { icon: HelpCircle, title: "View FAQ", desc: "Quick answers to common questions", href: "/faq" },
];

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const colorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Header & Search */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <HelpCircle className="w-3 h-3" /> Knowledge Base
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Help <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Center</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Find answers, guides and tutorials to use RoyShare effectively. We're here to support your growth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto relative group"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center p-2 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl group-focus-within:border-blue-500/50 transition-all">
              <div className="pl-6 text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Search help articles..." 
                className="w-full bg-transparent border-none focus:ring-0 px-6 py-4 text-lg text-white placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="hidden sm:flex px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-[1.5rem] transition-all shadow-lg shadow-blue-600/20">
                Search
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Categories</h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border shadow-lg group-hover:scale-110 transition-transform ${colorMap[category.color]}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
                <div className="flex items-center justify-between text-slate-500 text-sm">
                  <span>{category.count}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight">Popular Articles</h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group flex items-start gap-6 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-all">
                  <article.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{article.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{article.desc}</p>
                  <div className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Read More <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, i) => (
              <motion.a
                key={i}
                href={action.href}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto border border-white/10 group-hover:scale-110 transition-transform">
                  <action.icon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{action.title}</h3>
                <p className="text-slate-500 text-xs">{action.desc}</p>
              </motion.a>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Still need help?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Our support team is always ready to assist you. Whether it's a technical issue or a general question, we're just a message away.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/contact"
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-blue-500 hover:scale-105"
              >
                <MessageSquare className="w-6 h-6" />
                Contact Support
              </a>
              <a
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-white/10 hover:scale-105"
              >
                <Send className="w-6 h-6" />
                Telegram Support
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(HelpCenterPage);
