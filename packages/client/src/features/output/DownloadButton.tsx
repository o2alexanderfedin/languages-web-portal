interface DownloadButtonProps {
  projectId: string;
  disabled?: boolean;
}

/**
 * Download button for ZIP output
 */
export function DownloadButton({ projectId, disabled }: DownloadButtonProps) {
  if (disabled) {
    return (
      <span
        data-testid="download-button"
        aria-disabled="true"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground font-medium cursor-not-allowed saturate-[.35] select-none"
        title="No output available to download"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        Download Output (ZIP)
      </span>
    );
  }

  return (
    <a
      href={`/api/projects/${projectId}/download`}
      download={`${projectId}-output.zip`}
      data-testid="download-button"
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
      Download Output (ZIP)
    </a>
  );
}
