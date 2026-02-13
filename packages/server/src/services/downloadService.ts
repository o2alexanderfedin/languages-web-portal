import archiver from 'archiver';
import type { Response } from 'express';
import { stat } from 'fs/promises';

/**
 * Service for creating and streaming ZIP downloads of project directories
 */
export class DownloadService {
  /**
   * Streams a ZIP archive of a project directory to the response
   *
   * @param projectPath - Absolute path to the project directory
   * @param projectId - Project identifier for the ZIP filename
   * @param res - Express response object
   * @throws {Error} If project directory doesn't exist (ENOENT)
   */
  async streamZipDownload(projectPath: string, projectId: string, res: Response): Promise<void> {
    // Verify directory exists before attempting to stream
    await stat(projectPath);

    // Create archiver instance with compression level 6 (balanced)
    const archive = archiver('zip', {
      zlib: { level: 6 },
    });

    // Set response headers for download
    res.attachment(`${projectId}-output.zip`);

    // Track total bytes for logging
    let totalBytes = 0;

    // Listen for archive errors
    archive.on('error', (err) => {
      console.error('[download] Archive error:', err);
      res.status(500).end();
    });

    // Track bytes written
    archive.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add entire directory to archive (false = don't include parent directory)
    archive.directory(projectPath, false);

    // Finalize the archive (important - this triggers the actual compression)
    await archive.finalize();

    console.log(`[download] Streamed ${totalBytes} bytes for project ${projectId}`);
  }
}

// Export singleton instance
export const downloadService = new DownloadService();
