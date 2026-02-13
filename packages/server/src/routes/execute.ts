import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ExecutionRequest } from '@repo/shared';
import { ValidationError } from '../types/errors.js';
import { executionService } from '../services/executionService.js';
import { queueService } from '../services/queueService.js';
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
 * Execute a CLI tool on a project.
 * Request body: { toolId: string, projectId: string }
 *
 * Rate limited: 20/hour per IP, max 5 concurrent per IP
 *
 * Flow:
 * 1. Validate request body
 * 2. Resolve project path via projectService
 * 3. Queue job via queueService (blocks during execution)
 * 4. Return ExecutionResponse
 *
 * Phase 4 will add SSE streaming for real-time output.
 * This phase uses synchronous request-response (client blocks until completion).
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

    // Execute via queue (synchronous request-response)
    // Client request blocks here until execution completes (up to 60s)
    const result = await queueService.addJob(() =>
      executionService.executeJob({ toolId, projectPath, jobId })
    );

    // Return execution result
    res.json({ data: result });
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
