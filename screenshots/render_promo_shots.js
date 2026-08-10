const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser to capture high-resolution Play Store screenshots...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 4800, height: 2200 },
    deviceScaleFactor: 1,
  });

  const htmlPath = 'file:///' + path.resolve(__dirname, 'generate_promo_shots.html').replace(/\\/g, '/');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });

  const shots = ['shot1', 'shot2', 'shot3', 'shot4'];
  
  for (let i = 0; i < shots.length; i++) {
    const shotId = shots[i];
    const element = await page.$(`#${shotId}`);
    if (element) {
      const outputPath = path.resolve(__dirname, `playstore_promo_${i + 1}.png`);
      await element.screenshot({ path: outputPath });
      console.log(`Saved screenshot: playstore_promo_${i + 1}.png`);
    }
  }

  await browser.close();
  console.log('All 4 Play Store screenshots created successfully!');
})();
