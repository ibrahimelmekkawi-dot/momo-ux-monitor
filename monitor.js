const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];

  const phone = process.env.MOMO_PHONE;
  const password = process.env.MOMO_PASSWORD;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {

    const startTotal = Date.now();

    // 1️⃣ Open category
    console.log("Opening category...");
    await page.goto('https://market.momo.africa/Portal/category/1373329', { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    results.push({ page: "Category", status: "OK", loadTime: (Date.now() - startTotal)/1000, score: 100 });

    // 2️⃣ Open first product
    console.log("Opening first product...");
    await page.waitForSelector('a[href*="product"]', { timeout: 20000 });
    await page.click('a[href*="product"]');
    await page.waitForLoadState('networkidle');

    results.push({ page: "Product Page", status: "OK", loadTime: 0, score: 100 });

    // 3️⃣ Add to cart
    console.log("Adding to cart...");
    await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });
    await page.click('button:has-text("Add")');

    results.push({ page: "Add To Cart", status: "OK", loadTime: 0, score: 100 });

    // 4️⃣ Go to login
    console.log("Opening login page...");
    await page.goto('https://market.momo.africa/Portal/login');
    await page.waitForSelector('input[type="tel"]', { timeout: 20000 });

    // 5️⃣ Login
    console.log("Logging in...");
    await page.fill('input[type="tel"]', phone);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    results.push({ page: "Login", status: "OK", loadTime: 0, score: 100 });

    // 6️⃣ Go to cart
    console.log("Opening cart...");
    await page.goto('https://market.momo.africa/Portal/cart');
    await page.waitForLoadState('networkidle');

    // 7️⃣ Checkout
    console.log("Proceeding to checkout...");
    await page.waitForSelector('button:has-text("Checkout")', { timeout: 20000 });
    await page.click('button:has-text("Checkout")');
    await page.waitForLoadState('networkidle');

    results.push({ page: "Checkout Page", status: "OK", loadTime: 0, score: 100 });

    console.log("FULL JOURNEY SUCCESS");

  } catch (error) {

    console.error("FAIL:", error.message);
    results.push({ page: "Failure", status: error.message, loadTime: 0, score: 0 });

  }

  // Save CSV report
  const csv = [
    "Timestamp,Page,Status,LoadTime,Score",
    ...results.map(r =>
      `${new Date().toISOString()},${r.page},${r.status},${r.loadTime},${r.score}`
    )
  ].join("\n");

  fs.writeFileSync("health-report.csv", csv);

  await browser.close();

})();
