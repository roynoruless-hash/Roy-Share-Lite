const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div id="ad-container"></div>
      <script id="ad-script-data" type="application/json">
        {"html":"<script src=\\"https://js.wpadmngr.com/static/adManager.js\\" data-admpid=\\"101188\\"><\\/script>"}
      </script>
      <script>
        const adContainer = document.getElementById("ad-container");
        const scriptHtml = JSON.parse(document.getElementById("ad-script-data").textContent).html;
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(scriptHtml, "text/html");
        const scripts = Array.from(parsedDoc.getElementsByTagName("script"));
        
        scripts.forEach((s) => {
          const newScript = document.createElement("script");
          Array.from(s.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
            console.log("Set attr", attr.name, attr.value);
          });
          adContainer.appendChild(newScript);
        });
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await browser.close();
})();
