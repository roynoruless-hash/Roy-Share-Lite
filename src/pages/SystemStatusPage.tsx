import React, { memo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Activity, 
  CheckCircle2, 
  Cloud, 
  Bot, 
  Upload, 
  Download, 
  Link as LinkIcon, 
  DollarSign, 
  Flame, 
  AlertCircle, 
  Clock, 
  Calendar,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Zap,
  History
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const services = [
  { name: "Google Drive Integration", icon: Cloud, status: "Operational", color: "emerald" },
  { name: "Telegram Bot", icon: Bot, status: "Operational", color: "emerald" },
  { name: "File Upload Service", icon: Upload, status: "Operational", color: "emerald" },
  { name: "Download Service", icon: Download, status: "Operational", color: "emerald" },
  { name: "Smart Link Service", icon: LinkIcon, status: "Operational", color: "emerald" },
  { name: "Rewards System", icon: DollarSign, status: "Operational", color: "emerald" },
  { name: "Firebase (Real-time DB)", icon: Flame, status: "Operational", color: "emerald" },
];

const history = [
  { label: "Today", uptime: "100%", status: "emerald" },
  { label: "Yesterday", uptime: "99.99%", status: "emerald" },
  { label: "Last 7 Days", uptime: "99.98%", status: "emerald" },
  { label: "Last 30 Days", uptime: "99.95%", status: "emerald" },
];

const SystemStatusPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Header Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Activity className="w-3 h-3" /> Real-time Monitoring
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Status</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Monitor the health and availability of RoyShare services. We strive for 100% transparency and uptime.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <span>Last Updated: {formattedDate}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <span className="font-mono text-emerald-500/50">{formattedTime}</span>
          </motion.div>
        </div>
      </section>

      {/* Overall Status Card */}
      <section className="pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-10 rounded-[3rem] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 backdrop-blur-2xl text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">All Systems Operational</h2>
              <p className="text-emerald-400/70 text-lg max-w-xl mx-auto font-medium">
                All RoyShare services are currently running normally. No issues detected in the infrastructure.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-400" /> Services Health
            </h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/30 transition-all">
                    <service.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <span className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{service.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-1">Operational</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-1 h-3 rounded-full bg-emerald-500/40" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Incidents & Maintenance */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl"
          >
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <History className="w-5 h-5 text-blue-400" /> Recent Incidents
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-slate-600">
                <Calendar className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">🎉 No incidents reported in the last 30 days.</p>
              <p className="text-slate-600 text-sm mt-2">RoyShare maintains a commitment to high availability.</p>
            </div>
            {/* Placeholder for future incidents list */}
            <div className="hidden">
              {/* Incident items go here */}
            </div>
          </motion.div>

          {/* Scheduled Maintenance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl"
          >
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" /> Maintenance
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-slate-600">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">No scheduled maintenance at this time.</p>
              <p className="text-slate-600 text-sm mt-2">All services are up and running at peak performance.</p>
            </div>
            {/* Placeholder for future maintenance list */}
            <div className="hidden">
              {/* Maintenance items go here */}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Uptime History */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400" /> Status History
            </h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden sm:block" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {history.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl text-center group hover:bg-white/10 transition-all"
              >
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-3">{item.label}</p>
                <p className="text-3xl font-display font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{item.uptime}</p>
                <div className="flex items-center justify-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Uptime
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-xs mt-8 italic">
            * Uptime statistics can be connected to real-time monitoring backend data in future updates.
          </p>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Experiencing an issue?</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              If you're noticing a service disruption not reported here, please contact our support team or check our Help Center.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/contact"
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-blue-500 hover:scale-105"
              >
                <MessageSquare className="w-6 h-6" />
                Contact Support
              </a>
              <a
                href="/help"
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-white/10 hover:scale-105"
              >
                <HelpCircle className="w-6 h-6" />
                Help Center
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default memo(SystemStatusPage);
