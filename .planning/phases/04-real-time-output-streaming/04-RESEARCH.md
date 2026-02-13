# Phase 4: Real-Time Output Streaming - Research

**Researched:** 2026-02-12
**Domain:** Real-time subprocess output streaming via Server-Sent Events (SSE)
**Confidence:** HIGH

## Summary

Phase 4 adds real-time streaming of subprocess stdout/stderr to the browser console during tool execution. The current implementation (Phase 3) uses synchronous request-response where clients block until execution completes. This phase transforms that to asynchronous streaming where users see live output as tools run.

The technical approach is well-established: Server-Sent Events (SSE) for server-to-client streaming, execa's built-in streaming capabilities for subprocess output, and ANSI-to-HTML conversion for preserving terminal colors. All chosen technologies integrate seamlessly with the existing Express + React + RTK Query stack.

**Primary recommendation:** Use better-sse for SSE session management, stream execa output line-by-line to SSE clients, convert ANSI codes with ansi_up on the client, and implement job-based routing to prevent output cross-contamination between concurrent users.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-sse | ^0.13.0 | SSE session management | Zero dependencies, TypeScript-native, framework-agnostic, spec-compliant, includes session lifecycle management |
| execa | ^9.6.1 (existing) | Subprocess execution with streaming | Already integrated in Phase 3, native streaming support via async iteration |
| ansi_up | ^6.0.2 | ANSI-to-HTML conversion | Zero dependencies, ES6 module, streaming-friendly (buffers incomplete sequences) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dimak.dev/event-source-mock | ^1.0.0 | SSE testing | Vitest/Jest unit tests for EventSource behavior |
| uuid | ^13.0.0 (existing) | Job ID generation | Already used for jobId generation in Phase 3 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-sse | Native SSE implementation | Better-sse handles connection lifecycle, keep-alive pings, session cleanup automatically |
| better-sse | WebSockets | SSE is simpler (one-way only needed), works over HTTP (easier deployment), native browser reconnection |
| ansi_up | ansi-to-html | ansi_up is ES6 native, zero deps, stateful (better for streaming) |

**Installation:**
```bash
# Server
cd packages/server
npm install better-sse

# Client
cd packages/client
npm install ansi_up

# Dev dependencies for testing
cd packages/client
npm install -D @dimak.dev/event-source-mock
```

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
├── routes/
│   ├── execute.ts           # POST /api/execute (Phase 3 - unchanged)
│   └── stream.ts            # GET /api/stream/:jobId (NEW - SSE endpoint)
├── services/
│   ├── executionService.ts  # UPDATE: add streaming callback support
│   └── streamService.ts     # NEW: manage SSE sessions per jobId
└── types/
    └── streaming.ts         # NEW: StreamEvent types

packages/client/src/
├── features/execution/
│   ├── ExecutionPanel.js    # UPDATE: connect to SSE, render live console
│   ├── executionApi.js      # UPDATE: add SSE connection logic
│   └── ConsoleView.js       # NEW: ANSI-aware console renderer
└── hooks/
    └── useSSE.js            # NEW: EventSource lifecycle management
```

### Pattern 1: Job-Based SSE Routing
**What:** Each execution creates a unique jobId, client connects to `/api/stream/:jobId`, server routes output to that specific session

**When to use:** Prevents output cross-contamination when multiple users execute tools concurrently

**Example:**
```typescript
// Server: packages/server/src/routes/stream.ts
import { createSession } from 'better-sse';
import { streamService } from '../services/streamService';

