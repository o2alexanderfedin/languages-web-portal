# Hupyy Languages Web Portal

## What This Is

A public demo web portal for Hupyy's formal verification tools and transpilers. Users upload source code (as zip files), run CLI-based analysis/transpilation tools, watch execution in a real-time streaming console, preview key results inline with syntax highlighting, and download full output as a zip. The portal showcases how these tools fit into the bigger picture of autonomous software development — providing comprehensive AI-generated code verification.

## Core Value

Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## Current Milestone: v1.2 Comprehensive E2E Testing

**Goal:** Every user-facing behavior verified across Chromium, Firefox, and WebKit browsers on desktop, tablet, and mobile viewports — running against the Docker production image. Covers all user journeys, error states, and edge cases.

**Target features:**
- Cross-browser testing: Chromium + Firefox + WebKit
- Cross-device testing: desktop + tablet + mobile viewports
- Docker production container as test target
- All user journeys: landing, navigation, upload, execute, streaming, preview, download, examples, shareable links
- Error states: bad files, oversized uploads, timeouts, server errors
- Edge cases: theme toggle, 404 page, tool switching, keyboard navigation

## Current State

**Shipped:** v1.1 Java FV Integration (2026-02-16)
**Codebase:** ~9,000 LOC TypeScript/React across 235 files
**Tech stack:** TypeScript, Node.js 22, Express, React 18.3, Vite, Tailwind CSS v4, shadcn/ui, Redux Toolkit, RTK Query, Playwright
**Tests:** 190+ unit tests (Vitest) + 60 E2E tests (Playwright)
**Deployment:** Docker multi-stage build (JDK 25 + Node.js 22), ready for Digital Ocean
**Live tools:** Java Formal Verification (available, 120s timeout)

## Requirements

### Validated

- ✓ Landing page with tool comparison grid, mission statement, quick-start flow — v1.0
- ✓ Zip file upload via drag-and-drop with security validation — v1.0
- ✓ Server-side project directory isolation per client session — v1.0
- ✓ CLI tool execution with real-time SSE streaming to browser console — v1.0
- ✓ Output preview with syntax highlighting and file tree browser — v1.0
- ✓ Downloadable output zip with full results — v1.0
- ✓ Automatic project directory cleanup (10-minute TTL) — v1.0
- ✓ Tool status indicators (Available / In Development / Coming Soon) — v1.0
- ✓ Shareable demo links with URL parameter tool pre-selection — v1.0
- ✓ Sales narrative about AI-generated code verification — v1.0
- ✓ E2E browser tests for critical user flows — v1.0
- ✓ Java FV tool available and executable in the portal — v1.1
- ✓ Wrapper script for Java FV CLI → portal interface bridge — v1.1
- ✓ Docker image includes JDK 25 + Java FV CLI jar — v1.1
- ✓ Example Java projects for demo (records, pattern matching, sealed types) — v1.1
- ✓ Updated tool metadata (status, description) in UI — v1.1
- ✓ E2E tests covering Java verification user flow — v1.1

### Active

- [ ] Cross-browser E2E tests (Chromium + Firefox + WebKit)
- [ ] Cross-device E2E tests (desktop + tablet + mobile viewports)
- [ ] Docker production image as E2E test target
- [ ] Landing page E2E coverage (hero, tool grid, navigation, responsive)
- [ ] Upload flow E2E coverage (valid/invalid files, drag-drop, error messages)
- [ ] Execution flow E2E coverage (streaming, progress, timeouts, errors)
- [ ] Output flow E2E coverage (file tree, syntax preview, download)
- [ ] Example loading E2E coverage (all examples, error handling)
- [ ] Shareable links E2E coverage (generation, pre-selection, invalid params)
- [ ] Theme toggle E2E coverage (light/dark/system)
- [ ] Error states E2E coverage (404, server errors, network failures)
- [ ] Edge cases E2E coverage (tool switching, browser back/forward, keyboard nav)

