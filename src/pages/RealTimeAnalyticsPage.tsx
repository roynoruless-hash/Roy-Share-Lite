import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  BarChart3, 
  Globe, 
  Smartphone, 
  Laptop, 
  Clock, 
  MousePointer2, 
  Users, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  ArrowRight,
  Monitor,
  Zap,
  Activity,
  CheckCircle2,
  PieChart,
  DollarSign
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const RealTimeAnalyticsPage = () => {
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
            <Activity className="w-3 h-3" /> Live Data Insights
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Analytics</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            Make data-driven decisions with RoyShare's advanced tracking engine. Monitor every click, download, and reward in real-time with millisecond precision, giving you complete visibility into your content performance.
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
              className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              Start Tracking Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is Real-Time Analytics? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Instant Visibility into <span className="text-blue-400">Every Interaction</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  Real-time analytics is the heartbeat of the RoyShare platform. It represents our commitment to providing creators with immediate, actionable data regarding their shared content. The moment a user clicks on one of your smart links, our system begins processing that event, attributing it to your account, and displaying the results on your dashboard.
                </p>
                <p>
                  In the fast-paced world of digital content sharing, waiting 24 hours for a report is no longer acceptable. RoyShare's architecture is optimized for low latency, ensuring that the statistics you see are as fresh as the traffic you're generating. This allows you to test different sharing strategies, monitor the viral growth of a file, and adjust your campaigns on the fly.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] bg-blue-500/5 border border-blue-500/10 flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-[100px] group-hover:blur-[80px] transition-all" />
              <BarChart3 className="w-48 h-48 text-blue-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-blue-500/30 shadow-2xl flex flex-col items-center gap-4">
                  <Activity className="w-16 h-16 text-blue-400 animate-pulse" />
                  <span className="text-white font-bold tracking-tight uppercase text-xs">Live Feed Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. What data is tracked? */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Comprehensive Data <span className="text-blue-400">Coverage</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We track dozens of data points for every visitor to give you a 360-degree view of your audience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MousePointer2, title: "Total Clicks", desc: "Total volume of attempts to access your smart links." },
              { icon: Users, title: "Unique Visitors", desc: "Unique users identified by our advanced fingerprinting." },
              { icon: Download, title: "Downloads", desc: "Successful file deliveries after verification." },
              { icon: TrendingUp, title: "Reward Earnings", desc: "Live calculation of your accrued revenue." },
              { icon: Clock, title: "Pending Rewards", desc: "Rewards currently undergoing final validation." },
              { icon: CheckCircle2, title: "Approved Rewards", desc: "Funds ready for withdrawal to your wallet." },
              { icon: Globe, title: "Countries", desc: "Geographic distribution of your traffic." },
              { icon: Smartphone, title: "Devices", desc: "Detection of Android, iPhone, Windows, and Mac." },
              { icon: Search, title: "Browser & OS", desc: "Technical breakdown of visitor environments." },
              { icon: Activity, title: "Link Performance", desc: "Comparison of conversion rates across links." },
              { icon: PieChart, title: "Top Performing", desc: "Identify which files are driving the most revenue." },
              { icon: Zap, title: "Date & Time", desc: "Precise timestamps for every single event." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-slate-950 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                  <item.icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How does it work? */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-1 p-px rounded-[3rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-2xl"
            >
              <div className="bg-slate-950 rounded-[3rem] p-10">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-blue-400" /> Seamless Integration
                </h3>
                <div className="space-y-8">
                  {[
                    { step: "01", title: "Smart Link Request", desc: "The visitor clicks your link, which points to RoyShare's edge servers." },
                    { step: "02", title: "Event Capture", desc: "Our system instantly logs IP, User Agent, Referrer, and custom tracking IDs." },
                    { step: "03", title: "Real-Time Processing", desc: "Data is streamed through our processing pipeline to update your dashboard." },
                    { step: "04", title: "Secure Redirect", desc: "After logging, the visitor is instantly moved to the file download page." },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <span className="text-4xl font-black text-white/5 group-hover:text-blue-500/20 transition-colors font-mono">{step.step}</span>
                      <div>
                        <h4 className="text-white font-bold mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                      </div>
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">Zero Configuration <br /><span className="text-blue-400">Maximum Impact</span></h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  You don't need to install any tracking pixels, complex SDKs, or third-party plugins. RoyShare's analytics are baked directly into the smart link architecture. This means your tracking works universally across all platforms—whether someone clicks from Telegram, a mobile app, or a desktop browser.
                </p>
                <p>
                  Every visit to a RoyShare Smart Link is securely processed through our tracking system before redirecting the visitor to the destination file. This ensures 100% data capture without adding perceptible latency to the user's download experience.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Why Real-Time Analytics is Important? */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Why Data <span className="text-blue-400">Matters</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Understanding your traffic is the first step toward increasing your earnings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Optimize Distribution", desc: "Discover which social platforms or groups are driving the highest quality downloads and double down on them.", icon: Globe },
              { title: "Monitor Growth", desc: "Watch in real-time as your content goes viral, allowing you to react quickly to trending files.", icon: TrendingUp },
              { title: "Fraud Protection", desc: "Instant feedback on traffic quality helps you avoid wasting time on low-yield distribution methods.", icon: ShieldCheck },
              { title: "Calculate ROI", desc: "Understand exactly how much each link is worth, helping you budget your time and promotion efforts.", icon: DollarSign },
              { icon: Zap, title: "A/B Testing", desc: "Compare different file titles or sharing descriptions to see which converts better immediately." },
              { icon: Search, title: "Audience Profiling", desc: "Identify your core demographic's preferred devices and operating systems to tailor your content." },
            ].map((benefit, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-blue-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                  <benefit.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{benefit.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 sm:p-16 rounded-[4rem] bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-white/10 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-8" />
              <h2 className="text-3xl font-bold text-white mb-6">Built for Professionals</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-0 italic">
                "Our analytics engine is designed to handle millions of events per second, ensuring that no matter how fast your traffic grows, your RoyShare dashboard will always keep up. We provide the professional tools you need to manage your sharing business with absolute confidence."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to see your data live?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Get access to RoyShare's powerful analytics dashboard through our Telegram bot.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                🚀 Open Dashboard
              </a>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                📩 Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
};

export default memo(RealTimeAnalyticsPage);
