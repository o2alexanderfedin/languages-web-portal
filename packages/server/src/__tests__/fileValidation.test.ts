import { describe, it, expect } from 'vitest';
import { verifyFileMimeType } from '../utils/fileValidation.js';
import { UserError } from '../types/errors.js';

describe('File Validation Utilities', () => {
  describe('verifyFileMimeType', () => {
    it('should accept valid ZIP files with PK magic bytes', async () => {
      // Create a minimal valid ZIP file buffer
      // ZIP files start with PK\x03\x04 (0x504b0304)
      const zipBuffer = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, // PK magic bytes (local file header signature)
        0x0a, 0x00, // version needed to extract
        0x00, 0x00, // general purpose bit flag
        0x00, 0x00, // compression method (stored)
        0x00, 0x00, // last mod time
        0x00, 0x00, // last mod date
        0x00, 0x00, 0x00, 0x00, // crc-32
        0x00, 0x00, 0x00, 0x00, // compressed size
        0x00, 0x00, 0x00, 0x00, // uncompressed size
        0x00, 0x00, // file name length
        0x00, 0x00, // extra field length
      ]);

      await expect(verifyFileMimeType(zipBuffer, 'application/zip')).resolves.not.toThrow();
    });

    it('should reject non-ZIP files', async () => {
      // PNG file with complete header (file-type needs ~12+ bytes for detection)
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A + IHDR chunk start
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      ]);

      await expect(verifyFileMimeType(pngBuffer, 'application/zip')).rejects.toThrow(UserError);
      await expect(verifyFileMimeType(pngBuffer, 'application/zip')).rejects.toThrow('Invalid file type');
    });

    it('should reject plain text as ZIP', async () => {
      const textBuffer = Buffer.from('This is plain text, not a ZIP file');

      await expect(verifyFileMimeType(textBuffer, 'application/zip')).rejects.toThrow(UserError);
    });

    it('should reject empty buffers', async () => {
      const emptyBuffer = Buffer.from([]);

      await expect(verifyFileMimeType(emptyBuffer, 'application/zip')).rejects.toThrow(UserError);
    });

    it('should handle very small buffers', async () => {
      const tinyBuffer = Buffer.from([0x50, 0x4b]); // Only PK, not full magic

      await expect(verifyFileMimeType(tinyBuffer, 'application/zip')).rejects.toThrow(UserError);
    });
  });
});
