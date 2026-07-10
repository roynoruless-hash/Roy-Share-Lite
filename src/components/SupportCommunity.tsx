import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Send, 
  Mail, 
  Users, 
  Bug, 
  Lightbulb, 
  Activity,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageSquare,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Globe
} from "lucide-react";

const supportCards = [
  {
    id: 1,
    title: "Telegram Support",
    description: "Get instant help from our official Telegram support bot.",
    buttonText: "Open Telegram",
    url: "https://t.me/Roysharearn_bot",
    icon: Send,
    color: "blue"
  },
  {
    id: 2,
    title: "Email Support",
    description: "Contact our support team for technical issues.",
    buttonText: "Send Email",
    url: "mailto:support@royshare.in?subject=RoyShare%20Support%20Request",
    icon: Mail,
    color: "purple"
  },
  {
    id: 3,
    title: "Community",
    description: "Join the RoyShare Community to learn, discuss and stay updated.",
    buttonText: "Join Community",
    url: "https://t.me/royshare_official",
    icon: Users,
    color: "emerald"
  },
  {
    id: 4,
    title: "System Status",
    description: "Check if all RoyShare services are online.",
    status: "🟢 All Systems Operational",
    buttonText: "View Status",
    url: "/status",
    icon: Activity,
    color: "cyan"
  },
  {
    id: 5,
    title: "Contact Support",
    description: "Need help? Reach out to our official support team.",
    buttonText: "Contact Support",
    url: "https://t.me/Roysharearn_bot",
    icon: MessageSquare,
    color: "indigo"
  }
];

const socialIcons = [
  { name: "Telegram", icon: Send, url: "https://t.me/royshare_official" },
  { name: "Instagram", icon: Instagram, url: "https://www.instagram.com/royshare_official" },
  { name: "Facebook", icon: Facebook, url: "https://www.facebook.com/profile.php?id=61591256922373" },
  { name: "Discord", icon: MessageSquare, url: "https://discord.gg/2Q2CSmFk" },
  { name: "YouTube", icon: Youtube, url: "https://youtube.com/@royshare" },
  { name: "X (Twitter)", icon: Twitter, url: "https://x.com/RoyShare_0" }
];

const responseTimes = [
  { label: "Telegram", time: "< 5 Minutes", icon: MessageCircle },
  { label: "Email", time: "< 24 Hours", icon: Mail },
  { label: "Community", time: "24×7", icon: Users }
];

const SupportCard = memo(({ card, index }: { card: typeof supportCards[0], index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group flex flex-col h-full overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10">
      <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform`}>
        <card.icon className="w-7 h-7 text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{card.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">{card.description}</p>
      
      {card.status && (
        <div className="mb-8 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400 text-xs font-bold text-center tracking-wide">{card.status}</p>
        </div>
      )}

      <a 
        href={card.url}
        target={card.url.startsWith('http') || card.url.startsWith('mailto') ? "_blank" : undefined}
        rel={card.url.startsWith('http') ? "noopener noreferrer" : undefined}
        className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center gap-2 mt-auto cursor-pointer relative z-20"
      >
        {card.buttonText}
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  </motion.div>
));

SupportCard.displayName = "SupportCard";

const SupportCommunity = ({ featuredOnly = false }: { featuredOnly?: boolean }) => {
  const displayCards = featuredOnly 
    ? supportCards.filter(c => [1, 2, 3, 4].includes(c.id))
    : supportCards;

  return (
    <section className={`relative ${featuredOnly ? "py-16 sm:py-24" : "py-24 sm:py-32"} px-6 bg-slate-950 overflow-hidden`}>
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`text-center ${featuredOnly ? "mb-12" : "mb-20"}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <ShieldCheck className="w-3 h-3" /> Reliable Support
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight"
          >
            💙 We're Always Here to Help
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Need help? Our support team and community are always ready to assist you.
          </motion.p>
        </div>

        {/* Support Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${featuredOnly ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6 ${featuredOnly ? "mb-16" : "mb-24"}`}>
          {displayCards.map((card, index) => (
            <SupportCard key={card.id} card={card} index={index} />
          ))}
        </div>

        {featuredOnly && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <button 
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white hover:text-slate-950 transition-all group"
              onClick={() => window.location.href = '/support'}
            >
              Contact Support <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {!featuredOnly && (
          <>
            {/* Response Time & Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-2 p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Clock className="w-32 h-32 text-white" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-400" />
                    ⚡ Average Reply Time
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {responseTimes.map((item, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                          <item.icon className="w-3 h-3 text-blue-500" />
                          {item.label}
                        </div>
                        <div className="text-2xl font-bold text-white">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-md flex flex-col justify-center"
              >
                <div className="text-center">
                  <Globe className="w-12 h-12 text-white mx-auto mb-6 opacity-20" />
                  <h3 className="text-2xl font-bold text-white mb-2">Global Support</h3>
                  <p className="text-slate-400 text-sm">Providing assistance to creators worldwide in multiple languages.</p>
                </div>
              </motion.div>
            </div>

            {/* Social Media */}
            <div className="text-center mb-24">
              <h3 className="text-white font-bold mb-10 tracking-widest uppercase text-xs">Follow Our Channels</h3>
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                {socialIcons.map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="relative group p-4 bg-white/5 border border-white/10 rounded-2xl transition-all"
                    title={social.name}
                    aria-label={social.name}
                  >
                    <social.icon className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto p-12 sm:p-16 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Need Immediate Assistance?</h3>
                <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                  Our support team is ready to help you with any questions or issues.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open('https://t.me/Roysharearn_bot', '_blank', 'noopener,noreferrer')}
                    className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Contact Support
                  </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://t.me/royshare_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <Send className="w-6 h-6" />
                  Join Community
                </motion.a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default SupportCommunity;
