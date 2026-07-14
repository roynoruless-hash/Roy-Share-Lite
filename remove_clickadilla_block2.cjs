const fs = require('fs');

let code = fs.readFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', 'utf8');

const startIdx = code.indexOf('<div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5 space-y-4">');
const endIdx = code.indexOf('              <div className="pt-4 flex justify-end border-t border-slate-800">');

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `
                  <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-blue-400 font-bold flex items-center gap-2 border-b border-blue-500/20 pb-2"><ShieldCheck className="w-4 h-4" /> ClickAdilla Integration</h4>
                    <p className="text-sm text-blue-300">
                      ClickAdilla Ads are now managed globally via the <b>Ads Manager</b> module. 
                      Every task automatically uses the saved API, Spot, HTML, CSS, and JS configurations.
                    </p>
                  </div>
                </div>
              </div>

`;
      code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
      fs.writeFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', code);
      console.log("Successfully removed manual ClickAdilla config");
} else {
    console.log("Not found.");
}
