import { PlayCircle } from "lucide-react";

interface StandardTask {
  id: string;
  name: string;
  description?: string;
  amount: number;
}

interface StandardTaskCardProps {
  task: StandardTask;
  onStart: (taskId: string) => void;
}

export function StandardTaskCard({ task, onStart }: StandardTaskCardProps) {
  return (
    <div 
      id={`standard-task-${task.id}`}
      className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
    >
      <div className="flex justify-between items-start gap-4 text-left">
        <div>
          <h4 className="font-bold text-sm text-white">{task.name}</h4>
          <p className="text-xs text-slate-400 mt-1">{task.description}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1 rounded-xl text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider font-bold">REWARD</p>
          <p className="font-bold text-sm">₹{task.amount}</p>
        </div>
      </div>
      <button 
        id={`btn-start-standard-${task.id}`}
        onClick={() => onStart(task.id)}
        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
      >
        <PlayCircle className="w-4 h-4" /> Start Task
      </button>
    </div>
  );
}
