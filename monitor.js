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

  for (const p of pagesToCheck) {
    try {
      console.log(`Checking ${p.name}...`);

      const start = Date.now();
      const response = await page.goto(p.url, { timeout: 60000 });
      const loadTime = (Date.now() - start) / 1000;

      let score = 100;

      if (!response || response.status() !== 200) {
        throw new Error("HTTP not 200");
      }

      const html = await page.content();

      if (html.length < 10000) {
        score -= 50;
      }

      if (loadTime > 5) {
        score -= 25;
      }

      console.log(`${p.name} loaded in ${loadTime}s | Score: ${score}`);

      totalScore += score;

      results.push({
        page: p.name,
        status: "OK",
        loadTime,
        score
      });

    } catch (error) {
      console.error(`${p.name} FAILED:`, error.message);

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

  console.log(`\nFinal Health Score: ${healthScore}/100`);

  // Save metrics to file
  const csv = [
    "Page,Status,LoadTime,Score",
    ...results.map(r => `${r.page},${r.status},${r.loadTime},${r.score}`)
  ].join("\n");

  fs.writeFileSync("health-report.csv", csv);

  if (healthScore < 70) {
    console.error("Health below SLA threshold!");
    process.exit(1);
  }

  await browser.close();
})();