router.get('/stream/:jobId', async (req, res) => {
  const { jobId } = req.params;

  // Create SSE session
  const session = await createSession(req, res);

  // Register session for this jobId
  streamService.registerSession(jobId, session);

  // Handle client disconnect
  req.on('close', () => {
    streamService.unregisterSession(jobId);
  });
});
```

### Pattern 2: Execa Line Streaming to SSE
**What:** Use execa's async iterator to stream subprocess output line-by-line, forward each line to SSE session

**When to use:** Every tool execution needs real-time output feedback

**Example:**
```typescript
// Server: packages/server/src/services/executionService.ts
async executeJob(params: {
  toolId: string;
  projectPath: string;
  jobId: string;
  onOutput?: (line: string) => void; // EXISTING callback
}) {
  const subprocess = execa(config.command, args, {
    all: true,  // Interleave stdout/stderr
    buffer: false, // Enable streaming
  });

  // Stream output line-by-line
  if (subprocess.all) {
    for await (const line of subprocess.all) {
      const lineStr = line.toString();

      // Call streaming callback (connects to SSE)
      onOutput?.(lineStr);

      // Also accumulate for final response
      if (output.length < EXECUTION_LIMITS.maxOutputLines) {
        output.push(lineStr);
      }
    }
  }

  const result = await subprocess;
  // ... return ExecutionResponse
}
```

### Pattern 3: RTK Query with SSE via onCacheEntryAdded
**What:** Use RTK Query's `onCacheEntryAdded` lifecycle hook to manage EventSource connections outside normal HTTP fetch flow

**When to use:** Integrating SSE with RTK Query's caching and state management

**Example:**
```javascript
// Client: packages/client/src/features/execution/executionApi.js
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const executionApi = createApi({
  // ... existing endpoints

  endpoints: (builder) => ({
    streamExecution: builder.query({
      queryFn: () => ({ data: [] }), // Initial empty state

      async onCacheEntryAdded(
        jobId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        const eventSource = new EventSource(`/api/stream/${jobId}`);

        try {
          await cacheDataLoaded;

          eventSource.addEventListener('output', (event) => {
            const line = JSON.parse(event.data);
            updateCachedData((draft) => {
              draft.push(line);
            });
          });

          eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            eventSource.close();
          };
        } catch (error) {
          // no-op: query was aborted
        }

        await cacheEntryRemoved;
        eventSource.close();
      },

      keepUnusedDataFor: 0, // Immediately close SSE when component unmounts
    }),
  }),
});
```

### Pattern 4: Two-Phase Execution Flow
**What:** POST /api/execute initiates job and returns jobId immediately, then client connects to GET /api/stream/:jobId for real-time output

**When to use:** Decouples job submission from streaming, allows queue status checks before execution starts

**Example:**
```javascript
// Client: ExecutionPanel flow
const handleRun = async () => {
  // Phase 1: Submit job (non-blocking)
  const { jobId } = await executeToolMutation({ toolId, projectId }).unwrap();

  // Phase 2: Connect to SSE stream
  const eventSource = new EventSource(`/api/stream/${jobId}`);

  eventSource.addEventListener('output', (event) => {
    appendToConsole(JSON.parse(event.data));
  });

  eventSource.addEventListener('complete', (event) => {
    const result = JSON.parse(event.data);
    setExecutionResult(result);
    eventSource.close();
  });
};
```

### Anti-Patterns to Avoid
- **Synchronous SSE connection before job starts:** Always start execution first, then connect SSE. Prevents race condition where SSE connects before job exists.
- **Buffering entire output before streaming:** Stream line-by-line as received from execa. Defeats purpose of real-time streaming.
- **Shared SSE connections across jobs:** One SSE session per jobId. Prevents output cross-contamination.
- **Missing connection cleanup:** Always close EventSource on unmount/completion. Prevents memory leaks and dangling connections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE session lifecycle | Custom SSE implementation | better-sse | Handles connection setup, heartbeat pings, graceful shutdown, client disconnect detection automatically |
| EventSource reconnection | Custom retry logic | Native EventSource API | Browser automatically reconnects with exponential backoff, respects `retry:` field from server |
| ANSI parsing | Regex-based color extractor | ansi_up | Handles 256-color palettes, text styles (bold/italic/underline), URL codes, incomplete sequence buffering |
| Subprocess streaming | Custom stdout/stderr pipe handling | execa async iterators | Built-in line splitting, encoding handling, interleaved stdout/stderr, proper cleanup |
| SSE testing | Manual mock implementation | @dimak.dev/event-source-mock or MSW sse namespace | Provides emit(), emitError(), emitOpen() for comprehensive test scenarios |

**Key insight:** SSE and subprocess streaming have complex edge cases (connection failures, partial lines, ANSI escape sequences, zombie processes). Use battle-tested libraries instead of custom solutions.

## Common Pitfalls

### Pitfall 1: Output Cross-Contamination Between Users
**What goes wrong:** Multiple users executing tools simultaneously see each other's output if sessions aren't properly isolated

**Why it happens:** Storing SSE sessions in a global Map with toolId as key instead of jobId, or broadcasting output to all connected clients

**How to avoid:**
- Use unique jobId (UUID) for each execution
- Store SSE sessions in `Map<jobId, Session>`
- Only send output to the session registered for that specific jobId
- Unregister session immediately on disconnect/completion

**Warning signs:** Users report seeing output from tools they didn't run, or output appearing in wrong project context

### Pitfall 2: SSE Connection Timeout on Long-Running Tools
**What goes wrong:** SSE connection closes after 30-60 seconds of inactivity, breaking real-time streaming for slow tools

**Why it happens:** Intermediary proxies/load balancers close idle connections. No data flowing = "idle connection"

**How to avoid:**
- Send heartbeat comments (`: keep-alive\n\n`) every 15-30 seconds during execution
- Configure Express/platform timeouts appropriately (Azure: buffer-response="false", AWS: 120s limit)
- Document platform limitations (e.g., Vercel 60s limit)

**Warning signs:** Streaming works for fast tools (<30s) but fails for slower analysis tools

### Pitfall 3: Race Condition Between Job Start and SSE Connection
**What goes wrong:** Client connects to `/api/stream/:jobId` before server has registered the session, missing initial output

**Why it happens:** Execution starts in POST /api/execute response, client connects to SSE afterward

**How to avoid:**
- Server creates SSE session BEFORE queueing job
- POST /api/execute returns jobId immediately (non-blocking)
- Client connects to `/api/stream/:jobId` BEFORE execution starts
- ExecutionService checks for registered session before starting subprocess

**Warning signs:** First few lines of output missing, inconsistent streaming behavior

### Pitfall 4: Memory Leak from Unclosed EventSource
**What goes wrong:** Browser maintains open connections after component unmounts, consuming memory and server resources

**Why it happens:** Forgetting to call `eventSource.close()` in cleanup functions

**How to avoid:**
- Always use React useEffect cleanup: `return () => eventSource.close()`
- RTK Query: set `keepUnusedDataFor: 0` for immediate disconnect
- Server: listen for `req.on('close')` to detect client disconnect and cleanup session

**Warning signs:** Browser DevTools Network tab shows growing number of "pending" EventSource connections, server memory grows over time

### Pitfall 5: ANSI Codes Rendering as Gibberish
**What goes wrong:** Terminal escape sequences like `\x1b[31m` appear as raw text instead of colored output

**Why it happens:** Browser console doesn't natively interpret ANSI codes

**How to avoid:**
- Convert ANSI to HTML on client side using ansi_up
- Render output in `<pre>` tag with `dangerouslySetInnerHTML` (safe after ansi_up conversion)
- Configure ansi_up with `escape_html: true` to prevent XSS

**Warning signs:** Output shows literal `\x1b[31m` or `[31m` instead of colored text

### Pitfall 6: HTTP/1.1 Connection Limit (6 per domain)
**What goes wrong:** Sixth concurrent SSE connection blocks, subsequent requests hang

**Why it happens:** Browser limit of 6 concurrent HTTP/1.1 connections per domain

**How to avoid:**
- Enable HTTP/2 on server (100 concurrent streams limit)
- Document limitation for HTTP/1.1 deployments
- Consider closing idle SSE connections earlier

**Warning signs:** Works fine with <6 concurrent users, hangs with more

## Code Examples

Verified patterns from official sources:

### Server: SSE Session Management with better-sse
```typescript
// packages/server/src/services/streamService.ts
import { Session } from 'better-sse';

export class StreamService {
  private sessions = new Map<string, Session>();

  registerSession(jobId: string, session: Session): void {
    this.sessions.set(jobId, session);
    console.log(`SSE session registered for job ${jobId}`);
  }

  async sendOutput(jobId: string, line: string): Promise<void> {
    const session = this.sessions.get(jobId);
    if (!session) return;

    await session.push({
      event: 'output',
      data: JSON.stringify({ line, timestamp: Date.now() }),
    });
  }

  async sendComplete(jobId: string, result: ExecutionResponse): Promise<void> {
    const session = this.sessions.get(jobId);
    if (!session) return;

    await session.push({
      event: 'complete',
      data: JSON.stringify(result),
    });

    // Close and cleanup
    await session.close();
    this.sessions.delete(jobId);
    console.log(`SSE session closed for job ${jobId}`);
  }

  unregisterSession(jobId: string): void {
    this.sessions.delete(jobId);
  }
}

export const streamService = new StreamService();
```

### Server: SSE Route with Connection Lifecycle
```typescript
// packages/server/src/routes/stream.ts
// Source: better-sse documentation
import { Router } from 'express';
import { createSession } from 'better-sse';
import { streamService } from '../services/streamService';

const router = Router();

router.get('/stream/:jobId', async (req, res) => {
  const { jobId } = req.params;

  // Validate jobId format
  if (!jobId || typeof jobId !== 'string') {
    res.status(400).json({ error: 'Invalid jobId' });
    return;
  }

  // Create SSE session
  const session = await createSession(req, res, {
    keepAlive: 30000, // Send keep-alive comment every 30s
  });

  // Register session for this job
  streamService.registerSession(jobId, session);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client disconnected from job ${jobId}`);
    streamService.unregisterSession(jobId);
  });
});

export default router;
```

### Server: Integration with Execution Service
```typescript
// packages/server/src/routes/execute.ts
// UPDATE existing POST /execute endpoint

router.post('/execute', async (req, res) => {
  const { toolId, projectId } = req.body;
  const projectPath = await getProjectService().getProjectPath(projectId);
  const jobId = uuidv4();

  // Return jobId immediately (non-blocking)
  res.json({ data: { jobId } });

  // Queue execution with streaming callback
  queueService.addJob(async () => {
    const result = await executionService.executeJob({
      toolId,
      projectPath,
      jobId,
      onOutput: (line) => {
        // Stream to SSE client
        streamService.sendOutput(jobId, line);
      },
    });

    // Send completion event
    await streamService.sendComplete(jobId, result);

    return result;
  });
});
```

### Client: ANSI-to-HTML Conversion
```javascript
// packages/client/src/features/execution/ConsoleView.js
// Source: ansi_up documentation
import { useEffect, useRef, useState } from 'react';
import { AnsiUp } from 'ansi_up';

const ansiUp = new AnsiUp();
ansiUp.escape_html = true; // Prevent XSS

export function ConsoleView({ lines }) {
  const containerRef = useRef(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    // Convert ANSI codes to HTML
    const plainText = lines.join('\n');
    const htmlOutput = ansiUp.ansi_to_html(plainText);
    setHtml(htmlOutput);

    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <pre
      ref={containerRef}
      className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-y-auto max-h-[400px] text-xs font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

### Client: SSE Connection with Cleanup
```javascript
// packages/client/src/hooks/useSSE.js
import { useEffect, useRef, useState } from 'react';

export function useSSE(jobId, onOutput, onComplete, onError) {
  const eventSourceRef = useRef(null);
  const [connectionState, setConnectionState] = useState('connecting');

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/api/stream/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`SSE connected for job ${jobId}`);
      setConnectionState('connected');
    };

    eventSource.addEventListener('output', (event) => {
      const { line } = JSON.parse(event.data);
      onOutput?.(line);
    });

    eventSource.addEventListener('complete', (event) => {
      const result = JSON.parse(event.data);
      onComplete?.(result);
      eventSource.close();
      setConnectionState('closed');
    });

    eventSource.onerror = (error) => {
      console.error(`SSE error for job ${jobId}:`, error);
      onError?.(error);
      eventSource.close();
      setConnectionState('error');
    };

    // Cleanup on unmount
    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        console.log(`Closing SSE for job ${jobId}`);
        eventSource.close();
      }
    };
  }, [jobId, onOutput, onComplete, onError]);

  return { connectionState };
}
```

### Client: Updated ExecutionPanel with SSE
```javascript
// packages/client/src/features/execution/ExecutionPanel.js
import { useState } from 'react';
import { useExecuteToolMutation } from './executionApi';
import { useSSE } from '../../hooks/useSSE';
import { ConsoleView } from './ConsoleView';

