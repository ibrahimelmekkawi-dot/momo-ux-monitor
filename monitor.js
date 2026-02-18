const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Opening homepage...");
    const start = Date.now();

    await page.goto('https://market.momo.africa/Portal/category/1373329', { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    const loadTime = (Date.now() - start) / 1000;
    console.log(`Homepage loaded in ${loadTime}s`);

    console.log("Searching product...");
   console.log("Searching product...");
await page.waitForSelector('input', { timeout: 15000 });

const searchInput = await page.$('input');
await searchInput.fill('phone');
await page.keyboard.press('Enter');

await page.waitForLoadState('networkidle');

    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

   console.log("Opening first product...");

// Wait for product grid to appear
await page.waitForSelector('a', { timeout: 20000 });

// Get all links
const links = await page.$$('a');

// Find first link that looks like product
let productClicked = false;

for (const link of links) {
  const href = await link.getAttribute('href');
  if (href && href.includes('product')) {
    await link.click();
    productClicked = true;
    break;
  }
}

if (!productClicked) {
  throw new Error("No product link found");
}

await page.waitForLoadState('networkidle');


    console.log("Adding to cart...");
    await page.waitForSelector('button:has-text("Add")', { timeout: 15000 });
    await page.click('button:has-text("Add")');

    console.log("SUCCESS");
  } catch (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  }

  await browser.close();
})();
