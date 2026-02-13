import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ExecutionRequest } from '@repo/shared';
import { ValidationError } from '../types/errors.js';
import { executionService } from '../services/executionService.js';
import { queueService } from '../services/queueService.js';
import { streamService } from '../services/streamService.js';
import { hourlyRateLimit, concurrentExecutionLimit } from '../middleware/rateLimiter.js';
import { v4 as uuidv4 } from 'uuid';
import { ProjectService } from '../services/projectService.js';
import { config } from '../config/env.js';

const router = Router();

// Lazy projectService initialization (same pattern as upload.ts for test compatibility)
let projectService: ProjectService | null = null;
function getProjectService(): ProjectService {
  if (!projectService) {
    projectService = new ProjectService(process.env.UPLOAD_DIR || config.uploadDir);
  }
  return projectService;
}

/**
 * POST /api/execute
 *
 * Execute a CLI tool on a project with real-time SSE streaming.
 * Request body: { toolId: string, projectId: string }
 *
 * Rate limited: 20/hour per IP, max 5 concurrent per IP
 *
 * Flow:
 * 1. Validate request body
 * 2. Resolve project path via projectService
 * 3. Generate jobId and return immediately (non-blocking)
 * 4. Queue execution job in background (fire-and-forget)
 * 5. Stream output to SSE client via streamService callbacks
 * 6. Send complete/error event when job finishes
 *
 * IMPORTANT: Client should establish SSE connection at GET /api/stream/:jobId
 * BEFORE calling this endpoint to ensure no output is missed.
 */
router.post(
  '/execute',
  hourlyRateLimit,
  concurrentExecutionLimit,
  async (req: Request, res: Response) => {
    // Parse request body
    const body = req.body as Partial<ExecutionRequest>;

    // Validate required fields
    if (!body.toolId || typeof body.toolId !== 'string' || body.toolId.trim() === '') {
      throw new ValidationError('toolId is required and must be a non-empty string');
    }

    if (!body.projectId || typeof body.projectId !== 'string' || body.projectId.trim() === '') {
      throw new ValidationError('projectId is required and must be a non-empty string');
    }

    const { toolId, projectId } = body;

    // Resolve project path (validates path safety)
    const projectPath = await getProjectService().getProjectPath(projectId);

    // Generate job ID
    const jobId = uuidv4();

    // Return jobId immediately (non-blocking response)
    res.json({ data: { jobId } });

    // Queue execution job in background (fire-and-forget)
    // Do NOT await - client response already sent
    queueService.addJob(async () => {
      try {
        // Execute job with streaming callback
        const result = await executionService.executeJob({
          toolId,
          projectPath,
          jobId,
          onOutput: (line) => {
            // Stream output to SSE client in real-time
            streamService.sendOutput(jobId, line).catch((err) => {
              console.error(`[stream] Failed to send output for job ${jobId}:`, err);
            });
          },
        });

        // Send completion event to SSE client
        await streamService.sendComplete(jobId, result);

        // Return result from queued job (for queueService duration tracking)
        return result;
      } catch (error) {
        // Send error event to SSE client
        const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
        await streamService.sendError(jobId, errorMessage);

        // Re-throw so queueService can track failed jobs
        throw error;
      }
    }).catch((err) => {
      // Log errors from background job (already sent to SSE client)
      console.error(`[execute] Background job ${jobId} failed:`, err);
    });
  }
);

/**
 * GET /api/queue/status
 *
 * Get current queue status for monitoring.
 * Returns: { position, pending, concurrency, estimatedWaitMs, estimatedWaitSec }
 *
 * No rate limiting (lightweight read-only operation).
 */
router.get('/queue/status', async (_req: Request, res: Response) => {
  const status = queueService.getQueueStatus();
  res.json({ data: status });
});

export default router;
