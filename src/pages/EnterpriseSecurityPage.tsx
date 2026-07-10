import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Lock, 
  Cloud, 
  Bot, 
  Zap, 
  Globe, 
  FileText, 
  User, 
  Key, 
  EyeOff, 
  Server, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Cpu,
  MonitorCheck
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const EnterpriseSecurityPage = () => {
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
            <ShieldCheck className="w-3 h-3" /> Military-Grade Infrastructure
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Security</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            Security isn't a feature; it's our foundation. RoyShare is engineered with multi-layered protection protocols to ensure your files, data, and earnings remain under your absolute control, utilizing world-class encryption and secure API integrations.
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
              Verify Your Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is Enterprise Security? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Our Commitment to <span className="text-blue-400">Your Privacy</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  At RoyShare, we understand that your data is your most valuable asset. That's why enterprise-grade security is one of our highest priorities. Our platform is architected from the ground up to prevent unauthorized access, mitigate potential threats, and maintain a secure environment for both creators and their audiences.
                </p>
                <p>
                  We don't just follow industry standards; we exceed them. By combining the robust security infrastructure of Google Cloud with our custom-built verification engine and Telegram's secure messaging protocol, we've created a triangle of trust that keeps your content safe around the clock.
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
              <ShieldCheck className="w-48 h-48 text-blue-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-blue-500/30 shadow-2xl flex flex-col items-center gap-4">
                  <Cpu className="w-16 h-16 text-blue-400" />
                  <span className="text-white font-bold tracking-tight uppercase text-xs">Encryption Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Google Drive Security */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Google Drive <span className="text-blue-400">Zero-Copy Security</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Your files never leave your possession. We provide the link, you keep the storage.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Database, title: "Self-Storage Model", desc: "Files remain exclusively inside your own Google Drive. We never store copies on our servers." },
              { icon: Lock, title: "Limited Permissions", desc: "RoyShare only requests the minimal API permissions needed to generate secure download links." },
              { icon: EyeOff, title: "Zero Data Access", desc: "We cannot browse, edit, download, or read your private files. Your privacy is absolute." },
              { icon: User, title: "Absolute Ownership", desc: "You remain the sole owner and administrator of your content at all times." },
              { icon: Key, title: "API Token Security", desc: "Your Google access tokens are encrypted and rotated according to Google's best practices." },
              { icon: ShieldCheck, title: "Revocable Access", desc: "You can revoke RoyShare's access to your Drive at any time through your Google account settings." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Telegram Bot Security */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
               <div className="p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px]" />
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Bot className="w-6 h-6 text-blue-400" /> Telegram Shield
                </h3>
                <ul className="space-y-6">
                  {[
                    { title: "Bot Authentication", text: "Secure login using Telegram's native authentication flow for absolute account safety." },
                    { title: "Encrypted Communication", text: "Every command sent to the RoyShare bot is protected by Telegram's MTProto encryption." },
                    { title: "Unauthorized Access Protection", text: "We verify the unique Telegram User ID for every request, preventing unauthorized account manipulation." },
                    { title: "Real-Time Notifications", text: "Receive instant security alerts directly to your Telegram whenever critical changes are made." },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="mt-1 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{item.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Secure <span className="text-blue-400">Bot Interaction</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  The RoyShare Telegram Bot isn't just convenient—it's one of the most secure ways to manage your digital assets. By utilizing Telegram's high-security environment, we eliminate the need for traditional password systems that are often the weakest link in digital security.
                </p>
                <p>
                  Your unique Telegram ID serves as a cryptographic key, ensuring that only you can access your dashboard, generate links, or request withdrawals. This bi-layered security approach keeps your account protected even if you lose access to other devices.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Reward Engine Security & 5. Anti-Spam */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Fraud <span className="text-blue-400">Mitigation</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Protecting the integrity of our platform ensures sustainable earnings for all creators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-[3rem] bg-slate-950 border border-white/5 group hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <ShieldAlert className="w-8 h-8 text-blue-400" />
                <h3 className="text-2xl font-bold text-white">Bot & Proxy Filtering</h3>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                Our reward engine utilizes real-time threat intelligence to identify and block traffic from known proxy servers, VPNs, and botnets. We analyze over 50 behavioral markers for every download request to ensure that rewards are only generated by genuine human visitors.
              </p>
              <div className="flex flex-wrap gap-2">
                {["AI Analysis", "IP Reputation", "Behavior Tracking", "Header Verification"].map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tag}</span>
                ))}
              </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-slate-950 border border-white/5 group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <Zap className="w-8 h-8 text-indigo-400" />
                <h3 className="text-2xl font-bold text-white">Multi-Step Verification</h3>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                To prevent automated bulk downloads, our smart links employ a non-intrusive, multi-step verification process. This ensures that the person downloading your file is a real user, while maintaining a smooth experience that doesn't frustrate your audience.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Cloudflare WAF", "Rate Limiting", "DDoS Protection", "Spam Filtering"].map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Account & Data Privacy */}
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
              <MonitorCheck className="w-16 h-16 text-blue-400 mx-auto mb-8" />
              <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Privacy by Design</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                We collect only the minimum data required to provide our service. Your personal information is encrypted at rest and in transit, and we never sell your data to third-party marketers. At RoyShare, you aren't the product; you're the creator.
              </p>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  <Lock size={14} className="text-emerald-500" /> GDPR Compliant
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  <ShieldCheck size={14} className="text-emerald-500" /> SOC2 Standards
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Security you can trust.</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Join the most secure file sharing platform today and protect your digital future.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                🚀 Launch Secure Bot
              </a>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                📩 View Security FAQ
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
};

export default memo(EnterpriseSecurityPage);
