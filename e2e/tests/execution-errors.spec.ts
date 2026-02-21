import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { SAMPLE_ZIP_PATH } from '../fixtures/helpers';

/**
 * Execution error scenario E2E tests — Chromium desktop, network-intercepted, parallel.
 *
 * These tests cover:
 *   EXEC-03 — Error handling with user-visible messages and button recovery
 *
 * No Docker dependency — all network calls are intercepted via Playwright route interception.
 * Tests run in parallel (no test.describe.configure({ mode: 'serial' }) needed).
 */
test.describe('Execution Error Scenarios', () => {
  // Skip on mobile — execution tests run on desktop only
  test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');

  /**
   * Helper: navigate to /demo with java-verification pre-selected,
   * upload a file so the execute button becomes enabled.
   */
  async function setupWithFile(exec: ExecutionPage): Promise<void> {
    await exec.goto('tool=java-verification');
    await exec.page.locator('input[type="file"]').setInputFiles(SAMPLE_ZIP_PATH);
    await exec.page.getByTestId('upload-success').waitFor({ state: 'visible', timeout: 10_000 });
    await expect(exec.executeButton).toBeEnabled({ timeout: 5_000 });
  }

  // ==================== Error Scenario Tests ====================

  test('server 500 error during execution shows error message', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await setupWithFile(exec);

    // Intercept the execution endpoint and return HTTP 500
    await page.route('**/execute**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );

    await exec.executeButton.click();

    // Assert a user-visible error message appears
    const errorLocator = page
      .locator('[data-testid="execution-error"], [role="alert"]')
      .filter({ hasText: /error|failed|something went wrong/i });
    await expect(errorLocator).toBeVisible({ timeout: 10_000 });

    // Assert execute button re-enables so user can retry
    await expect(exec.executeButton).toBeEnabled({ timeout: 5_000 });
  });

  test('SSE connection abort mid-stream shows error message', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await setupWithFile(exec);

    // Intercept the SSE stream and abort the connection
    await page.route('**/execute**', (route) => route.abort('connectionfailed'));

    await exec.executeButton.click();

    // Assert a user-visible error message appears
    const errorLocator = page
      .locator('[data-testid="execution-error"], [role="alert"]')
      .filter({ hasText: /error|failed|something went wrong/i });
    await expect(errorLocator).toBeVisible({ timeout: 10_000 });

    // Assert execute button re-enables after error
    await expect(exec.executeButton).toBeEnabled({ timeout: 5_000 });
  });

  test('connection timeout shows error message', async ({ page }) => {
    // Extend timeout for this test — the delay is 35s
    test.setTimeout(60_000);

    const exec = new ExecutionPage(page);
    await setupWithFile(exec);

    // Intercept and delay response beyond client timeout
    await page.route('**/execute**', async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 35_000));
      await route.abort();
    });

    await exec.executeButton.click();

    // Assert user-visible error message (includes timeout/timed out variants)
    const errorLocator = page
      .locator('[data-testid="execution-error"], [role="alert"]')
      .filter({ hasText: /error|failed|timed out|timeout|something went wrong/i });
    await expect(errorLocator).toBeVisible({ timeout: 40_000 });

    // Assert execute button re-enables so user can retry
    await expect(exec.executeButton).toBeEnabled({ timeout: 5_000 });
  });
});

/**
 * C# FV Wrapper Validation Errors — no-.csproj scenario.
 *
 * The hupyy-csharp-verify.sh wrapper exits 2 if no .csproj is found.
 * This triggers a portal error message via the SSE error event.
 *
 * sample.zip contains only main.cpp (no .csproj), so uploading it with
 * tool=csharp-verification exercises the wrapper's pre-flight validation.
 */
test.describe('C# FV Wrapper Validation Errors', () => {
  test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');

  test('C# FV shows error when uploaded zip contains no .csproj file', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Navigate with C# FV pre-selected, upload the sample zip (no .csproj = wrapper exit 2)
    await exec.goto('tool=csharp-verification');
    await exec.page.locator('input[type="file"]').setInputFiles(SAMPLE_ZIP_PATH);
    await exec.page.getByTestId('upload-success').waitFor({ state: 'visible', timeout: 10_000 });
    await expect(exec.executeButton).toBeEnabled({ timeout: 5_000 });

    await exec.executeButton.click();

    // Wrapper exits 2 → portal surfaces error message or FAILED status badge
    const errorLocator = page
      .locator('[data-testid="execution-error"], [role="alert"]')
      .filter({ hasText: /error|failed|something went wrong|csproj/i });
    const failedBadge = exec.failedStatusBadge;

    // Either the error alert or the FAILED status badge must appear
    await Promise.race([
      expect(errorLocator).toBeVisible({ timeout: 30_000 }),
      expect(failedBadge).toBeVisible({ timeout: 30_000 }),
    ]);
  });
});
