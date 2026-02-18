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

    console.log("Opening category page...");

    const start = Date.now();

    await page.goto(
      'https://market.momo.africa/Portal/category/1373329',
      { timeout: 60000 }
    );

    await page.waitForLoadState('domcontentloaded');

    const loadTime = (Date.now() - start) / 1000;

    // 📸 DEBUG SCREENSHOT
    await page.screenshot({ path: 'debug-category.png', fullPage: true });

    console.log("Waiting for product cards...");

    await page.waitForSelector('[class*="mtn-product-card"]', {
      timeout: 45000
    });

    console.log("Products detected.");

    results.push({
      page: "Category",
      status: "OK",
      loadTime,
      score: 100
    });

    console.log("Opening first product...");

    const firstProduct = page.locator('[class*="mtn-product-card"]').first();
    await firstProduct.click();

    await page.waitForLoadState('domcontentloaded');

    results.push({
      page: "Product Page",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Adding to cart...");

    await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });
    await page.click('button:has-text("Add")');

    results.push({
      page: "Add To Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Opening login page...");

    await page.goto('https://market.momo.africa/Portal/login');
    await page.waitForSelector('input[type="tel"]', { timeout: 20000 });

    console.log("Logging in...");

    await page.fill('input[type="tel"]', phone);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    results.push({
      page: "Login",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("Opening cart...");

    await page.goto('https://market.momo.africa/Portal/cart');
    await page.waitForLoadState('networkidle');

    console.log("Proceeding to checkout...");

    await page.waitForSelector('button:has-text("Checkout")', { timeout: 20000 });
    await page.click('button:has-text("Checkout")');

    await page.waitForLoadState('networkidle');

    results.push({
      page: "Checkout",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    console.log("FULL JOURNEY SUCCESS");

  } catch (error) {

    console.error("FAIL:", error.message);

    results.push({
      page: "Failure",
      status: error.message,
      loadTime: 0,
      score: 0
    });

  }

  // 📊 Save CSV
  const csv = [
    "Timestamp,Page,Status,LoadTime,Score",
    ...results.map(r =>
      `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
    )
  ].join("\n");

  fs.writeFileSync("health-report.csv", csv);

  await browser.close();

})();
