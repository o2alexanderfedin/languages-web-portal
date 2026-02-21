import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { OutputPage } from '../pages/OutputPage';

/**
 * C# FV Output file tree and download E2E tests — Chromium desktop, Docker, serial (E2E-03).
 *
 * Covers:
 *   E2E-03 — C# FV output file tree and results display (non-empty after successful execution)
 *
 * Uses null-safe-repository (known-pass) so output panel renders (status === 'completed').
 * Requires Docker container running via E2E_BASE_URL.
 */
test.describe('C# FV Output File Tree and Download (E2E-03)', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  test.skip(({ isMobile }) => isMobile, 'Output tests run on desktop only');

  test('output file tree is non-empty after null-safe-repository execution', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.loadExample('null-safe-repository');
    await exec.execute();
    await exec.waitForExecutionComplete();

    // E2E-03: Output section only renders for status === 'completed'
    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });
    await expect(output.treeItems.first()).toBeVisible({ timeout: 10_000 });

    // Must have at least one tree item
    const count = await output.treeItems.count();
    expect(count).toBeGreaterThan(0);

    // Tree item must have meaningful text (file name)
    const firstItemText = await output.treeItems.first().textContent();
    expect(firstItemText).toBeTruthy();
    expect(firstItemText!.trim().length).toBeGreaterThan(0);
  });

  test('download button is visible after successful C# FV execution', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.loadExample('null-safe-repository');
    await exec.execute();
    await exec.waitForExecutionComplete();

    // E2E-03: Output panel must be visible (status = completed)
    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });

    // Download button must be visible and accessible
    await expect(output.downloadButton).toBeVisible({ timeout: 5_000 });
  });

  test('Output Files heading is visible after successful C# FV execution', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.loadExample('null-safe-repository');
    await exec.execute();
    await exec.waitForExecutionComplete();

    // Output Files section heading must appear (same as Java FV)
    const outputFilesHeading = page.getByRole('heading', { name: /Output Files/i, level: 3 });
    await expect(outputFilesHeading).toBeVisible({ timeout: 10_000 });
  });
});
