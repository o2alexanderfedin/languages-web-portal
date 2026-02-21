import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';

/**
 * C# FV Execution Flow E2E tests — Chromium desktop, Docker, serial (E2E-02, E2E-04).
 *
 * Covers:
 *   E2E-02 — C# FV execution with Docker streaming and progress display
 *   E2E-04 — bank-account-invariant produces FAILED status (quality gate for exit-code fix)
 *
 * Requires Docker container running via E2E_BASE_URL.
 * Run: E2E_BASE_URL=http://localhost:3000 npx playwright test csharp-fv-execution
 */
test.describe('C# FV Execution Flow (E2E-02, E2E-04)', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');

  // === Pass-case: null-safe-repository ===
  test('null-safe-repository executes and shows COMPLETED status', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=csharp-verification');
    await exec.loadExample('null-safe-repository');
    await exec.execute();

    // Assert button shows "Running..." while executing
    await expect(exec.executeButton).toContainText(/Running/i, { timeout: 10_000 });

    // Wait for console output and execution completion
    await exec.consoleOutput.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(exec.consoleOutput).not.toBeEmpty();
    await exec.waitForExecutionComplete();

    // Assert console has C# FV verification keywords (flexible regex — cs-fv output may vary)
    const consoleText = await exec.getConsoleText();
    expect(consoleText).toBeTruthy();
    const hasVerificationContent = /verified|passed|Passed|✓|method|OK|Running/i.test(consoleText);
    expect(hasVerificationContent).toBe(true);

    // Assert COMPLETED status badge visible (green: bg-green-100)
    await expect(exec.statusBadge).toBeVisible({ timeout: 5_000 });
  });

  // === Pass-case: calculator-contracts ===
  test('calculator-contracts executes and shows COMPLETED status', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=csharp-verification');
    await exec.loadExample('calculator-contracts');
    await exec.execute();
    await exec.waitForExecutionComplete();

    const consoleText = await exec.getConsoleText();
    expect(consoleText).toBeTruthy();

    // Assert COMPLETED status badge visible
    await expect(exec.statusBadge).toBeVisible({ timeout: 5_000 });
  });

  // === FAILED-case: bank-account-invariant (E2E-04 QUALITY GATE) ===
  test('bank-account-invariant produces FAILED status (E2E-04 quality gate)', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=csharp-verification');
    await exec.loadExample('bank-account-invariant');
    await exec.execute();
    await exec.waitForExecutionComplete();

    // CRITICAL: Assert FAILED status badge visible (red: bg-red-100 text-red-800)
    // Uses failedStatusBadge from ExecutionPage POM (added in plan 01)
    await expect(exec.failedStatusBadge).toBeVisible({ timeout: 5_000 });

    // Assert console contains FV diagnostic content (flexible regex)
    const consoleText = await exec.getConsoleText();
    expect(consoleText).toBeTruthy();
    const hasDiagnostic = /failed|Failed|❌|error|Error|Withdraw|violation|balance/i.test(consoleText);
    expect(hasDiagnostic).toBe(true);

    // CRITICAL: Assert output panel NOT visible — ExecutionPanel.tsx gates output on status === 'completed'
    // For FAILED status, the entire output section is not mounted
    await expect(exec.outputPanel).not.toBeVisible();
  });

  // === Streaming verification ===
  test('C# FV streaming output grows incrementally', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=csharp-verification');
    await exec.loadExample('null-safe-repository');
    await exec.execute();

    // Wait for any console content (early SSE marker)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="console-output"]');
        if (!el) return false;
        return (el.textContent || '').trim().length > 0;
      },
      { timeout: 30_000 },
    );

    const earlyLength = (await exec.getConsoleText()).length;
    await exec.waitForExecutionComplete();

    // Final text must be longer — proves incremental streaming
    const finalText = await exec.getConsoleText();
    expect(finalText.length).toBeGreaterThan(earlyLength);
  });
});
