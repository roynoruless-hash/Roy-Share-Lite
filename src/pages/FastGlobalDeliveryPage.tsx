import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Zap, 
  Globe, 
  Cloud, 
  Bot, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Server, 
  Cpu, 
  Activity, 
  Timer, 
  Signal, 
  Wind, 
  FastForward, 
  MousePointer2, 
  Download, 
  BarChart3, 
  Workflow
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const FastGlobalDeliveryPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Zap className="w-3 h-3" /> High-Performance Infrastructure
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Fast Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Delivery</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            Speed is the ultimate user experience. RoyShare utilizes a distributed global network and direct API integrations with Google Drive to ensure that your files are delivered to your audience at lightning speed, regardless of their location on the globe.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="https://t.me/Roysharearn_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              Start Sharing Fast
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is Fast Global Delivery? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Designed for <span className="text-amber-400">Zero Wait Time</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  Fast Global Delivery is the core philosophy behind RoyShare's technical architecture. We understand that in the digital age, even a few seconds of delay can lead to visitor frustration and lost revenue. That's why we've built our link generation and verification systems to be the fastest in the industry.
                </p>
                <p>
                  By leveraging Google's world-class data centers and our own high-speed edge nodes, we bridge the gap between your storage and your audience. Whether your visitor is in New York, London, Mumbai, or Tokyo, they will experience a consistent, reliable, and high-speed download flow that reflects professionally on your brand as a creator.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] bg-amber-500/5 border border-amber-500/10 flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-amber-500/5 blur-[100px] group-hover:blur-[80px] transition-all" />
              <Wind className="w-48 h-48 text-amber-500/20 group-hover:translate-x-10 group-hover:-translate-y-5 transition-transform duration-1000" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col items-center gap-4">
                  <FastForward className="w-16 h-16 text-amber-400 animate-pulse" />
                  <span className="text-white font-bold tracking-tight uppercase text-xs text-center">Lightning Flow <br /> Enabled</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. How RoyShare Delivers Files */}
      <section className="py-24 px-6 bg-slate-900/30 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">The Delivery <span className="text-amber-400">Pipeline</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Every file travels through a highly optimized four-stage verification and delivery process.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              { step: "01", title: "API Link Generation", desc: "Instantly create a smart link using Google Drive APIs without moving the file.", icon: Cloud },
              { step: "02", title: "Edge Processing", desc: "Visitor requests are handled by the server node closest to their location.", icon: Server },
              { step: "03", title: "High-Speed Verify", desc: "Automated security and reward checks performed in milliseconds.", icon: ShieldCheck },
              { step: "04", title: "Direct Transfer", desc: "Visitor is securely handed off to the high-bandwidth Google delivery node.", icon: Zap },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 p-10 rounded-[3rem] bg-slate-950 border border-white/5 hover:border-amber-500/30 transition-all group overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-8 text-white/5 font-black text-6xl group-hover:text-amber-500/10 transition-colors">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-8 text-amber-400 group-hover:scale-110 transition-transform">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Global Infrastructure */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[4rem] bg-slate-900 border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-600/5 blur-[100px] pointer-events-none" />
              <Globe className="w-64 h-64 text-amber-500/5 mb-8 animate-spin-slow" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <div className="grid grid-cols-2 gap-8">
                  {[
                    { label: "PoPs", value: "200+", desc: "Points of Presence" },
                    { label: "Uptime", value: "99.99%", desc: "SLA Guaranteed" },
                    { label: "Latency", value: "< 20ms", desc: "Edge Response" },
                    { label: "Nodes", value: "Global", desc: "Distribution" },
                  ].map((stat, i) => (
                    <div key={i} className="group">
                      <div className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">{stat.value}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Distributed <span className="text-amber-400">Node Network</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  To ensure fast delivery, we've deployed a custom layer of "Smart Nodes" across the most popular geographic regions. These nodes act as traffic controllers, intelligently routing each visitor to the most efficient delivery path available.
                </p>
                <p>
                  Our partnership with Google allows us to utilize their Tier-1 network backbone. This means your files travel over dedicated fiber optic cables rather than the congested public internet, resulting in lower packet loss, reduced jitter, and significantly faster download initialization.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4-6. Performance Features */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Speed <span className="text-amber-400">Optimizations</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Advanced technical features that make RoyShare the fastest sharing platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Anycast Routing", desc: "Automatically routes visitors to the nearest physical server, reducing round-trip latency.", icon: Signal },
              { title: "Direct Cloud Fetch", desc: "Files are streamed directly from Google's high-speed storage without intermediate caching delays.", icon: Cloud },
              { title: "Edge Verification", desc: "Reward and security checks are processed at the network edge, near the user.", icon: Cpu },
              { title: "Smart Redirection", desc: "Intelligent hand-off between RoyShare and Google Drive ensures zero idle time.", icon: Workflow },
              { title: "Optimized Payloads", desc: "Minimal header sizes and compressed data transfer for ultra-fast link loading.", icon: Zap },
              { title: "Real-Time Monitoring", desc: "Continuous performance tracking to identify and bypass regional network bottlenecks.", icon: Activity },
            ].map((benefit, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-amber-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
                  <benefit.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{benefit.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Benefits of Fast Delivery */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 sm:p-16 rounded-[4rem] bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-white/10 backdrop-blur-xl relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <Timer className="w-16 h-16 text-amber-400 mx-auto mb-8" />
              <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Speed Drives Success</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                Fast delivery isn't just a technical achievement; it's a financial one. Data shows that visitors who experience fast download times are 30% more likely to return to your links and complete the verification process. By prioritizing speed, RoyShare directly helps you increase your conversion rates and total rewards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { icon: Download, text: "Higher Completion" },
                  { icon: MousePointer2, text: "Lower Bounce Rates" },
                  { icon: BarChart3, text: "Increased Revenue" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <item.icon className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-amber-500 to-orange-600 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Experience the speed today.</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Join the fastest global delivery network for file sharing and start earning with RoyShare.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-amber-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                🚀 Start Sharing Now
              </a>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                📩 View Network Status
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
};

export default memo(FastGlobalDeliveryPage);
