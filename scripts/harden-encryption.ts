import fs from "fs";

let content = fs.readFileSync("src/routes/splitOrSteal.ts", "utf8");

const encryptFn = `
function encryptId(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function decryptId(text: string) {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift() as string, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text; // fallback for unencrypted
  }
}
`;

if (!content.includes("encryptId(")) {
  content = content.replace("function getPublicCode", encryptFn + "\nfunction getPublicCode");
}

// matchmake
content = content.replace(
  'player1: { telegramId: String(telegramId)', 
  'player1: { encTelegramId: encryptId(String(telegramId))'
);
content = content.replace(
  'player2: { telegramId: opponent.telegramId', 
  'player2: { encTelegramId: encryptId(opponent.telegramId)'
);
content = content.replace(
  'player2: { telegramId: aiId', 
  'player2: { encTelegramId: encryptId(aiId)'
);

// submit-decision
content = content.replace(
  'const isPlayer1 = match.player1.telegramId === String(telegramId);',
  'const isPlayer1 = decryptId(match.player1.encTelegramId || match.player1.telegramId) === String(telegramId);'
);
content = content.replace(
  'const isPlayer2 = match.player2.telegramId === String(telegramId);',
  'const isPlayer2 = decryptId(match.player2.encTelegramId || match.player2.telegramId) === String(telegramId);'
);

// chat
content = content.replace(
  'let isPlayer1 = match.player1.telegramId === String(telegramId);',
  'let isPlayer1 = decryptId(match.player1.encTelegramId || match.player1.telegramId) === String(telegramId);'
);
content = content.replace(
  'let isPlayer2 = match.player2.telegramId === String(telegramId);',
  'let isPlayer2 = decryptId(match.player2.encTelegramId || match.player2.telegramId) === String(telegramId);'
);

// process-result
content = content.replace(
  'const u1Ref = doc(db, "users", p1.telegramId);',
  'const u1Ref = doc(db, "users", decryptId(p1.encTelegramId || p1.telegramId));'
);
content = content.replace(
  'userId: p1.telegramId,',
  'userId: decryptId(p1.encTelegramId || p1.telegramId),'
);
content = content.replace(
  'const u2Ref = doc(db, "users", p2.telegramId);',
  'const u2Ref = doc(db, "users", decryptId(p2.encTelegramId || p2.telegramId));'
);
content = content.replace(
  'userId: p2.telegramId,',
  'userId: decryptId(p2.encTelegramId || p2.telegramId),'
);
content = content.replace(
  't.delete(doc(db, "sos_queue", p1.telegramId));',
  't.delete(doc(db, "sos_queue", decryptId(p1.encTelegramId || p1.telegramId)));'
);
content = content.replace(
  't.delete(doc(db, "sos_queue", p2.telegramId));',
  't.delete(doc(db, "sos_queue", decryptId(p2.encTelegramId || p2.telegramId)));'
);

fs.writeFileSync("src/routes/splitOrSteal.ts", content);
console.log("Hardened encryption on backend!");
