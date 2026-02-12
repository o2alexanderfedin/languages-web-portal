import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Health Check', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
    expect(typeof response.body.timestamp).toBe('number');
    expect(typeof response.body.uptime).toBe('number');
    expect(typeof response.body.environment).toBe('string');
  });
});
