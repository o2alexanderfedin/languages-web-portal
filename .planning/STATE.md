# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Users can try any Hapyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** Phase 2 - File Upload & Validation

## Current Position

Phase: 2 of 6 (File Upload & Validation)
Plan: 1 of 2 in current phase - COMPLETE
Status: Phase 2 in progress (Plan 01 complete, Plan 02 remaining)
Last activity: 2026-02-13 — Completed Plan 02-01: Server-side upload infrastructure with defense-in-depth security

Progress: [████░░░░░░] 50% (1/6 phases complete, 1/2 plans complete in phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 7.7 minutes
- Total execution time: 0.51 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 1606s | 535s |
| 02 | 1 | 460s | 460s |

**Recent Execution Details:**

| Plan | Duration | Tasks | Files | Date |
|------|----------|-------|-------|------|
| Phase 01 P01 | 258s (4.3m) | 2 tasks | 24 files | 2026-02-12 |
| Phase 01 P02 | 508s (8.5m) | 2 tasks | 47 files | 2026-02-12 |
| Phase 01 P03 | 840s (14.0m) | 2 tasks | 45 files | 2026-02-12 |
| Phase 02 P01 | 460s (7.7m) | 2 tasks | 13 files | 2026-02-13 |

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
Stopped at: Completed 02-01-PLAN.md - Server-side upload infrastructure with defense-in-depth security validation
Resume file: None
Next: Execute Phase 02 Plan 02 (client-side upload UI) or plan next phase

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-13 after completing Phase 02 Plan 01 (File upload backend)*
