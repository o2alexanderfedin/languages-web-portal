# Project Research Summary

**Project:** Hapyy Languages Web Portal
**Domain:** CLI-based Formal Verification Demo Web Portal
**Researched:** 2026-02-12
**Confidence:** HIGH

## Executive Summary

The Hapyy Languages Web Portal is a developer tool demo platform for showcasing 8 formal verification and transpilation CLI tools. Research shows this fits the pattern of a **file-processing web portal** rather than a code playground—users upload project zips, execute CLI tools server-side, and download results. The recommended approach uses a modern TypeScript full-stack with Node.js v24 + Express 5, React 19 + Vite 7, and Server-Sent Events (SSE) for real-time stdout streaming.

The core architectural pattern is **ephemeral workspace isolation**: each execution creates a temporary directory, runs tools in sandboxed child processes, streams output via SSE, packages results as downloadable zips, and schedules cleanup. This differs from code playground patterns (Monaco editor, instant compilation) and aligns more with batch processing workflows like CI/CD pipeline viewers.

The primary risk vectors are **malicious file uploads** (zip bombs, path traversal, symlink attacks) and **resource exhaustion** (runaway processes, disk space). These must be addressed in Phase 1 (file upload/extraction) and Phase 2 (tool execution/sandboxing) respectively—deferring security to later phases would require full rewrites. Success depends on strict input validation, OS-level process isolation, and comprehensive resource limits from the start.

## Key Findings

### Recommended Stack

For a TypeScript full-stack with 5-20 concurrent users on Digital Ocean, the optimal stack prioritizes stability, TypeScript-first design, and simplicity over cutting-edge performance. Express 5 (production-ready as of Jan 2025) provides mature HTTP handling with improved async error forwarding. React 19 + Vite 7 deliver modern frontend DX with 40x faster builds than legacy CRA. Server-Sent Events (SSE) are preferred over WebSockets for unidirectional stdout streaming—simpler implementation, native HTTP/S, automatic reconnection.

**Core technologies:**
- **Node.js v24 LTS (Krypton)**: Current Active LTS with 30-month support guarantee, production-stable runtime
- **TypeScript 5.9.3**: Current stable release, maximum ecosystem compatibility (TS 6.0 beta available but stick with stable)
- **Express 5.x**: Newly stable (Jan 2025) with async error handling improvements, security fixes, 200M+ weekly downloads
- **React 19.2 + Vite 7**: Modern frontend stack with first-class TypeScript, HMR, component-based UI
- **Server-Sent Events (SSE)**: Simpler than WebSocket for unidirectional streaming, native HTTP compatibility
- **Multer + Archiver + Unzipper**: Industry-standard file handling—multipart uploads, streaming zip creation/extraction
- **child_process.spawn()**: Native Node.js process spawning with stream-based stdout/stderr access
- **tmp package**: Ephemeral directory management with automatic cleanup policies

**Critical version requirements:**
- Avoid Express 4 (superseded by Express 5)
- Avoid Create React App (deprecated 2023, use Vite)
- Avoid vm2 for sandboxing (CVE-2026-22709 CVSS 9.8 critical sandbox escape)

### Expected Features

Research across Compiler Explorer, Rust Playground, and developer portal best practices identifies feature expectations for tool demo portals.

**Must have (table stakes):**
- **File upload with drag-and-drop** — baseline UX expectation for developer portals, reduces friction
- **Real-time execution progress** — users expect feedback for tasks >10 seconds (formal verification can be slow)
- **Output preview with syntax highlighting** — users need to see results inline before downloading
- **Downloadable results (zip)** — users need artifacts for their workflows
- **Tool selection interface** — multi-tool portal needs clear picker (8 tools require obvious selection)
- **Basic error handling** — clear error messages with actionable guidance
- **Shareable links/permalinks** — standard for all major playgrounds (godbolt, Rust Playground)

