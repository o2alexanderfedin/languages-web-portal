import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { DemoPage } from '../pages/DemoPage';

test.describe('Java FV Landing Page', () => {
  test('Java Verification tool shows Available badge on landing page', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const landing = new LandingPage(page);

    if (!isMobile) {
      // Desktop: check tool row
      const toolRow = landing.getToolRow('java-verification');
      await expect(toolRow).toBeVisible();
      await expect(toolRow).toContainText('Available');
    } else {
      // Mobile: check tool card
      const toolCard = landing.getToolCard('java-verification');
      await expect(toolCard).toBeVisible();
      await expect(toolCard).toContainText('Available');
    }
  });

  test('Java Verification tool shows correct name and category', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const landing = new LandingPage(page);

    if (!isMobile) {
      // Desktop: check tool row
      const toolRow = landing.getToolRow('java-verification');
      await expect(toolRow).toBeVisible();
      await expect(toolRow).toContainText('Java Verification');
      await expect(toolRow).toContainText('verification');
    } else {
      // Mobile: check tool card
      const toolCard = landing.getToolCard('java-verification');
      await expect(toolCard).toBeVisible();
      await expect(toolCard).toContainText('Java Verification');
      await expect(toolCard).toContainText('verification');
    }
  });

  test('Java Verification Try Now button navigates to demo page', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const landing = new LandingPage(page);

    if (!isMobile) {
      // Desktop: click Try Now in tool row
      await landing
        .getToolRow('java-verification')
        .getByTestId('tool-try-now-java-verification')
        .click();
    } else {
      // Mobile: click Try Now in tool card
      await landing
        .getToolCard('java-verification')
        .getByTestId('tool-try-now-java-verification')
        .click();
    }

    // Wait for navigation to demo page with tool parameter
    await page.waitForURL(/\/demo\?tool=java-verification/);
    await expect(page).toHaveURL(/\/demo\?tool=java-verification/);

    // Verify tool is pre-selected (has border-primary class)
    const demo = new DemoPage(page);
    const selectedTool = demo.getToolOption('java-verification');
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('Java Verification tool is the only tool with Available status', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');

    // Count all elements containing "Available" text in the visible section (desktop table or mobile cards)
    let availableCount: number;

    if (!isMobile) {
      // Desktop: count in table
      availableCount = await page
        .getByTestId('tool-comparison-table')
        .getByText('Available')
        .count();
    } else {
      // Mobile: count in cards
      availableCount = await page
        .getByTestId('tool-comparison-cards')
        .getByText('Available')
        .count();
    }

    // Assert exactly 1 tool has Available status
    expect(availableCount).toBe(1);
  });
});
