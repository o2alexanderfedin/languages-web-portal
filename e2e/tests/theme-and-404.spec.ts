import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Theme Toggle Persistence and 404 Routing E2E tests.
 *
 * Covers:
 *   EDGE-01 — Theme toggle cycles Light → Dark → System; persists in localStorage,
 *             CSS class on <html>, across navigation, and after hard reload.
 *   EDGE-02 — Unknown routes render "404 - Page Not Found" with zero JS exceptions.
 *
 * No Docker required — these tests navigate UI state only.
 * Theme tests run on Chromium desktop (isMobile skip applied to both describe blocks).
 *
 * ThemeProvider storage key: 'hupyy-theme'
 * Theme toggle button: role=button with name matching /Theme:/i
 * CSS class target: document.documentElement (html element)
 */

/** Click the theme toggle button until its label includes targetLabel (max 3 clicks). */
async function clickToTheme(page: Page, targetLabel: string): Promise<void> {
  for (let i = 0; i < 3; i++) {
    const btn = page.getByRole('button', { name: /Theme:/i });
    const text = await btn.textContent();
    if (text?.includes(targetLabel)) break;
    await btn.click();
  }
}

// ---------------------------------------------------------------------------
// EDGE-01: Theme Toggle Persistence
// ---------------------------------------------------------------------------

test.describe('Theme Toggle Persistence (EDGE-01)', () => {
  test.skip(({ isMobile }) => isMobile, 'Theme tests run on desktop only');

  test('theme toggle button cycles light → dark → system', async ({ page }) => {
    await page.goto('/');

    const btn = page.getByRole('button', { name: /Theme:/i });

    // Starting state is 'system'. First click → 'light'
    await btn.click();
    await expect(btn).toContainText('Light');
    const hasLight = await page.evaluate(
      () => document.documentElement.classList.contains('light'),
    );
    expect(hasLight).toBe(true);

    // Second click → 'dark'
    await btn.click();
    await expect(btn).toContainText('Dark');
    const hasDark = await page.evaluate(
      () => document.documentElement.classList.contains('dark'),
    );
    expect(hasDark).toBe(true);

    // Third click → back to 'system'
    await btn.click();
    await expect(btn).toContainText('System');
  });

  test('selecting light theme persists localStorage key', async ({ page }) => {
    await page.goto('/');

    await clickToTheme(page, 'Light');
    await expect(page.getByRole('button', { name: /Theme:/i })).toContainText('Light');

    const stored = await page.evaluate(() =>
      localStorage.getItem('hupyy-theme'),
    );
    expect(stored).toBe('light');
  });

  test('selecting dark theme applies dark class to html element', async ({ page }) => {
    await page.goto('/');

    await clickToTheme(page, 'Dark');
    await expect(page.getByRole('button', { name: /Theme:/i })).toContainText('Dark');

    const hasDark = await page.evaluate(
      () => document.documentElement.classList.contains('dark'),
    );
    const hasLight = await page.evaluate(
      () => document.documentElement.classList.contains('light'),
    );
    expect(hasDark).toBe(true);
    expect(hasLight).toBe(false);
  });

  test('system mode with dark preference applies dark class to html', async ({ page }) => {
    // Emulate dark OS preference before navigating so ThemeProvider reads it on mount
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await clickToTheme(page, 'System');
    await expect(page.getByRole('button', { name: /Theme:/i })).toContainText('System');

    // Navigate again to trigger a fresh ThemeProvider mount under dark emulation
    await page.goto('/');

    const hasDark = await page.evaluate(
      () => document.documentElement.classList.contains('dark'),
    );
    expect(hasDark).toBe(true);
  });

  test('dark theme persists across Landing → /demo navigation', async ({ page }) => {
    await page.goto('/');

    await clickToTheme(page, 'Dark');
    await expect(page.getByRole('button', { name: /Theme:/i })).toContainText('Dark');

    // Navigate to /demo — ThemeProvider wraps BrowserRouter so it survives route change
    await page.goto('/demo');

    const hasDark = await page.evaluate(
      () => document.documentElement.classList.contains('dark'),
    );
    expect(hasDark).toBe(true);
  });

  test('dark theme persists after hard reload (page.reload())', async ({ page }) => {
    await page.goto('/');

    await clickToTheme(page, 'Dark');
    await expect(page.getByRole('button', { name: /Theme:/i })).toContainText('Dark');

    const storedBefore = await page.evaluate(() =>
      localStorage.getItem('hupyy-theme'),
    );
    expect(storedBefore).toBe('dark');

    await page.reload();

    const hasDark = await page.evaluate(
      () => document.documentElement.classList.contains('dark'),
    );
    expect(hasDark).toBe(true);

    const storedAfter = await page.evaluate(() =>
      localStorage.getItem('hupyy-theme'),
    );
    expect(storedAfter).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// EDGE-02: 404 Routing
// ---------------------------------------------------------------------------

test.describe('404 Routing (EDGE-02)', () => {
  test.skip(({ isMobile }) => isMobile, '404 tests run on desktop only');

  test('/nonexistent route renders 404 page content', async ({ page }) => {
    // Capture JS exceptions — 404 page must be exception-free
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/nonexistent');

    await expect(page.getByText('404 - Page Not Found')).toBeVisible({ timeout: 10_000 });
    expect(pageErrors).toHaveLength(0);
  });

  test('/totally-invalid-path also renders 404', async ({ page }) => {
    await page.goto('/totally-invalid-path');

    await expect(page.getByText('404 - Page Not Found')).toBeVisible({ timeout: 10_000 });
  });

  test('404 page HTTP response check', async ({ page }) => {
    // NOTE: React SPA served via Vite dev server uses a wildcard HTML fallback,
    // so the HTTP status code may be 200 even for unknown routes (SPA catch-all).
    // Docker Nginx may also serve the index.html with a 200 for all paths.
    // Therefore we assert rendered content, NOT HTTP status, for cross-env portability.
    const response = await page.request.get('/nonexistent');

    // The response body should include the 404 text rendered by React Router's wildcard
    // route: <Route path="*" element={<div>404 - Page Not Found</div>} />
    // We verify the page content is loaded correctly by navigating through the browser.
    await page.goto('/nonexistent');
    await expect(page.getByText('404 - Page Not Found')).toBeVisible({ timeout: 10_000 });

    // response.ok() is intentionally not asserted — see note above.
    // The response variable confirms the server returned a response (not a network error).
    expect(response.status()).toBeGreaterThan(0);
  });
});
