# Phase 23: E2E Tests - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Playwright E2E tests that verify the complete C# FV user flow end-to-end against a running Docker container. Covers example loading (UI verification), execution with streaming output, output inspection (file tree + download), and asserting that the known-bad example produces a failed status. No new portal features — tests only.

</domain>

<decisions>
## Implementation Decisions

### Test file organization
- 3 separate spec files with `csharp-` prefix:
  - `csharp-fv-examples.spec.ts` — UI loading verification for all 3 examples
  - `csharp-fv-execution.spec.ts` — End-to-end execution with streaming (all 3 examples run)
  - `csharp-fv-output.spec.ts` — Output file tree + download button verification after successful execution
- Examples spec runs the full 9-project Playwright matrix (3 browsers × 3 viewports)
- Execution and output specs run Chromium desktop only (mirrors Java FV pattern for Docker-dependent tests)
- All 3 files go in `e2e/tests/`

### Example coverage scope
- All 3 C# FV examples verified for UI loading in examples spec:
  - `null-safe-repository` (expected: pass)
  - `bank-account-invariant` (expected: fail — known-bad)
  - `calculator-contracts` (expected result: Claude determines from example code)
- All 3 examples executed end-to-end in execution spec — tests assert the correct expected result (pass or fail) per example
- Coverage must include both pass-case and fail-case assertions across the 3 examples

### Streaming & output assertions
- Console streaming: Claude decides appropriate assertions by inspecting actual cs-fv output format (avoid hard-coding strings that could change)
- Output file tree: assert non-empty after successful execution — no specific file name assertions
- Output spec also asserts download button is visible after successful execution

### Failed-status test design
- For `bank-account-invariant` (known-bad), assert:
  1. Portal status badge shows `failed`
  2. Streaming console contains error/diagnostic content (Roslyn error text)
  3. Output file tree is empty or not visible (no output when execution fails)
- Invalid input error testing (no .csproj zip): Claude checks `execution-errors.spec.ts` — if not already covered for C# FV, add it; otherwise skip

### Claude's Discretion
- Specific console assertion strings/regexes for C# FV output (inspect actual tool output)
- Whether `calculator-contracts` should assert pass or fail (read the example code)
- Whether the wrapper error case (no .csproj) is already covered in execution-errors.spec.ts
- Loading skeleton and timeout values (follow Java FV execution test patterns)

</decisions>

<specifics>
## Specific Ideas

- Follow the same Page Object Model pattern as existing tests (`ExecutionPage`, `OutputPage`, etc.) — likely need a `CSharpExecutionPage` or reuse `ExecutionPage` with tool parameter
- Execution tests run serially with 3-minute timeout (same as Java FV execution tests)
- "bank-account-invariant produces status: failed" is the quality gate — this is SC-3 and the most important test in the suite

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 23-e2e-tests*
*Context gathered: 2026-02-20*
