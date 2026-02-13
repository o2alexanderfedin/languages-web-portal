import type { ExecutionResponse } from './execution.js';

/**
 * SSE event for streaming a single output line from subprocess
 */
export interface StreamOutputEvent {
  event: 'output';
  data: {
    line: string;
    timestamp: number;
  };
}

/**
 * SSE event for signaling job completion with full execution result
 */
export interface StreamCompleteEvent {
  event: 'complete';
  data: ExecutionResponse;
}

/**
 * SSE event for signaling an error during execution
 */
export interface StreamErrorEvent {
  event: 'error';
  data: {
    message: string;
  };
}

/**
 * Union type for all possible SSE stream events
 */
export type StreamEvent = StreamOutputEvent | StreamCompleteEvent | StreamErrorEvent;
