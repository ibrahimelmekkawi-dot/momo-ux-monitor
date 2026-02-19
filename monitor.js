const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const phone = process.env.MOMO_PHONE;
  const password = process.env.MOMO_PASSWORD;

  if (!phone || !password) {
    throw new Error("Secrets not loaded. Check MOMO_PHONE and MOMO_PASSWORD.");
  }

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

    // Accept cookies
    try {
      await page.click('text=I ACCEPT', { timeout: 8000 });
    } catch {}

    // Select Uganda (change if needed)
    try {
      await page.click('text=Uganda', { timeout: 15000 });
    } catch {}

    await page.waitForLoadState('networkidle');

    // Wait for product cards
    await page.waitForSelector('[class*="mtn-product-card"]', { timeout: 45000 });

    const categoryLoad = (Date.now() - start) / 1000;

    results.push({
      page: "Category",
      status: "OK",
      loadTime: categoryLoad,
      score: categoryLoad < 12 ? 100 : 70
    });

    // Open first product
    await page.locator('[class*="mtn-product-card"]').first().click();
    await page.waitForLoadState('domcontentloaded');

    results.push({ page: "Product Page", status: "OK", loadTime: 0, score: 100 });

    // Add to cart
    await page.click('button:has-text("Add")', { timeout: 20000 });

    results.push({ page: "Add To Cart", status: "OK", loadTime: 0, score: 100 });

    // Login
    await page.goto('https://market.momo.africa/Portal/login');

    await page.waitForSelector('input[formcontrolname="mobileNumber"]', { timeout: 20000 });

    await page.fill('input[formcontrolname="mobileNumber"]', phone);
    await page.fill('input[formcontrolname="password"]', password);

    await page.click('button:has-text("Sign-in")');

    await page.waitForLoadState('networkidle');

    results.push({ page: "Login", status: "OK", loadTime: 0, score: 100 });

    // Checkout
    await page.goto('https://market.momo.africa/Portal/cart');

    await page.waitForSelector('button:has-text("Checkout")', { timeout: 20000 });
    await page.click('button:has-text("Checkout")');

    await page.waitForLoadState('networkidle');

    results.push({ page: "Checkout", status: "OK", loadTime: 0, score: 100 });

    console.log("FULL JOURNEY SUCCESS");

  } catch (error) {

    console.error("FAIL:", error.message);

    await page.screenshot({ path: 'debug-error.png', fullPage: true });

    results.push({
      page: "Failure",
      status: error.message.replace(/,/g, ' '),
      loadTime: 0,
      score: 0
    });
  }

  /* ==============================
     APPEND TO HISTORY FILE
  ============================== */

  const historyFile = "monitoring-history.csv";

  const newRows = results.map(r =>
    `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
  ).join("\n");

  if (fs.existsSync(historyFile)) {
    fs.appendFileSync(historyFile, "\n" + newRows);
  } else {
    const header = "Timestamp,Page,Status,LoadTime,Score\n";
    fs.writeFileSync(historyFile, header + newRows);
  }

  /* ==============================
     SAVE SINGLE RUN FILE
  ============================== */

  const singleRun = [
    "Timestamp,Page,Status,LoadTime,Score",
    ...results.map(r =>
      `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
    )
  ].join("\n");

  fs.writeFileSync("health-report.csv", singleRun);

  await browser.close();

})();
