const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStr = `const AdvertiserPanel = lazy(() => import("./pages/AdvertiserPanel"));\n`;
if (!code.includes('AdvertiserPanel')) {
  code = code.replace('const AdminDashboard = lazy(() =>', importStr + 'const AdminDashboard = lazy(() =>');
}

const routeStr = `
    if (window.location.pathname === "/advertiser" || window.location.pathname.startsWith("/advertiser/")) {
      return <AdvertiserPanel />;
    }
`;
if (!code.includes('/advertiser')) {
  const anchor = 'if (window.location.pathname === "/dashboard/admin") {';
  code = code.replace(anchor, routeStr + '\n    ' + anchor);
}

fs.writeFileSync('src/App.tsx', code);
console.log('App patched');
