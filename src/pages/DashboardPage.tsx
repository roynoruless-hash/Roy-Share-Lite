import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { User } from "../types";
import { 
  FileText, 
  Download, 
  DollarSign, 
  Link as LinkIcon, 
  Upload, 
  Plus, 
  ExternalLink, 
  Wallet, 
  ShieldCheck, 
  Send, 
  Mail, 
  UserCheck,
  Trophy,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Share2
} from "lucide-react";

// Mock data as requested (no backend changes)
const USER_DATA = {
  name: "Rohit Sharma",
  rank: "Active Creator",
  memberSince: "Oct 2023",
  stats: {
    files: 124,
    downloads: "12.5k",
    earnings: "₹1,250.00",
    links: 45
  },
  achievements: [
    { id: 1, name: "Bronze", icon: Trophy, color: "text-amber-600", active: true },
    { id: 2, name: "Silver", icon: Trophy, color: "text-slate-400", active: true },
    { id: 3, name: "Gold", icon: Trophy, color: "text-yellow-400", active: false },
    { id: 4, name: "Diamond", icon: Trophy, color: "text-blue-400", active: false },
  ],
  recentActivity: [
    { id: 1, type: "upload", title: "Project_Assets.zip", time: "2 mins ago", detail: "Successfully uploaded" },
    { id: 2, type: "reward", title: "Daily Bonus", time: "1 hour ago", detail: "+₹5.00 credited" },
    { id: 3, type: "download", title: "Game_Update_v2.apk", time: "3 hours ago", detail: "24 new downloads" },
    { id: 4, type: "link", title: "Smart Link Created", time: "5 hours ago", detail: "Shortened link generated" },
  ],
  notifications: [
    { id: 1, text: "Your withdrawal request of ₹500 has been approved.", time: "Just now" },
    { id: 2, text: "New achievement unlocked: Silver Creator!", time: "2 hours ago" },
    { id: 3, text: "Security update: Your Telegram is now connected.", time: "5 hours ago" },
  ]
};

