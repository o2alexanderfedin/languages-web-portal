import yauzl from 'yauzl';
import { validateZipEntryPath } from '../utils/pathSecurity.js';
import { UserError, ValidationError } from '../types/errors.js';
import type { Request, Response, NextFunction } from 'express';

// ZIP security limits
const MAX_ENTRIES = 1000;
const MAX_ENTRY_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_COMPRESSION_RATIO = 100;

interface ZipEntry {
  fileName: string;
  uncompressedSize: number;
  compressedSize: number;
}

/**
 * Validates ZIP file security constraints
 * Checks for zip bombs, path traversal, and other malicious content
 */
export async function zipValidator(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file || !req.file.buffer) {
      throw new UserError('No file provided', 400);
    }

    const zipBuffer = req.file.buffer;

    // Parse ZIP file from buffer
    await validateZipSecurity(zipBuffer);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates ZIP file security
 * Checks entry count, sizes, compression ratios, and path safety
 */
async function validateZipSecurity(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return reject(new UserError('Invalid ZIP file format', 400));
      }

      if (!zipfile) {
        return reject(new UserError('Failed to read ZIP file', 400));
      }

      let entryCount = 0;
      let totalUncompressedSize = 0;
      const entries: ZipEntry[] = [];

      zipfile.on('entry', (entry: yauzl.Entry) => {
        try {
          entryCount++;

          // Check max entries
          if (entryCount > MAX_ENTRIES) {
            zipfile.close();
            return reject(
              new ValidationError(
                `ZIP file contains too many entries (max: ${MAX_ENTRIES})`,
              ),
            );
          }

          // Skip directory entries
          if (entry.fileName.endsWith('/')) {
            zipfile.readEntry();
            return;
          }

          // Validate entry path for security
          validateZipEntryPath(entry.fileName);

          const uncompressedSize = entry.uncompressedSize;
          const compressedSize = entry.compressedSize;

          // Check individual entry size
          if (uncompressedSize > MAX_ENTRY_SIZE) {
            zipfile.close();
            return reject(
              new ValidationError(
                `Entry "${entry.fileName}" is too large (max: ${MAX_ENTRY_SIZE} bytes)`,
              ),
            );
          }

          // Check compression ratio (zip bomb detection)
          if (compressedSize > 0) {
            const ratio = uncompressedSize / compressedSize;
            if (ratio > MAX_COMPRESSION_RATIO) {
              zipfile.close();
              return reject(
                new ValidationError(
                  `Suspicious compression ratio detected in "${entry.fileName}" (possible zip bomb)`,
                ),
              );
            }
          }

          totalUncompressedSize += uncompressedSize;

          // Check total uncompressed size
          if (totalUncompressedSize > MAX_TOTAL_SIZE) {
            zipfile.close();
            return reject(
              new ValidationError(
                `Total uncompressed size exceeds limit (max: ${MAX_TOTAL_SIZE} bytes)`,
              ),
            );
          }

          entries.push({
            fileName: entry.fileName,
            uncompressedSize,
            compressedSize,
          });

          // Continue to next entry
          zipfile.readEntry();
        } catch (error) {
          zipfile.close();
          reject(error);
        }
      });

      zipfile.on('end', () => {
        resolve();
      });

      zipfile.on('error', (error: Error) => {
        reject(new UserError(`ZIP file error: ${error.message}`, 400));
      });

      // Start reading entries
      zipfile.readEntry();
    });
  });
}
