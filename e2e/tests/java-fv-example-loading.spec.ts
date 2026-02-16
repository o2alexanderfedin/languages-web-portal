import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';

test.describe('Java FV Example Loading', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    // Skip example loading tests on mobile (UI is identical, no need to test twice)
    if (isMobile) {
      test.skip();
    }

    // Navigate to demo page with java-verification pre-selected
    await page.goto('/demo?tool=java-verification');
  });

  test('ExampleSelector dropdown appears with 3 examples', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector to appear (needs API to load examples)
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Assert dropdown is visible
    await expect(demo.exampleDropdown).toBeVisible();

    // Count option elements (excluding the placeholder "-- Load an example --")
    const optionCount = await demo.exampleDropdown.locator('option').count();
    // Total options = 3 examples + 1 placeholder = 4
    expect(optionCount).toBe(4);

    // Count options with non-empty value (actual examples, excluding placeholder with value="")
    const exampleOptions = await demo.exampleDropdown
      .locator('option')
      .evaluateAll((options: HTMLOptionElement[]) =>
        options.filter((opt) => opt.value !== '').length
      );
    expect(exampleOptions).toBe(3);
  });

  test('can load bank-account-records example', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Select example
    await demo.selectExample('bank-account-records');

    // Assert description appears below dropdown
    const description = await demo.getExampleDescription();
    expect(description.length).toBeGreaterThan(0);

    // Click load button
    await demo.loadExampleButton.click();

    // Wait for execute button to be enabled (projectId was set)
    await expect(demo.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('can load shape-matching example', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Select example
    await demo.selectExample('shape-matching');

    // Assert description appears below dropdown
    const description = await demo.getExampleDescription();
    expect(description.length).toBeGreaterThan(0);

    // Click load button
    await demo.loadExampleButton.click();

    // Wait for execute button to be enabled (projectId was set)
    await expect(demo.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('can load payment-types example', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Select example
    await demo.selectExample('payment-types');

    // Assert description appears below dropdown
    const description = await demo.getExampleDescription();
    expect(description.length).toBeGreaterThan(0);

    // Click load button
    await demo.loadExampleButton.click();

    // Wait for execute button to be enabled (projectId was set)
    await expect(demo.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('selecting an example shows its description', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Select first example
    await demo.selectExample('bank-account-records');

    // Assert description appears with text-muted-foreground class
    const descriptionLocator = page.locator(
      '[data-testid="example-selector"] p.text-muted-foreground'
    );
    await expect(descriptionLocator).toBeVisible();
    const firstDescription = await descriptionLocator.textContent();
    expect(firstDescription).toBeTruthy();

    // Change selection to different example
    await demo.selectExample('shape-matching');

    // Assert description changed
    const secondDescription = await descriptionLocator.textContent();
    expect(secondDescription).toBeTruthy();
    expect(secondDescription).not.toBe(firstDescription);
  });

  test('Load Example button is disabled without selection', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Assert load button is disabled when no example is selected (default "" value)
    await expect(demo.loadExampleButton).toBeDisabled();
  });

  test('dropdown resets after successful load', async ({ page }) => {
    const demo = new DemoPage(page);

    // Wait for example selector
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Load example using helper
    await demo.loadExample('bank-account-records');

    // After execute button becomes enabled, check dropdown value is reset to ""
    const dropdownValue = await demo.exampleDropdown.inputValue();
    expect(dropdownValue).toBe('');

    // Load button should be disabled again
    await expect(demo.loadExampleButton).toBeDisabled();
  });
});
