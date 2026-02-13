/**
 * File node representing a file or directory in the output tree
 */
export interface FileNode {
  /** Unique identifier for this node */
  id: string;
  /** File or directory name */
  name: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** IDs of child nodes (only for directories) */
  children?: string[];
  /** Relative path from project root */
  path: string;
  /** File size in bytes (only for files) */
  size?: number;
  /** File extension including dot (e.g., '.ts') (only for files) */
  extension?: string;
}

/**
 * File tree response structure using normalized node map
 */
export interface FileTreeResponse {
  /** Map of node IDs to FileNode objects */
  tree: Record<string, FileNode>;
  /** ID of the root node */
  rootId: string;
}

/**
 * File preview response with content and metadata
 */
export interface FilePreviewResponse {
  /** File content (empty string for binary files) */
  content: string;
  /** File name */
  fileName: string;
  /** Relative path from project root */
  filePath: string;
  /** Language identifier for syntax highlighting */
  language: string;
  /** File size in bytes */
  size: number;
  /** Whether content was truncated (files > 500KB) */
  truncated: boolean;
}

/**
 * Output type classification for transpiler vs verification output
 */
export type OutputType = 'source' | 'report' | 'log' | 'config' | 'unknown';

/**
 * Classifies output type based on file extension and tool category
 *
 * @param filePath - Path to the file
 * @param toolCategory - Category of the tool that generated the output
 * @returns OutputType classification
 */
export function classifyOutputType(
  filePath: string,
  toolCategory: 'transpiler' | 'verification' | 'linter'
): OutputType {
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

  if (toolCategory === 'transpiler') {
    // Source code files
    if (['.c', '.h', '.cpp', '.hpp', '.rs'].includes(extension)) {
      return 'source';
    }
    // Log files
    if (extension === '.log') {
      return 'log';
    }
    // Configuration files
    if (['.json', '.yaml', '.yml'].includes(extension)) {
      return 'config';
    }
  } else if (toolCategory === 'verification' || toolCategory === 'linter') {
    // Report files
    if (['.log', '.txt', '.md'].includes(extension)) {
      return 'report';
    }
    // Configuration files
    if (extension === '.json') {
      return 'config';
    }
  }

  return 'unknown';
}
