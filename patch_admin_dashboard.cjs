const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/pages/AdminDashboard.tsx', 'utf8');

// Add Import
if (!code.includes('import { ClickAdillaAdsManager }')) {
  code = code.replace(
    'import ClickAdillaAdminView from "../components/ClickAdillaAdminView";',
    'import ClickAdillaAdminView from "../components/ClickAdillaAdminView";\nimport { ClickAdillaAdsManager } from "../components/ClickAdillaAdsManager";'
  );
}

// Add Tab Definition
const tabDefinition = `    { label: "📄 Ads.txt Manager", icon: FileCode2, color: "bg-teal-500", shadow: "shadow-teal-500/20" },`;
if (!code.includes('label: "🎯 Ads Manager"')) {
  code = code.replace(
    '    { label: "📄 Ads.txt Manager", icon: FileCode2, color: "bg-teal-500", shadow: "shadow-teal-500/20" },',
    '    { label: "🎯 Ads Manager", icon: Target, color: "bg-blue-500", shadow: "shadow-blue-500/20" },\n    { label: "📄 Ads.txt Manager", icon: FileCode2, color: "bg-teal-500", shadow: "shadow-teal-500/20" },'
  );
}

// Add Tab Content
const tabContent = `
          {activeTab === "🎯 Ads Manager" && (
            <ClickAdillaAdsManager />
          )}
`;
if (!code.includes('activeTab === "🎯 Ads Manager"')) {
  code = code.replace(
    '{activeTab === "📄 Ads.txt Manager"',
    `${tabContent}\n          {activeTab === "📄 Ads.txt Manager"`
  );
}

fs.writeFileSync('/app/applet/src/pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard.tsx");
