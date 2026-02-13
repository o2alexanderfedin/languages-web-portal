# Phase 3: Process Execution & Sandboxing - Research

**Researched:** 2026-02-12
**Domain:** Node.js child process management, Linux sandboxing, concurrency control, rate limiting
**Confidence:** HIGH

## Summary

Phase 3 requires executing CLI tools in sandboxed environments with resource limits, concurrency control, and rate limiting. The standard approach combines **execa** for robust process management, **p-queue** for in-memory concurrency control, **express-rate-limit** with optional Redis backing for rate limiting, and **Server-Sent Events (SSE)** for real-time output streaming.

Key security insight: Docker containers alone don't provide sufficient isolation for untrusted CLI tools. Defense-in-depth requires combining multiple layers: container capabilities dropping, no-new-privileges flag, read-only root filesystem, resource limits via cgroups, and network isolation.

For this phase, the production server already runs in Docker, so additional sandboxing should leverage Docker security features (drop capabilities, no-new-privileges, read-only mounts) rather than adding nested virtualization or gVisor.

**Primary recommendation:** Use execa for process execution with built-in cleanup and timeout handling, p-queue for concurrency control (limit to CPU core count), express-rate-limit for per-IP rate limiting, and Docker security hardening for sandboxing (drop all capabilities except needed ones, enable no-new-privileges, mount tool directories read-only).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | 9.x (latest) | Child process execution | Promise-based API, automatic cleanup, zombie process prevention, better error handling than native child_process |
| p-queue | 8.x | In-memory concurrency queue | Simple, lightweight, no Redis dependency, perfect for single-server deployments with CPU-bound concurrency limits |
| express-rate-limit | 7.x | Per-IP rate limiting | 10M+ weekly downloads, flexible configuration, Redis store available for distributed systems |
| ioredis | 5.x (optional) | Redis client for rate-limit-redis | Required only if scaling horizontally across multiple server instances |
| rate-limit-redis | 4.x (optional) | Redis store for express-rate-limit | Enables distributed rate limiting across multiple server instances |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| BullMQ | 5.x | Redis-backed job queue | Only if job persistence is required (not needed for ephemeral projects) |
| firejail | 0.9.x | Additional Linux sandboxing | Only if running outside Docker and need namespace isolation |
| terminate | 2.x | Process tree termination | Fallback for killing entire process trees if execa's cleanup fails |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execa | Native child_process | Less code but manual cleanup, no zombie prevention, weaker error handling |
| p-queue | BullMQ + Redis | Adds Redis dependency for features (persistence, distributed workers) not needed for ephemeral projects |
| express-rate-limit | Custom implementation | Reinventing well-tested solution, no distributed support |
| Docker security | gVisor or Firecracker | Stronger isolation but massive complexity increase, not needed for CLI tools |

**Installation:**
```bash
npm install execa p-queue express-rate-limit

# Optional: for distributed rate limiting across multiple servers
npm install ioredis rate-limit-redis
```

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
├── services/
│   ├── projectService.ts       # [EXISTS] Project isolation
│   ├── executionService.ts     # [NEW] CLI tool execution with sandboxing
│   └── queueService.ts         # [NEW] Concurrency control with p-queue
├── middleware/
│   ├── rateLimiter.ts          # [NEW] Per-IP rate limiting
│   └── errorHandler.ts         # [EXISTS] Error handling
├── routes/
│   ├── execute.ts              # [NEW] POST /api/execute - start tool execution
│   └── stream.ts               # [NEW] GET /api/stream/:jobId - SSE for output
├── config/
│   ├── tools.ts                # [NEW] Tool definitions with status badges
│   └── limits.ts               # [NEW] Resource limit constants
└── types/
    └── execution.ts            # [NEW] Execution types
```

### Pattern 1: Process Execution with Resource Limits
**What:** Execute CLI tools using execa with timeout, signal handling, and output streaming
**When to use:** Every CLI tool invocation
**Example:**
```typescript
// Source: https://github.com/sindresorhus/execa
import { execa } from 'execa';

