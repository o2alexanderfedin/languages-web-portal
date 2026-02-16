# Phase 10: E2E Testing - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated Playwright tests verify the Java verification workflow end-to-end — from landing page availability badge through example loading, real execution against Docker, streaming output, to final output display and file tree. This phase does NOT add new features; it tests what Phase 8 and 9 built.

</domain>

<decisions>
## Implementation Decisions

### Test scope & granularity
- Cover both happy paths (successful verification) AND failure cases (UnsafeRefund.java with 5 failure modes)
- Separate test files per concern: landing page, example loading, execution, output validation
- Test ALL three example projects (bank-account-records, shape-matching, payment-types) — each gets dedicated test cases
- Include at least one full user journey test (landing → tool selection → example load → run → output) PLUS independent step tests with direct navigation

### Execution environment
- Run against real Docker container with actual Java FV execution — no mocking/stubbing
- 180-second timeout per test case (buffer over the 120s tool timeout for Docker/CI overhead)
- Local-only execution for v1.1 — CI/GitHub Actions integration deferred to a later milestone
- Claude's Discretion: Whether Docker is pre-built/pre-started or auto-built in test setup

### Output validation depth
- Validate specific keywords in console output: 'VERIFIED', 'FAILED', 'precondition', 'Z3', contract-related terms
- Verify BOTH console output AND output file tree panel (generated artifacts)
- For failure cases (UnsafeRefund.java): validate specific failure modes are reported (null dereference, division by zero, missing validation, unsafe array access, integer overflow)
- DOM assertions only — no visual regression/screenshot comparison

### Real-time streaming verification
- Verify streaming: assert early output marker appears (e.g., 'Analyzing...') BEFORE final 'VERIFIED'/'FAILED' result
- Verify auto-scroll behavior: assert scroll position updates as output streams in
- Verify loading/progress indicator is visible during execution (spinner, status text, or equivalent)

### Claude's Discretion
- Docker setup strategy (pre-built vs auto-build in test setup)
- Exact test file naming and organization within the test directory
- Helper utilities and page object patterns for test reuse
- Specific early output markers to check for streaming verification
- Test ordering and parallelization strategy

</decisions>

<specifics>
## Specific Ideas

- UnsafeRefund.java has 5 intentional failure modes — tests should check for each specific mode in the output
- Existing v1.0 E2E tests in Phase 7 set the pattern — follow the same Playwright conventions
- The example loading flow: ExampleSelector dropdown → select → description appears → "Load Example" → projectId set → "Run" enables
- Java FV tool timeout is 120s, test timeout is 180s — need to account for Docker cold start in first test

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-e2e-testing*
*Context gathered: 2026-02-16*
