const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    // console.log(`[BROWSER LOG] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`[BROWSER PAGE ERROR] ${err.toString()}`);
  });

  try {
    await page.goto('http://localhost:3000/app', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000)); // wait for renders
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes("App Crashed")) {
      console.log("Found App Crashed screen!");
    } else if (html.includes("Authentication Failed")) {
      console.log("Found Authentication Failed screen!");
    } else if (html.trim() === "" || html.includes("<div id=\"root\"></div>") || html.trim() === "<div id=\"root\"></div>") {
      console.log("Blank screen detected!");
      console.log("HTML:", html.substring(0, 500));
    } else {
      console.log("Page loaded. Body length:", html.length);
      console.log("First 500 chars of body:", html.substring(0, 500));
      if (!html.includes("Top Creators & Earners") && !html.includes("Welcome")) {
          console.log("Wait, I don't see the MiniAppHome content!");
      }
    }
  } catch (e) {
    console.error("Puppeteer error:", e);
  } finally {
    await browser.close();
  }
})();
