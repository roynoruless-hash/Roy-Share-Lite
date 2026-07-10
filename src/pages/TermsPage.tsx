import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Upload, 
  Cloud, 
  Send, 
  DollarSign, 
  AlertTriangle, 
  UserX, 
  Scale, 
  RefreshCw, 
  MessageSquare,
  HelpCircle,
  Lock
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const termsSections = [
  {
    icon: ShieldCheck,
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using the RoyShare platform, website, or Telegram bot, you agree to be bound by these Terms & Conditions.",
      "If you do not agree with any part of these terms, you must immediately discontinue use of our services.",
      "These terms constitute a legally binding agreement between you and RoyShare."
    ]
  },
  {
    icon: UserCheck,
    title: "2. Eligibility",
    content: [
      "You must be of legal age in your jurisdiction to use this platform.",
      "You agree to comply with all applicable local, national, and international laws and regulations while using RoyShare.",
      "You are responsible for ensuring that your use of the platform does not violate any rules or policies of third-party integrations."
    ]
  },
  {
    icon: Lock,
    title: "3. User Accounts",
    content: [
      "You are responsible for maintaining the security and confidentiality of your RoyShare account and associated Telegram account.",
      "You must provide accurate and complete information when creating or updating your account.",
      "You are solely responsible for all activities that occur under your account."
    ]
  },
  {
    icon: Upload,
    title: "4. File Uploads & Content",
    content: [
      "Users are solely responsible for the content they upload, share, or store on RoyShare.",
      "Prohibited content includes, but is not limited to: illegal material, copyright-infringing content, malware, harmful files, and spam.",
      "We reserve the right to remove any content that violates these policies without prior notice."
    ]
  },
  {
    icon: Cloud,
    title: "5. Google Drive Integration",
    content: [
      "RoyShare integrates with your personal Google Drive account to facilitate file storage.",
      "You remain the owner of the content stored in your Google Drive.",
      "You are responsible for any Google Drive API usage limits or storage costs associated with your account."
    ]
  },
  {
    icon: Send,
    title: "6. Telegram Integration",
    content: [
      "Our Telegram bot is used to provide core account functionality, upload management, and notifications.",
      "You agree to receive service-related messages and alerts via Telegram.",
      "Disconnection of the Telegram bot may limit your ability to access certain RoyShare features."
    ]
  },
  {
    icon: DollarSign,
    title: "7. Rewards & Earnings",
    content: [
      "Rewards are subject to RoyShare's verification process and internal policies.",
      "Any fraudulent activity, including but not limited to fake traffic or automated interactions, will result in the immediate cancellation of rewards.",
      "We reserve the right to audit and adjust earnings if they are found to be generated through prohibited methods."
    ]
  },
  {
    icon: AlertTriangle,
    title: "8. Prohibited Activities",
    content: [
      "Generating or purchasing fake traffic to links.",
      "Using automated scripts or bots to download files.",
      "Abusing the referral system through multiple fake accounts.",
      "Exploiting bugs or vulnerabilities in the platform.",
      "Attempting to circumvent our verification or monetization systems."
    ]
  },
  {
    icon: UserX,
    title: "9. Account Suspension",
    content: [
      "RoyShare reserves the right to suspend or terminate accounts that violate these Terms & Conditions.",
      "Suspension may result in the forfeiture of pending rewards and permanent loss of access to the platform.",
      "Decisions regarding account restrictions are final and at the sole discretion of RoyShare."
    ]
  },
  {
    icon: Scale,
    title: "10. Limitation of Liability",
    content: [
      "RoyShare is provided on an 'as is' and 'as available' basis without warranties of any kind.",
      "We are not liable for any indirect, incidental, or consequential damages resulting from your use of the platform.",
      "We are not responsible for service interruptions caused by third-party providers such as Google or Telegram."
    ]
  },
  {
    icon: RefreshCw,
    title: "11. Changes to the Terms",
    content: [
      "RoyShare may update or modify these Terms & Conditions at any time.",
      "We will notify users of significant changes through our official channels.",
      "Continued use of the platform after updates constitute your acceptance of the revised terms."
    ]
  },
  {
    icon: MessageSquare,
    title: "12. Contact Information",
    content: [
      "If you have any questions or concerns regarding these Terms & Conditions, please reach out to our support team.",
      "You can contact us via our official Telegram support or through the contact page on our website."
    ]
  }
];

const TermsPage = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <FileText className="w-3 h-3" /> User Agreement
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Conditions</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Please read these Terms & Conditions carefully before using RoyShare. By using our platform, you agree to abide by these rules.
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

      {/* Terms Sections */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {termsSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <section.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              
              <ul className="space-y-4">
                {section.content.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Have questions about our Terms?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              We recommend reviewing our policies regularly as we grow and improve our services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/contact'}
              >
                <MessageSquare className="w-6 h-6" />
                Contact Support
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/privacy'}
              >
                <Lock className="w-6 h-6" />
                Privacy Policy
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(TermsPage);
