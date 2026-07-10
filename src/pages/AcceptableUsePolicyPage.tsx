import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  CheckCircle2, 
  AlertOctagon, 
  Activity, 
  UserX, 
  HelpCircle, 
  Mail, 
  FileText,
  Upload,
  Cloud,
  Link,
  BookOpen,
  Users
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const policySections = [
  {
    icon: Shield,
    title: "1. Purpose",
    content: "This Acceptable Use Policy is designed to ensure that RoyShare remains a safe, secure, and reliable platform for all users. By using our services, you agree to abide by these guidelines which protect our community and infrastructure."
  },
  {
    icon: CheckCircle2,
    title: "2. Permitted Use",
    content: "Users are encouraged to use RoyShare for lawful and productive activities. Permitted uses include:",
    list: [
      "Secure file sharing and distribution",
      "Cloud storage for personal and business use",
      "Generating smart links for content discovery",
      "Sharing educational and creative materials",
      "Professional collaboration and data management"
    ]
  },
  {
    icon: AlertOctagon,
    title: "3. Prohibited Content",
    content: "To maintain the integrity of our platform, users are strictly prohibited from uploading or distributing:",
    list: [
      "Illegal material or content promoting illegal acts",
      "Copyright-infringing software, music, or media",
      "Malware, viruses, or any harmful code",
      "Phishing pages or deceptive marketing material",
      "Unsolicited bulk email (Spam)",
      "Content promoting hate, violence, or discrimination",
      "Fraudulent or misleading information"
    ]
  },
  {
    icon: Activity,
    title: "4. Prohibited Activities",
    content: "We strictly monitor platform activity to prevent abuse. The following activities are forbidden:",
    list: [
      "Generating fake downloads or automated traffic",
      "Using bots or scripts to manipulate stats",
      "VPN or Proxy abuse to artificially earn rewards",
      "Creating multiple fake accounts to exploit systems",
      "Abusing the referral system through fake invites",
      "Attempting to bypass security or rate limits",
      "Reverse engineering or unauthorized API access"
    ]
  },
  {
    icon: UserX,
    title: "5. Account Enforcement",
    content: "RoyShare takes policy violations seriously. Depending on the severity of the breach, we may:",
    list: [
      "Remove or disable access to prohibited content",
      "Issue warnings to the account owner",
      "Temporarily suspend account access",
      "Permanently terminate accounts of repeat offenders",
      "Report illegal activities to relevant authorities"
    ]
  },
  {
    icon: Mail,
    title: "6. Reporting Abuse",
    content: "We rely on our community to help maintain a safe environment. If you encounter any content or activity that violates this policy, please report it immediately through our Contact Support page."
  },
  {
    icon: FileText,
    title: "7. Policy Updates",
    content: "RoyShare may update this policy from time to time to reflect changes in our services or legal requirements. Your continued use of the platform after updates indicates your acceptance of the revised version."
  }
];

const AcceptableUsePolicyPage = () => {
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
            <Shield className="w-3 h-3" /> Safe Usage Guidelines
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Acceptable Use <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Policy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            These guidelines explain how RoyShare services may and may not be used. By following these rules, you help us keep the platform better for everyone.
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
              
              <p className="text-slate-400 leading-relaxed mb-6">
                {section.content}
              </p>

              {section.list && (
                <ul className="space-y-3">
                  {section.list.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-1.5 shrink-0" />
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
          <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Help keep RoyShare safe.</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Your cooperation helps us maintain a secure and rewarding environment for all creators and users.
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

export default memo(AcceptableUsePolicyPage);
