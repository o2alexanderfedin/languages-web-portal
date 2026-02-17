# Phase 14: Execution Flow E2E Tests - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify tool execution behavior (SSE streaming output, progress indicators, error states, execute button disabled state) through Playwright E2E tests. Tests existing behavior — no new features. Execution UI is desktop-only; mobile viewports are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Existing test migration
- Migrate `java-fv-execution.spec.ts` into new Phase 14 structure — replace the old file (delete it)
- Create a dedicated `ExecutionPage` Page Object Model (consistent with LandingPage Phase 12, UploadPage Phase 13)
- Keep Java FV framing for test names (tests are Java FV specific — only tool currently working)
- New file: `execution-flow.spec.ts` replacing `java-fv-execution.spec.ts`

### Cross-browser scope
- SSE/Docker execution tests (EXEC-01, EXEC-02, EXEC-03): **Chromium desktop only** — SSE streaming is browser-agnostic, Docker tests are expensive
- Execute button disabled state tests (EXEC-04): **Desktop only (3 browsers: Chromium, Firefox, WebKit)** — UI state tests are fast and should verify cross-browser behavior
- Execution panel is desktop-only; mobile viewports explicitly skipped for all execution tests

### Error simulation strategy
- Use **Playwright network interception** (`route.abort` / `route.fulfill`) to simulate error conditions
- Cover **all realistic failures**: server 500 HTTP error, SSE connection abort mid-stream, connection timeout
- Each error scenario must verify a **user-visible error message** appears
- Also verify **recovery**: after error, execute button re-enables and user can re-execute (same pattern as Phase 13 upload error recovery)

### Execution test isolation
- **Real Docker execution** for happy path (EXEC-01, EXEC-02): maximum fidelity, tests what users actually experience
- **Serial execution** for Docker tests (expensive, avoid resource contention)
- **Parallel execution** for UI-only tests (EXEC-04 button state — no Docker dependency)
- Network-intercepted error tests (EXEC-03) can run in parallel since no real Docker needed

### Claude's Discretion
- ExecutionPage POM method signatures and internal implementation
- Exact selector strategies for connection badge, console output, status indicators
- How to structure test files (one spec or two — e.g., execution-flow.spec.ts + execution-errors.spec.ts)
- Timeout values for waiting on execution completion

</decisions>

<specifics>
## Specific Ideas

- Follow Phase 13 patterns exactly: POM, shared fixtures in e2e/fixtures/helpers.ts, same file organization
- Existing `loadExampleAndExecute` and `waitForExecutionComplete` helpers in helpers.ts should be preserved or migrated into ExecutionPage POM
- Error tests use network interception like Phase 13 used it for upload validation (consistent approach)
- The `test.slow()` and `test.setTimeout(180_000)` pattern from existing tests should be kept for Docker tests

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-execution-flow-e2e-tests*
*Context gathered: 2026-02-17*
