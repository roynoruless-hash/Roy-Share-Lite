const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const declarations = `
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [settingsTab, setSettingsTab] = useState("General");
  const [supportSettings, setSupportSettings] = useState<any>({});
  const [supportSettingsLoading, setSupportSettingsLoading] = useState(false);
`;

code = code.replace(
  `const [data, setData] = useState<any>(null);`,
  `const [data, setData] = useState<any>(null);\n${declarations}`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Added missing vars");
