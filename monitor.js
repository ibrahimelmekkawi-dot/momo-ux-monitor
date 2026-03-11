const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const phone = process.env.MOMO_PHONE;
  const password = process.env.MOMO_PASSWORD;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  });

  const page = await context.newPage();

  /* ==============================
     CAPTURE API FAILURES
  ============================== */

  const apiErrors = [];

  page.on('response', response => {
    const status = response.status();
    const url = response.url();

    if (status >= 500) {
      apiErrors.push(`${status} ${url}`);
    }
  });

  try {

    /* ==============================
       HOMEPAGE
    ============================== */

    console.log("Opening homepage...");

    const start = Date.now();

    const response = await page.goto(
      'https://market.momo.africa',
      { timeout: 60000, waitUntil: 'domcontentloaded' }
    );

    if (!response || response.status() !== 200) {
      throw new Error(`Homepage HTTP ${response?.status()}`);
    }

    /* Cookie */

    try {
      const cookie = page.locator('text=I ACCEPT');
      if (await cookie.isVisible({ timeout: 5000 })) {
        await cookie.click();
      }
    } catch {}

    /* Country */

    try {
      const country = page.locator('text=Uganda');
      if (await country.isVisible({ timeout: 5000 })) {
        await country.click();
      }
    } catch {}

    await page.waitForLoadState('networkidle');

    /* ==============================
       VERIFY PRODUCTS
    ============================== */

    await page.waitForSelector('[class*="mtn-product-card"]', { timeout: 30000 });

    const productCount = await page.locator('[class*="mtn-product-card"]').count();

    if (productCount === 0) {
      throw new Error("No products loaded");
    }

    const loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Homepage",
      status: "OK",
      loadTime,
      score: 100
    });

    console.log(`Products loaded: ${productCount}`);

    /* ==============================
       PRODUCT PAGE
    ============================== */

    console.log("Opening first product...");

    await page.locator('[class*="mtn-product-card"]').first().click();

    await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });

    results.push({
      page: "Product Page",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    /* ==============================
       ADD TO CART
    ============================== */

    console.log("Adding to cart...");

    await page.click('button:has-text("Add")');

    await page.waitForTimeout(3000);

    const cartCount = await page.locator('[class*="cart"]').count();

    if (cartCount === 0) {
      throw new Error("Cart not updated after add");
    }

    results.push({
      page: "Add To Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    /* ==============================
       LOGIN
    ============================== */

    console.log("Opening login...");

    await page.goto('https://market.momo.africa/Portal/login');

    await page.waitForSelector('input[type="tel"]', { timeout: 20000 });

    await page.fill('input[type="tel"]', phone);
    await page.fill('input[type="password"]', password);

    await page.locator('button:has-text("Sign-in")').click();

    await page.waitForLoadState('networkidle');

    /* Validate login success */

    if (page.url().includes('login')) {
      throw new Error("Login failed");
    }

    results.push({
      page: "Login",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    /* ==============================
       CART
    ============================== */

    console.log("Opening cart...");

    await page.goto('https://market.momo.africa/Portal/cart');

    await page.waitForSelector('button:has-text("Checkout")', { timeout: 20000 });

    results.push({
      page: "Cart",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    /* ==============================
       CHECKOUT
    ============================== */

    console.log("Checkout...");

    await page.click('button:has-text("Checkout")');

    await page.waitForLoadState('networkidle');

    results.push({
      page: "Checkout",
      status: "OK",
      loadTime: 0,
      score: 100
    });

    /* ==============================
       API FAILURE CHECK
    ============================== */

    if (apiErrors.length > 0) {
      throw new Error(`API failures detected: ${apiErrors.join(" | ")}`);
    }

    console.log("FULL JOURNEY SUCCESS");

  } catch (error) {

    console.error("MONITOR FAILURE:", error.message);

    await page.screenshot({
      path: "monitor-error.png",
      fullPage: true
    });

    results.push({
      page: "Failure",
      status: error.message.replace(/,/g,' '),
      loadTime: 0,
      score: 0
    });

  }

  /* ==============================
     SAVE CSV REPORT
  ============================== */

  const file = "synthetic-monitor-report.csv";

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "Timestamp,Page,Status,LoadTime,Score\n");
  }

  const rows = results.map(r =>
    `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
  ).join("\n");

  fs.appendFileSync(file, rows + "\n");

  await browser.close();

})();
