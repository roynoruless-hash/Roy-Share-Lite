const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `<div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={smartLinkForm.autoGenerateAlias}
                                onChange={(e) =>
                                  setSmartLinkForm({
                                    ...smartLinkForm,
                                    autoGenerateAlias: e.target.checked,
                                  })
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                              />
                              Auto-Alias
                            </label>
                          </div>
                          {!smartLinkForm.autoGenerateAlias && (
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">
                                ✍️ Custom Alias
                              </label>
                              <input
                                type="text"
                                value={smartLinkForm.customAlias}
                                onChange={(e) =>
                                  setSmartLinkForm({
                                    ...smartLinkForm,
                                    customAlias: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                                placeholder="e.g. my-custom-link"
                              />
                            </div>
                          )}
                        </div>`;

const replacement = `<div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Password Protected Link</label>
                          <div className="flex items-center gap-4 mb-3">
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                              <input type="radio" checked={!smartLinkForm.isPasswordProtected} onChange={() => setSmartLinkForm({...smartLinkForm, isPasswordProtected: false})} className="text-indigo-600 focus:ring-indigo-500" /> No
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                              <input type="radio" checked={smartLinkForm.isPasswordProtected} onChange={() => setSmartLinkForm({...smartLinkForm, isPasswordProtected: true})} className="text-indigo-600 focus:ring-indigo-500" /> Yes
                            </label>
                          </div>
                          {smartLinkForm.isPasswordProtected && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                              <input type="text" value={smartLinkForm.password || ""} onChange={(e) => setSmartLinkForm({...smartLinkForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs" />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Custom Alias</label>
                          <div className="flex items-center gap-4 mb-3">
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                              <input type="radio" checked={smartLinkForm.autoGenerateAlias} onChange={() => setSmartLinkForm({...smartLinkForm, autoGenerateAlias: true, customAlias: ""})} className="text-indigo-600 focus:ring-indigo-500" /> No
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                              <input type="radio" checked={!smartLinkForm.autoGenerateAlias} onChange={() => setSmartLinkForm({...smartLinkForm, autoGenerateAlias: false})} className="text-indigo-600 focus:ring-indigo-500" /> Yes
                            </label>
                          </div>
                          {!smartLinkForm.autoGenerateAlias && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-slate-400 mb-1">Alias</label>
                              <input type="text" value={smartLinkForm.customAlias} onChange={(e) => setSmartLinkForm({...smartLinkForm, customAlias: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs" placeholder="myalias" />
                            </div>
                          )}
                        </div>`;

if(code.indexOf(targetStr) === -1) {
    console.error("Target not found!");
} else {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
    console.log("Patched UI");
}
