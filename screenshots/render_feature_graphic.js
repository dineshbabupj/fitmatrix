const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Rendering 1024x500 Feature Graphic for Google Play Store...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });

  const htmlPath = 'file:///' + path.resolve(__dirname, 'generate_feature_graphic.html').replace(/\\/g, '/');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });

  const outputPath = path.resolve(__dirname, 'playstore_feature_graphic.png');
  await page.screenshot({ path: outputPath });
  console.log('Feature Graphic created successfully at: playstore_feature_graphic.png');

  await browser.close();
})();
