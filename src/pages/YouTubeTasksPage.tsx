import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, MonitorPlay, LogIn, CheckCircle2, Play, Pause, Copy, ExternalLink, Image as ImageIcon, X, Trash2, ArrowLeft, Clock, History } from 'lucide-react';

interface YouTubeTasksPageProps {
  onBack: () => void;
}

export default function YouTubeTasksPage({ onBack }: YouTubeTasksPageProps) {
  const [view, setView] = useState<"login" | "tasks" | "task-detail" | "pending" | "history">("login");
  const [connectedAccount, setConnectedAccount] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Task flow state
  const [watchTimeLeft, setWatchTimeLeft] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [watchComplete, setWatchComplete] = useState(false);
  const [copiedComment, setCopiedComment] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock checking login
  useEffect(() => {
    // In a real implementation, check localStorage or DB
    const account = localStorage.getItem("yt_connected_account");
    if (account) {
      setConnectedAccount(JSON.parse(account));
      setView("tasks");
    }
  }, []);

  useEffect(() => {
    if (isWatching && watchTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setWatchTimeLeft(prev => {
          if (prev <= 1) {
            setIsWatching(false);
            setWatchComplete(true);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWatching, watchTimeLeft]);

  // Handle Page Visibility for Timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isWatching) {
        setIsWatching(false); // Pause when leaving
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isWatching]);

  const handleLogin = () => {
    // Mock login
    const mockAccount = {
      name: "Ritik Rai",
      email: "ritikrai2625@gmail.com",
      id: "1098492019482",
      photo: "https://ui-avatars.com/api/?name=Ritik+Rai",
      connectedAt: new Date().toISOString()
    };
    localStorage.setItem("yt_connected_account", JSON.stringify(mockAccount));
    setConnectedAccount(mockAccount);
    
    // Mock Telegram Notification
    console.log("Telegram Notification: ✅ Google Account Connected Successfully");
    
    setView("tasks");
  };

  const handleStartTask = (task: any) => {
    setSelectedTask(task);
    setWatchTimeLeft(task.watchTime);
    setWatchComplete(false);
    setHasCommented(false);
    setHasLiked(false);
    setScreenshot(null);
    setView("task-detail");
  };

  const mockTasks = [
    {
      id: "1",
      title: "Top 10 Crypto Tokens to Buy in 2026",
      channel: "Crypto Insights",
      category: "Finance",
      reward: 5.00,
      watchTime: 60, // 60 seconds
      slots: 100,
      participants: 45,
      difficulty: "Easy",
      thumbnail: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&q=80"
    },
    {
      id: "2",
      title: "Learn React in 10 Minutes",
      channel: "Code Master",
      category: "Education",
      reward: 2.50,
      watchTime: 30, // 30 seconds
      slots: 50,
      participants: 12,
      difficulty: "Easy",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80"
    }
  ];

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshot(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Trigger Adsgram (mock)
    alert("Showing Adsgram Task Ad...");
    
    setTimeout(() => {
      // Mock submit to pending
      console.log(`Telegram Notification: 📺 YouTube Task Submitted Successfully\nYour submission is under admin review.\nReward: ₹${selectedTask?.reward}\nStatus: Pending`);
      setView("pending");
    }, 2000);
  };

  const canSubmit = watchComplete && hasCommented && hasLiked && screenshot;

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={view !== 'tasks' && view !== 'login' ? () => setView('tasks') : onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold">YouTube Tasks</h1>
          </div>
        </div>
        
        {view === 'tasks' && (
          <button onClick={() => setView('history')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition text-sm font-medium">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
        
        {/* LOGIN VIEW */}
        {view === "login" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center mt-12">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Youtube className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Google Account</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Connect your Google Account once to participate in YouTube task campaigns and earn rewards.</p>
            
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 py-4 rounded-2xl font-bold text-lg transition shadow-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.73 17.57C14.74 18.23 13.48 18.64 12 18.64C9.14 18.64 6.7 16.71 5.82 14.12H2.15V16.97C3.96 20.57 7.68 23 12 23Z" fill="#34A853"/>
                <path d="M5.82 14.12C5.6 13.46 5.47 12.75 5.47 12C5.47 11.25 5.6 10.54 5.82 9.88V7.03H2.15C1.41 8.5 1 10.2 1 12C1 13.8 1.41 15.5 2.15 16.97L5.82 14.12Z" fill="#FBBC05"/>
                <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.38 3.84C17.45 2.04 14.97 1 12 1C7.68 1 3.96 3.43 2.15 7.03L5.82 9.88C6.7 7.29 9.14 5.36 12 5.36Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={onBack} className="w-full mt-4 py-4 text-slate-400 font-medium hover:text-white transition">Cancel</button>
          </motion.div>
        )}

        {/* TASKS VIEW */}
        {view === "tasks" && connectedAccount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={connectedAccount.photo} alt="Profile" className="w-10 h-10 rounded-full border border-slate-700" />
                <div>
                  <p className="text-sm font-bold text-white">{connectedAccount.name}</p>
                  <p className="text-xs text-slate-400">{connectedAccount.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </div>
            </div>

            <h2 className="text-xl font-bold">Available Campaigns</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTasks.map(task => (
                <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition">
                  <div className="relative h-40">
                    <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-400" />
                      {task.watchTime}s
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-base line-clamp-1">{task.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>📺 {task.channel}</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{task.category}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-800 p-2 rounded-lg text-center">
                        <span className="block text-slate-400 mb-1">Reward</span>
                        <span className="font-bold text-emerald-400">₹{task.reward.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-800 p-2 rounded-lg text-center">
                        <span className="block text-slate-400 mb-1">Difficulty</span>
                        <span className="font-bold text-blue-400">{task.difficulty}</span>
                      </div>
                    </div>
                    <button onClick={() => handleStartTask(task)} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
                      <Play className="w-4 h-4 fill-white" />
                      Start Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TASK DETAIL VIEW */}
        {view === "task-detail" && selectedTask && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            
            {/* Step 1: Watch */}
            <div className={`bg-slate-900 border ${watchComplete ? 'border-emerald-500/50' : 'border-slate-800'} rounded-2xl p-4 transition-colors`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">1</span>
                  Watch Video
                </h3>
                {watchComplete && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>
              
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center group mb-4">
                <img src={selectedTask.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Video" />
                {!watchComplete && (
                  <button 
                    onClick={() => setIsWatching(!isWatching)}
                    className="z-10 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
                  >
                    {isWatching ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                  </button>
                )}
                {watchComplete && (
                  <div className="z-10 bg-emerald-500/90 backdrop-blur px-4 py-2 rounded-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Completed
                  </div>
                )}
              </div>
              
              {!watchComplete && (
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className={isWatching ? "text-blue-400" : "text-slate-400"}>
                      {isWatching ? "Watching..." : "Paused"}
                    </span>
                    <span>00:{watchTimeLeft.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-1000 ease-linear" 
                      style={{ width: `${((selectedTask.watchTime - watchTimeLeft) / selectedTask.watchTime) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Comment */}
            <div className={`bg-slate-900 border ${hasCommented ? 'border-emerald-500/50' : 'border-slate-800'} rounded-2xl p-4 transition-colors ${!watchComplete ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">2</span>
                  Post Comment
                </h3>
                {hasCommented && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>
              
              <div className="bg-slate-800 p-4 rounded-xl mb-4 text-center">
                <p className="text-sm font-medium text-slate-300 italic">"This is an amazing video! Very helpful."</p>
                <button 
                  onClick={() => {
                    setCopiedComment(true);
                    setTimeout(() => setCopiedComment(false), 2000);
                  }}
                  className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-2 mx-auto"
                >
                  <Copy className="w-3 h-3" />
                  {copiedComment ? "Copied!" : "Copy Comment"}
                </button>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                  <Youtube className="w-4 h-4" />
                  Open in YouTube App
                </button>
                <button 
                  onClick={() => setHasCommented(!hasCommented)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${hasCommented ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {hasCommented ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-500 rounded-sm" />}
                  I Have Commented
                </button>
              </div>
            </div>

            {/* Step 3: Like */}
            <div className={`bg-slate-900 border ${hasLiked ? 'border-emerald-500/50' : 'border-slate-800'} rounded-2xl p-4 transition-colors ${(!watchComplete || !hasCommented) ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">3</span>
                  Like Video
                </h3>
              </div>
              <button 
                  onClick={() => setHasLiked(!hasLiked)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${hasLiked ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {hasLiked ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-500 rounded-sm" />}
                  I have liked this video
              </button>
            </div>

            {/* Step 4: Screenshot */}
            <div className={`bg-slate-900 border ${screenshot ? 'border-emerald-500/50' : 'border-slate-800'} rounded-2xl p-4 transition-colors ${(!watchComplete || !hasCommented || !hasLiked) ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">4</span>
                  Upload Screenshot
                </h3>
              </div>
              
              {!screenshot ? (
                <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-800/50">
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                  <span className="font-bold text-slate-300">Tap to Upload</span>
                  <span className="text-xs text-slate-500">JPG, PNG up to 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                  <img src={screenshot} alt="Proof" className="w-full object-cover" />
                  <button onClick={() => setScreenshot(null)} className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg hover:bg-red-600 transition backdrop-blur">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-4 rounded-2xl font-black text-lg transition shadow-xl mt-8 ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 hover:-translate-y-1' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              Verify & Submit Task
            </button>
          </motion.div>
        )}

        {/* PENDING VIEW */}
        {view === "pending" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center mt-12">
             <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pending Review</h2>
            <p className="text-slate-400 mb-6">Your task submission has been received and is waiting for admin approval.</p>
            
            <div className="bg-slate-800 rounded-xl p-4 text-left space-y-3 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Task ID</span>
                <span className="font-mono text-sm">YT-8492-BX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Reward</span>
                <span className="font-bold text-emerald-400">₹{selectedTask?.reward.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Submitted At</span>
                <span className="text-sm">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView('tasks')} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition">Back to Tasks</button>
              <button onClick={() => setView('history')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition">View History</button>
            </div>
          </motion.div>
        )}

        {/* HISTORY VIEW */}
        {view === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-xl font-bold">Submission History</h2>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                <img src={mockTasks[0].thumbnail} className="w-full h-full object-cover" alt="Task" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm line-clamp-1">{mockTasks[0].title}</h4>
                <p className="text-xs text-slate-400">Submitted today</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-emerald-400">₹{mockTasks[0].reward.toFixed(2)}</span>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full mt-1 inline-block">Pending</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                <img src={mockTasks[1].thumbnail} className="w-full h-full object-cover" alt="Task" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm line-clamp-1">{mockTasks[1].title}</h4>
                <p className="text-xs text-slate-400">Submitted yesterday</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-emerald-400">₹{mockTasks[1].reward.toFixed(2)}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full mt-1 inline-block">Approved</span>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
