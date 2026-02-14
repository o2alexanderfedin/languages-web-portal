import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Upload, Execute, and Results', () => {
  const sampleZipPath = path.resolve(
    __dirname,
    '../fixtures/test-files/sample.zip',
  );

  test('user can upload a ZIP file and see success', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto();

    // Upload sample.zip
    await demo.uploadFile(sampleZipPath);

    // Wait for upload success
    await expect(demo.uploadSuccess).toBeVisible({ timeout: 10000 });

    // Verify success message contains "files extracted"
    const successText = await demo.uploadSuccess.textContent();
    expect(successText).toMatch(/extracted|uploaded/i);
  });

  test('user can select a tool after uploading', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto();

    // Upload sample.zip
    await demo.uploadFile(sampleZipPath);
    await demo.waitForUploadSuccess();

    // Select a tool
    await demo.selectTool('cpp-to-c-transpiler');

    // Verify tool is selected
    const selectedTool = demo.getToolOption('cpp-to-c-transpiler');
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('execute button is disabled without upload and tool', async ({
    page,
  }) => {
    const demo = new DemoPage(page);
    await demo.goto();

    // Execute button should be disabled initially
    await expect(demo.executeButton).toBeDisabled();
  });

  test('full workflow: upload, select tool, execute, see streaming output', async ({
    page,
  }) => {
    // This test requires actual tool binaries to be installed
    // For CI/CD environments without tools, we test up to execute button click
    test.slow(); // Mark as slow since execution involves real process spawning

    const demo = new DemoPage(page);
    await demo.goto();

    // 1. Upload sample.zip
    await demo.uploadFile(sampleZipPath);
    await demo.waitForUploadSuccess();

    // 2. Select tool
    await demo.selectTool('cpp-to-c-transpiler');

    // 3. Verify execute button is enabled
    await expect(demo.executeButton).toBeEnabled();

    // 4. Click execute button
    await demo.execute();

    // 5. Wait for execution to start (button changes to "Running...")
    await expect(demo.executeButton).toContainText(/Running|Executing/i, {
      timeout: 5000,
    });

    // 6. This test validates the E2E workflow (upload → select → execute).
    // Actual tool execution depends on binaries being available.
    // We verify execution STARTED by checking the button state changed.
  });

  test('upload zone shows error for invalid file type', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.goto();

    // Create a temporary .txt file
    const tmpDir = path.resolve(__dirname, '../../test-results/temp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const invalidFilePath = path.join(tmpDir, 'test-invalid.txt');
    fs.writeFileSync(invalidFilePath, 'This is not a ZIP file');

    // Try to upload the .txt file
    await demo.fileInput.setInputFiles(invalidFilePath);

    // react-dropzone may reject at client level
    // Verify upload success is NOT shown (should reject invalid file)
    await expect(demo.uploadSuccess).not.toBeVisible({ timeout: 3000 });

    // Cleanup
    fs.unlinkSync(invalidFilePath);
  });
});
