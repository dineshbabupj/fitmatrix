import { test, expect } from '@playwright/test';

test.describe('FitMetrics Web E2E', () => {
  test('should load the home page and display calculators', async ({ page }) => {
    // Navigate to the local Expo web server
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify page title or a known element exists
    // Depending on the exact rendering, we might need to adjust this.
    // Let's check for the BMI Calculator text which is likely on the main screen.
    await expect(page.locator('text=BMI Calculator').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to BMI calculator and show inputs', async ({ page }) => {
    // Navigate directly to the BMI Calculator route
    await page.goto('/calculators/bmi');
    await page.waitForLoadState('networkidle');
    // Verify BMI specific inputs are visible
    await expect(page.getByText('Height (cm) *')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Macro calculator and show inputs', async ({ page }) => {
    // Navigate directly to the Macro Calculator route
    await page.goto('/calculators/macro');
    await page.waitForLoadState('networkidle');
    // Verify Macro specific inputs are visible
    await expect(page.getByText('Goal *')).toBeVisible({ timeout: 10000 });
  });
});
