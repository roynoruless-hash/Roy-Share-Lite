import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdvertiserAuth from './AdvertiserPanel/AdvertiserAuth';
import AdvertiserDashboard from './AdvertiserPanel/AdvertiserDashboard';
import CreateCampaign from './AdvertiserPanel/CreateCampaign';

export default function AdvertiserPanel() {
  const [advertiser, setAdvertiser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create'>('dashboard');

  useEffect(() => {
    // Check local storage for advertiser session
    const adv = localStorage.getItem('advertiserSession');
    if (adv) {
      try {
        setAdvertiser(JSON.parse(adv));
      } catch (e) {}
    }
  }, []);

  const handleLogin = (data: any) => {
    localStorage.setItem('advertiserSession', JSON.stringify(data));
    setAdvertiser(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('advertiserSession');
    setAdvertiser(null);
  };

  if (!advertiser) {
    return <AdvertiserAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
              R
            </div>
            <div>
              <div className="font-bold">Roy Share Ads</div>
              <div className="text-xs text-slate-400">Advertiser Panel</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`text-sm font-medium transition ${currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('create')}
              className={`text-sm font-medium transition ${currentView === 'create' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              Create Campaign
            </button>
            
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            
            <div className="text-sm">
              <span className="text-slate-400 mr-2">Balance:</span>
              <span className="font-bold text-emerald-400">₹{advertiser.balance?.toFixed(2) || '0.00'}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <AdvertiserDashboard advertiser={advertiser} />
            </motion.div>
          )}
          {currentView === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <CreateCampaign advertiser={advertiser} onBack={() => setCurrentView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
