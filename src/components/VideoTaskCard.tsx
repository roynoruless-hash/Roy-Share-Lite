import { PlayCircle, CheckCircle2, Video } from "lucide-react";

interface VideoTask {
  id: string;
  name: string;
  description?: string;
  rewardAmount: number;
  countdown?: string | number;
  dailyLimit?: string | number;
  type?: string;
}

interface VideoTaskCardProps {
  task: VideoTask;
  completions: number;
  onStart: (taskId: string) => void;
}

export function VideoTaskCard({ task, completions, onStart }: VideoTaskCardProps) {
  const dailyLimit = parseInt(String(task.dailyLimit || 0)) || 0;
  const isLimitReached = dailyLimit > 0 && completions >= dailyLimit;

  return (
    <div 
      id={`video-task-${task.id}`}
      className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
    >
      <div className="flex justify-between items-start gap-4 text-left">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-black uppercase flex items-center gap-1">
              <Video className="w-3 h-3" /> Video Ad
            </span>
            {task.name}
            {isLimitReached && (
              <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/25 rounded-full text-[10px] font-semibold">
                Daily Limit Reached
              </span>
            )}
            {!isLimitReached && completions > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full text-[10px] font-semibold">
                ✓ Watched {completions}{dailyLimit > 0 ? `/${dailyLimit}` : ""} times
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-1">{task.description}</p>
          <p className="text-[10px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
            ⏱️ Timer duration: {task.countdown || 30} seconds
            {dailyLimit > 0 && ` • Daily limit: ${dailyLimit} plays`}
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-xl text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider font-bold">REWARD</p>
          <p className="font-bold text-sm">₹{task.rewardAmount}</p>
        </div>
      </div>
      
      {isLimitReached ? (
        <button 
          id={`btn-completed-video-${task.id}`}
          disabled
          className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" /> Daily Limit Reached
        </button>
      ) : (
        <button 
          id={`btn-start-video-${task.id}`}
          onClick={() => onStart(task.id)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <PlayCircle className="w-4 h-4" /> Watch Video Ad
        </button>
      )}
    </div>
  );
}
