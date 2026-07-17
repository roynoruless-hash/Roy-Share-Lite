import React, { useState } from 'react';
import { API_BASE } from '../../config/api';
import { Sparkles, Video, Settings, CreditCard, ChevronRight } from 'lucide-react';

export default function CreateCampaign({ advertiser, onBack }: { advertiser: any, onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    videoUrl: '',
    videoTitle: '',
    channelName: '',
    category: '',
    description: '',
    rewardPerUser: 5,
    maxParticipants: 100,
    dailyLimit: 20,
    watchTime: 60,
    priority: false
  });
  
  const [comments, setComments] = useState<string[]>([]);
  const [commentCount, setCommentCount] = useState(20);

  const PLATFORM_FEE_PERCENT = 10;
  
  const budget = formData.rewardPerUser * formData.maxParticipants;
  const platformFee = (budget * PLATFORM_FEE_PERCENT) / 100;
  const totalAmount = budget + platformFee;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value 
    });
  };

  const categorizeVideo = async () => {
    if (!formData.videoTitle) return alert("Please enter Video Title first");
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/advertiser/ai-categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.videoTitle, description: formData.description })
      });
      const data = await res.json();
      if (data.success) {
        setFormData(f => ({ ...f, category: data.category }));
      }
    } catch (e) {}
    setAiLoading(false);
  };

  const generateComments = async () => {
    if (!formData.videoTitle) return alert("Please enter Video Title first");
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/advertiser/ai-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.videoTitle, description: formData.description, count: commentCount })
      });
      const data = await res.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (e) {}
    setAiLoading(false);
  };

  const handleSubmit = async () => {
    if (advertiser.balance < totalAmount) {
      setError(`Insufficient wallet balance. You need ₹${totalAmount.toFixed(2)} but have ₹${(advertiser.balance||0).toFixed(2)}`);
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const payload = {
        platform: "youtube",
        advertiserId: advertiser.id,
        ...formData,
        comments,
        budget,
        platformFee,
        totalAmount
      };
      
      const res = await fetch(`${API_BASE}/api/advertiser/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert("Campaign submitted for admin review!");
        onBack();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition">&larr; Back</button>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
      </div>
      
      {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500">{error}</div>}

      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 p-4 rounded-xl border ${step === s ? 'bg-blue-600/10 border-blue-500 text-blue-400' : step > s ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'} transition flex items-center justify-between`}>
            <span className="font-bold text-sm">Step {s}</span>
            {step > s && <span className="text-xs">✓</span>}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5 text-blue-400" /> Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Campaign Name</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">YouTube Video URL</label>
                <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Video Title</label>
                <input name="videoTitle" value={formData.videoTitle} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Channel Name</label>
                <input name="channelName" value={formData.channelName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            
            <div className="pt-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">AI Category</label>
                <div className="flex gap-2">
                  <input name="category" value={formData.category} onChange={handleChange} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" readOnly />
                  <button onClick={categorizeVideo} disabled={aiLoading} className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                    <Sparkles className="w-4 h-4" /> Detect
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} disabled={!formData.name || !formData.videoUrl} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" /> Campaign Rules & AI Comments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reward per User (₹)</label>
                <input type="number" name="rewardPerUser" value={formData.rewardPerUser} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Participants</label>
                <input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Daily Limit</label>
                <input type="number" name="dailyLimit" value={formData.dailyLimit} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-800">
              <h3 className="font-bold mb-4">AI Comment Generator</h3>
              <div className="flex gap-4 items-end mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Count</label>
                  <select value={commentCount} onChange={e => setCommentCount(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500">
                    <option value={20}>20 Comments</option>
                    <option value={50}>50 Comments</option>
                    <option value={100}>100 Comments</option>
                  </select>
                </div>
                <button onClick={generateComments} disabled={aiLoading} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                  <Sparkles className="w-4 h-4" /> Generate Comments
                </button>
              </div>
              {comments.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 border border-slate-700 text-sm text-slate-300">
                  {comments.map((c, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded">{c}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">Back</button>
              <button onClick={() => setStep(3)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-400" /> Budget & Payment</h2>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Reward per User</span>
                <span className="font-bold">₹{formData.rewardPerUser.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Participants</span>
                <span className="font-bold">{formData.maxParticipants}</span>
              </div>
              <div className="h-px bg-slate-700 w-full" />
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign Budget</span>
                <span className="font-bold">₹{budget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span className="font-bold">₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-700 w-full" />
              <div className="flex justify-between text-xl">
                <span className="text-white font-bold">Total Amount</span>
                <span className="font-bold text-emerald-400">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-200">
              Your wallet balance: <strong>₹{(advertiser.balance||0).toFixed(2)}</strong>
              {(advertiser.balance||0) < totalAmount && (
                <span className="text-red-400 block mt-1">Insufficient balance. Please recharge your wallet before publishing.</span>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">Back</button>
              <button onClick={handleSubmit} disabled={loading || advertiser.balance < totalAmount} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                {loading ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
