---
phase: 01-project-setup-foundation
plan: 01
subsystem: foundation
tags: [monorepo, typescript, express, error-handling, health-check]
dependency_graph:
  requires: []
  provides:
    - TypeScript monorepo with npm workspaces
    - Shared types package (@repo/shared)
    - Express server with health endpoint
    - Error handling middleware (INFRA-04)
  affects:
    - All subsequent phases depend on this foundation
tech_stack:
  added:
    - TypeScript 5.7.2
    - Express 4.x with async error support
    - Vitest 3.x for testing
    - tsx for development
    - helmet, cors for security
    - dotenv for environment config
  patterns:
    - TypeScript project references for monorepo
    - Error class hierarchy with operational flag
    - Express middleware pattern
    - Barrel exports for clean imports
key_files:
  created:
    - packages/shared/src/types/tool.ts
    - packages/shared/src/types/api.ts
    - packages/shared/src/constants/tools.ts
    - packages/server/src/types/errors.ts
    - packages/server/src/middleware/errorHandler.ts
    - packages/server/src/routes/health.ts
    - packages/server/src/index.ts
    - packages/server/src/config/env.ts
  modified:
    - package.json (root workspace config)
    - tsconfig.json (project references)
decisions:
  - Use TypeScript project references (composite: true) for incremental builds
  - Distinguish user_error (4xx, operational) from system_error (5xx, non-operational) for INFRA-04
  - Use express-async-errors for automatic async error propagation
  - Store environment config in packages/server/.env (not root)
  - Use helmet + cors for security baseline
metrics:
  duration_seconds: 258
  tasks_completed: 2
  tests_added: 6
  tests_passing: 6
  files_created: 24
  completed_date: 2026-02-12
---

# Phase 01 Plan 01: Monorepo Skeleton and Express Server Summary

**One-liner:** TypeScript monorepo with shared types package and Express server featuring health endpoint and operational error classification (INFRA-04)

## What Was Built

Created the foundational project structure: a TypeScript monorepo using npm workspaces with two packages (`@repo/shared` and `@repo/server`). The shared package exports type definitions for tools, API responses, and error structures used across the application. The server package provides an Express HTTP server with:

- Health check endpoint (`GET /api/health`) returning status, timestamp, uptime, environment, and version
- Error handling middleware that distinguishes user errors (4xx, operational) from system errors (5xx, non-operational) per INFRA-04 requirement
- Typed environment configuration using dotenv
- Security middleware (helmet, cors)
- Comprehensive test coverage (6 tests, all passing)

The monorepo compiles via TypeScript project references, enabling incremental builds and proper type checking across packages.

## Tasks Completed

### Task 1: Monorepo skeleton and shared types package

**Commit:** ae48045

**What was done:**
- Updated root package.json with workspace configuration and build scripts
- Updated root tsconfig.json with project references to shared and server packages
- Created packages/shared with TypeScript composite configuration
- Defined Tool, ToolStatus, ToolCategory, ToolLanguage types
- Defined ApiError, ApiResponse, HealthResponse types for API contracts
- Created TOOLS constant array with 8 tool definitions matching PROJECT.md
- Verified shared package compiles and produces .d.ts declaration files

**Key files:**
- packages/shared/src/types/tool.ts (Tool type definitions)
- packages/shared/src/types/api.ts (API response envelope types)
- packages/shared/src/constants/tools.ts (8 tool definitions)
- packages/shared/package.json, tsconfig.json (package configuration)

### Task 2: Express server with health check and error handling (INFRA-04)

**Commit:** cdfe549

**What was done:**
- Created packages/server with TypeScript composite configuration and project reference to shared
- Implemented AppError base class with statusCode, isOperational, and optional details
- Implemented UserError, SystemError, NotFoundError, ValidationError error classes
- Created error handler middleware that returns `{ error: { type: "user_error"|"system_error", message, details? } }`
- Implemented health check endpoint returning HealthResponse structure
- Configured Express with helmet, cors, express-async-errors, and error handler as last middleware
- Created typed environment configuration loading from packages/server/.env
- Added comprehensive tests for health endpoint and error handling (6 tests)
- Verified server starts successfully and responds to /api/health with correct JSON

