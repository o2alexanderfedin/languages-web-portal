import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, access, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ProjectService } from '../services/projectService.js';
import { UserError } from '../types/errors.js';
import { validate as isUUID } from 'uuid';

describe('ProjectService', () => {
  let testBaseDir: string;
  let projectService: ProjectService;

  beforeEach(async () => {
    // Create a unique test directory in system temp
    testBaseDir = join(tmpdir(), `project-service-test-${Date.now()}`);
    await mkdir(testBaseDir, { recursive: true });
    projectService = new ProjectService(testBaseDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testBaseDir, { recursive: true, force: true });
  });

  describe('createProjectDir', () => {
    it('should create a project directory with valid UUID', async () => {
      const result = await projectService.createProjectDir();

      expect(result).toHaveProperty('projectId');
      expect(result).toHaveProperty('projectPath');
      expect(isUUID(result.projectId)).toBe(true);
      expect(result.projectPath).toContain(testBaseDir);

      // Verify directory was actually created
      await expect(access(result.projectPath)).resolves.not.toThrow();
    });

    it('should create unique directories for multiple calls', async () => {
      const result1 = await projectService.createProjectDir();
      const result2 = await projectService.createProjectDir();

      expect(result1.projectId).not.toBe(result2.projectId);
      expect(result1.projectPath).not.toBe(result2.projectPath);

      // Both should exist
      await expect(access(result1.projectPath)).resolves.not.toThrow();
      await expect(access(result2.projectPath)).resolves.not.toThrow();
    });
  });

  describe('cleanupProjectDir', () => {
    it('should remove an existing project directory', async () => {
      const { projectId, projectPath } = await projectService.createProjectDir();

      // Create a file inside to verify recursive removal
      await writeFile(join(projectPath, 'test.txt'), 'content');

      await projectService.cleanupProjectDir(projectId);

      // Verify directory is gone
      await expect(access(projectPath)).rejects.toThrow();
    });

    it('should reject path traversal attempts', async () => {
      // Try to clean a directory outside the base using ../
      const maliciousId = '../../../etc';

      await expect(projectService.cleanupProjectDir(maliciousId)).rejects.toThrow(UserError);
    });

    it('should handle non-existent project ID gracefully', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      // Should not throw even if directory doesn't exist
      await expect(projectService.cleanupProjectDir(fakeId)).resolves.not.toThrow();
    });
  });

  describe('getProjectPath', () => {
    it('should return valid path for existing project', async () => {
      const { projectId, projectPath: expectedPath } = await projectService.createProjectDir();

      const returnedPath = await projectService.getProjectPath(projectId);

      expect(returnedPath).toBe(expectedPath);
      expect(returnedPath).toContain(testBaseDir);
    });

    it('should reject path traversal in project ID', async () => {
      const maliciousId = '../../../tmp/evil';

      await expect(projectService.getProjectPath(maliciousId)).rejects.toThrow(UserError);
    });

    it('should return path even if directory does not exist yet', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';

      const path = await projectService.getProjectPath(fakeId);

      expect(path).toContain(testBaseDir);
      expect(path).toContain(fakeId);
    });
  });
});
