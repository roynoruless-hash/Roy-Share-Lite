import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Link2, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Lock, 
  MousePointer2, 
  FileCheck, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  Workflow, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Eye,
  RefreshCw,
  Search,
  Layout,
  Layers,
  Fingerprint,
  Activity,
  Code2,
  Briefcase,
  Cloud,
  Star,
  ChevronDown
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const MobileComparisonCard = ({ row }: { row: { f: string; n: string; s: string } }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <span className="text-blue-400 font-bold text-lg">{row.f}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-500" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6 space-y-3">
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Normal Download Link</div>
                <div className="text-sm text-slate-400">❌ {row.n}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">RoyShare Smart Link</div>
                <div className="text-sm text-emerald-300 font-bold">✅ {row.s}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SmartLinkFeaturePage = () => {
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
            <Link2 className="w-3 h-3" /> Distribution Engine
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Smart URL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Shortener</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            RoyShare's Smart Link technology transforms standard file-sharing into a high-performance distribution channel. We provide the intelligence behind every click, ensuring secure delivery, real-time analytics, and maximum monetization.
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
              Start Generating
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is Smart URL Shortener? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Beyond Just a <span className="text-blue-400">Shortened Link</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  A Smart URL Shortener is an advanced redirection service that does more than just trim a long web address. At RoyShare, it acts as a dynamic gateway between your Google Drive content and the end user. It provides a multi-layered verification process that ensures every download is valid, secure, and properly attributed.
                </p>
                <p>
                  Our Smart Links are built on a robust backend architecture that handles millions of requests with millisecond latency. They are designed to protect your source files while providing a seamless, branded experience for your audience.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group shadow-2xl"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-[100px]" />
              <Link2 className="w-48 h-48 text-blue-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-2xl">
                  <span className="text-blue-400 font-mono text-sm tracking-tighter italic">royshare.link/premium-content</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Why RoyShare uses Smart Links */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Need for Intelligence</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Standard download links are static and vulnerable. RoyShare's Smart Links provide the dynamic control required for professional distribution.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Monetization Control", desc: "Every Smart Link is a revenue generator. We verify downloads before awarding rewards to prevent fraud.", icon: TrendingUp },
              { title: "Analytics Depth", desc: "Track everything from geographic location to device type and referral sources in real-time.", icon: BarChart3 },
              { title: "Security Layer", desc: "Hide your direct Google Drive path and protect your account from malicious scraping and bot attacks.", icon: ShieldCheck },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Comparison Table */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Standard Link vs. Smart Link</h2>
            <p className="text-slate-500">Why thousands of creators are switching to RoyShare's infrastructure.</p>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-6 text-white font-bold border-b border-white/10">Feature</th>
                  <th className="p-6 text-slate-500 font-bold border-b border-white/10">Normal Download Link</th>
                  <th className="p-6 text-blue-400 font-bold border-b border-white/10">RoyShare Smart Link</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { f: "Security", n: "Low (Exposes ID)", s: "High (Encrypted Route)" },
                  { f: "Analytics", n: "None", s: "Advanced Real-time" },
                  { f: "Monetization", n: "No", s: "Built-in Rewards" },
                  { f: "Bot Protection", n: "None", s: "AI-Powered Filtering" },
                  { f: "Device Targeting", n: "Static", s: "Responsive Routing" },
                  { f: "Anti-Spam", n: "No", s: "Multi-step Verification" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 text-white font-medium border-b border-white/10">{row.f}</td>
                    <td className="p-6 text-slate-500 border-b border-white/10">{row.n}</td>
                    <td className="p-6 text-blue-300 font-bold border-b border-white/10">{row.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {[
              { f: "Security", n: "Low (Exposes ID)", s: "High (Encrypted Route)" },
              { f: "Analytics", n: "None", s: "Advanced Real-time" },
              { f: "Monetization", n: "No", s: "Built-in Rewards" },
              { f: "Bot Protection", n: "None", s: "AI-Powered Filtering" },
              { f: "Device Targeting", n: "Static", s: "Responsive Routing" },
              { f: "Anti-Spam", n: "No", s: "Multi-step Verification" },
            ].map((row, i) => (
              <MobileComparisonCard key={i} row={row} />
            ))}
          </div>
        </div>
      </section>

      {/* 4-5. Complete Process Workflow */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Smart Lifecycle</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A seamless transition from raw file to revenue-generating asset.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector Line for Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "Cloud Integration", desc: "Upload your file to Google Drive. Our API detects the file and prepares the secure bridge.", icon: Cloud },
              { step: "02", stepTitle: "Tokenization", desc: "RoyShare generates a unique encrypted token for the file, creating your branded short link.", icon: Fingerprint },
              { step: "03", title: "Distribution", desc: "You share your link. Our Smart Router handles every incoming request across global servers.", icon: Zap },
              { step: "04", title: "Verification", desc: "Visitors pass through our secure bridge. Valid downloads are counted and rewards are awarded.", icon: FileCheck },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7" />
                </div>
                <span className="text-xs font-black text-blue-500/40 uppercase tracking-[0.2em] mb-4 block">Step {item.step}</span>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{item.title || item.stepTitle}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6-12. Deep Dive: Analytics, Tracking, and Earnings */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1 p-10 rounded-[4rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Activity className="w-6 h-6 text-blue-400" /> Real-time Analytics
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                    LIVE
                  </div>
                </div>
                
                {/* Mock Analytics UI */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Clicks</p>
                      <p className="text-2xl font-bold text-white tracking-tight">12,842</p>
                    </div>
                    <MousePointer2 className="w-8 h-8 text-blue-500/30" />
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Valid Downloads</p>
                      <p className="text-2xl font-bold text-emerald-400 tracking-tight">9,654</p>
                    </div>
                    <FileCheck className="w-8 h-8 text-emerald-500/30" />
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Estimated Earnings</p>
                      <p className="text-2xl font-bold text-purple-400 tracking-tight">$342.50</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500/30" />
                  </div>
                </div>
                
                <p className="text-slate-500 text-xs text-center italic">
                  *Analytics dashboard preview. Real-time data syncs every 60 seconds.
                </p>
              </div>
            </motion.div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Precision Tracking <span className="text-blue-400">& Earnings</span></h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  RoyShare uses a proprietary algorithm to calculate valid downloads. We track every incoming request to ensure it meets our quality standards before awarding revenue. This includes geographic verification, device integrity checks, and unique IP filtering.
                </p>
                <p>
                  Our earnings calculation is transparent and competitive. We provide different tiers based on traffic quality and volume, allowing creators to maximize their revenue from every share. With Smart Links, you're not just distributing files; you're operating a data-driven business.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div className="flex gap-4">
                    <Globe className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Geo-Location</h4>
                      <p className="text-sm">Revenue varies by country tiers.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Fingerprint className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Unique Users</h4>
                      <p className="text-sm">We count unique visitors daily.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13-17. Security, Anti-Spam & Anti-Bot */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
            >
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Fortified Link Protection</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Smart Links are the first line of defense for your content. We employ enterprise-grade security to filter malicious traffic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Anti-Bot Filtering", desc: "AI models analyze behavioral patterns to detect and block automated scrapers.", icon: Cpu },
              { title: "Anti-Spam Shield", desc: "Rate limiting and pattern detection prevent malicious link flooding.", icon: ShieldCheck },
              { title: "Invalid Traffic Detection", desc: "Identify and filter low-quality traffic, proxies, and VPNs automatically.", icon: Search },
              { title: "Abuse Prevention", desc: "Automated systems monitor link content to ensure compliance with our policies.", icon: Lock },
            ].map((card, i) => (
              <div key={i} className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-blue-400 transition-colors">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 18-22. Benefits & SEO */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { title: "For Creators", desc: "Turn your passion into profit. Track your audience growth and optimize your content strategy.", icon: Star },
              { title: "For Developers", desc: "Integrate Smart Link generation into your apps via our upcoming API and webhooks.", icon: Code2 },
              { title: "For Businesses", desc: "Distribute marketing assets with full visibility and secure cloud infrastructure.", icon: Briefcase },
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-10 rounded-[3rem] bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/10 text-center">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Search className="w-6 h-6 text-blue-400" /> SEO Advantage
            </h3>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
              Branded Smart Links are more than just short URLs. They create an organized structure for your content that search engines can better understand, improving your overall online visibility and trust score.
            </p>
          </div>
        </div>
      </section>

      {/* 23. FAQ */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about Smart Links.</p>
          </div>
          <div className="space-y-6">
            {[
              { q: "Does RoyShare modify my original Google Drive file?", a: "Never. RoyShare acts solely as a secure gateway. Your original file remains untouched and unmodified inside your personal Google Drive account." },
              { q: "What is the difference between a direct link and a Smart Link?", a: "A direct Google Drive link is static and provides no analytics or monetization. A Smart Link adds a layer of security, verification, and real-time tracking while keeping your storage private." },
              { q: "How are earnings calculated?", a: "Earnings are based on the number of valid, unique downloads verified through our Smart Link bridge. Rates vary depending on the visitor's country and device quality." },
              { q: "Can I use Smart Links for any type of file?", a: "Yes, as long as the file is hosted on your Google Drive and complies with our Terms of Service. We support everything from documents to large media files." },
              { q: "Are Smart Links mobile-friendly?", a: "Absolutely. Our Smart Links are fully responsive and optimized for every device type, ensuring a smooth experience for mobile, tablet, and desktop users." },
              { q: "What happens if my link is flagged for abuse?", a: "Our automated systems monitor for violations of our Acceptable Use Policy. If a link is flagged, it will be temporarily suspended pending human review to protect the integrity of the network." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-400" /> {faq.q}
                </h4>
                <p className="text-slate-400 leading-relaxed text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges & Best Practices (24) */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex flex-wrap justify-center gap-12 opacity-40 hover:opacity-100 transition-opacity duration-500 mb-20">
            <div className="flex items-center gap-2 text-white font-bold tracking-tighter">
              <ShieldCheck className="w-8 h-8" /> SECURE BRIDGE
            </div>
            <div className="flex items-center gap-2 text-white font-bold tracking-tighter">
              <Activity className="w-8 h-8" /> REAL-TIME SYNC
            </div>
            <div className="flex items-center gap-2 text-white font-bold tracking-tighter">
              <Lock className="w-8 h-8" /> ZERO DATA EXPOSURE
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto p-12 rounded-[4rem] bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-2xl font-bold text-white mb-8">Professional Recommendations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
              {[
                "Use descriptive names for your links to increase click-through rates.",
                "Avoid sharing raw Google Drive IDs directly in public spaces.",
                "Monitor your analytics daily to understand your audience behavior.",
                "Regularly audit your link performance and remove inactive links."
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final Conclusion & Bottom CTA (25) */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to activate Smart Sharing?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Join the future of monetized distribution. Start generating intelligent links in seconds.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Start Sharing Now
              </a>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
};

export default memo(SmartLinkFeaturePage);
