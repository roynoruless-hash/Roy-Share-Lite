import { motion } from "motion/react";
import { Send, FileUp, Link2, Coins } from "lucide-react";

export default function CTA() {
  const features = [
    { icon: FileUp, text: "File Sharing" },
    { icon: Link2, text: "URL Shortener" },
    { icon: Coins, text: "Rewards" },
  ];

  return (
    <section className="py-16 sm:py-20 px-6">
      <div className="max-w-4xl mx-auto p-12 bg-slate-900/50 rounded-[3rem] border border-white/10 text-center relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <h2 className="text-4xl md:text-5xl font-display font-medium text-white mb-6">Ready To Start Earning?</h2>
        <p className="text-slate-400 text-lg mb-12">Upload files, shorten links and grow your earnings with our Telegram powered platform.</p>

        <div className="flex justify-center gap-8 mb-12">
            {features.map((f, i) => (
                <motion.div 
                    key={i} 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="p-4 bg-white/5 rounded-full border border-white/10 text-blue-400">
                        <f.icon className="w-8 h-8"/>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{f.text}</span>
                </motion.div>
            ))}
        </div>

        <motion.a
          href="https://t.me/Roysharearn_bot"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative px-8 py-4 bg-white text-slate-950 rounded-full font-semibold text-lg overflow-hidden group shadow-lg inline-block"
        >
          <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-3 z-10 group-hover:text-white">
            <Send className="w-5 h-5" />
            Launch Telegram Bot
          </span>
        </motion.a>
      </div>
    </section>
  );
}
