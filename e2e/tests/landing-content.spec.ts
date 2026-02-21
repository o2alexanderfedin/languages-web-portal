import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';

test.describe('Landing Page Content', () => {
  test('hero section displays headline and mission statement', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Verify hero section is visible
    await expect(landing.heroSection).toBeVisible();

    // Verify headline
    await expect(landing.heroTitle).toBeVisible();
    await expect(landing.heroTitle).toContainText('Formal Verification for AI-Generated Code');

    // Verify mission statement
    await expect(landing.missionStatement).toBeVisible();
    await expect(landing.missionStatement).toContainText('vericoding');
    await expect(landing.missionStatement).toContainText('96%');
  });

  test('tool comparison grid displays all 8 tools', async ({ page, isMobile }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Verify tool comparison grid is visible
    await expect(landing.toolComparisonGrid).toBeVisible();

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    // Verify 8 tools are displayed
    if (!isMobileLayout) {
      // Desktop/tablet: verify table has 8 rows
      await expect(landing.getToolRows()).toHaveCount(8);
    } else {
      // Mobile: verify 8 cards are displayed
      await expect(landing.getToolCardsList()).toHaveCount(8);
    }
  });

  test('each tool shows correct status badge', async ({ page, isMobile }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    // Define expected statuses for all 8 tools
    const expectedStatuses: Record<string, string> = {
      'cpp-to-c-transpiler': 'In Development',
      'cpp-to-rust-transpiler': 'In Development',
      'csharp-verification': 'Available',
      'java-verification': 'Available',
      'rust-verification': 'In Development',
      'python-linter': 'Coming Soon',
      'typescript-linter': 'Coming Soon',
      'bash-verification': 'Coming Soon',
    };

    // Verify each tool has correct status badge
    for (const [toolId, expectedStatus] of Object.entries(expectedStatuses)) {
      if (!isMobileLayout) {
        // Desktop/tablet: verify row and badge
        const toolRow = landing.getToolRow(toolId);
        await expect(toolRow).toBeVisible();

        const badge = toolRow.locator('span.rounded-full');
        await expect(badge).toHaveText(expectedStatus);
      } else {
        // Mobile: verify card and badge
        const toolCard = landing.getToolCard(toolId);
        await expect(toolCard).toBeVisible();

        const badge = toolCard.locator('span.rounded-full');
        await expect(badge).toHaveText(expectedStatus);
      }
    }
  });

  test('desktop/tablet shows table layout, mobile shows cards', async ({ page, isMobile }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Check viewport-based layout (Firefox doesn't support isMobile, use viewport width)
    const viewport = page.viewportSize();
    const isMobileLayout = isMobile || (viewport && viewport.width < 768);

    if (!isMobileLayout) {
      // Desktop/tablet: table visible, cards hidden
      await expect(landing.toolTable).toBeVisible();
      await expect(landing.toolCards).not.toBeVisible();
    } else {
      // Mobile: cards visible, table hidden
      await expect(landing.toolCards).toBeVisible();
      await expect(landing.toolTable).not.toBeVisible();
    }
  });
});
