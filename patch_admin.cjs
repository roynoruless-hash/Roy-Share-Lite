const fs = require('fs');
let code = fs.readFileSync('src/components/VideoAdsAdminView.tsx', 'utf8');

const replacement = `                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Status</label>
                      <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Verification Mode</label>
                      <select value={editingTask.verificationMode || 'Auto'} onChange={e => setEditingTask({...editingTask, verificationMode: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                        <option value="Auto">Auto (Script Check)</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                  </div>`;

code = code.replace(/<div>\s*<label className="block text-sm font-bold text-slate-400 mb-1">Status<\/label>[\s\S]*?<\/select>\s*<\/div>/, replacement);
fs.writeFileSync('src/components/VideoAdsAdminView.tsx', code);
