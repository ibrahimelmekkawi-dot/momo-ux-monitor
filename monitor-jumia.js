const { chromium } = require('playwright');
const fs = require('fs');

(async () => {

  const results = [];
  const timestamp = new Date().toISOString();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {

    console.log("Opening Jumia homepage...");
    const start = Date.now();

    await page.goto('https://www.jumia.ug', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(4000);

    await page.waitForSelector('input[placeholder*="Search"]', {
      timeout: 30000
    });

    const loadTime = (Date.now() - start) / 1000;

    results.push({
      page: "Homepage",
      status: "OK",
      loadTime,
      score: 100
    });

    console.log("Homepage OK");

    /* ======================
       CATEGORY PAGE
    ====================== */

    console.log("Opening category page...");

    await page.goto('https://www.jumia.ug/catalog/?q=phone', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForSelector('article', { timeout:
