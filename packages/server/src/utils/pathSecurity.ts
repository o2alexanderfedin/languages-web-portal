import { realpath } from 'fs/promises';
import { lstat } from 'fs/promises';
import { resolve, sep } from 'path';
import { UserError } from '../types/errors.js';

/**
 * Validates that a target path is safely within a base directory
 * Prevents path traversal attacks by resolving to canonical paths
 *
 * @param baseDir - The base directory that should contain the target
 * @param targetPath - The path to validate
 * @throws {UserError} If path traversal is detected
 */
export async function validatePathSafety(baseDir: string, targetPath: string): Promise<void> {
  try {
    // Resolve both paths to absolute canonical paths
    const resolvedBase = resolve(baseDir);
    const resolvedTarget = resolve(targetPath);

    // Check if target path starts with base directory + separator
    // This prevents cases like /app/uploads vs /app/uploads-temp
    const basePlusSep = resolvedBase + sep;
    const isWithinBase = resolvedTarget.startsWith(basePlusSep) || resolvedTarget === resolvedBase;

    if (!isWithinBase) {
      throw new UserError('Path traversal detected: path is outside allowed directory', 403);
    }
  } catch (error) {
    if (error instanceof UserError) {
      throw error;
    }
    // If realpath fails (path doesn't exist), still validate the resolved path
    const resolvedBase = resolve(baseDir);
    const resolvedTarget = resolve(targetPath);
    const basePlusSep = resolvedBase + sep;
    const isWithinBase = resolvedTarget.startsWith(basePlusSep) || resolvedTarget === resolvedBase;

    if (!isWithinBase) {
      throw new UserError('Path traversal detected: path is outside allowed directory', 403);
    }
  }
}

/**
 * Checks if a file path is a symlink
 * Symlinks are rejected for security reasons in uploaded archives
 *
 * @param filePath - Path to check
 * @throws {UserError} If the path is a symlink
 */
export async function checkForSymlinks(filePath: string): Promise<void> {
  try {
    const stats = await lstat(filePath);
    if (stats.isSymbolicLink()) {
      throw new UserError('Symlinks are not allowed in uploaded archives', 400);
    }
  } catch (error) {
    if (error instanceof UserError) {
      throw error;
    }
    // If file doesn't exist, that's fine - we're just checking for symlinks
    // File existence will be validated elsewhere if needed
  }
}

/**
 * Validates a ZIP entry path for security issues (synchronous)
 * Checks for path traversal, null bytes, and absolute paths
 *
 * @param entryPath - The entry path from the ZIP file
 * @throws {UserError} If path contains security violations
 */
export function validateZipEntryPath(entryPath: string): void {
  // Check for null bytes
  if (entryPath.includes('\x00')) {
    throw new UserError('Null bytes are not allowed in file paths', 400);
  }

  // Check for absolute paths
  if (entryPath.startsWith('/')) {
    throw new UserError('Absolute paths are not allowed in ZIP entries', 400);
  }

  // Check for path traversal with .. as a path component
  // Split by both / and \ to handle Windows-style paths
  const pathComponents = entryPath.split(/[/\\]/);
  if (pathComponents.includes('..')) {
    throw new UserError('Path traversal (..) is not allowed in ZIP entries', 400);
  }
}
