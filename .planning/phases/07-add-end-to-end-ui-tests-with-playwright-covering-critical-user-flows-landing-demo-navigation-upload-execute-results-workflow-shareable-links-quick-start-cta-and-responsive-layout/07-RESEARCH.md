# Phase 07: Add End-to-End UI Tests with Playwright - Research

**Researched:** 2026-02-13
**Domain:** End-to-end testing with Playwright for React/Vite applications
**Confidence:** HIGH

## Summary

Playwright is the recommended E2E testing framework for modern web applications in 2026. It provides comprehensive browser automation across Chromium, Firefox, and WebKit with built-in test runner, fixtures, and assertions. For this phase, Playwright will test critical user flows: landing page navigation, file upload via react-dropzone, execution with SSE streaming, file downloads, shareable links via URL parameters, and responsive layouts.

The project already uses Vitest + @testing-library/react for unit/component tests. Playwright should be added as a separate E2E test suite with its own configuration, running alongside existing tests but not replacing them. The recommended approach uses `@playwright/test` (test runner) rather than the library, as it provides superior infrastructure including parallelization, reporting, retries, and tracing.

**Primary recommendation:** Install Playwright using `npm init playwright@latest`, organize tests in an `e2e/` directory with Page Object Model pattern, use `data-testid` attributes for stable selectors, and integrate with GitHub Actions for CI/CD. Keep E2E tests focused on 3-5 critical user flows rather than comprehensive coverage.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | latest (1.50+) | E2E test runner and framework | Official Playwright test runner with built-in fixtures, assertions, and tooling. Recommended over using playwright library directly |
| playwright | latest (1.50+) | Browser automation engine | Automatically installed as dependency of @playwright/test. Provides cross-browser support (Chromium, Firefox, WebKit) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | latest | Test execution in CI | Already included; provides headless browser testing for GitHub Actions |
| dotenv | ^16.4.7 | Environment configuration | Already in project; use for E2E test environment variables (base URL, timeouts) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @playwright/test | Cypress | Cypress has better DX for debugging but doesn't support true multi-browser testing and has limitations with iframes and multiple tabs |
| @playwright/test | Selenium WebDriver | Selenium is more mature but slower, more complex to configure, and lacks modern features like auto-wait and network interception |
| @playwright/test | Playwright library only | Library requires manual browser management; test runner provides fixtures, parallelization, reporting, and Web-First assertions built-in |

**Installation:**
```bash
# From monorepo root
npm init playwright@latest

# Or manual installation
npm install -D @playwright/test
npx playwright install --with-deps
```

## Architecture Patterns

### Recommended Project Structure
```
languages-web-portal/
├── e2e/                           # E2E tests (separate from unit tests)
│   ├── fixtures/                  # Custom fixtures and test data
│   │   ├── test-files/           # Sample .cpp files for upload testing
│   │   └── authenticated.ts      # Fixture extensions (if auth needed)
│   ├── pages/                     # Page Object Models
│   │   ├── LandingPage.ts        # Landing page POM
│   │   ├── DemoPage.ts           # Demo page (Home) POM
│   │   └── components/           # Reusable component POMs
│   │       ├── ToolPicker.ts
│   │       ├── UploadZone.ts
│   │       └── OutputPanel.ts
│   ├── tests/                     # Test specifications
│   │   ├── landing.spec.ts       # Landing page tests
│   │   ├── navigation.spec.ts    # Cross-page navigation
│   │   ├── upload-execute.spec.ts # Upload → execute → results flow
│   │   ├── shareable-links.spec.ts # URL parameter tests
│   │   └── responsive.spec.ts    # Viewport/responsive tests
│   └── utils/                     # Test helpers
│       └── test-helpers.ts       # Common utility functions
├── playwright.config.ts           # Playwright configuration
├── .github/
│   └── workflows/
│       └── playwright.yml         # CI workflow for E2E tests
└── package.json
```

