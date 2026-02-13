import { mkdir, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validatePathSafety } from '../utils/pathSecurity.js';

/**
 * Service for managing isolated project directories
 * Each project gets a UUID-based directory for secure file isolation
 */
export class ProjectService {
  private baseDir: string;

  /**
   * Creates a new ProjectService
   * @param baseDir - Base directory for all project directories
   */
  constructor(baseDir: string) {
    this.baseDir = resolve(baseDir);
    this.ensureBaseDir();
  }

  /**
   * Ensures the base directory exists
   */
  private async ensureBaseDir(): Promise<void> {
    try {
      await mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create base directory:', error);
      // Don't throw - allow creation to happen later
    }
  }

  /**
   * Creates a new project directory with a unique UUID
   * @returns Object containing project ID and full path
   */
  async createProjectDir(): Promise<{ projectId: string; projectPath: string }> {
    const projectId = uuidv4();
    const projectPath = join(this.baseDir, projectId);

    await mkdir(projectPath, { recursive: true });

    return { projectId, projectPath };
  }

  /**
   * Gets the full path for a project ID
   * Validates that the path is within the base directory
   *
   * @param projectId - The project UUID
   * @returns The full project path
   * @throws {UserError} If path traversal is detected
   */
  async getProjectPath(projectId: string): Promise<string> {
    const projectPath = join(this.baseDir, projectId);
    await validatePathSafety(this.baseDir, projectPath);
    return projectPath;
  }

  /**
   * Removes a project directory and all its contents
   * Validates path safety before deletion
   *
   * @param projectId - The project UUID to remove
   * @throws {UserError} If path traversal is detected
   */
  async cleanupProjectDir(projectId: string): Promise<void> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      await rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to cleanup project directory:', error);
      }
    }
  }
}
