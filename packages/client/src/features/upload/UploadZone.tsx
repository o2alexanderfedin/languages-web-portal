import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useUploadFileMutation } from './uploadApi';
import { MAX_UPLOAD_SIZE } from './types';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onUploadSuccess?: (projectId: string) => void;
}

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [uploadFile, { isLoading, data, error, reset }] = useUploadFileMutation();
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Clear previous errors
      setRejectionError(null);
      reset();

      // Handle file rejections (client-side validation)
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection && rejection.errors.length > 0) {
          const error = rejection.errors[0];

          if (error && error.code === 'file-too-large') {
            setRejectionError('File too large (max 100MB)');
          } else if (error && error.code === 'file-invalid-type') {
            setRejectionError('Only ZIP files are accepted');
          } else if (error) {
            setRejectionError(error.message);
          }
        }
        return;
      }

      // Upload accepted file
      if (acceptedFiles.length > 0 && acceptedFiles[0]) {
        try {
          const result = await uploadFile(acceptedFiles[0]).unwrap();
          if (onUploadSuccess) {
            onUploadSuccess(result.projectId);
          }
        } catch {
          // Error handled by RTK Query state
        }
      }
    },
    [uploadFile, onUploadSuccess, reset],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
    },
    maxSize: MAX_UPLOAD_SIZE,
    multiple: false,
  });

  // Determine display state
  const getDisplayState = () => {
    if (isLoading) return 'uploading';
    if (data) return 'success';
    if (error || rejectionError) return 'error';
    if (isDragActive) return 'drag-active';
    return 'idle';
  };

  const displayState = getDisplayState();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${
            displayState === 'drag-active'
              ? 'border-primary bg-primary/5'
              : displayState === 'error'
                ? 'border-destructive bg-destructive/5'
                : displayState === 'success'
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
        `}
      >
        <input {...getInputProps()} />

        {/* Idle state */}
        {displayState === 'idle' && (
          <div className="space-y-3">
            <div className="text-lg font-medium">
              Drag and drop a ZIP file here, or click to browse
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Max file size: 100MB</div>
              <div>Only .zip files accepted</div>
            </div>
          </div>
        )}

        {/* Drag active state */}
        {displayState === 'drag-active' && (
          <div className="text-lg font-medium text-primary">Drop your ZIP file here...</div>
        )}

        {/* Uploading state */}
        {displayState === 'uploading' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
            <div className="text-lg font-medium">Uploading...</div>
          </div>
        )}

        {/* Success state */}
        {displayState === 'success' && data && (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="text-lg font-medium text-green-700 dark:text-green-400">
              Upload successful - {data.fileCount} files extracted
            </div>
            <div className="text-sm text-muted-foreground font-mono">{data.projectId}</div>
            <Button onClick={() => reset()} variant="outline" size="sm" className="mt-2">
              Upload Another
            </Button>
          </div>
        )}

        {/* Error state */}
        {displayState === 'error' && (
          <div className="space-y-3">
            <div className="text-lg font-medium text-destructive">Upload Failed</div>
            <div className="text-sm text-muted-foreground">
              {rejectionError ||
                (error && 'error' in error && typeof error.error === 'string'
                  ? error.error
                  : error && 'data' in error && error.data
                    ? JSON.stringify(error.data)
                    : 'An error occurred during upload')}
            </div>
            <Button onClick={() => reset()} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Info text below */}
      <div className="mt-4 text-xs text-center text-muted-foreground">
        Your files will be processed securely in an isolated environment
      </div>
    </div>
  );
}