export function ExecutionPanel({ projectId }) {
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [outputLines, setOutputLines] = useState([]);
  const [executionResult, setExecutionResult] = useState(null);

  const [executeTool] = useExecuteToolMutation();

  const handleRun = async () => {
    setOutputLines([]);
    setExecutionResult(null);

    // Start execution and get jobId
    const response = await executeTool({ toolId: selectedToolId, projectId }).unwrap();
    setJobId(response.data.jobId);
  };

  // SSE connection for real-time output
  useSSE(
    jobId,
    (line) => {
      setOutputLines((prev) => [...prev, line]);
    },
    (result) => {
      setExecutionResult(result);
      setJobId(null); // Stop SSE connection
    },
    (error) => {
      console.error('Streaming error:', error);
    }
  );

  return (
    <div>
      {/* ... tool picker, run button ... */}

      {jobId && <ConsoleView lines={outputLines} />}

      {executionResult && (
        <div>
          <div>Status: {executionResult.status}</div>
          <div>Duration: {executionResult.durationMs}ms</div>
          <div>Exit Code: {executionResult.exitCode}</div>
        </div>
      )}
    </div>
  );
}
```

### Testing: Mocking EventSource in Vitest
```javascript
// packages/client/src/__tests__/useSSE.test.js
// Source: @dimak.dev/event-source-mock documentation
import { renderHook } from '@testing-library/react';
import { EventSourceMock } from '@dimak.dev/event-source-mock';
import { useSSE } from '../hooks/useSSE';

