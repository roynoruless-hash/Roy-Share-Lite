import fs from "fs";

let content = fs.readFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", "utf8");

const oldCode = `    await addDoc(collection(db, "sos_messages"), {
      matchId,
      senderId: myCode,
      text: finalMsg,
      timestamp: serverTimestamp()
    });`;

const newCode = `    await fetch(\`\${API_BASE}/api/split-or-steal/chat\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: user?.telegramId, matchId, text: finalMsg })
    }).catch(console.error);`;

content = content.replace(oldCode, newCode);

fs.writeFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", content);
console.log("Hardened frontend!");
