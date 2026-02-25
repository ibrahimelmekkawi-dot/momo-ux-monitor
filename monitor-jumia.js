const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

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

    /* ==============================
       HOMEPAGE
    ============================== */

    console.log("Opening Jumia homepage...");
    let start = Date.now();

    await page.goto('https://www.jumia.ug/', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    try {
      await page.click('button:has-text("Accept")', { timeout: 5000 });
    } catch {}

    await page.waitForSelector('article.prd', { timeout: 30000 });

    let loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Homepage",
      status: "OK",
      loadTime,
      score: 100
    });

    /* ==============================
       PRODUCT PAGE
    ============================== */

    console.log("Opening first product...");
    start = Date.now();

    await page.locator('article.prd').first().click();
    await page.waitForLoadState('domcontentloaded');

    loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Product Page",
      status: "OK",
      loadTime,
      score: 100
    });

    /* ==============================
       ADD TO CART
    ============================== */

    console.log("Adding to cart...");
    start = Date.now();

    await page.waitForSelector('button:has-text("Add to cart")', { timeout: 20000 });
    await page.click('button:has-text("Add to cart")');

    loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Add To Cart",
      status: "OK",
      loadTime,
      score: 100
    });

    /* ==============================
       CART PAGE
    ============================== */

    console.log("Opening cart...");
    start = Date.now();

    await page.goto('https://www.jumia.ug/cart/');
    await page.waitForLoadState('networkidle');

    loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Cart",
      status: "OK",
      loadTime,
      score: 100
    });

    /* ==============================
       CHECKOUT ENTRY
    ============================== */

    console.log("Testing checkout entry...");
    start = Date.now();

    await page.waitForSelector('button:has-text("Proceed")', { timeout: 20000 });
    await page.click('button:has-text("Proceed")');

    await page.waitForLoadState('domcontentloaded');

    loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Checkout Entry",
      status: "OK",
      loadTime,
      score: 100
    });

  } catch (error) {

    await page.screenshot({
      path: `jumia/debug-jumia-${Date.now()}.png`,
      fullPage: true
    });

    results.push({
      page: "Failure",
      status: String(error.message)
        .replace(/[\r\n]+/g, ' ')
        .replace(/,/g, ' ')
        .trim(),
      loadTime: 0,
      score: 0
    });
  }

  /* ==============================
     WRITE HISTORY FILE
  ============================== */

  const historyPath = 'monitoring-history-jumia.csv';

  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(
      historyPath,
      "Timestamp,Page,Status,LoadTime,Score\n"
    );
  }

  const rows = results.map(r =>
    `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
  ).join("\n");

  fs.appendFileSync(historyPath, rows + "\n");

  await browser.close();

})();
