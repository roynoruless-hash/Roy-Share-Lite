import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, MessageSquare, Bot, AlertCircle, FileText, Send, 
  Upload, CheckCircle, RefreshCw, Trash2, Mail, ExternalLink,
  ChevronRight, Sparkles, X, AlertTriangle, ShieldCheck, FolderOpen
} from "lucide-react";

interface TicketReply {
  sender: "user" | "admin";
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  userId: string;
  name: string;
  username: string;
  subject: string;
  category: string;
  issueType?: string;
  description: string;
  screenshot?: string | null;
  priority: "Low" | "Medium" | "High";
  status: "open" | "in_progress" | "resolved" | "closed" | "replied";
  createdAt: string;
  replies: TicketReply[];
}

interface SupportSettings {
  aiEnabled: boolean;
  liveChatEnabled: boolean;
  supportTelegram: string;
  supportEmail: string;
}

export default function CustomerSupportPage() {
  const [userId, setUserId] = useState<string>("123456");
  const [username, setUsername] = useState<string>("guest_user");
  const [firstName, setFirstName] = useState<string>("Guest User");
  const [loading, setLoading] = useState<boolean>(true);
  
  // Settings from admin
  const [settings, setSettings] = useState<SupportSettings>({
    aiEnabled: true,
    liveChatEnabled: true,
    supportTelegram: "Roysharearn_bot",
    supportEmail: "support@royshare.in"
  });

  // User tickets list
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Active view modals
  const [activeModal, setActiveModal] = useState<"none" | "live_support" | "ticket_form" | "tickets_list" | "ticket_detail">("none");

  // Form states for raising a ticket
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Account");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState("");

  // Live Support states (powered by Gemini in the background)
  const [liveMessages, setLiveMessages] = useState<{ sender: "user" | "agent"; text: string; time: string }[]>([
    { sender: "agent", text: "Hello! My name is Sarah from RoyShare Support. How can I assist you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [liveInput, setLiveInput] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [escalatedTicketId, setEscalatedTicketId] = useState("");
  const [solved, setSolved] = useState(false);

  // Ticket reply input
  const [replyInput, setReplyInput] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const liveChatEndRef = useRef<HTMLDivElement>(null);
  const ticketChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Resolve User ID & Info
    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId");
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
    }
    const tgUserId = tg?.initDataUnsafe?.user?.id;
    const tgUserName = tg?.initDataUnsafe?.user?.username;
    const tgFirstName = tg?.initDataUnsafe?.user?.first_name;

    const resolvedId = queryUserId || (tgUserId ? String(tgUserId) : "123456");
    setUserId(resolvedId);
    if (tgUserName) setUsername(tgUserName);
    if (tgFirstName) setFirstName(tgFirstName);

    // Load initial settings and tickets
    Promise.all([
      fetch(`${API_BASE}/api/support/settings`).then(res => res.json()),
      fetch(`${API_BASE}/api/support/tickets?userId=${resolvedId}`).then(res => res.json())
    ]).then(([settingsData, ticketsData]) => {
      if (settingsData) setSettings(settingsData);
      if (Array.isArray(ticketsData)) setTickets(ticketsData);
    }).catch(err => {
      console.error("Error loading support data:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // Poll for admin replies when viewing a ticket
  useEffect(() => {
    if (activeModal !== "ticket_detail" || !selectedTicket) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/support/tickets?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTickets(data);
            const updated = data.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          }
        })
        .catch(err => console.error("Error polling tickets:", err));
    }, 5000);

    return () => clearInterval(interval);
  }, [activeModal, selectedTicket, userId]);

  useEffect(() => {
    if (activeModal === "live_support") liveChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, activeModal]);

  useEffect(() => {
    if (activeModal === "ticket_detail") ticketChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.replies, activeModal]);

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmittingTicket(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: firstName,
          username,
          subject,
          category,
          description,
          screenshot,
          priority
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setGeneratedTicketId(data.ticketId);
        setSubject("");
        setDescription("");
        setScreenshot(null);
        setPriority("Medium");
        loadTickets();
      } else {
        alert(data.error || "Failed to submit ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Server error occurred while submitting ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInput.trim() || liveLoading) return;

    const userMsgText = liveInput;
    setLiveInput("");
    
    const updatedMessages = [
      ...liveMessages,
      { sender: "user" as const, text: userMsgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setLiveMessages(updatedMessages);
    setLiveLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/support/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ sender: m.sender, text: m.text })),
          newMessage: userMsgText,
          userId
        })
      });
      const data = await res.json();

      if (res.ok && data.reply) {
        setLiveMessages(prev => [...prev, { sender: "agent" as const, text: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } else {
        const errorMsg = data.error || "I apologize, I'm experiencing a minor issue retrieving your information right now. Please feel free to escalate this conversation to our senior admin team by clicking 'Escalate to Support Team' above.";
        setLiveMessages(prev => [...prev, { sender: "agent" as const, text: errorMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } catch (err) {
      console.error(err);
      setLiveMessages(prev => [...prev, { sender: "agent" as const, text: "I apologize, I'm experiencing a minor issue retrieving your information right now. Please feel free to escalate this conversation to our senior admin team by clicking 'Escalate to Support Team' above.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLiveLoading(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: firstName,
          username,
          chatHistory: liveMessages
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEscalated(true);
        setEscalatedTicketId(data.ticketId);
        loadTickets();
      } else {
        alert("Failed to escalate chat. Please try creating a ticket directly via 'Create Ticket'.");
      }
    } catch (err) {
      console.error("Escalation error:", err);
      alert("Error escalating conversation. Please submit a support ticket.");
    } finally {
      setEscalating(false);
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicket || replyLoading) return;

    setReplyLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: replyInput
        })
      });

      if (res.ok) {
        const updatedReplies: TicketReply[] = [
          ...(selectedTicket.replies || []),
          {
            sender: "user",
            message: replyInput,
            createdAt: new Date().toISOString()
          }
        ];
        setSelectedTicket({
          ...selectedTicket,
          replies: updatedReplies,
          status: "open"
        });
        setReplyInput("");
        loadTickets();
      } else {
        alert("Failed to send reply");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseWebApp = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.close();
    } else {
      window.location.href = "/";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-500/20">🟡 Open</span>;
      case "in_progress":
        return <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-500/20">🔵 In Progress</span>;
      case "resolved":
        return <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-500/20">🟢 Resolved</span>;
      case "closed":
        return <span className="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-500/20">🔴 Closed</span>;
      case "replied":
        return <span className="bg-violet-500/10 text-violet-400 text-xs px-2.5 py-1 rounded-full font-bold border border-violet-500/20">💬 Replied</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-400 text-xs px-2.5 py-1 rounded-full font-bold border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="p-4 border-b border-slate-900 bg-slate-900/40 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCloseWebApp}
              className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">🎫 RoyShare Support Center</h1>
              <p className="text-xs text-slate-400">Welcome, {firstName} (@{username})</p>
            </div>
          </div>

          <button
            onClick={handleCloseWebApp}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold rounded-xl border border-slate-800 transition"
          >
            Close
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-8">
        
        {/* Support Grid Actions */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">How can we assist you today?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 🎫 Create Ticket */}
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setActiveModal("ticket_form");
              }}
              className="group p-5 bg-slate-900/60 border border-slate-800 rounded-2xl text-left hover:border-violet-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between h-40 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 text-violet-500/20 group-hover:text-violet-500/30 transition-all">
                <FileText className="w-16 h-16" />
              </div>
              <div className="p-2.5 bg-violet-600/10 text-violet-400 rounded-xl w-fit border border-violet-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">🎫 Create Ticket</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Submit a query to our agents.
                </p>
              </div>
            </button>

            {/* 📂 My Tickets */}
            <button
              onClick={() => {
                setActiveModal("tickets_list");
              }}
              className="group p-5 bg-slate-900/60 border border-slate-800 rounded-2xl text-left hover:border-blue-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between h-40 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 text-blue-500/20 group-hover:text-blue-500/30 transition-all">
                <FolderOpen className="w-16 h-16" />
              </div>
              <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl w-fit border border-blue-500/20">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">📂 My Tickets</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Track your active support tickets.
                </p>
              </div>
            </button>

            {/* 📞 Contact Admin */}
            <a
              href={settings.supportTelegram 
                ? (settings.supportTelegram.startsWith("http") 
                    ? settings.supportTelegram 
                    : (settings.supportTelegram.startsWith("@") 
                        ? `https://t.me/${settings.supportTelegram.replace("@", "")}` 
                        : `https://t.me/${settings.supportTelegram}`))
                : `mailto:${settings.supportEmail}?subject=RoyShare%20Support%20Request`}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 bg-slate-900/60 border border-slate-800 rounded-2xl text-left hover:border-amber-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between h-40 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 text-amber-500/20 group-hover:text-amber-500/30 transition-all">
                <Mail className="w-16 h-16" />
              </div>
              <div className="p-2.5 bg-amber-600/10 text-amber-400 rounded-xl w-fit border border-amber-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-1 text-base">
                  📞 Contact Admin <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {settings.supportTelegram ? `Telegram: ${settings.supportTelegram}` : `Email: ${settings.supportEmail}`}
                </p>
              </div>
            </a>

          </div>
        </section>

        {/* User Tickets Dashboard */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">My Support Tickets</h2>
            <button 
              onClick={loadTickets}
              disabled={ticketsLoading}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ticketsLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {ticketsLoading && tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-900/30 border border-slate-900 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-900/50 rounded-2xl flex flex-col items-center justify-center p-6">
              <FileText className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="font-bold text-white">No tickets raised yet</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                If you are experiencing any issues, please click the "Raise Ticket" button above to open a ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setActiveModal("ticket_detail");
                  }}
                  className="w-full text-left bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl flex items-center justify-between gap-4 transition shadow-md hover:bg-slate-900"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {t.ticketId || t.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        t.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-800'
                      }`}>
                        {t.priority} Priority
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base truncate">{t.subject}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>Category: {t.category || t.issueType}</span>
                      <span>•</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(t.status)}
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="p-4 border-t border-slate-900 text-center text-xs text-slate-600">
        RoyShare Support Team © 2026. Fast & Secured.
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        
        {/* 1. LIVE SUPPORT MODAL */}
        {false && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg h-[550px] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-600/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      💬 Live Support Agent
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-slate-500">Fast & Secure Support Specialist</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveModal("none");
                    setEscalated(false);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {escalated ? (
                /* Escalated Success Screen */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-400">Request Received</h4>
                  <div className="text-sm text-slate-300 max-w-md space-y-3 leading-relaxed">
                    <p className="font-semibold text-emerald-400 text-base">✅ Your request has been received successfully.</p>
                    <p className="font-semibold text-slate-100">
                      Your Ticket ID: <span className="font-mono text-indigo-400 text-lg bg-slate-950 px-2 py-0.5 rounded border border-slate-800 ml-1">{escalatedTicketId}</span>
                    </p>
                    <p>Our support team is currently reviewing your issue.</p>
                    <p>Please wait approximately 2 hours while we investigate and resolve it.</p>
                    <p className="text-xs text-slate-400">You will automatically receive a reply here as soon as an update is available.</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal("none");
                      setEscalated(false);
                      // Reset conversation
                      setLiveMessages([
                        { sender: "agent", text: "Hello! My name is Sarah from RoyShare Support. How can I assist you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                      ]);
                    }}
                    className="mt-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Return to Support
                  </button>
                </div>
              ) : solved ? (
                /* Solved Success Screen */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-400">Issue Resolved!</h4>
                  <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
                    🎉 Great! We're glad we could help you resolve your issue. If you need any further assistance, feel free to contact support again.
                  </p>
                  <p className="text-xs text-slate-500">Thank you for using RoyShare!</p>
                  <button
                    onClick={() => {
                      setActiveModal("none");
                      setSolved(false);
                      // Reset conversation
                      setLiveMessages([
                        { sender: "agent", text: "Hello! My name is Sarah from RoyShare Support. How can I assist you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                      ]);
                    }}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Close Support
                  </button>
                </div>
              ) : (
                /* Chat Thread */
                <>
                  {/* Chat messages list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">
                    {liveMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                          msg.sender === 'user' 
                            ? 'bg-emerald-600 text-white rounded-br-none' 
                             : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span className="block text-[9px] text-slate-400/80 text-right mt-1 font-mono">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                    {liveLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-none p-4 text-sm text-slate-400 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                          <span>Support Agent is typing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={liveChatEndRef} />
                  </div>

                  {/* Escalation/Solved Buttons - Show when conversation has active exchanges */}
                  {liveMessages.length >= 3 && (
                    <div className="px-4 py-3 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-center gap-3">
                      <button
                        onClick={handleEscalate}
                        disabled={escalating}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                      >
                        {escalating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Creating Ticket...</span>
                          </>
                        ) : (
                          <>
                            <span>🎫</span> Create Ticket
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setSolved(true)}
                        disabled={escalating}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                      >
                        <span>✅</span> Solved
                      </button>
                    </div>
                  )}

                  {/* Chat Input form */}
                  <form onSubmit={handleSendLiveMessage} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
                    <input 
                      type="text" 
                      value={liveInput}
                      onChange={e => setLiveInput(e.target.value)}
                      placeholder="Type your message here..."
                      disabled={liveLoading}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      type="submit"
                      disabled={!liveInput.trim() || liveLoading}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition disabled:opacity-50 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* 2. RAISE TICKET FORM MODAL */}
        {activeModal === "ticket_form" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-violet-600/10 text-violet-400 rounded-lg border border-violet-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">🎫 Raise New Ticket</h3>
                </div>
                <button 
                  onClick={() => setActiveModal("none")}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {submitSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
                    <h4 className="text-xl font-bold text-emerald-300">Ticket Submitted Successfully</h4>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Your support ticket has been created with ID <strong className="font-mono text-white text-base bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{generatedTicketId}</strong>.
                    </p>
                    <p className="text-xs text-slate-500">We have also sent a confirmation message to your Telegram account.</p>
                    <button
                      onClick={() => setActiveModal("none")}
                      className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRaiseTicket} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Subject</label>
                      <input 
                        type="text" 
                        required
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Brief summary of the issue"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                        >
                          {["Account", "Rewards", "Withdrawal", "Tasks", "Telegram Bot", "Technical Issue", "Other"].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Priority</label>
                        <select
                          value={priority}
                          onChange={e => setPriority(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                        >
                          {["Low", "Medium", "High"].map((pri) => (
                            <option key={pri} value={pri}>{pri}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Detailed Description</label>
                      <textarea
                        required
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Please describe your issue in detail. Provide step-by-step information so we can help you quickly."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Screenshot Upload (Optional)</label>
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl cursor-pointer transition">
                          <Upload className="w-4 h-4 text-violet-400" />
                          <span>Choose File</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="hidden" 
                          />
                        </label>
                        {screenshot ? (
                          <div className="relative w-12 h-12 rounded-lg border border-slate-700 overflow-hidden shrink-0">
                            <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setScreenshot(null)}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No file selected</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold rounded-xl text-sm text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submittingTicket ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Ticket...</span>
                        </>
                      ) : (
                        <span>Submit Ticket</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 3. MY TICKETS LIST MODAL */}
        {activeModal === "tickets_list" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl h-[550px] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">📂 My Support Tickets</h3>
                    <p className="text-[10px] text-slate-500">Track and reply to your tickets</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal("none")}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tickets List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-950/20">
                {ticketsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-sm">Loading your tickets...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="p-4 bg-slate-950 rounded-full border border-slate-850">
                      <FileText className="w-10 h-10 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">No active support tickets</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        If you need custom assistance, create a ticket using the "Create Ticket" card.
                      </p>
                    </div>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setActiveModal("ticket_detail");
                      }}
                      className="w-full p-4 bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80 rounded-xl text-left transition flex justify-between items-center group animate-fade-in"
                    >
                      <div className="space-y-1.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                            {t.ticketId || t.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {t.priority}
                          </span>
                          {getStatusBadge(t.status)}
                        </div>
                        <h4 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition">
                          {t.subject}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {t.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 4. TICKET DETAIL CONVERSATION MODAL */}
        {activeModal === "ticket_detail" && selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ID: {selectedTicket.ticketId || selectedTicket.id.substring(0, 8).toUpperCase()}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-slate-500">Opened on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setActiveModal("none")}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conversation list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">
                {/* Initial Description Card */}
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                    <span>Category: {selectedTicket.category}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      selectedTicket.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                      selectedTicket.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                  
                  {selectedTicket.screenshot && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Attached Screenshot:</p>
                      <a href={selectedTicket.screenshot} target="_blank" rel="noreferrer" className="inline-block relative rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition max-w-[150px]">
                        <img src={selectedTicket.screenshot} alt="Screenshot" className="max-h-24 object-contain" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-800/60 my-4" />

                {/* Conversation replies thread */}
                {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No conversation replies yet. Our staff will respond soon!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedTicket.replies.map((reply, idx) => (
                      <div 
                        key={idx}
                        className={`flex ${reply.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                          reply.sender === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-bl-none'
                        }`}>
                          <div className="text-[10px] uppercase font-bold text-slate-400/80 mb-1">
                            {reply.sender === 'user' ? "You" : "Admin Support"}
                          </div>
                          <p className="whitespace-pre-wrap">{reply.message}</p>
                          <span className="block text-[9px] text-slate-400/80 text-right mt-1.5 font-mono">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={ticketChatEndRef} />
              </div>

              {/* Reply Form */}
              {selectedTicket.status === 'closed' ? (
                <div className="p-4 border-t border-slate-800 bg-slate-900 text-center text-xs text-rose-400 font-semibold flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>This ticket is closed. You can no longer continue the conversation.</span>
                </div>
              ) : (
                <form onSubmit={handleSendTicketReply} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
                  <input 
                    type="text" 
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                    placeholder="Type your reply to our team..."
                    disabled={replyLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    type="submit"
                    disabled={!replyInput.trim() || replyLoading}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-50 shrink-0"
                  >
                    {replyLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
