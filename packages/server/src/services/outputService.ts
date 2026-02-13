import { readdir, stat, readFile } from 'fs/promises';
import { join, relative, extname, sep } from 'path';
import type { FileNode, FileTreeResponse, FilePreviewResponse } from '@repo/shared';
import { validatePathSafety } from '../utils/pathSecurity.js';
import { UserError } from '../types/errors.js';

const MAX_FILE_SIZE = 524288; // 500KB in bytes
const BINARY_CHECK_SIZE = 8192; // Check first 8KB for null bytes

/**
 * Service for building file trees and reading file content from project output
 */
export class OutputService {
  /**
   * Builds a normalized file tree structure from a directory
   *
   * @param projectPath - Absolute path to the project directory
   * @returns FileTreeResponse with normalized tree structure
   */
  async buildFileTree(projectPath: string): Promise<FileTreeResponse> {
    const tree: Record<string, FileNode> = {};
    const rootId = 'root';

    // Create root node
    tree[rootId] = {
      id: rootId,
      name: '/',
      isDirectory: true,
      children: [],
      path: '',
    };

    // Recursively build tree
    await this.traverseDirectory(projectPath, projectPath, rootId, tree);

    // Sort all children arrays: directories first, then alphabetically
    for (const node of Object.values(tree)) {
      if (node.children && node.children.length > 0) {
        node.children.sort((aId, bId) => {
          const a = tree[aId];
          const b = tree[bId];

          // Directories come first
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;

          // Then sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
      }
    }

    return { tree, rootId };
  }

  /**
   * Recursively traverses a directory and builds the file tree
   */
  private async traverseDirectory(
    projectPath: string,
    currentPath: string,
    parentId: string,
    tree: Record<string, FileNode>
  ): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      const relativePath = relative(projectPath, fullPath);
      // Normalize path separators to forward slash for web compatibility
      const normalizedPath = relativePath.split(sep).join('/');
      const nodeId = normalizedPath || entry.name;

      if (entry.isDirectory()) {
        // Create directory node
        tree[nodeId] = {
          id: nodeId,
          name: entry.name,
          isDirectory: true,
          children: [],
          path: normalizedPath,
        };

        // Add to parent's children
        tree[parentId].children!.push(nodeId);

        // Recursively traverse subdirectory
        await this.traverseDirectory(projectPath, fullPath, nodeId, tree);
      } else {
        // Create file node
        const stats = await stat(fullPath);
        const extension = extname(entry.name);

        tree[nodeId] = {
          id: nodeId,
          name: entry.name,
          isDirectory: false,
          path: normalizedPath,
          size: stats.size,
          extension: extension || undefined,
        };

        // Add to parent's children
        tree[parentId].children!.push(nodeId);
      }
    }
  }

  /**
   * Reads file content with security validation and truncation
   *
   * @param projectPath - Absolute path to the project directory
   * @param filePath - Relative path to the file within the project
   * @returns FilePreviewResponse with content and metadata
   * @throws {UserError} If path traversal detected or file not found
   */
  async readFileContent(projectPath: string, filePath: string): Promise<FilePreviewResponse> {
    // Resolve and validate path
    const fullPath = join(projectPath, filePath);
    await validatePathSafety(projectPath, fullPath);

    // Check if file exists
    let stats;
    try {
      stats = await stat(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new UserError('File not found', 404);
      }
      throw error;
    }

    // Check if it's actually a file
    if (!stats.isFile()) {
      throw new UserError('Path is not a file', 400);
    }

    const fileName = filePath.split('/').pop() || filePath;
    const fileSize = stats.size;
    let content: string;
    let truncated = false;

    // Read file content
    if (fileSize > MAX_FILE_SIZE) {
      // Read only first 500KB for large files
      const buffer = Buffer.alloc(MAX_FILE_SIZE);
      const fd = await import('fs/promises').then((fs) => fs.open(fullPath, 'r'));
      await fd.read(buffer, 0, MAX_FILE_SIZE, 0);
      await fd.close();
      content = buffer.toString('utf8');
      truncated = true;
    } else {
      // Read entire file
      content = await readFile(fullPath, 'utf8');
    }

    // Check for binary content (null bytes in first 8KB)
    const checkSize = Math.min(content.length, BINARY_CHECK_SIZE);
    const isBinary = content.substring(0, checkSize).includes('\x00');

    if (isBinary) {
      return {
        content: '',
        fileName,
        filePath,
        language: 'binary',
        size: fileSize,
        truncated: false,
      };
    }

    // Detect language from extension
    const language = this.detectLanguage(fileName);

    return {
      content,
      fileName,
      filePath,
      language,
      size: fileSize,
      truncated,
    };
  }

  /**
   * Detects programming language from file extension
   */
  private detectLanguage(fileName: string): string {
    const ext = extname(fileName).toLowerCase();

    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.c': 'c',
      '.h': 'c',
      '.cpp': 'cpp',
      '.hpp': 'cpp',
      '.cc': 'cpp',
      '.cxx': 'cpp',
      '.rs': 'rust',
      '.py': 'python',
      '.json': 'json',
      '.md': 'markdown',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.log': 'text',
      '.txt': 'text',
    };

    return languageMap[ext] || 'text';
  }
}

// Export singleton instance
export const outputService = new OutputService();
