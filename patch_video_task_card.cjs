const fs = require('fs');

const code = `import { PlayCircle, CheckCircle2, Video, Clock, Zap } from "lucide-react";

interface VideoTask {
  id: string;
  name: string;
  description?: string;
  rewardAmount: number;
  countdown?: string | number;
  dailyLimit?: string | number;
  perUserLimit?: string | number;
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
      id={\`video-task-\${task.id}\`}
      className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col gap-4 transition-all"
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-500" />
            {task.name}
          </h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-right shrink-0">
          <p className="font-bold font-mono">₹{Number(task.rewardAmount).toFixed(2)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <Clock className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
          <div className="text-[10px] text-slate-400 font-bold">{task.countdown}s</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
          <div className="text-[10px] text-slate-400 font-bold">Easy</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
          <div className="text-[10px] text-slate-400 font-bold">
            {completions}{dailyLimit > 0 ? \`/\${dailyLimit}\` : ""}
          </div>
        </div>
      </div>

      {isLimitReached ? (
        <button 
          disabled
          className="w-full py-3 bg-slate-800 text-slate-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" /> Daily Limit Reached
        </button>
      ) : (
        <button 
          onClick={() => onStart(task.id)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <PlayCircle className="w-4 h-4" /> 🎥 Watch Ads
        </button>
      )}
    </div>
  );
}
`
fs.writeFileSync('/app/applet/src/components/VideoTaskCard.tsx', code);
console.log("Updated VideoTaskCard.tsx");
