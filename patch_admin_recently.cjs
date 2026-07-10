const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `                  <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      🔗 Self-Hosted Smart URL Shortener (SELF MODE)
                    </h2>`;

const recentlyCreatedSection = `                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">✨ Recently Created</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {smartLinks.slice(0, 3).map(link => (
                        <div key={link.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                             <div className="flex flex-col">
                               <span className="text-white font-bold text-sm truncate max-w-[200px]" title={link.destinationUrl}>{link.destinationUrl}</span>
                               <span className="text-indigo-400 text-xs font-mono">{link.shortUrl}</span>
                             </div>
                             <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${link.status === "Enabled" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}\`}>{link.status}</span>
                           </div>
                           <div className="flex flex-wrap gap-2 mt-auto">
                              <button onClick={() => {
                                  if (navigator.clipboard) {
                                     navigator.clipboard.writeText(link.shortUrl || link.destinationUrl);
                                     alert("Copied to clipboard!");
                                  }
                              }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition">📋 Copy</button>
                              <button onClick={() => {
                                  const shareData = { title: 'Link', url: link.shortUrl || link.destinationUrl };
                                  if (navigator.share && navigator.canShare(shareData)) {
                                     navigator.share(shareData);
                                  } else {
                                     alert("Share not supported");
                                  }
                              }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition">📤 Share</button>
                              <button onClick={() => setAnalyticsLinkId(link.id || link.alias)} className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-xs rounded transition">📊 Analytics</button>
                              <button onClick={() => {
                                setSmartLinkForm({
                                  ...link,
                                  autoGenerateAlias: !link.customAlias && link.alias ? false : true,
                                });
                                setModalAction("edit_smart_link");
                              }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition">✏️ Edit</button>
                              <button onClick={async () => {
                                if (confirm("Delete this smart link?")) {
                                  try {
                                    const res = await fetch(\`/api/admin/smart-links/\${link.id}\`, { method: "DELETE" });
                                    if (res.ok) fetchSmartLinks();
                                  } catch(e) {}
                                }
                              }} className="px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs rounded transition">🗑️ Delete</button>
                           </div>
                        </div>
                      ))}
                      {smartLinks.length === 0 && <p className="text-slate-500 text-sm">No links found.</p>}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      🔗 Self-Hosted Smart URL Shortener (SELF MODE)
                    </h2>`;

if (code.indexOf(targetStr) !== -1) {
    code = code.replace(targetStr, recentlyCreatedSection);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
    console.log("Patched AdminDashboard Recently Created");
} else {
    console.log("Not found targetStr");
}
