import React, { useState, useEffect } from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  ArrowLeft, 
  TrendingUp, 
  History, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  Gift
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export const WalletPage: React.FC<{ onBack: () => void; initialTab?: string }> = ({ onBack, initialTab = "wallet" }) => {
  const { user, isInsideTelegram } = useTelegramAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Form State
  const [amount, setAmount] = useState<string>("");
  const [upiId, setUpiId] = useState<string>(user?.upiId || "");
  
  // Payment Methods: UPI, BANK, USDT
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "BANK" | "USDT">("UPI");
  const [accountHolderName, setAccountHolderName] = useState<string>(user?.bankDetails?.accountHolderName || "");
  const [accountNumber, setAccountNumber] = useState<string>(user?.bankDetails?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState<string>(user?.bankDetails?.ifscCode || "");
  const [bankName, setBankName] = useState<string>(user?.bankDetails?.bankName || "");
  const [walletAddress, setWalletAddress] = useState<string>(user?.usdtWalletAddress || "");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successData, setSuccessData] = useState<{ id: string; amount: number; method: string; receiveAmount: number; details: string } | null>(null);

  // System settings for minimum withdrawal
  const [minWithdrawal, setMinWithdrawal] = useState<number>(100);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [withdrawalSettings, setWithdrawalSettings] = useState<any>(null);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("All");

  // Sync UPI ID and details if user changes
  useEffect(() => {
    if (user) {
      if (user.upiId) {
        setUpiId(user.upiId);
      }
      if (user.bankDetails) {
        setAccountHolderName(user.bankDetails.accountHolderName || "");
        setAccountNumber(user.bankDetails.accountNumber || "");
        setIfscCode(user.bankDetails.ifscCode || "");
        setBankName(user.bankDetails.bankName || "");
      }
      if (user.usdtWalletAddress) {
        setWalletAddress(user.usdtWalletAddress || "");
      }
    }
  }, [user]);

  if (!user) return null;

  const displayBalance = (
    (user.fileEarnings || 0) + 
    (user.linkEarnings || 0) + 
    (user.referralEarnings || 0) + 
    (user.bonusBalance !== undefined ? user.bonusBalance : ((user as any).bonus || 0)) + 
    (user.rewardBalance || 0) + 
    (user.balance || 0) - 
    (user.withdrawnAmount !== undefined ? user.withdrawnAmount : ((user as any).totalWithdrawn || 0)) - 
    (user.pendingWithdrawals || 0)
  );
  const displayWithdrawn = user.withdrawnAmount !== undefined ? user.withdrawnAmount : ((user as any).totalWithdrawn || 0);
  const displayTotalEarnings = (
    (user.fileEarnings || 0) + 
    (user.linkEarnings || 0) + 
    (user.referralEarnings || 0) + 
    (user.bonusBalance !== undefined ? user.bonusBalance : ((user as any).bonus || 0)) + 
    (user.rewardBalance || 0)
  );

  // Fetch system settings
  useEffect(() => {
    const fetchMinWithdrawal = async () => {
      try {
        setLoadingSettings(true);
        const settingsSnap = await getDocs(collection(db, "settings"));
        settingsSnap.forEach((doc) => {
          if (doc.id === "system") {
            const settingsData = doc.data();
            const wSettings = settingsData?.withdrawalSettings || {};
            setWithdrawalSettings(wSettings);
            
            // Set dynamic minWithdrawal depending on initial paymentMethod ("UPI")
            const upiMin = parseFloat(wSettings.upiMin) || 100;
            setMinWithdrawal(upiMin);
          }
        });
      } catch (err) {
        console.error("Error loading minimum withdrawal settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchMinWithdrawal();
  }, []);

  // Update dynamic minWithdrawal limit when method or settings change
  useEffect(() => {
    if (!withdrawalSettings) return;
    if (paymentMethod === "UPI") {
      setMinWithdrawal(parseFloat(withdrawalSettings.upiMin) || 100);
    } else if (paymentMethod === "BANK") {
      setMinWithdrawal(parseFloat(withdrawalSettings.bankMin) || 500);
    } else if (paymentMethod === "USDT") {
      setMinWithdrawal(parseFloat(withdrawalSettings.usdtMin) || 10);
    }
  }, [paymentMethod, withdrawalSettings]);

  // Fetch Transaction History
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/user/transactions/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.transactions || []);
      }
    } catch (err) {
      console.error("Error loading transaction history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessData(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid withdrawal amount.");
      return;
    }

    const isUsdt = paymentMethod === "USDT";
    const USDT_RATE = 90;
    const amountInINR = isUsdt ? parsedAmount * USDT_RATE : parsedAmount;

    // Check if withdrawals are enabled globally
    if (withdrawalSettings?.enabled === false) {
      setError("Withdrawals are currently disabled by administrator.");
      return;
    }

    // Check if specific method is enabled
    let methodEnabled = true;
    if (paymentMethod === "UPI") {
      methodEnabled = withdrawalSettings?.upiEnabled !== false;
    } else if (paymentMethod === "BANK") {
      methodEnabled = withdrawalSettings?.bankEnabled !== false;
    } else if (paymentMethod === "USDT") {
      methodEnabled = withdrawalSettings?.usdtEnabled !== false;
    }

    if (!methodEnabled) {
      setError("Selected payment method is currently disabled by administrator.");
      return;
    }

    // Check minimum withdrawal
    if (isUsdt) {
      const minVal = parseFloat(withdrawalSettings?.usdtMin) || 10;
      if (parsedAmount < minVal) {
        setError(`Minimum withdrawal amount is ${minVal} USDT.`);
        return;
      }
    } else {
      const minVal = parseFloat(paymentMethod === "UPI" ? withdrawalSettings?.upiMin : withdrawalSettings?.bankMin) || (paymentMethod === "UPI" ? 100 : 500);
      if (parsedAmount < minVal) {
        setError(`Minimum withdrawal amount is ₹${minVal}.`);
        return;
      }
    }

    // Check available balance
    if (amountInINR > displayBalance) {
      setError("Insufficient wallet balance.");
      return;
    }

    // Validate specific method fields
    if (paymentMethod === "UPI") {
      if (!upiId.trim()) {
        setError("Please enter your UPI ID.");
        return;
      }
    } else if (paymentMethod === "BANK") {
      if (!accountHolderName.trim()) {
        setError("Please enter the Account Holder Name.");
        return;
      }
      if (!accountNumber.trim()) {
        setError("Please enter the Account Number.");
        return;
      }
      if (!ifscCode.trim()) {
        setError("Please enter the IFSC Code.");
        return;
      }
      if (!bankName.trim()) {
        setError("Please enter the Bank Name.");
        return;
      }
    } else if (paymentMethod === "USDT") {
      if (!walletAddress.trim()) {
        setError("Please enter your USDT Wallet Address.");
        return;
      }
    }

    // Calculate processing fee & receive amount
    let fee = 0;
    let receive = 0;
    if (isUsdt) {
      fee = 1; // 1 USDT fixed fee
      receive = parsedAmount - fee;
    } else {
      fee = Number((parsedAmount * 0.05).toFixed(2)); // 5% fee
      receive = Number((parsedAmount - fee).toFixed(2));
    }

    if (receive <= 0) {
      setError("Withdrawal amount is too small after processing fee.");
      return;
    }

    // AdsBitvex Reward Ad Integration
    if (typeof (window as any).showadsbitvex !== "function") {
      setError("❌ window.showadsbitvex() is undefined. SDK is not loaded.");
      return;
    }

    try {
      setLoading(true);
      await (window as any).showadsbitvex();
    } catch (err: any) {
      setLoading(false);
      setError(`Ad failed: ${err?.message || err}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/withdrawal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: String(user.id),
          amount: parsedAmount,
          method: paymentMethod === "UPI" ? "UPI ID" : paymentMethod === "BANK" ? "Bank Account" : "USDT (TRC20)",
          upiId: upiId.trim(),
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          bankName: bankName.trim(),
          walletAddress: walletAddress.trim(),
          processingFee: fee,
          receiveAmount: receive
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to submit withdrawal request.");
        return;
      }

      setSuccessData({
        id: data.withdrawalId,
        amount: parsedAmount,
        method: paymentMethod === "UPI" ? "UPI ID" : paymentMethod === "BANK" ? "Bank Account" : "USDT (TRC20)",
        receiveAmount: receive,
        details: paymentMethod === "UPI" ? upiId.trim() : paymentMethod === "BANK" ? `${bankName.trim()} (${accountNumber.trim()})` : walletAddress.trim()
      });
      setAmount("");
    } catch (err) {
      console.error("Error submitting withdrawal:", err);
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const parsedAmt = parseFloat(amount) || 0;

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Sticky Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h2 className="text-xl font-bold text-white">
            {activeTab === "wallet" ? "My Wallet" : activeTab === "withdraw" ? "Withdraw" : "Withdrawal History"}
          </h2>
        </div>
        
        {/* Navigation Tabs in Header */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button 
            onClick={() => { setActiveTab("wallet"); setSuccessData(null); setError(""); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === "wallet" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            Wallet
          </button>
          <button 
            onClick={() => { setActiveTab("withdraw"); setSuccessData(null); setError(""); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === "withdraw" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            Withdraw
          </button>
          <button 
            onClick={() => { setActiveTab("history"); setSuccessData(null); setError(""); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === "history" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            History
          </button>
        </div>
      </header>

      <main className="p-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: WALLET OVERVIEW */}
          {activeTab === "wallet" && (
            <motion.div
              key="wallet-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-blue-100/80 text-sm font-medium mb-2">
                    <Wallet className="w-4 h-4" /> Available Balance
                  </div>
                  <h3 className="text-5xl font-black tracking-tighter mb-8">₹{displayBalance.toLocaleString()}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveTab("withdraw")}
                      className="bg-white text-blue-600 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Withdraw
                    </button>
                    <button 
                      onClick={() => setActiveTab("history")}
                      className="bg-blue-500/20 border border-white/20 text-white py-4 rounded-2xl font-bold text-sm backdrop-blur-md hover:bg-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <History className="w-4 h-4" /> History
                    </button>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Today's Profit</p>
                  <p className="text-emerald-400 font-bold text-lg">+₹{user.todayEarnings || 0}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Payouts</p>
                  <p className="text-blue-400 font-bold text-lg">₹{displayWithdrawn.toLocaleString()}</p>
                </div>
              </div>

              {/* Detailed Earnings Breakdown */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Earnings Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">File Earnings</span>
                    <p className="font-extrabold text-white mt-1">₹{(user.fileEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Link Earnings</span>
                    <p className="font-extrabold text-white mt-1">₹{(user.linkEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Referral Earnings</span>
                    <p className="font-extrabold text-white mt-1">₹{(user.referralEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Bonus Balance</span>
                    <p className="font-extrabold text-white mt-1">₹{(user.bonusBalance || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Reward Balance</span>
                    <p className="font-extrabold text-white mt-1">₹{(user.rewardBalance || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Monthly Earnings</span>
                    <p className="font-extrabold text-white mt-1">₹{(user.monthEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Pending Withdrawals</span>
                    <p className="font-extrabold text-amber-500 mt-1">₹{(user.pendingWithdrawals || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                    <span className="text-xs text-slate-400">Total Income</span>
                    <p className="font-extrabold text-indigo-400 mt-1">₹{displayTotalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your funds are protected by Telegram ID identity matching. No OTP or passwords required. Payouts are approved securely.
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 2: WITHDRAW FORM */}
          {activeTab === "withdraw" && (
            <motion.div
              key="withdraw-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto"
            >
              {successData ? (
                /* Success screen */
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-slate-900/60 border border-emerald-500/20 rounded-[2rem] p-8 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Request Submitted!</h3>
                    <p className="text-slate-400 text-sm">
                      Your withdrawal request has been placed with status <span className="text-amber-400 font-semibold">Pending</span>.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-left">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Request ID</span>
                      <span className="text-white font-mono font-semibold">{successData.id}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Amount</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {successData.method.includes("USDT") ? `${successData.amount} USDT` : `₹${successData.amount}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Method</span>
                      <span className="text-white font-semibold">{successData.method}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">You Will Receive</span>
                      <span className="text-indigo-400 font-bold font-mono">
                        {successData.method.includes("USDT") ? `${successData.receiveAmount} USDT` : `₹${successData.receiveAmount}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-slate-900 pt-2">
                      <span className="text-slate-500">Payout Details</span>
                      <span className="text-slate-300 font-mono text-right break-all max-w-[180px]">{successData.details}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A direct notification has been sent to your Telegram Bot. The amount has been deducted from your available balance.
                  </p>

                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => { setActiveTab("history"); setSuccessData(null); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold text-sm transition-all text-white active:scale-95"
                    >
                      View Withdrawal History
                    </button>
                    <button 
                      onClick={() => { setSuccessData(null); setError(""); }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      Request Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Main Withdrawal Form */
                <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                  
                  {/* Dynamic Balance Display */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold">Available Balance</p>
                      <h4 className="text-2xl font-black text-white mt-1">
                        {paymentMethod === "USDT" 
                          ? `${(displayBalance / 90).toFixed(2)} USDT` 
                          : `₹${displayBalance.toLocaleString()}`
                        }
                      </h4>
                      {paymentMethod === "USDT" && (
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">≈ ₹{displayBalance.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs font-semibold">Minimum Withdrawal</p>
                      {loadingSettings ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto mt-2" />
                      ) : (
                        <h4 className="text-lg font-bold text-slate-300 mt-1">
                          {paymentMethod === "USDT" 
                            ? `${(minWithdrawal / 90).toFixed(2)} USDT` 
                            : `₹${minWithdrawal}`
                          }
                        </h4>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Animated Selector Cards */}
                  <div className="space-y-3">
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => { setPaymentMethod("UPI"); setError(""); }}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all relative overflow-hidden active:scale-95 ${
                          paymentMethod === "UPI"
                            ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/5"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mb-1.5 text-blue-400" />
                        <span className="text-[11px] font-bold">UPI ID</span>
                        {paymentMethod === "UPI" && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPaymentMethod("BANK"); setError(""); }}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all relative overflow-hidden active:scale-95 ${
                          paymentMethod === "BANK"
                            ? "bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-500/5"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                        }`}
                      >
                        <Wallet className="w-5 h-5 mb-1.5 text-purple-400" />
                        <span className="text-[11px] font-bold">Bank A/C</span>
                        {paymentMethod === "BANK" && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPaymentMethod("USDT"); setError(""); }}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all relative overflow-hidden active:scale-95 ${
                          paymentMethod === "USDT"
                            ? "bg-emerald-600/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/5"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                        }`}
                      >
                        <TrendingUp className="w-5 h-5 mb-1.5 text-emerald-400" />
                        <span className="text-[11px] font-bold">USDT</span>
                        {paymentMethod === "USDT" && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Globally Disabled warning */}
                  {withdrawalSettings?.enabled === false && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-4 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                      <span>All withdrawals are temporarily disabled by the administrator.</span>
                    </div>
                  )}

                  {/* Method Disabled warning */}
                  {withdrawalSettings?.enabled !== false && withdrawalSettings && (
                    (paymentMethod === "UPI" && withdrawalSettings.upiEnabled === false) ||
                    (paymentMethod === "BANK" && withdrawalSettings.bankEnabled === false) ||
                    (paymentMethod === "USDT" && withdrawalSettings.usdtEnabled === false)
                  ) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-4 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                      <span>This payment method is temporarily disabled. Please choose another channel.</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                        Withdrawal Amount ({paymentMethod === "USDT" ? "USDT" : "INR"})
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                          {paymentMethod === "USDT" ? "$" : "₹"}
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={paymentMethod === "USDT" ? `${(minWithdrawal / 90).toFixed(2)}+` : `${minWithdrawal}+`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-10 pr-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Method-Specific Inputs */}
                    {paymentMethod === "UPI" && (
                      <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                          UPI ID
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="example@upi"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white font-mono placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    )}

                    {paymentMethod === "BANK" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="State Bank of India"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="1234567890"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white font-mono placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                            placeholder="SBIN0001234"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white font-mono placeholder-slate-700 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === "USDT" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            USDT Wallet Address (TRC20 Only)
                          </label>
                          <input
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="TXxxxxxxxxx..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white font-mono placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-xs text-emerald-400 leading-relaxed font-semibold">
                          ⚠️ Make sure to enter a valid <b>TRC20 network</b> wallet address. Sending to any other network will result in permanent loss of funds.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time Dynamic Calculation Block */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                    <h5 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-900 pb-2">
                      Live Calculation
                    </h5>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Requested Amount</span>
                      <span className="text-slate-300 font-bold font-mono">
                        {paymentMethod === "USDT" ? `${parsedAmt} USDT` : `₹${parsedAmt.toLocaleString()}`}
                      </span>
                    </div>

                    {paymentMethod === "USDT" && (
                      <div className="flex justify-between items-center text-[10px] bg-slate-900/50 p-2.5 rounded-xl border border-slate-850 text-slate-400 font-mono">
                        <span>Deducted Balance (₹90/USDT)</span>
                        <span>₹{(parsedAmt * 90).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        Processing Fee {paymentMethod === "USDT" ? "(Fixed 1 USDT)" : "(5%)"}
                      </span>
                      <span className="text-red-400 font-bold font-mono">
                        {paymentMethod === "USDT" 
                          ? `${parsedAmt > 0 ? "1.00" : "0.00"} USDT` 
                          : `₹${(parsedAmt * 0.05).toFixed(2)}`
                        }
                      </span>
                    </div>

                    <div className="border-t border-slate-900 my-1" />

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        You Will Receive
                      </span>
                      <span className="text-emerald-400 text-lg font-black font-mono">
                        {paymentMethod === "USDT" 
                          ? `${Math.max(0, parsedAmt - (parsedAmt > 0 ? 1 : 0)).toFixed(2)} USDT` 
                          : `₹${Math.max(0, parsedAmt * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl text-[11px] text-slate-400 leading-relaxed flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Your withdrawal request is linked permanently to Telegram ID <b>{user.id}</b>. Approval happens securely with no OTP or secondary codes needed.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading || 
                      withdrawalSettings?.enabled === false ||
                      (paymentMethod === "UPI" && withdrawalSettings?.upiEnabled === false) ||
                      (paymentMethod === "BANK" && withdrawalSettings?.bankEnabled === false) ||
                      (paymentMethod === "USDT" && withdrawalSettings?.usdtEnabled === false)
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Securely...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Submit Withdrawal Request
                      </>
                    )}
                  </button>

                </form>
              )}
            </motion.div>
          )}

          {/* TAB 3: TRANSACTION HISTORY */}
          {activeTab === "history" && (() => {
            const filteredHistory = history.filter((tx) => {
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchId = (tx.transactionId || tx.id || "").toLowerCase().includes(q);
                const matchEvent = (tx.eventName || "").toLowerCase().includes(q);
                const matchSource = (tx.source || "").toLowerCase().includes(q);
                const matchDesc = (tx.description || "").toLowerCase().includes(q);
                if (!matchId && !matchEvent && !matchSource && !matchDesc) return false;
              }

              if (filterType === "All") return true;
              if (filterType === "Credits") return tx.creditDebit === "Credit";
              if (filterType === "Debits") return tx.creditDebit === "Debit";
              if (filterType === "Lucky Spin") return (tx.source || "").toLowerCase().includes("lucky spin") || (tx.eventName || "").toLowerCase().includes("lucky spin");
              if (filterType === "Lucky Number") return (tx.source || "").toLowerCase().includes("lucky number") || (tx.eventName || "").toLowerCase().includes("lucky number");
              if (filterType === "AdsGram") return (tx.source || "").toLowerCase().includes("adsgram");
              if (filterType === "Referral") return (tx.source || "").toLowerCase().includes("referral");
              if (filterType === "Withdrawals") return (tx.source || "").toLowerCase().includes("withdrawal") || (tx.source || "").toLowerCase().includes("withdraw");
              if (filterType === "Tasks") return (tx.source || "").toLowerCase().includes("task");
              return true;
            });

            return (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                {/* Search and Filters Header */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, source or description..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-medium"
                    />
                  </div>

                  {/* Horizontal pill filters */}
                  <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-2 px-2">
                    {["All", "Credits", "Debits", "Lucky Spin", "Lucky Number", "AdsGram", "Referral", "Withdrawals", "Tasks"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterType(filter)}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          filterType === filter
                            ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10"
                            : "bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm">Fetching request records...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="py-16 text-center border border-slate-800 border-dashed rounded-3xl p-6">
                    <div className="w-12 h-12 bg-slate-900 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <History className="w-6 h-6" />
                    </div>
                    <p className="text-slate-400 font-semibold">No records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search term.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistory.map((tx) => {
                      const isCredit = tx.creditDebit === "Credit";
                      
                      // Status styling
                      let statusStyle = "bg-slate-800 text-slate-400 border-slate-700/50";
                      if (tx.status === "Completed" || tx.status === "Paid" || tx.status === "Success") {
                        statusStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      } else if (tx.status === "Pending" || tx.status === "Processing" || tx.status === "Pending Review") {
                        statusStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      } else if (tx.status === "Rejected" || tx.status === "Failed") {
                        statusStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                      }

                      // Source icon
                      let IconComponent = CreditCard;
                      let iconColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";

                      const src = (tx.source || "").toLowerCase();
                      if (src.includes("lucky spin")) {
                        IconComponent = Award;
                        iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                      } else if (src.includes("lucky number")) {
                        IconComponent = Gift;
                        iconColor = "text-pink-400 bg-pink-500/10 border-pink-500/20";
                      } else if (src.includes("adsgram")) {
                        IconComponent = CheckCircle2;
                        iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      } else if (src.includes("daily earn")) {
                        IconComponent = TrendingUp;
                        iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      } else if (src.includes("referral")) {
                        IconComponent = History;
                        iconColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
                      } else if (src.includes("file download")) {
                        IconComponent = Download;
                        iconColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                      } else if (src.includes("task")) {
                        IconComponent = ShieldCheck;
                        iconColor = "text-teal-400 bg-teal-500/10 border-teal-500/20";
                      } else if (src.includes("withdrawal")) {
                        IconComponent = CreditCard;
                        iconColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                      } else if (src.includes("admin") || src.includes("bonus")) {
                        IconComponent = Gift;
                        iconColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                      }

                      return (
                        <div 
                          key={tx.id || tx.transactionId} 
                          className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex gap-3.5 items-start hover:border-slate-800 transition-all duration-200"
                        >
                          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
                                {tx.source || "Transaction"}
                                {tx.eventName && (
                                  <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10">
                                    {tx.eventName}
                                  </span>
                                )}
                              </h4>
                              <span className={`text-base font-black flex-shrink-0 ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                                {isCredit ? "+" : "-"}₹{Number(tx.amount || 0).toFixed(2)}
                              </span>
                            </div>

                            <p className="text-slate-400 text-xs leading-relaxed font-medium">
                              {tx.description}
                            </p>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 items-center pt-1 text-[10px] font-medium text-slate-500 font-mono">
                              <span className="text-slate-600">ID: <span className="text-slate-400 font-semibold">{tx.transactionId || tx.id}</span></span>
                              <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                              <span>{tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "N/A"}</span>
                              <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                              <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold font-sans ${statusStyle}`}>
                                {tx.status || "Completed"}
                              </span>
                            </div>

                            {/* Rejection / Failure Reason */}
                            {tx.adminNotes && (
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-2 text-[11px] text-slate-400 leading-relaxed font-sans">
                                <b className="text-slate-500 font-semibold">Admin Notes:</b> {tx.adminNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })()}

        </AnimatePresence>
      </main>
    </div>
  );
};
