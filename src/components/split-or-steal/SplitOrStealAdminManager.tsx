import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Eye, Loader2, Users } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SplitOrStealAdminManager() {
  const [settings, setSettings] = useState<any>({
    enabled: true,
    aiEnabled: true,
    humanWaitTime: 15,
    discussionTimer: 60,
    decisionTimer: 15,
    rewardAdRequired: true,
    entryFee: 5,
    prizePool: 20,
    platformSponsoredAmount: 10,
    refundRules: "both",
    adFailurePolicy: "fallback"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "settings", "sos"));
      if (snap.exists()) {
        setSettings({ ...settings, ...snap.data() });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await setDoc(doc(db, "settings", "sos"), settings);
      setMsg("Settings saved successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setMsg("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden text-white">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-blue-400" /> Split or Steal Settings</h2>
          <p className="text-sm text-slate-400 mt-1">Configure matchmaking, AI, and economy for the game.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Core Settings */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-800 pb-2">Core Settings</h3>
          
          <label className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer">
            <div>
              <div className="font-bold">Enable Module</div>
              <div className="text-xs text-slate-500">Allow users to play Split or Steal</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, enabled: !settings.enabled})}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer">
            <div>
              <div className="font-bold">Enable AI Opponents</div>
              <div className="text-xs text-slate-500">Use AI if no human is found</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.aiEnabled ? 'bg-blue-500' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, aiEnabled: !settings.aiEnabled})}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </label>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400">Human Wait Time (Seconds)</label>
              <input type="number" value={settings.humanWaitTime} onChange={e => setSettings({...settings, humanWaitTime: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Discussion Timer (Seconds)</label>
              <input type="number" value={settings.discussionTimer} onChange={e => setSettings({...settings, discussionTimer: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Ad Failure / Timeout Policy</label>
              <select 
                value={settings.adFailurePolicy || "fallback"} 
                onChange={e => setSettings({...settings, adFailurePolicy: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-blue-500 text-white"
              >
                <option value="fallback">Bypass & Run Fallback Ad</option>
                <option value="cancel">Cancel Match & Refund Fee</option>
                <option value="retry">Require Completion / Retry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Economy */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-800 pb-2">Economy</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400">Entry Fee (₹)</label>
              <input type="number" value={settings.entryFee} onChange={e => setSettings({...settings, entryFee: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Prize Pool (₹)</label>
              <input type="number" value={settings.prizePool} onChange={e => setSettings({...settings, prizePool: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Platform Sponsored Amount (₹)</label>
              <input type="number" value={settings.platformSponsoredAmount} onChange={e => setSettings({...settings, platformSponsoredAmount: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mt-1 outline-none focus:border-blue-500" />
              <p className="text-[10px] text-slate-500 mt-1">If both split, each gets half of Prize Pool. Usually Prize Pool = (Entry Fee * 2) + Sponsored</p>
            </div>
          </div>
        </div>
      </div>
      
      {msg && (
        <div className="p-4 mx-6 mb-6 bg-slate-800 border border-slate-700 rounded-xl text-center font-bold text-blue-400">
          {msg}
        </div>
      )}
    </div>
  );
}
