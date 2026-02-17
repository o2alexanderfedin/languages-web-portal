import * as fs from 'fs';
import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for upload flow on the /demo page.
 * Encapsulates drag-and-drop and click-to-upload interactions
 * for the UploadZone component.
 */
export class UploadPage {
  readonly page: Page;
  readonly uploadZone: Locator;
  readonly fileInput: Locator;
  readonly uploadStatus: Locator;
  readonly uploadSuccess: Locator;
  readonly uploadError: Locator;
  readonly uploadAnother: Locator;
  readonly tryAgain: Locator;
  readonly executeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadZone = page.getByTestId('upload-zone');
    this.fileInput = page.locator('input[type="file"]');
    this.uploadStatus = page.getByTestId('upload-status');
    this.uploadSuccess = page.getByTestId('upload-success');
    this.uploadError = page.getByTestId('upload-error');
    this.uploadAnother = page
      .getByTestId('upload-success')
      .getByRole('button', { name: /upload another/i });
    this.tryAgain = page
      .getByTestId('upload-error')
      .getByRole('button', { name: /try again/i });
    this.executeButton = page.getByTestId('execute-button');
  }

  /**
   * Navigate to /demo page with optional query params.
   *
   * @param params - Optional query string (e.g., 'tool=java-verification')
   */
  async goto(params?: string): Promise<void> {
    const url = params ? `/demo?${params}` : '/demo';
    await this.page.goto(url);
  }

  /**
   * Upload a file via hidden file input (click-to-upload path).
   *
   * @param filePath - Absolute path to the file to upload
   */
  async uploadFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Wait for upload success indicator to become visible.
   *
   * @param timeout - Maximum wait in milliseconds (default: 10_000)
   */
  async waitForUploadSuccess(timeout = 10_000): Promise<void> {
    await this.uploadSuccess.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for upload error indicator to become visible.
   *
   * @param timeout - Maximum wait in milliseconds (default: 10_000)
   */
  async waitForUploadError(timeout = 10_000): Promise<void> {
    await this.uploadError.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get text content of the upload success element.
   */
  async getSuccessText(): Promise<string> {
    return (await this.uploadSuccess.textContent()) ?? '';
  }

  /**
   * Get text content of the upload error element.
   */
  async getErrorText(): Promise<string> {
    return (await this.uploadError.textContent()) ?? '';
  }

  /**
   * Extract project ID from the success state (font-mono element).
   */
  async getProjectId(): Promise<string> {
    return (await this.uploadSuccess.locator('.font-mono').textContent()) ?? '';
  }

  /**
   * Click the Upload Another button to reset to idle state.
   */
  async clickUploadAnother(): Promise<void> {
    await this.uploadAnother.click();
  }

  /**
   * Click the Try Again button to reset from error state.
   */
  async clickTryAgain(): Promise<void> {
    await this.tryAgain.click();
  }

  /**
   * Simulate drag-and-drop file upload by dispatching drag events on the upload zone.
   *
   * Reads the file from disk and uses DataTransfer to create a drop event,
   * replicating how a user would drag a file from the OS file manager.
   *
   * @param filePath - Absolute path to the file to drag-and-drop
   */
  async dragAndDropFile(filePath: string): Promise<void> {
    const buffer = fs.readFileSync(filePath);
    const dataTransfer = await this.page.evaluateHandle(
      (data) => {
        const dt = new DataTransfer();
        const file = new File([new Uint8Array(data)], 'sample.zip', {
          type: 'application/zip',
        });
        dt.items.add(file);
        return dt;
      },
      [...buffer],
    );
    await this.uploadZone.dispatchEvent('drop', { dataTransfer });
  }
}
