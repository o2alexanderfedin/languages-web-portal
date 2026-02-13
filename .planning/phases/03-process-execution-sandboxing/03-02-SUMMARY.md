---
phase: 03-process-execution-sandboxing
plan: 02
subsystem: execution-engine
tags:
  - execution
  - subprocess
  - security
  - docker
  - testing
dependency_graph:
  requires:
    - 03-01-SUMMARY.md # Queue service, rate limiting, tool registry
    - 02-02-SUMMARY.md # Upload infrastructure, project service
  provides:
    - executionService # CLI tool execution via execa
    - POST /api/execute # Execute tool on project
    - GET /api/queue/status # Queue monitoring
    - Docker security hardening # Production container security
  affects:
    - Docker deployment # Security constraints, resource limits
    - Production operations # Process isolation, sandboxing
tech_stack:
  added:
    - execa v9 # Subprocess execution with safety controls
  patterns:
    - Synchronous request-response execution (blocks until completion)
    - Lazy service initialization for test compatibility
    - Timeout handling via execa built-in timeout
    - Output streaming with line accumulation
    - Status determination from exit code and flags
key_files:
  created:
    - packages/server/src/services/executionService.ts # Execa-based execution service
    - packages/server/src/routes/execute.ts # Execute and queue status routes
    - packages/server/src/__tests__/executionService.test.ts # 8 execution service tests
    - packages/server/src/__tests__/execute.test.ts # 6 route tests
  modified:
    - packages/server/src/index.ts # Register executeRouter
    - packages/server/package.json # Add execa dependency
    - docker-compose.yml # Security hardening
    - Dockerfile # Examples and uploads directory setup
decisions:
  - "Use execa v9 for subprocess execution (ESM-native, mature, secure)"
  - "Use isCanceled/isTerminated instead of 'killed' property (execa v9 API)"
  - "Synchronous request-response for Phase 3 (Phase 4 adds SSE streaming)"
  - "Lazy ProjectService initialization pattern for test environment variables"
  - "Use Node.js setTimeout for timeout tests (cross-platform compatibility)"
  - "Docker security: no-new-privileges, cap_drop ALL, read_only root, tmpfs for writable dirs"
  - "Resource limits: 4 CPU cores, 1G memory max, 1 CPU/256M reserved"
  - "Copy examples directory to production image for /api/examples endpoint"
  - "Create uploads directory with nodejs user ownership before USER switch"
metrics:
  duration: 339s
  tasks_completed: 2
  files_created: 4
  files_modified: 4
  tests_added: 14
  total_tests: 81
  completed_at: 2026-02-13T02:39:43Z
---

# Phase 03 Plan 02: Execution Service and Route Summary

**One-liner:** CLI tool execution via execa with 60s timeout, output streaming, Docker security hardening (no-new-privileges, dropped capabilities, read-only root, resource limits)

## What Was Built

### Execution Service (executionService.ts)
- **CLI tool execution via execa**: Uses `execa()` with separate command and args (prevents command injection)
- **Safety controls**: 60s timeout, `cleanup: true` for zombie prevention, `reject: false` for exit code handling
- **Output streaming**: Line-by-line accumulation with `maxOutputLines` cap (10,000 lines)
- **Status determination**: Maps execa Result to JobStatus (completed/failed/timeout/cancelled)
- **Validation**: Tool existence, tool availability, project path existence
- **Error handling**: NotFoundError for missing tool/path, UserError for unavailable tool

### Execute Route (execute.ts)
- **POST /api/execute**: Accepts `{toolId, projectId}`, validates input, resolves project path, queues job, returns ExecutionResponse
- **Rate limiting middleware**: `hourlyRateLimit` (20/hour per IP), `concurrentExecutionLimit` (5 concurrent per IP)
- **Lazy ProjectService initialization**: Same pattern as upload.ts for test compatibility
- **Synchronous request-response**: Client blocks during execution (up to 60s timeout) — Phase 4 adds SSE streaming
- **GET /api/queue/status**: Returns queue position, pending count, concurrency, estimated wait time

### Docker Security Hardening
- **docker-compose.yml security_opt**: `no-new-privileges:true` prevents privilege escalation
- **Capability dropping**: `cap_drop: ALL` removes all Linux capabilities
- **Read-only root**: `read_only: true` with `tmpfs` for `/tmp` and `/app/uploads`
- **Resource limits**: 4 CPU cores max, 1G memory max, 1 CPU/256M reserved
- **Dockerfile updates**: Copy `examples` directory, create `uploads` directory with nodejs user ownership

### Test Suite
- **executionService.test.ts (8 tests)**:
  - Success execution with output validation
  - Timeout handling (Node.js setTimeout for cross-platform compatibility)
  - Non-zero exit code handling
  - Multi-line output accumulation
  - Output callback invocation
  - Unknown tool ID error
  - Unavailable tool error
  - Non-existent project path error

