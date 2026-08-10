# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: calculators.spec.ts >> FitMetrics Web E2E >> should load the home page and display calculators
- Location: e2e\calculators.spec.ts:4:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8085/
Call log:
  - navigating to "http://localhost:8085/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('FitMetrics Web E2E', () => {
  4  |   test('should load the home page and display calculators', async ({ page }) => {
  5  |     // Navigate to the local Expo web server
> 6  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8085/
  7  | 
  8  |     // Wait for the page to load
  9  |     await page.waitForLoadState('networkidle');
  10 | 
  11 |     // Verify page title or a known element exists
  12 |     // Depending on the exact rendering, we might need to adjust this.
  13 |     // Let's check for the BMI Calculator text which is likely on the main screen.
  14 |     await expect(page.locator('text=BMI Calculator').first()).toBeVisible({ timeout: 10000 });
  15 |   });
  16 | 
  17 |   test('should navigate to BMI calculator and show inputs', async ({ page }) => {
  18 |     // Navigate directly to the BMI Calculator route
  19 |     await page.goto('/calculators/bmi');
  20 |     await page.waitForLoadState('networkidle');
  21 |     // Verify BMI specific inputs are visible
  22 |     await expect(page.getByText('Height (cm) *')).toBeVisible({ timeout: 10000 });
  23 |   });
  24 | 
  25 |   test('should navigate to Macro calculator and show inputs', async ({ page }) => {
  26 |     // Navigate directly to the Macro Calculator route
  27 |     await page.goto('/calculators/macro');
  28 |     await page.waitForLoadState('networkidle');
  29 |     // Verify Macro specific inputs are visible
  30 |     await expect(page.getByText('Goal *')).toBeVisible({ timeout: 10000 });
  31 |   });
  32 | });
  33 | 
```