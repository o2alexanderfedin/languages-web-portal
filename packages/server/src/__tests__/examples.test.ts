import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdir, rm, readdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import express from 'express';
import 'express-async-errors';
import { errorHandler } from '../middleware/errorHandler.js';
import examplesRouter from '../routes/examples.js';

describe('Examples API', () => {
  let app: express.Application;
  let testUploadDir: string;

  beforeEach(async () => {
    // Create test upload directory for project creation
    testUploadDir = join(tmpdir(), `examples-test-${Date.now()}`);
    await mkdir(testUploadDir, { recursive: true });

    // Set upload directory for tests
    process.env.UPLOAD_DIR = testUploadDir;

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', examplesRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    // Clean up test upload directory
    try {
      await rm(testUploadDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    delete process.env.UPLOAD_DIR;
  });

  describe('GET /api/examples/:toolId', () => {
    it('should return list of examples for cpp-to-c-transpiler', async () => {
      const response = await request(app).get('/api/examples/cpp-to-c-transpiler');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('examples');
      expect(Array.isArray(response.body.examples)).toBe(true);
      expect(response.body.examples.length).toBe(3);

      // Verify example structure
      const exampleNames = response.body.examples.map(
        (ex: { name: string }) => ex.name,
      );
      expect(exampleNames).toContain('hello-world');
      expect(exampleNames).toContain('fibonacci');
      expect(exampleNames).toContain('linked-list');

      // Verify each example has name and description
      for (const example of response.body.examples) {
        expect(example).toHaveProperty('name');
        expect(example).toHaveProperty('description');
        expect(typeof example.name).toBe('string');
        expect(typeof example.description).toBe('string');
      }
    });

    it('should return list of examples for csharp-verification', async () => {
      const response = await request(app).get('/api/examples/csharp-verification');

      expect(response.status).toBe(200);
      expect(response.body.examples.length).toBe(3);

      const exampleNames = response.body.examples.map(
        (ex: { name: string }) => ex.name,
      );
      expect(exampleNames).toContain('null-check');
      expect(exampleNames).toContain('array-bounds');
      expect(exampleNames).toContain('division-safety');
    });

    it('should return 404 for non-existent tool', async () => {
      const response = await request(app).get('/api/examples/nonexistent-tool');

      expect(response.status).toBe(404);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Tool not found');
    });

    it('should return empty array for tool with no examples', async () => {
      // Test with a valid tool that has no example directory
      const response = await request(app).get('/api/examples/rust-verification');

      expect(response.status).toBe(200);
      expect(response.body.examples).toEqual([]);
    });
  });

  describe('POST /api/examples/:toolId/:exampleName', () => {
    it('should load hello-world example and create project', async () => {
      const response = await request(app).post(
        '/api/examples/cpp-to-c-transpiler/hello-world',
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('projectId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('fileCount');
      expect(response.body).toHaveProperty('toolId', 'cpp-to-c-transpiler');
      expect(response.body).toHaveProperty('exampleName', 'hello-world');

      // Verify projectId is a valid UUID
      expect(response.body.projectId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      // Verify files were copied
      expect(response.body.fileCount).toBeGreaterThan(0);

      // Verify project directory was created
      const projectPath = join(testUploadDir, response.body.projectId);
      const files = await readdir(projectPath);
      expect(files.length).toBeGreaterThan(0);
      expect(files).toContain('main.cpp');
    });

    it('should load fibonacci example successfully', async () => {
      const response = await request(app).post(
        '/api/examples/cpp-to-c-transpiler/fibonacci',
      );

      expect(response.status).toBe(201);
      expect(response.body.exampleName).toBe('fibonacci');
      expect(response.body.fileCount).toBeGreaterThan(0);

      const projectPath = join(testUploadDir, response.body.projectId);
      const files = await readdir(projectPath);
      expect(files).toContain('main.cpp');
      expect(files).toContain('README.md');
    });

    it('should load C# null-check example successfully', async () => {
      const response = await request(app).post(
        '/api/examples/csharp-verification/null-check',
      );

      expect(response.status).toBe(201);
      expect(response.body.toolId).toBe('csharp-verification');
      expect(response.body.exampleName).toBe('null-check');

      const projectPath = join(testUploadDir, response.body.projectId);
      const files = await readdir(projectPath);
      expect(files).toContain('Program.cs');
    });

    it('should return 404 for non-existent tool', async () => {
      const response = await request(app).post(
        '/api/examples/nonexistent-tool/some-example',
      );

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Tool not found');
    });

    it('should return 404 for non-existent example', async () => {
      const response = await request(app).post(
        '/api/examples/cpp-to-c-transpiler/nonexistent-example',
      );

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Example');
      expect(response.body.error.message).toContain('not found');
    });

    it('should reject path traversal attempts in example name', async () => {
      // URL encode the path traversal attempt
      const response = await request(app).post(
        '/api/examples/cpp-to-c-transpiler/..%2F..%2F..%2Fetc%2Fpasswd',
      );

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('path traversal');
    });

    it('should reject example names with null bytes', async () => {
      // URL encode null byte
      const response = await request(app).post(
        '/api/examples/cpp-to-c-transpiler/hello%00world',
      );

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid example name');
    });
  });
});
