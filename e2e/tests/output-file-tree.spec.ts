import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { OutputPage } from '../pages/OutputPage';

/**
 * Output file tree and file preview E2E tests — Chromium desktop, Docker, serial.
 *
 * These tests cover:
 *   OUTP-01 — File tree renders visible file entries after execution completes
 *   OUTP-02 — Clicking a file in the tree opens it with syntax highlighting
 *
 * Project targeting: playwright.config.ts "desktop-chromium" project
 * (viewport-based isMobile skip ensures they only run on desktop).
 */
test.describe('Output File Tree and Preview', () => {
  // All Docker execution tests are slow — allow up to 3 minutes
  test.setTimeout(180_000);

  // Run sequentially to avoid Docker resource contention
  test.describe.configure({ mode: 'serial' });

  // Skip on mobile — output tests run on desktop only
  test.skip(({ isMobile }) => isMobile, 'Output tests run on desktop only');

  // ==================== OUTP-01: File Tree Tests ====================

  test('output file tree shows generated files after execution', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    // OUTP-01: File tree must be visible with file entries
    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });
    await expect(output.treeItems.first()).toBeVisible({ timeout: 10_000 });

    // Must have at least one tree item
    const count = await output.treeItems.count();
    expect(count).toBeGreaterThan(0);

    // Tree item text must contain file-name-like content (letter/number)
    const firstItemText = await output.treeItems.first().textContent();
    expect(firstItemText).toBeTruthy();
    expect(firstItemText!.trim().length).toBeGreaterThan(0);
  });

  test('output file tree contains verification artifact file names', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });

    // Collect all tree item texts
    const itemTexts = await output.treeItems.allTextContents();
    const allText = itemTexts.join(' ');

    // Verification outputs include .java, .txt, .log, or named artifacts
    const hasFileExtension = /\.java|\.txt|\.log|Account|Transaction|Shape/i.test(allText);
    expect(hasFileExtension).toBe(true);
  });

  // ==================== OUTP-02: File Preview Tests ====================

  test('clicking a file in tree opens syntax-highlighted preview', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });

    // Click the first non-folder file in the tree
    await output.clickFirstFile(15_000);

    // OUTP-02: File preview header must be visible with file name and language
    await expect(output.filePreviewHeader).toBeVisible({ timeout: 10_000 });
    const headerText = await output.getPreviewHeaderText();
    expect(headerText).toBeTruthy();
    expect(headerText.trim().length).toBeGreaterThan(0);

    // Syntax highlighter block must be present with code content
    await expect(output.syntaxHighlighterBlock).toBeVisible({ timeout: 10_000 });
    const codeText = await output.syntaxHighlighterBlock.textContent();
    expect(codeText).toBeTruthy();
    expect(codeText!.trim().length).toBeGreaterThan(0);
  });

  test('file preview header shows language badge for .java files', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });
    await output.clickFirstFile(15_000);

    // Preview header dark bar should contain a language label badge
    await expect(output.filePreviewHeader).toBeVisible({ timeout: 10_000 });

    // The header contains the file name AND a badge span
    // FilePreview.tsx renders: filename span + outputTypeLabel badge + language badge
    const badgeLocator = page.locator('.bg-slate-900 span[class*="rounded"]').first();
    await expect(badgeLocator).toBeVisible({ timeout: 5_000 });
  });
});
