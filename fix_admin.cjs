const fs = require('fs');

const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const replacement = `
  // AD SETTINGS DUMMY
  const adSettings = {
    enabled: false,
    network: "disabled",
    onclickaSpots: [],
    onclickaEnabled: false,
    ezmobEnabled: false,
    ezmobEnableTransitions: false,
    verified: false,
    script: "",
    onclickaSdkScript: "",
    bannerContainerCode: "",
  };
  const setAdSettings = () => {};
  const adSettingsLoading = false;
  const setAdSettingsLoading = () => {};
  const adSettingsFeedback = "";
  const setAdSettingsFeedback = () => {};
  const adSettingsError = "";
  const setAdSettingsError = () => {};
  const adSettingsLastUpdated = "";
  const setAdSettingsLastUpdated = () => {};
  const ezmobTestState = "";
  const setEzmobTestState = () => {};
  const ezmobTestLogs = [];
  const setEzmobTestLogs = () => {};
  const ezmobDiagnostics = {};
  const setEzmobDiagnostics = () => {};

  const handleRunEzmobTest = () => {};
  const saveAdSettings = () => {};
  
  const [ads, setAds] = useState([]);
  const [adForm, setAdForm] = useState<any>(null);
  const [showAdPreview, setShowAdPreview] = useState(false);
  const [spotPreviews, setSpotPreviews] = useState<any>({});
  const [spotDiagShow, setSpotDiagShow] = useState<any>({});
  const [spotDiagnostics, setSpotDiagnostics] = useState<any>({});
  
  const OnClickABanner = () => <div />;
`;

const updatedCode = code.replace(/\/\/ AD SETTINGS DUMMY[\s\S]*?const setEzmobDiagnostics = \(\) => \{\};/, replacement.trim());
fs.writeFileSync('src/pages/AdminDashboard.tsx', updatedCode);
