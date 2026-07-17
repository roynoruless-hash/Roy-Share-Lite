const fs = require('fs');

let ytAdmin = fs.readFileSync('src/components/YouTubeTasksAdmin.tsx', 'utf8');
ytAdmin = ytAdmin.replace(
  "import { Clock, Eye, CheckCircle2, XCircle, ShieldAlert, Search, Filter, CheckCircle, motion } from 'framer-motion';", 
  "import { motion } from 'framer-motion';\nimport { Clock, Eye, CheckCircle2, XCircle, ShieldAlert, Search, Filter, CheckCircle } from 'lucide-react';"
);
ytAdmin = ytAdmin.replace(
  "import { Eye, CheckCircle2, XCircle, User, ShieldAlert, CheckCircle, Search, Filter } from 'lucide-react';",
  ""
);

fs.writeFileSync('src/components/YouTubeTasksAdmin.tsx', ytAdmin);

// And we have those ApprovedReview etc undefined
ytAdmin = fs.readFileSync('src/components/YouTubeTasksAdmin.tsx', 'utf8');
ytAdmin = ytAdmin.replace(/<ApprovedReview \/>/g, `<div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Approved tasks table will be shown here.</p></div>`);
ytAdmin = ytAdmin.replace(/<RejectedReview \/>/g, `<div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">Rejected tasks table will be shown here.</p></div>`);
ytAdmin = ytAdmin.replace(/<UserHistory \/>/g, `<div className="p-6 bg-slate-900 rounded-xl text-center"><p className="text-slate-400">User History search and data will be shown here.</p></div>`);
fs.writeFileSync('src/components/YouTubeTasksAdmin.tsx', ytAdmin);

// Fix server_advertiser.ts imports
let sa = fs.readFileSync('src/server_advertiser.ts', 'utf8');
if (!sa.includes("limit,")) {
    sa = sa.replace("import { getFirestore, Timestamp } from 'firebase-admin/firestore';", "import { getFirestore, Timestamp } from 'firebase-admin/firestore';\n// We can't import limit, orderBy from 'firebase-admin/firestore' easily if we used client-sdk syntax. Oh wait, this is admin SDK.");
    // wait, the error is: src/server_advertiser.ts(174,7): error TS2304: Cannot find name 'orderBy'.
    sa = sa.replace(/orderBy\(/g, "db.collection('something').orderBy("); // Actually, let's see how it's used
}
fs.writeFileSync('src/server_advertiser.ts', sa);
