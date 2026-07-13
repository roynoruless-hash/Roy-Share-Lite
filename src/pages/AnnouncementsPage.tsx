import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { 
  Bell, 
  ArrowLeft, 
  Calendar,
  ChevronRight,
  ExternalLink,
  Info
} from "lucide-react";

export default function AnnouncementsPage({ onBack }: { onBack: () => void }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-amber-500" /> Announcements
            </h1>
            <p className="text-xs text-slate-500 font-medium">Stay updated with the latest news</p>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-medium">Loading updates...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No announcements yet</h3>
              <p className="text-sm text-slate-500">We'll notify you when there's something new.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann, idx) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-3 py-1.5 rounded-full border border-white/5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  {ann.priority === "high" && (
                    <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-500/20">
                      Important
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors mb-3 leading-tight">
                  {ann.title}
                </h3>
                
                <div className="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed whitespace-pre-line">
                  {ann.message}
                </div>

                {ann.link && (
                  <a 
                    href={ann.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
                  >
                    Learn More <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
