---
phase: 23-e2e-tests
plan: "01"
subsystem: e2e
tags: [playwright, e2e, csharp-fv, pom, error-scenarios]
dependency_graph:
  requires: []
  provides: [failedStatusBadge-locator, csharp-fv-examples-spec, csharp-fv-error-scenario]
  affects: [e2e/pages/ExecutionPage.ts, e2e/tests/csharp-fv-examples.spec.ts, e2e/tests/execution-errors.spec.ts]
tech_stack:
  added: []
  patterns: [POM-extension, isMobile-skip-pattern, route-interception, SSE-error-detection]
key_files:
  created:
    - e2e/tests/csharp-fv-examples.spec.ts
  modified:
    - e2e/pages/ExecutionPage.ts
    - e2e/tests/execution-errors.spec.ts
decisions:
  - sample.zip (main.cpp only, no .csproj) used directly for C# FV no-.csproj test — no route interception needed
  - C# FV error test asserts either error alert OR failedStatusBadge to handle both SSE error and FAILED badge paths
  - Outer describe in csharp-fv-examples.spec.ts has NO isMobile skip — runs on full 9-project matrix per E2E-01
metrics:
  duration: ~10min
  completed_date: "2026-02-20"
  tasks_completed: 3
  files_modified: 3
---

# Phase 23 Plan 01: C# FV E2E Foundation — POM Extension and Example Loading Spec Summary

Extended ExecutionPage POM with `failedStatusBadge` locator, created `csharp-fv-examples.spec.ts` covering all 3 C# FV examples on the full 9-browser matrix (E2E-01), and added C# FV wrapper validation error scenario to `execution-errors.spec.ts`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add failedStatusBadge to ExecutionPage POM | c178c93 | e2e/pages/ExecutionPage.ts |
| 2 | Create csharp-fv-examples.spec.ts (E2E-01) | 0e326a8 | e2e/tests/csharp-fv-examples.spec.ts |
| 3 | Add C# FV no-.csproj error scenario to execution-errors.spec.ts | ac775fe | e2e/tests/execution-errors.spec.ts |

## What Was Built

### Task 1: failedStatusBadge Locator (ExecutionPage POM)

Added `failedStatusBadge` readonly `Locator` property to `ExecutionPage` class. Targets `.bg-red-100.text-red-800` (or `.dark:bg-red-900`) CSS classes filtered by `/FAILED/i` text — matches the FAILED status badge rendered by `ExecutionPanel.tsx` when `status === 'failed'`.

This property is essential for plan 02 to assert FAILED execution status without re-implementing the locator.

### Task 2: csharp-fv-examples.spec.ts (E2E-01)

New spec file with 7 tests in 2 describe blocks:

**"C# FV Example Loading — All 3 Examples (E2E-01)"** (no isMobile skip — runs on all 9 Playwright projects):
- `null-safe-repository` example loads and enables execute button
- `bank-account-invariant` example loads and enables execute button
- `calculator-contracts` example loads and enables execute button
- Example selector shows exactly 3 selectable C# FV options (4 total including placeholder)

**"C# FV Example UI Interactions (E2E-01)"** (isMobile skip — desktop only):
- Selecting an example shows its description text
- Switching example changes the description text
- Dropdown resets to placeholder after successful load

All `goto()` calls use `'tool=csharp-verification'` (hyphenated, not underscored).

### Task 3: C# FV Wrapper Validation Error Scenario

New `test.describe('C# FV Wrapper Validation Errors')` block in `execution-errors.spec.ts`:

- Test uploads `sample.zip` (contains only `main.cpp`, no `.csproj`) with `tool=csharp-verification`
- The wrapper's pre-flight check (`find . -name '*.csproj'`) finds nothing and exits 2
- Assertion uses `Promise.race` between error alert locator and `failedStatusBadge` — covers both the SSE `error` event path (error alert) and the FAILED status badge path
- `isMobile` skip applied, consistent with existing execution tests

## Deviations from Plan

### Auto-confirmed Pre-existing Work

Tasks 1 and 2 were already committed (`c178c93`, `0e326a8`) when this plan execution began. These commits matched the plan exactly — no re-work needed.

**Task 3 Deviation: sample.zip inspection-confirmed approach**

The plan instructed to inspect `sample.zip` and choose the approach based on whether it contains a `.csproj`. Inspection confirmed `sample.zip` contains only `main.cpp` — no `.csproj` — so the direct upload approach was used (not route interception).

Additionally, the error assertion was implemented as `Promise.race` between the error alert locator and `failedStatusBadge` (from Task 1), rather than asserting only the error alert. This is more robust: the wrapper may surface the error via SSE `error` event (error alert) or via process exit code (FAILED badge), depending on timing and portal event handling.

## Success Criteria Verification

- [x] ExecutionPage.failedStatusBadge locator targets red FAILED badge (`.bg-red-100.text-red-800` + `/FAILED/i`)
- [x] csharp-fv-examples.spec.ts covers all 3 C# FV examples for loading (E2E-01), runs on 9-project matrix
- [x] execution-errors.spec.ts extended with C# FV no-.csproj error scenario
- [x] All files compile without TypeScript errors (`npx tsc --noEmit -p e2e/tsconfig.json`: zero errors)
- [x] All `goto()` calls use `'tool=csharp-verification'` (hyphenated)
- [x] Outer describe block in csharp-fv-examples.spec.ts has NO isMobile skip

## Self-Check: PASSED

Files exist:
- FOUND: e2e/pages/ExecutionPage.ts (failedStatusBadge property at line 48)
- FOUND: e2e/tests/csharp-fv-examples.spec.ts (7 tests)
- FOUND: e2e/tests/execution-errors.spec.ts (C# FV Wrapper Validation Errors describe block)

Commits exist:
- FOUND: c178c93 — feat(23-01): add failedStatusBadge locator to ExecutionPage POM
- FOUND: 0e326a8 — feat(23-01): create csharp-fv-examples.spec.ts — E2E-01 C# FV example loading
- FOUND: ac775fe — feat(23-01): add C# FV no-.csproj wrapper validation error scenario to execution-errors
