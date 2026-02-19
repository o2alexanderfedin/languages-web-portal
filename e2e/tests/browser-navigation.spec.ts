import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';
import { LandingPage } from '../pages/LandingPage';

/**
 * Browser back/forward navigation E2E tests — Chromium desktop, no Docker.
 *
 * These tests cover:
 *   EDGE-04 — Browser history navigation between Landing (/) and demo (/demo)
 *             preserves page state and produces no JS exceptions
 *
 * No Docker required — tests use page navigation and page.goBack()/goForward().
 * Tests run in parallel (each test is independent, no shared execution state).
 */
test.describe('Browser Back/Forward Navigation (EDGE-04)', () => {
  // Skip on mobile — browser navigation tests run on desktop only
  test.skip(({ isMobile }) => isMobile, 'Browser navigation tests run on desktop only');

  // ==================== Back Navigation Tests ====================

  test('navigating Landing → /demo then Back returns to Landing', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const landing = new LandingPage(page);

    // Start at landing page
    await landing.goto();

    // Verify landing page is visible
    await landing.waitForVisible();

    // Navigate to /demo (direct URL — simulates clicking a Try Now link)
    await page.goto('/demo');
    await page.waitForURL('**/demo**', { timeout: 10_000 });
    expect(page.url()).toContain('/demo');

    // Navigate back to landing using browser history
    await page.goBack({ waitUntil: 'networkidle' });

    // URL must return to landing (/)
    expect(page.url()).toMatch(/\/$/);

    // Landing page element must be visible again
    await landing.waitForVisible();

    // No JS exceptions during navigation
    expect(pageErrors).toHaveLength(0);
  });

  test('pressing Forward after Back returns to /demo with tool picker visible', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const landing = new LandingPage(page);
    const demo = new DemoPage(page);

    // Navigate to landing first to establish history entry
    await landing.goto();
    await landing.waitForVisible();

    // Navigate to /demo
    await page.goto('/demo');
    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });

    // Navigate back
    await page.goBack({ waitUntil: 'networkidle' });
    expect(page.url()).toMatch(/\/$/);

    // Navigate forward — should return to /demo
    await page.goForward({ waitUntil: 'networkidle' });
    await page.waitForURL('**/demo**', { timeout: 10_000 });
    expect(page.url()).toContain('/demo');

    // Tool picker must be visible on /demo after forward navigation
    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });

    // No JS exceptions during back/forward cycle
    expect(pageErrors).toHaveLength(0);
  });

  // ==================== Tool Pre-Selection Preservation Tests ====================

  test('direct navigation to /demo?tool=java-verification then Back returns to Landing', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const landing = new LandingPage(page);
    const demo = new DemoPage(page);

    // Establish landing page in history
    await landing.goto();
    await landing.waitForVisible();

    // Navigate to /demo with tool pre-selected via URL param
    await page.goto('/demo?tool=java-verification');
    await page.waitForURL('**/demo**', { timeout: 10_000 });

    // Verify tool card is selected (border-primary class)
    const toolCard = demo.getToolOption('java-verification');
    await expect(toolCard).toBeVisible({ timeout: 10_000 });
    await expect(toolCard).toHaveClass(/border-primary/);

    // Navigate back to landing
    await page.goBack({ waitUntil: 'networkidle' });

    // Must return to landing page
    await landing.waitForVisible();

    // No JS exceptions during navigation
    expect(pageErrors).toHaveLength(0);
  });

  test('back/forward preserves tool pre-selection from URL params', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const landing = new LandingPage(page);
    const demo = new DemoPage(page);

    // Navigate to landing first to build history
    await landing.goto();
    await landing.waitForVisible();

    // Navigate to /demo?tool=java-verification
    await page.goto('/demo?tool=java-verification');
    await page.waitForURL('**/demo**', { timeout: 10_000 });

    // Verify initial tool selection
    const toolCard = demo.getToolOption('java-verification');
    await expect(toolCard).toHaveClass(/border-primary/);

    // Go back to landing
    await page.goBack({ waitUntil: 'networkidle' });
    expect(page.url()).toMatch(/\/$/);

    // Go forward — should restore /demo?tool=java-verification
    await page.goForward({ waitUntil: 'networkidle' });
    await page.waitForURL('**/demo**', { timeout: 10_000 });

    // URL must still contain the tool parameter
    expect(page.url()).toContain('tool=java-verification');

    // Tool card must be selected again after forward navigation
    await expect(toolCard).toBeVisible({ timeout: 10_000 });
    await expect(toolCard).toHaveClass(/border-primary/);

    // No JS exceptions during the full back/forward cycle
    expect(pageErrors).toHaveLength(0);
  });
});
