import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, symlink, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { validatePathSafety, checkForSymlinks, validateZipEntryPath } from '../utils/pathSecurity.js';
import { UserError } from '../types/errors.js';

describe('Path Security Utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory in system temp
    testDir = join(tmpdir(), `path-security-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('validatePathSafety', () => {
    it('should accept valid subpaths', async () => {
      const validPath = join(testDir, 'subfolder', 'file.txt');
      await expect(validatePathSafety(testDir, validPath)).resolves.not.toThrow();
    });

    it('should reject path traversal with ../', async () => {
      const maliciousPath = join(testDir, '..', 'etc', 'passwd');
      await expect(validatePathSafety(testDir, maliciousPath)).rejects.toThrow(UserError);
      await expect(validatePathSafety(testDir, maliciousPath)).rejects.toThrow('Path traversal detected');
    });

    it('should reject absolute paths outside base directory', async () => {
      const outsidePath = '/tmp/malicious/file.txt';
      await expect(validatePathSafety(testDir, outsidePath)).rejects.toThrow(UserError);
    });

    it('should accept paths that normalize within base', async () => {
      // Create actual subdirectory for this test
      const subDir = join(testDir, 'sub');
      await mkdir(subDir, { recursive: true });

      // Path that uses .. but stays within base: testDir/sub/../file.txt -> testDir/file.txt
      const normalizedPath = join(testDir, 'sub', '..', 'file.txt');
      await expect(validatePathSafety(testDir, normalizedPath)).resolves.not.toThrow();
    });
  });

  describe('checkForSymlinks', () => {
    it('should reject symlinks', async () => {
      const targetFile = join(testDir, 'target.txt');
      const symlinkPath = join(testDir, 'symlink.txt');

      await writeFile(targetFile, 'content');
      await symlink(targetFile, symlinkPath);

      await expect(checkForSymlinks(symlinkPath)).rejects.toThrow(UserError);
      await expect(checkForSymlinks(symlinkPath)).rejects.toThrow('Symlinks are not allowed');
    });

    it('should accept regular files', async () => {
      const regularFile = join(testDir, 'regular.txt');
      await writeFile(regularFile, 'content');

      await expect(checkForSymlinks(regularFile)).resolves.not.toThrow();
    });

    it('should accept directories', async () => {
      const subDir = join(testDir, 'subdir');
      await mkdir(subDir);

      await expect(checkForSymlinks(subDir)).resolves.not.toThrow();
    });
  });

  describe('validateZipEntryPath', () => {
    it('should accept valid relative paths', () => {
      expect(() => validateZipEntryPath('folder/file.txt')).not.toThrow();
      expect(() => validateZipEntryPath('file.txt')).not.toThrow();
      expect(() => validateZipEntryPath('deeply/nested/folder/file.ts')).not.toThrow();
    });

    it('should reject paths with .. components', () => {
      expect(() => validateZipEntryPath('../file.txt')).toThrow(UserError);
      expect(() => validateZipEntryPath('folder/../../../etc/passwd')).toThrow(UserError);
      expect(() => validateZipEntryPath('folder/..file.txt')).not.toThrow(); // ..file.txt is a valid filename
    });

    it('should reject paths with null bytes', () => {
      expect(() => validateZipEntryPath('file\x00.txt')).toThrow(UserError);
      expect(() => validateZipEntryPath('folder/\x00malicious.txt')).toThrow(UserError);
    });

    it('should reject absolute paths', () => {
      expect(() => validateZipEntryPath('/etc/passwd')).toThrow(UserError);
      expect(() => validateZipEntryPath('/absolute/path/file.txt')).toThrow(UserError);
    });

    it('should accept paths starting with ./ (relative)', () => {
      expect(() => validateZipEntryPath('./folder/file.txt')).not.toThrow();
    });
  });
});
