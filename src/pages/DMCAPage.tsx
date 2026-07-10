import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  FileSearch, 
  CheckSquare, 
  AlertCircle, 
  UserX, 
  Gavel, 
  Mail, 
  HelpCircle,
  Clock,
  CheckCircle2,
  User,
  Link,
  Edit3
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const requiredInfo = [
  { icon: User, text: "Your full legal name and contact details." },
  { icon: Mail, text: "Valid contact email address for correspondence." },
  { icon: FileSearch, text: "A detailed description of the copyrighted work." },
  { icon: Link, text: "The specific RoyShare URL of the infringing content." },
  { icon: Edit3, text: "A declaration of ownership or authorization." },
  { icon: Gavel, text: "Your physical or electronic signature." }
];

const policySections = [
  {
    icon: Shield,
    title: "1. Copyright Respect",
    content: "RoyShare respects the intellectual property rights of creators, publishers, and content owners. We maintain a zero-tolerance policy towards the unauthorized distribution of copyrighted material on our platform."
  },
  {
    icon: FileSearch,
    title: "2. Reporting Infringement",
    content: "If you believe that your copyrighted work has been uploaded or shared on RoyShare without your permission, you or your authorized agent can submit a formal DMCA notice to our compliance team."
  },
  {
    icon: Clock,
    title: "3. RoyShare Response",
    content: "Upon receipt of a valid and complete DMCA notice, RoyShare will take appropriate action, which may include disabling access to the infringing material or removing it entirely from our servers. We aim to process valid reports within 24-48 hours."
  },
  {
    icon: UserX,
    title: "4. Repeat Infringers",
    content: "In accordance with the DMCA and other applicable laws, RoyShare maintains a policy of terminating accounts of users who are found to be repeat infringers of intellectual property rights."
  },
  {
    icon: AlertCircle,
    title: "5. False Claims",
    content: "Please be aware that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to legal liability and damages."
  }
];

const DMCAPage = () => {
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
            <Shield className="w-3 h-3" /> Compliance Center
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            DMCA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Policy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            RoyShare respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). We are committed to protecting the rights of content creators.
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

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Policy Sections */}
          <div className="space-y-8">
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

          {/* Required Information Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <CheckSquare className="w-40 h-40" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-emerald-400" />
              Required Information
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              To be effective, your DMCA notice must include all of the following information in a written communication:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requiredInfo.map((info, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <info.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{info.text}</span>
                </div>
              ))}
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Need Copyright Assistance?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Our legal and compliance team is here to help you protect your rights. For DMCA-related requests, please contact us via our official channels.
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
                onClick={() => window.location.href = 'mailto:copyright@royshare.com'}
              >
                <Mail className="w-6 h-6" />
                Email Support
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(DMCAPage);