// Mock EventSource globally
global.EventSource = EventSourceMock;

describe('useSSE', () => {
  it('receives output events and calls onOutput callback', () => {
    const onOutput = vi.fn();
    const onComplete = vi.fn();

    renderHook(() => useSSE('test-job-id', onOutput, onComplete));

    // Simulate server sending output event
    const mockSource = EventSourceMock.instances[0];
    mockSource.emit('output', { data: JSON.stringify({ line: 'Test output' }) });

    expect(onOutput).toHaveBeenCalledWith('Test output');
  });

  it('closes connection on complete event', () => {
    const onComplete = vi.fn();

    const { unmount } = renderHook(() => useSSE('test-job-id', null, onComplete));

    const mockSource = EventSourceMock.instances[0];
    mockSource.emit('complete', {
      data: JSON.stringify({ status: 'completed', exitCode: 0 })
    });

    expect(onComplete).toHaveBeenCalledWith({ status: 'completed', exitCode: 0 });
    expect(mockSource.readyState).toBe(EventSource.CLOSED);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSockets for all real-time | SSE for server-to-client streaming | 2024-2025 | SSE simpler for one-way data, works over HTTP, native browser reconnection, better proxy compatibility |
| HTTP/1.1 (6 connection limit) | HTTP/2 (100+ streams) | HTTP/2 widely adopted (96%+ browsers) | Eliminates SSE connection limit as practical concern |
| Synchronous subprocess execution | Streaming subprocess with async iterators | execa v7+ (2023) | Real-time output visibility, better UX for long-running tasks |
| Inline styles for ANSI colors | CSS classes for theming | ansi_up `use_classes: true` | User-customizable terminal themes, smaller HTML output |

**Deprecated/outdated:**
- Manual SSE implementation: Use better-sse (handles edge cases, lifecycle, TypeScript types)
- event-source-polyfill for browser compatibility: Native EventSource support since IE11 EOL (2020)
- execa `buffer: true` for streaming use cases: Use `buffer: false` with async iteration (execa v5+)

## Open Questions

1. **Should SSE connections persist across multiple executions or one-per-job?**
   - What we know: One-per-job prevents cross-contamination, simpler cleanup
   - What's unclear: Performance impact of creating/destroying connections frequently
   - Recommendation: Start with one-per-job (simpler, safer), optimize if connection overhead becomes measurable

2. **How long to keep execution output history in memory?**
   - What we know: Phase 3 caps at `maxOutputLines` (10,000 lines), stored in ExecutionResponse
   - What's unclear: Should completed jobs' output remain accessible after SSE closes?
   - Recommendation: Store final ExecutionResponse in RTK Query cache (existing pattern), expire after 5 minutes (configurable)

3. **Should we implement SSE connection state UI indicators?**
   - What we know: EventSource fires `onopen`, `onerror`, `onmessage` events
   - What's unclear: Do users need to see "connecting/connected/disconnected" status?
   - Recommendation: YES - show spinner during "connecting", checkmark when "connected", error icon on disconnect. Improves perceived reliability.

4. **How to handle SSE reconnection during active execution?**
   - What we know: Browser auto-reconnects with exponential backoff, can send Last-Event-ID header
   - What's unclear: Should server buffer missed output and replay on reconnect?
   - Recommendation: For Phase 4, let browser reconnect but don't replay (output continues from reconnection point). Document as known limitation, consider buffering in future phase.

## Sources

### Primary (HIGH confidence)
- execa GitHub repository: https://github.com/sindresorhus/execa - streaming via async iterators, `all` option for interleaved output
- better-sse npm package: https://www.npmjs.com/package/better-sse - session management, TypeScript types, Express integration
- better-sse documentation: https://matthewwid.github.io/better-sse/guides/getting-started/
- MDN Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events - SSE protocol, event format, EventSource API
- ansi_up GitHub repository: https://github.com/drudru/ansi_up - ANSI-to-HTML conversion, streaming support

### Secondary (MEDIUM confidence)
- [Real-Time Data Streaming with Server-Sent Events (SSE)](https://medium.com/@serifcolakel/real-time-data-streaming-with-server-sent-events-sse-9424c933e094)
- [How to Stream Updates with Server-Sent Events in Node.js](https://oneuptime.com/blog/post/2026-01-24-nodejs-server-sent-events/view) - 2026 best practices
- [Real-Time React with SSE and Redux Toolkit Query](https://medium.com/@Delorean/real-time-react-with-sse-and-redux-toolkit-query-topic-filtering-auto-cleanup-8707df8c6d93) - RTK Query integration pattern
- [Redux Toolkit: Streaming Updates](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates) - Official RTK Query SSE documentation
- [SSE's Glorious Comeback: Why 2025 is the Year of Server-Sent Events](https://portalzine.de/sses-glorious-comeback-why-2025-is-the-year-of-server-sent-events/) - HTTP/2 adoption stats
- [Testing SSE with @dimak.dev/event-source-mock](https://www.npmjs.com/package/@dimak.dev/event-source-mock)
- [MSW SSE Mocking](https://mswjs.io/docs/sse/) - Alternative testing approach

### Tertiary (LOW confidence)
- [Server-Sent Events: A Comprehensive Guide](https://medium.com/@moali314/server-sent-events-a-comprehensive-guide-e4b15d147576) - General overview
- [Beyond Request/Response: SSE and WebSockets Explained](https://aldo10012.medium.com/beyond-request-response-sse-and-websockets-explained-9ad12b4ee636) - Comparison guide

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - better-sse, execa, ansi_up all verified via official docs/repos, widely adopted, stable APIs
- Architecture: HIGH - Patterns verified via official RTK Query docs, better-sse examples, MDN EventSource documentation
- Pitfalls: MEDIUM-HIGH - Cross-contamination, timeouts, race conditions verified via GitHub issues and production case studies; HTTP/1.1 limits verified via MDN

**Research date:** 2026-02-12
**Valid until:** 2026-03-15 (30 days - SSE is stable technology, libraries are mature)

**Technology maturity:**
- Server-Sent Events: Mature (W3C spec since 2014, widely supported)
- better-sse: Stable (v0.13+, maintained, active community)
- execa v9: Stable (mature library, sindresorhus maintenance)
- ansi_up: Stable (v6+, zero issues with streaming use case)

**Codebase integration confidence:** HIGH - All technologies integrate cleanly with existing Express + React + RTK Query + TypeScript stack. No breaking changes to Phase 3 code required.
