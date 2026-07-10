import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "motion/react";

export default function AdminLogin({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setTelegramBotToken(localStorage.getItem("telegramBotToken") || "");
    setTelegramChatId(localStorage.getItem("telegramChatId") || "");
  }, [isOpen]);

  const saveConfig = () => {
    localStorage.setItem("telegramBotToken", telegramBotToken);
    localStorage.setItem("telegramChatId", telegramChatId);
    setStep(2);
    setError("✅ Telegram Connected Successfully");
    setTimeout(() => setError(""), 2000);
  };

  const sendOtp = async () => {
    if (mobile !== "9027671630") {
      setError("❌ Unauthorized");
      return;
    }
    if (isLocked) {
      setError("❌ Locked. Try later.");
      return;
    }
    setLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const res = await fetch(`${API_BASE}/api/telegram/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: telegramBotToken, chatId: telegramChatId, otp: newOtp })
      });
      if (!res.ok) throw new Error("Failed");
      setGeneratedOtp(newOtp);
      setStep(4);
      setError("");
    } catch (e) {
      setError("❌ Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (attempts >= 5) {
      setIsLocked(true);
      setError("❌ Locked for 10 min.");
      setTimeout(() => { setIsLocked(false); setAttempts(0); }, 600000);
      return;
    }
    if (otp === generatedOtp) {
      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

      localStorage.setItem("isAdminLoggedIn", "true");
      localStorage.setItem("loginTime", now.toISOString());
      localStorage.setItem("expiryTime", expiry.toISOString());
      localStorage.setItem("adminPhoneNumber", mobile);
      
      console.log("Session Created");
      
      setError("✅ Login Successful");
      setTimeout(() => window.location.href = "/dashboard/admin", 1000);
    } else {
      setAttempts(a => a + 1);
      setError(`❌ Invalid OTP (${5 - (attempts + 1)} attempts left)`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={onClose}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm p-8 bg-slate-900/90 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Admin Login</h2>
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <input placeholder="Bot Token" className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20" value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} />
                  <input placeholder="Chat ID" className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} />
                  <button onClick={saveConfig} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-100 transition-colors">Save Configuration</button>
                </>
              )}
              {step === 2 && (
                <>
                  <input placeholder="Mobile Number" className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20" value={mobile} onChange={e => setMobile(e.target.value)} />
                  <button onClick={sendOtp} disabled={loading} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50">Send OTP</button>
                </>
              )}
              {step === 4 && (
                <>
                  <input placeholder="Enter OTP" className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20" value={otp} onChange={e => setOtp(e.target.value)} />
                  <button onClick={verifyOtp} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-100 transition-colors">Verify OTP</button>
                </>
              )}
              {error && <p className="mt-4 text-center text-sm font-medium text-white/50">{error}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
