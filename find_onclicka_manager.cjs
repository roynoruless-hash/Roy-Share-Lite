const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

let startIndex = code.indexOf('{/* OnClickA Banner Configuration */}');
let endIndex = code.indexOf('                      </div>\n\n                      <div className="pt-4 border-t border-slate-800">', startIndex);
if (endIndex === -1) {
    endIndex = code.indexOf('{/* SAVE BUTTON */}', startIndex);
}

if (startIndex !== -1) {
    console.log("Found OnClickA Banner Config start at", startIndex);
    console.log("End is around", endIndex);
    
    // Let's get context around it to be sure what to remove
    console.log(code.substring(startIndex - 200, startIndex + 200));
} else {
    console.log("Could not find OnClickA Banner Configuration");
}