async function executeCliTool(
  command: string,
  args: string[],
  options: {
    cwd: string;
    timeout: number;
    onOutput: (data: string) => void;
  }
) {
  const subprocess = execa(command, args, {
    cwd: options.cwd,
    timeout: options.timeout, // milliseconds
    killSignal: 'SIGTERM',
    cleanup: true, // Ensures zombie process prevention
    reject: false, // Don't throw on non-zero exit
    all: true, // Combine stdout/stderr
    buffer: false, // Stream output instead of buffering
  });

  // Stream output line by line
  for await (const line of subprocess) {
    options.onOutput(line);
  }

  const result = await subprocess;
  return {
    exitCode: result.exitCode,
    killed: result.killed,
    timedOut: result.timedOut,
  };
}
```

### Pattern 2: Concurrency Control with p-queue
**What:** Limit concurrent CLI executions to CPU core count with queue position feedback
**When to use:** All execution requests
**Example:**
```typescript
// Source: https://github.com/sindresorhus/p-queue
import PQueue from 'p-queue';
import os from 'os';

class QueueService {
  private queue: PQueue;

  constructor() {
    const cpuCount = os.cpus().length;
    this.queue = new PQueue({
      concurrency: cpuCount,
      autoStart: true,
    });
  }

  async addJob<T>(fn: () => Promise<T>): Promise<T> {
    return this.queue.add(fn);
  }

  getQueueStatus() {
    return {
      pending: this.queue.pending,
      size: this.queue.size, // Queued jobs
      isPaused: this.queue.isPaused,
    };
  }

  // Calculate estimated wait time
  getEstimatedWaitTime(): number {
    const avgJobDuration = 30000; // 30s average
    const queuePosition = this.queue.size;
    const concurrency = this.queue.concurrency;

    return Math.ceil(queuePosition / concurrency) * avgJobDuration;
  }
}
```

### Pattern 3: Per-IP Rate Limiting with Express
**What:** Prevent abuse with per-IP request limits (5 concurrent, 20/hour)
**When to use:** All execution endpoints
**Example:**
```typescript
// Source: https://www.npmjs.com/package/express-rate-limit
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis'; // Optional
import { Redis } from 'ioredis';

// Simple in-memory rate limiting (single server)
export const executeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Distributed rate limiting (multi-server, optional)
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null, // Required for BullMQ/rate limiting
});

export const distributedRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:',
  }),
});
```

### Pattern 4: Server-Sent Events (SSE) for Output Streaming
**What:** Stream CLI tool output in real-time to client
**When to use:** All long-running tool executions
**Example:**
```typescript
// Source: https://oneuptime.com/blog/post/2026-01-24-nodejs-server-sent-events/view
import { Request, Response } from 'express';

export function setupSSEStream(req: Request, res: Response, jobId: string) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection
  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify({ jobId })}\n\n`);

  // Send output line
  const sendOutput = (line: string) => {
    res.write('event: output\n');
    res.write(`data: ${JSON.stringify({ line })}\n\n`);
  };

  // Send completion
  const sendComplete = (exitCode: number) => {
    res.write('event: complete\n');
    res.write(`data: ${JSON.stringify({ exitCode })}\n\n`);
    res.end();
  };

  // Client disconnect handling
  req.on('close', () => {
    // Cleanup job if client disconnects
    console.log(`Client disconnected from job ${jobId}`);
  });

  return { sendOutput, sendComplete };
}
```

### Pattern 5: Docker Security Hardening
**What:** Configure Docker for process sandboxing with defense-in-depth
**When to use:** Production deployment
**Example:**
```dockerfile
# Source: https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
FROM node:22-alpine

# Run as non-root user
RUN addgroup -g 1001 appuser && \
    adduser -D -u 1001 -G appuser appuser

# Copy and set ownership
COPY --chown=appuser:appuser . /app
WORKDIR /app

# Install dependencies
RUN npm ci --production

USER appuser

# Expose port
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml security configuration
# Source: https://thelinuxcode.com/docker-security-best-practices-2026
services:
  server:
    build: .
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
    cap_drop:
      - ALL  # Drop all Linux capabilities
    cap_add:
      - NET_BIND_SERVICE  # Only add needed capabilities
    read_only: true  # Read-only root filesystem
    tmpfs:
      - /tmp  # Writable temporary directory
      - /app/uploads  # Writable upload directory
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 512M
        reservations:
          cpus: '1.0'
          memory: 256M
```

