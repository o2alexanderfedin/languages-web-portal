import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { type Page } from '@playwright/test';

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
 * Absolute path to an invalid plain-text file (not a ZIP).
 * Used to verify that UploadZone rejects non-ZIP files.
 */
export const INVALID_TXT_PATH = path.resolve(
  __dirname,
  'test-files/invalid.txt',
);

/**
 * Absolute path to a fake JPEG file (wrong MIME type for upload).
 * Used to verify that UploadZone rejects image files.
 */
export const INVALID_JPG_PATH = path.resolve(
  __dirname,
  'test-files/invalid.jpg',
);

/**
 * Absolute path to a valid but empty ZIP archive.
 * Used to verify handling of ZIPs containing no entries.
 */
export const EMPTY_ZIP_PATH = path.resolve(
  __dirname,
  'test-files/empty.zip',
);

/**
 * Absolute path to a file with ZIP content but no .zip extension.
 * Used to verify extension-based validation behaviour.
 */
export const NO_EXTENSION_PATH = path.resolve(
  __dirname,
  'test-files/no-extension',
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

/**
 * Create a temporary file filled with zero bytes of the specified size.
 * Useful for simulating oversized uploads without committing large files.
 *
 * The file is created inside test-results/temp and its path is returned.
 * Call cleanupTempFile() after the test to avoid accumulating large files.
 *
 * @param sizeBytes - Size of the file in bytes
 * @returns Absolute path to the created temporary file
 */
export function createOversizedFile(sizeBytes: number): string {
  const tmpDir = path.resolve(__dirname, '../../test-results/temp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, `oversized-${sizeBytes}.zip`);
  const buffer = Buffer.alloc(sizeBytes, 0);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}
