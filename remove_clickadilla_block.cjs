const fs = require('fs');

let code = fs.readFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', 'utf8');

const clickAdillaIntegrationStr = '<ShieldCheck className="w-4 h-4" /> ClickAdilla Integration</h4>';
const startIdx = code.indexOf('<div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5 space-y-4">');

if (startIdx !== -1) {
  // Let's find the closing div of this block. We'll use regex or simple replacement if it's the only one.
  // Actually, we can just replace the JSX block with a message about global configuration.
  const replacement = `
                  <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-blue-400 font-bold flex items-center gap-2 border-b border-blue-500/20 pb-2"><ShieldCheck className="w-4 h-4" /> ClickAdilla Integration</h4>
                    <p className="text-sm text-blue-300">
                      ClickAdilla Ads are now managed globally via the <b>Ads Manager</b> module. 
                      Every task automatically uses the saved API, Spot, HTML, CSS, and JS configurations.
                    </p>
                  </div>
`;
  
  const endIdx = code.indexOf('                  </div>\n                </div>\n              </div>\n            </div>\n\n            <div className="p-6 border-t');
  
  if (endIdx !== -1) {
      code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
      fs.writeFileSync('/app/applet/src/components/VideoAdsAdminView.tsx', code);
      console.log("Successfully removed ClickAdilla manual config from tasks");
  } else {
      console.log("Could not find end index");
  }
}
