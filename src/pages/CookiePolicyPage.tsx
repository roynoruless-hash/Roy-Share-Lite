import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Cookie, 
  Info, 
  Settings, 
  BarChart3, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  HelpCircle,
  Clock,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const cookieTypes = [
  {
    icon: Lock,
    title: "Essential Cookies",
    description: "These are required for the basic functionality of the platform, such as maintaining your login session and ensuring security.",
    color: "blue"
  },
  {
    icon: BarChart3,
    title: "Analytics Cookies",
    description: "These help us understand how users interact with our platform by collecting and reporting information anonymously.",
    color: "purple"
  },
  {
    icon: Settings,
    title: "Preference Cookies",
    description: "These allow our platform to remember choices you have made in the past, such as your preferred language or display settings.",
    color: "emerald"
  },
  {
    icon: ShieldCheck,
    title: "Security Cookies",
    description: "These are used to identify and prevent security risks, protecting your account and data from unauthorized access.",
    color: "amber"
  }
];

const policySections = [
  {
    title: "1. What Are Cookies?",
    content: "Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site."
  },
  {
    title: "2. Why We Use Cookies",
    content: "We use cookies to enhance your experience on RoyShare, including keeping you signed in, remembering your preferences, and understanding how you use our services so we can improve them.",
    list: [
      "Maintaining your login sessions",
      "Protecting your account from unauthorized access",
      "Measuring platform performance and speed",
      "Analyzing user behavior to improve UI/UX",
      "Remembering your custom dashboard settings"
    ]
  },
  {
    title: "3. Third Party Services",
    content: "We may use third-party services that also set cookies to provide their functionality within our platform.",
    list: [
      "Google Analytics (for usage monitoring)",
      "Google Drive API (for file management)",
      "Telegram Integration (for bot notifications)",
      "Firebase Authentication (for session security)"
    ]
  },
  {
    title: "4. Managing Cookies",
    content: "Most web browsers allow you to control cookies through their settings. You can choose to block or delete cookies, but please note that some features of RoyShare may not function correctly if you disable essential cookies.",
    linkText: "Learn how to manage cookies",
    linkHref: "https://www.aboutcookies.org"
  },
  {
    title: "5. Changes To This Policy",
    content: "RoyShare may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons."
  }
];

const CookiePolicyPage = () => {
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Cookie className="w-3 h-3" /> Browsing Experience
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Cookie <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Policy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            This Cookie Policy explains how RoyShare uses cookies and similar technologies to improve your experience, enhance security, and provide better services.
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

      {/* Cookie Types Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cookieTypes.map((type, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <type.icon className={`w-6 h-6 ${
                  type.color === 'blue' ? 'text-blue-400' : 
                  type.color === 'purple' ? 'text-purple-400' : 
                  type.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{type.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{type.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {policySections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                {section.title}
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                {section.content}
              </p>
              
              {section.list && (
                <ul className="space-y-3">
                  {section.list.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-slate-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.linkHref && (
                <a 
                  href={section.linkHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 font-bold text-sm hover:text-blue-300 transition-colors mt-4"
                >
                  {section.linkText} <ExternalLink className="w-4 h-4" />
                </a>
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
          <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Need Help?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Our support team is available if you have any questions about our use of cookies or privacy practices.
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
                onClick={() => window.location.href = '/privacy'}
              >
                <ShieldCheck className="w-6 h-6" />
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

export default memo(CookiePolicyPage);