### Pattern 1: Page Object Model (POM)
**What:** Encapsulate page-specific selectors and interactions in reusable classes. Each page object represents a page or major component.

**When to use:** Always for E2E tests in Playwright. POM improves maintainability, reusability, and test readability.

**Example:**
```typescript
// Source: https://playwright.dev/docs/pom
// e2e/pages/DemoPage.ts
import { Page, Locator } from '@playwright/test';

export class DemoPage {
  readonly page: Page;
  readonly toolPicker: Locator;
  readonly uploadZone: Locator;
  readonly executeButton: Locator;
  readonly consoleOutput: Locator;
  readonly downloadButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Prefer data-testid for stability
    this.toolPicker = page.getByTestId('tool-picker');
    this.uploadZone = page.getByTestId('upload-zone');
    this.executeButton = page.getByRole('button', { name: /execute/i });
    this.consoleOutput = page.getByTestId('console-output');
    this.downloadButton = page.getByRole('button', { name: /download/i });
  }

  async goto() {
    await this.page.goto('/demo');
  }

  async selectTool(toolId: string) {
    await this.toolPicker.selectOption(toolId);
  }

  async uploadFile(filePath: string) {
    const fileInput = this.uploadZone.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async executeAndWaitForCompletion() {
    await this.executeButton.click();
    // Wait for console to show completion message
    await this.consoleOutput.getByText(/completed/i).waitFor();
  }

  async downloadResults() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.click();
    return await downloadPromise;
  }
}
```

### Pattern 2: Locator Strategy - User-Facing Priority
**What:** Prioritize locators that reflect how users perceive the page, not implementation details.

**When to use:** Always. Follow this priority order for selecting elements.

**Example:**
```typescript
// Source: https://playwright.dev/docs/locators
// Priority order (best to worst):
// 1. Role-based (accessibility)
await page.getByRole('button', { name: /execute/i });
await page.getByRole('heading', { name: /formal verification/i });

// 2. Label-based (forms)
await page.getByLabel('Upload your code');

// 3. Placeholder (inputs without labels)
await page.getByPlaceholder('Enter file name');

// 4. Text content (non-interactive)
await page.getByText(/built by hapyy/i);

// 5. Test ID (when UI is dynamic) - RECOMMENDED for this app
await page.getByTestId('upload-zone');
await page.getByTestId('tool-picker');

// 6. CSS/XPath - AVOID unless absolutely necessary
// await page.locator('#tsf > div:nth-child(2)'); // ❌ Fragile!
```

### Pattern 3: Test Isolation with beforeEach
**What:** Each test should run independently with clean state. Use `beforeEach` to navigate and set up common state.

**When to use:** Always for E2E tests to prevent cross-test pollution.

**Example:**
```typescript
// Source: https://playwright.dev/docs/best-practices
import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';

test.describe('Upload and Execute Workflow', () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page);
    await demoPage.goto();
    // Each test starts with fresh page load
  });

  test('uploads file and executes successfully', async () => {
    await demoPage.selectTool('cpp-to-c-transpiler');
    await demoPage.uploadFile('./e2e/fixtures/test-files/sample.cpp');
    await demoPage.executeAndWaitForCompletion();

    await expect(demoPage.consoleOutput).toContainText('Execution completed');
  });

  test('shows error for invalid file', async () => {
    await demoPage.selectTool('cpp-to-c-transpiler');
    await demoPage.uploadFile('./e2e/fixtures/test-files/invalid.txt');

    await expect(demoPage.page.getByText(/invalid file type/i)).toBeVisible();
  });
});
```

### Pattern 4: File Upload with react-dropzone
**What:** Use `setInputFiles()` on the hidden file input element. Playwright can interact with hidden inputs without unhiding them.

**When to use:** Testing file uploads with react-dropzone or similar drag-drop components.

