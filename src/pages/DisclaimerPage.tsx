import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  UserCheck, 
  ExternalLink, 
  DollarSign, 
  Scale, 
  RefreshCw,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle2
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const disclaimerSections = [
  {
    icon: Info,
    title: "1. General Information",
    content: "RoyShare provides file sharing, URL shortening, and reward services for informational and productivity purposes. While we strive for accuracy, the platform is provided on an 'as is' basis."
  },
  {
    icon: AlertTriangle,
    title: "2. No Guarantee",
    content: "RoyShare does not guarantee uninterrupted availability, specific earnings levels, accurate download counts, or 100% service uptime. Technical issues or maintenance may cause temporary outages."
  },
  {
    icon: UserCheck,
    title: "3. User Responsibility",
    content: "Users are fully and solely responsible for the files, links, and content they upload, shorten, or share through RoyShare. We do not endorse or take responsibility for user-generated content."
  },
  {
    icon: ExternalLink,
    title: "4. Third-Party Services",
    content: "RoyShare integrates with services such as Telegram, Google Drive, and various Google cloud services. RoyShare is not responsible for outages, data loss, or issues caused by these third-party providers.",
    list: [
      "Telegram Bot & Communication",
      "Google Drive Storage & API",
      "GCP Cloud Infrastructure"
    ]
  },
  {
    icon: DollarSign,
    title: "5. Earnings Disclaimer",
    content: "Rewards and earnings are subject to our verification process. Fraudulent traffic, bot usage, VPN abuse, duplicate visits, or any policy violations will result in rewards being rejected or account suspension.",
    list: [
      "Verification is final and binding",
      "Policy violations forfeit all earnings",
      "VPN and Proxy traffic is strictly prohibited"
    ]
  },
  {
    icon: Scale,
    title: "6. Limitation of Liability",
    content: "To the maximum extent permitted by law, RoyShare shall not be liable for any direct, indirect, incidental, or consequential losses resulting from the use or inability to use the platform."
  },
  {
    icon: RefreshCw,
    title: "7. Policy Updates",
    content: "RoyShare reserves the right to modify or update this Disclaimer at any time without prior notice. Your continued use of the platform constitutes acceptance of the latest terms."
  }
];

const DisclaimerPage = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <ShieldAlert className="w-3 h-3" /> Legal Disclaimer
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            <span className="inline-block mr-4">⚠</span> Disclaimer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Please read this disclaimer carefully before using RoyShare services. Understanding our limitations helps ensure a better experience for everyone.
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

      {/* Sections Grid */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {disclaimerSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <section.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              
              <p className="text-slate-400 leading-relaxed mb-6">
                {section.content}
              </p>

              {section.list && (
                <ul className="space-y-3">
                  {section.list.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-slate-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-amber-500/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
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
          <div className="absolute inset-0 bg-amber-500/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Need Assistance?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              If you have any questions regarding this disclaimer or our platform policies, please don't hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/contact'}
              >
                <HelpCircle className="w-6 h-6" />
                Contact Support
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/terms'}
              >
                <FileText className="w-6 h-6" />
                Terms & Conditions
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(DisclaimerPage);
