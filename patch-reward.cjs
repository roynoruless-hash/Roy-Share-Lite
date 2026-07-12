const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `const cpmAmount = Number(tData.cpmAmount) || 0;
      const rewardAmount = cpmAmount / 1000;`,
  `const cpmAmount = Number(tData.cpmAmount) || Number(tData.cpm) || 0;
      let rewardAmount = cpmAmount / 1000;
      if (rewardAmount === 0 && tData.rewardAmount) {
        rewardAmount = Number(tData.rewardAmount) || 0;
      }`
);

fs.writeFileSync('server.ts', code);
