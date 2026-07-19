import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, ShieldAlert, AlertTriangle, EyeOff, Loader2 } from "lucide-react";
import { useTelegramAuth } from "../../context/TelegramAuthContext";
import { db } from "../../lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { API_BASE } from "../../config/api";

const BLOCKED_WORDS = ["split", "steal", "trust me", "vote split", "vote steal", "@", "t.me", "http", "www", ".com", "instagram", "whatsapp", "discord"];

export default function SplitOrStealMatch({ matchId, onBack }: { matchId: string, onBack: () => void }) {
  const { user } = useTelegramAuth();
  const [myPublicCode, setMyPublicCode] = useState<string | null>(null);

  useEffect(() => {
    if (user?.telegramId) {
      const getCode = async () => {
        const msgUint8 = new TextEncoder().encode(String(user.telegramId));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setMyPublicCode("RS" + hashHex.substring(0, 5).toUpperCase());
      };
      getCode();
    }
  }, [user?.telegramId]);

  const [match, setMatch] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [adShown, setAdShown] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;
    const unsub = onSnapshot(doc(db, "sos_matches", matchId), (snap) => {
      if (snap.exists()) setMatch(snap.data());
    });
    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    const q = query(collection(db, "sos_messages"), where("matchId", "==", matchId), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    if (match?.status === "discussion" && match.discussionEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((match.discussionEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [match]);

  useEffect(() => {
    if (match?.status === "discussion" && match?.player2?.isAI) {
      const interval = setInterval(() => {
        fetch(`${API_BASE}/api/split-or-steal/ai-poll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId })
        }).catch(console.error);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [match]);

  const sanitizeMessage = (text: string) => {
    let lower = text.toLowerCase();
    
    if (["split", "steal", "trust", "vote"].some(w => lower.includes(w))) {
      return "Decision related messages are not allowed.";
    }

    const hasPhone = /\+?\d{10,14}/.test(text);
    const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);
    
    if (hasPhone || hasEmail) {
      return "This message violates community rules.";
    }

    for (const word of ["@", "t.me", "http", "www", ".com", "instagram", "whatsapp", "discord", "qr"]) {
      if (lower.includes(word)) {
        return "This message violates community rules.";
      }
    }
    return text;
  };

  const [lastMsgTime, setLastMsgTime] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (match?.status !== "discussion") return;
    
    if (msgCount >= 20) {
      alert("Message limit reached.");
      return;
    }

    if (Date.now() - lastMsgTime < 2000) {
      alert("Slow down! Please wait before sending another message.");
      return;
    }

    const myCode = myPublicCode;
    const finalMsg = sanitizeMessage(inputText.trim());

    setLastMsgTime(Date.now());
    setMsgCount(prev => prev + 1);
    setInputText("");
    await fetch(`${API_BASE}/api/split-or-steal/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: user?.telegramId, matchId, text: finalMsg })
    }).catch(console.error);
  };

  const showAdAndSubmit = async (decision: string) => {
    // Simulated Ad
    setAdShown(true);
    setTimeout(() => {
      setAdCompleted(true);
      setAdShown(false);
      submitDecision(decision);
    }, 3000);
  };

  const submitDecision = async (decision: string) => {
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/split-or-steal/submit-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user?.telegramId, matchId, decision })
      });
    } catch (e) {
      console.error(e);
      setError("Failed to submit decision");
    } finally {
      setSubmitting(false);
    }
  };

  const isP1 = match?.player1?.publicCode === myPublicCode;
  const myData = isP1 ? match?.player1 : match?.player2;
  const oppData = isP1 ? match?.player2 : match?.player1;
  const mySubmitted = isP1 ? match?.player1Submitted : match?.player2Submitted;

  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (match?.status === "revealing" && revealCountdown === null) {
      setRevealCountdown(3);
    }
  }, [match?.status]);

  useEffect(() => {
    if (revealCountdown !== null && revealCountdown > 0) {
      const timer = setTimeout(() => setRevealCountdown(revealCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (revealCountdown === 0) {
      if (isP1) {
        fetch(`${API_BASE}/api/split-or-steal/process-result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId })
        }).catch(console.error);
      }
    }
  }, [revealCountdown, matchId, isP1]);

  useEffect(() => {
    if (mySubmitted && match?.status !== "completed" && match?.status !== "revealing") {
      const interval = setInterval(() => {
        if (match.decisionEndTime && Date.now() > match.decisionEndTime + 5000) {
           fetch(`${API_BASE}/api/split-or-steal/process-result`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ matchId })
           });
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mySubmitted, match]);

  useEffect(() => {
    if ((match?.status === "discussion" && timeLeft === 0) || match?.status === "decision") {
      const interval = setInterval(() => {
        if (match.decisionEndTime && Date.now() > match.decisionEndTime && !mySubmitted && !submitting) {
          submitDecision("split");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [match, timeLeft, myData, submitting]);





  if (!match || !myPublicCode) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;



  if (adShown) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Advertisement</h2>
          <p className="text-slate-400 mt-2">Please wait while we secure your decision...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
            <EyeOff className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="font-bold">Opponent: {oppData.publicCode}</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Online
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Time Left</div>
          <div className={`text-xl font-black font-mono ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* MATCH COMPLETED */}
      {match.status === "completed" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl font-black mb-8">Results</h1>
          
          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-2">You</div>
              <div className={`text-3xl mb-2 ${myData.decision === 'split' ? 'text-blue-400' : 'text-rose-500'}`}>
                {myData.decision === 'split' ? '🤝' : '😈'}
              </div>
              <div className="font-bold text-lg capitalize">{myData.decision}</div>
              <div className="text-emerald-400 font-bold mt-2 text-xl">
                +₹{isP1 ? match.p1Win : match.p2Win}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-2">Opponent</div>
              <div className={`text-3xl mb-2 ${oppData.decision === 'split' ? 'text-blue-400' : 'text-rose-500'}`}>
                {oppData.decision === 'split' ? '🤝' : '😈'}
              </div>
              <div className="font-bold text-lg capitalize">{oppData.decision}</div>
              <div className="text-emerald-400 font-bold mt-2 text-xl">
                +₹{isP1 ? match.p2Win : match.p1Win}
              </div>
            </div>
          </div>

          <button onClick={onBack} className="mt-12 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">
            Back to Dashboard
          </button>
        </div>
      )}

      {/* DISCUSSION */}
      {match.status === "discussion" && timeLeft > 0 && (
        <>
          <div className="p-2 bg-rose-500/10 text-rose-400 text-xs text-center border-b border-rose-500/20 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Decision words and personal info will be blocked.
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center text-xs text-slate-500 my-4">Discussion Started. Do not share personal info.</div>
            {messages.map(m => {
              const isMine = m.senderId === myData.publicCode;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white focus:border-blue-500 outline-none"
              maxLength={100}
            />
            <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 bg-blue-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </>
      )}

      {/* REVEALING */}
      {match.status === "revealing" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
          <h2 className="text-3xl font-black mb-8 text-amber-400">Revealing...</h2>
          {revealCountdown !== null && revealCountdown > 0 ? (
            <div className="text-8xl font-black text-white animate-ping">{revealCountdown}</div>
          ) : (
            <div className="text-5xl font-black text-white animate-pulse">Wait...</div>
          )}
        </div>
      )}

      {/* DECISION */}
      {(match.status === "decision" || (match.status === "discussion" && timeLeft === 0)) && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-black mb-2">Time's Up</h2>
          <p className="text-slate-400 mb-12">Make your final decision.</p>

          {mySubmitted ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-bold text-slate-300">Waiting for opponent...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <button 
                onClick={() => showAdAndSubmit("split")}
                disabled={submitting}
                className="p-8 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-3xl transition group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
                <div className="font-black text-xl text-blue-400">SPLIT</div>
                <div className="text-xs text-slate-500 mt-2">Share the prize</div>
              </button>
              
              <button 
                onClick={() => showAdAndSubmit("steal")}
                disabled={submitting}
                className="p-8 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-3xl transition group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">😈</div>
                <div className="font-black text-xl text-rose-500">STEAL</div>
                <div className="text-xs text-slate-500 mt-2">Take it all</div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
