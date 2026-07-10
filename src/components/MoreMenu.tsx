import React, { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MoreVertical, 
  X, 
  Home, 
  User, 
  HelpCircle, 
  MessageSquare, 
  ShieldCheck, 
  FileText, 
  Cookie, 
  AlertCircle, 
  Mail, 
  Shield, 
  Map, 
  History, 
  Activity,
  Send,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ChevronRight,
  Gift
} from "lucide-react";

const menuItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "About Us", icon: User, href: "/about" },
  { name: "Help Center", icon: HelpCircle, href: "/help" },
  { name: "FAQ", icon: MessageSquare, href: "/faq" },
  { name: "Contact Support", icon: Mail, href: "/contact" },
  { name: "Privacy Policy", icon: ShieldCheck, href: "/privacy" },
  { name: "Terms & Conditions", icon: FileText, href: "/terms" },
  { name: "Cookie Policy", icon: Cookie, href: "/cookie-policy" },
  { name: "Disclaimer", icon: AlertCircle, href: "/disclaimer" },
  { name: "DMCA Policy", icon: Shield, href: "/dmca" },
  { name: "Copyright Policy", icon: Shield, href: "/copyright" },
  { name: "Acceptable Use Policy", icon: Shield, href: "/acceptable-use" },
  { name: "Roadmap", icon: Map, href: "/roadmap" },
  { name: "Changelog", icon: History, href: "/changelog" },
  { name: "System Status", icon: Activity, href: "/status" },
];

const socialLinks = [
  { icon: Send, href: "https://t.me/royshare_official", name: "Telegram" },
  { icon: Instagram, href: "https://www.instagram.com/royshare_official", name: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61591256922373", name: "Facebook" },
  { icon: MessageSquare, href: "https://discord.gg/2Q2CSmFk", name: "Discord" },
  { icon: Youtube, href: "https://youtube.com/@royshare", name: "YouTube" },
  { icon: Twitter, href: "https://x.com/RoyShare_0", name: "X (Twitter)" },
];

const MoreMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed top-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMenu}
          className="w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl hover:bg-white/20 transition-all group"
          aria-label="More Menu"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="more"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <MoreVertical className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45]"
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[320px] bg-slate-950/80 border-l border-white/10 backdrop-blur-2xl z-[48] shadow-2xl overflow-y-auto scrollbar-hide flex flex-col"
          >
            {/* Header Area (Padding for toggle button) */}
            <div className="h-24 shrink-0" />

            {/* Menu Items */}
            <div className="flex-1 px-4 py-4 space-y-1">
              <div className="px-4 mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Navigation</h3>
              </div>
              
              {menuItems.map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                      <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                    </div>
                    <span className="text-slate-200 font-medium text-sm group-hover:text-white">{item.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors" />
                </motion.a>
              ))}
            </div>

            {/* Bottom Info Section */}
            <div className="p-8 border-t border-white/5 bg-white/[0.02]">
              {/* Socials */}
              <div className="flex justify-between items-center mb-8">
                {socialLinks.map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    whileHover={{ scale: 1.2, y: -2 }}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>

              {/* Version & Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Version</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono tracking-tighter">1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Status</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 text-[9px] font-bold uppercase">All Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(MoreMenu);
