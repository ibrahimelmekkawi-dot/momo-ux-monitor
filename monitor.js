const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const start = Date.now();
    await page.goto('https://market.momo.africa', { timeout: 60000 });
    const loadTime = (Date.now() - start) / 1000;

    await page.fill('input[type="search"]', 'phone');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    await page.click('a[href*="product"]');
    await page.waitForTimeout(5000);

    await page.click('text=Add to Cart');
    await page.waitForTimeout(3000);

    console.log(`SUCCESS - Load time: ${loadTime}s`);
  } catch (error) {
    console.log('FAIL:', error.message);
    process.exit(1);
  }

  await browser.close();
})();
