# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Users can try any Hapyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** Phase 3 - Process Execution & Sandboxing

## Current Position

Phase: 3 of 6 (Process Execution & Sandboxing)
Plan: 2 of 3 in current phase - COMPLETE
Status: Phase 3 in progress (2 of 3 plans complete)
Last activity: 2026-02-13 — Completed Plan 03-02: Execution service and route with execa and Docker security

Progress: [████████░░] 40% (2/6 phases complete, 2/3 plans complete in phase 3)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 6.4 minutes
- Total execution time: 0.75 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 1606s | 535s |
| 02 | 2 | 913s | 457s |
| 03 | 2 | 557s | 279s |

**Recent Execution Details:**

| Plan | Duration | Tasks | Files | Date |
|------|----------|-------|-------|------|
| Phase 01 P01 | 258s (4.3m) | 2 tasks | 24 files | 2026-02-12 |
| Phase 01 P02 | 508s (8.5m) | 2 tasks | 47 files | 2026-02-12 |
| Phase 01 P03 | 840s (14.0m) | 2 tasks | 45 files | 2026-02-12 |
| Phase 02 P01 | 460s (7.7m) | 2 tasks | 13 files | 2026-02-13 |
| Phase 02 P02 | 453s (7.5m) | 2 tasks | 26 files | 2026-02-13 |
| Phase 03 P01 | 218s (3.6m) | 2 tasks | 9 files | 2026-02-13 |
| Phase 03 P02 | 339s (5.6m) | 2 tasks | 8 files | 2026-02-13 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- TypeScript + Node.js full stack chosen (user preference, consistency with TS linter tool)
- Public access with no authentication (demo portal, minimal friction)
- Real-time console streaming via SSE (users need to see tool progress)
- Ephemeral project directories (no persistent storage needed)
- Show all tools with status badges (demonstrate ecosystem breadth)

**Phase 01 Plan 01 decisions:**
- Use TypeScript project references (composite: true) for incremental builds
- Distinguish user_error (4xx, operational) from system_error (5xx, non-operational) for INFRA-04
- Use express-async-errors for automatic async error propagation
- Store environment config in packages/server/.env (not root)
- Use helmet + cors for security baseline

**Phase 01 Plan 02 decisions:**
- Use React 18.3 (stable) instead of React 19 (canary)
- Use Tailwind CSS v4 with @tailwindcss/vite plugin
- Use shadcn/ui "New York" style for component aesthetic
- Use Vite appType "spa" for automatic index.html serving
- Simplify tsx dev script (no watch mode) to avoid Vite temp file conflicts
- Use CSS variables for theming (Tailwind v4 compatible)

**Phase 01 Plan 03 decisions:**
- Use multi-stage Docker build to minimize production image size
- Use node:22-alpine for smallest possible base image
- Use ESLint v9 flat config (latest standard, no legacy .eslintrc)
- Disable ESLint formatting rules via eslint-config-prettier to avoid conflicts
- Run non-root user (nodejs:1001) in production container for security
- Add Docker HEALTHCHECK using wget for container orchestration
- Disable helmet CSP in dev mode to allow Vite HMR (keep enabled in production)

**Phase 02 Plan 01 decisions:**
- Use multer memoryStorage instead of diskStorage for validation before disk write
- Use yauzl for ZIP parsing (pompelmi doesn't exist as npm package)
- Lazy ProjectService initialization to support test environment variables
- Defense-in-depth security: multer MIME filter -> magic bytes -> ZIP security -> path validation
- Archiver normalizes path traversal in test ZIPs (library safety feature)

**Phase 02 Plan 02 decisions:**
- Use react-dropzone for drag-and-drop upload (industry standard, 100KB gzipped)
- Create 6 realistic example projects demonstrating actual use cases (3 per tool)
- Resolve example directory path via ../../examples from dist/ (TypeScript compiles to dist/)
- Client-side validation before server upload for immediate feedback and reduced server load

**Phase 03 Plan 01 decisions:**
- Use p-queue v9 for concurrency control (ESM-native, mature library)
- Set concurrency to os.cpus().length for optimal resource utilization
- Track last 100 job durations for rolling average wait estimation
- Separate hourly (20/hour) and concurrent (5 active) rate limits per IP
- Mark only cpp-to-c and cpp-to-rust transpilers as available (others are placeholders)
- Place command paths in /usr/local/bin (deployment configuration, not build-time dependency)

**Phase 03 Plan 02 decisions:**
- Use execa v9 for subprocess execution (ESM-native, mature, secure)
- Use isCanceled/isTerminated instead of 'killed' property (execa v9 API)
- Synchronous request-response for Phase 3 (Phase 4 adds SSE streaming)
- Lazy ProjectService initialization pattern for test environment variables
- Use Node.js setTimeout for timeout tests (cross-platform compatibility)
- Docker security: no-new-privileges, cap_drop ALL, read_only root, tmpfs for writable dirs
- Resource limits: 4 CPU cores, 1G memory max, 1 CPU/256M reserved
- Copy examples directory to production image for /api/examples endpoint
- Create uploads directory with nodejs user ownership before USER switch

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 2 (File Upload & Validation):**
- Research completed: Standard patterns well-documented, no additional research needed

**Phase 3 (Process Execution & Sandboxing):**
- Needs deeper research during planning: Sandboxing strategies (gVisor vs microVMs vs Docker), cgroup configuration, Linux security profiles (seccomp/apparmor), formal verification tool-specific hardening
- High security stakes justify dedicated research during plan-phase

**Phase 4-6:**
- No blockers identified; standard patterns

## Session Continuity

Last session: 2026-02-13 (plan execution)
Stopped at: Completed 03-02-PLAN.md - Execution service and route with execa and Docker security
Resume file: None
Next: Execute Phase 03 Plan 03 (Real-time output streaming via SSE) or continue verification

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-13 after completing Phase 03 Plan 02 (Execution service and route) - Phase 3 in progress*
