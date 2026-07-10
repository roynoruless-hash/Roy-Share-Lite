import React from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { ProfileSetup } from "../components/ProfileSetup";
import { motion } from "motion/react";
import { ClipboardList, ExternalLink, Award, Info } from "lucide-react";

export const SurveyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useTelegramAuth();

  if (!user) return null;

  if (!user.profileCompleted) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ClipboardList className="w-6 h-6 text-slate-400 rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-white">Survey Profile</h2>
        </header>
        <ProfileSetup />
      </div>
    );
  }

  const displayBalance = (
    (user.fileEarnings || 0) + 
    (user.linkEarnings || 0) + 
    (user.referralEarnings || 0) + 
    (user.bonusBalance !== undefined ? user.bonusBalance : ((user as any).bonus || 0)) + 
    (user.rewardBalance || 0) + 
    (user.balance || 0) - 
    (user.withdrawnAmount !== undefined ? user.withdrawnAmount : ((user as any).totalWithdrawn || 0)) - 
    (user.pendingWithdrawals || 0)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ClipboardList className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold">BitLabs Surveys</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">High Rewards Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold text-blue-400">₹{displayBalance.toLocaleString()}</span>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-3xl p-6"
        >
          <h3 className="text-xl font-bold mb-2">Welcome back, {(user as any).enteredName || user.firstName}!</h3>
          <p className="text-slate-400 text-sm mb-4">Your profile is 100% complete. You are eligible for high-paying surveys from BitLabs.</p>
          <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 w-fit px-3 py-1.5 rounded-full border border-purple-500/20">
            <Info className="w-3 h-3" />
            Tips: Answer honestly to avoid account flags.
          </div>
        </motion.div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Available Surveys</h4>
          
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-pointer"
            onClick={() => window.open(`https://web.bitlabs.ai/?uid=${user.telegramId}&token=YOUR_BITLABS_TOKEN`, "_blank")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white">Daily Survey Router</p>
                <p className="text-xs text-slate-500">Up to ₹500 • 10-15 mins</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </motion.div>

          <div className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">More survey providers coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
};