### Anti-Patterns to Avoid

- **Using child_process.exec() with user input**: NEVER pass unsanitized user input to shell-executing functions. Use execFile or execa with argument arrays.
  ```typescript
  // ❌ DANGEROUS
  exec(`tool ${userInput}`); // Shell injection vulnerability

  // ✅ SAFE
  execa('tool', [userInput]); // Arguments safely escaped
  ```

- **Forgetting zombie process cleanup**: Always use execa's `cleanup: true` or manually handle child process termination on parent exit.

- **Not streaming large output**: NEVER buffer large process output in memory. Use streaming with `buffer: false` in execa.

- **Ignoring cgroups v2 memory limits**: Node.js 22+ respects cgroup memory limits, but verify container resource limits are configured.

- **Running containers as root**: Always create and switch to non-root user in Dockerfile.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Process execution | Custom child_process wrapper | execa | Handles zombie processes, cleanup on crash, timeout edge cases, signal propagation |
| Concurrency limiting | Custom semaphore/queue | p-queue | Handles promise queue, backpressure, priority, edge cases in async execution |
| Rate limiting | Custom request counter | express-rate-limit | Handles distributed scenarios (Redis), sliding windows, memory leaks, standardized headers |
| SSE connection management | Manual res.write() handling | express-sse or pattern | Client reconnection, heartbeats, browser compatibility edge cases |
| Process sandboxing | Custom chroot/namespace code | Docker + security options | Kernel-level isolation, capabilities management, tested extensively |

**Key insight:** Child process management and sandboxing have numerous edge cases (zombie processes, signal handling, timeout races, stream backpressure, capability management). Mature libraries and Docker security features handle these correctly.

## Common Pitfalls

### Pitfall 1: Zombie Processes After Crash
**What goes wrong:** Parent Node.js process crashes but child CLI tools keep running as zombies, consuming resources
**Why it happens:** child_process doesn't automatically kill children when parent exits unexpectedly
**How to avoid:** Use execa with `cleanup: true` option, which registers signal handlers to kill children on SIGTERM/SIGINT
**Warning signs:** `ps aux` shows orphaned processes after server restart, memory/CPU usage grows over time

### Pitfall 2: maxBuffer Exceeded with Large Output
**What goes wrong:** CLI tool produces >1MB output, process hangs or throws ERR_CHILD_PROCESS_STDIO_MAXBUFFER
**Why it happens:** Default buffering behavior in child_process limits output to 1MB
**How to avoid:** Use execa with `buffer: false` and stream output line-by-line, never buffer to completion
**Warning signs:** Tools succeed locally but hang/fail in production, "maxBuffer exceeded" errors

### Pitfall 3: Shell Injection via User Input
**What goes wrong:** User uploads file with name like `; rm -rf /;` and it executes arbitrary commands
**Why it happens:** Using child_process.exec() or shell:true with unsanitized input
**How to avoid:** ALWAYS use argument arrays with execa/execFile, NEVER interpolate user input into command strings
**Warning signs:** Security audits flag command injection, unexpected server behavior after file uploads

### Pitfall 4: Resource Exhaustion Without Concurrency Limits
**What goes wrong:** 100 users simultaneously execute CPU-intensive tools, server becomes unresponsive
**Why it happens:** No concurrency control, spawning unlimited child processes
**How to avoid:** Use p-queue with concurrency = CPU core count (typically 4-16)
**Warning signs:** Server load spikes >100%, response times degrade, process count grows unbounded

