import { test, expect } from '@playwright/test';
import { DemoPage } from '../pages/DemoPage';

test.describe('Shareable Links', () => {
  test('navigating to /demo?tool=cpp-to-c-transpiler pre-selects the tool', async ({
    page,
  }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=cpp-to-c-transpiler');

    // Verify tool is pre-selected
    const selectedTool = demo.getToolOption('cpp-to-c-transpiler');
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('navigating to /demo?tool=cpp-to-rust-transpiler pre-selects different tool', async ({
    page,
  }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=cpp-to-rust-transpiler');

    // Verify different tool is pre-selected
    const selectedTool = demo.getToolOption('cpp-to-rust-transpiler');
    await expect(selectedTool).toHaveClass(/border-primary/);
  });

  test('navigating to /demo without params shows no tool pre-selected', async ({
    page,
  }) => {
    const demo = new DemoPage(page);
    await demo.goto();

    // Verify execute button is disabled (no tool selected)
    await expect(demo.executeButton).toBeDisabled();
  });

  test('navigating to /demo?tool=invalid-tool-id handles gracefully', async ({
    page,
  }) => {
    const demo = new DemoPage(page);
    await demo.goto('tool=nonexistent');

    // Page should load without errors
    await expect(demo.toolPicker).toBeVisible();
    await expect(demo.executeButton).toBeVisible();

    // Execute button should still be present (even if disabled)
    await expect(demo.executeButton).toBeDisabled();
  });
});
