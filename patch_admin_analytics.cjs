const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Add import
if (!code.includes("import LinkAnalyticsPage")) {
  code = code.replace(
    `import { useTelegramAuth } from "../context/TelegramAuthContext";`,
    `import { useTelegramAuth } from "../context/TelegramAuthContext";\nimport LinkAnalyticsPage from "./LinkAnalyticsPage";`
  );
}

// Add state for analytics view
if (!code.includes("const [analyticsLinkId, setAnalyticsLinkId]")) {
  code = code.replace(
    `const [smartLinks, setSmartLinks] = useState<any[]>([]);`,
    `const [smartLinks, setSmartLinks] = useState<any[]>([]);\n  const [analyticsLinkId, setAnalyticsLinkId] = useState<string | null>(null);`
  );
}

// Add analytics button
const btnTarget = `<button
                                        onClick={() => {
                                          setSmartLinkForm({
                                            ...link,
                                            autoGenerateAlias:
                                              !link.customAlias && link.alias
                                                ? false
                                                : true,
                                          });
                                          setModalAction("edit_smart_link");
                                        }}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer"
                                      >
                                        ✏️ Edit
                                      </button>`;

const btnReplacement = `<button onClick={() => {
                                            if (navigator.clipboard) {
                                               navigator.clipboard.writeText(link.shortUrl || link.destinationUrl);
                                               alert("Copied to clipboard!");
                                            }
                                        }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer">
                                        📋 Copy
                                      </button>
                                      <button onClick={() => {
                                            const shareData = { title: 'Link', url: link.shortUrl || link.destinationUrl };
                                            if (navigator.share && navigator.canShare(shareData)) {
                                               navigator.share(shareData);
                                            } else {
                                               alert("Share not supported. Copy instead!");
                                            }
                                        }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer">
                                        📤 Share
                                      </button>
                                      <button onClick={() => setAnalyticsLinkId(link.id || link.alias)} className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded font-medium transition cursor-pointer border border-blue-500/30">
                                        📊 Analytics
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSmartLinkForm({
                                            ...link,
                                            autoGenerateAlias:
                                              !link.customAlias && link.alias
                                                ? false
                                                : true,
                                          });
                                          setModalAction("edit_smart_link");
                                        }}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition cursor-pointer"
                                      >
                                        ✏️ Edit
                                      </button>`;

if (code.indexOf(btnTarget) !== -1) {
    code = code.replace(btnTarget, btnReplacement);
} else {
    console.log("Could not find button target");
}

// Render AnalyticsPage inside the main view if active
const renderTarget = `return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col md:flex-row">`;
    
const renderReplacement = `return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col md:flex-row">
      {analyticsLinkId && (
         <div className="fixed inset-0 z-50 bg-[#020617] overflow-y-auto">
            <LinkAnalyticsPage linkId={analyticsLinkId} onBack={() => setAnalyticsLinkId(null)} />
         </div>
      )}`;

if (code.indexOf(renderTarget) !== -1) {
    code = code.replace(renderTarget, renderReplacement);
} else {
    console.log("Could not find render target");
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard analytics");
