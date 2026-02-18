import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';

/**
 * Tool switching E2E tests — Chromium desktop, Docker, serial.
 *
 * These tests cover:
 *   EDGE-03 — Tool switching clears execution state and produces fresh output
 *
 * Project targeting: playwright.config.ts "desktop-chromium" project
 * (viewport-based isMobile skip ensures they only run on desktop).
 *
 * Note: Only java-verification is Docker-enabled in this codebase.
 * cpp-to-c-transpiler and cpp-to-rust-transpiler are "coming soon" tools with no Docker
 * backend. Tool switching tests simulate: select java-verification → select coming-soon
 * tool → verify UI state resets → switch back → execute to verify fresh output.
 */
test.describe('Tool Switching Flow (EDGE-03)', () => {
  // All Docker execution tests are slow — allow up to 3 minutes
  test.setTimeout(180_000);

  // Run sequentially to avoid Docker resource contention
  test.describe.configure({ mode: 'serial' });

  // Skip on mobile — tool switching tests run on Chromium desktop only
  test.skip(({ isMobile }) => isMobile, 'Tool switching tests run on desktop only');

  // ==================== State Clearing Tests ====================

  test('tool switching clears previous execution state', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Start with java-verification, load and run an example
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Wait for execution to complete and verify output appeared
    await exec.waitForExecutionComplete();
    const consoleTextAfterFirstRun = await exec.getConsoleText();
    expect(consoleTextAfterFirstRun.length).toBeGreaterThan(0);

    // Output panel must be visible after successful execution
    await expect(exec.outputPanel).toBeVisible({ timeout: 10_000 });

    // Switch to a different tool (cpp-to-c-transpiler — coming soon, no Docker)
    await exec.selectTool('cpp-to-c-transpiler');

    // After switching to a different tool, the execute button should reflect the new
    // tool state: either disabled (no file uploaded for new tool) or showing new tool label.
    // The previous tool's execution results should no longer drive the button state.
    const buttonText = await exec.executeButton.textContent();
    expect(buttonText).toBeTruthy();

    // Execute button must NOT show "Running..." — no execution is happening
    expect(buttonText).not.toMatch(/Running/i);

    // Either: button is disabled (new tool, no upload) OR shows new tool label
    // (not java-verification label or "Run Again" from previous run)
    const isDisabled = await exec.executeButton.isDisabled();
    const showsNewTool = /C\+\+ to C|cpp-to-c|transpiler/i.test(buttonText ?? '');
    const showsJavaLabel = /Java Verification/i.test(buttonText ?? '');
    const showsRunAgain = /Run Again/i.test(buttonText ?? '');

    // After switching tools, the button should NOT still show the previous tool's
    // post-execution state (i.e., "Run Again" without java-verification label).
    // Acceptable states: disabled (new tool awaits upload) OR new tool label visible.
    expect(isDisabled || showsNewTool || (!showsRunAgain && !showsJavaLabel)).toBe(true);
  });

  test('switching back to java-verification and executing produces output', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // First run: java-verification → execute → complete
    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    const firstRunText = await exec.getConsoleText();
    expect(firstRunText.length).toBeGreaterThan(0);

    // Switch away to a different tool
    await exec.selectTool('cpp-to-c-transpiler');

    // Switch back to java-verification
    await exec.selectTool('java-verification');

    // Load example again (tool switch may have cleared the uploaded file context)
    await exec.loadExample('bank-account-records');

    // Execute again after switch-cycle
    await exec.execute();

    // Wait for second execution to complete
    await exec.waitForExecutionComplete();

    // Verify second execution produced output — COMPLETED status badge visible
    await expect(exec.statusBadge).toBeVisible({ timeout: 10_000 });

    const secondRunText = await exec.getConsoleText();
    expect(secondRunText.length).toBeGreaterThan(0);

    // Verify output contains verification keywords
    const hasVerificationKeywords = /VERIFIED|verified|precondition|verification|Z3|successful/i.test(
      secondRunText,
    );
    expect(hasVerificationKeywords).toBe(true);
  });

  test('tool switch before execution does not carry over uploaded file context', async ({ page }) => {
    const exec = new ExecutionPage(page);

    // Navigate to demo page without pre-selecting a tool
    await exec.goto();

    // Select java-verification tool
    await exec.selectTool('java-verification');

    // Verify the tool picker is still visible
    await expect(exec.toolPicker).toBeVisible({ timeout: 10_000 });

    // Without uploading or loading an example, switch to cpp-to-c-transpiler
    await exec.selectTool('cpp-to-c-transpiler');

    // After switching without any upload, execute button must be disabled
    // (new tool selected, no file uploaded, no example loaded)
    await expect(exec.executeButton).toBeDisabled();

    // Tool picker must still be visible showing the new selection
    await expect(exec.toolPicker).toBeVisible();

    // The cpp-to-c-transpiler card must be visible in the picker
    const cppCard = exec.page.getByTestId('tool-option-cpp-to-c-transpiler');
    await expect(cppCard).toBeVisible();
  });
});
