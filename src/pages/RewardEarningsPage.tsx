import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  PieChart, 
  ArrowDownCircle, 
  History, 
  Info, 
  ShieldAlert, 
  Filter, 
  Users, 
  Bot, 
  Lock, 
  Search, 
  HelpCircle,
  Award,
  DollarSign,
  BarChart3,
  Globe
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const MobileComparisonCard = ({ row }: { row: { f: string; n: string; s: string } }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <span className="text-emerald-400 font-bold text-lg">{row.f}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRight className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </motion.div>
      </button>
      
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
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
    </div>
  );
};

const RewardEarningsPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Wallet className="w-3 h-3" /> Monetization Platform
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            RoyShare <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Reward Earnings</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            Transform your content sharing into a sustainable income stream. RoyShare's sophisticated reward engine ensures that every genuine interaction with your files is fairly compensated, backed by transparent analytics and secure payouts.
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
              className="w-full sm:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              Start Earning
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is RoyShare Reward Earnings? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                A Fair Ecosystem for <span className="text-emerald-400">Content Creators</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  RoyShare Reward Earnings is a comprehensive monetization framework designed to reward creators for the value they bring to their audience. Unlike traditional hosting services that charge you for storage, we utilize your own Google Drive and provide a layer of distribution that generates revenue for every valid download your files receive.
                </p>
                <p>
                  Our system is built on transparency and integrity. We don't just "give" money; we facilitate a reward-sharing model where high-quality traffic is the primary currency. By leveraging smart link technology, we can accurately track, verify, and compensate you for the downloads you facilitate across the global web.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] group-hover:blur-[80px] transition-all" />
              <Wallet className="w-48 h-48 text-emerald-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-emerald-500/30 shadow-2xl flex flex-col items-center gap-4">
                  <Award className="w-16 h-16 text-emerald-400" />
                  <span className="text-white font-bold tracking-tight">Verified Rewards</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">The RoyShare Advantage</h2>
            <p className="text-slate-500">How our reward engine outperforms traditional file sharing.</p>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-8 text-white font-bold border-b border-white/10">Earning Potential</th>
                  <th className="p-8 text-slate-500 font-bold border-b border-white/10">Normal Download Link</th>
                  <th className="p-8 text-emerald-400 font-bold border-b border-white/10">RoyShare Smart Link</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { f: "Monetization", n: "Zero (No rewards)", s: "High (PPS & PPD Model)" },
                  { f: "Verification", n: "None (Prone to bots)", s: "Multi-layered Anti-bot" },
                  { f: "Traffic Quality", n: "Unfiltered", s: "Verified Unique Users" },
                  { f: "Geo-Tiering", n: "N/A", s: "Custom Rates by Region" },
                  { f: "Analytics", n: "Basic / None", s: "Real-time Reward Tracking" },
                  { f: "Payouts", n: "N/A", s: "Fast & Secure Withdrawals" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                    <td className="p-8 text-white font-medium">{row.f}</td>
                    <td className="p-8 text-slate-500">❌ {row.n}</td>
                    <td className="p-8 text-emerald-300 font-bold">✅ {row.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="md:hidden space-y-4">
            {[
              { f: "Monetization", n: "Zero (No rewards)", s: "High (PPS & PPD Model)" },
              { f: "Verification", n: "None (Prone to bots)", s: "Multi-layered Anti-bot" },
              { f: "Traffic Quality", n: "Unfiltered", s: "Verified Unique Users" },
              { f: "Geo-Tiering", n: "N/A", s: "Custom Rates by Region" },
              { f: "Analytics", n: "Basic / None", s: "Real-time Reward Tracking" },
              { f: "Payouts", n: "N/A", s: "Fast & Secure Withdrawals" },
            ].map((row, i) => (
              <MobileComparisonCard key={i} row={row} />
            ))}
          </div>
        </div>
      </section>

      {/* 2-4. Complete Earning Workflow */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Path to Payout</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">From the moment you upload to the second you withdraw, our automated system handles every technical detail.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-emerald-500/20 -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "Upload", desc: "Push files to your own Drive.", icon: Zap },
              { step: "02", title: "Generate", desc: "Create your Smart Link.", icon: Filter },
              { step: "03", title: "Share", desc: "Distribute to your audience.", icon: Globe },
              { step: "04", title: "Verify", desc: "Bot & fraud filtering.", icon: ShieldCheck },
              { step: "05", title: "Accrue", desc: "Rewards added to pending.", icon: Award },
              { step: "06", title: "Withdraw", desc: "Fast payout to your wallet.", icon: DollarSign },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 p-6 rounded-[2rem] bg-slate-950 border border-white/5 hover:border-emerald-500/30 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-7. Validity & Traffic Quality */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Understanding <span className="text-emerald-400">Traffic Quality</span></h2>
              <div className="space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex gap-4 mb-6">
                    <Users className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <h3 className="text-xl font-bold text-white">Genuine User Traffic</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Real rewards are generated by real people. When a unique visitor clicks your link and completes a valid download process, our system recognizes this as a high-quality interaction. These actions are rewarded at our standard and premium rates based on geographic location.
                  </p>
                </div>
                
                <div className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/10">
                  <div className="flex gap-4 mb-6">
                    <Bot className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <h3 className="text-xl font-bold text-white">Automated & Bot Traffic</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We employ sophisticated AI models to identify automated scripts, headless browsers, and bot networks. Traffic identified as non-human is automatically filtered out and does not qualify for rewards. This protects the integrity of our advertisers and the longevity of our platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px]" />
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Search className="w-6 h-6 text-emerald-400" /> Validation Criteria
                </h3>
                <ul className="space-y-5">
                  {[
                    { text: "Unique IP address per 24-hour window.", status: true },
                    { text: "Successful completion of verification flow.", status: true },
                    { text: "No use of proxy or blacklisted VPN services.", status: true },
                    { text: "Human-like interaction patterns detected.", status: true },
                    { text: "Valid referral source from verified platforms.", status: true },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-400 group">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm group-hover:text-white transition-colors">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 italic text-[11px] text-slate-500 text-center">
                  "Our goal is to ensure that every reward in your wallet represents a real user download."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8-14. Calculation & Fraud Detection */}
      <section className="py-24 px-6 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Reward Engine</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Behind the scenes, RoyShare uses advanced data science to maintain a healthy and rewarding ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Geo-Tiering", desc: "Rewards are calculated based on the geographic location of the downloader. Premium markets offer higher yields.", icon: Globe },
              { title: "Anti-Spam Shield", desc: "We prevent rapid-fire clicks from single sources that attempt to manipulate balances.", icon: ShieldAlert },
              { title: "Duplicate Filtering", desc: "Our system intelligently deduplicates actions to ensure fair distribution of rewards.", icon: Filter },
              { title: "Suspicious Tagging", desc: "Traffic showing unnatural patterns is flagged for manual review by our security team.", icon: Activity },
            ].map((card, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-emerald-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 15-22. Wallet & Withdrawals */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-400" /> Reward Lifecycle
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <span className="text-slate-400 text-sm">Pending Rewards</span>
                      </div>
                      <span className="text-white font-mono text-sm">Initial State</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-400 text-sm">Approved Rewards</span>
                      </div>
                      <span className="text-white font-mono text-sm">Transferable</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-slate-400 text-sm">Rejected Rewards</span>
                      </div>
                      <span className="text-white font-mono text-sm">Invalid Activity</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 rounded-[3rem] bg-blue-600/5 border border-blue-600/10">
                  <h3 className="text-xl font-bold text-white mb-4">Minimum Withdrawal</h3>
                  <p className="text-slate-400 text-sm mb-6">To ensure efficient processing, we maintain a minimum withdrawal threshold. Once you reach this balance, you can request a payout through your preferred method.</p>
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <ArrowDownCircle className="w-5 h-5" /> Secure Processing
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Financial <span className="text-emerald-400">Transparency</span></h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  Every reward generated is visible in your real-time analytics dashboard. We categorize earnings into 'Pending' and 'Approved' to maintain a high security standard. Pending rewards undergo our final automated validation before moving to your main wallet balance.
                </p>
                <p>
                  Once approved, your funds are 100% yours. RoyShare supports a variety of withdrawal methods, ranging from direct transfers to digital wallets, ensuring you can access your earnings wherever you are in the world.
                </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                    <a 
                      href="https://t.me/Roysharearn_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 group"
                    >
                      <span>🚀 Start Sharing Now</span>
                    </a>
                  <button 
                    onClick={() => window.location.href = '/contact'}
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 border border-white/20 hover:bg-white/20 rounded-2xl text-white font-bold transition-all flex items-center justify-center gap-3"
                  >
                    <span>📩 Contact Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 23-25. Tips & Best Practices */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Maximize Your Earnings</h2>
            <p className="text-slate-500">Quality content leads to quality rewards. Follow these guidelines for long-term success.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-emerald-500/20 transition-all group">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Info className="w-5 h-5 text-emerald-400" /> DO:
              </h3>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  Share original, high-value files.
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  Target audiences in high-tier markets.
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  Use clear, honest descriptions for your links.
                </li>
              </ul>
            </div>
            
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-red-500/20 transition-all group">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" /> DON'T:
              </h3>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                  Use auto-clickers or bot networks.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                  Manipulate visitors with deceptive titles.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                  Self-click or encourage repetitive downloads.
                </li>
              </ul>
            </div>

            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-blue-500/20 transition-all group">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Best Practice:
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Consistency is key. Regularly updating your content and sharing it through organic channels like YouTube, blogs, or social communities creates a stable, growing reward stream.
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <History className="w-4 h-4" /> Build Your History
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 26. FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Common queries regarding the RoyShare reward system.</p>
          </div>
          <div className="space-y-6">
            {[
              { q: "How long do rewards stay in 'Pending'?", a: "Most rewards are approved within 24-48 hours. This period allows our automated systems to verify the integrity of the traffic and filter out any late-detected fraudulent activity." },
              { q: "Why was my reward rejected?", a: "Rewards are typically rejected if the action was identified as non-unique, originating from a bot, or using a blocked proxy/VPN. Manipulative behavior is the most common cause for rejections." },
              { q: "Does every download count toward my earnings?", a: "Every *valid* download counts. We filter out repetitive downloads from the same user, automated bot requests, and incomplete verification flows to maintain system health." },
              { q: "Can I use multiple accounts to increase earnings?", a: "No. Our policies strictly prohibit multi-accounting for reward manipulation. Attempting to do so can result in permanent suspension of all related accounts." },
              { q: "Is there a limit to how much I can earn?", a: "There is no ceiling. As long as your traffic remains genuine and high-quality, you can scale your earnings as much as your audience allows." },
              { q: "What happens if I use a VPN to download my own files?", a: "This is considered self-manipulation and is against our Terms of Service. Such actions will not generate rewards and may lead to account review." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-emerald-400" /> {faq.q}
                </h4>
                <p className="text-slate-400 leading-relaxed text-sm">{faq.a}</p>
              </motion.div>
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
            className="p-12 sm:p-16 rounded-[4rem] bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border border-white/10 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <Award className="w-16 h-16 text-emerald-400 mx-auto mb-8" />
              <h2 className="text-3xl font-bold text-white mb-6">Our Commitment to Transparency</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-0">
                RoyShare is built on the foundation of creator empowerment. We maintain strict security protocols not to limit you, but to protect the revenue pool for all honest participants. By filtering invalid traffic, we ensure that payouts remain sustainable and rewarding for real contributors like you.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 27-28. Bottom CTA & Conclusion */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-emerald-600 to-blue-600 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to earn from your content?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Join a community of creators who are building real income through secure sharing.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-emerald-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                🚀 Start Sharing Now
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

export default memo(RewardEarningsPage);
