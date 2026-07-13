const fs = require('fs');

const file = fs.readFileSync('server.ts', 'utf8');

const routeStartIdx = file.indexOf('// GET dedicated browser watch page');
const nextRouteIdx = file.indexOf('app.post("/api/video-tasks/verify"', routeStartIdx);

let endIdx = file.lastIndexOf('//', nextRouteIdx);
if (endIdx === -1 || endIdx < routeStartIdx) {
   endIdx = nextRouteIdx;
}

const originalCode = file.substring(routeStartIdx, endIdx);
fs.writeFileSync('original_watch.ts', originalCode);
console.log("Wrote original_watch.ts");
