import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the output panel on the /demo page.
 * Encapsulates all output-panel locators and action methods,
 * covering the file tree, file preview, download button, and empty state.
 */
export class OutputPage {
  readonly page: Page;

  /** The output panel container (data-testid="output-panel") */
  readonly outputPanel: Locator;

  /** Download ZIP anchor (data-testid="download-button") */
  readonly downloadButton: Locator;

  /**
   * All file tree item elements rendered by react-complex-tree.
   * react-complex-tree renders items as li[role="treeitem"].
   */
  readonly treeItems: Locator;

  /**
   * The file preview area — the dark header bar of the preview pane
   * that shows file name and language badge.
   * Selector: `.bg-slate-900` within output-panel area.
   */
  readonly filePreviewHeader: Locator;

  /**
   * The syntax-highlighted code block inside the preview pane.
   * react-syntax-highlighter renders a <pre> or <code> element.
   */
  readonly syntaxHighlighterBlock: Locator;

  /**
   * The "No output files generated" empty state paragraph.
   * Rendered by OutputPanel when hasFiles is false.
   */
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.outputPanel = page.getByTestId('output-panel');
    this.downloadButton = page.getByTestId('download-button');
    this.treeItems = page.locator('[role="treeitem"]');
    this.filePreviewHeader = page.locator('.bg-slate-900').first();
    this.syntaxHighlighterBlock = page
      .locator('pre code, .react-syntax-highlighter, pre[class*="language-"]')
      .first();
    this.emptyStateMessage = page.getByText(/No output files generated/i);
  }

  /**
   * Click the first non-folder file in the tree to trigger file preview.
   * Waits for tree items to be present first.
   *
   * react-complex-tree renders folders as li[role="treeitem"][aria-expanded]
   * and files as li[role="treeitem"] without aria-expanded.
   *
   * @param timeout Maximum wait for treeItems to appear (default: 10_000)
   */
  async clickFirstFile(timeout = 10_000): Promise<void> {
    await this.treeItems.first().waitFor({ state: 'visible', timeout });
    // react-complex-tree: click the first li[role="treeitem"] that is not a folder
    // Folders have aria-expanded; files do not — filter items without aria-expanded
    const nonFolderItems = this.page.locator('[role="treeitem"]:not([aria-expanded])');
    const count = await nonFolderItems.count();
    if (count > 0) {
      await nonFolderItems.first().click();
    } else {
      // Fallback: click any tree item (may open folder or file)
      await this.treeItems.first().click();
    }
  }

  /**
   * Get visible text from the file preview header bar.
   * Returns the file name and language label shown in the dark header.
   *
   * @returns Header text content, or empty string if element has no content
   */
  async getPreviewHeaderText(): Promise<string> {
    return (await this.filePreviewHeader.textContent()) ?? '';
  }
}
