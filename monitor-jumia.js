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

    await page.waitForSelector('input[placeholder*="Search"]', {
      timeout: 30000
    });

    const homeLoad = (Date.now() - start) / 1000;

    results.push({
      page: "Homepage",
      status: "OK",
      loadTime: homeLoad,
      score: 100
    });

    console.log("Homepage OK");

    /* ==============================
       CATEGORY PAGE
    ============================== */

    console.log("Opening category page...");

    const catStart = Date.now();

    await page.goto('https://www.jumia.ug/electronics/', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForSelector('article', { timeout: 45000 });

    const catLoad = (Date.now() - catStart) / 1000;

    results.push({
      page: "Category",
      status: "OK",
      loadTime: catLoad,
      score: 100
    });

    console.log("Category OK");

    /* ==============================
       PRODUCT PAGE
    ============================== */

    console.log("Opening first product...");

    const productStart = Date.now();

    const firstProduct = page.locator('article a').first();
    await firstProduct.click();

    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('button:has-text("Add to cart")', {
      timeout: 30000
    });

    const productLoad = (Date.now() - productStart) / 1000;

    results.push({
      page: "Product Page",
      status: "OK",
      loadTime: productLoad,
      score: 100
    });

    console.log("Product Page OK");

    /* ==============================
       ADD TO CART
    ============================== */

    console.log("Adding to cart...");

    await page.click('button:has-text("Add to cart")');

    await page.waitForTimeout(4000);

    results.push({
      page: "Add To Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Add to Cart OK");

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

  /* ==============================
     APPEND TO HISTORY FILE
  ============================== */

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
