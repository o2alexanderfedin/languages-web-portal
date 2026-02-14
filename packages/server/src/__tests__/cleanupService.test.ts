import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, access, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { CleanupService } from '../services/cleanupService.js';

describe('CleanupService', () => {
  let testBaseDir: string;
  let cleanupService: CleanupService;

  beforeEach(async () => {
    // Create a unique test directory
    testBaseDir = join(tmpdir(), `cleanup-service-test-${Date.now()}`);
    await mkdir(testBaseDir, { recursive: true });
    cleanupService = new CleanupService();
  });

  afterEach(async () => {
    // Clean up any pending timers
    await cleanupService.shutdown();
    // Clean up test directory
    await rm(testBaseDir, { recursive: true, force: true });
  });

  describe('scheduleCleanup', () => {
    it('should schedule cleanup and mark as scheduled', async () => {
      const projectId = 'test-project';
      const projectPath = join(testBaseDir, projectId);
      await mkdir(projectPath);

      cleanupService.scheduleCleanup(projectId, projectPath, 100);

      expect(cleanupService.isScheduled(projectId)).toBe(true);
      expect(cleanupService.getScheduledCount()).toBe(1);
    });

    it('should delete directory after delay', async () => {
      const projectId = 'test-project';
      const projectPath = join(testBaseDir, projectId);
      await mkdir(projectPath);
      await writeFile(join(projectPath, 'test.txt'), 'content');

      // Schedule cleanup with 100ms delay
      cleanupService.scheduleCleanup(projectId, projectPath, 100);

      // Directory should exist immediately
      await expect(access(projectPath)).resolves.not.toThrow();

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 150));

      // Directory should be gone (access() rejects for non-existent paths)
      await expect(access(projectPath)).rejects.toThrow();
      expect(cleanupService.isScheduled(projectId)).toBe(false);
    });

    it('should replace existing timer when called twice', async () => {
      const projectId = 'test-project';
      const projectPath = join(testBaseDir, projectId);
      await mkdir(projectPath);

      // Schedule first cleanup
      cleanupService.scheduleCleanup(projectId, projectPath, 1000);
      expect(cleanupService.getScheduledCount()).toBe(1);

      // Schedule again (should replace)
      cleanupService.scheduleCleanup(projectId, projectPath, 2000);
      expect(cleanupService.getScheduledCount()).toBe(1);
    });

    it('should handle multiple scheduled cleanups', async () => {
      const project1 = 'project-1';
      const project2 = 'project-2';
      const path1 = join(testBaseDir, project1);
      const path2 = join(testBaseDir, project2);

      await mkdir(path1);
      await mkdir(path2);

      cleanupService.scheduleCleanup(project1, path1, 100);
      cleanupService.scheduleCleanup(project2, path2, 100);

      expect(cleanupService.getScheduledCount()).toBe(2);
      expect(cleanupService.isScheduled(project1)).toBe(true);
      expect(cleanupService.isScheduled(project2)).toBe(true);
    });
  });

  describe('cancelCleanup', () => {
    it('should cancel scheduled cleanup', async () => {
      const projectId = 'test-project';
      const projectPath = join(testBaseDir, projectId);
      await mkdir(projectPath);

      cleanupService.scheduleCleanup(projectId, projectPath, 100);
      expect(cleanupService.isScheduled(projectId)).toBe(true);

      cleanupService.cancelCleanup(projectId);
      expect(cleanupService.isScheduled(projectId)).toBe(false);
      expect(cleanupService.getScheduledCount()).toBe(0);

      // Wait to ensure cleanup doesn't happen
      await new Promise(resolve => setTimeout(resolve, 150));

      // Directory should still exist
      await expect(access(projectPath)).resolves.not.toThrow();
    });

    it('should do nothing when cancelling non-existent cleanup', () => {
      // Should not throw
      expect(() => cleanupService.cancelCleanup('nonexistent')).not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should clear all scheduled timers', async () => {
      const project1 = 'project-1';
      const project2 = 'project-2';
      const path1 = join(testBaseDir, project1);
      const path2 = join(testBaseDir, project2);

      await mkdir(path1);
      await mkdir(path2);

      cleanupService.scheduleCleanup(project1, path1, 1000);
      cleanupService.scheduleCleanup(project2, path2, 1000);

      expect(cleanupService.getScheduledCount()).toBe(2);

      await cleanupService.shutdown();

      expect(cleanupService.getScheduledCount()).toBe(0);
      expect(cleanupService.isScheduled(project1)).toBe(false);
      expect(cleanupService.isScheduled(project2)).toBe(false);
    });

    it('should not execute immediate cleanup on shutdown', async () => {
      const projectId = 'test-project';
      const projectPath = join(testBaseDir, projectId);
      await mkdir(projectPath);

      cleanupService.scheduleCleanup(projectId, projectPath, 1000);
      await cleanupService.shutdown();

      // Directory should still exist (not immediately cleaned)
      await expect(access(projectPath)).resolves.not.toThrow();
    });
  });

  describe('getScheduledCount', () => {
    it('should return correct count', async () => {
      expect(cleanupService.getScheduledCount()).toBe(0);

      const path1 = join(testBaseDir, 'p1');
      await mkdir(path1);
      cleanupService.scheduleCleanup('p1', path1, 1000);
      expect(cleanupService.getScheduledCount()).toBe(1);

      const path2 = join(testBaseDir, 'p2');
      await mkdir(path2);
      cleanupService.scheduleCleanup('p2', path2, 1000);
      expect(cleanupService.getScheduledCount()).toBe(2);

      cleanupService.cancelCleanup('p1');
      expect(cleanupService.getScheduledCount()).toBe(1);
    });
  });

  describe('isScheduled', () => {
    it('should return true for scheduled project', async () => {
      const projectPath = join(testBaseDir, 'test');
      await mkdir(projectPath);
      cleanupService.scheduleCleanup('test', projectPath, 1000);

      expect(cleanupService.isScheduled('test')).toBe(true);
    });

    it('should return false for non-scheduled project', () => {
      expect(cleanupService.isScheduled('nonexistent')).toBe(false);
    });
  });
});
