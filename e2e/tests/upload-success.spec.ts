import { test, expect } from '@playwright/test';
import { UploadPage } from '../pages/UploadPage';
import { SAMPLE_ZIP_PATH } from '../fixtures/helpers';

test.describe('Upload Success Flow', () => {
  test('user can upload ZIP file via click-to-browse and see success indicator', async ({
    page,
  }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();

    const successText = await uploadPage.getSuccessText();
    expect(successText).toMatch(/files extracted/i);

    const projectId = await uploadPage.getProjectId();
    expect(projectId).toBeTruthy();

    await expect(uploadPage.executeButton).toBeEnabled();
  });

  test('upload success shows project ID in monospace font', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();

    const projectIdLocator = uploadPage.uploadSuccess.locator('.font-mono');
    await expect(projectIdLocator).toBeVisible();

    const projectId = await projectIdLocator.textContent();
    expect(projectId).toBeTruthy();
    expect(projectId!.trim()).toMatch(/^[a-f0-9-]+$/);
  });

  test('drag-and-drop upload works on desktop viewports', async ({ page }) => {
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) {
      test.skip();
    }

    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    await uploadPage.dragAndDropFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();

    const successText = await uploadPage.getSuccessText();
    expect(successText).toMatch(/files extracted/i);
  });

  test('mobile/tablet uses click-to-upload successfully', async ({ page }) => {
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 1024) {
      test.skip();
    }

    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();

    const successText = await uploadPage.getSuccessText();
    expect(successText).toMatch(/files extracted/i);
  });

  test('upload API request is intercepted and returns expected response', async ({
    page,
  }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/upload') && resp.status() === 200,
    );

    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);

    const response = await responsePromise;
    const data = await response.json() as {
      projectId?: string;
      fileCount?: number;
      message?: string;
    };

    expect(data.projectId).toBeTruthy();
    expect(typeof data.fileCount).toBe('number');
    expect(data.fileCount).toBeGreaterThan(0);
    expect(data.message).toMatch(/successful/i);
  });

  test('file replacement: upload file A then upload file B replaces A', async ({
    page,
  }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    // Upload first file and capture project ID
    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();
    const firstId = (await uploadPage.getProjectId()).trim();

    // Reset to idle state
    await uploadPage.clickUploadAnother();
    await expect(uploadPage.uploadStatus).toBeVisible();
    await expect(uploadPage.uploadSuccess).not.toBeVisible();

    // Upload second file and capture project ID
    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();
    const secondId = (await uploadPage.getProjectId()).trim();

    // Each upload should receive a distinct project ID
    expect(secondId).not.toEqual(firstId);
  });

  test('Upload Another button resets to idle state', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto('tool=java-verification');

    await uploadPage.uploadFile(SAMPLE_ZIP_PATH);
    await uploadPage.waitForUploadSuccess();

    await uploadPage.clickUploadAnother();

    await expect(uploadPage.uploadStatus).toBeVisible();
    await expect(uploadPage.uploadSuccess).not.toBeVisible();
    await expect(uploadPage.uploadError).not.toBeVisible();
  });
});
