import { useState } from 'react';
import type { FileNode } from '@repo/shared';
import { useGetFileTreeQuery } from './outputApi';
import { FileTree } from './FileTree';
import { FilePreview } from './FilePreview';
import { DownloadButton } from './DownloadButton';

interface OutputPanelProps {
  projectId: string;
  toolCategory?: 'transpiler' | 'verification' | 'linter';
}

/**
 * Composite output panel with file tree, preview, and download
 */
export function OutputPanel({ projectId, toolCategory }: OutputPanelProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const { data, error, isLoading } = useGetFileTreeQuery(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading output files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">No output files available</div>
      </div>
    );
  }

  const fileTree = data?.data?.tree;
  const hasFiles = fileTree && Object.keys(fileTree).length > 0;

  if (!hasFiles) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No output files generated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <svg
          className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm">
          <p className="text-blue-900 font-medium">
            Output available for download
          </p>
          <p className="text-blue-700 mt-0.5">
            Files will be cleaned up automatically
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: File tree + Download button */}
        <div className="lg:col-span-1 space-y-4">
          <FileTree fileTree={fileTree} onSelectFile={setSelectedFile} />
          <DownloadButton projectId={projectId} disabled={false} />
        </div>

        {/* Right column: File preview */}
        <div className="lg:col-span-2">
          {selectedFile ? (
            <FilePreview
              projectId={projectId}
              filePath={selectedFile.path}
              fileName={selectedFile.name}
              toolCategory={toolCategory}
            />
          ) : (
            <div className="border rounded-lg p-8 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-slate-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-slate-600 font-medium">
                  Select a file to preview
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Click a file in the tree to view its contents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
