import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { RATE_LIMITS } from '../config/limits.js';

/**
 * Hourly rate limiter: 20 requests per hour per IP
 */
export const hourlyRateLimit = rateLimit({
  windowMs: RATE_LIMITS.windowMs,
  max: RATE_LIMITS.maxPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: (req) => req.path === '/health',
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit: RATE_LIMITS.maxPerHour,
      windowMs: RATE_LIMITS.windowMs,
    });
  },
});

/**
 * Concurrent execution limiter: tracks active executions per IP
 * Enforces max 5 concurrent executions per IP
 */
const activeExecutions = new Map<string, number>();

export function concurrentExecutionLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  const currentCount = activeExecutions.get(ip) || 0;

  // Check if IP has reached concurrent limit
  if (currentCount >= RATE_LIMITS.maxConcurrentPerIp) {
    res.status(429).json({
      error: 'Too many concurrent executions',
      limit: RATE_LIMITS.maxConcurrentPerIp,
      current: currentCount,
    });
    return;
  }

  // Increment count
  activeExecutions.set(ip, currentCount + 1);

  // Decrement count when response finishes
  res.on('finish', () => {
    const count = activeExecutions.get(ip);
    if (count !== undefined) {
      if (count <= 1) {
        activeExecutions.delete(ip); // Prevent memory leak
      } else {
        activeExecutions.set(ip, count - 1);
      }
    }
  });

  next();
}
