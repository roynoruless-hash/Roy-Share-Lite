import fs from "fs";

let content = fs.readFileSync("src/routes/splitOrSteal.ts", "utf8");

// Add imports
if (!content.includes("rateLimit")) {
  content = content.replace('import crypto from "crypto";', 'import crypto from "crypto";\nimport rateLimit from "express-rate-limit";\nimport sanitizeHtml from "sanitize-html";');
}

// Add global rate limiter
if (!content.includes("router.use(apiLimiter)")) {
  const limiterCode = `
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" }
});
const chatLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 5,
  message: { success: false, message: "Chat too fast" }
});
router.use(apiLimiter);
`;
  content = content.replace("const router = express.Router();", "const router = express.Router();" + limiterCode);
}

// Add chat endpoint
if (!content.includes('router.post("/chat"')) {
  const chatRoute = `
router.post("/chat", chatLimiter, async (req, res) => {
  try {
    const { telegramId, matchId, text } = req.body;
    if (!telegramId || !matchId || !text || typeof text !== "string") return res.status(400).json({ success: false, message: "Invalid payload" });
    
    const sanitizedText = sanitizeHtml(text.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    }).substring(0, 100);

    if (!sanitizedText) return res.status(400).json({ success: false, message: "Empty message" });

    const db = getDb();
    
    const matchSnap = await getDoc(doc(db, "sos_matches", matchId));
    if (!matchSnap.exists()) return res.status(404).json({ success: false });
    
    const match = matchSnap.data();
    if (match.status !== "discussion") return res.status(400).json({ success: false, message: "Not in discussion" });
    
    let isPlayer1 = match.player1.telegramId === String(telegramId);
    let isPlayer2 = match.player2.telegramId === String(telegramId);
    
    if (!isPlayer1 && !isPlayer2) return res.status(403).json({ success: false });
    
    const publicCode = isPlayer1 ? match.player1.publicCode : match.player2.publicCode;
    
    await addDoc(collection(db, "sos_messages"), {
      matchId,
      senderId: publicCode,
      text: sanitizedText,
      timestamp: serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;
  content += chatRoute;
}

// Validation logic for join, matchmake, etc. Let's not over-engineer with express-validator, just manual checks for safety since the inputs are simple.

fs.writeFileSync("src/routes/splitOrSteal.ts", content);
console.log("Hardened backend!");
