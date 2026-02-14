import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Landing page
 * Encapsulates interactions with marketing page at /
 */
export class LandingPage {
  readonly page: Page;
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly toolComparisonGrid: Locator;
  readonly toolTable: Locator;
  readonly toolCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroSection = page.getByTestId('hero-section');
    this.heroTitle = page.getByRole('heading', { name: /Formal Verification/i });
    this.toolComparisonGrid = page.getByTestId('tool-comparison-grid');
    this.toolTable = page.getByTestId('tool-comparison-table');
    this.toolCards = page.getByTestId('tool-comparison-cards');
  }

  /**
   * Navigate to landing page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Click Try Now button for a specific tool
   */
  async clickTryNow(toolId: string) {
    await this.page.getByTestId(`tool-try-now-${toolId}`).click();
    await this.page.waitForURL(/.*\/demo.*/);
  }

  /**
   * Get tool row locator by tool ID (desktop table)
   */
  getToolRow(toolId: string): Locator {
    return this.page.getByTestId(`tool-row-${toolId}`);
  }

  /**
   * Get tool card locator by tool ID (mobile cards)
   */
  getToolCard(toolId: string): Locator {
    return this.page.getByTestId(`tool-card-${toolId}`);
  }
}
