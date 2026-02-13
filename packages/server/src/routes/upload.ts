import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import yauzl from 'yauzl';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { uploadMiddleware, handleMulterError } from '../middleware/fileUpload.js';
import { zipValidator } from '../middleware/zipValidation.js';
import { verifyFileMimeType } from '../utils/fileValidation.js';
import { validateZipEntryPath, checkForSymlinks } from '../utils/pathSecurity.js';
import { ProjectService } from '../services/projectService.js';
import { UserError } from '../types/errors.js';
import { config } from '../config/env.js';
import type { UploadResponse } from '@repo/shared';

const router = Router();

// Get project service instance (lazy initialization for testing)
function getProjectService(): ProjectService {
  const uploadDir = process.env.UPLOAD_DIR || config.uploadDir;
  return new ProjectService(uploadDir);
}

/**
 * POST /upload
 * Upload a ZIP file, validate it, and extract to isolated project directory
 */
router.post(
  '/upload',
  uploadMiddleware,
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify file exists
      if (!req.file) {
        throw new UserError('No file uploaded. Please attach a file with field name "file"', 400);
      }

      // Verify magic bytes (defense in depth after multer MIME check)
      await verifyFileMimeType(req.file.buffer, 'application/zip');

      // Validate ZIP security (bombs, traversal, etc.)
      await zipValidator(req, res, () => {}); // Use as function

      // Create isolated project directory
      const projectService = getProjectService();
      const { projectId, projectPath } = await projectService.createProjectDir();

      // Extract ZIP contents
      const fileCount = await extractZipToDirectory(req.file.buffer, projectPath);

      // Return success response
      const response: UploadResponse = {
        projectId,
        message: 'Upload successful',
        fileCount,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Extracts ZIP file contents to a target directory
 * Validates each entry for security before writing
 */
async function extractZipToDirectory(buffer: Buffer, targetDir: string): Promise<number> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return reject(new UserError('Failed to read ZIP file', 400));
      }

      if (!zipfile) {
        return reject(new UserError('Invalid ZIP file', 400));
      }

      let fileCount = 0;
      const extractionPromises: Promise<void>[] = [];

      zipfile.on('entry', (entry: yauzl.Entry) => {
        try {
          // Skip directory entries
          if (entry.fileName.endsWith('/')) {
            zipfile.readEntry();
            return;
          }

          // Validate entry path
          validateZipEntryPath(entry.fileName);

          // Prepare target path
          const targetPath = join(targetDir, entry.fileName);

          // Extract entry
          const extractPromise = new Promise<void>((resolveEntry, rejectEntry) => {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                return rejectEntry(new UserError(`Failed to read entry: ${entry.fileName}`, 400));
              }

              if (!readStream) {
                return rejectEntry(new UserError(`No stream for entry: ${entry.fileName}`, 400));
              }

              // Collect chunks
              const chunks: Buffer[] = [];
              readStream.on('data', (chunk: Buffer) => chunks.push(chunk));

              readStream.on('end', async () => {
                try {
                  const fileBuffer = Buffer.concat(chunks);

                  // Create directory structure
                  await mkdir(dirname(targetPath), { recursive: true });

                  // Write file
                  await writeFile(targetPath, fileBuffer);

                  // Verify no symlinks were created
                  await checkForSymlinks(targetPath);

                  fileCount++;
                  resolveEntry();
                } catch (error) {
                  rejectEntry(error);
                }
              });

              readStream.on('error', (error: Error) => {
                rejectEntry(new UserError(`Stream error: ${error.message}`, 400));
              });
            });
          });

          extractionPromises.push(extractPromise);

          // Continue to next entry
          zipfile.readEntry();
        } catch (error) {
          zipfile.close();
          reject(error);
        }
      });

      zipfile.on('end', async () => {
        try {
          // Wait for all extractions to complete
          await Promise.all(extractionPromises);
          resolve(fileCount);
        } catch (error) {
          reject(error);
        }
      });

      zipfile.on('error', (error: Error) => {
        reject(new UserError(`ZIP extraction error: ${error.message}`, 400));
      });

      // Start reading entries
      zipfile.readEntry();
    });
  });
}

export default router;
