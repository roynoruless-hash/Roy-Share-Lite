import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Upload, 
  Link as LinkIcon, 
  DollarSign, 
  UserPlus, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Activity,
  CheckCircle2
} from "lucide-react";

interface ActivityItem {
  icon: any;
  title: string;
  description: string;
  time: string;
  color: string;
}

const activities: ActivityItem[] = [
  {
    icon: Upload,
    title: "Recent Upload",
    description: "APK uploaded",
    time: "2 minutes ago",
    color: "blue"
  },
  {
    icon: LinkIcon,
    title: "New Short Link",
    description: "Link created",
    time: "30 seconds ago",
    color: "purple"
  },
  {
    icon: DollarSign,
    title: "Reward Credited",
    description: "₹12.50 credited",
    time: "1 minute ago",
    color: "emerald"
  },
  {
    icon: UserPlus,
    title: "New User Joined",
    description: "New member registered",
    time: "Just now",
    color: "amber"
  }
];

const trustMetrics = [
  { icon: CheckCircle2, label: "99.9% Uptime", color: "text-emerald-500" },
  { icon: ShieldCheck, label: "End-to-End Secure", color: "text-blue-500" },
  { icon: Zap, label: "Lightning Fast", color: "text-amber-500" },
  { icon: Globe, label: "Global Access", color: "text-purple-500" }
];

const ActivityCard = memo(({ activity, index }: { activity: ActivityItem, index: number }) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="flex-shrink-0 w-[260px] sm:w-full p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <activity.icon className="w-16 h-16" />
      </div>
      
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110 ${colorMap[activity.color]}`}>
          <activity.icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-sm mb-1 truncate">{activity.title}</h4>
          <p className="text-slate-400 text-xs mb-3">{activity.description}</p>
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium uppercase tracking-wider">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            {activity.time}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ActivityCard.displayName = "ActivityCard";

const LiveActivity = () => {
  return (
    <section className="py-24 px-6 bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Activity
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 tracking-tight"
          >
            🟢 Live Platform Activity
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            See what's happening on RoyShare in real time.
          </motion.p>
        </div>

        {/* Activity Grid / Carousel */}
        <div className="relative mb-20">
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            {activities.map((activity, index) => (
              <div key={index} className="snap-center">
                <ActivityCard activity={activity} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Trust Metrics */}
        <div className="pt-12 border-t border-white/5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {trustMetrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform ${metric.color}`}>
                  <metric.icon className="w-5 h-5" />
                </div>
                <span className="text-white font-bold text-sm tracking-wide group-hover:text-blue-400 transition-colors">
                  {metric.label}
                </span>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-slate-500 text-xs italic">
              "Activity updates automatically as the platform grows."
            </p>
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
};

export default memo(LiveActivity);
