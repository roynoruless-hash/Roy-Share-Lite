import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitter, 
  MessageSquare,
  ShieldCheck,
  Cloud,
  Bot,
  Lock,
  Headphones,
  CheckCircle2,
  ChevronDown,
  Heart
} from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "#" },
    { name: "How It Works", href: "#" },
    { name: "Rewards", href: "#" },
    { name: "Referral Program", href: "#" },
    { name: "Smart Links", href: "#" },
    { name: "Google Drive", href: "#" },
  ],
  resources: [
    { name: "About Us", href: "/about" },
    { name: "Help Center", href: "/help" },
    { name: "Documentation", href: "#" },
    { name: "FAQ", href: "/faq" },
    { name: "Blog", href: "#", comingSoon: true },
    { name: "API", href: "#", comingSoon: true },
    { name: "Roadmap", href: "/roadmap" },
    { name: "Changelog", href: "/changelog" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Cookie Policy", href: "/cookie-policy" },
    { name: "Disclaimer", href: "/disclaimer" },
    { name: "DMCA Policy", href: "/dmca" },
    { name: "Copyright Policy", href: "/copyright" },
    { name: "Acceptable Use Policy", href: "/acceptable-use" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Telegram Support", href: "#" },
    { name: "Email Support", href: "#" },
    { name: "Community", href: "#" },
    { name: "Report Abuse", href: "#" },
    { name: "Report Copyright", href: "#" },
    { name: "System Status", href: "#" },
  ]
};

const socialIcons = [
  { name: "Telegram", icon: Send, url: "https://t.me/royshare_official" },
  { name: "Instagram", icon: Instagram, url: "https://www.instagram.com/royshare_official" },
  { name: "Facebook", icon: Facebook, url: "https://www.facebook.com/profile.php?id=61591256922373" },
  { name: "Discord", icon: MessageSquare, url: "https://discord.gg/2Q2CSmFk" },
  { name: "YouTube", icon: Youtube, url: "https://youtube.com/@royshare" },
  { name: "X (Twitter)", icon: Twitter, url: "https://x.com/RoyShare_0" }
];

const securityBadges = [
  "SSL Protected",
  "Google Drive Powered",
  "Telegram Connected",
  "Secure Cloud Storage",
  "Privacy Focused",
  "24×7 Support"
];

const FooterAccordion = ({ title, links }: { title: string, links: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 md:border-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between md:hidden"
      >
        <span className="text-white font-bold uppercase tracking-widest text-xs">{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      <div className="hidden md:block mb-6">
        <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">{title}</h4>
      </div>

      <AnimatePresence>
        {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.ul 
            initial={window.innerWidth < 768 ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 pb-6 md:pb-0 overflow-hidden"
          >
            {links.map((link, i) => (
              <li key={i}>
                <a 
                  href={link.href} 
                  className="text-slate-500 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group"
                >
                  {link.name}
                  {link.comingSoon && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px] text-blue-400 font-bold border border-blue-500/20">Soon</span>
                  )}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FooterProps {
  hideCTA?: boolean;
}

const Footer = ({ hideCTA = false }: FooterProps) => {
  return (
    <footer className="bg-slate-950 pt-20 pb-8 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top CTA Card */}
        {!hideCTA && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto p-10 sm:p-14 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 backdrop-blur-xl mb-24 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Send className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Ready to Start Sharing?</h2>
                <p className="text-slate-400 text-lg max-w-lg">
                  Upload securely, create smart links and grow your audience with RoyShare.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <motion.a
                  href="https://t.me/Roysharearn_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  🚀 Start Sharing
                </motion.a>
                <motion.a
                  href="https://t.me/royshare_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  💬 Join Telegram
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-20">
          
          {/* Column 1: Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <a href="/" className="flex items-center gap-2 text-2xl font-display font-bold text-white mb-6 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
                </div>
                RoyShare
              </a>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-8">
                Secure cloud file sharing powered by Telegram & Google Drive. Built for creators, optimized for speed.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Version</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono">1.0.0</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columns 2-5: Links */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FooterAccordion title="Product" links={footerLinks.product} />
            <FooterAccordion title="Resources" links={footerLinks.resources} />
            <FooterAccordion title="Legal" links={footerLinks.legal} />
            <FooterAccordion title="Support" links={footerLinks.support} />
          </div>
        </div>

        {/* Social & Security Section */}
        <div className="pt-12 border-t border-white/5 mb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Social Media */}
            <div className="flex flex-wrap justify-center gap-4">
              {socialIcons.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10 transition-all relative group"
                  title={social.name}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {securityBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600 group">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-slate-400 transition-colors">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-slate-600 text-sm text-center md:text-left">
            <p>© 2026 RoyShare. All Rights Reserved.</p>
            <div className="hidden md:block w-1 h-1 rounded-full bg-slate-800" />
            <p className="flex items-center gap-1.5">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for creators.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-500 text-xs font-medium">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/cookie-policy" className="hover:text-white transition-colors">Cookies</a>
            <a href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</a>
            <a href="/dmca" className="hover:text-white transition-colors">DMCA</a>
            <a href="/copyright" className="hover:text-white transition-colors">Copyright</a>
            <a href="/status" className="hover:text-white transition-colors">Status</a>
            <a href="/changelog" className="hover:text-white transition-colors">Changelog</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>

          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-600 text-[10px] font-mono">
            v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
