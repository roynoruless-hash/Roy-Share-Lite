const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <script src="https://js.wpadmngr.com/static/adManager.js" data-admpid="101188">{ "adformats": ["banner"] }</script>
    </body>
    </html>
  `;
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
