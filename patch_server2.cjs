const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('/api/smart-links/session/verify-password')) {
  const insertIndex = code.indexOf('app.post("/api/smart-links/session/page-complete"');
  const verifyEndpoint = `
  app.post("/api/smart-links/session/verify-password", async (req, res) => {
    try {
      const { sessionId, password } = req.body;
      if (!sessionId || !password) return res.status(400).json({ success: false, message: "Missing sessionId or password" });

      const sessionSnap = await getDoc(doc(db, "shortener_sessions", sessionId));
      if (!sessionSnap.exists()) return res.status(404).json({ success: false, message: "Session not found" });
      const sessionData = sessionSnap.data();

      // Find the link
      let linkSnap = await getDoc(doc(db, "smart_links", sessionData.linkId));
      if (!linkSnap.exists()) {
         linkSnap = await getDoc(doc(db, "links", sessionData.linkId));
      }
      if (!linkSnap.exists()) {
        const qLinkAlias = query(collection(db, "links"), where("alias", "==", sessionData.linkId));
        const qLinkAliasSnap = await getDocs(qLinkAlias);
        if (!qLinkAliasSnap.empty) {
          linkSnap = qLinkAliasSnap.docs[0];
        } else {
          const qSmart = query(collection(db, "smart_links"), where("alias", "==", sessionData.linkId));
          const qSmartSnap = await getDocs(qSmart);
          if (!qSmartSnap.empty) {
             linkSnap = qSmartSnap.docs[0];
          }
        }
      }

      if (!linkSnap || !linkSnap.exists) return res.status(404).json({ success: false, message: "Link not found" });
      
      const linkData = linkSnap.exists() ? linkSnap.data() : linkSnap.data();
      
      if (linkData.password === password) {
         // Optionally track password unlocked in session
         await updateDoc(doc(db, "shortener_sessions", sessionId), { passwordVerified: true });
         return res.json({ success: true });
      } else {
         return res.status(401).json({ success: false, message: "Incorrect password" });
      }
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  `;
  code = code.substring(0, insertIndex) + verifyEndpoint + code.substring(insertIndex);
  fs.writeFileSync('server.ts', code);
  console.log('Endpoint added');
} else {
  console.log('Already added');
}
