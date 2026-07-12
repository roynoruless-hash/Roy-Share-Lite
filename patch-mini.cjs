const fs = require('fs');
let code = fs.readFileSync('src/pages/MiniAppHome.tsx', 'utf8');

code = code.replace(
  `// Filter to active tasks
          const activeTasks = fetchedTasks.filter((t) => 
            t.status === "🟢 Active" || 
            String(t.status || "").toLowerCase().includes("active")
          );`,
  `// Filter to active tasks, excluding shortener tasks
          const activeTasks = fetchedTasks.filter((t) => 
            (t.status === "🟢 Active" || String(t.status || "").toLowerCase().includes("active")) &&
            !t.shortenerUrl && 
            t.provider !== "Other" && 
            t.provider !== "GPLinks"
          );`
);

code = code.replace(
  `onClick={() => handleStartTask(task.id, task.shortenerUrl, "task")}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" /> Start Task
                          </button>`,
  `onClick={() => setActiveTaskId(task.id)}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" /> Start Task
                          </button>`
);

fs.writeFileSync('src/pages/MiniAppHome.tsx', code);
