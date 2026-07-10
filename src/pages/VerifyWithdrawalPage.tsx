import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { motion } from 'framer-motion';

export default function VerifyWithdrawalPage({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetch(`${API_BASE}/api/withdrawal/captcha?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNum1(data.num1);
          setNum2(data.num2);
          setLoading(false);
        } else {
          setError(data.message || 'Verification session expired.');
          setLoading(false);
        }
      })
      .catch(err => {
        setError('Failed to load verification.');
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (loading || success || error) return;
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, loading, success, error]);

  const handleVerify = async () => {
    if (timeLeft > 0) return;
    if (!answer) return setError('Please enter an answer');
    
    setVerifying(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/withdrawal/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answer })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Verification failed. Try again.');
      }
    } catch (err) {
      setError('Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Human Verification Successful</h2>
            <p className="text-slate-400 mb-6 text-sm">Your withdrawal request has been submitted successfully.</p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-6 inline-block">
              <p className="text-xs text-slate-500 mb-1">Withdrawal Status:</p>
              <p className="text-sm font-semibold text-yellow-400">🟡 Pending Review</p>
            </div>
            <a 
              href="https://t.me/Roysharearn_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center"
            >
              ↩️ Return To Telegram Bot
            </a>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Human Verification Required</h2>
            <p className="text-slate-400 text-sm mb-6">To protect our platform from spam, bots and fraud withdrawals, please complete the verification below.</p>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
              <p className="text-slate-300 font-medium mb-4 text-lg">
                {num1} + {num2} = ?
              </p>
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer Input"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-center text-white focus:outline-none focus:border-indigo-500 text-lg"
              />
            </div>

            {timeLeft > 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                <p className="text-yellow-400 text-sm mb-2">⏳ Please remain on this page for {timeLeft} seconds before verification becomes available.</p>
                <div className="text-3xl font-bold text-yellow-500 font-mono">{timeLeft}</div>
              </div>
            ) : (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors ${verifying ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {verifying ? 'Verifying...' : '✅ Verify'}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
