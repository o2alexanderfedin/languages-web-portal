/**
 * Shared upload configuration and types
 */

/**
 * Maximum upload file size (100MB)
 */
export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

/**
 * Allowed MIME types for upload
 */
export const ALLOWED_MIME_TYPES = ['application/zip', 'application/x-zip-compressed'] as const;

/**
 * Upload response structure
 */
export interface UploadResponse {
  projectId: string;
  message: string;
  fileCount: number;
}

/**
 * Upload configuration
 */
export interface UploadConfig {
  maxSize: number;
  allowedTypes: readonly string[];
}

/**
 * Example project information
 */
export interface ExampleInfo {
  name: string;
  description: string;
}

/**
 * Example load response
 */
export interface ExampleLoadResponse {
  projectId: string;
  message: string;
  fileCount: number;
  toolId: string;
  exampleName: string;
}
