import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Gift, 
  Share2, 
  TrendingUp, 
  Wallet, 
  Award, 
  ArrowRight, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Youtube, 
  Globe, 
  Link as LinkIcon, 
  CheckCircle2, 
  DollarSign, 
  Zap, 
  Monitor, 
  Play,
  Clock
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const ReferralProgramPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Users className="w-3 h-3" /> Growth Engine
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            RoyShare <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Referral Program</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            Empower your network and build passive income. Invite your friends, fellow creators, and community members to RoyShare and earn a lifetime commission on their activity. It's a win-win for everyone involved.
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
              className="w-full sm:w-auto px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              Get Your Referral Link
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is the RoyShare Referral Program? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Build Your Own <span className="text-purple-400">Network Effect</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  The RoyShare Referral Program is designed to reward our most loyal users for helping us grow. We believe that word-of-mouth is the most powerful marketing tool, and we want to compensate you for sharing RoyShare with others. When you invite someone using your unique referral link, they become part of your earnings network.
                </p>
                <p>
                  Every time a user you referred generates revenue—whether through file downloads or smart link clicks—you receive a percentage of those earnings as a bonus. This is not a one-time payment; it's a recurring commission that continues for as long as your referred users remain active on the platform. It's our way of saying thank you for building the RoyShare community.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] bg-purple-500/5 border border-purple-500/10 flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-purple-500/5 blur-[100px] group-hover:blur-[80px] transition-all" />
              <Users className="w-48 h-48 text-purple-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-purple-500/30 shadow-2xl flex flex-col items-center gap-4">
                  <Gift className="w-16 h-16 text-purple-400" />
                  <span className="text-white font-bold tracking-tight uppercase text-xs">Passive Income Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. How it Works */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Step-by-Step <span className="text-purple-400">Guide</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Starting your referral network is simple and takes less than 60 seconds.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 relative">
            {[
              { step: "01", title: "Create Account", desc: "Join RoyShare through our Telegram bot.", icon: Zap },
              { step: "02", title: "Get Your Link", desc: "Access your unique referral link in the bot.", icon: LinkIcon },
              { step: "03", title: "Share Everywhere", desc: "Distribute your link on any platform.", icon: Share2 },
              { step: "04", title: "Friends Join", desc: "They register using your unique link.", icon: Users },
              { step: "05", title: "They Earn", desc: "Your friends start using the platform.", icon: TrendingUp },
              { step: "06", title: "You Get Paid", desc: "Automatic commissions to your wallet.", icon: Wallet },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 p-6 rounded-[2rem] bg-slate-950 border border-white/5 hover:border-purple-500/30 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <item.icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                <span className="absolute top-4 right-4 text-[10px] font-mono text-slate-800 group-hover:text-purple-900 transition-colors font-black uppercase">{item.step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Where can I share my referral link? */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Promote Anywhere, <span className="text-purple-400">Earn Everywhere</span></h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-10">
                The beauty of the RoyShare Referral Program is its flexibility. You can share your link on virtually any platform where content creators and sharers hang out.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: MessageSquare, title: "Telegram", desc: "Groups and channels." },
                  { icon: Instagram, title: "Instagram", desc: "Bio and stories." },
                  { icon: Facebook, title: "Facebook", desc: "Pages and niche groups." },
                  { icon: Youtube, title: "YouTube", desc: "Video descriptions." },
                  { icon: Globe, title: "Blogs & Web", desc: "Banner ads and posts." },
                  { icon: Play, title: "TikTok", desc: "Content and bio links." },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-colors">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px]" />
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Monitor className="w-6 h-6 text-purple-400" /> Pro Sharing Tips
                </h3>
                <ul className="space-y-6">
                  {[
                    { title: "Create Tutorials", text: "Show your audience how much you earn using RoyShare to build trust.", icon: Play },
                    { title: "Comparison Posts", text: "Compare RoyShare's CPM and features with other platforms.", icon: TrendingUp },
                    { title: "Support Groups", text: "Help new creators set up their bots and provide your referral link.", icon: Users },
                    { title: "Banner Ads", text: "If you have a blog, place a permanent referral banner in your sidebar.", icon: LinkIcon },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-400 group">
                      <div className="mt-1 w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-400">
                        <item.icon size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{item.title}</h4>
                        <p className="text-xs leading-relaxed">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Referral Commission Rates & Benefits */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">The RoyShare <span className="text-purple-400">Advantage</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Why our referral program is the preferred choice for thousands of promoters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Lifetime Rewards", desc: "Earn commissions as long as your referred user is active. No expiry, no limits.", icon: Clock },
              { title: "Instant Payouts", desc: "Referral earnings are credited to your approved balance automatically.", icon: DollarSign },
              { title: "Transparent Tracking", desc: "See exactly how many users you've referred and how much they've earned.", icon: TrendingUp },
              { title: "Unlimited Referrals", desc: "Invite 10, 100, or 10,000 friends. Our infrastructure scales with your network.", icon: Users },
            ].map((card, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-purple-500/20 transition-all group text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 text-purple-400 mx-auto group-hover:scale-110 transition-transform">
                  <card.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Referral Program Rules & FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Integrity & Rules</h2>
            <p className="text-slate-400">To maintain a fair ecosystem, we enforce standard referral guidelines.</p>
          </div>
          <div className="space-y-6">
            {[
              { q: "Can I refer myself?", a: "No. Creating multiple accounts to refer yourself is strictly prohibited and will result in the suspension of all involved accounts and forfeiture of rewards." },
              { q: "Is there a limit on how much I can earn?", a: "Absolutely not. The more active users you refer, the more passive income you generate. Some of our top partners earn thousands per month through referrals alone." },
              { q: "How are commission rates calculated?", a: "Commission rates are determined by our platform-wide reward system. You earn a percentage of the revenue generated by your referred users' valid downloads and link clicks." },
              { q: "What if my referred user stops being active?", a: "You only earn commissions on active revenue generation. If a user stops using the platform, your earnings from that specific user will naturally cease, but the user remains tagged to your account should they return." },
              { q: "Can I use paid ads to promote my referral link?", a: "Yes, you can use Google Ads, Facebook Ads, or other networks, as long as your advertisements are honest and do not violate the terms of those networks or RoyShare." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/20 transition-all"
              >
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" /> {faq.q}
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
            className="p-12 sm:p-16 rounded-[4rem] bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-white/10 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <Award className="w-16 h-16 text-purple-400 mx-auto mb-8" />
              <h2 className="text-3xl font-bold text-white mb-6">Partner with RoyShare</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-0">
                RoyShare is more than just a tool; it's a platform for growth. Our referral program is built on the foundation of shared success. When you help a fellow creator succeed on our platform, you share in that success—today, tomorrow, and for years to come.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-purple-600 to-pink-600 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to build your network?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Get your unique referral link instantly through our official Telegram bot.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-purple-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                🚀 Get Referral Link
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

export default memo(ReferralProgramPage);
