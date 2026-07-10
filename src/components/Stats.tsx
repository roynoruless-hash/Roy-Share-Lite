import React, { useEffect, useState, memo } from "react";
import { motion, useSpring, useTransform, animate } from "motion/react";
import { Users, Folder, Link2, Rocket } from "lucide-react";
import { API_BASE } from "../config/api";

const CounterCard = memo(({ value, label, icon: Icon, delay = 0 }: { value: number; label: string; icon: any, delay?: number }) => {
  const count = useSpring(0, { duration: 3 });
  
  useEffect(() => {
    animate(0, value, {
      duration: 3,
      delay,
      onUpdate: (latest) => count.set(latest),
    });
  }, [value, count, delay]);

  const display = useTransform(count, (latest) => {
    if (latest >= 1000000) return (latest / 1000000).toFixed(1) + "M+";
    if (latest >= 1000) return (latest / 1000).toFixed(1) + "K+";
    return Math.round(latest).toString();
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl group will-change-transform"
    >
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">
          <motion.span>{display}</motion.span>
        </div>
        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</div>
      </div>
    </motion.div>
  );
});

CounterCard.displayName = "CounterCard";

export default function Stats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Stats fetch error:", err);
        setLoading(false);
      });
  }, []);

  const hasStats = stats && (stats.totalUsers > 0 || stats.totalUploads > 0 || stats.totalLinks > 0);

  if (loading) return null;

  return (
    <section className="relative z-10 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {!hasStats ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 py-8 px-12 bg-white/5 border border-white/10 rounded-3xl w-fit mx-auto shadow-xl"
          >
            <Rocket className="w-8 h-8 text-blue-400 animate-bounce" />
            <span className="text-2xl md:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Growing Every Day
            </span>
          </motion.div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            <CounterCard value={stats.totalUsers} label="Global Users" icon={Users} delay={0.1} />
            <CounterCard value={stats.totalUploads} label="Files Shared" icon={Folder} delay={0.2} />
            <CounterCard value={stats.totalLinks} label="Links Created" icon={Link2} delay={0.3} />
          </div>
        )}
      </div>
    </section>
  );
}
