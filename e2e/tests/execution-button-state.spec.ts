import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { SAMPLE_ZIP_PATH } from '../fixtures/helpers';

/**
 * Execute button disabled state E2E tests — all 3 desktop browsers, parallel.
 *
 * These tests cover:
 *   EXEC-04 — Execute button gating logic (disabled until both file + tool selected)
 *
 * No Docker dependency — only UI state is tested, no execution is triggered.
 * Runs across desktop-chromium, desktop-firefox, and desktop-webkit via isMobile skip.
 * Tests run in parallel (no serial mode needed).
 */
test.describe('Execute Button State', () => {
  // Skip on mobile — button state tests run on desktop only
  test.skip(({ isMobile }) => isMobile, 'Execution button state tests run on desktop only');

  // ==================== Button State Tests ====================

  test('execute button disabled on fresh page load (no file, no tool)', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Navigate to /demo with no pre-selected tool
    await exec.goto();

    await expect(exec.executeButton).toBeDisabled();
  });

  test('execute button disabled after file upload only (no tool selected)', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Navigate with no tool pre-selected
    await exec.goto();

    // Upload a file
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_ZIP_PATH);
    await page.getByTestId('upload-success').waitFor({ state: 'visible', timeout: 10_000 });

    // No tool selected — button must remain disabled
    await expect(exec.executeButton).toBeDisabled();
  });

  test('execute button disabled after tool selected only (no file uploaded)', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Navigate with tool pre-selected via URL — no file upload performed
    await exec.goto('tool=java-verification');

    await expect(exec.executeButton).toBeDisabled();
  });

  test('execute button enables when both file uploaded and tool selected', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Navigate with tool pre-selected via URL
    await exec.goto('tool=java-verification');

    // Upload a file
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_ZIP_PATH);
    await page.getByTestId('upload-success').waitFor({ state: 'visible', timeout: 10_000 });

    // Both conditions met — button must be enabled
    await expect(exec.executeButton).toBeEnabled({ timeout: 5_000 });
  });
});
