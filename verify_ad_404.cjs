const puppeteer = require('puppeteer');
const http = require('http');

async function run() {
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

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.status() === 404) {
      console.log("404 Error URL:", response.url());
    }
  });
  
  await page.goto(`http://localhost:3000/watch/${token}`);
  await page.waitForSelector('#start-watch-btn');
  await page.click('#start-watch-btn');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

run().catch(console.error);
