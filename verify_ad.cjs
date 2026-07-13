const puppeteer = require('puppeteer');
const http = require('http');

async function run() {
  console.log("Starting verification...");
  
  // 1. Get Session Token
  const token = await new Promise((resolve, reject) => {
    const startReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/video-tasks/session',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).token));
    });
    startReq.write(JSON.stringify({ userId: 'test_user', taskId: 'UkU8u2y0Ag5evCIP3Sb9' }));
    startReq.end();
  });
  
  console.log("Got token:", token);
  if (!token) return console.error("No token");

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();
  
  let networkRequests = [];
  let consoleLogs = [];
  let jsErrors = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('wpadmngr') || url.includes('clickadilla')) {
      networkRequests.push(url);
    }
  });
  
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[PAGE CONSOLE] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });

  console.log("Navigating to watch page...");
  await page.goto(`http://localhost:3000/watch/${token}`);
  
  console.log("Clicking 'Watch Ads' button...");
  await page.waitForSelector('#start-watch-btn');
  await page.click('#start-watch-btn');
  
  console.log("Waiting 12 seconds for the ad and timer to finish...");
  await new Promise(r => setTimeout(r, 12000));
  
  const statusHtml = await page.evaluate(() => {
    const statusContainer = document.getElementById("status-container");
    return statusContainer ? statusContainer.innerHTML : "Not found";
  });
  
  console.log("Status Container HTML:", statusHtml);
  console.log("Network Requests (ClickAdilla/wpadmngr):", networkRequests);
  console.log("JS Errors:", jsErrors);
  
  await browser.close();
}

run().catch(console.error);
