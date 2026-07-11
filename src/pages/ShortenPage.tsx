import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { API_BASE } from "../config/api";
import { 
  Link as LinkIcon, 
  ArrowLeft, 
  Scissors, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function ShortenPage({ onBack }: { onBack: () => void }) {
  const { user } = useTelegramAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: url.trim(),
          userId: user?.id,
          source: "miniapp"
        }),
      });
      const data = await res.json();
      if (res.ok && data.shortUrl) {
        setResult(data.shortUrl);
      } else {
        setError(data.error || "Failed to shorten URL. Please check the format.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <LinkIcon className="w-6 h-6 text-indigo-500" /> URL Shortener
            </h1>
            <p className="text-xs text-slate-500 font-medium">Create monetizeable smart links</p>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none">
            <Zap className="w-32 h-32" />
          </div>

          <form onSubmit={handleShorten} className="space-y-6 relative">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Long URL</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ExternalLink className="w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very-long-link-here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Scissors className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Shorten & Monetize
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 pt-4 border-t border-slate-800"
              >
                <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Your Smart Link is Ready
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-2xl group">
                  <div className="flex-1 px-4 py-2 font-mono text-sm text-indigo-400 truncate select-all">
                    {result}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pro Tip</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Share this link on Telegram, WhatsApp, or Social Media. You earn <span className="text-white font-bold">₹50 - ₹150</span> for every 1,000 views!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
            <h4 className="text-sm font-bold text-white">Smart Redirect</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Multi-page verification system ensures maximum payout for your traffic.</p>
          </div>
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
            <h4 className="text-sm font-bold text-white">Direct Monetization</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Earnings are credited to your wallet instantly upon successful verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