**Should have (competitive differentiators):**
- **Landing page tool comparison grid** — helps users choose right tool, positions as comprehensive platform
- **Example/template gallery** — reduces friction to first success (3-5 examples per tool drives adoption)
- **Streaming output logs** — see tool progress in real-time (builds trust during long waits)
- **Execution metrics display** — show processing time, file counts, verification stats (transparency builds trust)
- **CLI command generation** — show equivalent CLI command for local reproduction (educational value)

**Defer (v2+):**
- **Result comparison view** — complex feature, defer until power users request
- **Tool recommendation engine** — "which tool should I use?" wizard, add if analytics show selection friction
- **Multi-file output preview** — tree view + file selector, add when zip outputs regularly have >5 files
- **API access for programmatic use** — add when users want CI/CD integration

**Anti-features (explicitly avoid):**
- **User accounts/authentication** — adds complexity, not needed for public demo (use browser-local storage for history)
- **Persistent cloud storage** — 5-20 concurrent users don't need cloud hosting (download immediately)
- **Real-time collaboration** — scope creep, shareable links are sufficient
- **Mobile app** — desktop is primary use case, responsive web is sufficient

### Architecture Approach

The architecture follows a **layered stream-driven pattern** with ephemeral workspace isolation. File uploads trigger temporary directory creation (UUID-based paths), extraction validation (size/ratio/path checks), CLI tool spawning (child_process with stdio pipes), real-time output streaming (SSE to client), and scheduled cleanup (5-15 minutes post-completion). This differs from code playground patterns—less iterative editing, more batch processing.

**Major components:**
1. **Project Manager** — creates/tracks/cleans ephemeral directories with metadata-driven lifecycle (status, timestamps, cleanup scheduling)
2. **Process Spawner** — executes CLI tools via child_process.spawn() with stream piping to WebSocket/SSE, handles timeouts and zombie prevention
3. **Upload/Download Handlers** — Multer for multipart uploads with validation, Archiver for streaming zip creation, path sanitization throughout
4. **SSE/WebSocket Server** — maintains persistent connections, broadcasts process output chunks in real-time, handles reconnection
5. **Cleanup Scheduler** — node-cron job queries Project Manager for expired workspaces, deletes recursively, handles failures idempotently
6. **Frontend State Manager** — React hooks coordinate upload status, process running state, output ready state with SSE integration

**Key architectural patterns:**
- **Stream-Driven Output** (Pattern 1): Pipe child process stdout/stderr directly to SSE without buffering—low memory, immediate feedback, scales to large outputs
- **Ephemeral Directory Lifecycle** (Pattern 2): UUID-based temp directories with metadata tracking (created, completed, status, cleanup scheduled)
- **Type-Based Message Routing** (Pattern 3): All SSE messages carry "type" field (stdout/stderr/exit/error/status) with TypeScript discriminated unions
- **Metadata-Driven Cleanup** (Pattern 4): In-memory metadata store tracks projects, cron job periodically scans for expired entries
- **Layered Architecture** (Pattern 5): Routes → Services → Utils separation (HTTP protocol vs business logic vs pure functions)

**Build order implications:**
1. **Phase 1: Core Infrastructure** — Project Manager + CLI spawning + basic Express (validates tools execute before building UI)
2. **Phase 2: Upload & Extraction** — File upload endpoint + validation + zip extraction (establishes data flow into system)
3. **Phase 3: Real-time Streaming** — SSE server + stream integration + frontend connection (most complex, needs working upload/process to test)
4. **Phase 4: Frontend Terminal UI** — Terminal component + Upload UI + Download UI (UI develops after APIs stable)
5. **Phase 5: Cleanup & Lifecycle** — Completion tracking + scheduler + cleanup logic (essential before production but not for initial testing)
6. **Phase 6: Download & Zip Creation** — Output zip creation + download endpoint (depends on completed processes)

### Critical Pitfalls

Research identified 10 critical pitfalls with specific prevention strategies. Top 5 by severity:

