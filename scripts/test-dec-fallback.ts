import crypto from "crypto";

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

console.log(decryptId("987654321"));
