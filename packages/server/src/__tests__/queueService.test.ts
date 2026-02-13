import { describe, it, expect, beforeEach } from 'vitest';
import { QueueService } from '../services/queueService.js';
import { QUEUE_CONFIG } from '../config/limits.js';

describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    queueService = new QueueService();
  });

  describe('addJob', () => {
    it('should execute function and return result', async () => {
      const testValue = 'test-result';
      const result = await queueService.addJob(async () => testValue);

      expect(result).toBe(testValue);
    });

    it('should execute async function and return result', async () => {
      const testValue = 42;
      const result = await queueService.addJob(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return testValue;
      });

      expect(result).toBe(testValue);
    });

    it('should propagate errors from job function', async () => {
      const errorMessage = 'Job failed';

      await expect(
        queueService.addJob(async () => {
          throw new Error(errorMessage);
        })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('concurrency control', () => {
    it('should run jobs concurrently up to concurrency limit', async () => {
      const concurrency = QUEUE_CONFIG.concurrency;
      const executionOrder: number[] = [];
      const jobPromises: Promise<void>[] = [];
      let activeCount = 0;
      let maxActive = 0;

      // Create more jobs than concurrency limit
      for (let i = 0; i < concurrency + 2; i++) {
        jobPromises.push(
          queueService.addJob(async () => {
            activeCount++;
            maxActive = Math.max(maxActive, activeCount);
            executionOrder.push(i);
            await new Promise((resolve) => setTimeout(resolve, 50));
            activeCount--;
          })
        );
      }

      await Promise.all(jobPromises);

      // Should not exceed concurrency limit
      expect(maxActive).toBeLessThanOrEqual(concurrency);
      // All jobs should execute
      expect(executionOrder).toHaveLength(concurrency + 2);
    });

    it('should queue jobs when at capacity', async () => {
      const statusBefore = queueService.getQueueStatus();
      expect(statusBefore.position).toBe(0);

      // Add jobs that will take some time
      const jobCount = QUEUE_CONFIG.concurrency + 3;
      const jobPromises: Promise<void>[] = [];

      for (let i = 0; i < jobCount; i++) {
        jobPromises.push(
          queueService.addJob(async () => {
            await new Promise((resolve) => setTimeout(resolve, 30));
          })
        );
      }

      // Check status while jobs are queued (give a tiny delay for queue to populate)
      await new Promise((resolve) => setTimeout(resolve, 5));
      const statusDuring = queueService.getQueueStatus();

      // Should have pending jobs
      expect(statusDuring.pending).toBeGreaterThan(0);

      await Promise.all(jobPromises);
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct position when jobs are queued', async () => {
      const concurrency = QUEUE_CONFIG.concurrency;

      // Add jobs to fill the queue
      const jobPromises: Promise<void>[] = [];
      for (let i = 0; i < concurrency + 5; i++) {
        jobPromises.push(
          queueService.addJob(async () => {
            await new Promise((resolve) => setTimeout(resolve, 40));
          })
        );
      }

      // Give queue time to populate
      await new Promise((resolve) => setTimeout(resolve, 5));

      const status = queueService.getQueueStatus();

      expect(status).toHaveProperty('position');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('concurrency');
      expect(status).toHaveProperty('estimatedWaitMs');
      expect(status).toHaveProperty('estimatedWaitSec');
      expect(status.concurrency).toBe(concurrency);

      await Promise.all(jobPromises);
    });

    it('should return default estimate when no history exists', () => {
      const status = queueService.getQueueStatus();

      expect(status.position).toBe(0);
      expect(status.pending).toBe(0);
      expect(status.concurrency).toBe(QUEUE_CONFIG.concurrency);
    });

    it('should return estimatedWaitMs based on job history', async () => {
      // Add a job with known duration
      await queueService.addJob(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Queue should now have history
      // Add more jobs to create queue
      const jobPromises: Promise<void>[] = [];
      for (let i = 0; i < QUEUE_CONFIG.concurrency + 2; i++) {
        jobPromises.push(
          queueService.addJob(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
          })
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 5));
      const status = queueService.getQueueStatus();

      // Should have estimate based on history, not default
      expect(status.estimatedWaitMs).toBeGreaterThan(0);
      expect(status.estimatedWaitSec).toBe(Math.ceil(status.estimatedWaitMs / 1000));

      await Promise.all(jobPromises);
    });
  });

  describe('job duration tracking', () => {
    it('should track job durations', async () => {
      // Add a few jobs
      await queueService.addJob(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await queueService.addJob(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });

      // Queue more jobs to check estimate
      const jobPromises: Promise<void>[] = [];
      for (let i = 0; i < QUEUE_CONFIG.concurrency + 1; i++) {
        jobPromises.push(
          queueService.addJob(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
          })
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 5));
      const status = queueService.getQueueStatus();

      // Estimate should be based on actual durations, not default
      expect(status.estimatedWaitMs).toBeGreaterThan(0);
      expect(status.estimatedWaitMs).toBeLessThan(QUEUE_CONFIG.defaultEstimateMs);

      await Promise.all(jobPromises);
    });
  });
});