1. **Zip Bomb / Decompression Bomb** (CRITICAL) — Malicious archives (42.zip) expand from kilobytes to terabytes, exhausting disk. **Prevention:** Limit extracted size (100MB max), monitor compression ratio (reject if >100:1), limit nesting depth (max 2 levels), timeout decompression (5 seconds), use streaming extraction with size tracking. **Address in Phase 1.**

2. **Path Traversal via Archive Entries** (CRITICAL) — Archives with `../../etc/passwd` paths extract files outside workspace, allowing system file overwrites. **Prevention:** Validate each entry path BEFORE extraction, reject absolute paths and `..` components, verify resolved path is child of extraction directory, use path normalization before comparison. **Address in Phase 1.**

3. **Arbitrary Code Execution via Malicious Files** (CRITICAL) — Uploaded files exploit CLI tool parsing vulnerabilities (buffer overflows, format strings). **Prevention:** Run ALL tools in strict sandboxes (gVisor minimum, microVMs preferred), drop privileges (run as nobody), disable network access, mount filesystems read-only except workspace, set resource limits (CPU/memory/processes). **Address in Phase 2.**

4. **Resource Exhaustion / Denial of Service** (CRITICAL) — Single user or tool consumes all server resources (formal verification has exponential worst-case). **Prevention:** Limit concurrent executions to CPU core count, enforce strict timeouts (30-60s for demo), use cgroups for CPU/memory limits, implement per-IP rate limiting (5 concurrent jobs, 20/hour), queue requests when at capacity. **Address in Phase 2.**

5. **Process Leaks / Zombie Processes** (HIGH) — CLI tools don't terminate properly, orphans accumulate, process table fills. **Prevention:** Track all spawned PIDs, register process.on('exit') handlers, use process groups with tree-kill, escalate SIGTERM → SIGKILL, monitor for zombies, cleanup on graceful shutdown and crashes. **Address in Phase 2.**

**Additional critical pitfalls:**
- **Symlink Attacks** (Phase 1): Archive contains symlink pointing outside workspace, then file with same name—write follows symlink. Skip/reject symlink entries entirely.
- **Temp Cleanup Failures** (Phase 2): Race conditions or crashes prevent cleanup, disk fills. Use unique names (PID+timestamp+UUID), register cleanup handlers for crashes, validate paths before deletion, never follow symlinks.
- **WebSocket Memory Leaks** (Phase 3): Connections not removed from tracking, memory exhausts. Remove on 'close' event, set max connections (100-200), implement heartbeat, timeout inactive connections (60s).
- **Inadequate Error Context** (Phase 4): Cryptic tool errors confuse users. Capture/parse stdout/stderr, classify errors (user vs system), provide actionable messages with examples.
- **No Graceful Degradation** (Phase 4): Portal crashes when at capacity instead of queuing. Implement request queue (max 100 pending), return "at capacity" with retry-after, show queue position.

## Implications for Roadmap

Based on component dependencies and pitfall timing, recommended phase structure follows a **foundation-first, security-critical-early** approach:

### Phase 1: File Upload & Validation (Foundation + Security)
**Rationale:** Establishes data flow into system. Security pitfalls (zip bomb, path traversal, symlinks) MUST be addressed here—retrofitting validation after launch requires rewriting extraction logic. Validates file handling before building complex streaming infrastructure.

**Delivers:**
- Project Manager (ephemeral directory creation with UUID paths)
- File upload endpoint (Express + Multer with size limits)
- Archive extraction with security validation (zip bomb detection, path sanitization, symlink rejection)
- Basic Express server with health check

**Addresses features:**
- File upload with drag-and-drop (table stakes)
- File size limit display (table stakes)
- Browser-local validation (table stakes)

**Avoids pitfalls:**
- Zip bomb / decompression bomb
- Path traversal via archive entries
- Symlink attacks via extraction

**Research flag:** Standard patterns (file upload well-documented). No additional research needed.

---

