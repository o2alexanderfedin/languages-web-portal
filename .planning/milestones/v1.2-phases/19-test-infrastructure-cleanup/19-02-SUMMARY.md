---
phase: 19-test-infrastructure-cleanup
plan: 02
subsystem: testing
tags: [playwright, typescript, e2e, archive, git-mv, testIgnore]

# Dependency graph
requires:
  - phase: 19-test-infrastructure-cleanup
    provides: Plan 01 — Docker guard, LandingPage POM enforced, dead code removed; playwright.config.ts in final state before testIgnore addition
  - phase: 07-e2e-v1-0
    provides: Original legacy spec files now archived (java-fv-*, landing-navigation, responsive-layout, shareable-links, upload-execute-results)
provides:
  - e2e/archive/ directory with 8 legacy spec files preserved via git mv (history intact)
  - playwright.config.ts testIgnore pattern excluding e2e/archive/ from default test run
  - e2e/tsconfig.json exclude field preventing TypeScript from compiling archived files
affects: [e2e-test-runs, future-spec-files, ci-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [Archive pattern — use git mv + testIgnore to retire spec files while preserving history, tsconfig exclude for archived test dirs]

key-files:
  created:
    - e2e/archive/java-fv-example-loading.spec.ts
    - e2e/archive/java-fv-landing.spec.ts
    - e2e/archive/java-fv-user-journey.spec.ts
    - e2e/archive/landing-navigation.spec.ts
    - e2e/archive/responsive-layout.spec.ts
    - e2e/archive/shareable-links-cross-browser.spec.ts
    - e2e/archive/shareable-links.spec.ts
    - e2e/archive/upload-execute-results.spec.ts
  modified:
    - playwright.config.ts
    - e2e/tsconfig.json

key-decisions:
  - "Use git mv (not cp+rm) to move legacy specs to archive — preserves full git history including pre-archive commits"
  - "testIgnore path pattern '**/e2e/archive/**' excludes archive at the Playwright runner level, not filesystem level — archived files remain accessible for reference"
  - "Add e2e/tsconfig.json exclude field for archive/ to prevent TypeScript errors from stale imports in archived files"

patterns-established:
  - "Archive pattern: git mv spec to e2e/archive/ + testIgnore + tsconfig exclude = spec retired from CI while history preserved"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 19 Plan 02: Legacy Spec Archive Summary

**8 superseded spec files moved to e2e/archive/ via git mv with testIgnore in playwright.config.ts and tsconfig exclude — removed from default test run while preserving full git history**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T23:52:00Z
- **Completed:** 2026-02-19T23:54:00Z
- **Tasks:** 2
- **Files modified:** 10 (8 moved, 2 config files updated)

## Accomplishments
- Moved 8 legacy spec files (java-fv-*, landing-navigation, responsive-layout, shareable-links, upload-execute-results) to e2e/archive/ using git mv — full git history preserved
- Added `testIgnore: ['**/e2e/archive/**']` to playwright.config.ts — archived files no longer appear in `npx playwright test --list`
- Added `"exclude": ["archive/**"]` to e2e/tsconfig.json — TypeScript no longer tries to compile archived specs
- Active test suite (11 spec files) unaffected — browser-navigation, execution-flow, etc. remain in test list

## Task Commits

Each task was committed atomically:

1. **Task 1: Move 8 legacy spec files to e2e/archive/ via git mv** - `4ea1004` (chore)
2. **Task 2: Add testIgnore to exclude e2e/archive/ from default test run** - `a2e38e1` (chore)

## Files Created/Modified
- `e2e/archive/java-fv-example-loading.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/java-fv-landing.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/java-fv-user-journey.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/landing-navigation.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/responsive-layout.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/shareable-links-cross-browser.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/shareable-links.spec.ts` - Archived via git mv from e2e/tests/
- `e2e/archive/upload-execute-results.spec.ts` - Archived via git mv from e2e/tests/
- `playwright.config.ts` - Added testIgnore pattern for e2e/archive/**
- `e2e/tsconfig.json` - Added exclude field for archive/**

## Decisions Made
- Used `git mv` not `cp + rm` — preserves pre-move commit history visible via `git log --follow`
- `testIgnore` pattern `'**/e2e/archive/**'` chosen over moving files outside testDir — keeps archive adjacent to tests for discoverability
- `e2e/tsconfig.json` exclude added alongside testIgnore — prevents TypeScript from reporting errors on archived files that may reference deprecated imports

## Deviations from Plan

None - plan executed exactly as written. Both tasks were already committed in prior session before SUMMARY.md was created.

## Issues Encountered

None. Both task commits (4ea1004 and a2e38e1) were already present in git history when this SUMMARY was created. All verification checks passed: 8 files in archive, 11 files remaining in e2e/tests/, testIgnore present, TypeScript zero errors, git history preserved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 19 complete — all test infrastructure cleanup objectives achieved
- 8 legacy specs removed from default test run, history preserved in archive
- TypeScript compilation zero errors
- Active test suite (11 specs, 3 browsers x 3 viewports = 9 projects) is clean

---
*Phase: 19-test-infrastructure-cleanup*
*Completed: 2026-02-19*