### Out of Scope

- User accounts / authentication — public access, no logins
- Mobile-native app — web only, responsive design sufficient
- CI/CD integration — this is a demo portal, not a production pipeline
- Persistent project storage — ephemeral by design
- Tool installation management — tools are pre-installed on the server
- Offline mode — real-time streaming is core value
- Maven project build — portal runs pre-built CLI, users don't need Maven
- javac plugin mode — CLI jar mode is simpler and doesn't require project structure
- Custom solver configuration — Z3 bundled is sufficient for demo; multi-solver is v2
- Java source code editing in browser — upload-only approach, consistent with v1.0 pattern

## Context

**Tools in the Hupyy ecosystem:**

| Tool | Type | Language | Status |
|------|------|----------|--------|
| C++ to C Transpiler | Transpiler (with ACSL inference, Frama-C verification) | C++ → C | In Development |
| C++ to Rust Transpiler | Transpiler (idiomatic) | C++ → Rust | In Development |
| C# Formal Verification Plugin | Verification | C# | Finishing Up |
| Java Formal Verification Plugin | Verification | Java | Available (v1.1.0) |
| Rust Formal Verification Plugin | Verification | Rust | Very Beginning |
| Python Formal Verification Linter | Linter/Verification | Python | Planning |
| TypeScript Formal Verification Linter | Linter/Verification | TypeScript | Planning |
| Bash Formal Verification | Verification | Bash | Planning |

All tools are CLI-based: take input directory/files, produce output directory/files.

**Deployment path:** Local machine first, then Digital Ocean hosting.

**Expected concurrency:** 5-20 simultaneous users at peak.

## Constraints

- **Tech stack**: TypeScript + Node.js (full-stack)
- **Tool interface**: All tools are CLI programs (stdin/stdout/stderr, input dir → output dir)
- **Hosting**: Docker containerized, Digital Ocean target
- **Concurrency**: Handles 5-20 simultaneous tool executions with isolated project directories
- **Cleanup**: Project directories auto-cleaned 10 minutes after output is available
- **Public access**: No authentication — anyone with the URL can use it

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript + Node full stack | User preference, consistency with TS linter tool | ✓ Good |
| Public access, no auth | Demo portal for showcasing tools, minimal friction | ✓ Good |
| Real-time console streaming via SSE | Users need to see tool progress as it happens | ✓ Good |
| Ephemeral project dirs | No persistent storage needed, simplifies deployment | ✓ Good |
| Show all tools with status badges | Even "Coming Soon" tools demonstrate breadth of ecosystem | ✓ Good |
| React 18.3 + Vite + Tailwind v4 | Stable React, fast builds, modern CSS | ✓ Good |
| Redux Toolkit + RTK Query | Type-safe state management with built-in data fetching | ✓ Good |
| better-sse for streaming | Mature, well-typed SSE library with heartbeat support | ✓ Good |
| p-queue for concurrency | ESM-native, CPU-core-based queue with rate limiting | ✓ Good |
| Defense-in-depth upload security | Multer MIME → magic bytes → ZIP security → path validation | ✓ Good |
| Docker multi-stage build | Minimal production image with non-root user | ✓ Good |
| Playwright for E2E | Desktop + mobile browser testing with POM pattern | ✓ Good |
| Java FV CLI wrapper with exec | Adapts java-fv-cli.jar to portal's --input interface, exec replaces shell process for clean signal handling | ✓ Good |
| Docker 3-stage build with JDK 25 | Maven build → JDK runtime → Node.js production, Z3 bundled via z3-turnkey | ✓ Good |
| 120s timeout for Java FV | Complex verification needs more time than default 60s | ✓ Good |
| Native select for example picker | Simple dropdown UI, no complex library needed | ✓ Good |
| Progressive example complexity | bank-account-records → shape-matching → payment-types | ✓ Good |

---
*Last updated: 2026-02-16 after v1.2 milestone start*
