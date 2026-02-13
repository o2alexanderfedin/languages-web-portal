import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import express from 'express';
import 'express-async-errors';
import { errorHandler } from '../middleware/errorHandler.js';
import executeRouter from '../routes/execute.js';
import * as executionService from '../services/executionService.js';
import type { ExecutionResponse } from '@repo/shared';

describe('Execute API', () => {
  let app: express.Application;
  let testUploadDir: string;
  let testProjectId: string;

  beforeEach(async () => {
    // Create test upload directory
    testUploadDir = join(tmpdir(), `execute-test-${Date.now()}`);
    await mkdir(testUploadDir, { recursive: true });

    // Create a test project directory
    testProjectId = 'test-project-123';
    const testProjectPath = join(testUploadDir, testProjectId);
    await mkdir(testProjectPath, { recursive: true });

    // Set upload directory for tests
    process.env.UPLOAD_DIR = testUploadDir;

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', executeRouter);
    app.use(errorHandler);

    // Mock executionService.executeJob to avoid needing real tools
    vi.spyOn(executionService.executionService, 'executeJob').mockResolvedValue({
      jobId: 'mock-job-id',
      status: 'completed',
      exitCode: 0,
      output: ['Tool executed successfully'],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 1234,
    } as ExecutionResponse);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testUploadDir, { recursive: true, force: true });
    delete process.env.UPLOAD_DIR;
    vi.restoreAllMocks();
  });

  describe('POST /api/execute', () => {
    it('should accept valid execution request and return ExecutionResponse', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          toolId: 'cpp-to-c-transpiler',
          projectId: testProjectId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('exitCode');
      expect(response.body.data).toHaveProperty('output');
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.exitCode).toBe(0);

      // Verify executionService.executeJob was called
      expect(executionService.executionService.executeJob).toHaveBeenCalledWith(
        expect.objectContaining({
          toolId: 'cpp-to-c-transpiler',
          projectPath: join(testUploadDir, testProjectId),
        })
      );
    });

    it('should return 422 for missing toolId', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          projectId: testProjectId,
          // toolId missing
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('toolId');
    });

    it('should return 422 for missing projectId', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          toolId: 'cpp-to-c-transpiler',
          // projectId missing
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('projectId');
    });

    it('should return 422 for empty toolId', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          toolId: '',
          projectId: testProjectId,
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('toolId');
    });

    it('should return 422 for empty projectId', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          toolId: 'cpp-to-c-transpiler',
          projectId: '',
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('projectId');
    });
  });

  describe('GET /api/queue/status', () => {
    it('should return queue status with expected fields', async () => {
      const response = await request(app).get('/api/queue/status').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('position');
      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.data).toHaveProperty('concurrency');
      expect(response.body.data).toHaveProperty('estimatedWaitMs');
      expect(response.body.data).toHaveProperty('estimatedWaitSec');

      expect(typeof response.body.data.position).toBe('number');
      expect(typeof response.body.data.pending).toBe('number');
      expect(typeof response.body.data.concurrency).toBe('number');
      expect(typeof response.body.data.estimatedWaitMs).toBe('number');
      expect(typeof response.body.data.estimatedWaitSec).toBe('number');
    });
  });
});
