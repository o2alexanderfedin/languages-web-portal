import { readdir, readFile, cp } from 'fs/promises';
import { join, resolve } from 'path';
import { TOOLS } from '@repo/shared';
import type { ExampleInfo, Tool } from '@repo/shared';
import { NotFoundError, UserError } from '../types/errors.js';

/**
 * Service for managing and loading example projects
 */
export class ExampleService {
  private examplesDir: string;

  /**
   * Creates a new ExampleService
   * @param examplesDir - Base directory containing example projects (defaults to packages/server/examples)
   */
  constructor(examplesDir?: string) {
    this.examplesDir = examplesDir
      ? resolve(examplesDir)
      : resolve(import.meta.dirname, '../../examples');
  }

  /**
   * Gets list of available examples for a tool
   * @param toolId - The tool identifier
   * @returns Array of example information
   * @throws {NotFoundError} If tool doesn't exist
   */
  async getToolExamples(toolId: string): Promise<ExampleInfo[]> {
    // Validate toolId against known tools
    const tool = TOOLS.find((t: Tool) => t.id === toolId);
    if (!tool) {
      throw new NotFoundError(`Tool not found: ${toolId}`);
    }

    const toolExamplesDir = join(this.examplesDir, toolId);

    try {
      const entries = await readdir(toolExamplesDir, { withFileTypes: true });
      const examples: ExampleInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const exampleName = entry.name;
          const readmePath = join(toolExamplesDir, exampleName, 'README.md');

          let description = exampleName;
          try {
            const readmeContent = await readFile(readmePath, 'utf-8');
            // Extract first non-empty line after heading as description
            const lines = readmeContent.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('#')) {
                description = trimmed;
                break;
              }
            }
          } catch {
            // No README or error reading it - use name as description
          }

          examples.push({ name: exampleName, description });
        }
      }

      return examples;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Directory doesn't exist - return empty array
        return [];
      }
      throw error;
    }
  }

  /**
   * Loads an example project into a target directory
   * @param toolId - The tool identifier
   * @param exampleName - The example name
   * @param targetDir - The target directory to copy files into
   * @returns Number of files copied
   * @throws {NotFoundError} If tool or example doesn't exist
   * @throws {UserError} If path traversal is detected
   */
  async loadExample(
    toolId: string,
    exampleName: string,
    targetDir: string,
  ): Promise<number> {
    // Validate toolId
    const tool = TOOLS.find((t: Tool) => t.id === toolId);
    if (!tool) {
      throw new NotFoundError(`Tool not found: ${toolId}`);
    }

    // Validate exampleName (prevent path traversal)
    if (
      exampleName.includes('..') ||
      exampleName.includes('/') ||
      exampleName.includes('\\') ||
      exampleName.includes('\0')
    ) {
      throw new UserError(
        'Invalid example name: path traversal not allowed',
        400,
      );
    }

    const examplePath = join(this.examplesDir, toolId, exampleName);

    // Verify example exists
    try {
      const entries = await readdir(examplePath);
      if (entries.length === 0) {
        throw new NotFoundError(
          `Example '${exampleName}' for tool '${toolId}' is empty`,
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(
          `Example '${exampleName}' not found for tool '${toolId}'`,
        );
      }
      throw error;
    }

    // Copy example to target directory
    await cp(examplePath, targetDir, { recursive: true });

    // Count files (recursively)
    const fileCount = await this.countFiles(targetDir);

    return fileCount;
  }

  /**
   * Recursively counts files in a directory
   * @param dirPath - Directory to count files in
   * @returns Total number of files
   */
  private async countFiles(dirPath: string): Promise<number> {
    let count = 0;
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += await this.countFiles(join(dirPath, entry.name));
      } else if (entry.isFile()) {
        count++;
      }
    }

    return count;
  }
}
