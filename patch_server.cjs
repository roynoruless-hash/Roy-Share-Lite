const fs = require('fs');

let serverCode = fs.readFileSync('/app/applet/server.ts', 'utf8');
const newEndpoints = fs.readFileSync('server_video_endpoints.ts', 'utf8');

const startMarker = `// USER: Create session`;
const endMarker = `// Admin Logs API`;

const startIndex = serverCode.indexOf(startMarker);
const endIndex = serverCode.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  serverCode = serverCode.substring(0, startIndex) + newEndpoints + '\n' + serverCode.substring(endIndex);
  fs.writeFileSync('/app/applet/server.ts', serverCode);
  console.log("Successfully replaced video endpoints.");
} else {
  console.log("Could not find markers.", startIndex, endIndex);
}
