import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import 'express-async-errors';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { errorHandler } from '../middleware/errorHandler.js';
import outputRouter from '../routes/output.js';

/**
 * Output route tests
 *
 * Uses standalone Express app (same pattern as stream.test.ts) to avoid Vite middleware.
 * Tests all three output endpoints: file tree, preview, and download.
 */
describe('Output Routes', () => {
  let app: express.Application;
  let testBaseDir: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Create test directory structure
    testBaseDir = join(tmpdir(), `output-routes-test-${Date.now()}`);
    testProjectId = 'test-project-123';
    const projectPath = join(testBaseDir, testProjectId);

    await mkdir(projectPath, { recursive: true });

    // Create test files
    await writeFile(join(projectPath, 'README.md'), '# Test Project');
    await writeFile(join(projectPath, 'main.c'), 'int main() { return 0; }');
    await mkdir(join(projectPath, 'src'));
    await writeFile(join(projectPath, 'src', 'lib.c'), 'void lib() {}');
    await writeFile(join(projectPath, 'src', 'lib.h'), '#define LIB 1');

    // Set environment variable for test directory
    process.env.UPLOAD_DIR = testBaseDir;

    // Create standalone test app
    app = express();
    app.use(express.json());
    app.use('/api', outputRouter);
    app.use(errorHandler);
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testBaseDir, { recursive: true, force: true });
    delete process.env.UPLOAD_DIR;
  });

  describe('GET /api/projects/:projectId/output', () => {
    it('should return file tree for existing project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/output`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        rootId: 'root',
        tree: expect.any(Object),
      });

      const tree = response.body.data.tree;
      expect(tree['root']).toMatchObject({
        id: 'root',
        name: '/',
        isDirectory: true,
        children: expect.any(Array),
      });

      // Check that files exist in tree
      expect(tree['README.md']).toBeDefined();
      expect(tree['main.c']).toBeDefined();
      expect(tree['src']).toBeDefined();
      expect(tree['src/lib.c']).toBeDefined();
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/nonexistent-project/output')
        .expect(404);
    });
  });

  describe('GET /api/projects/:projectId/preview/:filePath', () => {
    it('should return file content for valid path', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/preview/main.c`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        content: 'int main() { return 0; }',
        fileName: 'main.c',
        filePath: 'main.c',
        language: 'c',
        size: expect.any(Number),
        truncated: false,
      });
    });

    it('should handle nested file paths', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/preview/src/lib.c`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        content: 'void lib() {}',
        fileName: 'lib.c',
        filePath: 'src/lib.c',
        language: 'c',
      });
    });

    it('should return 403 for path traversal attempt', async () => {
      // Use encoded path traversal that won't be normalized by Express
      await request(app)
        .get(`/api/projects/${testProjectId}/preview/..%2F..%2F..%2Fetc%2Fpasswd`)
        .expect(403);
    });

    it('should return 404 for non-existent file', async () => {
      await request(app)
        .get(`/api/projects/${testProjectId}/preview/nonexistent.txt`)
        .expect(404);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/nonexistent-project/preview/file.txt')
        .expect(404);
    });
  });

  describe('GET /api/projects/:projectId/download', () => {
    it('should return ZIP with correct content-type for valid project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/download`)
        .responseType('blob') // Handle binary response
        .expect(200);

      // Check headers
      expect(response.headers['content-type']).toContain('application/zip');
      expect(response.headers['content-disposition']).toContain(`${testProjectId}-output.zip`);

      // Check that response has content
      // With responseType('blob'), the body will be a Buffer
      expect(response.body).toBeDefined();
      expect(Buffer.isBuffer(response.body) || response.body.length > 0).toBeTruthy();
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/nonexistent-project/download')
        .expect(404);
    });
  });
});
