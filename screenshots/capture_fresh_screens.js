const { chromium } = require('playwright');
const path = require('path');

const HIDE_SCROLLBAR = '*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}*{scrollbar-width:none!important;-ms-overflow-style:none!important}';

async function initPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8082', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.addStyleTag({ content: HIDE_SCROLLBAR });

  // Skip onboarding
  try {
    const skipBtn = page.locator('text=Skip').first();
    if (await skipBtn.isVisible({ timeout: 3000 })) {
      await skipBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch(e) {}

  await page.addStyleTag({ content: HIDE_SCROLLBAR });
  return { ctx, page };
}

(async () => {
  console.log('═══ FitMetrics Fresh Screenshot Capture v3 ═══\n');
  const browser = await chromium.launch();

  // ══════ Screen 1: BMI Calculator (result focused) ══════
  console.log('📸 Screen 1: BMI Calculator');
  {
    const { ctx, page } = await initPage(browser);
    
    // Click BMI tab
    await page.locator('text=BMI').first().click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });

    // BMI has Age(default 25) + 2 decimal inputs: Height(cm), Weight(kg)
    const inputs = page.locator('input[inputmode="decimal"]');
    const count = await inputs.count();
    console.log(`  Found ${count} decimal inputs`);
    // Input 0 = Height(cm), Input 1 = Weight(kg)
    if (count >= 2) {
      await inputs.nth(0).fill('175');
      await inputs.nth(1).fill('70');
    }

    // Click Calculate
    await page.locator('text=Calculate BMI').first().click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Scroll down to show the result section prominently
    await page.evaluate(() => {
      const els = document.querySelectorAll('div');
      for (const el of els) {
        if (el.scrollHeight > el.clientHeight && el.clientHeight > 400) {
          el.scrollTop = 500;
          break;
        }
      }
    });
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.resolve(__dirname, 'fresh_bmi.png') });
    console.log('  ✅ Saved: fresh_bmi.png\n');
    await ctx.close();
  }

  // ══════ Screen 2: BMR Calculator (result focused) ══════
  console.log('📸 Screen 2: BMR Calculator');
  {
    const { ctx, page } = await initPage(browser);
    
    await page.locator('text=BMR').first().click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });

    // BMR has Age(default 25) + 2 decimal inputs: Height(cm), Weight(kg) 
    const inputs = page.locator('input[inputmode="decimal"]');
    const count = await inputs.count();
    console.log(`  Found ${count} decimal inputs`);
    // Input 0 = Height(cm), Input 1 = Weight(kg)
    if (count >= 2) {
      await inputs.nth(0).fill('175');
      await inputs.nth(1).fill('70');
    }

    await page.locator('text=Calculate BMR').first().click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Scroll to show result
    await page.evaluate(() => {
      const els = document.querySelectorAll('div');
      for (const el of els) {
        if (el.scrollHeight > el.clientHeight && el.clientHeight > 400) {
          el.scrollTop = 550;
          break;
        }
      }
    });
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.resolve(__dirname, 'fresh_bmr.png') });
    console.log('  ✅ Saved: fresh_bmr.png\n');
    await ctx.close();
  }

  // ══════ Screen 3: Body Fat Calculator (result focused) ══════
  console.log('📸 Screen 3: Body Fat Calculator');
  {
    const { ctx, page } = await initPage(browser);
    
    await page.locator('text=Body Fat').first().click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });

    // Body Fat has 4 decimal inputs: Height(cm), Neck(cm), Waist(cm), Weight(kg)
    const inputs = page.locator('input[inputmode="decimal"]');
    const count = await inputs.count();
    console.log(`  Found ${count} decimal inputs`);
    // Correct order: Height=175, Neck=37, Waist=80, Weight=70
    const bfValues = ['175', '37', '80', '70'];
    for (let i = 0; i < Math.min(count, bfValues.length); i++) {
      await inputs.nth(i).fill(bfValues[i]);
    }

    await page.locator('text=Calculate Body Fat').first().click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Scroll to show result
    await page.evaluate(() => {
      const els = document.querySelectorAll('div');
      for (const el of els) {
        if (el.scrollHeight > el.clientHeight && el.clientHeight > 400) {
          el.scrollTop = 500;
          break;
        }
      }
    });
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.resolve(__dirname, 'fresh_bodyfat.png') });
    console.log('  ✅ Saved: fresh_bodyfat.png\n');
    await ctx.close();
  }

  // ══════ Screen 4: Ideal Weight (result focused) ══════
  console.log('📸 Screen 4: Ideal Weight');
  {
    const { ctx, page } = await initPage(browser);
    
    await page.locator('text=Ideal Weight').first().click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });

    // Ideal Weight: Height(cm) — just 1 input
    const inputs = page.locator('input[inputmode="decimal"]');
    const count = await inputs.count();
    console.log(`  Found ${count} decimal inputs`);
    if (count >= 1) {
      await inputs.nth(0).fill('175');
    }

    await page.locator('text=Calculate Ideal Weight').first().click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Scroll to result
    await page.evaluate(() => {
      const els = document.querySelectorAll('div');
      for (const el of els) {
        if (el.scrollHeight > el.clientHeight && el.clientHeight > 400) {
          el.scrollTop = 400;
          break;
        }
      }
    });
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: HIDE_SCROLLBAR });
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.resolve(__dirname, 'fresh_idealweight.png') });
    console.log('  ✅ Saved: fresh_idealweight.png\n');
    await ctx.close();
  }

  await browser.close();
  console.log('═══ ✅ All 4 clean screenshots captured! ═══');
})();
