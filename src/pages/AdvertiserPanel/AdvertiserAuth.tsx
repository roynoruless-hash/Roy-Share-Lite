import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building, Phone, MapPin, Briefcase } from 'lucide-react';
import { API_BASE } from '../../config/api';

export default function AdvertiserAuth({ onLogin }: { onLogin: (data: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    fullName: '',
    mobile: '',
    telegram: '',
    country: '',
    gst: '',
    website: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (isLogin) {
        const res = await fetch(`${API_BASE}/api/advertiser/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await res.json();
        if (data.success) {
          onLogin(data.advertiser);
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        
        const res = await fetch(`${API_BASE}/api/advertiser/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          // Auto login after register
          onLogin({ id: data.advertiserId, ...formData, balance: 0 });
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4 shadow-lg shadow-blue-500/20">
            R
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Roy Share Ads</h1>
          <p className="text-slate-400">Professional Advertiser Panel</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Company Name *</label>
                <div className="relative">
                  <Briefcase className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Company Ltd." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name *</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="John Doe" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address *</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="you@company.com" />
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required name="mobile" value={formData.mobile} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="+1 234 567 890" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Telegram Username *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input required name="telegram" value={formData.telegram} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="username" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Country *</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="United States" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">GST Number (Optional)</label>
                <input name="gst" value={formData.gst} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="GSTIN..." />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password *</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? "Processing..." : (isLogin ? "Sign In to Panel" : "Create Advertiser Account")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            {isLogin ? "Don't have an advertiser account? Register" : "Already an advertiser? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
