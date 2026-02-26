const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {

    console.log("Opening Jumia homepage...");
    const start = Date.now();

    await page.goto('https://www.jumia.ug', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(4000);

    // Homepage check
    await page.waitForSelector('input[placeholder*="Search"]', {
      timeout: 30000
    });

    const loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Homepage",
      status: "OK",
      loadTime,
      score: 100
    });

    console.log("Homepage OK");

    // Navigation check
    await page.waitForSelector('text=Account', { timeout: 15000 });
    await page.waitForSelector('text=Cart', { timeout: 15000 });

    results.push({
      page: "Navigation",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Navigation OK");

  } catch (error) {

    console.log("JUMIA FAILURE:", error.message);

    await page.screenshot({
      path: 'debug-error-jumia.png',
      fullPage: true
    });

    results.push({
      page: "Failure",
      status: error.message.replace(/[\r\n]+/g, ' ').replace(/,/g, ' '),
      loadTime: 0,
      score: 0
    });
  }

  // ===============================
  // APPEND TO HISTORY FILE
  // ===============================

  const historyFile = "monitoring-history-jumia.csv";

  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(
      historyFile,
      "Timestamp,Page,Status,LoadTime,Score\n"
    );
  }

  function clean(text) {
    return String(text)
      .replace(/[\r\n]+/g, ' ')
      .replace(/,/g, ' ')
      .trim();
  }

  const rows = results.map(r =>
    `${timestamp},${r.page},${clean(r.status)},${r.loadTime},${r.score}`
  ).join("\n");

  fs.appendFileSync(historyFile, rows + "\n");

  await browser.close();

})();
