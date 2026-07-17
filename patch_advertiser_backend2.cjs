const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace the previous require logic
const prevInjection = `  // Advertiser Routes
  try {
    const { setupAdvertiserRoutes } = require('./src/server_advertiser');
    setupAdvertiserRoutes(app, db);
  } catch(e) {
    console.log("Error loading advertiser routes", e);
  }
  
  // Vite middleware for development`;

if (code.includes(prevInjection)) {
  code = code.replace(prevInjection, '// Vite middleware for development');
}

const anchor = '// Vite middleware for development';
const importStatement = `import { setupAdvertiserRoutes } from './src/server_advertiser';\n`;

// Add import at the top if not present
if (!code.includes("import { setupAdvertiserRoutes }")) {
    const topAnchor = 'import express from "express";';
    if (code.includes(topAnchor)) {
        code = code.replace(topAnchor, topAnchor + '\\n' + importStatement);
    } else {
        code = importStatement + code;
    }
}

// Add setup call
if (code.includes(anchor) && !code.includes('setupAdvertiserRoutes(app, db)')) {
  const injection = `
  // Advertiser Routes
  setupAdvertiserRoutes(app, db);
  
  `;
  code = code.replace(anchor, injection + anchor);
}

fs.writeFileSync('server.ts', code);
console.log('Injected advertiser routes with proper import.');
