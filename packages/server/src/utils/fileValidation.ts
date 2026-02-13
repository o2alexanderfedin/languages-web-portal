import { fileTypeFromBuffer } from 'file-type';
import { UserError } from '../types/errors.js';

/**
 * Verifies that a file buffer matches the expected MIME type using magic bytes
 * This prevents MIME type spoofing by checking actual file content, not headers
 *
 * @param buffer - The file buffer to verify
 * @param expectedMime - The expected MIME type (e.g., 'application/zip')
 * @throws {UserError} If MIME type doesn't match or cannot be detected
 */
export async function verifyFileMimeType(buffer: Buffer, expectedMime: string): Promise<void> {
  // Empty buffer check
  if (!buffer || buffer.length === 0) {
    throw new UserError('File buffer is empty', 400);
  }

  // Detect file type from magic bytes
  const fileType = await fileTypeFromBuffer(buffer);

  // If file-type cannot detect the format
  if (!fileType) {
    throw new UserError('Invalid file type: unable to detect file format', 400);
  }

  // Check if detected MIME type matches expected
  if (fileType.mime !== expectedMime) {
    throw new UserError(
      `Invalid file type: expected ${expectedMime}, got ${fileType.mime}`,
      400,
    );
  }
}
