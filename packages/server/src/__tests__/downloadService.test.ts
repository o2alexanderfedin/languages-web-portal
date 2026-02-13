import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { Writable } from 'stream';
import type { Response } from 'express';
import { DownloadService } from '../services/downloadService.js';

describe('DownloadService', () => {
  let testProjectDir: string;
  let downloadService: DownloadService;

  beforeEach(async () => {
    // Create a unique test directory
    testProjectDir = join(tmpdir(), `download-service-test-${Date.now()}`);
    await mkdir(testProjectDir, { recursive: true });
    downloadService = new DownloadService();
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testProjectDir, { recursive: true, force: true });
  });

  describe('streamZipDownload', () => {
    it('should stream a ZIP archive of project directory', async () => {
      // Create test files
      await writeFile(join(testProjectDir, 'file1.txt'), 'content1');
      await writeFile(join(testProjectDir, 'file2.c'), 'int main() {}');
      await mkdir(join(testProjectDir, 'subdir'));
      await writeFile(join(testProjectDir, 'subdir', 'file3.h'), '#define FOO 1');

      // Mock Express response
      const chunks: Buffer[] = [];
      const mockRes = {
        attachment: vi.fn(),
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
        write: vi.fn((chunk: Buffer) => {
          chunks.push(chunk);
          return true;
        }),
        on: vi.fn(),
        once: vi.fn(),
        emit: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as Response;

      // Make mockRes writable
      Object.setPrototypeOf(mockRes, Writable.prototype);

      await downloadService.streamZipDownload(testProjectDir, 'test-project', mockRes);

      // Verify attachment header was set
      expect(mockRes.attachment).toHaveBeenCalledWith('test-project-output.zip');

      // Verify data was written
      expect(chunks.length).toBeGreaterThan(0);

      // Verify total bytes
      const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      expect(totalBytes).toBeGreaterThan(0);
    });

    it('should handle empty directory', async () => {
      const chunks: Buffer[] = [];
      const mockRes = {
        attachment: vi.fn(),
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
        write: vi.fn((chunk: Buffer) => {
          chunks.push(chunk);
          return true;
        }),
        on: vi.fn(),
        once: vi.fn(),
        emit: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as Response;

      Object.setPrototypeOf(mockRes, Writable.prototype);

      await downloadService.streamZipDownload(testProjectDir, 'empty-project', mockRes);

      expect(mockRes.attachment).toHaveBeenCalledWith('empty-project-output.zip');
      expect(chunks.length).toBeGreaterThan(0); // ZIP header is still written
    });
  });
});
