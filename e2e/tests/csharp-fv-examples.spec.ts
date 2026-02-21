import { test, expect } from '@playwright/test';
import { ExecutionPage } from '../pages/ExecutionPage';
import { DemoPage } from '../pages/DemoPage';

/**
 * C# FV Example loading E2E tests (E2E-01).
 *
 * Covers:
 *   E2E-01 — C# FV tool selection and example loading in ExampleSelector UI
 *
 * Runs on full 9-project Playwright matrix (3 browsers × 3 viewports).
 * No Docker dependency — example loading calls the server to unpack the
 * project zip; executeButton.toBeEnabled() proves server interaction succeeded.
 */

test.describe('C# FV Example Loading — All 3 Examples (E2E-01)', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  // NOTE: No isMobile skip here — examples spec runs on ALL 9 matrix projects

  test('null-safe-repository example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await exec.loadExample('null-safe-repository');

    // E2E-01: execute button must be enabled after loading
    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('bank-account-invariant example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await exec.loadExample('bank-account-invariant');

    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('calculator-contracts example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await exec.loadExample('calculator-contracts');

    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });

  test('example selector shows exactly 3 selectable C# FV options', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=csharp-verification');
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

test.describe('C# FV Example UI Interactions (E2E-01)', () => {
  test.skip(({ isMobile }) => isMobile, 'Example selector tests run on desktop only');

  test('selecting an example shows its description text', async ({ page }) => {
    const demo = new DemoPage(page);

    await demo.goto('tool=csharp-verification');
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await demo.selectExample('null-safe-repository');

    // E2E-01: description paragraph appears below the dropdown
    const description = await demo.getExampleDescription();
    expect(description.trim().length).toBeGreaterThan(0);
  });

  test('switching example changes the description text', async ({ page }) => {
    const demo = new DemoPage(page);

    await demo.goto('tool=csharp-verification');
    await demo.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    await demo.selectExample('null-safe-repository');
    const firstDescription = await demo.getExampleDescription();

    await demo.selectExample('bank-account-invariant');
    const secondDescription = await demo.getExampleDescription();

    // Each example has a unique description
    expect(firstDescription.trim().length).toBeGreaterThan(0);
    expect(secondDescription.trim().length).toBeGreaterThan(0);
    expect(firstDescription).not.toBe(secondDescription);
  });

  test('dropdown resets to placeholder after successful load', async ({ page }) => {
    const exec = new ExecutionPage(page);

    await exec.goto('tool=csharp-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });

    // Load example — waits for executeButton to become enabled
    await exec.loadExample('null-safe-repository');

    // E2E-01: dropdown value resets to "" (the placeholder) after load
    const dropdownValue = await exec.exampleDropdown.inputValue();
    expect(dropdownValue).toBe('');

    // Load button must also be disabled again (no selection active)
    await expect(exec.loadExampleButton).toBeDisabled();
  });
});
