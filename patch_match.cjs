const fs = require('fs');
let code = fs.readFileSync('src/components/split-or-steal/SplitOrStealMatch.tsx', 'utf8');

// Add mySubmitted
code = code.replace(
  'const oppData = isP1 ? match?.player2 : match?.player1;',
  'const oppData = isP1 ? match?.player2 : match?.player1;\n  const mySubmitted = isP1 ? match?.player1Submitted : match?.player2Submitted;'
);

// Replace myData?.decision with mySubmitted in useEffects
code = code.replace(
  'if (myData?.decision && match?.status !== "completed" && match?.status !== "revealing") {',
  'if (mySubmitted && match?.status !== "completed" && match?.status !== "revealing") {'
);

code = code.replace(
  '}, [myData?.decision, match]);',
  '}, [mySubmitted, match]);'
);

code = code.replace(
  'if (match.decisionEndTime && Date.now() > match.decisionEndTime && !myData?.decision && !submitting) {',
  'if (match.decisionEndTime && Date.now() > match.decisionEndTime && !mySubmitted && !submitting) {'
);

// Replace the render condition
code = code.replace(
  '{myData?.decision ? (',
  '{mySubmitted ? ('
);

fs.writeFileSync('src/components/split-or-steal/SplitOrStealMatch.tsx', code);
console.log("Patched SplitOrStealMatch.tsx");
