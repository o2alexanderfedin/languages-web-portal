# Roadmap: Hupyy Languages Web Portal

## Milestones

- **v1.0 MVP** — Phases 1-7 (shipped 2026-02-14) — [Details](milestones/v1.0-ROADMAP.md)
- **v1.1 Java FV Integration** — Phases 8-10 (shipped 2026-02-16) — [Details](milestones/v1.1-ROADMAP.md)
- **v1.2 Comprehensive E2E Testing** — Phases 11-17 (active 2026-02-16)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-7) — SHIPPED 2026-02-14</summary>

- [x] Phase 1: Project Setup & Foundation (3/3 plans) — completed 2026-02-12
- [x] Phase 2: File Upload & Validation (2/2 plans) — completed 2026-02-13
- [x] Phase 3: Process Execution & Sandboxing (3/3 plans) — completed 2026-02-13
- [x] Phase 4: Real-Time Output Streaming (2/2 plans) — completed 2026-02-12
- [x] Phase 5: Output Preview & Download (3/3 plans) — completed 2026-02-13
- [x] Phase 6: Landing Page & Examples (2/2 plans) — completed 2026-02-13
- [x] Phase 7: E2E Testing with Playwright (2/2 plans) — completed 2026-02-14

</details>

<details>
<summary>v1.1 Java FV Integration (Phases 8-10) — SHIPPED 2026-02-16</summary>

- [x] Phase 8: Docker Infrastructure & Wrapper (2/2 plans) — completed 2026-02-16
- [x] Phase 9: Tool Activation & Examples (3/3 plans) — completed 2026-02-16
- [x] Phase 10: E2E Testing (2/2 plans) — completed 2026-02-16

</details>

### v1.2 Comprehensive E2E Testing (Active)

**Milestone Goal:** Every user-facing behavior verified across Chromium, Firefox, and WebKit browsers on desktop, tablet, and mobile viewports — running against the Docker production image.

- [x] **Phase 11: Test Infrastructure & Configuration** - Cross-browser and cross-device Playwright setup
- [x] **Phase 12: Landing Page E2E Tests** - Hero, tool grid, responsive layout, navigation (completed 2026-02-17)
- [x] **Phase 13: Upload Flow E2E Tests** - Drag-drop, validation, error handling (completed 2026-02-17)
- [x] **Phase 14: Execution Flow E2E Tests** - Streaming, progress, error states (completed 2026-02-17)
- [x] **Phase 15: Output Flow E2E Tests** - File tree, preview, download (completed 2026-02-17)
- [x] **Phase 16: Examples & Shareable Links E2E Tests** - Example loading, URL parameters (completed 2026-02-17)
- [ ] **Phase 17: Edge Cases & Polish** - Theme toggle, 404, browser navigation, tool switching

## Phase Details

### Phase 11: Test Infrastructure & Configuration
**Goal**: Playwright configured for cross-browser, cross-device testing against Docker production container
**Depends on**: Phase 10 (v1.1 E2E Testing)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Playwright runs tests against all three browsers (Chromium, Firefox, WebKit) without configuration errors
  2. Tests execute against three viewport sizes (desktop 1280x720, tablet 768x1024, mobile 375x812)
  3. Docker production container starts and serves application for test target
  4. Shared test fixtures exist and are reusable across test suites (DRY pattern)
**Plans:** 2 plans
Plans:
- [x] 11-01-PLAN.md — Cross-browser/viewport Playwright config with Docker target support
- [x] 11-02-PLAN.md — Shared test fixtures extraction and test refactoring

### Phase 12: Landing Page E2E Tests
**Goal**: Landing page fully verified across browsers and devices with responsive behavior
**Depends on**: Phase 11
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. Hero section, mission statement, and CTA render correctly on all browser/viewport combinations
  2. Tool comparison grid displays all 8 tools with accurate status badges
  3. Layout switches from table (desktop) to cards (mobile/tablet) responsively
  4. Try Now buttons navigate correctly for available tools and show disabled state for Coming Soon tools
**Plans:** 2/2 plans complete
Plans:
- [ ] 12-01-PLAN.md — Landing page content and responsive layout tests (hero, tools, badges, table/cards)
- [ ] 12-02-PLAN.md — Landing page interaction tests (Try Now navigation, Coming Soon disabled state)

### Phase 13: Upload Flow E2E Tests
**Goal**: File upload flow verified with drag-drop, validation, and error handling across browsers
**Depends on**: Phase 12
**Requirements**: UPLD-01, UPLD-02, UPLD-03, UPLD-04
**Success Criteria** (what must be TRUE):
  1. ZIP files upload successfully via drag-and-drop zone on all browsers
  2. Invalid file types are rejected with user-visible error messages
  3. Upload success displays indicator and assigns project ID
  4. Oversized files are rejected with appropriate error message
