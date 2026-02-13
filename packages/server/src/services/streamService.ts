import type { Session } from 'better-sse';
import type { ExecutionResponse } from '@repo/shared';

/**
 * Service for managing Server-Sent Events (SSE) sessions per job.
 *
 * Responsibilities:
 * - Register/unregister SSE sessions by jobId
 * - Forward execution output lines to correct SSE client
 * - Send completion/error events to SSE client
 * - Clean up sessions after job completion or client disconnect
 *
 * Thread-safety: Not required (Node.js is single-threaded event loop)
 * Memory management: Sessions auto-removed on sendComplete/sendError
 */
export class StreamService {
  private sessions: Map<string, Session> = new Map();

  /**
   * Register an SSE session for a specific job ID.
   * Subsequent sendOutput/sendComplete calls will push events to this session.
   */
  registerSession(jobId: string, session: Session): void {
    this.sessions.set(jobId, session);
  }

  /**
   * Unregister an SSE session (called on client disconnect).
   * Safe to call even if session doesn't exist.
   */
  unregisterSession(jobId: string): void {
    this.sessions.delete(jobId);
  }

  /**
   * Send a single output line to the SSE client for this job.
   * No-op if session not found (job may complete before SSE connection established).
   */
  async sendOutput(jobId: string, line: string): Promise<void> {
    const session = this.sessions.get(jobId);
    if (!session) {
      // No-op if session not found (normal race condition)
      return;
    }

    await session.push(
      {
        line,
        timestamp: Date.now(),
      },
      'output'
    );
  }

  /**
   * Send completion event with full ExecutionResponse, then remove session.
   * No-op if session not found.
   *
   * NOTE: We do NOT call session.close() here - let the client disconnect
   * naturally after receiving the complete event. This allows the client
   * to process the final event before the connection closes.
   */
  async sendComplete(jobId: string, result: ExecutionResponse): Promise<void> {
    const session = this.sessions.get(jobId);
    if (!session) {
      // No-op if session not found
      return;
    }

    await session.push(result, 'complete');

    // Remove session from map (client will disconnect after receiving event)
    this.sessions.delete(jobId);
  }

  /**
   * Send error event, then remove session.
   * No-op if session not found.
   */
  async sendError(jobId: string, message: string): Promise<void> {
    const session = this.sessions.get(jobId);
    if (!session) {
      // No-op if session not found
      return;
    }

    await session.push({ message }, 'error');

    // Remove session from map
    this.sessions.delete(jobId);
  }

  /**
   * Check if a session exists for a given job ID.
   * Useful for testing and debugging.
   */
  hasSession(jobId: string): boolean {
    return this.sessions.has(jobId);
  }

  /**
   * Get the number of active SSE sessions.
   * Useful for monitoring and debugging.
   */
  get activeSessionCount(): number {
    return this.sessions.size;
  }
}

// Singleton instance for app-wide use
export const streamService = new StreamService();
