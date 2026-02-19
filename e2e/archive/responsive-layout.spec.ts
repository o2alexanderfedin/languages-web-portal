import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { DemoPage } from '../pages/DemoPage';

test.describe('Responsive Layout', () => {
  test('desktop viewport shows tool comparison table', async ({ page }) => {
    // Set desktop viewport explicitly
    await page.setViewportSize({ width: 1280, height: 720 });

    const landing = new LandingPage(page);
    await landing.goto();

    // Table should be visible on desktop
    await expect(landing.toolTable).toBeVisible();

    // Cards should not be visible on desktop (hidden md:block pattern)
    await expect(landing.toolCards).not.toBeVisible();
  });

  test('mobile viewport shows tool comparison cards', async ({ page }) => {
    // Set mobile viewport explicitly
    await page.setViewportSize({ width: 375, height: 667 });

    const landing = new LandingPage(page);
    await landing.goto();

    // Cards should be visible on mobile
    await expect(landing.toolCards).toBeVisible();

    // Table should not be visible on mobile
    await expect(landing.toolTable).not.toBeVisible();
  });

  test('demo page layout is usable on mobile', async ({ page }) => {
    // Set mobile viewport explicitly
    await page.setViewportSize({ width: 375, height: 667 });

    const demo = new DemoPage(page);
    await demo.goto();

    // Verify basic usability on mobile
    await expect(demo.uploadZone).toBeVisible();
    await expect(demo.executionPanel).toBeVisible();
    await expect(demo.toolPicker).toBeVisible();
  });
});
