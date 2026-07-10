const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const declarations = `
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [settingsTab, setSettingsTab] = useState("General");
  const [supportSettings, setSupportSettings] = useState<any>({});
  const [supportSettingsLoading, setSupportSettingsLoading] = useState(false);
`;

// Replace the duplicated declarations back to just the original line
code = code.split(declarations).join('');
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
