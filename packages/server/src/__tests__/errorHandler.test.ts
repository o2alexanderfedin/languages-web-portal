import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import 'express-async-errors';
import { errorHandler } from '../middleware/errorHandler.js';
import { UserError, SystemError, NotFoundError, ValidationError } from '../types/errors.js';

// Test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

describe('Error Handler Middleware', () => {
  it('should handle UserError with 4xx status and user_error type', async () => {
    const app = createTestApp();
    app.get('/test', () => {
      throw new UserError('Invalid input', 400);
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('user_error');
    expect(response.body.error.message).toBe('Invalid input');
  });

  it('should handle SystemError with 5xx status and system_error type', async () => {
    const app = createTestApp();
    app.get('/test', () => {
      throw new SystemError('Database connection failed', 500);
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body.error.type).toBe('system_error');
    expect(response.body.error.message).toBe('Database connection failed');
  });

  it('should handle unknown Error with 500 and generic message', async () => {
    const app = createTestApp();
    app.get('/test', () => {
      throw new Error('Some internal error');
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body.error.type).toBe('system_error');
    expect(response.body.error.message).toBe('An unexpected error occurred');
    // Should NOT expose internal error details
    expect(response.body.error.message).not.toContain('Some internal error');
  });

  it('should handle NotFoundError with 404 and user_error type', async () => {
    const app = createTestApp();
    app.get('/test', () => {
      throw new NotFoundError('User');
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(404);
    expect(response.body.error.type).toBe('user_error');
    expect(response.body.error.message).toBe('User not found');
  });

  it('should handle ValidationError with 422, user_error type, and details', async () => {
    const app = createTestApp();
    app.get('/test', () => {
      throw new ValidationError('Invalid email format', {
        field: 'email',
        value: 'invalid',
      });
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(422);
    expect(response.body.error.type).toBe('user_error');
    expect(response.body.error.message).toBe('Invalid email format');
    expect(response.body.error.details).toEqual({
      field: 'email',
      value: 'invalid',
    });
  });
});