### Phase 2: Process Execution & Sandboxing (Security Critical)
**Rationale:** Tool execution is highest security risk (arbitrary code execution, resource exhaustion). Sandboxing must be architected from start—adding isolation later to running processes is nearly impossible. Dependency blocker for streaming (need process output to stream).

**Delivers:**
- CLI Process Spawner (child_process.spawn with stream piping)
- Process isolation/sandboxing (gVisor, cgroups, privilege dropping)
- Resource limits enforcement (CPU/memory/timeout per process)
- Process lifecycle management (zombie prevention, cleanup handlers)
- Job queue with concurrency limits (CPU core count max)
- Per-IP rate limiting

**Uses stack:**
- child_process.spawn() native API
- cgroups for resource limits
- node-cron for cleanup scheduling

**Implements architecture:**
- Process Spawner component
- Cleanup Scheduler component
- Stream-driven output pattern (foundation)

**Avoids pitfalls:**
- Arbitrary code execution via malicious files
- Resource exhaustion / denial of service
- Process leaks / zombie processes
- Temp cleanup failures / race conditions

**Research flag:** **Needs research** — Sandboxing strategies (gVisor vs microVMs vs Docker), cgroup configuration, Linux security profiles (seccomp/apparmor). Domain-specific (formal verification tool hardening).

---

### Phase 3: Real-Time Output Streaming (Complex Integration)
**Rationale:** Most architecturally complex component. Requires working upload + process flow to test effectively. Depends on Phase 2 process spawning to have output to stream. SSE chosen over WebSocket (simpler for unidirectional streaming).

**Delivers:**
- SSE server setup (better-sse or native implementation)
- Process stdout/stderr to SSE connection piping
- Type-based message routing (stdout/stderr/exit/error/status)
- Connection lifecycle management (cleanup on disconnect, heartbeat)
- Reconnection handling (client-side)

**Uses stack:**
- Server-Sent Events (SSE) via better-sse
- Type-based message pattern with TypeScript discriminated unions

**Implements architecture:**
- SSE/WebSocket Server component
- Type-Based Message Routing pattern (Pattern 3)

**Addresses features:**
- Real-time execution progress (table stakes)
- Streaming output logs (differentiator)

**Avoids pitfalls:**
- WebSocket memory leaks / connection handling

**Research flag:** Standard patterns (SSE/WebSocket well-documented). No additional research needed.

---

### Phase 4: Frontend Terminal & Download UI
**Rationale:** UI can develop after APIs are stable. Terminal component needs working SSE stream to test effectively. Lower risk than backend phases, can iterate based on user feedback.

**Delivers:**
- React frontend with Vite 7 build
- Terminal/console component (render streamed output with ANSI support)
- Upload interface (drag-and-drop, progress indicators)
- Tool selection interface (8 tools with descriptions)
- Download interface (button, status, zip trigger)
- Output preview with syntax highlighting (Prism.js)

**Uses stack:**
- React 19.2 + Vite 7
- Tailwind CSS + shadcn/ui components
- Prism.js for syntax highlighting

**Implements architecture:**
- Frontend State Manager (React hooks)
- Terminal Component, Upload Component, Download Component

**Addresses features:**
- Output preview/display (table stakes)
- Downloadable results (table stakes)
- Tool selection interface (table stakes)
- Responsive layout (table stakes)

**Research flag:** Standard patterns (React + Vite well-documented). No additional research needed.

---

### Phase 5: Error Handling & UX Polish
**Rationale:** Error handling can iterate based on user feedback but core patterns should be established early. Graceful degradation critical before production load.

**Delivers:**
- Error classification (user vs system vs tool limitation)
- Actionable error messages with examples
- Graceful degradation under load (queue vs crash)
- Circuit breaker pattern for dependencies
- User-friendly progress indicators with time estimates
- Execution metrics display (time, file counts, stats)

**Implements architecture:**
- Error handling in layered architecture (routes vs services)

