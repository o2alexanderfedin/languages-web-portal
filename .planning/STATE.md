# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** Phase 16 - (next phase)

## Current Position

Phase: 15 of 17 (Output Flow E2E Tests) -- COMPLETE
Plan: 2 of 2 in current phase -- COMPLETE
Status: Phase 15 Complete
Last activity: 2026-02-17 — Completed 15-02-PLAN.md

Progress: [█████████████░░░░░░░] 76% (13/17 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 25
- Average duration: ~36 min per plan
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

**Recent Trend:**
- Last 5 plans: 3-14min range
- Trend: Stable (fast execution)

*Updated after 15-02 completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

**Active:**
- CVC5/Yices/Bitwuzla not available on linux-aarch64 in Docker — Z3 only (acceptable for current tools)

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 15-02-PLAN.md (output download + empty-state E2E tests — Phase 15 complete)
Resume file: None
Next step: Execute Phase 16

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-17 after 15-02 execution*
