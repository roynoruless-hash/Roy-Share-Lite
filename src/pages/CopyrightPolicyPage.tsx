import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Copyright, 
  UserCheck, 
  ShieldAlert, 
  Trash2, 
  UserX, 
  Globe, 
  HelpCircle, 
  Shield,
  Clock,
  CheckCircle2,
  FileText
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const policySections = [
  {
    icon: UserCheck,
    title: "1. Ownership of Content",
    content: "Users retain full ownership and copyright of the files and content they upload to RoyShare. By uploading content, you grant RoyShare a limited license to host and share that content as per your instructions."
  },
  {
    icon: Shield,
    title: "2. User Responsibility",
    content: "You are solely responsible for ensuring that you have the legal right to upload and share any content on RoyShare. You must only upload content that you own or for which you have received explicit authorization from the copyright holder."
  },
  {
    icon: ShieldAlert,
    title: "3. Copyright Infringement",
    content: "The unauthorized uploading or sharing of copyrighted material is strictly prohibited. This includes but is not limited to software, music, movies, books, and any other creative works protected by copyright laws."
  },
  {
    icon: Trash2,
    title: "4. RoyShare Rights",
    content: "RoyShare reserves the right to review, disable access to, or permanently remove any content that is found to violate copyright laws or our platform policies without prior notice to the user."
  },
  {
    icon: UserX,
    title: "5. Repeat Violations",
    content: "Accounts that are repeatedly identified as sources of copyright infringement or other intellectual property violations may be subject to temporary suspension or permanent termination at RoyShare's sole discretion."
  },
  {
    icon: Globe,
    title: "6. Intellectual Property",
    content: "All RoyShare branding, logos, interface designs, custom graphics, and underlying source materials are the exclusive property of RoyShare and are protected by applicable intellectual property and copyright laws."
  },
  {
    icon: HelpCircle,
    title: "7. Contact Information",
    content: "If you have any questions regarding our copyright policies, or if you are involved in an ownership dispute regarding content hosted on our platform, please reach out to our support team."
  }
];

const CopyrightPolicyPage = () => {
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
            <Copyright className="w-3 h-3" /> Intellectual Property
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Copyright <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Policy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            RoyShare respects copyright laws and is committed to protecting intellectual property rights. We believe in a fair and secure environment for all creators.
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
              
              <p className="text-slate-400 leading-relaxed">
                {section.content}
              </p>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Need Copyright Help?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              If you have concerns regarding copyright infringement or ownership disputes, please contact us immediately.
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
                onClick={() => window.location.href = '/dmca'}
              >
                <Shield className="w-6 h-6" />
                DMCA Policy
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(CopyrightPolicyPage);
