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
    ezmobPrebidScript: "",
    ezmobRendererScript: "",
    ezmobZoneId: "",
    ezmobHost: "",
    ezmobContainerId: "",
    ezmobVpaidMode: "",
    ezmobPlayerSizeMode: "",
    ezmobDisplayMode: ""
  };
  const setAdSettings = (val: any) => {};
  const adSettingsLoading = false;
  const setAdSettingsLoading = () => {};
  const adSettingsFeedback = "";
  const setAdSettingsFeedback = () => {};
  const adSettingsError = "";
  const setAdSettingsError = () => {};
  const adSettingsLastUpdated = "";
  const setAdSettingsLastUpdated = () => {};
  const ezmobTestState = "PLAYING" as any;
  const setEzmobTestState = () => {};
  const ezmobTestLogs = [];
  const setEzmobTestLogs = () => {};
  const ezmobDiagnostics = {
    container: false,
    sdk: false,
    auction: false,
    bid: false,
    status: false
  } as any;
  const setEzmobDiagnostics = () => {};

  const handleRunEzmobTest = () => {};
  const saveAdSettings = () => {};
  const fetchAdSettings = () => {};
  
  const [ads, setAds] = useState([]);
  const [adForm, setAdForm] = useState<any>(null);
  const [showAdPreview, setShowAdPreview] = useState(false);
  const [spotPreviews, setSpotPreviews] = useState<any>({});
  const [spotDiagShow, setSpotDiagShow] = useState<any>({});
  const [spotDiagnostics, setSpotDiagnostics] = useState<any>({});
  const [adSubTab, setAdSubTab] = useState("general");
  const setAdPlacements = () => {};
  
  const OnClickABanner = (props: any) => <div />;
`;

const updatedCode = code.replace(/\/\/ AD SETTINGS DUMMY[\s\S]*?const OnClickABanner = \(\) => <div \/>;/, replacement.trim());
fs.writeFileSync('src/pages/AdminDashboard.tsx', updatedCode);
