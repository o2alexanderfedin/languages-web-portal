import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Register languages for Prism light build
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import xml from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

import { useGetFilePreviewQuery } from './outputApi';
import { detectLanguage, getOutputTypeLabel } from '@/utils/languageMap';

// Register languages with Prism
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('markdown', markdown);

interface FilePreviewProps {
  projectId: string;
  filePath: string;
  fileName: string;
  toolCategory?: 'transpiler' | 'verification' | 'linter';
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Gets badge color class based on output type label
 */
function getBadgeColor(label: string): string {
  if (label === 'Transpiled Source') {
    return 'bg-blue-600 text-white';
  }
  if (label === 'Verification Report') {
    return 'bg-green-600 text-white';
  }
  if (label === 'Report / Log') {
    return 'bg-gray-600 text-white';
  }
  return 'bg-slate-700 text-white';
}

/**
 * File preview component with syntax highlighting
 */
export function FilePreview({
  projectId,
  filePath,
  fileName,
  toolCategory,
}: FilePreviewProps) {
  const { data, error, isLoading } = useGetFilePreviewQuery({
    projectId,
    filePath,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Failed to load file preview</div>
      </div>
    );
  }

  if (!data?.data) {
    return null;
  }

  const preview = data.data;
  const language = detectLanguage(preview.filePath);
  const outputTypeLabel = getOutputTypeLabel(language, toolCategory);
  const badgeColor = getBadgeColor(outputTypeLabel);

  // Binary file handling
  if (preview.language === 'binary') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-slate-100">{fileName}</h3>
              <span className={`text-xs px-2 py-1 rounded ${badgeColor}`}>
                Binary File
              </span>
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 flex flex-col items-center justify-center gap-4">
          <svg
            className="w-16 h-16 text-slate-400"
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
          <div className="text-center">
            <p className="text-slate-600 font-medium">Binary file detected</p>
            <p className="text-sm text-slate-500 mt-1">
              Download the output ZIP to view this file
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Truncated file warning
  const showTruncationWarning = preview.truncated;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-slate-100">{fileName}</h3>
            <span className={`text-xs px-2 py-1 rounded ${badgeColor}`}>
              {outputTypeLabel}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
              {language}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {formatFileSize(preview.size)}
          </span>
        </div>
      </div>

      {/* Truncation warning */}
      {showTruncationWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-start gap-2">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Preview truncated
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              File is {formatFileSize(preview.size)} (showing first 500 KB)
            </p>
          </div>
        </div>
      )}

      {/* Code preview */}
      <div className="max-h-96 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          wrapLines
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.875rem',
          }}
        >
          {preview.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
