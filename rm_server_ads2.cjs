const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const strToReplace = `        onclickaEnabled: adSettings.onclickaEnabled ?? false,
        onclickaSdkScript: adSettings.onclickaSdkScript || "",
        onclickaSdkSpotId: adSettings.onclickaSdkSpotId || "",
        onclickaBannerSize: adSettings.onclickaBannerSize || "728x90",
        onclickaSpots: adSettings.onclickaSpots || [],
        network: adSettings.network || "disabled",
        ezmobEnabled: adSettings.ezmobEnabled ?? false,
        ezmobPrebidScript: adSettings.ezmobPrebidScript || "",
        ezmobRendererScript: adSettings.ezmobRendererScript || "",
        ezmobZoneId: adSettings.ezmobZoneId || "",
        ezmobHost: adSettings.ezmobHost || "",
        ezmobContainerId: adSettings.ezmobContainerId || "",
        ezmobPlayerSizeMode: adSettings.ezmobPlayerSizeMode || "auto",
        ezmobDisplayMode: adSettings.ezmobDisplayMode || "floating",
        ezmobEnableTransitions: adSettings.ezmobEnableTransitions ?? true,
        ezmobVpaidMode: adSettings.ezmobVpaidMode ?? true,`;

if (code.includes(strToReplace)) {
    code = code.replace(strToReplace, "");
    fs.writeFileSync('server.ts', code);
    console.log("Removed remaining adSettings block in server.ts");
} else {
    console.log("Not found the exact string in server.ts");
}
