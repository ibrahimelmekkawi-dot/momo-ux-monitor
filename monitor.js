const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log("Checking category page...");

    const start = Date.now();
    const response = await page.goto(
      "https://market.momo.africa/Portal/category/1373329",
      { timeout: 60000 }
    );

    const loadTime = (Date.now() - start) / 1000;

    if (!response || response.status() !== 200) {
      throw new Error("Category page not reachable");
    }

    console.log(`Category page loaded in ${loadTime}s`);

    console.log("Checking if product cards exist...");

    await page.waitForSelector("a", { timeout: 20000 });

    const links = await page.$$eval("a", elements =>
      elements.map(el => el.href)
    );

    const productLinks = links.filter(link =>
      link.includes("/Portal/")
    );

    if (productLinks.length === 0) {
      throw new Error("No product links found");
    }

    console.log(`Found ${productLinks.length} product links`);

    console.log("SUCCESS - Ecommerce site is healthy");

  } catch (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  }

  await browser.close();
})();