**Example:**
```typescript
// Source: https://github.com/react-dropzone/react-dropzone/discussions/1339
// For react-dropzone, locate the hidden input and use setInputFiles
async uploadFile(filePath: string) {
  // react-dropzone creates a hidden input[type="file"]
  const fileInput = this.page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);

  // Alternatively, if multiple dropzones exist:
  const uploadZone = this.page.getByTestId('upload-zone');
  const fileInput = uploadZone.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

// For drag-and-drop simulation (if needed):
// Note: Built-in dragTo() may not work with react-dropzone
// Use dispatchEvent for framework-based drag implementations
async dragAndDropFile(filePath: string) {
  const dropZone = this.page.getByTestId('upload-zone');

  // Create DataTransfer with file
  const buffer = await fs.promises.readFile(filePath);
  const dataTransfer = await this.page.evaluateHandle((data) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(data)], 'sample.cpp', { type: 'text/x-c++src' });
    dt.items.add(file);
    return dt;
  }, Array.from(buffer));

  await dropZone.dispatchEvent('drop', { dataTransfer });
}
```

### Pattern 5: Testing Server-Sent Events (SSE)
**What:** Monitor network responses and use page event listeners to verify SSE streaming data.

**When to use:** Testing real-time console output during execution.

**Example:**
```typescript
// Source: https://playwright.dev/docs/network and https://dzone.com/articles/playwright-for-real-time-applications-testing-webs
// Approach 1: Monitor specific response (preferred)
test('streams execution output via SSE', async ({ page }) => {
  const demoPage = new DemoPage(page);
  await demoPage.goto();
  await demoPage.selectTool('cpp-to-c-transpiler');
  await demoPage.uploadFile('./e2e/fixtures/test-files/sample.cpp');

  // Wait for SSE endpoint to be called
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/stream/') && response.status() === 200
  );

  await demoPage.executeButton.click();
  const response = await responsePromise;

  // Verify SSE response headers
  expect(response.headers()['content-type']).toContain('text/event-stream');

  // Wait for console to show streamed content
  await expect(demoPage.consoleOutput).toContainText('Processing');
  await expect(demoPage.consoleOutput).toContainText('Execution completed');
});

// Approach 2: Monitor all SSE events (for debugging)
test('captures all SSE messages', async ({ page }) => {
  const sseMessages: string[] = [];

  page.on('response', async (response) => {
    if (response.url().includes('/api/stream/') &&
        response.headers()['content-type']?.includes('text/event-stream')) {
      // SSE response detected - UI will handle parsing
      console.log('SSE connection established');
    }
  });

  // Test proceeds as normal - verify UI updates
  const demoPage = new DemoPage(page);
  await demoPage.goto();
  // ... rest of test
});
```

### Pattern 6: Testing File Downloads
**What:** Use `page.waitForEvent('download')` before clicking download button, then verify filename and save for inspection.

**When to use:** Testing download functionality for results.

**Example:**
```typescript
// Source: https://playwright.dev/docs/downloads
test('downloads results as zip file', async ({ page }) => {
  const demoPage = new DemoPage(page);
  await demoPage.goto();
  await demoPage.selectTool('cpp-to-c-transpiler');
  await demoPage.uploadFile('./e2e/fixtures/test-files/sample.cpp');
  await demoPage.executeAndWaitForCompletion();

  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await demoPage.downloadButton.click();
  const download = await downloadPromise;

  // Verify suggested filename
  expect(download.suggestedFilename()).toMatch(/\.zip$/);

  // Save to verify contents (optional)
  const path = await download.path();
  expect(path).toBeTruthy();

  // Or save to specific location for inspection
  await download.saveAs('./test-results/downloaded-results.zip');
});
```

### Pattern 7: Responsive/Viewport Testing
**What:** Use multiple projects in playwright.config.ts to test different viewports, or use `page.setViewportSize()` in individual tests.

**When to use:** Testing responsive layouts for mobile vs desktop.

