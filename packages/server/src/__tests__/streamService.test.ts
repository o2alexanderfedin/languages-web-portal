import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamService } from '../services/streamService.js';
import type { Session } from 'better-sse';
import type { ExecutionResponse } from '@repo/shared';

describe('StreamService', () => {
  let service: StreamService;

  beforeEach(() => {
    // Create fresh StreamService instance for each test (not the singleton)
    service = new StreamService();
  });

  describe('registerSession', () => {
    it('stores session and hasSession returns true', () => {
      const mockSession = {
        push: vi.fn().mockResolvedValue(undefined),
      } as unknown as Session;

      service.registerSession('job-123', mockSession);

      expect(service.hasSession('job-123')).toBe(true);
      expect(service.activeSessionCount).toBe(1);
    });
  });

  describe('unregisterSession', () => {
    it('removes session and hasSession returns false', () => {
      const mockSession = {
        push: vi.fn().mockResolvedValue(undefined),
      } as unknown as Session;

      service.registerSession('job-123', mockSession);
      expect(service.hasSession('job-123')).toBe(true);

      service.unregisterSession('job-123');
      expect(service.hasSession('job-123')).toBe(false);
      expect(service.activeSessionCount).toBe(0);
    });

    it('is safe to call on non-existent session', () => {
      expect(() => service.unregisterSession('job-999')).not.toThrow();
      expect(service.activeSessionCount).toBe(0);
    });
  });

  describe('sendOutput', () => {
    it('calls session.push with output event format', async () => {
      const mockPush = vi.fn().mockResolvedValue(undefined);
      const mockSession = {
        push: mockPush,
      } as unknown as Session;

      service.registerSession('job-123', mockSession);

      await service.sendOutput('job-123', 'Test output line');

      expect(mockPush).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          line: 'Test output line',
          timestamp: expect.any(Number),
        }),
        'output'
      );
    });

    it('is no-op when session not found', async () => {
      // Should not throw even when session doesn't exist
      await expect(service.sendOutput('job-999', 'Test line')).resolves.toBeUndefined();
    });
  });

  describe('sendComplete', () => {
    it('calls session.push with complete event and removes session', async () => {
      const mockPush = vi.fn().mockResolvedValue(undefined);
      const mockSession = {
        push: mockPush,
      } as unknown as Session;

      service.registerSession('job-123', mockSession);

      const result: ExecutionResponse = {
        jobId: 'job-123',
        status: 'completed',
        exitCode: 0,
        output: ['line1', 'line2'],
        startedAt: '2026-02-13T00:00:00.000Z',
        completedAt: '2026-02-13T00:01:00.000Z',
        durationMs: 60000,
      };

      await service.sendComplete('job-123', result);

      expect(mockPush).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith(result, 'complete');
      expect(service.hasSession('job-123')).toBe(false);
      expect(service.activeSessionCount).toBe(0);
    });

    it('is no-op when session not found', async () => {
      const result: ExecutionResponse = {
        jobId: 'job-999',
        status: 'completed',
        exitCode: 0,
      };

      // Should not throw even when session doesn't exist
      await expect(service.sendComplete('job-999', result)).resolves.toBeUndefined();
    });
  });

  describe('sendError', () => {
    it('calls session.push with error event and removes session', async () => {
      const mockPush = vi.fn().mockResolvedValue(undefined);
      const mockSession = {
        push: mockPush,
      } as unknown as Session;

      service.registerSession('job-123', mockSession);

      await service.sendError('job-123', 'Something went wrong');

      expect(mockPush).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith({ message: 'Something went wrong' }, 'error');
      expect(service.hasSession('job-123')).toBe(false);
      expect(service.activeSessionCount).toBe(0);
    });

    it('is no-op when session not found', async () => {
      // Should not throw even when session doesn't exist
      await expect(service.sendError('job-999', 'Error message')).resolves.toBeUndefined();
    });
  });

  describe('activeSessionCount', () => {
    it('reflects registered sessions', () => {
      const mockSession1 = {
        push: vi.fn().mockResolvedValue(undefined),
      } as unknown as Session;
      const mockSession2 = {
        push: vi.fn().mockResolvedValue(undefined),
      } as unknown as Session;

      expect(service.activeSessionCount).toBe(0);

      service.registerSession('job-1', mockSession1);
      expect(service.activeSessionCount).toBe(1);

      service.registerSession('job-2', mockSession2);
      expect(service.activeSessionCount).toBe(2);

      service.unregisterSession('job-1');
      expect(service.activeSessionCount).toBe(1);

      service.unregisterSession('job-2');
      expect(service.activeSessionCount).toBe(0);
    });
  });
});
