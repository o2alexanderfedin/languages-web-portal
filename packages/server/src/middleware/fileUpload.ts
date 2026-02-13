import multer from 'multer';
import { MAX_UPLOAD_SIZE, ALLOWED_MIME_TYPES } from '@repo/shared';
import { UserError } from '../types/errors.js';
import type { Request, Response, NextFunction } from 'express';

/**
 * Multer configuration for file uploads
 * Uses memory storage for validation before disk write
 */
const storage = multer.memoryStorage();

/**
 * File filter to restrict uploads to ZIP files only
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new UserError(`Invalid MIME type. Only ZIP files are allowed`, 400));
  }
};

/**
 * Configured multer instance
 */
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Multer middleware for single file upload
 * Expects field name 'file'
 */
export const uploadMiddleware = upload.single('file');

/**
 * Handle multer errors and convert to appropriate error types
 */
export function handleMulterError(
  error: Error,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(
        new UserError(`File too large. Maximum size is ${MAX_UPLOAD_SIZE} bytes`, 413),
      );
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new UserError('Only one file can be uploaded at a time', 400));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new UserError('Unexpected field name. Use "file" as field name', 400));
    }
    return next(new UserError(`Upload error: ${error.message}`, 400));
  }
  next(error);
}
