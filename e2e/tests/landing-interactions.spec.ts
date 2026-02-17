import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';

test.describe('Landing Page Interactions', () => {
  test.beforeEach(async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
  });

  test('Try Now button navigates to demo page for available tool (java-verification)', async ({
    page,
    isMobile,
  }) => {
    const landing = new LandingPage(page);

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    // Get the Try Now button from appropriate container
    const tryNowButton = isMobileLayout
      ? landing.getToolCard('java-verification').getByTestId('tool-try-now-java-verification')
      : landing.getToolRow('java-verification').getByTestId('tool-try-now-java-verification');

    // Assert button is enabled
    await expect(tryNowButton).toBeEnabled();

    // Click the button
    await tryNowButton.click();

    // Wait for navigation
    await page.waitForURL(/\/demo\?tool=java-verification/);

    // Assert URL contains demo?tool=java-verification
    await expect(page).toHaveURL(/\/demo\?tool=java-verification/);
  });

  test('Try Now button navigates to demo page for in-development tool (cpp-to-c-transpiler)', async ({
    page,
    isMobile,
  }) => {
    const landing = new LandingPage(page);

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    // Get the Try Now button from appropriate container
    const tryNowButton = isMobileLayout
      ? landing.getToolCard('cpp-to-c-transpiler').getByTestId('tool-try-now-cpp-to-c-transpiler')
      : landing.getToolRow('cpp-to-c-transpiler').getByTestId('tool-try-now-cpp-to-c-transpiler');

    // Assert button is enabled
    await expect(tryNowButton).toBeEnabled();

    // Click the button
    await tryNowButton.click();

    // Wait for navigation
    await page.waitForURL(/\/demo\?tool=cpp-to-c-transpiler/);

    // Assert URL contains demo?tool=cpp-to-c-transpiler
    await expect(page).toHaveURL(/\/demo\?tool=cpp-to-c-transpiler/);
  });

  test('Coming Soon tools have disabled Try Now buttons', async ({ page, isMobile }) => {
    const landing = new LandingPage(page);

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    // Define coming-soon tool IDs
    const comingSoonTools = ['python-linter', 'typescript-linter', 'bash-verification'];

    // Check each coming-soon tool
    for (const toolId of comingSoonTools) {
      // Get Try Now button from appropriate container
      const tryNowButton = isMobileLayout
        ? landing.getToolCard(toolId).getByTestId(`tool-try-now-${toolId}`)
        : landing.getToolRow(toolId).getByTestId(`tool-try-now-${toolId}`);

      // Assert button is disabled
      await expect(tryNowButton).toBeDisabled();
    }
  });

  test('Clicking disabled Coming Soon button does not navigate', async ({ page, isMobile }) => {
    const landing = new LandingPage(page);

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    // Pick one coming-soon tool
    const toolId = 'python-linter';

    // Get the Try Now button from appropriate container
    const tryNowButton = isMobileLayout
      ? landing.getToolCard(toolId).getByTestId(`tool-try-now-${toolId}`)
      : landing.getToolRow(toolId).getByTestId(`tool-try-now-${toolId}`);

    // Assert it is disabled
    await expect(tryNowButton).toBeDisabled();

    // Record current URL
    const currentUrl = page.url();

    // Force-click the button to bypass disabled check
    await tryNowButton.click({ force: true });

    // Wait briefly
    await page.waitForTimeout(500);

    // Assert URL has not changed
    expect(page.url()).toBe(currentUrl);
  });
});
