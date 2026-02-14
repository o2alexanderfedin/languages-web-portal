import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Landing page
 * Encapsulates interactions with marketing page at /
 */
export class LandingPage {
  readonly page: Page;
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly quickStartButton: Locator;
  readonly exploreToolsButton: Locator;
  readonly toolComparisonGrid: Locator;
  readonly toolTable: Locator;
  readonly toolCards: Locator;
  readonly footerDemoLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroSection = page.getByTestId('hero-section');
    this.heroTitle = page.getByRole('heading', { name: /Formal Verification/i });
    this.quickStartButton = page.getByTestId('quickstart-cta');
    this.exploreToolsButton = page.getByTestId('hero-explore-tools');
    this.toolComparisonGrid = page.getByTestId('tool-comparison-grid');
    this.toolTable = page.getByTestId('tool-comparison-table');
    this.toolCards = page.getByTestId('tool-comparison-cards');
    this.footerDemoLink = page.getByTestId('landing-footer-demo-link');
  }

  /**
   * Navigate to landing page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Click QuickStart CTA and wait for navigation to demo
   */
  async clickQuickStart() {
    await this.quickStartButton.click();
    await this.page.waitForURL(/.*\/demo.*/);
  }

  /**
   * Click Try Now button for a specific tool
   */
  async clickTryNow(toolId: string) {
    await this.page.getByTestId(`tool-try-now-${toolId}`).click();
    await this.page.waitForURL(/.*\/demo.*/);
  }

  /**
   * Click Explore Tools button (scrolls to comparison section)
   */
  async clickExploreTools() {
    await this.exploreToolsButton.click();
  }

  /**
   * Navigate to demo via footer link
   */
  async navigateToDemo() {
    await this.footerDemoLink.click();
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
