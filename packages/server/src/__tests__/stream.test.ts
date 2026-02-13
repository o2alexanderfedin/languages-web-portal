import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import 'express-async-errors';
import { errorHandler } from '../middleware/errorHandler.js';
import streamRouter from '../routes/stream.js';

/**
 * Stream route tests
 *
 * NOTE: SSE endpoints are long-lived connections with complex lifecycle.
 * Full SSE behavior (event streaming, heartbeats, session management) is
 * covered by streamService.test.ts unit tests. These tests focus on:
 * - Route validation
 * - Response headers
 *
 * We use a standalone test app (not the full app) to avoid long-running
 * Vite middleware and other server startup overhead.
 *
 * Integration testing of SSE streaming behavior is best done with dedicated
 * SSE client libraries or manual testing with curl/EventSource.
 */
describe('GET /api/stream/:jobId', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/api', streamRouter);
    app.use(errorHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns SSE content-type header for valid jobId', (done) => {
    const req = request(app).get('/api/stream/test-job-123');

    // SSE connections don't close immediately, so we need to abort after checking headers
    req.on('response', (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(res.headers['cache-control']).toBe('no-cache, no-transform');
      expect(res.headers['connection']).toBe('keep-alive');
      req.abort();
      done();
    });

    req.end();
  });

  it('returns 422 for empty jobId', async () => {
    // Test with whitespace-only jobId (URL encoded space)
    // ValidationError returns 422
    await request(app)
      .get('/api/stream/%20')
      .expect(422);
  });

  /**
   * Additional SSE behavior to verify manually:
   * - Heartbeat comments sent every 30s: curl -N http://localhost:3000/api/stream/test-job
   * - Output events received in real-time: (connect SSE, then POST /execute)
   * - Complete event closes connection gracefully
   * - Client disconnect triggers session cleanup
   */
});
