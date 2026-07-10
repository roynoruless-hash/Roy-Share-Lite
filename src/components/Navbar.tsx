import { useState } from "react";
import { MoreVertical, Settings, MessageSquare, Globe, Megaphone, User, Shield, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
      <button onClick={() => setCurrentPage("home")} className="text-xl font-bold text-white">RoyShare Admin</button>
      <div className="relative">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2 hover:bg-white/10 rounded-full"><MoreVertical /></button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-xl border border-white/10 p-2 shadow-2xl">
              <MenuItem icon={MessageSquare} label="Telegram Settings" onClick={() => { setCurrentPage("telegram"); setIsOpen(false); }} />
              <MenuItem icon={Shield} label="Firestore Explorer" onClick={() => { setCurrentPage("firestore"); setIsOpen(false); }} />
              <MenuItem icon={Globe} label="Website Settings" />
              <MenuItem icon={Megaphone} label="Ads Settings" />
              <MenuItem icon={User} label="User Settings" />
              <MenuItem icon={Shield} label="Security Settings" />
              <hr className="border-white/10 my-1" />
              <MenuItem icon={LogOut} label="Logout" onClick={() => {
                localStorage.removeItem("isAdminLoggedIn");
                localStorage.removeItem("loginTime");
                localStorage.removeItem("adminPhoneNumber");
                window.location.href = "/";
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 w-full p-2 text-sm text-white hover:bg-white/10 rounded-lg">
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
