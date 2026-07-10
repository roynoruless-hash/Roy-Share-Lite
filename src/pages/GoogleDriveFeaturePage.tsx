import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Cloud, 
  ShieldCheck, 
  Zap, 
  Lock, 
  EyeOff, 
  Trash2, 
  Key, 
  UserCheck, 
  Database,
  Wallet,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  HardDrive,
  RefreshCw,
  Globe,
  Star,
  Settings,
  Mail,
  FileCheck
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const GoogleDriveFeaturePage = () => {
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
            <Cloud className="w-3 h-3" /> Storage Solutions
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Google Drive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Cloud Storage</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mb-10"
          >
            At RoyShare, we believe in giving you full control over your data. That's why we utilize your own Google Drive for file storage, ensuring your content stays private, secure, and always under your ownership.
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
              Start Sharing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* What is Google Drive Cloud Storage? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Your Files, Your Storage, <span className="text-blue-400">Your Rules</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  RoyShare operates on a unique decentralized storage model. Unlike traditional file-sharing platforms that store your data on their own servers, we empower you to use your existing Google Drive infrastructure.
                </p>
                <p>
                  By connecting RoyShare to your Google Drive, you're not just sharing files; you're building a secure, automated distribution system that respects your privacy. Every upload goes directly to your private cloud, and RoyShare acts as a sophisticated management layer that handles link generation, monetization, and delivery.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                  {[
                    "No RoyShare server storage",
                    "Official Google API usage",
                    "Direct-to-drive uploads",
                    "Secure automation layer"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white font-medium text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 p-8 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-blue-500/10" />
                <Cloud className="w-48 h-48 text-blue-500/40 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How RoyShare Works - Workflow */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">How RoyShare Integrates</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A seamless workflow designed for security and maximum distribution efficiency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "User Uploads File", desc: "You select a file via RoyShare's web interface or our powerful Telegram Bot.", icon: HardDrive },
              { step: "02", title: "Direct API Upload", desc: "RoyShare streams the file directly to your Google Drive via the official secure API.", icon: RefreshCw },
              { step: "03", title: "Link Generation", desc: "We generate a unique, secure RoyShare link that manages your download parameters.", icon: LinkCheckIcon },
              { step: "04", title: "Global Sharing", desc: "You distribute your RoyShare link across social media, groups, or websites.", icon: Globe },
              { step: "05", title: "Optimized Delivery", desc: "Visitors download the file from your Drive through our high-speed bridge.", icon: Zap },
              { step: "06", title: "Earn Rewards", desc: "Every valid download counts towards your earnings in the RoyShare reward system.", icon: Star },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    {step.icon ? <step.icon className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                  </div>
                  <span className="text-4xl font-black text-white/10 group-hover:text-blue-500/20 transition-colors">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Security Without Compromise</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">We've built RoyShare with a privacy-first architecture. Here's exactly what that means for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-red-500/5 border border-red-500/10 backdrop-blur-xl"
            >
              <h3 className="text-2xl font-bold text-red-400 mb-8 flex items-center gap-3">
                <EyeOff className="w-6 h-6" /> RoyShare CANNOT
              </h3>
              <ul className="space-y-6">
                {[
                  "Read or scan your personal files",
                  "Modify or rename existing data",
                  "Delete any files from your Drive",
                  "Download private files without authorization",
                  "Access your account if permission is revoked"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-slate-400 group">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center mt-1 flex-shrink-0">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl"
            >
              <h3 className="text-2xl font-bold text-emerald-400 mb-8 flex items-center gap-3">
                <Lock className="w-6 h-6" /> Your Data Protection
              </h3>
              <div className="space-y-6 text-slate-400">
                <div className="flex gap-4">
                  <Key className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Google OAuth 2.0</h4>
                    <p className="text-sm">We use Google's industry-standard authentication. You never share your password with us.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Settings className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Revocable Permissions</h4>
                    <p className="text-sm">You maintain complete control. You can revoke RoyShare's access instantly from your Google Security settings.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <UserCheck className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Minimal Access Scopes</h4>
                    <p className="text-sm">We only request the specific API scopes needed to upload files and manage shared links.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Google Drive? */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-16 tracking-tight">Why Choose Google Infrastructure?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "High Reliability", desc: "99.9% uptime powered by Google's global data centers.", icon: Zap },
              { title: "Fast Downloads", desc: "Experience blazing fast speeds across the globe.", icon: RefreshCw },
              { title: "Secure Backup", desc: "Your files are automatically backed up by Google.", icon: HardDrive },
              { title: "Global Availability", desc: "Access your storage from any device, anywhere, anytime.", icon: Globe },
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Unlimited Scalability", desc: "Scale as much as your Google Drive allows. No storage limits from RoyShare.", icon: Database },
              { title: "Full Ownership", desc: "You are the legal owner of your files. We are just the delivery mechanism.", icon: UserCheck },
              { title: "Instant Payouts", desc: "Earn rewards and withdraw them through our multiple payment methods.", icon: Wallet },
              { title: "Direct Management", desc: "Manage your files directly in Drive or through our intuitive interface.", icon: Settings },
              { title: "Zero Hosting Fees", desc: "Avoid expensive premium hosting. Use the storage you already have.", icon: HardDrive },
              { title: "Verified Downloads", desc: "Our bridge ensures every download is secure and properly tracked.", icon: FileCheck },
            ].map((benefit, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 mb-6 group-hover:rotate-12 transition-transform">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 sm:p-16 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 backdrop-blur-xl relative overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Designed for Trust</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                RoyShare was engineered with the fundamental belief that users should own their data. Our system acts solely as a secure facilitator between your Google Drive and your audience. You can audit permissions, view activity logs, and disconnect at any time. Your trust is our most valuable asset.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> No Data Mining
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Zero File Access
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Full User Ownership
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about the Google Drive integration.</p>
          </div>
          <div className="space-y-6">
            {[
              { q: "Can RoyShare see my other Google Drive files?", a: "No. RoyShare only requests permission to access files that are explicitly uploaded through our system. Your personal photos, documents, and other Drive content remain completely private and invisible to us." },
              { q: "Who owns the files I upload via RoyShare?", a: "You do. RoyShare never claims ownership of your content. The files stay in your Google Drive account, and you retain all legal and intellectual property rights." },
              { q: "Can I disconnect RoyShare from my Google account?", a: "Absolutely. You can revoke our access at any time through your Google Account Security settings under 'Third-party apps with account access'." },
              { q: "Are my files encrypted during transfer?", a: "Yes. All file transfers between our system and Google Drive are performed over HTTPS using SSL/TLS encryption, ensuring your data is protected in transit." },
              { q: "What happens if I delete a file from my Google Drive?", a: "If you delete the source file from your Google Drive, the RoyShare download link will stop working automatically as the source data no longer exists." },
              { q: "Can RoyShare delete my files without my permission?", a: "No. Our system is designed to only upload and generate shared links. We do not have the permission scope required to delete files from your storage." },
              { q: "Can I use multiple Google accounts with one RoyShare profile?", a: "Currently, RoyShare supports linking one primary Google Drive account per user profile to ensure stable tracking and analytics." },
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

      {/* Bottom CTA */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to start sharing securely?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Join thousands of creators who trust RoyShare for secure, monetized file distribution.</p>
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
                <Mail className="w-5 h-5" /> Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
};

// Custom Icon for Step 3
const LinkCheckIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    <path d="m22 22-5-5" />
    <path d="M11 11l-3 3" />
  </svg>
);

export default memo(GoogleDriveFeaturePage);
