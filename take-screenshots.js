const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting screenshot script...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to 16:9 ratio mobile size (414 x 736) with high scaling (3x = 1242x2208)
  await page.setViewport({
    width: 414,
    height: 736,
    deviceScaleFactor: 3, 
    isMobile: true,
    hasTouch: true
  });

  const baseUrl = 'http://localhost:8081';
  
  console.log("Navigating to home to dismiss onboarding...");
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to click "Skip"
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('div'));
    const skipBtn = elements.find(el => el.textContent === 'Skip');
    if (skipBtn) skipBtn.click();
  });
  
  // Wait for onboarding dismiss animation
  await new Promise(r => setTimeout(r, 1500));
  
  const screens = [
    { name: '1-BMI', path: '/' },
    { name: '2-BMR', path: '/bmr' },
    { name: '3-BodyFat', path: '/body-fat' },
    { name: '4-IdealWeight', path: '/ideal-weight' },
    { name: '5-Macros', path: '/macros' }
  ];

  for (const screen of screens) {
    console.log(`Navigating to ${screen.name}...`);
    await page.goto(`${baseUrl}${screen.path}`, { waitUntil: 'networkidle0' });
    
    // Wait for React Native to render and animations to finish
    await new Promise(r => setTimeout(r, 2000));

    console.log(`Taking Screenshot: ${screen.name}...`);
    await page.screenshot({ path: `../app-submission/screenshots/${screen.name}.png` });
  }

  console.log("All screenshots captured successfully!");
  await browser.close();
})();