**Example:**
```typescript
// Source: https://playwright.dev/docs/emulation
// Approach 1: Configure projects in playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13 Pro'] },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
});

// Approach 2: Set viewport in test
test('shows mobile layout on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Verify mobile menu is visible
  await expect(page.getByTestId('mobile-menu')).toBeVisible();

  // Verify desktop menu is hidden
  await expect(page.getByTestId('desktop-menu')).not.toBeVisible();
});

test('shows desktop layout on large screens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  await expect(page.getByTestId('desktop-menu')).toBeVisible();
  await expect(page.getByTestId('mobile-menu')).not.toBeVisible();
});
```

### Pattern 8: Testing URL Parameters (Shareable Links)
**What:** Navigate with query parameters and verify component state reflects URL params.

**When to use:** Testing shareable links functionality (tool pre-selection via URL).

**Example:**
```typescript
test('pre-selects tool from URL parameter', async ({ page }) => {
  await page.goto('/demo?tool=cpp-to-c-transpiler');

  // Verify tool picker shows correct selection
  const toolPicker = page.getByTestId('tool-picker');
  await expect(toolPicker).toHaveValue('cpp-to-c-transpiler');

  // Verify tool name is displayed
  await expect(page.getByText(/C\+\+ to C Transpiler/i)).toBeVisible();
});

test('handles quickstart parameter', async ({ page }) => {
  await page.goto('/demo?tool=cpp-to-c-transpiler&quickstart=true');

  // Verify quickstart modal or help panel is visible
  await expect(page.getByTestId('quickstart-panel')).toBeVisible();
});

test('handles invalid tool parameter gracefully', async ({ page }) => {
  await page.goto('/demo?tool=invalid-tool-id');

  // Should default to first available tool or show error
  const toolPicker = page.getByTestId('tool-picker');
  const value = await toolPicker.inputValue();
  expect(value).toBeTruthy(); // Should have some valid tool selected
});
```

### Anti-Patterns to Avoid
- **Don't use CSS nth-child selectors:** They break when DOM structure changes. Use semantic locators instead.
- **Don't test third-party APIs directly:** Mock external services or skip network calls you don't control.
- **Don't use sleep() or fixed delays:** Use Playwright's auto-waiting and explicit waits like `waitFor()`.
- **Don't test everything end-to-end:** Focus on critical user flows. Use unit/component tests for comprehensive coverage.
- **Don't share state between tests:** Each test should be independent. Use `beforeEach` for setup.
- **Don't use `isVisible()` for assertions:** Use `expect(locator).toBeVisible()` which auto-waits and retries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser automation | Custom Selenium wrapper | @playwright/test | Playwright provides auto-waiting, network interception, screenshots, traces, and parallel execution built-in. Selenium requires manual waits and lacks modern features. |
| Page Object pattern | Ad-hoc locator management | Playwright POM with typed classes | POMs centralize selectors, improve maintainability, enable TypeScript autocomplete, and make tests self-documenting. |
| File upload testing | Simulating OS dialogs | `setInputFiles()` | Playwright injects files before the OS dialog appears. No need to interact with system dialogs or use AutoIT/Sikuli. |
| Wait strategies | Custom sleep/poll functions | Playwright auto-waiting + Web-First assertions | Every Playwright action auto-waits for actionability (visible, enabled, stable). Assertions auto-retry until condition met or timeout. |
| Screenshot/video capture | Custom screenshot logic | Built-in `screenshot: 'on'` config | Playwright automatically captures screenshots on failure and can record videos of entire test runs with zero custom code. |
| Network mocking | Custom proxy/stub server | `page.route()` and `page.unroute()` | Playwright intercepts network requests at the browser level, allowing modification, blocking, or mocking without external tools. |
| Test reports | Custom HTML report generator | Built-in HTML reporter | Playwright generates rich HTML reports with traces, screenshots, and filtering capabilities out of the box. |
| Parallel execution | Custom test sharding | Playwright's built-in parallelization | Playwright runs tests in parallel by default within files and supports sharding across multiple machines with `--shard` flag. |

**Key insight:** Playwright is a complete testing framework, not just a browser automation library. It includes test runner, fixtures, assertions, reporters, and debugging tools. Don't reinvent these capabilities.