### Pitfall 5: Rate Limit Bypass Across Multiple Servers
**What goes wrong:** User sends 20 requests to each of 5 servers, bypassing 20/hour limit
**Why it happens:** In-memory rate limiting doesn't share state across instances
**How to avoid:** Use Redis-backed rate-limit-redis for distributed deployments
**Warning signs:** Abuse continues despite rate limiting, different servers show different counts

### Pitfall 6: SSE Connection Not Closing
**What goes wrong:** Client disconnects but server keeps process running and SSE stream open
**Why it happens:** Not listening to req.on('close') to cleanup when client disconnects
**How to avoid:** Always register close handler to kill child process when client disconnects
**Warning signs:** Orphaned processes accumulate, memory leaks on client refreshes

### Pitfall 7: Docker Container Has Too Many Capabilities
**What goes wrong:** Compromised CLI tool can escape container or attack host
**Why it happens:** Running container with default capabilities instead of dropping all
**How to avoid:** Use cap_drop: ALL and cap_add only specific needed capabilities
**Warning signs:** Security scans show excessive container permissions

### Pitfall 8: Timeout Doesn't Kill Process Tree
**What goes wrong:** CLI tool spawns child processes, timeout kills parent but children continue
**Why it happens:** SIGTERM only sent to direct child, not entire process tree
**How to avoid:** execa automatically kills process tree; verify tools don't use detached processes
**Warning signs:** Processes remain after timeout, resource usage doesn't decrease

## Code Examples

Verified patterns from official sources:

### Executing CLI Tool with All Safeguards
```typescript
// Source: Combining execa, p-queue, and SSE patterns
import { execa } from 'execa';
import { QueueService } from './queueService.js';
import { setupSSEStream } from './sseHelpers.js';

async function executeTool(
  req: Request,
  res: Response,
  tool: string,
  args: string[],
  projectPath: string
) {
  const { sendOutput, sendComplete } = setupSSEStream(req, res, jobId);

  try {
    // Add to queue (respects concurrency limit)
    await queueService.addJob(async () => {
      const subprocess = execa(tool, args, {
        cwd: projectPath,
        timeout: 60000, // 60s timeout
        killSignal: 'SIGTERM',
        cleanup: true,
        reject: false,
        all: true,
        buffer: false,
      });

      // Handle client disconnect
      let killed = false;
      req.on('close', () => {
        if (!killed) {
          killed = true;
          subprocess.kill('SIGTERM');
        }
      });

      // Stream output
      if (subprocess.all) {
        for await (const line of subprocess.all) {
          sendOutput(line);
        }
      }

      const result = await subprocess;
      sendComplete(result.exitCode || 0);
    });
  } catch (error) {
    res.write('event: error\n');
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}
```

### Complete Rate Limiter Configuration
```typescript
// Source: https://github.com/express-rate-limit/express-rate-limit
import rateLimit from 'express-rate-limit';

// Per-IP hourly limit
export const hourlyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit: 20,
      windowMs: 60 * 60 * 1000,
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Concurrent execution limit (separate from hourly)
const activeExecutions = new Map<string, number>();

export const concurrentExecutionLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const current = activeExecutions.get(ip) || 0;

  if (current >= 5) {
    return res.status(429).json({
      error: 'Too many concurrent executions',
      limit: 5,
      current,
    });
  }

  activeExecutions.set(ip, current + 1);

  // Cleanup on response finish
  res.on('finish', () => {
    const count = activeExecutions.get(ip) || 1;
    if (count <= 1) {
      activeExecutions.delete(ip);
    } else {
      activeExecutions.set(ip, count - 1);
    }
  });

  next();
};
```

