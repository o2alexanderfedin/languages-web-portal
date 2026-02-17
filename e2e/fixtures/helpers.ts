import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { type Page } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Absolute path to the sample ZIP file used for upload tests.
 * Resolves from fixtures/test-files/sample.zip relative to this helpers file.
 */
export const SAMPLE_ZIP_PATH = path.resolve(
  __dirname,
  'test-files/sample.zip',
);

/**
 * Wait for execution to complete by polling the console output element.
 * Resolves when the console text contains "completed" or "exit code".
 *
 * @param page - Playwright Page instance
 * @param timeout - Maximum wait time in milliseconds (default: 180_000)
 */
export async function waitForExecutionComplete(
  page: Page,
  timeout = 180_000,
): Promise<void> {
  await page.waitForFunction(
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
 * Navigate to the demo page with java-verification pre-selected,
 * load the specified example, and click execute.
 *
 * @param page - Playwright Page instance
 * @param exampleName - Name of the example to load (e.g., 'bank-account-records')
 * @returns DemoPage instance for subsequent assertions
 */
export async function loadExampleAndExecute(
  page: Page,
  exampleName: string,
): Promise<DemoPage> {
  await page.goto('/demo?tool=java-verification');
  const demo = new DemoPage(page);
  await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });
  await demo.loadExample(exampleName);
  await demo.execute();
  return demo;
}

/**
 * Create a temporary file in the test-results/temp directory.
 *
 * @param filename - Name of the temporary file
 * @param content - Content to write to the file
 * @returns Absolute path to the created file
 */
export function createTempFile(filename: string, content: string): string {
  const tmpDir = path.resolve(__dirname, '../../test-results/temp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Remove a temporary file if it exists.
 *
 * @param filePath - Absolute path to the file to remove
 */
export function cleanupTempFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
