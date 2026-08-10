const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Upwork Project Catalog size is 1200x800 (3:2)
  await page.setViewportSize({ width: 1200, height: 800 });
  
  const htmlPath = 'file://' + path.resolve(__dirname, 'generate_project_catalog_thumbnail.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  
  // Wait a moment for fonts to render perfectly
  await page.waitForTimeout(1000);
  
  const outputPath = path.resolve(__dirname, 'upwork_project_catalog_cover.png');
  await page.screenshot({ path: outputPath });
  
  console.log(`✅ Project Catalog Cover generated: ${outputPath}`);
  
  await browser.close();
})();
