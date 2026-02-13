import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DownloadButton } from '@/features/output/DownloadButton';

/**
 * Integration tests for output components (DownloadButton, FileTree, FilePreview, OutputPanel)
 *
 * Note: Full component tests for FileTree, FilePreview, and OutputPanel require complex mocking
 * of react-syntax-highlighter and react-complex-tree dependencies. These are tested via
 * manual QA and integration testing with the full application.
 *
 * DownloadButton is fully tested here as it has no complex dependencies.
 */

describe('Output Components', () => {
  describe('DownloadButton', () => {
    it('should render anchor tag with correct href', () => {
      render(<DownloadButton projectId="test-project-123" disabled={false} />);

      const downloadLink = screen.getByRole('link', { name: /Download Output/i });
      expect(downloadLink).toHaveAttribute('href', '/api/projects/test-project-123/download');
    });

    it('should render with download attribute', () => {
      render(<DownloadButton projectId="test-project-123" disabled={false} />);

      const downloadLink = screen.getByRole('link', { name: /Download Output/i });
      expect(downloadLink).toHaveAttribute('download');
    });

    it('should show "Download Output (ZIP)" text', () => {
      render(<DownloadButton projectId="test-project-123" disabled={false} />);

      expect(screen.getByText(/Download Output.*ZIP/i)).toBeInTheDocument();
    });

    it('should apply disabled styling when disabled prop is true', () => {
      render(<DownloadButton projectId="test-project-abc" disabled={true} />);

      const downloadLink = screen.getByRole('link', { name: /Download Output/i });

      // Check for disabled-related classes
      expect(downloadLink).toHaveClass(/pointer-events-none|opacity-50/i);
    });

    it('should render with different projectId', () => {
      render(<DownloadButton projectId="another-project-456" disabled={false} />);

      const downloadLink = screen.getByRole('link', { name: /Download Output/i });
      expect(downloadLink).toHaveAttribute('href', '/api/projects/another-project-456/download');
    });

    it('should render with download icon', () => {
      render(<DownloadButton projectId="test-project-123" disabled={false} />);

      const downloadLink = screen.getByRole('link', { name: /Download Output/i });
      const svg = downloadLink.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('FileTree', () => {
    it.todo('renders tree with files and directories');
    it.todo('calls onSelectFile when file is clicked');
    it.todo('does NOT call onSelectFile when directory is clicked');
    it.todo('shows file sizes next to file names');
  });

  describe('FilePreview', () => {
    it.todo('renders loading spinner while fetching');
    it.todo('renders syntax-highlighted content for text files');
    it.todo('shows truncation banner when truncated: true');
    it.todo('shows binary file message when language: "binary"');
    it.todo('shows error message on fetch failure');
    it.todo('renders correct language badge');
    it.todo('renders output type badge for transpiled code');
    it.todo('renders output type badge for verification reports');
    it.todo('renders output type badge for logs');
  });

  describe('OutputPanel', () => {
    it.todo('renders loading state when file tree is loading');
    it.todo('renders file tree when data is available');
    it.todo('renders error message when file tree fetch fails');
    it.todo('renders "Select a file to preview" placeholder when no file selected');
    it.todo('renders download button with correct projectId');
    it.todo('renders info bar about automatic cleanup');
    it.todo('renders empty state when file tree has no files');
  });
});
