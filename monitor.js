const { chromium } = require('playwright');
const fs = require('fs');

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

  const pagesToCheck = [
    { name: "Homepage", url: "https://market.momo.africa/" },
    { name: "Category", url: "https://market.momo.africa/Portal/category/1373329" },
    { name: "Login", url: "https://market.momo.africa/Portal/login" }
  ];

  let totalScore = 0;
  let results = [];
  let failures = 0;

  for (const p of pagesToCheck) {
    try {
      const start = Date.now();
      const response = await page.goto(p.url, { timeout: 60000 });
      const loadTime = (Date.now() - start) / 1000;

      let score = 100;

      if (!response || response.status() !== 200) {
        throw new Error("HTTP not 200");
      }

      const html = await page.content();

      if (html.length < 10000) score -= 50;

      if (loadTime > 3) score -= 10;
      if (loadTime > 5) score -= 25;
      if (loadTime > 8) score -= 50;

      if (score < 0) score = 0;

      results.push({
        page: p.name,
        status: "OK",
        loadTime,
        score
      });

      totalScore += score;

    } catch (error) {
      failures++;
      results.push({
        page: p.name,
        status: "FAIL",
        loadTime: 0,
        score: 0
      });

      totalScore += 0;
    }
  }

  const healthScore = Math.round(totalScore / pagesToCheck.length);

  const report = {
    timestamp: new Date().toISOString(),
    healthScore,
    totalPages: pagesToCheck.length,
    failures,
    pages: results
  };

  fs.writeFileSync("health-report.json", JSON.stringify(report, null, 2));

  console.log("\nEnterprise Health Report:");
  console.log(JSON.stringify(report, null, 2));

  if (healthScore < 70) {
    console.error("SLA BREACH: Health below 70");
    process.exit(1);
  }

  await browser.close();
})();
