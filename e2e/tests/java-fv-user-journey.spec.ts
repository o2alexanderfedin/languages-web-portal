import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { DemoPage } from '../pages/DemoPage';
import { waitForExecutionComplete } from '../fixtures/helpers';

test.describe('Java FV Full User Journey', () => {
  // Set higher timeout for full journey including Docker execution (180 seconds)
  test.setTimeout(180_000);

  // Desktop only - full journey test runs on desktop only
  test.skip(({ isMobile }) => isMobile, 'Full journey test runs on desktop only');

  // Sequential execution since this is an expensive end-to-end test
  test.describe.configure({ mode: 'serial' });

  test.slow(); // Mark as slow since it includes Docker execution
  test('complete journey: landing page -> tool selection -> example load -> execution -> output', async ({ page }) => {
    // ========== Step 1: Landing Page ==========
    const landing = new LandingPage(page);
    await landing.goto();

    // Assert hero section visible
    await expect(landing.heroSection).toBeVisible();

    // Assert Java Verification tool row has 'Available' badge
    const javaToolRow = landing.getToolRow('java-verification');
    await expect(javaToolRow).toBeVisible();

    const availableBadge = javaToolRow.locator('text=/Available/i');
    await expect(availableBadge).toBeVisible();

    // ========== Step 2: Navigate to Demo ==========
    // Click "Try Now" on the Java Verification tool row
    await landing.clickTryNow('java-verification');

    // Wait for URL to contain /demo?tool=java-verification
    await expect(page).toHaveURL(/\/demo\?tool=java-verification/);

    // Assert java-verification tool option has border-primary class (pre-selected)
    const demo = new DemoPage(page);
    const javaToolOption = demo.getToolOption('java-verification');
    await expect(javaToolOption).toHaveClass(/border-primary/);

    // ========== Step 3: Load Example ==========
    // Wait for example selector to be visible
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Select bank-account-records from dropdown
    await demo.selectExample('bank-account-records');

    // Assert description appears
    const description = await demo.getExampleDescription();
    expect(description.length).toBeGreaterThan(0);

    // Click "Load Example"
    await demo.loadExampleButton.click();

    // Wait for execute button to be enabled
    await expect(demo.executeButton).toBeEnabled({ timeout: 10_000 });

    // ========== Step 4: Execute ==========
    // Click the Run button
    await demo.execute();

    // Assert button text changes to /Running/i
    await expect(demo.executeButton).toContainText(/Running/i, { timeout: 10_000 });

    // Assert streaming indicator appears (connection badge or "Streaming output..." text)
    const streamingIndicator = page.locator('text=/Streaming output/i');
    await expect(streamingIndicator).toBeVisible({ timeout: 10_000 });

    // ========== Step 5: Streaming Output ==========
    // Assert console output element has text content (streaming started)
    await demo.consoleOutput.waitFor({ state: 'visible', timeout: 30_000 });

    await page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-output"]');
        if (!consoleElement) return false;
        const text = consoleElement.textContent || '';
        return text.trim().length > 0;
      },
      { timeout: 30_000 },
    );

    // Wait for execution to complete (console contains 'completed' or 'exit code', 180s timeout)
    await waitForExecutionComplete(page);

    // ========== Step 6: Verify Results ==========
    // Assert console output contains verification-related keywords
    const consoleText = await demo.consoleOutput.textContent();
    expect(consoleText).toBeTruthy();

    const hasVerificationKeywords = /VERIFIED|verified|precondition|verification|Z3|successful/i.test(consoleText!);
    expect(hasVerificationKeywords).toBe(true);

    // Assert execution result status badge is visible
    const statusBadge = page.locator('.bg-green-100.text-green-800, .dark\\:bg-green-900', {
      hasText: /COMPLETED/i,
    });
    await expect(statusBadge).toBeVisible({ timeout: 5_000 });

    // ========== Step 7: Output Files ==========
    // Assert "Output Files" heading visible
    const outputFilesHeading = page.getByRole('heading', { name: /Output Files/i, level: 3 });
    await expect(outputFilesHeading).toBeVisible({ timeout: 10_000 });

    // Assert output-panel data-testid is visible
    await expect(demo.outputPanel).toBeVisible({ timeout: 5_000 });

    // Assert at least one tree item in the output panel
    const hasTreeItems = await page.evaluate(() => {
      const outputPanel = document.querySelector('[data-testid="output-panel"]');
      if (!outputPanel) return false;

      // Check for tree items
      const treeItems = outputPanel.querySelectorAll('[role="treeitem"]');
      if (treeItems.length > 0) return true;

      // Or check for substantial file-related content
      const text = outputPanel.textContent || '';
      return text.length > 100 && /\.java|\.txt|Account|Transaction/i.test(text);
    });
    expect(hasTreeItems).toBe(true);

    // ========== Journey Complete ==========
    // This test has validated the entire E2E flow:
    // - Landing page discovery (Available badge)
    // - Navigation via Try Now button
    // - Tool pre-selection in demo
    // - Example loading via ExampleSelector
    // - Execution with streaming output
    // - Console output with verification keywords
    // - Execution status badge
    // - Output file tree display
  });
});
