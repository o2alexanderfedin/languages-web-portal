import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration with cross-browser, cross-device testing.
 *
 * Project naming convention: {viewport}-{browser}
 *   - viewport: desktop (1280x720), tablet (768x1024), mobile (375x812)
 *   - browser: chromium, firefox, webkit
 *
 * Docker targeting:
 *   Set E2E_BASE_URL to test against a running target server (Docker container
 *   or manually started dev server). E2E_BASE_URL is required — tests will abort
 *   if it is not set.
 *
 * See https://playwright.dev/docs/test-configuration.
 */

// Docker guard — abort immediately if E2E_BASE_URL is not set.
// All e2e tests require a running target server (Docker production container or
// local dev server started manually). Set the env var before running tests:
//   export E2E_BASE_URL=http://localhost:3000
if (!process.env.E2E_BASE_URL) {
  throw new Error(
    'E2E_BASE_URL is not set. Tests require a running target server.\n' +
      'Start the target server and then run:\n' +
      '  export E2E_BASE_URL=http://localhost:3000',
  );
}

export default defineConfig({
  testDir: './e2e/tests',
  /* Archive directory — files here are preserved for reference but excluded from the default test run. */
  testIgnore: ['**/e2e/archive/**'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture screenshot only on failure */
    screenshot: 'only-on-failure',
  },

  // POM contract: all test interactions with page UI must go through Page Object Models
  // in e2e/pages/. Never use raw page.locator() or page.getByTestId() in spec files.
  projects: [
    // --- Desktop (1280x720) ---
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'desktop-webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // --- Tablet (768x1024) ---
    {
      name: 'tablet-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        isMobile: false,
      },
    },
    {
      name: 'tablet-firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 768, height: 1024 },
        isMobile: false,
      },
    },
    {
      name: 'tablet-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 768, height: 1024 },
        isMobile: false,
      },
    },

    // --- Mobile (375x812) ---
    {
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone 13 Pro'],
        browserName: 'chromium',
      },
    },
    {
      name: 'mobile-firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 375, height: 812 },
        // Note: Firefox doesn't support isMobile option, using viewport-only emulation
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 13 Pro'],
      },
    },
  ],

});
