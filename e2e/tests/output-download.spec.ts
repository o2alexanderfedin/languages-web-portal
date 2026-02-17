import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { OutputPage } from '../pages/OutputPage';

/**
 * Output download and empty-state E2E tests.
 *
 * These tests cover:
 *   OUTP-03 — ZIP download button triggers a file download
 *   OUTP-04 — Empty output state message when no files generated
 *
 * OUTP-03: Docker serial (real execution needed for download link).
 * OUTP-04: No Docker — uses page.route() to intercept the file-tree API and return empty data.
 */

test.describe('Output ZIP Download', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  test.skip(({ isMobile }) => isMobile, 'Output tests run on desktop only');

  test('Download Output ZIP button triggers file download', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    // Ensure output panel and download button are visible
    await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });
    await expect(output.downloadButton).toBeVisible({ timeout: 5_000 });

    // OUTP-03: Playwright captures the download event
    // DownloadButton is an <a download="..."> element — clicking starts a download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      output.downloadButton.click(),
    ]);

    // Download must resolve a filename (e.g., <projectId>-output.zip)
    expect(download.suggestedFilename()).toMatch(/\.zip$/i);
  });

  test('Download button href points to /api/projects/{id}/download', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');
    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.waitForExecutionComplete();

    await expect(output.downloadButton).toBeVisible({ timeout: 10_000 });

    // Verify the href contains the download API path
    const href = await output.downloadButton.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/\/api\/projects\/.+\/download/);
  });
});

test.describe('Output Empty State', () => {
  test.skip(({ isMobile }) => isMobile, 'Output tests run on desktop only');

  test('empty output state shows "No output files generated" message', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');

    // Intercept the file-tree API to return an empty tree BEFORE executing.
    // OutputPanel calls useGetFileTreeQuery(projectId) which hits:
    //   GET /api/projects/{projectId}/file-tree
    // We intercept it to return { data: { tree: {} } } — an empty tree.
    await page.route('**/file-tree**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { tree: {} } }),
      }),
    );

    // Also intercept the execute endpoint so we can load the output panel
    // without running a full Docker execution.
    await page.route('**/execute**', async (route) => {
      // Simulate an immediate SSE response that marks execution complete.
      // The OutputPanel renders when projectId is available from the execution result.
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"type":"complete","exitCode":0,"projectId":"test-empty-project"}\n\n',
      });
    });

    await exec.loadExample('bank-account-records');
    await exec.execute();

    // Wait for the execution to appear to complete via the intercepted SSE
    await exec.consoleOutput.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null);

    // OUTP-04: The empty state message must appear somewhere on the page
    // OutputPanel renders: <p className="text-muted-foreground">No output files generated</p>
    await expect(output.emptyStateMessage).toBeVisible({ timeout: 15_000 });
  });

  test('empty output state does not show download button', async ({ page }) => {
    const exec = new ExecutionPage(page);
    const output = new OutputPage(page);

    await exec.goto('tool=java-verification');

    // Intercept file-tree to return empty
    await page.route('**/file-tree**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { tree: {} } }),
      }),
    );

    await page.route('**/execute**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"type":"complete","exitCode":0,"projectId":"test-empty-project"}\n\n',
      });
    });

    await exec.loadExample('bank-account-records');
    await exec.execute();
    await exec.consoleOutput.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null);

    // When no files, OutputPanel renders the empty-state div (not the output-panel testid div)
    // The download button must NOT be visible
    await expect(output.emptyStateMessage).toBeVisible({ timeout: 15_000 });
    await expect(output.downloadButton).not.toBeVisible();
  });
});
