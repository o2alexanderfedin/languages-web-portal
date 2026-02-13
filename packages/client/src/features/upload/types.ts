/**
 * Upload feature types
 */

// Re-export shared types
export type {
  UploadResponse,
  ExampleInfo,
  ExampleLoadResponse,
} from '@repo/shared';

// Re-export constants
export { MAX_UPLOAD_SIZE } from '@repo/shared';

/**
 * Upload state for UI
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error';
