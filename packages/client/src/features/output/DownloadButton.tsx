interface DownloadButtonProps {
  projectId: string;
  disabled?: boolean;
}

/**
 * Download button for ZIP output
 */
export function DownloadButton({ projectId, disabled }: DownloadButtonProps) {
  return (
    <a
      href={`/api/projects/${projectId}/download`}
      download={`${projectId}-output.zip`}
      data-testid="download-button"
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-md
        bg-blue-600 text-white font-medium
        hover:bg-blue-700 transition-colors
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      aria-disabled={disabled}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
        />
      </svg>
      Download Output (ZIP)
    </a>
  );
}
