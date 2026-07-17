import { useState, useEffect } from "react";
import { X, Shield, ShieldAlert, Ban, MessageSquare, Wallet, History, FileText, Link as LinkIcon, Users, Calendar, Phone, AtSign, Plus, Minus, Gift, CreditCard, Lock, Unlock, Edit, Check, AlertCircle, RefreshCw } from "lucide-react";

export default function UserDetailsModal({ user, onClose, onAction }: { user: any, onClose: () => void, onAction: (id: string, action: string, input?: any) => void }) {
  const [activeTab, setActiveTab] = useState("Details");
  const [modalInput, setModalInput] = useState<{ amount: number, reason: string }>({ amount: 0, reason: "" });
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "History") {
      setLoadingHistory(true);
      fetch(`/api/admin/users/${user.id}/transactions`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTransactions(data.transactions || []);
          }
          setLoadingHistory(false);
        })
        .catch(err => {
          console.error("Error loading user history:", err);
          setLoadingHistory(false);
        });
    }
  }, [activeTab, user.id]);

  const handleSaveNotes = async (txId: string) => {
    setSavingNotesId(txId);
    try {
      const res = await fetch(`/api/admin/transactions/${txId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: editingNotes })
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(prev => prev.map(t => t.transactionId === txId ? { ...t, adminNotes: editingNotes } : t));
        setEditingTxId(null);
      } else {
        alert(data.error || "Failed to update notes");
      }
    } catch (e: any) {
      console.error("Error saving notes:", e);
      alert("Error saving notes: " + e.message);
    } finally {
      setSavingNotesId(null);
    }
  };

  if (!user) return null;

  const tabs = ["Details", "Wallet", "History", "Files/Links"];

  const confirmAction = (action: string) => {
    onAction(user.id, action, JSON.stringify(modalInput));
    setShowConfirm(null);
    setModalInput({ amount: 0, reason: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">👤 User: {user.username || user.telegramId}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition"><X size={18} /></button>
        </div>

        <div className="flex gap-2 border-b border-slate-800 pb-2">
            {tabs.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-400"}`}>{t}</button>)}
        </div>

        {activeTab === "Details" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Name</label><p>{user.firstName} {user.lastName}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Telegram Username</label><p className="flex items-center gap-1"><AtSign size={14}/> {user.username || "N/A"}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Telegram ID</label><p className="font-mono text-indigo-400">{user.id}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Phone</label><p className="flex items-center gap-1"><Phone size={14}/> {user.phoneNumber || "N/A"}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Registered</label><p className="flex items-center gap-1"><Calendar size={14}/> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Account Age</label><p>{user.createdAt ? `${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} Days` : "N/A"}</p></div>
                <div className="col-span-2"><label className="text-slate-500 font-bold uppercase text-[10px]">Last Active</label><p>{user.lastActive ? new Date(user.lastActive).toLocaleString() : "N/A"}</p></div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">🛡️ Trust Score & Security Metrics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 font-medium text-[10px] uppercase">Trust Score</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-indigo-400">{user.trustScore !== undefined ? user.trustScore : 50}</span>
                    <span className="text-slate-500 text-xs">/100</span>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${
                    (user.trustScore ?? 50) >= 80 ? "text-emerald-400" :
                    (user.trustScore ?? 50) >= 60 ? "text-blue-400" :
                    (user.trustScore ?? 50) >= 40 ? "text-amber-400" :
                    (user.trustScore ?? 50) >= 20 ? "text-orange-400" : "text-red-400"
                  }`}>
                    {(user.trustScore ?? 50) >= 80 ? "🟢 Trusted" :
                     (user.trustScore ?? 50) >= 60 ? "🟡 Verified" :
                     (user.trustScore ?? 50) >= 40 ? "🟠 Watchlist" :
                     (user.trustScore ?? 50) >= 20 ? "🔴 High Risk" : "⚫ Restricted"}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 font-medium text-[10px] uppercase">Fraud Score</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${(user.fraudScore ?? 0) >= 50 ? "text-red-400" : "text-emerald-400"}`}>{user.fraudScore ?? 0}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Suspicion Index</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 font-medium text-[10px] uppercase">Success Rate</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-emerald-400">{user.successRate !== undefined ? `${user.successRate}%` : "100%"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Withdrawal payout</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 font-medium text-[10px] uppercase">Task Completion</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-emerald-400">{user.taskCompletionRate !== undefined ? `${user.taskCompletionRate}%` : "100%"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Verified campaigns</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">💰 Earnings Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 font-medium text-[10px] uppercase">Lifetime Earnings</span>
                  <p className="text-lg font-bold text-emerald-400">₹{user.totalEarnings || user.earnings || 0}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 font-medium text-[10px] uppercase">Lifetime Withdrawals</span>
                  <p className="text-lg font-bold text-red-400">₹{user.withdrawnAmount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Wallet" && (
            <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl text-center"><p className="text-slate-500 text-xs">Balance</p><p className="text-3xl font-bold text-emerald-400">₹{user.availableBalance}</p></div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        {action: "add_balance", label: "Add", icon: Plus, bg: "bg-emerald-600"},
                        {action: "deduct_balance", label: "Deduct", icon: Minus, bg: "bg-red-600"},
                        {action: "add_bonus", label: "Bonus", icon: Gift, bg: "bg-purple-600"},
                        {action: "add_reward", label: "Reward", icon: CreditCard, bg: "bg-blue-600"},
                        {action: "freeze", label: "Freeze", icon: Lock, bg: "bg-amber-600"},
                        {action: "unfreeze", label: "Unfreeze", icon: Unlock, bg: "bg-indigo-600"},
                    ].map(btn => (
                        <button key={btn.action} onClick={() => setShowConfirm(btn.action)} className={`${btn.bg} flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs`}>
                            <btn.icon size={16}/> {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {activeTab === "History" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <History size={16} className="text-indigo-400" /> Transaction Ledger
              </h4>
              <button 
                onClick={() => {
                  setLoadingHistory(true);
                  fetch(`/api/admin/users/${user.id}/transactions`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) setTransactions(data.transactions || []);
                      setLoadingHistory(false);
                    })
                    .catch(() => setLoadingHistory(false));
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                <RefreshCw size={12} className={loadingHistory ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-indigo-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-800">
                <AlertCircle size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm italic">No wallet transactions found for this user.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {transactions.map((tx) => {
                  const isCredit = tx.creditDebit === "Credit";
                  const formattedDate = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A";
                  
                  return (
                    <div key={tx.transactionId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isCredit ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {isCredit ? "Credit" : "Debit"}
                          </span>
                          <span className="text-xs font-semibold text-white bg-slate-800 px-2 py-1 rounded-lg">
                            {tx.source || "Transaction"}
                          </span>
                          {tx.eventName && (
                            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                              🎡 {tx.eventName}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.status === "Completed" ? "bg-emerald-500/20 text-emerald-400" :
                            tx.status === "Pending" || tx.status === "Processing" ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {tx.status || "Completed"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 font-medium">{tx.description}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span><b>ID:</b> <code className="text-slate-400">{tx.transactionId}</code></span>
                          <span><b>Date:</b> {formattedDate}</span>
                        </div>

                        {/* Admin Notes Box */}
                        <div className="mt-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Admin Notes</span>
                            {editingTxId === tx.transactionId ? (
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleSaveNotes(tx.transactionId)}
                                  disabled={savingNotesId === tx.transactionId}
                                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-semibold animate-none"
                                >
                                  {savingNotesId === tx.transactionId ? "Saving..." : <span className="flex items-center gap-0.5"><Check size={12} /> Save</span>}
                                </button>
                                <button 
                                  onClick={() => setEditingTxId(null)}
                                  className="text-slate-400 hover:text-slate-300 font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingTxId(tx.transactionId);
                                  setEditingNotes(tx.adminNotes || "");
                                }}
                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                              >
                                <Edit size={10} /> Edit Notes
                              </button>
                            )}
                          </div>

                          {editingTxId === tx.transactionId ? (
                            <input 
                              type="text"
                              value={editingNotes}
                              onChange={(e) => setEditingNotes(e.target.value)}
                              placeholder="Add admin notes (e.g. payout reference or review details)..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
                            />
                          ) : (
                            <p className={`${tx.adminNotes ? "text-slate-300" : "text-slate-600 italic"}`}>
                              {tx.adminNotes || "No admin notes recorded."}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-center min-w-[80px]">
                        <span className={`text-lg font-black ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                          {isCredit ? "+" : "-"}₹{tx.amount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "Files/Links" && (
          <div className="text-slate-400 text-sm italic bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
            No files or custom links created by this user yet.
          </div>
        )}

        <div className="border-t border-slate-800 pt-4 flex gap-3">
            <button onClick={() => onAction(user.id, user.status === "Banned" ? "unban_user" : "ban_user")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold ${user.status === "Banned" ? "bg-emerald-600" : "bg-red-600"}`}>
                {user.status === "Banned" ? <Shield size={16}/> : <Ban size={16}/>}
                {user.status === "Banned" ? "Unban" : "Ban User"}
            </button>
            <button onClick={() => onAction(user.id, "message_user")} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold bg-indigo-600">
                <MessageSquare size={16}/> Message
            </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm space-y-4">
                    <h4 className="font-bold">Confirm {showConfirm}</h4>
                    {["add_balance", "deduct_balance", "add_bonus", "add_reward"].includes(showConfirm) && (
                        <input type="number" placeholder="Amount" className="w-full bg-slate-950 p-2 rounded" onChange={e => setModalInput({...modalInput, amount: Number(e.target.value)})} />
                    )}
                    <input type="text" placeholder="Reason" className="w-full bg-slate-950 p-2 rounded" onChange={e => setModalInput({...modalInput, reason: e.target.value})} />
                    <div className="flex gap-2">
                        <button onClick={() => setShowConfirm(null)} className="flex-1 bg-slate-700 py-2 rounded">Cancel</button>
                        <button onClick={() => confirmAction(showConfirm)} className="flex-1 bg-emerald-600 py-2 rounded">Confirm</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
