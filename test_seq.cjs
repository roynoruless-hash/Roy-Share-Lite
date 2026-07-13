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
        {"html":"<script>window.adb = window.adb || {}; window.adb.config = {adformats: []};<\\/script><script src=\\"https://js.wpadmngr.com/static/adManager.js\\" data-admpid=\\"101188\\"><\\/script>"}
      </script>
      <script>
        const adContainer = document.getElementById("ad-container");
        const scriptHtml = JSON.parse(document.getElementById("ad-script-data").textContent).html;
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(scriptHtml, "text/html");
        const scripts = Array.from(parsedDoc.getElementsByTagName("script"));
        
        async function loadScriptsSequentially(scriptsArray, container) {
          for (let i = 0; i < scriptsArray.length; i++) {
            await new Promise((resolve) => {
              const s = scriptsArray[i];
              const newScript = document.createElement("script");
              Array.from(s.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
              
              if (s.src) {
                newScript.onload = resolve;
                newScript.onerror = resolve;
                container.appendChild(newScript);
              } else {
                newScript.text = s.textContent;
                container.appendChild(newScript);
                resolve();
              }
            });
          }
          console.log("All scripts loaded.");
        }
        
        loadScriptsSequentially(scripts, adContainer);
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const hasAdb = await page.evaluate(() => {
    return Object.keys(window).filter(k => k.startsWith('adb'));
  });
  console.log('Window adb keys:', hasAdb);
  
  await browser.close();
})();
