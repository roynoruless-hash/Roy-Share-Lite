import fs from "fs";

let content = fs.readFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", "utf8");

content = content.replace(`  const isP1 = match.player1.publicCode === myPublicCode;
  const myData = isP1 ? match.player1 : match.player2;
  const oppData = isP1 ? match.player2 : match.player1;

  useEffect(() => {
    if (revealCountdown !== null && revealCountdown > 0) {`, `  useEffect(() => {
    if (revealCountdown !== null && revealCountdown > 0) {`);

const newDefs = `  const isP1 = match?.player1?.publicCode === myPublicCode;
  const myData = isP1 ? match?.player1 : match?.player2;
  const oppData = isP1 ? match?.player2 : match?.player1;
`;

content = content.replace("  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);", newDefs + "\n  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);");

fs.writeFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", content);
console.log("Fixed hook usages");
