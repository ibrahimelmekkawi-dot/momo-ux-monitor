const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
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
      throw new Error("Page not reachable");
    }

    const html = await page.content();

    if (!html.includes("MOMO") && html.length < 10000) {
      throw new Error("Page content seems invalid or blocked");
    }

    console.log(`Page loaded in ${loadTime}s`);
    console.log(`HTML size: ${html.length} characters`);

    console.log("SUCCESS - Site reachable and content valid");

  } catch (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  }

  await browser.close();
})();
