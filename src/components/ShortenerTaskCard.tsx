import { CheckCircle2, Zap } from "lucide-react";

interface ShortenerTask {
  id: string;
  provider?: string;
  title?: string;
  timerDuration?: number;
  cpmAmount?: number;
  shortenerUrl?: string;
  gpLinksUrl?: string;
}

interface ShortenerTaskCardProps {
  task: ShortenerTask;
  isCompleted: boolean;
  onStart: (taskId: string, url: string) => void;
}

export function ShortenerTaskCard({ task, isCompleted, onStart }: ShortenerTaskCardProps) {
  const rewardPerView = (task.cpmAmount || 0) / 1000;
  const url = task.shortenerUrl || task.gpLinksUrl || "";

  return (
    <div 
      id={`shortener-task-${task.id}`}
      className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
    >
      <div className="flex justify-between items-start gap-4 text-left">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-black uppercase">
              {task.provider || "GPLinks"}
            </span>
            {task.title}
            {isCompleted && (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full text-[10px] font-semibold">
                ✓ Claimed
              </span>
            )}
          </h4>
          <p className="text-[10px] text-indigo-400 font-semibold mt-1 flex items-center gap-1">
            ⏱️ Wait duration: {task.timerDuration || 5} seconds
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider font-bold">REWARD</p>
          <p className="font-black text-sm">₹{rewardPerView.toFixed(4)}</p>
        </div>
      </div>
      
      {isCompleted ? (
        <button 
          id={`btn-claimed-shortener-${task.id}`}
          disabled
          className="w-full py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" /> Reward Claimed Successfully
        </button>
      ) : (
        <button 
          id={`btn-start-shortener-${task.id}`}
          onClick={() => onStart(task.id, url)}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
        >
          <Zap className="w-4 h-4" /> Start {task.provider || "Shortener"} Task
        </button>
      )}
    </div>
  );
}
