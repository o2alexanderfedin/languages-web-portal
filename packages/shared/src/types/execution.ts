export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface ExecutionRequest {
  toolId: string;
  projectId: string;
}

export interface ExecutionResponse {
  jobId: string;
  status: JobStatus;
  exitCode?: number;
  output?: string[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface QueueStatus {
  position: number;
  pending: number;
  concurrency: number;
  estimatedWaitMs: number;
  estimatedWaitSec: number;
}

export interface ToolExecutionConfig {
  id: string;
  command: string;
  defaultArgs: string[];
  maxExecutionTimeMs: number;
  available: boolean;
}