- **execute.test.ts (6 tests)**:
  - Valid execution request
  - Missing toolId validation
  - Missing projectId validation
  - Empty toolId validation
  - Empty projectId validation
  - Queue status endpoint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed execa v9 API property mismatch**
- **Found during:** Task 1 build
- **Issue:** TypeScript error - `result.killed` property doesn't exist on execa v9 Result type
- **Fix:** Changed to `result.isCanceled || result.isTerminated` (correct execa v9 API)
- **Files modified:** `packages/server/src/services/executionService.ts`
- **Commit:** 8e00631

**2. [Rule 1 - Bug] Fixed test timeout command for cross-platform compatibility**
- **Found during:** Task 2 test execution
- **Issue:** `sleep` command may not exist or behave differently on macOS/Windows
- **Fix:** Changed to Node.js `setTimeout(() => {}, 10000)` for cross-platform compatibility
- **Files modified:** `packages/server/src/__tests__/executionService.test.ts`
- **Commit:** 12efd01

**3. [Rule 1 - Bug] Fixed test assertions for error response structure**
- **Found during:** Task 2 test execution
- **Issue:** Tests expected `response.body.error` to be a string, but it's an object `{type, message, details?}`
- **Fix:** Changed assertions to `response.body.error.message.toContain(...)`
- **Files modified:** `packages/server/src/__tests__/execute.test.ts`
- **Commit:** 12efd01

## Task Breakdown

### Task 1: Execution service with execa and execute route (8e00631)
**Duration:** ~4 minutes
**Files:** 4 created/modified
**Key work:**
- Installed execa v9 via `npm install execa -w @repo/server`
- Created ExecutionService with execa subprocess execution
- Implemented timeout, cleanup, output streaming, status determination
- Created execute route with POST /execute and GET /queue/status
- Applied rate limiting middleware (hourly + concurrent)
- Registered executeRouter in Express app
- Fixed execa v9 API property mismatch (killed → isCanceled/isTerminated)

### Task 2: Docker security hardening and comprehensive test suite (12efd01)
**Duration:** ~2 minutes
**Files:** 4 created/modified
**Key work:**
- Hardened docker-compose.yml: no-new-privileges, cap_drop ALL, read_only, tmpfs, resource limits
- Updated Dockerfile: copy examples, create uploads with nodejs ownership
- Created executionService.test.ts with 8 tests
- Created execute.test.ts with 6 tests
- Fixed timeout test command for cross-platform compatibility
- Fixed test assertions for error response structure
- Verified Docker build succeeds with security hardening

## Verification Results

✅ **Build:** `npm run build` passes with no TypeScript errors
✅ **Tests:** All 81 server tests pass (14 new tests added)
✅ **Linting:** `npx eslint` passes with no errors
✅ **Docker:** `docker build -t test-build .` succeeds
✅ **Security:** docker-compose.yml contains all required hardening flags
✅ **Coverage:** Tests cover success, timeout, failure, output streaming, unknown tool, unavailable tool, bad path, missing fields, queue status

## Self-Check: PASSED

**Created files exist:**
```bash
FOUND: packages/server/src/services/executionService.ts
FOUND: packages/server/src/routes/execute.ts
FOUND: packages/server/src/__tests__/executionService.test.ts
FOUND: packages/server/src/__tests__/execute.test.ts
```

**Commits exist:**
```bash
FOUND: 8e00631 (Task 1: Execution service and route)
FOUND: 12efd01 (Task 2: Docker security and tests)
```

**Docker security flags present:**
```bash
FOUND: no-new-privileges:true
FOUND: cap_drop: ALL
FOUND: read_only: true
FOUND: tmpfs: /tmp, /app/uploads
FOUND: deploy.resources.limits (cpus: 4.0, memory: 1G)
```

## Success Criteria Met

✅ POST /api/execute accepts {toolId, projectId}, queues via queueService, executes via execa, returns ExecutionResponse
✅ GET /api/queue/status returns current queue position, pending count, estimated wait time
✅ Execution service handles timeout (status=timeout), failure (status=failed), success (status=completed), cancellation (status=cancelled)
✅ Docker container hardened with no-new-privileges, dropped capabilities, read-only root, resource limits (4 CPU, 1G memory)
✅ All tests pass (81 total server tests), Docker builds, ESLint clean

## Next Steps

**Phase 03 Plan 03:** Real-time output streaming via SSE (Server-Sent Events)
- Add SSE endpoint for streaming execution output in real-time
- Update execute route to support both synchronous and streaming modes
- Add client-side SSE handling for live console output
- Test concurrent SSE streams and connection cleanup

**Phase 04:** User interface for execution console and results display
