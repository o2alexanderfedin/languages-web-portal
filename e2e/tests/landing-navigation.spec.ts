import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { DemoPage } from '../pages/DemoPage';

test.describe('Landing Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh page state for each test
    await page.goto('/');
  });

  test('landing page displays hero section with formal verification headline', async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await expect(landing.heroSection).toBeVisible();
    await expect(landing.heroTitle).toBeVisible();
    await expect(landing.heroTitle).toContainText('Formal Verification');
  });

  test('landing page displays tool comparison grid with all tools', async ({
    page,
    isMobile,
  }) => {
    const landing = new LandingPage(page);

    await expect(landing.toolComparisonGrid).toBeVisible();

    if (!isMobile) {
      // Desktop: verify table is visible and has tool rows
      await expect(landing.toolTable).toBeVisible();
      await expect(landing.getToolRow('cpp-to-c-transpiler')).toBeVisible();
      await expect(landing.getToolRow('cpp-to-rust-transpiler')).toBeVisible();

      // Verify tool name is visible in table (use first to avoid strict mode violation)
      await expect(
        landing.getToolRow('cpp-to-c-transpiler').getByRole('cell', {
          name: 'C++ to C Transpiler',
        }),
      ).toBeVisible();
    } else {
      // Mobile: verify cards are visible
      await expect(landing.toolCards).toBeVisible();
      await expect(landing.getToolCard('cpp-to-c-transpiler')).toBeVisible();
    }
  });

  test('landing page Try Now button navigates to demo with tool pre-selected', async ({
    page,
    isMobile,
  }) => {
    const landing = new LandingPage(page);

    // Click Try Now button - need to click the visible one (table on desktop, card on mobile)
    if (!isMobile) {
      await landing
        .getToolRow('cpp-to-c-transpiler')
        .getByTestId('tool-try-now-cpp-to-c-transpiler')
        .click();
    } else {
      await landing
        .getToolCard('cpp-to-c-transpiler')
        .getByTestId('tool-try-now-cpp-to-c-transpiler')
        .click();
    }

    // Wait for navigation
    await page.waitForURL(/\/demo\?tool=cpp-to-c-transpiler/);

    // Verify URL contains tool parameter
    await expect(page).toHaveURL(/\/demo\?tool=cpp-to-c-transpiler/);

    // Verify tool is pre-selected
    const demo = new DemoPage(page);
    const selectedTool = demo.getToolOption('cpp-to-c-transpiler');
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('landing page Quick Start CTA navigates to demo with quickstart param', async ({
    page,
  }) => {
    const landing = new LandingPage(page);
    await landing.clickQuickStart();

    // Verify URL contains tool and quickstart parameters
    await expect(page).toHaveURL(
      /\/demo\?tool=cpp-to-c-transpiler&quickstart=true/,
    );
  });

  test('landing page footer link navigates to demo', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigateToDemo();

    // Verify URL is /demo without params
    expect(page.url()).toContain('/demo');
  });

  test('demo page Back to Home link returns to landing', async ({ page }) => {
    // Start at demo page
    await page.goto('/demo');
    const demo = new DemoPage(page);

    // Click back to home
    await demo.backToHome.click();
    await page.waitForURL('/');

    // Verify we're on landing page
    expect(page.url()).toMatch(/\/$/);
  });
});
