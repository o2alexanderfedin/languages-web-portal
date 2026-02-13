# Roadmap: Hapyy Languages Web Portal

## Overview

This roadmap delivers a public demo web portal for Hapyy's formal verification and transpiler tools. Starting with project setup and security-critical file handling, we progress through sandboxed CLI execution, real-time streaming output, result visualization, and polish the experience with landing pages and examples. Each phase delivers a complete, verifiable capability, with security concerns addressed early to avoid architectural rewrites.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Setup & Foundation** - TypeScript/Node infrastructure and basic Express server
- [x] **Phase 2: File Upload & Validation** - Secure zip upload with extraction and isolated directories
- [x] **Phase 3: Process Execution & Sandboxing** - CLI tool spawning with resource limits and concurrency control
- [x] **Phase 4: Real-Time Output Streaming** - SSE-based stdout/stderr streaming to browser console
- [x] **Phase 5: Output Preview & Download** - Result visualization, file tree, and downloadable outputs
- [ ] **Phase 6: Landing Page & Examples** - Marketing content, tool comparison, and example gallery

## Phase Details

### Phase 1: Project Setup & Foundation
**Goal**: Development environment ready with TypeScript, Node.js, and basic Express server configured
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-04
**Success Criteria** (what must be TRUE):
  1. TypeScript full-stack project compiles without errors
  2. Express server responds to health check endpoint
  3. Environment variables load correctly from configuration
  4. Project can be containerized for Digital Ocean deployment
  5. Clear error messages distinguish user errors from system errors
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Monorepo skeleton, shared types package, Express server with health check and error handling (INFRA-04)
- [x] 01-02-PLAN.md -- React client with Vite, Tailwind, shadcn/ui, Redux Toolkit, RTK Query, Router, theme toggle, Vite-Express integration
- [x] 01-03-PLAN.md -- Docker multi-stage build, ESLint, Prettier, and human verification checkpoint

### Phase 2: File Upload & Validation
**Goal**: Users can securely upload zip files that are extracted into isolated directories with security validation
**Depends on**: Phase 1
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, INFRA-01
**Success Criteria** (what must be TRUE):
  1. User can upload zip file via drag-and-drop or file picker in browser
  2. User sees maximum upload size limit (100MB) displayed before attempting upload
  3. Browser validates file type (.zip only) and size before sending to server
  4. Server extracts uploaded zip into isolated project directory with UUID-based path
  5. Server rejects malicious archives (zip bombs, path traversal, symlinks) with clear error messages
  6. User can load pre-built example projects (3-5 per tool) with one click
  7. Each client session gets isolated project directory that prevents cross-contamination
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- Server upload infrastructure: project isolation service, path security, MIME validation, multer + ZIP security middleware, upload route
- [x] 02-02-PLAN.md -- Client upload UI with react-dropzone, RTK Query integration, example projects service, and pre-built example data

### Phase 3: Process Execution & Sandboxing
**Goal**: CLI tools execute in sandboxed environments with resource limits and concurrency control
**Depends on**: Phase 2
**Requirements**: EXEC-01, EXEC-02, EXEC-06, EXEC-07, INFRA-03, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. User can select which tool to run from clear picker showing all 8 tools
  2. Each tool displays accurate status badge (Available / In Development / Coming Soon)
  3. Server enforces per-process resource limits (CPU, memory, 60s timeout) to prevent exhaustion
  4. Server limits concurrent executions to CPU core count and queues excess requests
  5. User sees queue position and estimated wait time when at capacity
  6. Server implements per-IP rate limiting (5 concurrent jobs, 20/hour) to prevent abuse
  7. Server handles 5-20 simultaneous users without degradation
  8. Server gracefully degrades under load (queues requests instead of crashing)
  9. CLI tools run in strict sandboxes with no network access and read-only filesystems
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Shared execution types, resource limits config, tool registry, queue service (p-queue), and rate limiter middleware (express-rate-limit)
- [x] 03-02-PLAN.md -- Execution service (execa with timeout/cleanup), execute route (POST /api/execute, GET /api/queue/status), Docker security hardening
- [x] 03-03-PLAN.md -- Client tool picker with status badges, execution panel with result display, queue status UI, Home page integration

### Phase 4: Real-Time Output Streaming
**Goal**: Users see real-time stdout/stderr output from running tools streamed to browser console
**Depends on**: Phase 3
**Requirements**: EXEC-03, EXEC-04, EXEC-05
**Success Criteria** (what must be TRUE):
  1. User sees real-time progress indicators during tool execution (spinner, status updates)
  2. User sees stdout and stderr streaming in real-time to console view as tool runs
  3. Console view preserves ANSI color codes and formatting from CLI tools
  4. User sees execution metrics after completion (processing time, files processed, exit code)
  5. SSE connections reconnect automatically if interrupted during execution
  6. Multiple users can execute tools simultaneously without output cross-contamination
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md -- Server SSE infrastructure: streaming types, StreamService session management, SSE route, non-blocking execute route transformation
- [x] 04-02-PLAN.md -- Client streaming UI: useSSE hook, ANSI-aware ConsoleView, ExecutionPanel streaming integration, comprehensive tests

### Phase 5: Output Preview & Download
**Goal**: Users can preview results inline with syntax highlighting and download full output as zip
**Depends on**: Phase 4
**Requirements**: OUT-01, OUT-02, OUT-03, OUT-04, INFRA-02
**Success Criteria** (what must be TRUE):
  1. User can preview key output files inline with syntax highlighting (code and reports)
  2. User can browse output files via tree view and select individual files to preview
  3. User can download full output as zip file containing all results
  4. Output preview distinguishes transpiler results (source code) from verification results (reports/logs)
  5. Project directories are automatically cleaned up 5-15 minutes after output is available
  6. Cleanup runs reliably even if user closes browser before completion
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md -- Server output infrastructure: shared types, output/download/cleanup services, API routes for file tree, preview, and ZIP download
- [x] 05-02-PLAN.md -- Client output UI: language map, RTK Query output API, FileTree, FilePreview with syntax highlighting, DownloadButton, OutputPanel
- [x] 05-03-PLAN.md -- Integration and tests: wire OutputPanel into ExecutionPanel, trigger cleanup from execute route, comprehensive component tests

### Phase 6: Landing Page & Examples
**Goal**: Landing page showcases all tools with comparison grid, mission statement, and quick-start flow
**Depends on**: Phase 5
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. Landing page displays tool comparison grid showing all 8 tools with language, type, status, capabilities
  2. Landing page includes mission statement and narrative about formal verification for AI-generated code
  3. User can generate shareable link to specific tool demo with their configuration
  4. Landing page provides quick-start flow to try a tool immediately (one-click to demo)
  5. Sales narrative clearly positions tools in autonomous software development context
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md -- Landing page components (HeroSection, ToolComparisonGrid, QuickStartCTA), routing update (/ -> Landing, /demo -> Home)
- [ ] 06-02-PLAN.md -- Shareable demo links (ShareableLink component, URL param wiring), comprehensive landing page tests

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup & Foundation | 3/3 | Complete | 2026-02-12 |
| 2. File Upload & Validation | 2/2 | Complete | 2026-02-13 |
| 3. Process Execution & Sandboxing | 3/3 | Complete | 2026-02-13 |
| 4. Real-Time Output Streaming | 2/2 | Complete | 2026-02-12 |
| 5. Output Preview & Download | 3/3 | Complete | 2026-02-13 |
| 6. Landing Page & Examples | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-13 after Phase 6 planning complete*
