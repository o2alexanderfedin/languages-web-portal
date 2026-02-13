import { rm } from 'fs/promises';

/**
 * Service for TTL-based cleanup of project directories
 * Schedules automatic deletion of project directories after a configurable delay
 * Handles graceful shutdown to cancel pending timers
 */
export class CleanupService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_DELAY_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Schedules cleanup of a project directory after a delay
   *
   * @param projectId - Project identifier
   * @param projectPath - Absolute path to the project directory
   * @param delayMs - Optional delay in milliseconds (defaults to 10 minutes)
   */
  scheduleCleanup(projectId: string, projectPath: string, delayMs?: number): void {
    // Cancel existing timer if one exists
    this.cancelCleanup(projectId);

    const delay = delayMs ?? this.DEFAULT_DELAY_MS;

    // Schedule cleanup
    const timer = setTimeout(async () => {
      try {
        await rm(projectPath, { recursive: true, force: true });
        console.log(`[cleanup] Successfully removed project directory: ${projectId}`);
        this.timers.delete(projectId);
      } catch (error) {
        // Best-effort cleanup - log but don't throw
        console.error(`[cleanup] Failed to remove project directory ${projectId}:`, error);
        this.timers.delete(projectId);
      }
    }, delay);

    this.timers.set(projectId, timer);
    console.log(`[cleanup] Scheduled cleanup for project ${projectId} in ${delay}ms`);
  }

  /**
   * Cancels a scheduled cleanup for a project
   *
   * @param projectId - Project identifier
   */
  cancelCleanup(projectId: string): void {
    const timer = this.timers.get(projectId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(projectId);
      console.log(`[cleanup] Cancelled cleanup for project ${projectId}`);
    }
  }

  /**
   * Gets the number of scheduled cleanup timers
   *
   * @returns Count of scheduled cleanups
   */
  getScheduledCount(): number {
    return this.timers.size;
  }

  /**
   * Checks if cleanup is scheduled for a project
   *
   * @param projectId - Project identifier
   * @returns True if cleanup is scheduled
   */
  isScheduled(projectId: string): boolean {
    return this.timers.has(projectId);
  }

  /**
   * Gracefully shuts down the cleanup service
   * Clears all pending timers without executing immediate cleanup
   */
  async shutdown(): Promise<void> {
    console.log(`[cleanup] Shutting down - cancelling ${this.timers.size} scheduled cleanups`);

    for (const [projectId, timer] of this.timers.entries()) {
      clearTimeout(timer);
      this.timers.delete(projectId);
    }

    console.log('[cleanup] Shutdown complete');
  }
}

// Export singleton instance
export const cleanupService = new CleanupService();

// Register shutdown handlers (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', async () => {
    await cleanupService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await cleanupService.shutdown();
    process.exit(0);
  });
}
