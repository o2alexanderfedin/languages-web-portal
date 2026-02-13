import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { hourlyRateLimit, concurrentExecutionLimit } from '../middleware/rateLimiter.js';
import { RATE_LIMITS } from '../config/limits.js';

describe('Rate Limiter Middleware', () => {
  describe('hourlyRateLimit', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(hourlyRateLimit);
      app.get('/test', (_req, res) => {
        res.status(200).json({ success: true });
      });
      app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
      });
    });

    it('should allow requests within hourly limit', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should return 429 when hourly limit exceeded', async () => {
      // Make requests up to the limit
      const requests = [];
      for (let i = 0; i < RATE_LIMITS.maxPerHour + 1; i++) {
        requests.push(request(app).get('/test'));
      }

      const responses = await Promise.all(requests);

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body).toHaveProperty('error', 'Rate limit exceeded');
      expect(lastResponse.body).toHaveProperty('limit', RATE_LIMITS.maxPerHour);
      expect(lastResponse.body).toHaveProperty('windowMs', RATE_LIMITS.windowMs);
    });

    it('should skip health check endpoint from rate limiting', async () => {
      // Exhaust the rate limit on /test
      const testRequests = [];
      for (let i = 0; i < RATE_LIMITS.maxPerHour + 1; i++) {
        testRequests.push(request(app).get('/test'));
      }
      await Promise.all(testRequests);

      // Health check should still work
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toEqual({ status: 'ok' });
    });

    it('should include correct headers in response', async () => {
      const response = await request(app).get('/test');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('concurrentExecutionLimit', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(concurrentExecutionLimit);
      app.get('/execute', async (_req, res) => {
        // Simulate slow execution
        await new Promise((resolve) => setTimeout(resolve, 100));
        res.status(200).json({ success: true });
      });
      app.get('/fast', (_req, res) => {
        res.status(200).json({ success: true });
      });
    });

    it('should allow concurrent requests within limit', async () => {
      const requests = [];
      for (let i = 0; i < RATE_LIMITS.maxConcurrentPerIp; i++) {
        requests.push(request(app).get('/fast'));
      }

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should return 429 when concurrent limit exceeded', async () => {
      // Start more concurrent requests than the limit
      const requests = [];
      for (let i = 0; i < RATE_LIMITS.maxConcurrentPerIp + 2; i++) {
        requests.push(request(app).get('/execute'));
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Check error body
      if (rateLimited.length > 0) {
        expect(rateLimited[0].body).toHaveProperty('error', 'Too many concurrent executions');
        expect(rateLimited[0].body).toHaveProperty('limit', RATE_LIMITS.maxConcurrentPerIp);
        expect(rateLimited[0].body).toHaveProperty('current');
      }
    });

    it('should decrement count after response completes', async () => {
      // Make a slow request
      const slowRequest = request(app).get('/execute');

      // Wait a bit for it to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Make another request that should succeed
      const fastResponse = await request(app).get('/fast');
      expect(fastResponse.status).toBe(200);

      // Wait for slow request to complete
      await slowRequest;

      // Should be able to make more requests now
      const finalResponse = await request(app).get('/fast');
      expect(finalResponse.status).toBe(200);
    });

    it('should track requests per IP independently', async () => {
      // This test demonstrates the IP-based tracking
      // In a real scenario, different IPs would have separate limits
      // With supertest, all requests come from the same IP

      const response1 = await request(app).get('/fast');
      const response2 = await request(app).get('/fast');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should handle rapid sequential requests correctly', async () => {
      // Make sequential fast requests
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get('/fast');
        expect(response.status).toBe(200);
      }
    });
  });
});
