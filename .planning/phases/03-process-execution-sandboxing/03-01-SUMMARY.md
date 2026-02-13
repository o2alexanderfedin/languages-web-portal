---
phase: 03-process-execution-sandboxing
plan: 01
subsystem: execution-infrastructure
tags: [p-queue, express-rate-limit, concurrency, rate-limiting, queue-management, resource-limits]

# Dependency graph
requires:
  - phase: 02-file-upload-validation
    provides: "Project service with upload directory management"
  - phase: 01-foundation
    provides: "TypeScript monorepo with shared types barrel exports"
provides:
  - "ExecutionRequest, ExecutionResponse, QueueStatus, JobStatus, ToolExecutionConfig types"
  - "QueueService with CPU-core-based concurrency control and estimated wait time"
  - "Rate limiter middleware (hourly and concurrent limits per IP)"
  - "Resource limit constants (execution timeouts, rate limits, queue config)"
  - "Tool registry mapping all 8 Hapyy tools to CLI execution configs"
affects: [03-02-execution-service, 03-03-client-tool-picker, 04-sse-streaming]

# Tech tracking
tech-stack:
  added: [p-queue@9.1.0, express-rate-limit@8.2.1]
  patterns: [CPU-core-based concurrency, per-IP rate limiting, singleton service pattern, job duration tracking for wait estimation]

key-files:
  created:
    - packages/shared/src/types/execution.ts
    - packages/server/src/config/limits.ts
    - packages/server/src/config/toolRegistry.ts
    - packages/server/src/services/queueService.ts
    - packages/server/src/middleware/rateLimiter.ts
    - packages/server/src/__tests__/queueService.test.ts
    - packages/server/src/__tests__/rateLimiter.test.ts
  modified:
    - packages/shared/src/types/index.ts
    - packages/server/package.json

key-decisions:
  - "Use p-queue v9 for concurrency control (ESM-native, mature library)"
  - "Set concurrency to os.cpus().length for optimal resource utilization"
  - "Track last 100 job durations for rolling average wait estimation"
  - "Separate hourly (20/hour) and concurrent (5 active) rate limits per IP"
  - "Mark only cpp-to-c and cpp-to-rust transpilers as available (others are placeholders)"
  - "Place command paths in /usr/local/bin (deployment configuration, not build-time dependency)"

patterns-established:
  - "Singleton service pattern for global queue management"
  - "Response.on('finish') listener for tracking concurrent request cleanup"
  - "Per-IP tracking with Map cleanup to prevent memory leaks"
  - "Rolling window history with max size constraint for statistics"

# Metrics
duration: 3.6min
completed: 2026-02-13
---

# Phase 03 Plan 01: Execution Infrastructure Summary

**CPU-core-based queue service with p-queue, per-IP rate limiting (5 concurrent/20 hourly), shared execution types, and tool registry for all 8 Hapyy tools**

## Performance

- **Duration:** 3.6 min
- **Started:** 2026-02-13T02:26:48Z
- **Completed:** 2026-02-13T02:30:26Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Created shared execution type contracts (ExecutionRequest, ExecutionResponse, QueueStatus, JobStatus, ToolExecutionConfig) importable by both client and server
- Built QueueService with p-queue limiting concurrent executions to CPU core count, tracking job durations for estimated wait time
- Implemented dual rate limiting: hourly (20/hour per IP) and concurrent (5 active per IP) with proper cleanup
- Created tool registry mapping all 8 Hapyy tools to CLI execution configs (2 available, 6 placeholders)
- Achieved 67 passing server tests (18 new tests added: 9 queueService + 9 rateLimiter)

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared execution types, resource limits config, and tool registry** - `3046248` (feat)
   - Files: execution.ts, limits.ts, toolRegistry.ts, index.ts barrel export

2. **Task 2: Queue service with p-queue and rate limiter middleware with tests** - `c4ed51d` (feat)
   - Files: queueService.ts, rateLimiter.ts, queueService.test.ts, rateLimiter.test.ts, package.json

## Files Created/Modified

### Shared Types (packages/shared/src/types/)
- `execution.ts` - ExecutionRequest, ExecutionResponse, QueueStatus, JobStatus, ToolExecutionConfig type definitions
- `index.ts` - Added execution types to barrel exports

### Server Config (packages/server/src/config/)
- `limits.ts` - EXECUTION_LIMITS (60s max timeout, 10k output lines), RATE_LIMITS (5 concurrent/20 hourly per IP), QUEUE_CONFIG (CPU cores concurrency, 30s default estimate)
- `toolRegistry.ts` - Maps all 8 TOOLS to ToolExecutionConfig with CLI commands, args, timeouts, availability

### Server Services (packages/server/src/services/)
- `queueService.ts` - PQueue-based concurrency limiter, tracks job durations for estimated wait calculation, exports singleton

### Server Middleware (packages/server/src/middleware/)
- `rateLimiter.ts` - hourlyRateLimit (express-rate-limit), concurrentExecutionLimit (custom Map-based tracking)

### Tests (packages/server/src/__tests__/)
- `queueService.test.ts` - 9 tests: job execution, concurrency control, queue status, duration tracking
- `rateLimiter.test.ts` - 9 tests: hourly limit, concurrent limit, cleanup, headers, skip health endpoint

### Dependencies
- `packages/server/package.json` - Added p-queue@9.1.0, express-rate-limit@8.2.1

## Decisions Made

1. **p-queue v9** - ESM-native, mature (10M+ downloads/week), perfect fit for our ESM monorepo
2. **CPU core count for concurrency** - Optimal resource utilization without hardcoding machine specs
3. **Rolling 100-job duration window** - Balances accuracy vs memory for wait estimation
4. **Dual rate limiting approach** - Separate hourly and concurrent limits provides both burst protection and sustained abuse prevention
5. **Cleanup on response finish** - Prevents memory leaks from concurrent execution tracking
6. **Tool registry with availability flags** - 2 tools available now, 6 placeholder configs ready for future deployment
7. **Command paths in /usr/local/bin** - Deployment concern, not build dependency; actual binaries will be installed during container setup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all dependencies installed cleanly, tests passed on first run, ESLint clean.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 03 Plan 02 (Execution Service + Route):**
- Shared execution types available for import
- Queue service ready to manage job concurrency
- Rate limiters ready to protect execution endpoint
- Tool registry ready to look up CLI configurations

**Blockers:** None

**Notes:**
- Tool binaries are not installed yet (expected - deployment concern)
- Queue service tested with synthetic jobs; will be integration-tested with real tool execution in Plan 02
- Rate limiters tested with Express mock; will be wired into actual /api/execute endpoint in Plan 02

## Self-Check: PASSED

**Files verified:**
- ✓ packages/shared/src/types/execution.ts
- ✓ packages/server/src/config/limits.ts
- ✓ packages/server/src/config/toolRegistry.ts
- ✓ packages/server/src/services/queueService.ts
- ✓ packages/server/src/middleware/rateLimiter.ts
- ✓ packages/server/src/__tests__/queueService.test.ts
- ✓ packages/server/src/__tests__/rateLimiter.test.ts

**Commits verified:**
- ✓ 3046248 - Task 1 (shared types, limits, tool registry)
- ✓ c4ed51d - Task 2 (queue service, rate limiter, tests)

---
*Phase: 03-process-execution-sandboxing*
*Completed: 2026-02-13*
