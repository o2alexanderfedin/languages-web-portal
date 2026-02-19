import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Landing page
 * Encapsulates interactions with marketing page at /
 */
export class LandingPage {
  readonly page: Page;
  readonly landingContainer: Locator;
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly missionStatement: Locator;
  readonly toolComparisonGrid: Locator;
  readonly toolTable: Locator;
  readonly toolCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.landingContainer = page.getByTestId('landing-page');
    this.heroSection = page.getByTestId('hero-section');
    this.heroTitle = page.getByRole('heading', { name: /Formal Verification/i });
    this.missionStatement = this.heroSection.locator('p');
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
   * Wait for landing page container to become visible.
   *
   * @param timeout - Maximum wait time in milliseconds (default: 10_000)
   */
  async waitForVisible(timeout = 10_000): Promise<void> {
    await this.landingContainer.waitFor({ state: 'visible', timeout });
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

  /**
   * Get all tool rows (desktop table)
   */
  getToolRows(): Locator {
    return this.toolTable.locator('tbody tr');
  }

  /**
   * Get all tool cards list (mobile cards)
   */
  getToolCardsList(): Locator {
    return this.toolCards.locator('[data-testid^="tool-card-"]');
  }

  /**
   * Get tool status badge locator
   */
  getToolStatusBadge(toolId: string, isMobile: boolean): Locator {
    if (isMobile) {
      return this.getToolCard(toolId).locator('span.rounded-full');
    }
    return this.getToolRow(toolId).locator('span.rounded-full');
  }
}
