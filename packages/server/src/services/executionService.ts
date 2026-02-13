import { execa } from 'execa';
import type { ExecutionResponse } from '@repo/shared';
import { getToolConfig } from '../config/toolRegistry.js';
import { EXECUTION_LIMITS } from '../config/limits.js';
import { NotFoundError, UserError } from '../types/errors.js';
import { stat } from 'fs/promises';

/**
 * Service for executing CLI tools via execa with safety controls:
 * - 60s timeout
 * - Zombie process prevention (cleanup: true)
 * - Output streaming and line accumulation
 * - Exit code tracking
 * - Status determination (completed/failed/timeout/cancelled)
 */
export class ExecutionService {
  /**
   * Execute a CLI tool job with a given tool ID and project path
   *
   * @param params.toolId - Tool identifier from toolRegistry
   * @param params.projectPath - Absolute path to project directory
   * @param params.jobId - Unique job identifier for tracking
   * @param params.onOutput - Optional callback for streaming output lines
   * @returns ExecutionResponse with status, output, timing
   */
  async executeJob(params: {
    toolId: string;
    projectPath: string;
    jobId: string;
    onOutput?: (line: string) => void;
  }): Promise<ExecutionResponse> {
    const { toolId, projectPath, jobId, onOutput } = params;

    // Validate tool exists
    const config = getToolConfig(toolId);
    if (!config) {
      throw new NotFoundError('Tool');
    }

    // Validate tool is available
    if (!config.available) {
      throw new UserError('Tool is not available', 400);
    }

    // Validate project path exists
    try {
      await stat(projectPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError('Project directory');
      }
      throw error;
    }

    // Record timing
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    // Accumulate output lines (capped to prevent memory exhaustion)
    const output: string[] = [];
    let status: ExecutionResponse['status'] = 'running';

    try {
      // Execute CLI tool via execa
      // CRITICAL SECURITY:
      // - NEVER use shell: true (prevents command injection)
      // - NEVER interpolate user input into command strings
      // - Always pass command and args separately
      const subprocess = execa(config.command, [...config.defaultArgs, projectPath], {
        cwd: projectPath,
        timeout: config.maxExecutionTimeMs,
        killSignal: 'SIGTERM',
        cleanup: true, // Prevent zombie processes
        reject: false, // Don't throw on non-zero exit code
        all: true, // Interleave stdout and stderr
        buffer: false, // Enable streaming
      });

      // Stream output line-by-line
      if (subprocess.all) {
        for await (const line of subprocess.all) {
          const lineStr = line.toString();

          // Call optional streaming callback
          onOutput?.(lineStr);

          // Accumulate output (capped to maxOutputLines)
          if (output.length < EXECUTION_LIMITS.maxOutputLines) {
            output.push(lineStr);
          }
        }
      }

      // Wait for process to complete
      const result = await subprocess;

      // Determine final status based on result
      if (result.timedOut === true) {
        status = 'timeout';
      } else if (result.isCanceled === true || result.isTerminated === true) {
        status = 'cancelled';
      } else if (result.exitCode === 0) {
        status = 'completed';
      } else {
        status = 'failed';
      }

      // Return execution response
      return {
        jobId,
        status,
        exitCode: result.exitCode ?? -1,
        output,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      // Handle unexpected errors during execution
      return {
        jobId,
        status: 'failed',
        exitCode: -1,
        output,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }
  }
}

// Singleton instance for app-wide use
export const executionService = new ExecutionService();