## Common Pitfalls

### Pitfall 1: Using Fragile CSS Selectors
**What goes wrong:** Tests use deep CSS chains like `.container > div:nth-child(2) > button` which break when HTML structure changes.

**Why it happens:** Developers copy selectors from browser DevTools without considering maintainability.

**How to avoid:** Prioritize user-facing locators (role, label, text) and add `data-testid` attributes for dynamic UI elements. Never use nth-child or complex CSS paths.

**Warning signs:** Test failures after minor UI changes that don't affect functionality. Selectors with `>`, `:nth-child()`, or deeply nested paths.

### Pitfall 2: Not Waiting for Network/SSE Responses
**What goes wrong:** Test clicks execute button and immediately checks for output, but SSE streaming hasn't started yet, causing flaky failures.

**Why it happens:** Assuming actions complete synchronously when they involve network requests.

**How to avoid:** Use `page.waitForResponse()` to wait for specific API calls, or use Web-First assertions like `expect(locator).toContainText()` which auto-retry until condition is met.

**Warning signs:** Tests that pass locally but fail in CI. Intermittent failures that disappear when re-run.

### Pitfall 3: Sharing State Between Tests
**What goes wrong:** Tests depend on execution order or leave artifacts (uploaded files, localStorage) that affect subsequent tests.

**Why it happens:** Using `beforeAll` instead of `beforeEach`, or not cleaning up after tests.

**How to avoid:** Each test gets fresh context automatically. Use `beforeEach` for navigation. Avoid `test.only` dependencies.

**Warning signs:** Tests pass individually but fail when run as suite. Different results based on execution order.

### Pitfall 4: Testing Third-Party Dependencies
**What goes wrong:** E2E tests call real external APIs (GitHub, Stripe, etc.) which have rate limits, cost money, or cause intermittent failures.

**Why it happens:** Wanting "real" end-to-end coverage without considering CI cost and reliability.

**How to avoid:** Mock third-party APIs using `page.route()`. Focus E2E tests on your application code, not external services.

**Warning signs:** Tests fail due to network timeouts or rate limiting. CI costs increase unexpectedly.

