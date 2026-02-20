# Phase 19: Test Infrastructure Cleanup - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove dead code, add Docker runtime guards, enforce POM contracts across all spec files, and archive legacy test files. No new test coverage is added in this phase — this is purely cleanup and enforcement work within the existing e2e/ codebase.

</domain>

<decisions>
## Implementation Decisions

### Legacy file disposition
- Use `git mv` for all file moves to preserve git history
- Claude decides: archive to `e2e/archive/` (preferred over hard delete — preserves reference)
- Claude decides: exclude archive via `testIgnore` pattern in `playwright.config.ts` (explicit and intentional)
- Claude decides: keep archived files as-is, no modifications (pure move operation)

### Docker guard behavior
- Hard fail at config level — if `E2E_BASE_URL` is not set, the Playwright run aborts entirely before any tests execute
- Error message must be actionable: include the exact env var to set and an example value (e.g., `export E2E_BASE_URL=http://localhost:3000`)
- Guard only triggers when `E2E_BASE_URL` is unset — CI environments where it IS set are unaffected
- Claude decides: placement within playwright.config.ts (globalSetup function or top-level validation block — whichever fits existing patterns)

### Orphaned helper fate
- Audit the entire `helpers.ts` file for all POM-bypassing functions, not just `loadExampleAndExecute()`
- Claude decides: remove or replace `loadExampleAndExecute()` based on actual call site analysis — if callers can be cleanly updated to inline DemoPage calls, remove the helper; only preserve a replacement if truly needed
- Claude decides: update call sites using whichever approach (inline DemoPage calls vs replacement helper) is cleaner given actual usage
- Claude decides: clean deletion preferred over deprecation (internal test code, no semver concern)

### POM bypass fix scope
- Audit ALL spec files in e2e/ for raw `page.locator()` / `page.goto()` bypasses — fix any violations found, not just `browser-navigation.spec.ts`
- All landing page interactions in `browser-navigation.spec.ts` must go through `LandingPage` POM — not just navigation calls, but every locator/click touching the landing page
- If `LandingPage` POM is missing methods needed by any spec file, add them to `LandingPage`
- Add a comment to `playwright.config.ts` explaining the POM contract (always use POM, never raw locators)

### Claude's Discretion
- Whether to archive or delete legacy files (leaning archive with `git mv`)
- Exact placement of Docker guard within config (globalSetup vs top-level check)
- Whether `loadExampleAndExecute()` is removed entirely vs replaced (based on call site analysis)
- How call sites for the orphaned helper are updated
- Removal style for dead code (clean delete vs deprecation first)

</decisions>

<specifics>
## Specific Ideas

- Docker guard error message should include the exact command to fix: `export E2E_BASE_URL=http://localhost:3000`
- POM bypass comment in `playwright.config.ts` should be concise — a 1-2 line note near the projects config, not a long essay

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-test-infrastructure-cleanup*
*Context gathered: 2026-02-19*
