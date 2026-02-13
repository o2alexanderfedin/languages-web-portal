import { Router } from 'express';
import type { Request, Response } from 'express';
import { createSession } from 'better-sse';
import { streamService } from '../services/streamService.js';
import { ValidationError } from '../types/errors.js';

const router = Router();

/**
 * GET /api/stream/:jobId
 *
 * Establish Server-Sent Events (SSE) connection for real-time job output.
 *
 * Flow:
 * 1. Validate jobId parameter
 * 2. Create SSE session with 30s keep-alive heartbeat
 * 3. Register session with streamService
 * 4. Listen for client disconnect and cleanup
 *
 * Events sent to client:
 * - 'output': { line: string, timestamp: number } - subprocess output line
 * - 'complete': ExecutionResponse - job finished successfully
 * - 'error': { message: string } - job failed with error
 * - (automatic heartbeat comments every 30s to keep connection alive)
 *
 * IMPORTANT: Client must connect to this endpoint BEFORE calling POST /execute
 * to ensure no output is missed. If client connects after job completes,
 * they will only receive the 'complete' event (if job is still in memory).
 */
router.get('/stream/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  // Validate jobId parameter
  if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
    throw new ValidationError('jobId is required and must be a non-empty string');
  }

  // Create SSE session with 30s keep-alive heartbeat
  // This prevents proxy/firewall timeouts and allows client to detect connection loss
  const session = await createSession(req, res, {
    keepAlive: 30000, // 30 seconds
  });

  // Register session with streamService
  // Now sendOutput/sendComplete calls will push events to this session
  streamService.registerSession(jobId, session);

  // Listen for client disconnect and cleanup
  req.on('close', () => {
    streamService.unregisterSession(jobId);
  });
});

export default router;
