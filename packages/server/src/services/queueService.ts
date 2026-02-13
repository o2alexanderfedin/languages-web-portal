import PQueue from 'p-queue';
import { QUEUE_CONFIG } from '../config/limits.js';
import type { QueueStatus } from '@repo/shared';

/**
 * Queue service for managing concurrent job execution with p-queue.
 * Limits concurrency to CPU core count and provides queue status with estimated wait time.
 */
export class QueueService {
  private queue: PQueue;
  private jobDurations: number[] = [];

  constructor() {
    this.queue = new PQueue({
      concurrency: QUEUE_CONFIG.concurrency,
      autoStart: true,
    });
  }

  /**
   * Add a job to the queue and track its execution time
   */
  async addJob<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    const result = await this.queue.add(async () => {
      try {
        return await fn();
      } finally {
        const duration = Date.now() - startTime;
        this.jobDurations.push(duration);

        // Trim to max history to prevent unbounded growth
        if (this.jobDurations.length > QUEUE_CONFIG.maxDurationHistory) {
          this.jobDurations.shift();
        }
      }
    });

    return result as T;
  }

  /**
   * Get current queue status with position and estimated wait time
   */
  getQueueStatus(): QueueStatus {
    const position = this.queue.size;
    const pending = this.queue.pending;
    const concurrency = this.queue.concurrency;
    const avgDuration = this.getAverageDuration();

    // Estimate wait time: how many "rounds" of concurrent jobs before this one starts
    // times average duration per round
    const estimatedWaitMs = Math.ceil(position / concurrency) * avgDuration;
    const estimatedWaitSec = Math.ceil(estimatedWaitMs / 1000);

    return {
      position,
      pending,
      concurrency,
      estimatedWaitMs,
      estimatedWaitSec,
    };
  }

  /**
   * Calculate average job duration from history
   */
  private getAverageDuration(): number {
    if (this.jobDurations.length === 0) {
      return QUEUE_CONFIG.defaultEstimateMs;
    }

    const sum = this.jobDurations.reduce((acc, duration) => acc + duration, 0);
    return Math.ceil(sum / this.jobDurations.length);
  }
}

// Singleton instance
export const queueService = new QueueService();
