import { useEffect, useRef, useState } from 'react';
import type { ExecutionResponse } from '@repo/shared';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export interface UseSSECallbacks {
  onOutput?: (line: string) => void;
  onComplete?: (result: ExecutionResponse) => void;
  onError?: (error: Event | string) => void;
}

/**
 * Custom hook for managing EventSource lifecycle and SSE event handling
 *
 * @param jobId - The job ID to connect to (null for no connection)
 * @param callbacks - Event handlers for output, complete, and error events
 * @returns Connection state object
 */
export function useSSE(jobId: string | null, callbacks: UseSSECallbacks) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');

  // Store callbacks in ref to avoid recreating EventSource on callback changes
  const callbacksRef = useRef<UseSSECallbacks>(callbacks);

  // Update ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    // If no jobId, remain idle
    if (!jobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnectionState('idle');
      return;
    }

    setConnectionState('connecting');

    const eventSource = new EventSource(`/api/stream/${jobId}`);

    // Connection opened successfully
    eventSource.onopen = () => {
      setConnectionState('connected');
    };

    // Handle 'output' event - streaming subprocess output line
    eventSource.addEventListener('output', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const line = data.line as string;
        callbacksRef.current.onOutput?.(line);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse output event:', error);
      }
    });

    // Handle 'complete' event - job finished with results
    eventSource.addEventListener('complete', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ExecutionResponse;
        callbacksRef.current.onComplete?.(data);
        eventSource.close();
        setConnectionState('closed');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse complete event:', error);
      }
    });

    // Handle 'error' event - SSE-level error from server
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        callbacksRef.current.onError?.(data.message);
        eventSource.close();
        setConnectionState('error');
      } catch (error) {
        // If parsing fails, this might be a connection error (handled by onerror)
        // eslint-disable-next-line no-console
        console.error('Failed to parse error event:', error);
      }
    });

    // Handle connection errors (network issues, invalid URL, etc.)
    eventSource.onerror = (error: Event) => {
      callbacksRef.current.onError?.(error);
      eventSource.close();
      setConnectionState('error');
    };

    // Cleanup on unmount or when jobId changes
    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [jobId]);

  return { connectionState };
}
