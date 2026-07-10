import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Target, 
  Eye, 
  ShieldCheck, 
  Zap, 
  Users, 
  Code2, 
  Globe, 
  Cpu, 
  Server, 
  Cloud, 
  Bot, 
  Layout, 
  Lock, 
  Award, 
  Link, 
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Monitor
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const values = [
  { icon: ShieldCheck, title: "Security First", description: "Your data's safety is our top priority, backed by Google's infrastructure." },
  { icon: Sparkles, title: "Innovation", description: "We constantly push boundaries to bring you the latest sharing technologies." },
  { icon: Search, title: "Transparency", description: "Clear earnings, open reports, and honest communication with our community." },
  { icon: Zap, title: "Performance", description: "Lightning-fast uploads and downloads, powered by optimized cloud nodes." },
  { icon: Users, title: "Community", description: "Building a platform that grows with and for its users every single day." }
];

const techStack = [
  { icon: Cloud, name: "Google Drive", desc: "Reliable Cloud Storage" },
  { icon: Layers, name: "Firebase", desc: "Real-time Database" },
  { icon: Bot, name: "Telegram", desc: "Powerful Bot API" },
  { icon: Code2, name: "React", desc: "Modern UI Framework" },
  { icon: Cpu, name: "Node.js", desc: "Fast Backend Engine" },
  { icon: Monitor, name: "Responsive Web", desc: "Accessible Anywhere" }
];

const whyRoyShare = [
  { icon: Lock, title: "Secure Uploads", desc: "Advanced encryption and protection for every file you share." },
  { icon: Server, title: "Cloud Storage", desc: "Infinite possibilities with enterprise-grade cloud integration." },
  { icon: Zap, title: "Fast Downloads", desc: "Zero waiting time with our high-speed global delivery network." },
  { icon: Users, title: "Creator Friendly", desc: "Tools and analytics specifically designed for modern content creators." },
  { icon: Link, title: "Smart Links", desc: "Intelligent URL protection and monetization at your fingertips." },
  { icon: CheckCircle2, title: "Reward System", desc: "Transparent and reliable earnings for your shared content." }
];

const timeline = [
  { year: "2026", title: "RoyShare Started", desc: "The beginning of a new era in secure file sharing." },
  { year: "Q2", title: "Google Drive Integration", desc: "Launching enterprise-grade storage for all users." },
  { year: "Q3", title: "Telegram Automation", desc: "Seamless file management directly via Telegram." },
  { year: "Q4", title: "Premium Dashboard", desc: "Advanced analytics and control center for creators." },
  { year: "Future", title: "Global Expansion", desc: "Bringing RoyShare to every creator across the globe." }
];

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Users className="w-3 h-3" /> Our Story
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">RoyShare</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            RoyShare is a modern cloud sharing platform that helps creators securely upload, share and manage files while providing powerful tools like Google Drive integration, Telegram automation and smart links.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
              <Target className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-slate-400 leading-relaxed">
              Help creators share files securely with speed, simplicity and reliability. We aim to remove technical barriers and provide a seamless experience for both sharers and receivers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
              <Eye className="w-7 h-7 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
            <p className="text-slate-400 leading-relaxed">
              Build one of the most trusted cloud sharing ecosystems for creators around the world. We envision a future where sharing digital content is effortless, secure, and rewarding for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-6 text-blue-400">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-3">{value.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Technology Stack</h2>
            <p className="text-slate-400">Powered by industry-leading technologies.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-300">
                  <tech.icon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="font-bold text-sm mb-1">{tech.name}</h3>
                <p className="text-slate-600 text-[10px] uppercase tracking-widest">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why RoyShare */}
      <section className="py-24 px-6 bg-slate-900/30 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why RoyShare?</h2>
            <p className="text-slate-400">The ultimate sharing experience for modern creators.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyRoyShare.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-slate-400">From a vision to a global platform.</p>
          </div>
          
          <div className="space-y-12 relative">
            <div className="absolute left-[39px] sm:left-1/2 top-4 bottom-4 w-px bg-white/10 -translate-x-1/2 hidden sm:block" />
            
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col sm:flex-row items-center gap-8 ${i % 2 === 0 ? "sm:flex-row-reverse" : ""}`}
              >
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className={`p-8 rounded-3xl bg-white/5 border border-white/10 ${i % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}>
                    <span className="text-blue-400 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">{item.year}</span>
                    <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-slate-950 border-4 border-blue-600 flex items-center justify-center relative z-10 shrink-0">
                   <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                </div>
                
                <div className="flex-1 hidden sm:block" />
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
          className="max-w-4xl mx-auto p-12 sm:p-16 rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-xl text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Join RoyShare?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Start sharing and earning with the most reliable cloud ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <ArrowRight className="w-6 h-6" />
                Start Sharing
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/support'}
              >
                <Globe className="w-6 h-6" />
                Contact Us
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(AboutPage);
