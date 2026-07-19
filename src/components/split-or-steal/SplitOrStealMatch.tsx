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
  const [adStatus, setAdStatus] = useState<"none" | "loading" | "playing" | "fallback" | "failed" | "error">("none");
  const [adMessage, setAdMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings for adFailurePolicy
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "sos"), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        setSettings({ enabled: true, entryFee: 5, prizePool: 20, adFailurePolicy: "fallback" });
      }
    });
    return () => unsub();
  }, []);

  // Proactive recovery on mount
  useEffect(() => {
    if (matchId) {
      fetch(`${API_BASE}/api/split-or-steal/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      }).catch(console.error);
    }
  }, [matchId]);

  // Active match state listener with proper error handling
  useEffect(() => {
    if (!matchId) return;
    const unsub = onSnapshot(doc(db, "sos_matches", matchId), (snap) => {
      if (snap.exists()) setMatch(snap.data());
    }, (err) => {
      console.error("Match listener error:", err);
    });
    return () => unsub();
  }, [matchId]);

  // Messages real-time listener: queries without orderBy to avoid index requirement, sorts in memory
  useEffect(() => {
    if (!matchId) return;
    const q = query(collection(db, "sos_messages"), where("matchId", "==", matchId));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
        return tA - tB;
      });
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (err) => {
      console.error("Messages listener error:", err);
    });
    return () => unsub();
  }, [matchId]);

  // Discussion countdown timer
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

  // AI Opponent polling trigger with interval
  useEffect(() => {
    if (match?.status === "discussion" && match?.player2?.isAI) {
      const interval = setInterval(() => {
        fetch(`${API_BASE}/api/split-or-steal/ai-poll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId })
        }).catch(console.error);
      }, 4000);
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

  // Robust Advertisement flow with loading, checking config, timeout, fallback, and retry capability
  const showAdAndSubmit = async (decision: string) => {
    setPendingDecision(decision);
    setAdStatus("loading");
    setAdMessage("Securing video advertising feed...");

    let adTriggered = false;
    let timeoutId: any = null;

    const finishAndSubmit = () => {
      if (timeoutId) clearTimeout(timeoutId);
      setAdStatus("none");
      submitDecision(decision, true);
    };

    const runFallbackAd = (reason: string) => {
      console.log(`Running simulated fallback ad due to: ${reason}`);
      setAdStatus("fallback");
      setAdMessage(`${reason}. Running high-security validation backup...`);
      setTimeout(() => {
        finishAndSubmit();
      }, 3000);
    };

    const handleAdFailurePolicy = (reason: string) => {
      console.log(`Ad playback failed/timed out: ${reason}`);
      const policy = settings?.adFailurePolicy || "fallback";

      if (policy === "cancel") {
        setAdStatus("loading");
        setAdMessage("Ad failure. Cancelling match and refunding entry fee...");
        fetch(`${API_BASE}/api/split-or-steal/refund-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId: user?.telegramId, matchId })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdStatus("none");
          } else {
            runFallbackAd(reason);
          }
        })
        .catch(() => {
          runFallbackAd(reason);
        });
      } else if (policy === "retry") {
        setAdStatus("error");
        setAdMessage(`${reason}. The administrator requires ad completion to secure the prize pool.`);
      } else {
        runFallbackAd(reason);
      }
    };

    try {
      const configRes = await fetch("/api/adsbitvex-config").catch(() => null);
      if (!configRes || !configRes.ok) {
        handleAdFailurePolicy("Ad gateway offline");
        return;
      }

      const configData = await configRes.json().catch(() => null);
      if (!configData || !configData.masterEnabled) {
        handleAdFailurePolicy("Ad service bypassed by administrator");
        return;
      }

      const showAdFn = (window as any).showadsbitvex;
      if (typeof showAdFn !== "function") {
        handleAdFailurePolicy("Ad blocker detected or SDK not loaded");
        return;
      }

      timeoutId = setTimeout(() => {
        if (!adTriggered) {
          console.warn("Ad load timed out. Running backup countdown.");
          handleAdFailurePolicy("Ad stream timed out");
        }
      }, 6000);

      setAdStatus("playing");
      setAdMessage("Ad Playing... Please wait while we verify your secure handshake.");
      
      await showAdFn();
      adTriggered = true;
      finishAndSubmit();

    } catch (err: any) {
      console.error("Ad loading/playback failed:", err);
      handleAdFailurePolicy("Ad network failed");
    }
  };

  const submitDecision = async (decision: string, adCompleted?: boolean) => {
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/split-or-steal/submit-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user?.telegramId, matchId, decision, adCompleted })
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

  // Robust Countdown Processor: both clients trigger result-processing to avoid freezing on a disconnected P1
  useEffect(() => {
    if (revealCountdown !== null && revealCountdown > 0) {
      const timer = setTimeout(() => setRevealCountdown(revealCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (revealCountdown === 0) {
      fetch(`${API_BASE}/api/split-or-steal/process-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      }).catch(console.error);
    }
  }, [revealCountdown, matchId]);

  // Backup auto-processor
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

  // Backup default auto-submission of Split if the player doesn't choose
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

  const handleBackClick = () => {
    if (match?.status === "completed" || match?.status === "cancelled") {
      onBack();
    } else {
      setShowExitConfirm(true);
    }
  };

  if (!match || !myPublicCode) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  // Render Advertisement secure screen
  if (adStatus !== "none") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] text-white p-6">
        <div className="text-center max-w-sm">
          {adStatus === "error" ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-3xl font-bold">⚠️</div>
              <h2 className="text-2xl font-black tracking-tight text-rose-500">Handshake Failed</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{adMessage}</p>
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={() => {
                    setAdStatus("none");
                    showAdAndSubmit(pendingDecision || "split");
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition"
                >
                  Retry Ad Load
                </button>
                <button 
                  onClick={() => {
                    setAdStatus("loading");
                    setAdMessage("Cancelling match and refunding entry fee...");
                    fetch(`${API_BASE}/api/split-or-steal/refund-match`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ telegramId: user?.telegramId, matchId })
                    })
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        setAdStatus("none");
                      } else {
                        setAdStatus("error");
                        setAdMessage("Failed to refund. Please try again.");
                      }
                    })
                    .catch(() => {
                      setAdStatus("error");
                      setAdMessage("Network error during refund.");
                    });
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition"
                >
                  Cancel & Refund Match
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-black tracking-tight">Securing Handshake</h2>
              <p className="text-slate-400 mt-2 text-sm">{adMessage}</p>
              {adStatus === "fallback" && (
                <div className="mt-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl animate-pulse">
                  Ad server bypass mode enabled to protect match.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackClick}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors mr-1"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg">
            {oppData.isAI ? "🤖" : <EyeOff className="w-5 h-5 text-slate-400" />}
          </div>
          <div>
            <h2 className="font-bold">Opponent: {oppData.publicCode}</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> {oppData.isAI ? "AI Opponent" : "Online"}
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

      {/* MATCH CANCELLED */}
      {match.status === "cancelled" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mb-6 text-rose-500 text-4xl">
            🚫
          </div>
          <h1 className="text-4xl font-black mb-4 text-rose-500">Match Cancelled</h1>
          <p className="text-slate-400 mb-12 max-w-sm leading-relaxed">
            {match.cancelledReason || "This match was cancelled due to connectivity or ad playback failure. Your entry fee has been fully refunded to your balance."}
          </p>
          <button onClick={onBack} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">
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
            
            {/* AI Typing Indicator */}
            {match?.player2Typing && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}

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
                className="p-8 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-3xl transition group animate-in fade-in slide-in-from-bottom duration-300"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
                <div className="font-black text-xl text-blue-400">SPLIT</div>
                <div className="text-xs text-slate-500 mt-2">Share the prize</div>
              </button>
              
              <button 
                onClick={() => showAdAndSubmit("steal")}
                disabled={submitting}
                className="p-8 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-3xl transition group animate-in fade-in slide-in-from-bottom duration-300 delay-75"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">😈</div>
                <div className="font-black text-xl text-rose-500">STEAL</div>
                <div className="text-xs text-slate-500 mt-2">Take it all</div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Back Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-center mb-3">Leave Active Match?</h3>
            <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
              The match will continue in the background. You can reconnect from the dashboard, but make sure to return before the timer ends so you don't miss the decision window!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
              >
                Stay & Play
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false);
                  onBack();
                }}
                className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition"
              >
                Leave Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