**Addresses features:**
- Basic error handling (table stakes)
- Execution metrics display (differentiator)

**Avoids pitfalls:**
- Inadequate error context for users
- No graceful degradation under load

**Research flag:** Standard patterns (error handling well-documented). No additional research needed.

---

### Phase 6: Landing Page & Examples (Launch Readiness)
**Rationale:** Marketing/onboarding features come after core functionality proven. Example gallery drives adoption but can be minimal at launch (1-2 examples per tool).

**Delivers:**
- Landing page with tool comparison grid
- Example/template gallery (3-5 per tool)
- Tool descriptions and documentation
- Shareable links/permalinks (serialize tool + input hash)
- Sales narrative integration (AI code verification positioning)

**Addresses features:**
- Landing page comparison grid (differentiator)
- Example gallery (table stakes)
- Shareable links (table stakes)
- Sales narrative integration (differentiator)

**Research flag:** Standard patterns (landing page design well-documented). No additional research needed.

---

### Phase Ordering Rationale

**Dependency-driven order:**
- Phase 1 unblocks Phase 2 (need workspaces to run processes)
- Phase 2 unblocks Phase 3 (need process output to stream)
- Phase 3 unblocks Phase 4 (need SSE for terminal component)
- Phases 4-6 can partially parallelize (frontend, error handling, landing page)

**Security-driven order:**
- Phase 1 and 2 address CRITICAL pitfalls that require architectural decisions
- Deferring sandboxing (Phase 2) to later would require rewriting process execution
- File validation (Phase 1) easier to add early than retrofit to production

**Value-driven order:**
- Phases 1-3 deliver core workflow (upload → process → stream)
- Phase 4 makes it usable (UI)
- Phases 5-6 make it production-ready (error handling, onboarding)

**Validation points:**
- Phase 1 complete: Can upload zip and extract safely
- Phase 2 complete: Can execute CLI tools with resource limits
- Phase 3 complete: Can see real-time output streaming
- Phase 4 complete: End-to-end UI workflow functional
- Phase 5 complete: Error scenarios handled gracefully
- Phase 6 complete: Launch-ready with onboarding

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Process Execution/Sandboxing):** Complex domain-specific research needed—gVisor vs microVMs vs Docker isolation strategies, cgroup v2 configuration, Linux security profiles (seccomp-bpf, apparmor), formal verification tool-specific hardening. High security stakes justify dedicated research-phase.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (File Upload/Validation):** File upload + zip extraction well-documented, OWASP guidance comprehensive, Multer/Archiver/Unzipper have clear docs
- **Phase 3 (Real-Time Streaming):** SSE/WebSocket patterns well-established, multiple guides available, better-sse library documented
- **Phase 4 (Frontend Terminal UI):** React + Vite standard stack, terminal emulator components available (react-console-emulator), syntax highlighting (Prism.js) solved problem
- **Phase 5 (Error Handling/UX):** Error handling patterns standard, graceful degradation well-documented in distributed systems literature
- **Phase 6 (Landing Page/Examples):** Landing page design standard web development, example galleries follow known patterns (Pulumi, playgrounds)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All recommendations verified with official documentation and releases. Node.js v24 LTS official, Express 5 production-ready Jan 2025, React 19 stable, Vite 7 current. Version compatibility matrix researched. |
| Features | **MEDIUM** | Table stakes validated across Compiler Explorer, Rust Playground, developer portal research. Differentiators based on SaaS comparison trends and template gallery patterns. Domain-specific formal verification UX less researched (extrapolated from general developer tools). |
| Architecture | **HIGH** | Patterns consistent across multiple sources (stream-driven processing, ephemeral workspaces, layered architecture). Child process management official Node.js docs. SSE vs WebSocket trade-offs well-documented. Build order derived from dependency analysis. |
| Pitfalls | **HIGH** | Critical vulnerabilities verified with CVE databases and security advisories (zip bomb, path traversal, vm2 CVE-2026-22709). Prevention strategies validated across OWASP, security research, production guides. Process management pitfalls from official Node.js docs. |

