import os from 'os';

export const EXECUTION_LIMITS = {
  maxTimeoutMs: 60_000,
  defaultTimeoutMs: 30_000,
  maxOutputLines: 10_000,
} as const;

export const RATE_LIMITS = {
  maxConcurrentPerIp: 5,
  maxPerHour: 20,
  windowMs: 60 * 60 * 1000,
} as const;

export const QUEUE_CONFIG = {
  concurrency: os.cpus().length,
  defaultEstimateMs: 30_000,
  maxDurationHistory: 100,
} as const;