const StatCard = ({ title, value, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative group overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-500">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3" />
          <span>+12%</span>
        </div>
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  </motion.div>
);

const ActionButton = ({ title, icon: Icon, color, delay, onClick }: any) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer"
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${color} transition-opacity duration-500`} />
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${color.replace('bg-', 'bg-opacity-20 ')}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <span className="text-sm font-bold text-white tracking-tight">{title}</span>
  </motion.button>
);

const ActivityCard = ({ activity, delay }: any) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'upload': return <Upload className="w-4 h-4 text-blue-400" />;
      case 'reward': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'download': return <Download className="w-4 h-4 text-purple-400" />;
      case 'link': return <LinkIcon className="w-4 h-4 text-orange-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
        {getIcon()}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{activity.title}</h4>
        <p className="text-xs text-slate-500">{activity.detail}</p>
      </div>
      <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">{activity.time}</span>
    </motion.div>
  );
};

const DashboardPage = ({ 
  onBack, 
  onNavigate 
}: { 
  onBack?: () => void; 
  onNavigate?: (view: string) => void; 
} = {}) => {
  const { user } = useTelegramAuth();
  const [dbStats, setDbStats] = useState({
    files: 0,
    downloads: 0,
    links: 0,
    withdrawalsCount: 0,
    withdrawalsTotal: 0,
    loading: true
  });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", String(user.id)));
        const uploadsSnap = await getDocs(uploadsQuery);
        let totalFiles = 0;
        let totalDownloads = 0;
        uploadsSnap.forEach((doc) => {
          totalFiles++;
          totalDownloads += Number(doc.data().downloads || 0);
        });

        const linksQuery = query(collection(db, "links"), where("userId", "==", String(user.id)));
        const linksSnap = await getDocs(linksQuery);
        const totalLinks = linksSnap.size;

        const withdrawalsQuery = query(collection(db, "withdrawals"), where("userId", "==", String(user.id)));
        const withdrawalsSnap = await getDocs(withdrawalsQuery);
        let withdrawalsCount = 0;
        let withdrawalsTotal = 0;
        withdrawalsSnap.forEach((doc) => {
          withdrawalsCount++;
          const data = doc.data();
          if (data.status === "Approved" || data.status === "Completed") {
            withdrawalsTotal += Number(data.amount || 0);
          }
        });

        setDbStats({
          files: totalFiles,
          downloads: totalDownloads,
          links: totalLinks,
          withdrawalsCount,
          withdrawalsTotal,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        setDbStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, [user]);

  const activeUser: User = user || {
    id: "12345678",
    telegramId: 12345678,
    username: "rohit_sharma",
    firstName: "Rohit",
    lastName: "Sharma",
    photoUrl: "",
    languageCode: "en",
    isPremium: false,
    enteredName: "Rohit Sharma",
    balance: 1250,
    availableBalance: 1250,
    totalEarnings: 1250,
    todayEarnings: 0,
    level: "Bronze" as const,
    referralCode: "RS123456",
    referredBy: null,
    profileCompleted: true,
    createdAt: "2023-10-01T00:00:00.000Z",
    updatedAt: "2023-10-01T00:00:00.000Z",
    lastActive: "2023-10-01T00:00:00.000Z",
    status: "Active" as const
  };

  const displayBalance = user ? (
    (user.fileEarnings || 0) + 
    (user.linkEarnings || 0) + 
    (user.referralEarnings || 0) + 
    (user.bonusBalance !== undefined ? user.bonusBalance : ((user as any).bonus || 0)) + 
    (user.rewardBalance || 0) + 
    (user.balance || 0) - 
    (user.withdrawnAmount !== undefined ? user.withdrawnAmount : ((user as any).totalWithdrawn || 0)) - 
    (user.pendingWithdrawals || 0)
  ) : activeUser.balance;

  const displayTotalEarnings = user ? (
    (user.fileEarnings || 0) + 
    (user.linkEarnings || 0) + 
    (user.referralEarnings || 0) + 
    (user.bonusBalance !== undefined ? user.bonusBalance : ((user as any).bonus || 0)) + 
    (user.rewardBalance || 0)
  ) : activeUser.totalEarnings;

  const displayName = activeUser.enteredName || `${activeUser.firstName || ""} ${activeUser.lastName || ""}`.trim() || activeUser.username || "User";
  const formattedMemberSince = activeUser.createdAt ? new Date(activeUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently";

  const isTelegram = typeof window !== "undefined" && !!(
    (window as any).Telegram?.WebApp?.initData ||
    window.location.search.includes("userId") ||
    (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-blue-500/30">
      {onBack && (
        <div className="max-w-7xl mx-auto mb-6 flex justify-start">
          <button onClick={onBack} className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </button>
        </div>
      )}
      {/* Top Background Gradients */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10 pointer-events-none animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10 pointer-events-none animate-pulse delay-700" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* TOP SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32 text-blue-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">👋</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{displayName}</span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                {activeUser.level || "Bronze"}
              </span>
              <span className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Member Since {formattedMemberSince}
              </span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Global Standing</p>
              <p className="text-2xl font-bold text-white tracking-tighter">Top 5%</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-xl shadow-blue-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                <img 
                  src={activeUser.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0f172a&color=3b82f6&bold=true`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Total Files" value={user ? dbStats.files : USER_DATA.stats.files} icon={FileText} delay={0.1} />
          <StatCard title="Total Downloads" value={user ? dbStats.downloads : USER_DATA.stats.downloads} icon={Download} delay={0.2} />
          <StatCard title="Total Earnings" value={user ? `₹${displayTotalEarnings.toLocaleString()}` : USER_DATA.stats.earnings} icon={DollarSign} delay={0.3} />
          <StatCard title="Smart Links" value={user ? dbStats.links : USER_DATA.stats.links} icon={LinkIcon} delay={0.4} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white px-2">Quick Actions</h2>
          <div className={isTelegram ? "grid grid-cols-2 gap-4 max-w-md" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"}>
            {!isTelegram && <ActionButton title="Upload File" icon={Upload} color="bg-blue-600" onClick={() => onNavigate?.("upload")} delay={0.1} />}
            {!isTelegram && <ActionButton title="Create Smart Link" icon={LinkIcon} color="bg-purple-600" onClick={() => onNavigate?.("my-links")} delay={0.2} />}
            {!isTelegram && <ActionButton title="Connect Drive" icon={Plus} color="bg-emerald-600" onClick={() => onNavigate?.("upload")} delay={0.3} />}
            <ActionButton title="Withdraw" icon={Wallet} color="bg-orange-600" onClick={() => onNavigate?.("withdraw")} delay={0.4} />
            <ActionButton title="Refer & Earn" icon={Share2} color="bg-indigo-600" onClick={() => onNavigate?.("referral")} delay={0.5} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* RECENT ACTIVITY */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
              {USER_DATA.recentActivity.map((activity, i) => (
                <ActivityCard key={activity.id} activity={activity} delay={0.2 + i * 0.1} />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {/* TELEGRAM PROFILE DETAILS */}
            {user && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white px-2">Roy Share Earn Profile</h2>
                <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Profile Name</span>
                    <span className="text-sm font-semibold text-white">{displayName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Mobile Number</span>
                    <span className="text-sm font-black text-emerald-400">{user.phone || (user as any).mobileNumber || "Not Available"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Telegram ID</span>
                    <span className="text-sm font-mono text-blue-400">{user.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Username</span>
                    <span className="text-sm font-semibold text-slate-300">@{user.username || "None"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Wallet Balance</span>
                    <span className="text-sm font-bold text-emerald-400">₹{displayBalance.toLocaleString()}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center py-1.5 border-b border-white/5 cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-lg transition-all group/ref"
                    onClick={() => onNavigate?.("referral")}
                    title="Click to view Referral Center"
                  >
                    <span className="text-sm font-medium text-slate-400 group-hover/ref:text-purple-300 transition-colors">Referral Code</span>
                    <span className="text-sm font-mono text-purple-400 flex items-center gap-1 group-hover/ref:scale-105 transition-all">
                      {user.referralCode || "N/A"}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/ref:opacity-100 transition-all text-purple-400" />
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm font-medium text-slate-400">Total Withdrawals</span>
                    <span className="text-sm font-bold text-orange-400">₹{dbStats.withdrawalsTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT STATUS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white px-2">Account Status</h2>
              <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                {[
                  { name: "Google Drive", status: "Connected", icon: ExternalLink, active: true },
                  { name: "Telegram Bot", status: "Active", icon: Send, active: true },
                  { name: "Email Verified", status: "Verified", icon: Mail, active: true },
                  { name: "KYC Verification", status: "Pending", icon: UserCheck, active: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors ${item.active ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{item.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.active ? 'text-emerald-500' : 'text-yellow-500'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACHIEVEMENTS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white px-2">Achievements</h2>
              <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                <div className="grid grid-cols-4 gap-4">
                  {USER_DATA.achievements.map((badge, i) => (
                    <div key={badge.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-500 relative ${badge.active ? 'group-hover:scale-110 group-hover:bg-white/10' : 'opacity-30 grayscale'}`}>
                        <badge.icon className={`w-6 h-6 ${badge.color}`} />
                        {badge.active && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter ${badge.active ? 'text-slate-400' : 'text-slate-600'}`}>{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT NOTIFICATIONS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" /> Notifications
            </h2>
            <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {USER_DATA.notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
              >
                <p className="text-sm text-slate-300 mb-2 leading-relaxed">{notif.text}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> {notif.time}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center pt-4">
            <button className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2 mx-auto">
              View All Notifications <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
