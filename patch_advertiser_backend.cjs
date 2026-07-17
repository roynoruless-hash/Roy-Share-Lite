const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = '// Vite middleware for development';
if (code.includes(anchor) && !code.includes('setupAdvertiserRoutes(app')) {
  const injection = `
  // Advertiser Routes
  try {
    const { setupAdvertiserRoutes } = require('./src/server_advertiser');
    setupAdvertiserRoutes(app, db);
  } catch(e) {
    console.log("Error loading advertiser routes", e);
  }
  
  `;
  code = code.replace(anchor, injection + anchor);
  fs.writeFileSync('server.ts', code);
  console.log('Injected advertiser routes into server.ts');
} else {
  console.log('Anchor not found or already injected');
}
