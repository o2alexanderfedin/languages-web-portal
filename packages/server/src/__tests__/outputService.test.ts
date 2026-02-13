import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { OutputService } from '../services/outputService.js';
import { UserError } from '../types/errors.js';

describe('OutputService', () => {
  let testProjectDir: string;
  let outputService: OutputService;

  beforeEach(async () => {
    // Create a unique test directory
    testProjectDir = join(tmpdir(), `output-service-test-${Date.now()}`);
    await mkdir(testProjectDir, { recursive: true });
    outputService = new OutputService();
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testProjectDir, { recursive: true, force: true });
  });

  describe('buildFileTree', () => {
    it('should build file tree for directory with files', async () => {
      // Create test structure
      await writeFile(join(testProjectDir, 'file1.txt'), 'content1');
      await writeFile(join(testProjectDir, 'file2.c'), 'content2');
      await mkdir(join(testProjectDir, 'subdir'));
      await writeFile(join(testProjectDir, 'subdir', 'file3.h'), 'content3');

      const result = await outputService.buildFileTree(testProjectDir);

      expect(result.rootId).toBe('root');
      expect(result.tree['root']).toEqual({
        id: 'root',
        name: '/',
        isDirectory: true,
        children: expect.any(Array),
        path: '',
      });

      // Check that children exist
      expect(result.tree['root'].children).toHaveLength(3);

      // Check file nodes
      const file1 = result.tree['file1.txt'];
      expect(file1).toMatchObject({
        id: 'file1.txt',
        name: 'file1.txt',
        isDirectory: false,
        path: 'file1.txt',
        extension: '.txt',
        size: expect.any(Number),
      });

      // Check directory node
      const subdir = result.tree['subdir'];
      expect(subdir).toMatchObject({
        id: 'subdir',
        name: 'subdir',
        isDirectory: true,
        path: 'subdir',
        children: expect.any(Array),
      });
    });

    it('should sort children with directories first, then alphabetically', async () => {
      // Create files and directories in mixed order
      await writeFile(join(testProjectDir, 'zebra.txt'), 'z');
      await writeFile(join(testProjectDir, 'alpha.txt'), 'a');
      await mkdir(join(testProjectDir, 'zoo'));
      await mkdir(join(testProjectDir, 'apple'));

      const result = await outputService.buildFileTree(testProjectDir);

      const rootChildren = result.tree['root'].children!;
      const childNames = rootChildren.map(id => result.tree[id].name);

      // Directories (apple, zoo) should come before files (alpha.txt, zebra.txt)
      expect(childNames).toEqual(['apple', 'zoo', 'alpha.txt', 'zebra.txt']);
    });

    it('should handle empty directory', async () => {
      const result = await outputService.buildFileTree(testProjectDir);

      expect(result.tree['root'].children).toEqual([]);
    });

    it('should normalize path separators to forward slash', async () => {
      await mkdir(join(testProjectDir, 'sub1', 'sub2'), { recursive: true });
      await writeFile(join(testProjectDir, 'sub1', 'sub2', 'file.txt'), 'content');

      const result = await outputService.buildFileTree(testProjectDir);

      // Check that paths use forward slash
      expect(result.tree['sub1/sub2/file.txt']).toBeDefined();
      expect(result.tree['sub1/sub2/file.txt'].path).toBe('sub1/sub2/file.txt');
    });
  });

  describe('readFileContent', () => {
    it('should read text file content', async () => {
      const content = 'Hello, world!';
      await writeFile(join(testProjectDir, 'test.txt'), content);

      const result = await outputService.readFileContent(testProjectDir, 'test.txt');

      expect(result).toMatchObject({
        content,
        fileName: 'test.txt',
        filePath: 'test.txt',
        language: 'text',
        size: content.length,
        truncated: false,
      });
    });

    it('should detect language from file extension', async () => {
      const testCases = [
        { file: 'test.ts', language: 'typescript' },
        { file: 'test.js', language: 'javascript' },
        { file: 'test.c', language: 'c' },
        { file: 'test.cpp', language: 'cpp' },
        { file: 'test.rs', language: 'rust' },
        { file: 'test.py', language: 'python' },
        { file: 'test.json', language: 'json' },
        { file: 'test.md', language: 'markdown' },
        { file: 'test.yaml', language: 'yaml' },
        { file: 'test.log', language: 'text' },
      ];

      for (const { file, language } of testCases) {
        await writeFile(join(testProjectDir, file), 'content');
        const result = await outputService.readFileContent(testProjectDir, file);
        expect(result.language).toBe(language);
      }
    });

    it('should truncate files larger than 500KB', async () => {
      const largeContent = 'x'.repeat(600 * 1024); // 600KB
      await writeFile(join(testProjectDir, 'large.txt'), largeContent);

      const result = await outputService.readFileContent(testProjectDir, 'large.txt');

      expect(result.truncated).toBe(true);
      expect(result.content.length).toBeLessThan(largeContent.length);
      expect(result.size).toBe(largeContent.length);
    });

    it('should detect binary files and return empty content', async () => {
      // Create a binary file with null bytes
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
      await writeFile(join(testProjectDir, 'binary.bin'), binaryContent);

      const result = await outputService.readFileContent(testProjectDir, 'binary.bin');

      expect(result.content).toBe('');
      expect(result.language).toBe('binary');
      expect(result.truncated).toBe(false);
    });

    it('should reject path traversal attempts', async () => {
      await writeFile(join(testProjectDir, 'test.txt'), 'content');

      await expect(
        outputService.readFileContent(testProjectDir, '../../etc/passwd')
      ).rejects.toThrow(UserError);
    });

    it('should throw 404 for non-existent file', async () => {
      await expect(
        outputService.readFileContent(testProjectDir, 'nonexistent.txt')
      ).rejects.toThrow(UserError);
    });

    it('should throw 400 when path is a directory', async () => {
      await mkdir(join(testProjectDir, 'mydir'));

      await expect(
        outputService.readFileContent(testProjectDir, 'mydir')
      ).rejects.toThrow(UserError);
    });

    it('should handle nested file paths', async () => {
      await mkdir(join(testProjectDir, 'src', 'lib'), { recursive: true });
      await writeFile(join(testProjectDir, 'src', 'lib', 'main.c'), 'int main() {}');

      const result = await outputService.readFileContent(testProjectDir, 'src/lib/main.c');

      expect(result.content).toBe('int main() {}');
      expect(result.fileName).toBe('main.c');
      expect(result.filePath).toBe('src/lib/main.c');
    });
  });
});
