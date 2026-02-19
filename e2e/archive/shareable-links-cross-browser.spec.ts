import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';

/**
 * Shareable links E2E tests — cross-browser.
 *
 * Covers:
 *   EXMP-02 — URL ?tool= parameter pre-selects the correct tool card on /demo
 *   EXMP-03 — Invalid ?tool= parameter values are handled gracefully (no crash)
 *
 * No Docker required — these tests only navigate and assert UI state.
 * These tests run across all desktop browser projects defined in playwright.config.ts.
 */

test.describe('Shareable Link URL Parameter Pre-Selection (EXMP-02)', () => {
  test.skip(({ isMobile }) => isMobile, 'Shareable link tests run on desktop only');

  test('?tool=java-verification pre-selects java-verification tool card', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=java-verification');

    // EXMP-02: the tool card must be visually selected (border-primary class)
    const selectedTool = demo.getToolOption('java-verification');
    await expect(selectedTool).toBeVisible({ timeout: 10_000 });
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('?tool=cpp-to-c-transpiler pre-selects cpp-to-c-transpiler tool card', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=cpp-to-c-transpiler');

    const selectedTool = demo.getToolOption('cpp-to-c-transpiler');
    await expect(selectedTool).toBeVisible({ timeout: 10_000 });
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('?tool=cpp-to-rust-transpiler pre-selects cpp-to-rust-transpiler tool card', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=cpp-to-rust-transpiler');

    const selectedTool = demo.getToolOption('cpp-to-rust-transpiler');
    await expect(selectedTool).toBeVisible({ timeout: 10_000 });
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('pre-selected tool enables the shareable-link element', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=java-verification');

    // EXMP-02: shareable-link element must be visible when tool is pre-selected
    await expect(demo.shareableLink).toBeVisible({ timeout: 10_000 });
  });

  test('no tool param shows no pre-selected tool and disables execute button', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto();

    // No pre-selection — execute button must be disabled (no tool + no upload)
    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });
    await expect(demo.executeButton).toBeDisabled();
  });
});

test.describe('Invalid Shareable Link Parameters (EXMP-03)', () => {
  test.skip(({ isMobile }) => isMobile, 'Shareable link tests run on desktop only');

  test('?tool=nonexistent does not crash — page loads with toolPicker visible', async ({ page }) => {
    const demo = new DemoPage(page);

    // Capture any page errors (JS exceptions) to confirm graceful handling
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await demo.goto('tool=nonexistent');

    // EXMP-03: page must load successfully — no crash
    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });

    // Execute button must be present (disabled — no valid tool selected)
    await expect(demo.executeButton).toBeVisible();
    await expect(demo.executeButton).toBeDisabled();

    // No JS exceptions thrown during page load
    expect(pageErrors).toHaveLength(0);
  });

  test('?tool=nonexistent shows no tool card highlighted as selected', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=nonexistent');

    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });

    // The java-verification card must NOT have border-primary (not selected)
    const javaCard = demo.getToolOption('java-verification');
    await expect(javaCard).toBeVisible();
    await expect(javaCard).not.toHaveClass(/border-primary/);
  });

  test('?tool= (empty value) is handled gracefully', async ({ page }) => {
    const demo = new DemoPage(page);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await demo.goto('tool=');

    // Page must load without crash
    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });
    await expect(demo.executeButton).toBeDisabled();
    expect(pageErrors).toHaveLength(0);
  });

  test('?tool=JAVA-VERIFICATION (wrong case) does not pre-select', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=JAVA-VERIFICATION');

    await expect(demo.toolPicker).toBeVisible({ timeout: 10_000 });

    // Tool IDs are case-sensitive — JAVA-VERIFICATION must not match java-verification
    await expect(demo.executeButton).toBeDisabled();
  });
});
