const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove adSettings declaration
code = code.replace(`      let adSettings: any = {};\n`, '');
const letAdSettings = `      let adSettings: any = {`;
const startLineLet = code.indexOf(letAdSettings);
if (startLineLet !== -1) {
    const endLet = code.indexOf(`};`, startLineLet) + 2;
    code = code.substring(0, startLineLet) + code.substring(endLet);
}

// 2. Remove adSettings block around 5691
const adSettingsStartStr = `        // Fetch OnClickA & EZMob Advertisement Settings`;
const adSettingsStart = code.indexOf(adSettingsStartStr);
if (adSettingsStart !== -1) {
    const endAdSettings = code.indexOf(`        // Requirement 9: Apply configuration logic`, adSettingsStart);
    if (endAdSettings !== -1) {
        code = code.substring(0, adSettingsStart) + code.substring(endAdSettings);
    }
}

// 3. Remove them from the JSON response
const resDataStart = `      return res.json({
        success: true,
        sessionId,
        isPasswordProtected,
        securityBlocked: false,
        totalPages: totalPages,
        pagesConfig: pagesConfig,
        data: itemData,`;

const idx = code.indexOf(`        totalPages: totalPages,`);
if (idx !== -1) {
     const adRespStart = code.indexOf(`        onclickaEnabled:`, idx);
     if (adRespStart !== -1) {
         const ezmobEnd = code.indexOf(`ezmobVpaidMode ?? true`, adRespStart);
         if (ezmobEnd !== -1) {
              const nextLine = code.indexOf(`\n`, ezmobEnd);
              // There is likely a comma. Let's just remove the block from `onclickaEnabled` line to `ezmobVpaidMode` line.
              code = code.substring(0, adRespStart) + code.substring(nextLine + 1);
         }
     }
}

fs.writeFileSync('server.ts', code);
console.log("Removed adSettings from server.ts");