**Key files:**
- packages/server/src/types/errors.ts (Error class hierarchy)
- packages/server/src/middleware/errorHandler.ts (Error handling middleware)
- packages/server/src/routes/health.ts (Health check endpoint)
- packages/server/src/index.ts (Express server entry point)
- packages/server/src/config/env.ts (Environment configuration)
- packages/server/src/__tests__/*.test.ts (Test suite)

## Verification Results

**Build verification:**
```
npm run build → SUCCESS
- packages/shared compiles to dist/
- packages/server compiles to dist/
- All .d.ts declaration files generated
```

**Test verification:**
```
npm run test -w @repo/server → 6/6 tests passing
✓ Health check returns 200 with correct JSON structure
✓ UserError returns 4xx with type: "user_error"
✓ SystemError returns 5xx with type: "system_error"
✓ Unknown errors return 500 with generic message (no internal details exposed)
✓ NotFoundError returns 404 with type: "user_error"
✓ ValidationError returns 422 with details
```

**Runtime verification:**
```
curl http://localhost:3000/api/health → SUCCESS
{
  "status": "ok",
  "timestamp": 1770937784981,
  "uptime": 6.191533833,
  "environment": "development",
  "version": "0.0.0"
}
```

**Success criteria met:**
- [x] TypeScript project references chain (root → server → shared) compiles via `tsc --build`
- [x] Health endpoint returns correct JSON structure
- [x] Error middleware correctly classifies UserError (4xx) vs SystemError (5xx)
- [x] All server unit tests pass
- [x] Shared types are properly exported and importable
- [x] Server import of `@repo/shared` types works at compile time and runtime
- [x] Error responses follow `{ error: { type: "user_error"|"system_error", message: string } }` format

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

1. **TypeScript project references with composite: true**
   - Enables incremental builds across packages
   - Ensures proper type checking and declaration file generation
   - Required for monorepo with multiple TypeScript packages

2. **Error classification using isOperational flag**
   - UserError: isOperational = true (expected, user-facing, 4xx)
   - SystemError: isOperational = false (unexpected, internal, 5xx)
   - Enables proper error logging and response formatting per INFRA-04

3. **express-async-errors package**
   - Automatically propagates async errors to error handler middleware
   - Eliminates need for try/catch in async route handlers
   - Must be imported before Express for proper patching

4. **Environment config in packages/server/.env**
   - Server-specific configuration stays with server package
   - Root .env.example is a pointer to server configuration
   - Follows principle of package isolation

5. **Security middleware baseline**
   - helmet for HTTP header security
   - cors for cross-origin resource sharing
   - 100mb JSON limit for file uploads in future phases

## Dependencies Graph

**Phase 01 Plan 01 provides:**
- TypeScript monorepo foundation
- Shared types package
- Express server with error handling (INFRA-04)
- Health check endpoint

**Required by:**
- 01-02 (Vite dev server + SPA skeleton)
- 01-03 (Production build)
- All Phase 02 plans (file upload, validation)
- All Phase 03 plans (process execution)

## Self-Check: PASSED

**Created files verification:**
- FOUND: packages/shared/src/types/tool.ts
- FOUND: packages/shared/src/types/api.ts
- FOUND: packages/shared/src/constants/tools.ts
- FOUND: packages/server/src/types/errors.ts
- FOUND: packages/server/src/middleware/errorHandler.ts
- FOUND: packages/server/src/routes/health.ts
- FOUND: packages/server/src/index.ts
- FOUND: packages/server/src/config/env.ts

**Commits verification:**
- FOUND: ae48045 (Task 1)
- FOUND: cdfe549 (Task 2)