### Queue Service with Position Tracking
```typescript
// Source: https://github.com/sindresorhus/p-queue
import PQueue from 'p-queue';
import os from 'os';

export class QueueService {
  private queue: PQueue;
  private jobDurations: number[] = [];
  private readonly maxDurationHistory = 100;

  constructor() {
    const cpuCount = os.cpus().length;
    this.queue = new PQueue({
      concurrency: cpuCount,
      autoStart: true,
    });
  }

  async addJob<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    const result = await this.queue.add(async () => {
      const jobResult = await fn();
      const duration = Date.now() - startTime;

      // Track duration for wait time estimation
      this.jobDurations.push(duration);
      if (this.jobDurations.length > this.maxDurationHistory) {
        this.jobDurations.shift();
      }

      return jobResult;
    });

    return result;
  }

  getQueueStatus() {
    const position = this.queue.size;
    const avgDuration = this.getAverageDuration();
    const estimatedWaitMs = Math.ceil(position / this.queue.concurrency) * avgDuration;

    return {
      position,
      pending: this.queue.pending,
      concurrency: this.queue.concurrency,
      estimatedWaitMs,
      estimatedWaitSec: Math.ceil(estimatedWaitMs / 1000),
    };
  }

  private getAverageDuration(): number {
    if (this.jobDurations.length === 0) {
      return 30000; // Default 30s estimate
    }

    const sum = this.jobDurations.reduce((a, b) => a + b, 0);
    return sum / this.jobDurations.length;
  }
}
```

