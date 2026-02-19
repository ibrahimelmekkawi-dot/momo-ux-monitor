const { chromium } = require('playwright');
const fs = require('fs');
const axios = require('axios');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const phone = process.env.MOMO_PHONE;
  const password = process.env.MOMO_PASSWORD;
  const country = process.env.COUNTRY || "uganda";
  const slackWebhook = process.env.SLACK_WEBHOOK;

  const countryMap = {
    uganda: "text=Uganda",
    ghana: "text=Ghana",
    cote_divoire: "text=Côte d’Ivoire"
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {

    console.log(`🌍 Starting monitoring for ${country}`);

    const start = Date.now();

    await page.goto('https://market.momo.africa', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    // Accept cookies
    try {
      await page.click('text=I ACCEPT', { timeout: 8000 });
    } catch {}

    // Select country
    try {
      await page.click(countryMap[country], { timeout: 15000 });
    } catch {}

    await page.waitForLoadState('networkidle');

    // Wait for products
    await page.waitForSelector('[class*="mtn-product-card"]', { timeout: 45000 });

    const categoryLoad = (Date.now() - start) / 1000;

    results.push({
      page: "Category",
      status: "OK",
      loadTime: categoryLoad,
      score: categoryLoad < 12 ? 100 : 70
    });

    // Open product
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
    await page.click('button:has-text("Checkout")');

    await page.waitForURL(/checkout|payment/, { timeout: 30000 });

    results.push({ page: "Checkout", status: "OK", loadTime: 0, score: 100 });

    console.log("✅ FULL JOURNEY SUCCESS");

  } catch (error) {

    console.error("❌ FAILURE:", error.message);

    await page.screenshot({ path: 'failure.png', fullPage: true });

    results.push({
      page: "Failure",
      status: error.message,
      loadTime: 0,
      score: 0
    });

    // Slack Alert
    if (slackWebhook) {
      await axios.post(slackWebhook, {
        text: `🚨 MOMO MONITOR FAILURE\nCountry: ${country}\nError: ${error.message}`
      });
    }
  }

  // Save CSV
  const csv = [
    "Timestamp,Page,Status,LoadTime,Score",
    ...results.map(r =>
      `${timestamp},${r.page},${r.status},${r.loadTime},${r.score}`
    )
  ].join("\n");

  fs.writeFileSync("health-report.csv", csv);

  // Save JSON
  fs.writeFileSync("health-report.json", JSON.stringify(results, null, 2));

  await browser.close();

})();
