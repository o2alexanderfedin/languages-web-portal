import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';

/**
 * Execution flow E2E tests — Chromium desktop, Docker, serial.
 *
 * These tests cover:
 *   EXEC-01 — SSE streaming output (console grows incrementally)
 *   EXEC-02 — Progress indicators (button "Running...", connection badge)
 *
 * Project targeting: playwright.config.ts "desktop-chromium" project
 * (viewport-based isMobile skip ensures they only run on desktop).
 */
test.describe('Java FV Execution Flow', () => {
  // All Docker execution tests are slow — allow up to 3 minutes
  test.setTimeout(180_000);

  // Run sequentially to avoid Docker resource contention
  test.describe.configure({ mode: 'serial' });

  // Skip on mobile — execution tests run on Chromium desktop only
  test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');

  // ==================== Happy Path Tests ====================

  test('bank-account-records example executes and shows VERIFIED', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Assert button shows "Running..." while execution is in progress
    await expect(exec.executeButton).toContainText(/Running/i, { timeout: 10_000 });

    // Wait for console output to appear
    await exec.consoleOutput.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(exec.consoleOutput).not.toBeEmpty();

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // Assert console output contains verification-related keywords
    const consoleText = await exec.getConsoleText();
    expect(consoleText).toBeTruthy();

    const hasVerificationKeywords = /VERIFIED|verified|precondition|verification|Z3|successful/i.test(
      consoleText,
    );
    expect(hasVerificationKeywords).toBe(true);

    // Assert COMPLETED status badge is visible
    await expect(exec.statusBadge).toBeVisible({ timeout: 5_000 });
  });

  test('shape-matching example executes successfully', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('shape-matching');
    await exec.execute();

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // Assert console output contains verification-related text
    const consoleText = await exec.getConsoleText();
    expect(consoleText).toBeTruthy();

    const hasVerificationKeywords = /VERIFIED|verified|precondition|verification|Z3|successful/i.test(
      consoleText,
    );
    expect(hasVerificationKeywords).toBe(true);
  });

  test('payment-types example shows verification failures for UnsafeRefund.java', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('payment-types');
    await exec.execute();

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // Assert console output contains failure indicators
    const consoleText = await exec.getConsoleText();
    expect(consoleText).toBeTruthy();

    // Check for FAILED status
    const hasFailedStatus = /FAILED|failed|VERIFICATION FAILED/i.test(consoleText);
    expect(hasFailedStatus).toBe(true);

    // Check for specific failure mode keywords from UnsafeRefund.java's intentional failures
    const failureKeywords = [
      'null', 'division', 'overflow', 'bounds', 'refund', 'unsafe',
      'ArithmeticException', 'NullPointerException', 'ArrayIndexOutOfBoundsException',
      'validation', 'check', 'error',
    ];

    const hasFailureIndicators = failureKeywords.some((keyword) =>
      consoleText.toLowerCase().includes(keyword.toLowerCase()),
    );
    expect(hasFailureIndicators).toBe(true);
  });

  // ==================== Streaming Verification Tests ====================

  test('streaming output shows early markers before final result', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Wait for console output to have ANY text content (early SSE marker)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="console-output"]');
        if (!el) return false;
        return (el.textContent || '').trim().length > 0;
      },
      { timeout: 30_000 },
    );

    // Snapshot early console length
    const earlyLength = (await exec.getConsoleText()).length;

    // Wait for final completion
    await exec.waitForExecutionComplete();

    // Final text must be longer than the early snapshot — proves incremental streaming
    const finalText = await exec.getConsoleText();
    expect(finalText).toBeTruthy();
    expect(finalText.length).toBeGreaterThan(earlyLength);
  });

  test('auto-scroll behavior during streaming', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Wait for some console content to appear
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="console-output"]');
        if (!el) return false;
        return (el.textContent || '').trim().length > 0;
      },
      { timeout: 30_000 },
    );

    // Console should be scrolled to bottom while streaming
    expect(await exec.isScrolledToBottom()).toBe(true);

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // Console should still be at bottom after more output has streamed
    expect(await exec.isScrolledToBottom()).toBe(true);
  });

  // ==================== Progress Indicator Tests ====================

  test('loading indicator visible during execution', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Button should show "Running..." while execution is running
    await expect(exec.executeButton).toContainText(/Running/i, { timeout: 5_000 });

    // Connection state badge (CONNECTING or CONNECTED) should be visible
    await expect(exec.connectionBadge).toBeVisible({ timeout: 10_000 });

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // Button should no longer show "Running..." — must show tool name or "Run Again"
    const buttonText = await exec.executeButton.textContent();
    expect(buttonText).toBeTruthy();
    expect(buttonText).not.toMatch(/Running/i);
    expect(buttonText).toMatch(/Java Verification|Run Again/i);
  });

  // ==================== Output File Tree Tests ====================

  test('output file tree appears after successful execution', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // "Output Files" heading should be visible
    const outputFilesHeading = page.getByRole('heading', { name: /Output Files/i, level: 3 });
    await expect(outputFilesHeading).toBeVisible({ timeout: 10_000 });

    // Output panel itself should be visible
    await expect(exec.outputPanel).toBeVisible({ timeout: 5_000 });

    // Output panel should have tree items or substantial text content
    const hasTreeContent = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="output-panel"]');
      if (!panel) return false;
      const treeItems = panel.querySelectorAll('[role="treeitem"]');
      if (treeItems.length > 0) return true;
      return (panel.textContent || '').length > 100;
    });
    expect(hasTreeContent).toBe(true);
  });

  test('output file tree contains verification artifacts', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Wait for execution to complete
    await exec.waitForExecutionComplete();

    // Output panel should be visible with substantial content
    await expect(exec.outputPanel).toBeVisible({ timeout: 10_000 });

    const outputPanelText = await exec.outputPanel.textContent();
    expect(outputPanelText).toBeTruthy();

    // Output panel must have meaningful file listings (> 50 chars)
    expect(outputPanelText!.length).toBeGreaterThan(50);

    // Verification tools produce .java, .txt, .log files or named artifacts
    const hasFileNames = /\.java|\.txt|\.log|Account|Transaction|Shape/i.test(outputPanelText!);
    expect(hasFileNames).toBe(true);
  });
});
