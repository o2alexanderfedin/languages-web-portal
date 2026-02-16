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