**Overall confidence: HIGH**

Research grounded in official documentation (Node.js, TypeScript, Express, React), security advisories (CVEs, OWASP), and production guides. Formal verification-specific UX patterns extrapolated from general developer tools (MEDIUM confidence area) but core technical stack and security recommendations are HIGH confidence.

### Gaps to Address

**Gap 1: Formal verification tool-specific UX patterns**
- **Issue:** Limited research on best practices for displaying formal verification results (proofs, counterexamples, verification traces). Most findings extrapolated from general code playgrounds.
- **Mitigation:** Start with syntax-highlighted text preview (works for all tools), iterate based on user feedback. Consider tool-specific output renderers in v2 (e.g., proof tree visualizations).

**Gap 2: Transpiler output visualization**
- **Issue:** No research found on best practices for displaying transpiler results (C++ → C, C++ → Rust). Unclear if side-by-side diff view, unified view, or separate tabs preferred.
- **Mitigation:** Begin with separate tabs (original vs transpiled), add side-by-side diff if user feedback requests. Syntax highlighting differentiates from raw text.

**Gap 3: Interactive CLI tool handling**
- **Issue:** SSE recommended for unidirectional streaming, but if any of the 8 tools require user input during execution (interactive prompts), SSE won't work.
- **Mitigation:** Validate tool interactivity during Phase 2. If interactive tools found, switch to WebSocket or pty.js (pseudo-terminal). Research flag: investigate tool interactivity requirements.

**Gap 4: Sandboxing strategy selection**
- **Issue:** Research identifies multiple isolation options (gVisor, microVMs, Docker, Linux namespaces) but doesn't definitively recommend one for this specific use case (5-20 concurrent users, formal verification tools, Digital Ocean VPS).
- **Mitigation:** Dedicated research during Phase 2 planning to evaluate gVisor (security vs performance), Docker (ease of deployment vs isolation strength), microVMs (isolation vs overhead). Trade-offs depend on threat model and deployment environment.

**Gap 5: Tool-specific timeout/resource tuning**
- **Issue:** Research recommends timeouts (30-60s) and resource limits but formal verification tools have widely varying performance characteristics (some fast, some exponential). Single timeout may be too restrictive or too lenient.
- **Mitigation:** Start with conservative global timeout (60s for demo), instrument execution times per tool, adjust per-tool limits based on telemetry. Research flag: profile each tool's resource usage during integration.

## Sources

### Primary (HIGH confidence — official documentation and releases)

**Stack:**
- Node.js v24 LTS Release — https://nodejs.org/en/about/previous-releases
- TypeScript Releases — https://github.com/microsoft/typescript/releases
- Express 5 Release & Migration Guide — https://github.com/expressjs/express/releases, https://expressjs.com/en/guide/migrating-5.html
- React 19.2 Release — https://react.dev/blog/2025/10/01/react-19-2
- Vite 7 Release — https://vite.dev/blog/announcing-vite7
- Node.js Child Process API — https://nodejs.org/api/child_process.html
- Multer GitHub (Official Express middleware) — https://github.com/expressjs/multer

**Architecture:**
- Node.js Child Process Documentation (v25.6.1) — https://nodejs.org/api/child_process.html
- Unzipper npm package docs — https://www.npmjs.com/package/unzipper

**Pitfalls (CVEs and Security Advisories):**
- Critical vm2 Node.js Flaw (CVE-2026-22709, CVSS 9.8) — https://thehackernews.com/2026/01/critical-vm2-nodejs-flaw-allows-sandbox.html
- Node.js January 2026 Security Releases — https://nodesource.com/blog/nodejs-security-release-january-2026
- OWASP File Upload Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Node.js async_hooks DoS Vulnerability — https://nodejs.org/en/blog/vulnerability/january-2026-dos-mitigation-async-hooks

