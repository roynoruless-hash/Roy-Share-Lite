const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const missingVars = `  const [aiGenSettings, setAiGenSettings] = useState<any>({});
  const [aiPreviewRewards, setAiPreviewRewards] = useState<any>(null);
  const [usersError, setUsersError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [adPlacements, setAdPlacements] = useState<any>({});
  const [adPlacementsLoading, setAdPlacementsLoading] = useState(false);
  const [rejectionType, setRejectionType] = useState("normal");`;

// Replace the buggy aiGenSettings and aiPreviewRewards 
code = code.replace(/const \[aiGenSettings, setAiGenSettings\] = useState\(false\);/, "");
code = code.replace(/const \[aiPreviewRewards, setAiPreviewRewards\] = useState\(false\);/, "");

code = code.replace(
  /const \[currentTime, setCurrentTime\] = useState\(new Date\(\)\);/,
  `const [currentTime, setCurrentTime] = useState(new Date());\n${missingVars}`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Lint issues fixed");
