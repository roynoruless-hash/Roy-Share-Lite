const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans pt-20">`;
    
const replacement = `return (
    <>
      {analyticsLinkId && (
         <div className="fixed inset-0 z-[100] bg-[#020617] overflow-y-auto">
            <LinkAnalyticsPage linkId={analyticsLinkId} onBack={() => setAnalyticsLinkId(null)} />
         </div>
      )}
      <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans pt-20">`;

if (code.indexOf(targetStr) !== -1) {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
    console.log("Patched render");
} else {
    console.log("Not found");
}
