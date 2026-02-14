# Hapyy Languages Web Portal

## What This Is

A public demo web portal for Hapyy's formal verification tools and transpilers. Users upload source code (as zip files), run CLI-based analysis/transpilation tools, watch execution in a real-time streaming console, preview key results inline with syntax highlighting, and download full output as a zip. The portal showcases how these tools fit into the bigger picture of autonomous software development — providing comprehensive AI-generated code verification.

## Core Value

Users can try any Hapyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## Current State

**Shipped:** v1.0 MVP (2026-02-14)
**Codebase:** 8,239 LOC TypeScript/React across 198 files
**Tech stack:** TypeScript, Node.js 22, Express, React 18.3, Vite, Tailwind CSS v4, shadcn/ui, Redux Toolkit, RTK Query, Playwright
**Tests:** 187 unit tests (Vitest) + 36 E2E tests (Playwright)
**Deployment:** Docker multi-stage build, ready for Digital Ocean

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

### Active

(None — start next milestone to define)

### Out of Scope

- User accounts / authentication — public access, no logins
- Mobile-native app — web only, responsive design sufficient
- CI/CD integration — this is a demo portal, not a production pipeline
- Persistent project storage — ephemeral by design
- Tool installation management — tools are pre-installed on the server
- Offline mode — real-time streaming is core value

## Context

**Tools in the Hapyy ecosystem:**

| Tool | Type | Language | Status |
|------|------|----------|--------|
| C++ to C Transpiler | Transpiler (with ACSL inference, Frama-C verification) | C++ → C | In Development |
| C++ to Rust Transpiler | Transpiler (idiomatic) | C++ → Rust | In Development |
| C# Formal Verification Plugin | Verification | C# | Finishing Up |
| Java Formal Verification Plugin | Verification | Java | Finishing Up |
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

---
*Last updated: 2026-02-14 after v1.0 milestone*
