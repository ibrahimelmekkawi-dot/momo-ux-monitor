const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const phone = process.env.MOMO_PHONE;
  const password = process.env.MOMO_PASSWORD;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {

    console.log("Opening main page...");
    const start = Date.now();

    await page.goto('https://market.momo.africa', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    try {
      await page.waitForSelector('text=I ACCEPT', { timeout: 10000 });
      await page.click('text=I ACCEPT');
    } catch {}

    try {
      await page.waitForSelector('text=Uganda', { timeout: 15000 });
      await page.click('text=Uganda');
    } catch {}

    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[class*="mtn-product-card"]', {
      timeout: 45000
    });

    const loadTime = (Date.now() - start) / 1000;

    results.push({ page: "Category", status: "OK", loadTime, score: 100 });

    const firstProduct = page.locator('[class*="mtn-product-card"]').first();
    await firstProduct.click();
    await page.waitForLoadState('domcontentloaded');

    results.push({ page: "Product Page", status: "OK", loadTime: 0, score: 100 });

    await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });
    await page.click('button:has-text("Add")');

    results.push({ page: "Add To Cart", status: "OK", loadTime: 0, score: 100 });

    await page.goto('https://market.momo.africa/Portal/login');
    await page.waitForSelector('input[type="tel"]', { timeout: 20000 });

    await page.fill('input[type="tel"]', phone);
    await page.fill('input[type="password"]', password);
    await page.locator('button:has-text("Sign-in")').click();

    await page.waitForLoadState('networkidle');

    results.push({ page: "Login", status: "OK", loadTime: 0, score: 100 });

    await page.goto('https://market.momo.africa/Portal/cart');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('button:has-text("Checkout")', { timeout: 20000 });
    await page.click('button:has-text("Checkout")');

    await page.waitForLoadState('networkidle');

    results.push({ page: "Checkout", status: "OK", loadTime: 0, score: 100 });

  } catch (error) {

    await page.screenshot({ path: 'debug-error.png', fullPage: true });

    results.push({
      page: "Failure",
      status: error.message,
      loadTime: 0,
      score: 0
    });
  }

  /* ======================================================
     CLEAN STATUS FUNCTION (Power BI Safe)
  ====================================================== */

  function clean(text) {
    return String(text)
      .replace(/[\r\n]+/g, ' ')   // remove line breaks
      .replace(/,/g, ' ')         // remove commas
      .trim();
  }

  /* ======================================================
     SINGLE RUN FILE (health-report.csv)
  ====================================================== */

  const singleRunRows = results.map(r =>
    `${timestamp},${r.page},${clean(r.status)},${r.loadTime},${r.score}`
  ).join("\n");

  const singleRunFile =
    "Timestamp,Page,Status,LoadTime,Score\n" +
    singleRunRows + "\n";

  fs.writeFileSync("health-report.csv", singleRunFile);

  /* ======================================================
     MASTER HISTORY FILE (monitoring-history.csv)
  ====================================================== */

  const historyFile = "monitoring-history.csv";

  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(
      historyFile,
      "Timestamp,Page,Status,LoadTime,Score\n"
    );
  }

  fs.appendFileSync(historyFile, singleRunRows + "\n");

  await browser.close();

})();
