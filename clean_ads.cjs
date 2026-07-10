const fs = require('fs');

function removeBlock(code, startMarker, endMarker) {
    const startIndex = code.indexOf(startMarker);
    if (startIndex === -1) return code;
    
    // For nested braces matching, we can do something simple or just string search if end is unique
    let endIndex = code.indexOf(endMarker, startIndex);
    if (endIndex === -1) return code;
    
    return code.substring(0, startIndex) + code.substring(endIndex + endMarker.length);
}

function removeBetween(code, startStr, endStr) {
    const start = code.indexOf(startStr);
    if (start === -1) return code;
    let end = code.indexOf(endStr, start);
    if (end === -1) return code;
    return code.substring(0, start) + code.substring(end + endStr.length);
}

try {
    let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

    // Remove the false && activeTab Advertisement Settings block completely.
    const advTabStart = `{false && activeTab === "📢 Advertisement Settings" && (`
    let advTabStartIndex = code.indexOf(advTabStart);
    if (advTabStartIndex !== -1) {
        // Since the block is huge, we'll find its end by looking for the next JSX block or end of file
        // It ends at `) : null}` or similar.
        const nextBlock = `        </div>
      ) : null}
    </div>
  );
}`;
        let advTabEndIndex = code.indexOf(nextBlock, advTabStartIndex);
        if (advTabEndIndex !== -1) {
             code = code.substring(0, advTabStartIndex) + nextBlock;
        } else {
             console.log("Could not find end of Advertisement Settings tab");
        }
    }

    // Remove ad settings variables
    const varsToRemove = [
        `const [adSettings, setAdSettings] = useState<any>({`,
        `const [adSettingsLoading, setAdSettingsLoading] = useState(false);`,
        `const [adSubTab, setAdSubTab] = useState("general");`,
        `const [adForm, setAdForm] = useState<any>(null);`,
        `const [showAdPreview, setShowAdPreview] = useState(false);`,
        `const [spotPreviews, setSpotPreviews] = useState<any>({});`,
        `const [spotDiagShow, setSpotDiagShow] = useState<any>({});`,
        `const [spotDiagnostics, setSpotDiagnostics] = useState<any>({});`,
        `const [adPlacements, setAdPlacements] = useState<any[]>([]);`,
        `const [adPlacementsLoading, setAdPlacementsLoading] = useState(false);`,
        `const setAdPlacements = (val?: any) => {};`,
        `const setAdPlacementsLoading = (val?: any) => {};`,
        `const OnClickABanner = (props: any) => <div />;`,
        `const diagnosticStatus = "";`,
        `const handleAdSave = () => {};`,
        `const [ezmobTestState, setEzmobTestState] = useState<any>("IDLE");`,
        `const [ezmobTestLogs, setEzmobTestLogs] = useState<any[]>([]);`,
        `const [ezmobDiagnostics, setEzmobDiagnostics] = useState<any>({});`,
        `const ezmobTestState = "PLAYING" as any;`,
        `const setEzmobTestState = (val?: any) => {};`,
        `const ezmobTestLogs = [] as any[];`,
        `const setEzmobTestLogs = (val?: any) => {};`,
        `const setEzmobDiagnostics = (val?: any) => {};`,
        `const handleRunEzmobTest = () => {};`
    ];

    for (let v of varsToRemove) {
        // Try finding line by line
        const lines = code.split('\n');
        code = lines.filter(line => !line.includes(v)).join('\n');
    }
    
    // Remove the whole ezmobDiagnostics block
    code = removeBetween(code, `  const ezmobDiagnostics = {`, `  };`);

    // Remove adSettings object entirely
    let settingsObjStart = code.indexOf(`  const [adSettings, setAdSettings] = useState<any>({`);
    if (settingsObjStart !== -1) {
        let nextState = code.indexOf(`  const [`, settingsObjStart + 10);
        if (nextState !== -1) {
             code = code.substring(0, settingsObjStart) + code.substring(nextState);
        }
    }
    
    // Remove fetchAdSettings function
    code = removeBetween(code, `  const fetchAdSettings = async () => {`, `  };`);
    code = removeBetween(code, `  const saveAdSettings = async () => {`, `  };`);
    
    // Remove from activeTab fetch block
    code = removeBetween(code, `} else if (activeTab === "📢 Advertisement Settings") {`, `    }`);
    
    // Now for the OnClickA Banner Config inside shortenerSubTab === "self"
    const bannerConfigStart = code.indexOf(`{/* OnClickA Banner Configuration */}`);
    if (bannerConfigStart !== -1) {
         const bannerConfigEnd = code.indexOf(`{/* Page Specific Settings Section */}`);
         if (bannerConfigEnd !== -1) {
             code = code.substring(0, bannerConfigStart) + code.substring(bannerConfigEnd);
         } else {
             console.log("Could not find end of OnClickA Banner Config");
         }
    }

    fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
    console.log("Cleaned ads from AdminDashboard");
} catch (e) {
    console.log(e);
}
