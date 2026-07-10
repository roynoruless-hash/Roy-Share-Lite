const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `<span
                                      className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${link.status === "Enabled" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"}\`}
                                    >
                                      {link.status}
                                    </span>`;

const replacement = `<div className="flex flex-col gap-1 items-start">
                                      <span
                                        className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${link.status === "Enabled" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"}\`}
                                      >
                                        {link.status === "Enabled" ? "Active" : "Disabled"}
                                      </span>
                                      {link.isPasswordProtected && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                          Password Protected
                                        </span>
                                      )}
                                      {link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                          Custom Alias
                                        </span>
                                      )}
                                    </div>`;

if(code.indexOf(targetStr) === -1) {
    console.error("Target not found!");
} else {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
    console.log("Patched status badge");
}
