import React, { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { Download, Share2, Send, MessageCircle, Loader2 } from "lucide-react";
import { formatFriendlyKolkata } from "../lib/dateUtils";

interface WinnerCardGeneratorProps {
  giveaway: any;
  winners: any[];
}

export default function WinnerCardGenerator({ giveaway, winners }: WinnerCardGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const getRankMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "🏅";
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setGenerating(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `giveaway_${giveaway.id}_winners.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Failed to generate high-quality image.");
    } finally {
      setGenerating(false);
    }
  };

  const handleShareTelegram = async () => {
    if (!cardRef.current) return;
    try {
      setGenerating(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      // To share an image on Telegram via URI, we need a URL. Since we have base64, 
      // the best way is to download it and ask user to share, or just share the text if Web Share API doesn't support images well.
      // Let's try native share API if available
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `giveaway_${giveaway.id}_winners.png`, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Giveaway Winners!',
          text: `Here are the winners for ${giveaway.title}!`,
        });
      } else {
        // Fallback to text share
        const text = `🎉 Winners for ${giveaway.title} 🎉\n\n` + 
          winners.map((w, i) => `${getRankMedal(i)} ${w.firstName} - ₹${w.rewardAmount}`).join("\n");
        window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const text = `🎉 Winners for ${giveaway.title} 🎉\n\n` + 
      winners.map((w, i) => `${getRankMedal(i)} ${w.firstName} - ₹${w.rewardAmount}`).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!winners || winners.length === 0) return null;

  return (
    <div className="space-y-4 border border-slate-800 p-4 rounded-2xl bg-slate-900/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-300">Generate Winner Card</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition disabled:opacity-50">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download
          </button>
          <button onClick={handleShareTelegram} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc] hover:bg-[#0077b3] rounded-lg text-xs font-bold text-white transition disabled:opacity-50">
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
          <button onClick={handleShareWhatsApp} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe5d] rounded-lg text-xs font-bold text-white transition disabled:opacity-50">
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        {/* The Card to be captured */}
        <div 
          ref={cardRef} 
          className="w-[400px] flex-shrink-0 bg-gradient-to-b from-[#0b1329] to-[#020617] p-8 rounded-3xl border-2 border-amber-500/20 shadow-2xl relative overflow-hidden"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl"></div>

          <div className="text-center space-y-2 mb-8 relative z-10">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 uppercase tracking-widest drop-shadow-lg">ROY SHARE</h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-[0.3em] uppercase">UPI Giveaway</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-4 rounded-full opacity-50"></div>
          </div>

          <div className="space-y-1 text-center mb-8 relative z-10">
            <h3 className="text-lg font-bold text-white">{giveaway.title}</h3>
            <p className="text-xs text-slate-400">Total Budget: ₹{giveaway.totalBudget} • Winners: {giveaway.totalWinners}</p>
            <p className="text-[10px] text-slate-500">{formatFriendlyKolkata(new Date().toISOString())}</p>
          </div>

          <div className="space-y-3 relative z-10">
            {winners.slice(0, 10).map((winner, index) => (
              <div key={winner.id} className="flex items-center justify-between bg-slate-900/80 border border-slate-700/50 p-3 rounded-xl backdrop-blur-sm shadow-md">
                <div className="flex items-center gap-3">
                  <div className="text-2xl drop-shadow-md">
                    {getRankMedal(index)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{winner.firstName || "Anonymous"}</p>
                    {winner.username && <p className="text-[10px] text-slate-400">@{winner.username}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">₹{winner.rewardAmount}</p>
                </div>
              </div>
            ))}
            {winners.length > 10 && (
              <div className="text-center text-xs text-slate-500 mt-2 italic">
                ...and {winners.length - 10} more winners!
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center relative z-10 border-t border-slate-800/50 pt-4">
            <p className="text-[9px] text-slate-500 font-mono">Generated securely on Roy Share Network</p>
          </div>
        </div>
      </div>
    </div>
  );
}
