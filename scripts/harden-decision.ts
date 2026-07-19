import fs from "fs";

let content = fs.readFileSync("src/routes/splitOrSteal.ts", "utf8");

// Validate decision payload
if (!content.includes('if (decision !== "split" && decision !== "steal")')) {
  content = content.replace('const { telegramId, matchId, decision } = req.body;\n    if (!telegramId || !matchId || !decision) return res.status(400).json({ success: false });', 'const { telegramId, matchId, decision } = req.body;\n    if (!telegramId || !matchId || !decision) return res.status(400).json({ success: false });\n    if (decision !== "split" && decision !== "steal") return res.status(400).json({ success: false, message: "Invalid decision" });');
}

fs.writeFileSync("src/routes/splitOrSteal.ts", content);
console.log("Hardened decision!");
