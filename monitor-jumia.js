const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {

    console.log("Opening Jumia...");
    const start = Date.now();

    await page.goto('https://www.jumia.ug', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    // Scroll once to trigger lazy loading
    await page.mouse.wheel(0, 1500);

    // Wait for product links (more stable than article)
    await page.waitForSelector('a[href*=".html"]', { timeout: 45000 });

    const loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Category",
      status: "OK",
      loadTime,
      score: 100
    });

    console.log("Clicking first product...");

    const firstProduct = page.locator('a[href*=".html"]').first();
    await firstProduct.click();

    // Confirm navigation
    await page.waitForURL(/\.html/, { timeout: 30000 });

    results.push({
      page: "Product Page",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Clicking Add to Cart...");

    await page.waitForSelector('button:has-text("Add to cart")', {
      timeout: 20000
    });

    await page.click('button:has-text("Add to cart")');

    await page.waitForTimeout(3000);

    results.push({
      page: "Add To Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

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

  // Write CSV (overwrite each run — cleaner for Git)
  const csvRows = results.map(r =>
    `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
  ).join("\n");

  const fileContent =
    "Timestamp,Page,Status,LoadTime,Score\n" +
    csvRows + "\n";

  fs.writeFileSync("monitoring-history-jumia.csv", fileContent);

  await browser.close();

})();
