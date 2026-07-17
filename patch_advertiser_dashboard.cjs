const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvertiserPanel/AdvertiserDashboard.tsx', 'utf8');

if (!code.includes('isRechargeOpen')) {
  // inject state
  code = code.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [isRechargeOpen, setIsRechargeOpen] = useState(false);\n  const [rechargeAmount, setRechargeAmount] = useState(1000);'
  );

  // inject function
  const rechargeFunc = `
  const handleRecharge = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/api/advertiser/wallet/recharge\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertiserId: advertiser.id, amount: rechargeAmount })
      });
      const data = await res.json();
      if (data.success) {
        alert("Wallet recharged successfully. Please login again or refresh to see balance update (mock feature).");
        setIsRechargeOpen(false);
      }
    } catch (e) {
      alert("Recharge failed");
    }
  };
  `;
  code = code.replace('return (', rechargeFunc + '\n  return (');

  // inject button logic
  code = code.replace(
    '<button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition shadow-lg shadow-emerald-500/20">',
    '<button onClick={() => setIsRechargeOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition shadow-lg shadow-emerald-500/20">'
  );

  // inject modal
  const modalUi = `
      {isRechargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Recharge Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                <input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsRechargeOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition">Cancel</button>
                <button onClick={handleRecharge} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">Pay Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
  `;
  
  code = code.replace('</div>\n  );\n}', modalUi + '    </div>\n  );\n}');
  fs.writeFileSync('src/pages/AdvertiserPanel/AdvertiserDashboard.tsx', code);
  console.log("Patched AdvertiserDashboard");
}
