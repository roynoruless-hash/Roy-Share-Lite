import fs from "fs";

let content = fs.readFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", "utf8");

const varDefs = `  const isP1 = match.player1.publicCode === myPublicCode;
  const myData = isP1 ? match.player1 : match.player2;
  const oppData = isP1 ? match.player2 : match.player1;`;

content = content.replace(varDefs, "");

const insertTarget = `  useEffect(() => {
    if (revealCountdown !== null && revealCountdown > 0) {`;

content = content.replace(insertTarget, varDefs + "\n\n" + insertTarget);

fs.writeFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", content);
console.log("Fixed hook order!");
