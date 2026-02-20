# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** Planning next milestone

## Current Position

Phase: 19 of 19 (Test Infrastructure Cleanup) -- COMPLETE
Plan: 2 of 2 in current phase -- COMPLETE
Status: Phase 19 Plan 02 Complete — 8 legacy specs archived via git mv, testIgnore added, phase complete
Last activity: 2026-02-19 — Completed 19-02-PLAN.md

Progress: [████████████████████] 100% (17/17 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 26
- Average duration: ~35 min per plan
- Total execution time: ~14.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Project Setup | 3 | ~3h | ~60min |
| 2. Upload | 2 | ~1.5h | ~45min |
| 3. Execution | 3 | ~2h | ~40min |
| 4. Streaming | 2 | ~1h | ~30min |
| 5. Output | 3 | ~2h | ~40min |
| 6. Landing | 2 | ~1.5h | ~45min |
| 7. E2E v1.0 | 2 | ~1h | ~30min |
| 8. Docker | 2 | ~1.5h | ~45min |
| 9. Tool Activation | 3 | ~2h | ~40min |
| 10. E2E v1.1 | 2 | ~1h | ~30min |
| 11. Test Infra | 2/2 | ~24min | ~12min |
| 12. Landing E2E | 2/2 | ~24min | ~12min |
| 13. Upload E2E | 2/2 | ~16min | ~8min |
| 14. Execution E2E | 2/2 | ~5min | ~3min |
| 15. Output E2E | 2/2 | ~11min | ~5min |
| 16. Examples/Shareable Links E2E | 2/2 | ~2min | ~1min |
| 17. Edge Cases Polish | 2/2 | ~4min | ~2min |

**Recent Trend:**
- Last 5 plans: 1-14min range
- Trend: Stable (fast execution)

*Updated after 18-01 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 7: Playwright for E2E testing (desktop + mobile browser testing with POM pattern)
- Phase 8: Docker 3-stage build with JDK 25 (Maven → JDK runtime → Node.js production)
- Phase 10: E2E tests covering Java verification user flow
- Phase 11-01: 9-project Playwright config ({viewport}-{browser} naming), E2E_BASE_URL for Docker targeting
- Phase 11-02: Shared test helpers in e2e/fixtures/helpers.ts for DRY test code across suites
- Phase 12-01: Use viewport-based layout detection as fallback for Firefox mobile emulation
- Phase 12-02: Force-click disabled buttons to verify navigation prevention behavior
- Phase 13-01: Use DataTransfer+dispatchEvent('drop') for drag-and-drop simulation in react-dropzone tests; viewport threshold 1024px separates desktop (drag-drop) from tablet/mobile (click-upload)
- Phase 13-02: Try Again button must call both reset() and setRejectionError(null) — RTK Query reset() alone leaves client-side rejection error state set; use conditional isVisible() assertion for react-dropzone silent rejections; Promise.race for dual-outcome (success/error) test assertions
- Phase 14-01: ExecutionPage POM is self-contained (no helpers.ts import); connectionBadge uses .bg-yellow-100/.bg-green-100 CSS filter; execution-flow.spec.ts replaces java-fv-execution.spec.ts
- Phase 14-02: EXEC-03 error tests use page.route('**/execute**') interception (no Docker); EXEC-04 button state tests use isMobile skip to auto-run across Chromium/Firefox/WebKit desktop
- Phase 15-01: OutputPage uses .bg-slate-900 first() for filePreviewHeader; syntaxHighlighterBlock covers pre code/.react-syntax-highlighter/pre[class*="language-"]; e2e/tsconfig.json uses ESNext/bundler for import.meta support; non-folder treeItems via :not([aria-expanded]) selector
- Phase 15-02: OUTP-03 uses Promise.all([page.waitForEvent('download'), button.click()]) for anchor download elements; OUTP-04 uses dual route interception (**/file-tree** + **/execute**) to simulate empty output state without Docker
- Phase 16-01: Dual-describe split (Docker-serial EXMP-01 block + UI-parallel EXMP-04 block) within single spec file; test.setTimeout + serial mode scoped to Docker block only; DemoPage for getExampleDescription(), ExecutionPage for loadExample() + executeButton
- Phase 16-02: Cross-browser shareable links suite uses isMobile skip for desktop-only execution; pageerror capture pattern for zero-JS-exception assertions on invalid ?tool= params
- Phase 17-01: clickToTheme() helper iterates up to 3 clicks regardless of starting theme (avoids state assumptions); system mode test emulates dark colorScheme before goto(); EDGE-02 HTTP test asserts rendered content not HTTP status (Vite SPA fallback returns 200 for unknown routes)
- Phase 17-02: EDGE-03 tool switching uses java-verification→cpp-to-c-transpiler cycle (only java-verification is Docker-enabled); EDGE-04 browser navigation uses real SPA routing (no route interception) with goBack/goForward({ waitUntil: 'networkidle' }) and pageErrors capture for zero-JS-exception assertions
- Phase 19-01: Docker guard pattern (top-level throw before defineConfig) enforces E2E_BASE_URL; webServer block removed; LandingPage POM enforced for all landing navigations in all active spec files
- Phase 19-02: Archive pattern (git mv to e2e/archive/ + testIgnore + tsconfig exclude) retires legacy specs from CI while preserving full git history

### Pending Todos

None yet.

### Blockers/Concerns

**Active:**
- CVC5/Yices/Bitwuzla not available on linux-aarch64 in Docker — Z3 only (acceptable for current tools)

## Session Continuity

Last session: 2026-02-20
Stopped at: v1.2 milestone complete — archived to milestones/v1.2-ROADMAP.md, git tagged v1.2
Resume file: None
Next step: /gsd:new-milestone — start v1.3 planning (questioning → research → requirements → roadmap)

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-18 after 17-02 execution*
