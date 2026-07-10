const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `    </div>
  );
}`;
    
const replacementStr = `    </div>
    </>
  );
}`;

if (code.endsWith(targetStr) || code.includes(targetStr)) {
   code = code.substring(0, code.lastIndexOf(targetStr)) + replacementStr;
   fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
   console.log("Fixed end");
} else {
   console.log("Could not find end block");
}
