import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Demo page
 * Encapsulates interactions with tool execution demo at /demo
 */
export class DemoPage {
  readonly page: Page;
  readonly uploadZone: Locator;
  readonly fileInput: Locator;
  readonly uploadSuccess: Locator;
  readonly executionPanel: Locator;
  readonly executeButton: Locator;
  readonly consoleOutput: Locator;
  readonly outputPanel: Locator;
  readonly downloadButton: Locator;
  readonly shareableLink: Locator;
  readonly backToHome: Locator;
  readonly toolPicker: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadZone = page.getByTestId('upload-zone');
    this.fileInput = page.locator('input[type="file"]');
    this.uploadSuccess = page.getByTestId('upload-success');
    this.executionPanel = page.getByTestId('execution-panel');
    this.executeButton = page.getByTestId('execute-button');
    this.consoleOutput = page.getByTestId('console-output');
    this.outputPanel = page.getByTestId('output-panel');
    this.downloadButton = page.getByTestId('download-button');
    this.shareableLink = page.getByTestId('shareable-link');
    this.backToHome = page.getByTestId('back-to-home');
    this.toolPicker = page.getByTestId('tool-picker');
  }

  /**
   * Navigate to demo page with optional query params
   */
  async goto(params?: string) {
    const url = params ? `/demo?${params}` : '/demo';
    await this.page.goto(url);
  }

  /**
   * Upload a file via hidden file input
   */
  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Wait for upload success indicator
   */
  async waitForUploadSuccess() {
    await this.uploadSuccess.waitFor({ state: 'visible' });
  }

  /**
   * Select a tool by clicking its card
   */
  async selectTool(toolId: string) {
    await this.page.getByTestId(`tool-option-${toolId}`).click();
  }

  /**
   * Click execute button
   */
  async execute() {
    await this.executeButton.click();
  }

  /**
   * Wait for execution to complete (console shows completion message)
   */
  async waitForExecutionComplete() {
    // Wait for console output to contain completion indicators
    await this.page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-output"]');
        if (!consoleElement) return false;
        const text = consoleElement.textContent || '';
        return /completed|exit code/i.test(text);
      },
      { timeout: 30_000 },
    );
  }

  /**
   * Get tool option locator by tool ID
   */
  getToolOption(toolId: string): Locator {
    return this.page.getByTestId(`tool-option-${toolId}`);
  }
}