### Secondary (MEDIUM confidence — community consensus, multiple sources)

**Stack:**
- Express 5.0 Released (InfoQ analysis) — https://www.infoq.com/news/2025/01/express-5-released/
- SSE vs WebSockets Comparison (SoftwareMill) — https://softwaremill.com/sse-vs-websockets-comparing-real-time-communication-protocols/
- Fastify vs Express vs Hono Framework Comparison — https://medium.com/@arifdewi/fastify-vs-express-vs-hono-choosing-the-right-node-js-framework-for-your-project-da629adebd4e
- shadcn/ui Official Website — https://ui.shadcn.com/

**Features:**
- Compiler Explorer (godbolt.org) — Feature inspection via WebFetch
- GitHub: compiler-explorer/compiler-explorer — https://github.com/compiler-explorer/compiler-explorer
- Rust Playground — https://play.rust-lang.org/
- Uploadcare: File uploader UX best practices — https://uploadcare.com/blog/file-uploader-ux-best-practices/
- UserGuiding: Progress trackers and indicators — https://userguiding.com/blog/progress-trackers-and-indicators
- Evil Martians: Developer tools 2026 adoption — https://evilmartians.com/chronicles/six-things-developer-tools-must-have-to-earn-trust-and-adoption
- Pulumi Developer Portal Gallery — https://www.pulumi.com/blog/developer-portal-gallery/
- SaaSFrame: SaaS comparison page patterns — https://www.saasframe.io/categories/comparison-page

**Architecture:**
- Building real-time applications with WebSockets (Render) — https://render.com/articles/building-real-time-applications-with-websockets
- Realtime at Scale with Node.js (Medium) — https://medium.com/@bhagyarana80/realtime-at-scale-with-node-js-websocket-sse-74fd7f3e79ed
- How To Launch Child Processes in Node.js (DigitalOcean) — https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js
- Node.js File System Production Guide 2026 — https://thelinuxcode.com/nodejs-file-system-in-practice-a-production-grade-guide-for-2026/
- How to Use WebSockets in React — https://oneuptime.com/blog/post/2026-01-15-websockets-react-real-time-applications/view
- How To Work With Zip Files in Node.js (DigitalOcean) — https://www.digitalocean.com/community/tutorials/how-to-work-with-zip-files-in-node-js

**Pitfalls:**
- What is a Zip Bomb? (Mimecast) — https://www.mimecast.com/content/what-is-a-zip-bomb/
- Attacks with Zip Files and Mitigations — https://thesecurityvault.com/attacks-with-zip-files-and-mitigations/
- Zip Slip Path Traversal (pnpm Advisory) — https://github.com/pnpm/pnpm/security/advisories/GHSA-6pfh-p556-v868
- Securing ZIP File Operations (Medium) — https://medium.com/@contactomyna/securing-zip-file-operations-understanding-and-preventing-path-traversal-attacks-74d79f696c46
- Symlink Attacks: When File Operations Betray Your Trust — https://medium.com/@instatunnel/symlink-attacks-when-file-operations-betray-your-trust-986d5c761388
- How to sandbox AI agents in 2026: MicroVMs, gVisor — https://northflank.com/blog/how-to-sandbox-ai-agents
- 5 Tips for Cleaning Orphaned Node.js Processes — https://medium.com/@arunangshudas/5-tips-for-cleaning-orphaned-node-js-processes-196ceaa6d85e
- Graceful Degradation: Handling Errors Without Disrupting UX — https://medium.com/@satyendra.jaiswal/graceful-degradation-handling-errors-without-disrupting-user-experience-fd4947a24011

### Tertiary (LOW confidence — needs validation)

- Real-time State Management in React Using WebSockets — https://moldstud.com/articles/p-real-time-state-management-in-react-using-websockets-boost-your-apps-performance (LOW confidence, needs validation during implementation)

---

*Research completed: 2026-02-12*
*Ready for roadmap: yes*
