const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvertiserPanel/AdvertiserDashboard.tsx', 'utf8');

if (!code.includes('isNotifOpen')) {
  // inject state
  code = code.replace(
    'const [isRechargeOpen, setIsRechargeOpen] = useState(false);',
    'const [isRechargeOpen, setIsRechargeOpen] = useState(false);\n  const [isNotifOpen, setIsNotifOpen] = useState(false);\n  const [notifications, setNotifications] = useState<any[]>([]);'
  );

  // inject function
  const notifFunc = `
  const fetchNotifications = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/api/advertiser/\${advertiser.id}/notifications\`);
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (advertiser) {
      fetchNotifications();
    }
  }, [advertiser]);
  `;
  code = code.replace('const handleRecharge = async () => {', notifFunc + '\n  const handleRecharge = async () => {');

  // inject button
  code = code.replace(
    '<button onClick={() => setIsRechargeOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition shadow-lg shadow-emerald-500/20">',
    `<button onClick={() => setIsNotifOpen(true)} className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              🔔
            </button>
            <button onClick={() => setIsRechargeOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition shadow-lg shadow-emerald-500/20">`
  );

  // inject modal
  const modalUi = `
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No notifications yet</div>
              ) : (
                notifications.map((n: any, idx) => (
                  <div key={idx} className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm">
                    <p className="text-white">{n.message}</p>
                    <span className="text-xs text-slate-500 mt-1 block">Just now</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
  `;
  
  code = code.replace('{isRechargeOpen && (', modalUi + '\n      {isRechargeOpen && (');
  fs.writeFileSync('src/pages/AdvertiserPanel/AdvertiserDashboard.tsx', code);
  console.log("Patched AdvertiserDashboard with Notifications");
}
