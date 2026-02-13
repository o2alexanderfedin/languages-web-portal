import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSSE } from '../hooks/useSSE';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  static CLOSED = 2;

  readyState = 0; // CONNECTING
  url: string;
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, callback: (event: MessageEvent) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: (event: MessageEvent) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Test helper methods
  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateEvent(eventType: string, data: unknown) {
    const callbacks = this.listeners[eventType];
    if (callbacks) {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      callbacks.forEach((cb) => cb(messageEvent));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('useSSE', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    // @ts-expect-error - Mocking global EventSource
    global.EventSource = MockEventSource;
  });

  it('returns idle state when jobId is null', () => {
    const { result } = renderHook(() => useSSE(null, {}));

    expect(result.current.connectionState).toBe('idle');
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('creates EventSource when jobId is provided', () => {
    renderHook(() => useSSE('test-job-123', {}));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]!.url).toBe('/api/stream/test-job-123');
  });

  it('transitions to connected state when connection opens', async () => {
    const { result } = renderHook(() => useSSE('test-job-123', {}));

    // Initially connecting
    expect(result.current.connectionState).toBe('connecting');

    // Simulate connection open
    act(() => {
      MockEventSource.instances[0]!.simulateOpen();
    });

    // Should be connected
    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
    });
  });

  it('calls onOutput when output event received', () => {
    const onOutput = vi.fn();
    renderHook(() => useSSE('test-job-123', { onOutput }));

    // Simulate output event
    MockEventSource.instances[0]!.simulateEvent('output', {
      line: 'hello world',
      timestamp: 123456789,
    });

    expect(onOutput).toHaveBeenCalledWith('hello world');
  });

  it('calls onComplete when complete event received', () => {
    const onComplete = vi.fn();
    renderHook(() => useSSE('test-job-123', { onComplete }));

    const executionResult = {
      status: 'completed',
      output: ['line 1', 'line 2'],
      exitCode: 0,
      durationMs: 1234,
    };

    // Simulate complete event
    act(() => {
      MockEventSource.instances[0]!.simulateEvent('complete', executionResult);
    });

    expect(onComplete).toHaveBeenCalledWith(executionResult);
  });

  it('closes EventSource on complete event', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSSE('test-job-123', { onComplete }));

    const instance = MockEventSource.instances[0]!;
    expect(instance.readyState).not.toBe(MockEventSource.CLOSED);

    // Simulate complete event
    act(() => {
      instance.simulateEvent('complete', {
        status: 'completed',
        output: [],
        exitCode: 0,
      });
    });

    expect(instance.readyState).toBe(MockEventSource.CLOSED);
    await waitFor(() => {
      expect(result.current.connectionState).toBe('closed');
    });
  });

  it('calls onError when error event received', () => {
    const onError = vi.fn();
    renderHook(() => useSSE('test-job-123', { onError }));

    // Simulate error event from server
    act(() => {
      MockEventSource.instances[0]!.simulateEvent('error', {
        message: 'Job failed',
      });
    });

    expect(onError).toHaveBeenCalledWith('Job failed');
  });

  it('handles connection errors via onerror', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useSSE('test-job-123', { onError }));

    // Simulate connection error
    act(() => {
      MockEventSource.instances[0]!.simulateError();
    });

    expect(onError).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.connectionState).toBe('error');
    });
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = renderHook(() => useSSE('test-job-123', {}));

    const instance = MockEventSource.instances[0]!;
    expect(instance.readyState).not.toBe(MockEventSource.CLOSED);

    unmount();

    expect(instance.readyState).toBe(MockEventSource.CLOSED);
  });

  it('recreates EventSource when jobId changes', () => {
    const { rerender } = renderHook(({ jobId }) => useSSE(jobId, {}), {
      initialProps: { jobId: 'job-1' },
    });

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]!.url).toBe('/api/stream/job-1');

    const firstInstance = MockEventSource.instances[0]!;

    // Change jobId
    rerender({ jobId: 'job-2' });

    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1]!.url).toBe('/api/stream/job-2');
    expect(firstInstance.readyState).toBe(MockEventSource.CLOSED);
  });

  it('does not recreate EventSource when callbacks change', () => {
    const onOutput1 = vi.fn();
    const onOutput2 = vi.fn();

    const { rerender } = renderHook(({ callback }) => useSSE('test-job-123', { onOutput: callback }), {
      initialProps: { callback: onOutput1 },
    });

    expect(MockEventSource.instances).toHaveLength(1);
    const instance = MockEventSource.instances[0]!;

    // Change callback
    rerender({ callback: onOutput2 });

    // Should still be the same EventSource instance
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]!).toBe(instance);

    // New callback should be used
    instance.simulateEvent('output', { line: 'test line', timestamp: 123 });
    expect(onOutput1).not.toHaveBeenCalled();
    expect(onOutput2).toHaveBeenCalledWith('test line');
  });
});
