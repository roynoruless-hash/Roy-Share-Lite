import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Lock, 
  ShieldCheck, 
  Database, 
  Eye, 
  Cloud, 
  Send, 
  Cookie, 
  FileText, 
  UserCheck, 
  ExternalLink,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const policySections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "Telegram Account Information (User ID, Username)",
      "Google Account Information (when connected for Drive storage)",
      "Uploaded File Metadata (Size, Type, Name)",
      "Device Information (IP Address, Device Type)",
      "Browser Information (Browser version, Language)",
      "Usage Analytics (Interactions with links and services)"
    ]
  },
  {
    icon: Eye,
    title: "How We Use Information",
    content: [
      "Providing and maintaining core RoyShare services",
      "Facilitating secure and private file sharing",
      "Managing Google Drive API integrations",
      "Processing Telegram bot interactions and automation",
      "Monitoring and improving platform performance",
      "Detecting and preventing fraudulent activities"
    ]
  },
  {
    icon: Cloud,
    title: "Google Drive Permissions",
    content: [
      "RoyShare requests access to your Google Drive to facilitate file storage and sharing.",
      "We only access, create, and manage files that are specifically intended for use within the RoyShare platform.",
      "We do not read or access your personal files outside of the RoyShare workspace."
    ]
  },
  {
    icon: Send,
    title: "Telegram Integration",
    content: [
      "Your Telegram account information is used to authenticate your session with our bot.",
      "This allows you to manage your files, track rewards, and receive notifications directly in Telegram.",
      "We do not share your Telegram contact list or private messages."
    ]
  },
  {
    icon: Cookie,
    title: "Cookies & Local Storage",
    content: [
      "We use cookies and local storage to maintain your session and preferences.",
      "These technologies help us understand how you use our site and improve your experience.",
      "You can manage your cookie preferences through your browser settings."
    ]
  },
  {
    icon: ShieldCheck,
    title: "Security & Encryption",
    content: [
      "All data transmissions are protected using industry-standard SSL/TLS encryption.",
      "Uploaded files are stored on secure Google infrastructure with advanced protection.",
      "We implement regular security audits and vulnerability assessments."
    ]
  },
  {
    icon: ExternalLink,
    title: "Third-Party Services",
    content: [
      "Google (Cloud Infrastructure & Drive Storage)",
      "Firebase (Real-time Database & Authentication)",
      "Telegram (Communication & Automation)",
      "Render (Server Hosting & Deployment)"
    ]
  },
  {
    icon: UserCheck,
    title: "User Rights",
    content: [
      "Right to request full account and data deletion.",
      "Right to disconnect Google Drive permissions at any time.",
      "Right to request removal of specific uploaded content.",
      "Right to access and export your stored usage data."
    ]
  }
];

const PrivacyPolicyPage = () => {
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
            <Lock className="w-3 h-3" /> Data Protection
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Policy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Your privacy and data security are important to us. Learn how we handle your information with transparency and care.
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

      {/* Policy Sections */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {policySections.map((section, i) => (
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

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 backdrop-blur-xl text-center"
          >
            <HelpCircle className="w-12 h-12 text-blue-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Privacy Questions?</h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
              If you have any questions about this Privacy Policy or how we handle your data, our support team is available 24/7 to assist you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl transition-all"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Support
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/20 transition-all"
                onClick={() => window.location.href = '/faq'}
              >
                Help Center
              </motion.button>
            </div>
          </motion.div>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Questions about privacy?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              We are committed to protecting your personal information and being transparent about what data we collect.
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
                onClick={() => window.location.href = '/faq'}
              >
                <HelpCircle className="w-6 h-6" />
                Help Center
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(PrivacyPolicyPage);
