---
phase: 19-test-infrastructure-cleanup
plan: 01
subsystem: testing
tags: [playwright, typescript, pom, e2e, refactor]

# Dependency graph
requires:
  - phase: 17-edge-cases-polish
    provides: browser-navigation.spec.ts and theme-and-404.spec.ts with raw page.goto('/') and page.getByTestId calls
  - phase: 12-landing-page-e2e
    provides: LandingPage POM foundation used as extension target
provides:
  - Cleaned helpers.ts with no dead code or orphaned imports
  - playwright.config.ts with Docker guard requiring E2E_BASE_URL before tests run
  - LandingPage POM with landingContainer locator and waitForVisible() method
  - browser-navigation.spec.ts fully mediated through LandingPage POM
  - theme-and-404.spec.ts fully mediated through LandingPage POM for landing navigation
affects: [e2e-test-runs, future-spec-files, phase-19-02]

# Tech tracking
tech-stack:
  added: []
  patterns: [LandingPage POM for all landing navigations in spec files, Docker guard pattern for E2E_BASE_URL enforcement]

key-files:
  created: []
  modified:
    - e2e/fixtures/helpers.ts
    - playwright.config.ts
    - e2e/pages/LandingPage.ts
    - e2e/tests/browser-navigation.spec.ts
    - e2e/tests/theme-and-404.spec.ts

key-decisions:
  - "Remove webServer block from playwright.config.ts — Docker guard enforces callers always set E2E_BASE_URL explicitly, making auto dev-server start logic moot"
  - "theme-button and 404 assertions in theme-and-404.spec.ts are not landing-page POM violations — they target app-level UI (theme button) and 404 page, not landing page content"

patterns-established:
  - "Docker guard: top-level throw before defineConfig runs when E2E_BASE_URL is unset"
  - "POM contract: all test interactions with page UI must go through Page Object Models in e2e/pages/"

requirements-completed: [INFRA-03, INFRA-04, EDGE-04]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 19 Plan 01: Test Infrastructure Cleanup Summary

**Dead code removed, E2E_BASE_URL Docker guard added, and all landing-page raw navigations replaced with LandingPage POM across browser-navigation.spec.ts and theme-and-404.spec.ts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T23:49:18Z
- **Completed:** 2026-02-19T23:52:22Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Removed orphaned `loadExampleAndExecute()` function and `DemoPage` import from helpers.ts (INFRA-04)
- Added hard-fail Docker guard to playwright.config.ts that aborts with actionable error when `E2E_BASE_URL` is not set (INFRA-03)
- Extended LandingPage POM with `landingContainer` locator and `waitForVisible()` method
- Fixed all landing-page POM bypasses in browser-navigation.spec.ts (4 tests, 4 raw `page.goto('/')` + 4 raw `page.getByTestId('landing-page')` calls)
- Fixed all landing-page POM bypasses in theme-and-404.spec.ts (7 raw `page.goto('/')` calls across 6 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove loadExampleAndExecute from helpers.ts** - `050de8c` (chore)
2. **Task 2: Add Docker guard to playwright.config.ts** - `a77222f` (chore)
3. **Task 3: Audit and fix LandingPage POM bypasses** - `26f94ad` (refactor)

## Files Created/Modified
- `e2e/fixtures/helpers.ts` - Removed 21 lines: `loadExampleAndExecute()` function + `DemoPage` import
- `playwright.config.ts` - Added E2E_BASE_URL guard block, POM contract comment, removed webServer block
- `e2e/pages/LandingPage.ts` - Added `landingContainer` locator and `waitForVisible()` method
- `e2e/tests/browser-navigation.spec.ts` - Imported LandingPage, replaced all raw goto('/') and getByTestId('landing-page') with POM methods
- `e2e/tests/theme-and-404.spec.ts` - Imported LandingPage, replaced all 7 raw page.goto('/') with landing.goto()

## Decisions Made
- Removed webServer block entirely from playwright.config.ts — Docker guard enforces callers always set E2E_BASE_URL explicitly, making auto dev-server start moot
- Theme toggle and 404 assertions in theme-and-404.spec.ts kept as raw `page.getBy*` calls — these target app-level UI (theme button shared across all pages) and 404 page content, not landing page elements

## Deviations from Plan

None - plan executed exactly as written. Task 1 changes were already staged in working tree (pre-applied); committed as specified.

## Issues Encountered

None. helpers.ts already had the Task 1 changes staged in the working tree (unstaged diff showing the DemoPage import and loadExampleAndExecute removal). Committed as Task 1 directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Test infrastructure cleanup complete for Plan 01
- All active spec files now use LandingPage POM for landing navigations
- TypeScript compiles with zero errors
- Ready for Phase 19 Plan 02 (remaining tech debt cleanup)

---
*Phase: 19-test-infrastructure-cleanup*
*Completed: 2026-02-19*
