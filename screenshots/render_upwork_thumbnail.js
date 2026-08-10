const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Upwork standard portfolio size is 1200x800 (3:2)
  await page.setViewportSize({ width: 1200, height: 800 });
  
  const htmlPath = 'file://' + path.resolve(__dirname, 'generate_upwork_thumbnail.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  
  // Wait a moment for fonts to render
  await page.waitForTimeout(1000);
  
  const outputPath = path.resolve(__dirname, 'upwork_portfolio_thumbnail.png');
  await page.screenshot({ path: outputPath });
  
  console.log(`✅ Upwork Thumbnail generated: ${outputPath}`);
  
  await browser.close();
})();
