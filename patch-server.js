const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'const q = query(collection(db, "gplinks_tasks"));',
  `const q1 = query(collection(db, "gplinks_tasks"));
      const snapshot1 = await getDocs(q1);
      const q2 = query(collection(db, "tasks"));
      const snapshot2 = await getDocs(q2);
      
      const allTasks = [
        ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snapshot2.docs
          .filter(doc => doc.data().shortenerUrl || (doc.data().provider && doc.data().provider !== "monetag_mini"))
          .map(doc => {
             const d = doc.data();
             return {
               id: doc.id,
               ...d,
               cpmAmount: d.cpm || d.cpmAmount,
               provider: d.customProvider || d.provider,
             };
          })
      ];`
);
code = code.replace(
  'const snapshot = await getDocs(q);\n      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));',
  ''
);
// wait, the status in tasks is "🟢 Active", but in gplinks_tasks it's "Active".
code = code.replace(
  'if (t.status !== "Active") return false;',
  'if (t.status !== "Active" && t.status !== "🟢 Active" && !String(t.status || "").toLowerCase().includes("active")) return false;'
);

fs.writeFileSync('server.ts', code);
