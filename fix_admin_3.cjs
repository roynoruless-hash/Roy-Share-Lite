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
  const setAdSettings = (val?: any) => {};
  const adSettingsLoading = false;
  const setAdSettingsLoading = (val?: any) => {};
  const adSettingsFeedback = "";
  const setAdSettingsFeedback = (val?: any) => {};
  const adSettingsError = "";
  const setAdSettingsError = (val?: any) => {};
  const adSettingsLastUpdated = "";
  const setAdSettingsLastUpdated = (val?: any) => {};
  const ezmobTestState = "PLAYING" as any;
  const setEzmobTestState = (val?: any) => {};
  const ezmobTestLogs = [] as any[];
  const setEzmobTestLogs = (val?: any) => {};
  const ezmobDiagnostics = {
    container: false,
    sdk: false,
    auction: false,
    bid: false,
    status: false
  } as any;
  const setEzmobDiagnostics = (val?: any) => {};

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
  const setAdPlacements = (val?: any) => {};
  const setAdPlacementsLoading = (val?: any) => {};
  
  const OnClickABanner = (props: any) => <div />;
`;

const updatedCode = code.replace(/\/\/ AD SETTINGS DUMMY[\s\S]*?const OnClickABanner = \(props: any\) => <div \/>;/, replacement.trim());
fs.writeFileSync('src/pages/AdminDashboard.tsx', updatedCode);
