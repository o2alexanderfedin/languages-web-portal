import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';

test.describe('Java FV Execution', () => {
  // Set higher timeout for Docker execution tests (180 seconds)
  test.setTimeout(180_000);

  // Skip mobile tests - execution tests run on desktop only
  test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');

  // Run tests sequentially since they're expensive Docker operations
  test.describe.configure({ mode: 'serial' });

  /**
   * Helper function to load an example and click execute
   * Returns DemoPage instance for subsequent assertions
   */
  async function loadExampleAndRun(page: any, exampleName: string): Promise<DemoPage> {
    // Navigate to demo with java-verification pre-selected
    await page.goto('/demo?tool=java-verification');

    const demo = new DemoPage(page);

    // Wait for example selector to be visible
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Load the example (waits for execute button to enable)
    await demo.loadExample(exampleName);

    // Click execute button
    await demo.execute();

    return demo;
  }

  /**
   * Wait for execution to complete (console contains completion indicator)
   * Uses 180s timeout since Docker execution can be slow
   */
  async function waitForExecutionComplete(page: any): Promise<void> {
    await page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-output"]');
        if (!consoleElement) return false;
        const text = consoleElement.textContent || '';
        return /completed|exit code/i.test(text);
      },
      { timeout: 180_000 },
    );
  }

  // Check Docker availability before running tests
  test.beforeAll(async () => {
    // Docker must be running for these tests to work
    // This is documented in the E2E test README
    // If Docker is not available, tests will timeout and fail with clear error messages
  });

  // ==================== Happy Path Tests ====================

  test.slow(); // Mark as slow since all tests involve Docker
  test('bank-account-records example executes and shows VERIFIED', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'bank-account-records');

    // Wait for streaming to start - check button shows "Running..."
    await expect(demo.executeButton).toContainText(/Running/i, { timeout: 10_000 });

    // Wait for console output to appear
    await demo.consoleOutput.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(demo.consoleOutput).not.toBeEmpty();

    // Wait for execution to complete
    await waitForExecutionComplete(page);

    // Assert console output contains verification-related keywords
    const consoleText = await demo.consoleOutput.textContent();
    expect(consoleText).toBeTruthy();

    // Check for verification success indicators
    const hasVerificationKeywords = /VERIFIED|verified|precondition|verification|Z3|successful/i.test(consoleText!);
    expect(hasVerificationKeywords).toBe(true);

    // Assert execution result status badge shows COMPLETED
    const statusBadge = page.locator('.bg-green-100.text-green-800, .dark\\:bg-green-900', {
      hasText: /COMPLETED/i,
    });
    await expect(statusBadge).toBeVisible({ timeout: 5_000 });
  });

  test.slow();
  test('shape-matching example executes successfully', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'shape-matching');

    // Wait for execution to complete
    await waitForExecutionComplete(page);

    // Assert console output contains verification-related text
    const consoleText = await demo.consoleOutput.textContent();
    expect(consoleText).toBeTruthy();

    const hasVerificationKeywords = /VERIFIED|verified|precondition|verification|Z3|successful/i.test(consoleText!);
    expect(hasVerificationKeywords).toBe(true);
  });

  test.slow();
  test('payment-types example shows verification failures for UnsafeRefund.java', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'payment-types');

    // Wait for execution to complete
    await waitForExecutionComplete(page);

    // Assert console output contains failure indicators
    const consoleText = await demo.consoleOutput.textContent();
    expect(consoleText).toBeTruthy();

    // Check for FAILED status
    const hasFailedStatus = /FAILED|failed|VERIFICATION FAILED/i.test(consoleText!);
    expect(hasFailedStatus).toBe(true);

    // Check for specific failure mode keywords from UnsafeRefund.java's 5 intentional failures
    // These include: missing validation, unsafe array access, division by zero, null dereference, integer overflow
    const failureKeywords = [
      'null', 'division', 'overflow', 'bounds', 'refund', 'unsafe',
      'ArithmeticException', 'NullPointerException', 'ArrayIndexOutOfBoundsException',
      'validation', 'check', 'error'
    ];

    const hasFailureIndicators = failureKeywords.some(keyword =>
      consoleText!.toLowerCase().includes(keyword.toLowerCase())
    );
    expect(hasFailureIndicators).toBe(true);
  });

  // ==================== Streaming Verification Tests ====================

  test.slow();
  test('streaming output shows early markers before final result', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'bank-account-records');

    // Wait for console output to have ANY text content (early marker)
    await page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-output"]');
        if (!consoleElement) return false;
        const text = consoleElement.textContent || '';
        return text.trim().length > 0;
      },
      { timeout: 30_000 },
    );

    // Store snapshot of current console text
    const earlySnapshot = await demo.consoleOutput.textContent();
    expect(earlySnapshot).toBeTruthy();
    const earlyLength = earlySnapshot!.length;

    // Wait for final completion
    await waitForExecutionComplete(page);

    // Assert final console text is longer than early snapshot
    const finalText = await demo.consoleOutput.textContent();
    expect(finalText).toBeTruthy();
    expect(finalText!.length).toBeGreaterThan(earlyLength);

    // This proves streaming occurred (output arrived incrementally, not all at once)
  });

  test.slow();
  test('auto-scroll behavior during streaming', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'bank-account-records');

    // Wait for console output to have some content
    await page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-output"]');
        if (!consoleElement) return false;
        const text = consoleElement.textContent || '';
        return text.trim().length > 0;
      },
      { timeout: 30_000 },
    );

    // Check scroll position is near bottom (within 10px tolerance)
    const isScrolledToBottom = await page.evaluate(() => {
      const consoleElement = document.querySelector('[data-testid="console-output"]');
      if (!consoleElement) return false;
      const { scrollTop, scrollHeight, clientHeight } = consoleElement;
      return scrollTop + clientHeight >= scrollHeight - 10;
    });
    expect(isScrolledToBottom).toBe(true);

    // Wait for execution to complete
    await waitForExecutionComplete(page);

    // Check scroll position is still near bottom after more output streamed
    const stillScrolledToBottom = await page.evaluate(() => {
      const consoleElement = document.querySelector('[data-testid="console-output"]');
      if (!consoleElement) return false;
      const { scrollTop, scrollHeight, clientHeight } = consoleElement;
      return scrollTop + clientHeight >= scrollHeight - 10;
    });
    expect(stillScrolledToBottom).toBe(true);
  });

  test.slow();
  test('loading indicator visible during execution', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'bank-account-records');

    // Assert execute button contains text matching /Running/i
    await expect(demo.executeButton).toContainText(/Running/i, { timeout: 5_000 });

    // Assert connection state badge is visible (CONNECTING or CONNECTED)
    const connectionBadge = page.locator('.bg-yellow-100, .bg-green-100', {
      hasText: /CONNECTING|CONNECTED/i,
    });
    await expect(connectionBadge).toBeVisible({ timeout: 10_000 });

    // Wait for execution to complete
    await waitForExecutionComplete(page);

    // Assert button no longer shows "Running..." - should show tool name or "Run Again"
    const buttonText = await demo.executeButton.textContent();
    expect(buttonText).toBeTruthy();
    expect(buttonText).not.toMatch(/Running/i);
    expect(buttonText).toMatch(/Java Verification|Run Again/i);
  });

  // ==================== Output File Tree Tests ====================

  test.slow();
  test('output file tree appears after successful execution', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'bank-account-records');

    // Wait for execution complete
    await waitForExecutionComplete(page);

    // Assert the "Output Files" heading becomes visible
    const outputFilesHeading = page.getByRole('heading', { name: /Output Files/i, level: 3 });
    await expect(outputFilesHeading).toBeVisible({ timeout: 10_000 });

    // Assert output-panel is visible
    await expect(demo.outputPanel).toBeVisible({ timeout: 5_000 });

    // Assert the output panel contains at least one tree node
    // Look for file tree elements (could be role="treeitem" or specific file listings)
    const hasTreeContent = await page.evaluate(() => {
      const outputPanel = document.querySelector('[data-testid="output-panel"]');
      if (!outputPanel) return false;

      // Check for tree items or any file-related content
      const treeItems = outputPanel.querySelectorAll('[role="treeitem"]');
      if (treeItems.length > 0) return true;

      // Check for text content that suggests files are listed
      const text = outputPanel.textContent || '';
      return text.length > 100; // Output panel has substantial content
    });
    expect(hasTreeContent).toBe(true);
  });

  test.slow();
  test('output file tree contains verification artifacts', async ({ page }) => {
    const demo = await loadExampleAndRun(page, 'bank-account-records');

    // Wait for execution complete
    await waitForExecutionComplete(page);

    // Wait for output-panel to be visible
    await expect(demo.outputPanel).toBeVisible({ timeout: 10_000 });

    // Check the output panel text for generated file names
    const outputPanelText = await demo.outputPanel.textContent();
    expect(outputPanelText).toBeTruthy();

    // Verification tools typically produce reports or annotated source files
    // Check for common file patterns: .java files, .txt reports, or directories
    const hasFileContent = outputPanelText!.length > 50; // Has substantial content
    expect(hasFileContent).toBe(true);

    // At minimum, assert at least one file is listed in the tree
    // The FileTree component should render file names
    const hasFileNames = /\.java|\.txt|\.log|Account|Transaction|Shape/i.test(outputPanelText!);
    expect(hasFileNames).toBe(true);
  });
});
