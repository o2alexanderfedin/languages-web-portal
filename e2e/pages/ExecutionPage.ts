import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the execution panel on the /demo page.
 * Encapsulates all execution-panel locators and action methods,
 * covering SSE streaming output, progress indicators, and output file tree.
 */
export class ExecutionPage {
  readonly page: Page;

  /** Root execution panel element */
  readonly executionPanel: Locator;

  /** Execute / Run button (shows "Running..." during execution) */
  readonly executeButton: Locator;

  /** Console output element that receives streamed SSE text */
  readonly consoleOutput: Locator;

  /** Output panel showing the generated file tree after execution */
  readonly outputPanel: Locator;

  /** Tool picker component */
  readonly toolPicker: Locator;

  /** Example selector container */
  readonly exampleSelector: Locator;

  /** Dropdown used to select a named example */
  readonly exampleDropdown: Locator;

  /** Button that loads the selected example into the editor */
  readonly loadExampleButton: Locator;

  /**
   * Connection state badge — visible as CONNECTING or CONNECTED
   * during active SSE streaming.
   */
  readonly connectionBadge: Locator;

  /**
   * Status badge — visible with COMPLETED text once execution finishes
   * successfully.
   */
  readonly statusBadge: Locator;

  /** Status badge — visible with FAILED text once execution finishes with non-zero exit code */
  readonly failedStatusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.executionPanel = page.getByTestId('execution-panel');
    this.executeButton = page.getByTestId('execute-button');
    this.consoleOutput = page.getByTestId('console-output');
    this.outputPanel = page.getByTestId('output-panel');
    this.toolPicker = page.getByTestId('tool-picker');
    this.exampleSelector = page.getByTestId('example-selector');
    this.exampleDropdown = page.getByTestId('example-dropdown');
    this.loadExampleButton = page.getByTestId('load-example-button');
    this.connectionBadge = page
      .locator('.bg-yellow-100, .bg-green-100')
      .filter({ hasText: /CONNECTING|CONNECTED/i });
    this.statusBadge = page
      .locator('.bg-green-100.text-green-800, .dark\\:bg-green-900')
      .filter({ hasText: /COMPLETED/i });
    this.failedStatusBadge = page
      .locator('.bg-red-100.text-red-800, .dark\\:bg-red-900')
      .filter({ hasText: /FAILED/i });
  }

  /**
   * Navigate to the /demo page with optional query string.
   *
   * @param params - Optional query string (e.g., 'tool=java-verification')
   */
  async goto(params?: string): Promise<void> {
    const url = params ? `/demo?${params}` : '/demo';
    await this.page.goto(url);
  }

  /**
   * Select a tool by clicking its tool-option card.
   *
   * @param toolId - Tool identifier (e.g., 'java-verification')
   */
  async selectTool(toolId: string): Promise<void> {
    await this.page.getByTestId(`tool-option-${toolId}`).click();
  }

  /**
   * Select an example from the example dropdown by its visible label.
   *
   * @param exampleName - The option label to select (e.g., 'bank-account-records')
   */
  async selectExample(exampleName: string): Promise<void> {
    await this.exampleDropdown.selectOption({ label: exampleName });
  }

  /**
   * Select the named example in the dropdown, click Load, and wait until
   * the execute button becomes enabled (indicating the example is ready).
   *
   * @param exampleName - The option label to load (e.g., 'bank-account-records')
   * @param timeout - Maximum wait for execute button to become enabled (default: 10_000 ms)
   */
  async loadExample(exampleName: string, timeout = 10_000): Promise<void> {
    await this.selectExample(exampleName);
    await this.loadExampleButton.click();
    await this.executeButton.waitFor({ state: 'visible', timeout });
    await expect(this.executeButton).toBeEnabled({ timeout });
  }

  /**
   * Click the execute button to start a tool run.
   */
  async execute(): Promise<void> {
    await this.executeButton.click();
  }

  /**
   * Poll the console-output element until its text contains "completed" or
   * "exit code", indicating that the Docker execution has finished.
   *
   * @param timeout - Maximum wait in milliseconds (default: 180_000)
   */
  async waitForExecutionComplete(timeout = 180_000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="console-output"]');
        if (!el) return false;
        const text = el.textContent || '';
        return /completed|exit code/i.test(text);
      },
      { timeout },
    );
  }

  /**
   * Return the current text content of the console output element.
   *
   * @returns Console text or empty string if element has no content
   */
  async getConsoleText(): Promise<string> {
    return (await this.consoleOutput.textContent()) ?? '';
  }

  /**
   * Determine whether the console output element is scrolled to the bottom.
   * Uses a 10 px tolerance to account for sub-pixel rounding.
   *
   * @returns true if scrollTop + clientHeight >= scrollHeight - 10
   */
  async isScrolledToBottom(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.querySelector('[data-testid="console-output"]');
      if (!el) return false;
      const { scrollTop, scrollHeight, clientHeight } = el as HTMLElement;
      return scrollTop + clientHeight >= scrollHeight - 10;
    });
  }
}
