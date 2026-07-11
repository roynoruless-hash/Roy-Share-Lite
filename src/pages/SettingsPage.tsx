import React, { useState } from "react";
import { motion } from "motion/react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { 
  Settings, 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Wallet,
  Check,
  ChevronRight,
  LogOut,
  Mail,
  Smartphone
} from "lucide-react";

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { user } = useTelegramAuth();
  const [notifications, setNotifications] = useState(true);

  const sections = [
    {
      title: "Account Details",
      items: [
        { label: "Full Name", value: user?.enteredName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(), icon: User },
        { label: "Telegram ID", value: user?.id, icon: Smartphone },
        { label: "Referral Code", value: user?.referralCode, icon: Shield },
      ]
    },
    {
      title: "Wallet & Security",
      items: [
        { label: "Payment Level", value: user?.level || "Bronze", icon: Wallet },
        { label: "Verified Status", value: user?.membershipVerified ? "Verified" : "Unverified", icon: Check, color: "text-emerald-400" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-slate-400" /> Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium">Manage your account preferences</p>
          </div>
        </header>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">{section.title}</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
                {section.items.map((item, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors ${i !== section.items.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-400 border border-white/5">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                        <p className={`text-sm font-bold mt-0.5 ${item.color || 'text-white'}`}>{item.value || "Not Set"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">Preferences</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
              <button 
                onClick={() => setNotifications(!notifications)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Push Notifications</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Alerts for rewards and news</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center space-y-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">RoyShare Earn v2.4.0</p>
          <div className="flex items-center justify-center gap-6">
            <a href="/terms" className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors">Terms</a>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <a href="/privacy" className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