### Pitfall 5: Using Manual Waits (sleep/setTimeout)
**What goes wrong:** Tests use `await page.waitForTimeout(5000)` which makes tests slow and still flaky (sometimes 5s isn't enough).

**Why it happens:** Trying to fix timing issues with arbitrary delays.

**How to avoid:** Use Playwright's auto-waiting. Every action waits for actionability. Use `waitFor()` on specific elements or network events.

**Warning signs:** Tests with hardcoded `waitForTimeout()`. Tests that take unnecessarily long to run.

### Pitfall 6: Not Using data-testid for Dynamic Content
**What goes wrong:** Tests rely on text content that changes (e.g., "Upload Your Code" becomes "Upload Your Files") or elements that appear/disappear.

**Why it happens:** Not adding semantic identifiers to components during development.

**How to avoid:** Add `data-testid` attributes to key interactive elements during feature development. Document testid conventions in component code.

**Warning signs:** Frequent test updates needed for copy changes. Difficulty locating elements that don't have accessible roles.

### Pitfall 7: Treating Playwright as Unit Test Replacement
**What goes wrong:** Writing hundreds of E2E tests covering every edge case, making CI slow and expensive.

**Why it happens:** Misunderstanding the testing pyramid - E2E tests should be few and focused on critical flows.

**How to avoid:** Keep E2E tests to 3-10 critical user journeys. Use unit tests (Vitest) for edge cases, validation logic, and component behavior.

**Warning signs:** E2E test suite takes more than 5 minutes to run. Tests cover scenarios already tested at unit level.

### Pitfall 8: Not Isolating Browser Contexts
**What goes wrong:** Tests accidentally share cookies, localStorage, or cached data between tests.

**Why it happens:** Reusing page/context across tests or not understanding Playwright's isolation model.

**How to avoid:** Let Playwright create fresh context per test (default behavior). Don't share `page` or `context` fixtures across tests.

**Warning signs:** Tests fail when run in parallel but pass when run sequentially. Unexpected localStorage or cookie values.

## Code Examples

Verified patterns from official sources:

### Basic Test Structure
```typescript
// Source: https://playwright.dev/docs/intro
import { test, expect } from '@playwright/test';

test('landing page loads successfully', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Hapyy/);
  await expect(page.getByText(/Formal Verification/i)).toBeVisible();
});
```

### Page Object Model Implementation
```typescript
// Source: https://playwright.dev/docs/pom
// e2e/pages/LandingPage.ts
import { Page, Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly exploreToolsButton: Locator;
  readonly quickStartButton: Locator;
  readonly tryDemoLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.exploreToolsButton = page.getByRole('button', { name: /explore tools/i });
    this.quickStartButton = page.getByTestId('quickstart-cta');
    this.tryDemoLink = page.getByRole('link', { name: /try the demo/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async navigateToDemo() {
    await this.tryDemoLink.click();
    await this.page.waitForURL('/demo');
  }

  async quickStartWithTool(toolId: string) {
    await this.quickStartButton.click();
    await this.page.waitForURL(`/demo?tool=${toolId}&quickstart=true`);
  }
}

// Usage in test
test('navigates from landing to demo', async ({ page }) => {
  const landingPage = new LandingPage(page);
  await landingPage.goto();
  await landingPage.navigateToDemo();

  await expect(page).toHaveURL('/demo');
});
```

### Web-First Assertions
```typescript
// Source: https://playwright.dev/docs/best-practices
// ✅ GOOD: Auto-waits and retries
await expect(page.getByTestId('console-output')).toContainText('Execution completed');
await expect(page.getByRole('button', { name: /download/i })).toBeEnabled();

// ❌ BAD: Returns immediately, doesn't wait
const isVisible = await page.getByTestId('console-output').isVisible();
expect(isVisible).toBe(true); // Flaky!
```

### Playwright Config for Monorepo
```typescript
// Source: https://playwright.dev/docs/test-configuration
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html'],
    ['list'], // CLI output
    process.env.CI ? ['github'] : ['list'], // GitHub Actions annotations
  ],

  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for different browsers/viewports
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['iPhone 13 Pro'],
      },
    },
    // Only test critical flows on Firefox/WebKit to save CI time
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      testMatch: /critical\.spec\.ts/, // Only critical tests
    },
  ],

  // Run dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### GitHub Actions Workflow
```yaml
# Source: https://playwright.dev/docs/ci-intro
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Selenium WebDriver | Playwright Test | 2020-2023 | Auto-waiting eliminates 90% of flaky tests. Built-in network interception removes need for external mocking tools. |
| Custom wait logic (sleep, polls) | Web-First assertions | 2020+ | Tests are faster (no arbitrary waits) and more reliable (retry until condition met). |
| Page Object + manual locators | Page Object + typed locators | 2021+ | TypeScript autocomplete for locators. Compile-time safety. Better IDE support. |
| Single browser testing | Multi-browser projects | 2020+ | Test Chromium, Firefox, WebKit in parallel without additional tools. Catches browser-specific bugs. |
| Jest + Puppeteer | Playwright Test | 2021-2024 | Unified framework vs separate tools. Playwright includes test runner, assertions, fixtures, reporters. |
| Manual screenshot capture | Built-in trace/screenshot | 2021+ | Zero-config debugging. Trace viewer shows every action, network request, DOM snapshot. |
| Running tests in Node.js | Browser context isolation | 2020+ | Each test gets clean browser context. No localStorage/cookie pollution. Parallel execution without conflicts. |

**Deprecated/outdated:**
- **playwright-github-action:** Deprecated in 2024. Use Playwright CLI (`npx playwright install --with-deps`) in GitHub Actions instead.
- **Using Playwright library directly for E2E:** Use `@playwright/test` framework instead. Library lacks fixtures, parallel execution, and reporting.
- **Codegen for every locator:** Codegen is useful for initial exploration, but production tests should use semantic locators (role, label, testid) per documentation.

## Open Questions

1. **Should E2E tests run on every PR or only on main branch merges?**
   - What we know: Running on every PR catches issues early but increases CI costs and PR feedback time.
   - What's unclear: Project's CI budget and acceptable PR latency.
   - Recommendation: Start with running on PRs targeting main branch only. Add PR runs if merges frequently break production.

2. **How many browsers should we test against?**
   - What we know: Playwright supports Chromium, Firefox, WebKit. Testing all three provides maximum coverage but triples CI time.
   - What's unclear: User browser distribution for this application.
   - Recommendation: Test Chromium desktop/mobile for all tests. Add Firefox/WebKit for critical flows only (landing→demo→execute).

3. **Should we test against production-like data or synthetic test data?**
   - What we know: Project has example files for cpp-to-c and cpp-to-rust tools.
   - What's unclear: Whether execution behavior differs significantly between simple examples and real-world complex files.
   - Recommendation: Use existing example files for E2E tests. Add 1-2 larger files (100+ lines) to test file size handling and execution timeout.

4. **How should we handle test data files?**
   - What we know: Tests need .cpp files for upload testing. Example files exist in examples/ directory.
   - What's unclear: Should E2E tests reference examples/ directory or duplicate files in e2e/fixtures/?
   - Recommendation: Create e2e/fixtures/test-files/ with small, predictable test files (5-20 lines). This keeps tests fast and isolated from production example changes.

## Sources

### Primary (HIGH confidence)
- [Installation | Playwright](https://playwright.dev/docs/intro) - Official installation and setup guide
- [Best Practices | Playwright](https://playwright.dev/docs/best-practices) - Official best practices documentation
- [Page Object Models | Playwright](https://playwright.dev/docs/pom) - Official POM pattern guide
- [Locators | Playwright](https://playwright.dev/docs/locators) - Complete locator strategy documentation
- [Network | Playwright](https://playwright.dev/docs/network) - Network interception and monitoring
- [Downloads | Playwright](https://playwright.dev/docs/downloads) - File download testing
- [Emulation | Playwright](https://playwright.dev/docs/emulation) - Viewport and device emulation
- [Setting up CI | Playwright](https://playwright.dev/docs/ci-intro) - CI/CD configuration guide

### Secondary (MEDIUM confidence)
- [Playwright | Turborepo](https://turborepo.com/docs/guides/tools/playwright) - Monorepo integration patterns
- [15 Best Practices for Playwright testing in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices) - Community best practices compilation
- [How to test drag-and-drop interactions in Playwright | Reflect](https://reflect.run/articles/how-to-test-drag-and-drop-interactions-in-playwright/) - Drag-and-drop testing strategies
- [File selection/testing with Playwright · react-dropzone/react-dropzone · Discussion #1339](https://github.com/react-dropzone/react-dropzone/discussions/1339) - react-dropzone specific file upload testing

### Tertiary (LOW confidence - marked for validation)
- [Playwright: Testing WebSockets and Live Data Streams | DZone](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs) - SSE testing patterns (not official docs)
- [Unit and E2E Tests with Vitest & Playwright | Strapi](https://strapi.io/blog/nextjs-testing-guide-unit-and-e2e-tests-with-vitest-and-playwright) - Vitest integration approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Playwright documentation and verified version numbers
- Architecture: HIGH - Official POM guide, official best practices, official config examples
- Pitfalls: MEDIUM-HIGH - Mix of official best practices and community experience (BrowserStack, DZone)
- SSE testing: MEDIUM - Official network docs don't cover SSE specifically; relied on community resources and WebSocket patterns
- react-dropzone integration: MEDIUM - Based on community discussion and official file upload docs

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days for stable framework; Playwright has predictable release cycle)
