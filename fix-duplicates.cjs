const fs = require('fs');
let code = fs.readFileSync('src/pages/MiniAppHome.tsx', 'utf8');

// Remove duplicate state
code = code.replace(
  `  const [videoTasks, setVideoTasks] = useState<any[]>([]);
  const [loadingVideoTasks, setLoadingVideoTasks] = useState(false);
  const [activeVideoTaskId, setActiveVideoTaskId] = useState<string | null>(null);
  const [videoCompletions, setVideoCompletions] = useState<Record<string, number>>({});
  
  const [videoTasks, setVideoTasks] = useState<any[]>([]);
  const [loadingVideoTasks, setLoadingVideoTasks] = useState(false);
  const [activeVideoTaskId, setActiveVideoTaskId] = useState<string | null>(null);
  const [videoCompletions, setVideoCompletions] = useState<Record<string, number>>({});`,
  `  const [videoTasks, setVideoTasks] = useState<any[]>([]);
  const [loadingVideoTasks, setLoadingVideoTasks] = useState(false);
  const [activeVideoTaskId, setActiveVideoTaskId] = useState<string | null>(null);
  const [videoCompletions, setVideoCompletions] = useState<Record<string, number>>({});`
);

// Remove duplicate fetch
code = code.replace(
  `      // Fetch Video Ads Tasks
      setLoadingVideoTasks(true);
      fetch(\`\${API_BASE}/api/video-tasks\`)
        .then(res => res.json())
        .then(data => {
          setVideoTasks(Array.isArray(data) ? data : []);
          if (activeUser?.id) {
            fetch(\`\${API_BASE}/api/video-tasks/user-completions?userId=\${activeUser.id}\`)
              .then(r => r.json())
              .then(cData => {
                if (cData.counts) setVideoCompletions(cData.counts);
              });
          }
        })
        .finally(() => setLoadingVideoTasks(false));

      // Fetch GP Links Tasks and user completions
      setLoadingGpTasks(true);
      
      // Fetch Video Ads Tasks
      setLoadingVideoTasks(true);
      fetch(\`\${API_BASE}/api/video-tasks\`)
        .then(res => res.json())
        .then(data => {
          setVideoTasks(Array.isArray(data) ? data : []);
          if (activeUser?.id) {
            fetch(\`\${API_BASE}/api/video-tasks/user-completions?userId=\${activeUser.id}\`)
              .then(r => r.json())
              .then(cData => {
                if (cData.counts) setVideoCompletions(cData.counts);
              });
          }
        })
        .finally(() => setLoadingVideoTasks(false));

      // Fetch GP Links Tasks and user completions
      setLoadingGpTasks(true);`,
  `      // Fetch Video Ads Tasks
      setLoadingVideoTasks(true);
      fetch(\`\${API_BASE}/api/video-tasks\`)
        .then(res => res.json())
        .then(data => {
          setVideoTasks(Array.isArray(data) ? data : []);
          if (activeUser?.id) {
            fetch(\`\${API_BASE}/api/video-tasks/user-completions?userId=\${activeUser.id}\`)
              .then(r => r.json())
              .then(cData => {
                if (cData.counts) setVideoCompletions(cData.counts);
              });
          }
        })
        .finally(() => setLoadingVideoTasks(false));

      // Fetch GP Links Tasks and user completions
      setLoadingGpTasks(true);`
);

fs.writeFileSync('src/pages/MiniAppHome.tsx', code);
