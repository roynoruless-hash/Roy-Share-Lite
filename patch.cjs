const fs = require('fs');
const path = './src/pages/MiniAppHome.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const handleStartTask = (taskId: string, shortenerUrl: string, type: "task" | "gplink") => {
    if (!shortenerUrl) {
      alert("No shortener URL provided for this task.");
      return;
    }
    localStorage.setItem("pending_verification_taskId", taskId);
    localStorage.setItem("pending_verification_type", type);
    window.location.href = shortenerUrl;
  };`;

const replacement = `  const handleStartTask = (taskId: string, shortenerUrl: string, type: "task" | "gplink") => {
    if (!shortenerUrl) {
      alert("No shortener URL provided for this task.");
      return;
    }
    localStorage.setItem("pending_verification_taskId", taskId);
    localStorage.setItem("pending_verification_type", type);

    let finalUrl = shortenerUrl;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && !finalUrl.startsWith("/")) {
       finalUrl = "https://" + finalUrl;
    }

    const tgApp = (window as any).Telegram?.WebApp;
    if (finalUrl.startsWith("/") || !tgApp || !tgApp.openLink) {
       window.location.href = finalUrl;
    } else {
       tgApp.openLink(finalUrl, { try_instant_view: false });
    }
  };`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Patched successfully');
} else {
    console.log('Target content not found in', path);
}