**Plans:** 2/2 plans complete
Plans:
- [ ] 13-01-PLAN.md — UploadPage POM, fixture files, and upload success E2E tests (drag-drop, click-upload, network interception, file replacement)
- [ ] 13-02-PLAN.md — Upload validation E2E tests (invalid types, oversized, error recovery)

### Phase 14: Execution Flow E2E Tests
**Goal**: Tool execution flow verified with streaming, progress indicators, and error handling
**Depends on**: Phase 13
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04
**Success Criteria** (what must be TRUE):
  1. Real-time SSE streaming displays output in console view across all browsers
  2. Execution progress indicators work (button state changes, loading spinner, connection badge)
  3. Execution errors (timeout, server error) display user-visible messages
  4. Execute button remains disabled until both file uploaded and tool selected
**Plans:** 2/2 plans complete
Plans:
- [ ] 14-01-PLAN.md — ExecutionPage POM and migration of happy-path/streaming/progress tests (Chromium desktop, Docker)
- [ ] 14-02-PLAN.md — Execution error tests (network interception) and button disabled state tests (3 desktop browsers)

### Phase 15: Output Flow E2E Tests
**Goal**: Output display verified with file tree, syntax preview, and download functionality
**Depends on**: Phase 14
**Requirements**: OUTP-01, OUTP-02, OUTP-03, OUTP-04
**Success Criteria** (what must be TRUE):
  1. Output file tree displays generated files after execution completes
  2. File preview shows syntax highlighting for source files
  3. ZIP download button triggers successful file download
  4. Empty output state displays appropriate message when no files generated
**Plans:** 2/2 plans complete
Plans:
- [ ] 15-01-PLAN.md — OutputPage POM and file tree/file preview tests (OUTP-01, OUTP-02, Docker serial)
- [ ] 15-02-PLAN.md — Download and empty-state tests (OUTP-03, OUTP-04, route interception)

### Phase 16: Examples & Shareable Links E2E Tests
**Goal**: Example loading and shareable link functionality verified across browsers
**Depends on**: Phase 15
**Requirements**: EXMP-01, EXMP-02, EXMP-03, EXMP-04
**Success Criteria** (what must be TRUE):
  1. All 3 Java examples load successfully across browsers
  2. Shareable link generation creates valid URLs with tool pre-selection
  3. Invalid shareable link parameters are handled gracefully without crashes
  4. Example descriptions display correctly and dropdown resets after load
**Plans:** 2/2 plans complete
Plans:
- [ ] 16-01-PLAN.md — Example loading E2E tests: all 3 examples + description display + dropdown reset (EXMP-01, EXMP-04)
- [ ] 16-02-PLAN.md — Shareable links cross-browser E2E tests: URL param pre-selection + invalid param handling (EXMP-02, EXMP-03)

### Phase 17: Edge Cases & Polish
**Goal**: Edge cases verified including theme toggle, navigation, and tool switching
**Depends on**: Phase 16
**Requirements**: EDGE-01, EDGE-02, EDGE-03, EDGE-04
**Success Criteria** (what must be TRUE):
  1. Theme toggle (light/dark/system) persists correctly across page navigation
  2. 404 page displays for unknown routes
  3. Tool switching flow works (select tool A, switch to tool B, execute successfully)
  4. Browser back/forward navigation preserves application state correctly
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Setup & Foundation | v1.0 | 3/3 | Complete | 2026-02-12 |
| 2. File Upload & Validation | v1.0 | 2/2 | Complete | 2026-02-13 |
| 3. Process Execution & Sandboxing | v1.0 | 3/3 | Complete | 2026-02-13 |
| 4. Real-Time Output Streaming | v1.0 | 2/2 | Complete | 2026-02-12 |
| 5. Output Preview & Download | v1.0 | 3/3 | Complete | 2026-02-13 |
| 6. Landing Page & Examples | v1.0 | 2/2 | Complete | 2026-02-13 |
| 7. E2E Testing with Playwright | v1.0 | 2/2 | Complete | 2026-02-14 |
| 8. Docker Infrastructure & Wrapper | v1.1 | 2/2 | Complete | 2026-02-16 |
| 9. Tool Activation & Examples | v1.1 | 3/3 | Complete | 2026-02-16 |
| 10. E2E Testing | v1.1 | 2/2 | Complete | 2026-02-16 |
| 11. Test Infrastructure & Configuration | v1.2 | 2/2 | Complete | 2026-02-16 |
| 12. Landing Page E2E Tests | v1.2 | Complete    | 2026-02-17 | - |
| 13. Upload Flow E2E Tests | v1.2 | Complete    | 2026-02-17 | - |
| 14. Execution Flow E2E Tests | v1.2 | Complete    | 2026-02-17 | - |
| 15. Output Flow E2E Tests | v1.2 | Complete    | 2026-02-17 | - |
| 16. Examples & Shareable Links E2E Tests | v1.2 | Complete    | 2026-02-17 | - |
| 17. Edge Cases & Polish | v1.2 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-17 after Phase 16 planning*
