import { useState } from "react";
import { X, Shield, ShieldAlert, Ban, MessageSquare, Wallet, History, FileText, Link as LinkIcon, Users, Calendar, Phone, AtSign, Plus, Minus, Gift, CreditCard, Lock, Unlock } from "lucide-react";

export default function UserDetailsModal({ user, onClose, onAction }: { user: any, onClose: () => void, onAction: (id: string, action: string, input?: any) => void }) {
  const [activeTab, setActiveTab] = useState("Details");
  const [modalInput, setModalInput] = useState<{ amount: number, reason: string }>({ amount: 0, reason: "" });
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

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
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Name</label><p>{user.firstName} {user.lastName}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Telegram Username</label><p className="flex items-center gap-1"><AtSign size={14}/> {user.username}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Telegram ID</label><p className="font-mono text-indigo-400">{user.id}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Phone</label><p className="flex items-center gap-1"><Phone size={14}/> {user.phoneNumber || "N/A"}</p></div>
                <div><label className="text-slate-500 font-bold uppercase text-[10px]">Registered</label><p className="flex items-center gap-1"><Calendar size={14}/> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p></div>
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

        {/* Simplified History/Files tab */}
        {activeTab !== "Details" && activeTab !== "Wallet" && <div className="text-slate-500 text-sm italic">Feature under development.</div>}

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
