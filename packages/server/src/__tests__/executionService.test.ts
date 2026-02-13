import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ExecutionService } from '../services/executionService.js';
import { NotFoundError, UserError } from '../types/errors.js';
import * as toolRegistry from '../config/toolRegistry.js';

describe('ExecutionService', () => {
  let executionService: ExecutionService;
  let testProjectDir: string;

  beforeEach(async () => {
    executionService = new ExecutionService();

    // Create test project directory
    testProjectDir = join(tmpdir(), `exec-test-${Date.now()}`);
    await mkdir(testProjectDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testProjectDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('executeJob', () => {
    it('should execute tool successfully and return completed status', async () => {
      // Mock getToolConfig to return a simple echo command
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: 'echo',
        defaultArgs: ['hello world'],
        maxExecutionTimeMs: 5000,
        available: true,
      });

      const result = await executionService.executeJob({
        toolId: 'test-tool',
        projectPath: testProjectDir,
        jobId: 'test-job-1',
      });

      expect(result.status).toBe('completed');
      expect(result.exitCode).toBe(0);
      expect(result.jobId).toBe('test-job-1');
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.output.join('')).toContain('hello world');
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('should handle timeout and return timeout status', async () => {
      // Mock getToolConfig with short timeout and long-running command
      // Use node with a setTimeout that exceeds the timeout limit
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: 'node',
        defaultArgs: ['-e', 'setTimeout(() => {}, 10000)'], // 10s wait
        maxExecutionTimeMs: 500, // 500ms timeout
        available: true,
      });

      const result = await executionService.executeJob({
        toolId: 'test-tool',
        projectPath: testProjectDir,
        jobId: 'test-job-2',
      });

      expect(result.status).toBe('timeout');
      expect(result.jobId).toBe('test-job-2');
      expect(result.durationMs).toBeLessThan(1000); // Should timeout quickly
    });

    it('should handle non-zero exit code and return failed status', async () => {
      // Mock getToolConfig with command that exits with code 1
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: 'node',
        defaultArgs: ['-e', 'process.exit(1)'],
        maxExecutionTimeMs: 5000,
        available: true,
      });

      const result = await executionService.executeJob({
        toolId: 'test-tool',
        projectPath: testProjectDir,
        jobId: 'test-job-3',
      });

      expect(result.status).toBe('failed');
      expect(result.exitCode).toBe(1);
      expect(result.jobId).toBe('test-job-3');
    });

    it('should accumulate multi-line output correctly', async () => {
      // Mock getToolConfig with command that produces multi-line output
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: 'node',
        defaultArgs: ['-e', 'console.log("line1"); console.log("line2"); console.log("line3");'],
        maxExecutionTimeMs: 5000,
        available: true,
      });

      const result = await executionService.executeJob({
        toolId: 'test-tool',
        projectPath: testProjectDir,
        jobId: 'test-job-4',
      });

      expect(result.status).toBe('completed');
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);

      const outputText = result.output.join('');
      expect(outputText).toContain('line1');
      expect(outputText).toContain('line2');
      expect(outputText).toContain('line3');
    });

    it('should call onOutput callback for each line', async () => {
      // Mock getToolConfig
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: 'echo',
        defaultArgs: ['test output'],
        maxExecutionTimeMs: 5000,
        available: true,
      });

      const outputLines: string[] = [];
      const onOutput = (line: string) => {
        outputLines.push(line);
      };

      await executionService.executeJob({
        toolId: 'test-tool',
        projectPath: testProjectDir,
        jobId: 'test-job-5',
        onOutput,
      });

      expect(outputLines.length).toBeGreaterThan(0);
      expect(outputLines.join('')).toContain('test output');
    });

    it('should throw NotFoundError for unknown tool ID', async () => {
      // Mock getToolConfig to return undefined (tool not found)
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue(undefined);

      await expect(
        executionService.executeJob({
          toolId: 'nonexistent-tool',
          projectPath: testProjectDir,
          jobId: 'test-job-6',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UserError for unavailable tool', async () => {
      // Mock getToolConfig to return unavailable tool
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: '/usr/local/bin/unavailable',
        defaultArgs: ['--input'],
        maxExecutionTimeMs: 5000,
        available: false, // Tool not available
      });

      await expect(
        executionService.executeJob({
          toolId: 'test-tool',
          projectPath: testProjectDir,
          jobId: 'test-job-7',
        })
      ).rejects.toThrow(UserError);

      await expect(
        executionService.executeJob({
          toolId: 'test-tool',
          projectPath: testProjectDir,
          jobId: 'test-job-7',
        })
      ).rejects.toThrow('Tool is not available');
    });

    it('should throw NotFoundError for non-existent project path', async () => {
      // Mock getToolConfig
      vi.spyOn(toolRegistry, 'getToolConfig').mockReturnValue({
        id: 'test-tool',
        command: 'echo',
        defaultArgs: ['test'],
        maxExecutionTimeMs: 5000,
        available: true,
      });

      const nonExistentPath = join(tmpdir(), 'does-not-exist-12345');

      await expect(
        executionService.executeJob({
          toolId: 'test-tool',
          projectPath: nonExistentPath,
          jobId: 'test-job-8',
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        executionService.executeJob({
          toolId: 'test-tool',
          projectPath: nonExistentPath,
          jobId: 'test-job-8',
        })
      ).rejects.toThrow('Project directory not found');
    });
  });
});
