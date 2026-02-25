const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();
  const platform = "Jumia";

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {

    console.log("Opening Jumia Homepage...");
    const start = Date.now();

    await page.goto('https://www.jumia.ug/', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    // Accept cookies if shown
    try {
      await page.click('button:has-text("Accept")', { timeout: 5000 });
    } catch {}

    await page.waitForLoadState('networkidle');

    // Wait for product grid
    await page.waitForSelector('article.prd', { timeout: 30000 });

    const loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Homepage",
      status: "OK",
      loadTime,
      score: 100
    });

    console.log("Opening first product...");
    await page.locator('article.prd').first().click();
    await page.waitForLoadState('domcontentloaded');

    results.push({
      page: "Product Page",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Adding to cart...");
    await page.waitForSelector('button:has-text("Add to cart")', { timeout: 20000 });
    await page.click('button:has-text("Add to cart")');

    results.push({
      page: "Add To Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Opening cart...");
    await page.goto('https://www.jumia.ug/cart/');
    await page.waitForLoadState('networkidle');

    results.push({
      page: "Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Testing checkout entry...");
    await page.waitForSelector('button:has-text("Proceed")', { timeout: 20000 });
    await page.click('button:has-text("Proceed")');

    await page.waitForLoadState('domcontentloaded');

    results.push({
      page: "Checkout Entry",
      status: "OK",
      loadTime: 0,
      score: 100
    });

  } catch (error) {

    console.log("Failure detected");

    await page.screenshot({
      path: `debug-jumia-${Date.now()}.png`,
      fullPage: true
    });

    results.push({
      page: "Failure",
      status: error.message.replace(/[\r\n]+/g, ' ').replace(/,/g, ' '),
      loadTime: 0,
      score: 0
    });
  }

  /* ============================
     WRITE TO MASTER HISTORY
  ============================ */

  const historyFile = "monitoring-history-jumia.csv";

  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(
      historyFile,
      "Timestamp,Platform,Page,Status,LoadTime,Score\n"
    );
  }

  const rows = results.map(r =>
    `${timestamp},${platform},${r.page},${r.status},${r.loadTime},${r.score}`
  ).join("\n");

  fs.appendFileSync(historyFile, rows + "\n");

  await browser.close();

})();
