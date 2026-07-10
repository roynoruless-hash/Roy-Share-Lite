import React, { memo, useState } from "react";
import { motion } from "motion/react";
import { 
  Send, 
  Mail, 
  Users, 
  Bug, 
  MessageSquare, 
  Clock, 
  Globe, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Activity
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const contactMethods = [
  {
    icon: Send,
    title: "Telegram Support",
    description: "Get quick support through our official Telegram support bot.",
    buttonText: "Open Telegram",
    url: "https://t.me/Roysharearn_bot",
    color: "blue"
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us your questions or technical issues.",
    buttonText: "Send Email",
    url: "mailto:support@royshare.in?subject=RoyShare%20Support%20Request",
    color: "purple"
  },
  {
    icon: Users,
    title: "Community",
    description: "Join our official community and stay updated.",
    buttonText: "Join Community",
    url: "https://t.me/royshare_official",
    color: "emerald"
  },
  {
    icon: MessageSquare,
    title: "Contact Support",
    description: "Need immediate assistance? Reach out to our team.",
    buttonText: "Contact Support",
    url: "https://t.me/Roysharearn_bot",
    color: "indigo"
  }
];

const supportHours = [
  { label: "Average Telegram Reply", time: "< 5 Minutes", icon: MessageSquare },
  { label: "Average Email Reply", time: "< 24 Hours", icon: Mail },
  { label: "Community Support", time: "24×7", icon: Users }
];

const ContactPage = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI only for now
    alert("Message sent! This is a UI-only demonstration.");
  };

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
            <ShieldCheck className="w-3 h-3" /> Get in Touch
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">RoyShare</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Have a question, need support, found a bug or want to work with us? We're here to help.
          </motion.p>
        </div>
      </section>

      {/* Contact Methods Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactMethods.map((method, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group flex flex-col h-full relative"
            >
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform`}>
                <method.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{method.title}</h3>
              <p className="text-slate-500 text-sm mb-8 flex-grow leading-relaxed">{method.description}</p>
              <a 
                href={method.url}
                target={method.url.startsWith('http') || method.url.startsWith('mailto') ? "_blank" : undefined}
                rel={method.url.startsWith('http') ? "noopener noreferrer" : undefined}
                className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center gap-2 mt-auto relative z-20 cursor-pointer"
              >
                {method.buttonText}
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Content: Form & Info */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 sm:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl relative"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
            
            <h2 className="text-3xl font-bold mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Name</label>
                  <input 
                    type="text" 
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Your Name"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Subject</label>
                <input 
                  type="text" 
                  required
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  placeholder="How can we help?"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Message</label>
                <textarea 
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
              >
                Send Message
              </motion.button>
            </form>
          </motion.div>

          {/* Info Side */}
          <div className="space-y-10">
            {/* Support Hours Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Clock className="w-7 h-7 text-blue-400" />
                Support Times
              </h3>
              <div className="space-y-8">
                {supportHours.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className="text-slate-300 font-medium">{item.label}</span>
                    </div>
                    <span className="text-white font-bold px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">{item.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Location & FAQ Shortcut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <Globe className="w-8 h-8 text-blue-400 mb-6" />
                <h4 className="text-lg font-bold mb-2">Location</h4>
                <p className="text-slate-500 text-sm">Online Cloud Platform</p>
                <p className="text-slate-300 font-bold">Available Worldwide</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group"
              >
                <HelpCircle className="w-8 h-8 text-purple-400 mb-6" />
                <h4 className="text-lg font-bold mb-2">Need Help?</h4>
                <p className="text-slate-500 text-sm mb-4">Check our instant answers.</p>
                <button 
                  onClick={() => window.location.href = '/faq'}
                  className="text-white font-bold text-sm flex items-center gap-2 group-hover:text-blue-400 transition-colors"
                >
                  Visit Help Center <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Verification Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-emerald-500 font-bold text-sm">Secure Communication</h4>
                <p className="text-slate-500 text-xs">All messages are encrypted and handled privately.</p>
              </div>
            </motion.div>
          </div>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Still Need Help?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Our support team is ready to help you with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Send className="w-6 h-6" />
                Telegram Support
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/status'}
              >
                <Activity className="w-6 h-6" />
                View Status
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(ContactPage);