### Tool Configuration with Status Badges
```typescript
// Source: Phase requirements EXEC-01, EXEC-02
export enum ToolStatus {
  AVAILABLE = 'Available',
  IN_DEVELOPMENT = 'In Development',
  COMING_SOON = 'Coming Soon',
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  command: string; // Binary path
  defaultArgs: string[];
  fileExtensions: string[]; // Supported input files
  maxExecutionTime: number; // milliseconds
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'z3',
    name: 'Z3 Theorem Prover',
    description: 'SMT solver for formal verification',
    status: ToolStatus.AVAILABLE,
    command: '/usr/local/bin/z3',
    defaultArgs: ['-smt2'],
    fileExtensions: ['.smt2', '.z3'],
    maxExecutionTime: 60000,
  },
  {
    id: 'cvc5',
    name: 'CVC5 SMT Solver',
    description: 'Automatic theorem prover',
    status: ToolStatus.IN_DEVELOPMENT,
    command: '/usr/local/bin/cvc5',
    defaultArgs: [],
    fileExtensions: ['.smt2'],
    maxExecutionTime: 60000,
  },
  // ... 6 more tools
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| child_process callbacks | execa promise-based API | 2020+ | Simpler async/await syntax, automatic cleanup |
| Custom queue implementation | p-queue | 2021+ | Mature library handles edge cases, priority support |
| In-memory rate limiting only | Redis-backed distributed limiting | 2024+ | Supports horizontal scaling across multiple servers |
| Docker default capabilities | cap_drop: ALL pattern | 2025+ | Defense-in-depth security, prevents container escape |
| Bull (deprecated) | BullMQ | 2023+ | TypeScript rewrite, better performance, active maintenance |
| cgroups v1 | cgroups v2 | 2023+ (Node 22) | Node.js container-aware, respects memory limits automatically |
| WebSocket for streaming | Server-Sent Events (SSE) | 2024+ | Simpler unidirectional streaming, auto-reconnect, lower overhead |

**Deprecated/outdated:**
- **Bull**: Maintenance mode, use BullMQ instead
- **node-seccomp**: Unmaintained, complicated, Docker security features preferred
- **child_process.exec()**: Use execFile or execa to avoid shell injection risks
- **Unlimited concurrency**: Always limit to CPU core count
- **Buffering process output**: Use streaming with buffer: false

## Open Questions

1. **Should we implement job persistence with BullMQ?**
   - What we know: BullMQ provides Redis-backed persistence, job retries, and distributed workers
   - What's unclear: Requirements say "ephemeral project directories" - does this mean jobs should also be ephemeral?
   - Recommendation: Start with p-queue (in-memory). If users request "resume interrupted jobs" feature, migrate to BullMQ

2. **What are the 8 specific CLI tools being deployed?**
   - What we know: Formal verification and transpiler tools mentioned, examples include Z3, CVC5
   - What's unclear: Complete list of 8 tools, their binaries, installation requirements
   - Recommendation: Create tools.ts config with placeholder definitions, update during implementation

3. **Should rate limiting be per-IP or per-user?**
   - What we know: "Public access with no authentication" from prior decisions
   - What's unclear: If authentication is added later, should rate limiting switch to per-user?
   - Recommendation: Implement per-IP with abstraction layer (keyGenerator function) to easily switch to per-user later

4. **Is horizontal scaling (multiple server instances) planned?**
   - What we know: "5-20 simultaneous users" suggests single server sufficient
   - What's unclear: Future growth plans, whether Redis will be needed
   - Recommendation: Start with in-memory rate limiting, document Redis migration path in code comments

5. **What's the cleanup strategy for ephemeral project directories?**
   - What we know: Phase 2 implemented project isolation with UUID directories
   - What's unclear: When to delete (after execution? after 1 hour? on server restart?)
   - Recommendation: Cleanup after execution completes + background job to delete directories older than 1 hour

## Sources

### Primary (HIGH confidence)
- [Node.js child_process documentation](https://nodejs.org/api/child_process.html) - Resource limits, timeouts, streaming, security warnings
- [execa GitHub repository](https://github.com/sindresorhus/execa) - API features, cleanup guarantees, streaming capabilities
- [express-rate-limit npm package](https://www.npmjs.com/package/express-rate-limit) - Configuration, Redis store, distributed rate limiting
- [p-queue GitHub repository](https://github.com/sindresorhus/p-queue) - Concurrency control, queue management
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) - Capabilities, no-new-privileges, best practices

### Secondary (MEDIUM confidence)
- [OneUptime: Node.js Server-Sent Events (2026-01-24)](https://oneuptime.com/blog/post/2026-01-24-nodejs-server-sent-events/view) - SSE implementation patterns
- [OneUptime: Express Rate Limiting (2026-02-02)](https://oneuptime.com/blog/post/2026-02-02-express-rate-limiting/view) - Production rate limiting strategies
- [OneUptime: BullMQ Job Queue (2026-01-06)](https://oneuptime.com/blog/post/2026-01-06-nodejs-job-queue-bullmq-redis/view) - BullMQ configuration
- [TheLinuxCode: Docker Security Best Practices 2026](https://thelinuxcode.com/docker-security-best-practices-2026-hardening-the-host-images-and-runtime-without-slowing-teams-down/) - Docker hardening
- [Red Hat: cgroups v2 impact on Node.js](https://developers.redhat.com/articles/2025/11/27/how-does-cgroups-v2-impact-java-net-and-nodejs-openshift-4) - Container memory limits

### Tertiary (LOW confidence, community resources)
- [Limiting CPU/memory of child process in Node.js](https://colinchjs.github.io/2023-10-10/08-51-46-222704-limiting-the-resources-cpumemory-of-a-child-process-in-nodejs/) - Resource limit patterns
- [GitHub: google/nsjail](https://github.com/google/nsjail) - Advanced Linux sandboxing (overkill for this use case)
- [firejail Linux man page](https://man7.org/linux/man-pages/man1/firejail.1.html) - Alternative sandboxing tool
- [Medium: Implementing Rate Limiting with Redis in Express](https://medium.com/@shivankarmehta60/implementing-rate-limiting-using-redis-in-express-js-6ce3ff812595) - Redis rate limiting examples

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - execa, p-queue, express-rate-limit are mature, widely-used libraries with official documentation
- Architecture: HIGH - Patterns verified against official docs and recent 2026 guides
- Pitfalls: MEDIUM-HIGH - Based on official Node.js warnings, GitHub issues, and production experience reports
- Docker security: HIGH - OWASP cheat sheet and official Docker documentation
- Sandboxing alternatives: LOW - gVisor/Firecracker/nsjail research is superficial, not needed for this phase

**Research date:** 2026-02-12
**Valid until:** Approximately 2026-03-12 (30 days) - Stack is mature and stable, no fast-moving changes expected
