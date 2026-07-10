import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

export default function ReferralAdminManager({ systemSettings, setSystemSettings }: { systemSettings: any, setSystemSettings: any }) {
  const rs = systemSettings?.referralSettings || {};

  const updateReferralSettings = (updates: any) => {
    setSystemSettings({
      ...systemSettings,
      referralSettings: { ...rs, ...updates }
    });
  };

  const addMilestone = () => {
    const milestones = rs.milestones || [];
    updateReferralSettings({ milestones: [...milestones, { count: 0, reward: 0 }] });
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const milestones = [...(rs.milestones || [])];
    milestones[index][field] = value;
    updateReferralSettings({ milestones });
  };

  const removeMilestone = (index: number) => {
    const milestones = rs.milestones.filter((_: any, i: number) => i !== index);
    updateReferralSettings({ milestones });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Referral System Configuration</h3>
        <button onClick={() => console.log("Saved", rs)} className="px-4 py-2 bg-emerald-600 rounded-xl text-white font-bold flex items-center gap-2">
            <Save className="w-4 h-4"/> Save
        </button>
      </div>

      {/* Validation Rules */}
      <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl">
        <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={rs.mobileMatchRequired} onChange={e => updateReferralSettings({ mobileMatchRequired: e.target.checked })} />
            Mobile Number Match Required
        </label>
        <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={rs.telegramMatchRequired} onChange={e => updateReferralSettings({ telegramMatchRequired: e.target.checked })} />
            Telegram Account Match Required
        </label>
        <input type="number" placeholder="Min URL Clicks" value={rs.minUrlClicks || 20} onChange={e => updateReferralSettings({ minUrlClicks: parseInt(e.target.value) })} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
        <input type="number" placeholder="Min Downloads" value={rs.minDownloads || 50} onChange={e => updateReferralSettings({ minDownloads: parseInt(e.target.value) })} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
      </div>

      {/* Levels */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Referral Levels</h4>
        {/* Simplified level manager for brevity */}
        <p className="text-slate-500 text-xs">Level management UI would go here.</p>
      </div>

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-400 uppercase">Milestones</h4>
            <button onClick={addMilestone} className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button>
        </div>
        <div className="space-y-2">
            {(rs.milestones || []).map((m: any, i: number) => (
                <div key={i} className="flex gap-2">
                    <input type="number" placeholder="Count" value={m.count} onChange={e => updateMilestone(i, 'count', parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                    <input type="number" placeholder="Reward" value={m.reward} onChange={e => updateMilestone(i, 'reward', parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                    <button onClick={() => removeMilestone(i)} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
