import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { DemoPage } from '../pages/DemoPage';

/**
 * Example loading E2E tests.
 *
 * Covers:
 *   EXMP-01 — All 3 Java examples load successfully (execute button enabled)
 *   EXMP-04 — Example description displays on selection; dropdown resets after load
 *
 * EXMP-01 tests require Docker (loading an example calls the server to unpack the
 * example project, so executeButton.toBeEnabled() proves server interaction succeeded).
 * EXMP-04 tests are UI-only (no Docker needed).
 */

test.describe('Example Loading — All 3 Examples (EXMP-01)', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  test.skip(({ isMobile }) => isMobile, 'Example loading tests run on desktop only');

  test('bank-account-records example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=java-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await exec.loadExample('bank-account-records');

    // EXMP-01: execute button must be enabled after loading
    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('shape-matching example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=java-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await exec.loadExample('shape-matching');

    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('payment-types example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=java-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await exec.loadExample('payment-types');

    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('example selector shows exactly 3 selectable options', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=java-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Total options = 3 examples + 1 placeholder ("-- Load an example --") = 4
    const optionCount = await exec.exampleDropdown.locator('option').count();
    expect(optionCount).toBe(4);

    // Selectable (non-placeholder) options have a non-empty value attribute
    const selectableCount = await exec.exampleDropdown
      .locator('option')
      .evaluateAll((opts: HTMLOptionElement[]) => opts.filter((o) => o.value !== '').length);
    expect(selectableCount).toBe(3);
  });
});

test.describe('Example UI Interactions (EXMP-04)', () => {
  test.skip(({ isMobile }) => isMobile, 'Example selector tests run on desktop only');

  test('selecting an example shows its description text', async ({ page }) => {
    const demo = new DemoPage(page);

    await demo.goto('tool=java-verification');
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await demo.selectExample('bank-account-records');

    // EXMP-04: description paragraph appears below the dropdown
    const description = await demo.getExampleDescription();
    expect(description.trim().length).toBeGreaterThan(0);
  });

  test('switching example changes the description text', async ({ page }) => {
    const demo = new DemoPage(page);

    await demo.goto('tool=java-verification');
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await demo.selectExample('bank-account-records');
    const firstDescription = await demo.getExampleDescription();

    await demo.selectExample('shape-matching');
    const secondDescription = await demo.getExampleDescription();

    // Each example has a unique description
    expect(firstDescription.trim().length).toBeGreaterThan(0);
    expect(secondDescription.trim().length).toBeGreaterThan(0);
    expect(firstDescription).not.toBe(secondDescription);
  });

  test('dropdown resets to placeholder after successful load', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=java-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Load example — waits for executeButton to become enabled
    await exec.loadExample('bank-account-records');

    // EXMP-04: dropdown value resets to "" (the placeholder) after load
    const dropdownValue = await exec.exampleDropdown.inputValue();
    expect(dropdownValue).toBe('');

    // Load button must also be disabled again (no selection active)
    await expect(exec.loadExampleButton).toBeDisabled();
  });

  test('Load Example button is disabled without a selection', async ({ page }) => {
    const demo = new DemoPage(page);

    await demo.goto('tool=java-verification');
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // With placeholder selected (value=""), load button must be disabled
    await expect(demo.loadExampleButton).toBeDisabled();
  });
});
