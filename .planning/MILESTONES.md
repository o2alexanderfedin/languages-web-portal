# Milestones

## v1.0 MVP (Shipped: 2026-02-14)

**Phases completed:** 7 phases, 17 plans
**Timeline:** 2 days (2026-02-12 → 2026-02-14)
**Stats:** 82 commits, 198 files, 27,645 lines added, 8,239 LOC TypeScript/React

**Key accomplishments:**
1. TypeScript monorepo with Express server, React 18.3 SPA (Vite + Tailwind v4 + shadcn/ui), and Docker multi-stage build
2. Secure ZIP upload with defense-in-depth validation (MIME, magic bytes, zip bomb, path traversal) and UUID-isolated project directories
3. CLI tool execution via execa with 60s timeout, CPU-core-based queue (p-queue), per-IP rate limiting, and Docker security hardening
4. Real-time SSE streaming of stdout/stderr to browser console with ANSI color rendering
5. Output file tree browser with syntax-highlighted preview, streaming ZIP download, and automatic 10-minute cleanup
6. Landing page with hero section, 8-tool comparison grid, quick-start CTA, and shareable demo links
7. 36 Playwright E2E tests (18 cases x desktop + mobile) with GitHub Actions CI pipeline

**Archives:** [Roadmap](milestones/v1.0-ROADMAP.md) | [Requirements](milestones/v1.0-REQUIREMENTS.md)

---


## v1.1 Java FV Integration (Shipped: 2026-02-16)

**Phases completed:** 3 phases (8-10), 7 plans
**Timeline:** 1 day (2026-02-15 → 2026-02-16)
**Stats:** 20 commits, 37 files, 20/20 requirements satisfied

**Key accomplishments:**
1. Docker 3-stage build with JDK 25 and Java FV CLI jar compiled from source via Maven
2. Wrapper script (`hupyy-java-verify`) bridging Java FV CLI to portal's `--input` interface with `exec` for streaming
3. Java Verification activated as the first live tool (status: available, 120s timeout)
4. Three Java example projects demonstrating modern Java features (records, pattern matching, sealed types) with intentional failure modes
5. ExampleSelector UI component with dropdown, description display, and load-to-execute flow integrated into Home page
6. 24 E2E Playwright tests covering landing page availability, example loading, Docker execution with streaming, output file tree, and full user journey

**Archives:** [Roadmap](milestones/v1.1-ROADMAP.md) | [Requirements](milestones/v1.1-REQUIREMENTS.md) | [Audit](milestones/v1.1-MILESTONE-AUDIT.md)

---


## v1.2 Comprehensive E2E Testing (Shipped: 2026-02-20)

**Phases completed:** 9 phases (11-19), 17 plans
**Timeline:** 4 days (2026-02-16 → 2026-02-20)
**Stats:** 58 files changed, 6,514 insertions, 3,480 LOC TypeScript (e2e/), 28/28 requirements satisfied

**Key accomplishments:**
1. 9-project Playwright configuration (3 browsers × 3 viewports) with E2E_BASE_URL Docker targeting and shared DRY helpers
2. Complete cross-browser E2E coverage across all user flows — landing, upload, execution, output, examples, shareable links, edge cases — 13 spec files, 78 tests × 9 projects (~700 test runs)
3. Four Page Object Models (LandingPage, UploadPage, ExecutionPage, OutputPage) providing type-safe, reusable test abstractions
4. SSE streaming verification, progress indicators, and route-interception-based error state tests without Docker dependency
5. Theme toggle persistence, 404 routing, tool switching, and browser back/forward navigation coverage
6. Infrastructure cleanup: dead code removed, Docker guard added, POM contract enforced, 8 legacy specs archived via `git mv`

---


## v1.3 C# Formal Verification (Shipped: 2026-02-21)

**Phases completed:** 4 phases (20-23), 10 plans
**Timeline:** 2 days (2026-02-20 → 2026-02-21)
**Stats:** 69 files changed, +8,701 / -2,042 lines, 16/16 requirements satisfied

**Key accomplishments:**
1. Extended Docker image with .NET runtime-8.0, CVC5 1.3.2 + Z3 4.16.0 solver binaries, cs-fv DLL, and offline NuGet cache (1546 MB accepted)
2. Created `hupyy-csharp-verify` bash wrapper bridging portal's `--input <dir>` interface to per-file cs-fv CLI with OVERALL_EXIT aggregation and dual stderr+stdout error output for SSE capture
3. Activated C# Formal Verification as the second live tool (status: available, 180s timeout for MSBuild + CVC5 cold-start)
4. Three C# FV example projects using modern features (records, nullable ref types, pattern matching, switch expressions) with FV contracts — including `bank-account-invariant` with intentional `Ensures("balance > 0")` violation (SMT counterexample: amount == balance → balance == 0)
5. Playwright E2E suite covering: example loading via ExampleSelector, C# FV execution with SSE streaming, output file tree display, and known-bad violation detection (E2E-04 quality gate: FAILED badge visible + output panel absent)
6. `TreatWarningsAsErrors=true` in all example `.csproj` files satisfies Roslyn Warning-severity exit-code requirement (CSFV-04)

**Tech debt:** Docker image 1546 MB vs 800 MB estimate (NuGet/Roslyn cache 333 MB, cs-fv DLL 75 MB); java-builder uses pre-built jar (FormulaAdapter missing from source)

**Archives:** [Roadmap](milestones/v1.3-ROADMAP.md) | [Requirements](milestones/v1.3-REQUIREMENTS.md) | [Audit](milestones/v1.3-MILESTONE-AUDIT.md)

---

