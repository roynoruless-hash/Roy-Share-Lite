import fs from "fs";

let content = fs.readFileSync("src/routes/splitOrSteal.ts", "utf8");

content = content.replace('t.update(matchRef, { status: "completed", p1Win, p2Win });', 't.update(matchRef, { status: "completed", p1Win, p2Win, player1: p1, player2: p2 });');

fs.writeFileSync("src/routes/splitOrSteal.ts", content);
console.log("Hardened result processing!");
