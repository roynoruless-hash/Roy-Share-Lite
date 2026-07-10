import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Save } from "lucide-react";

export default function TelegramConfig() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setBotToken(localStorage.getItem("telegramBotToken") || "");
    setChatId(localStorage.getItem("telegramChatId") || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem("telegramBotToken", botToken);
    localStorage.setItem("telegramChatId", chatId);
    setFeedback("✅ Telegram Connected Successfully");
    setTimeout(() => setFeedback(""), 2000);
  };

  return (
    <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-md">
      <h2 className="text-2xl font-display text-white mb-6">Telegram Configuration</h2>
      
      {feedback && (
        <div className="mb-6 p-4 bg-slate-800 rounded-xl text-white text-sm">
          {feedback}
        </div>
      )}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-400">Telegram Bot Token</label>
        <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} className="w-full p-3 bg-slate-800 rounded-xl border border-white/10 text-white" />
        
        <label className="block text-sm font-medium text-slate-400">Telegram Chat ID</label>
        <input type="text" value={chatId} onChange={e => setChatId(e.target.value)} className="w-full p-3 bg-slate-800 rounded-xl border border-white/10 text-white" />
      </div>

      <div className="mt-8">
        <motion.button whileHover={{scale: 1.05}} onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white font-bold">
            <Save className="w-5 h-5"/> Save Configuration
        </motion.button>
      </div>
    </div>
  );
}
