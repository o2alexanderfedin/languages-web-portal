# Requirements: Hupyy Languages Web Portal

**Defined:** 2026-02-16
**Core Value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## v1.2 Requirements

Requirements for Comprehensive E2E Testing milestone. Each maps to roadmap phases.

### Test Infrastructure

- [x] **INFRA-01**: Playwright config includes Chromium, Firefox, and WebKit browser projects
- [x] **INFRA-02**: Playwright config includes desktop (1280x720), tablet (768x1024), and mobile (375x812) viewports
- [x] **INFRA-03**: E2E tests run against Docker production container (not dev server)
- [x] **INFRA-04**: Shared test fixtures extracted into reusable utilities (DRY helpers for common patterns)

### Landing Page Tests

- [x] **LAND-01**: E2E test verifies hero section, mission statement, and CTA across all browsers and viewports
- [x] **LAND-02**: E2E test verifies tool comparison grid shows all 8 tools with correct status badges
- [x] **LAND-03**: E2E test verifies responsive layout switches between table (desktop) and cards (mobile/tablet)
- [x] **LAND-04**: E2E test verifies Try Now navigation for available tools and disabled state for Coming Soon tools

### Upload Flow Tests

- [x] **UPLD-01**: E2E test verifies ZIP file upload via drag-and-drop zone across all browsers
- [x] **UPLD-02**: E2E test verifies upload rejection for invalid file types with user-visible error message
- [x] **UPLD-03**: E2E test verifies upload success indicator and project ID assignment
- [x] **UPLD-04**: E2E test verifies oversized file rejection with appropriate error message

### Execution Flow Tests

- [x] **EXEC-01**: E2E test verifies real-time SSE streaming output in console view across all browsers
- [x] **EXEC-02**: E2E test verifies execution progress indicators (button state, loading, connection badge)
- [x] **EXEC-03**: E2E test verifies execution error handling (timeout, server error) with user-visible messages
- [x] **EXEC-04**: E2E test verifies execute button disabled until both file uploaded and tool selected

### Output Flow Tests

- [x] **OUTP-01**: E2E test verifies output file tree displays generated files after execution
- [x] **OUTP-02**: E2E test verifies file preview with syntax highlighting for source files
- [x] **OUTP-03**: E2E test verifies ZIP download button triggers file download
- [x] **OUTP-04**: E2E test verifies empty output state message when no files generated

### Example & Shareable Tests

- [x] **EXMP-01**: E2E test verifies example loading flow for all 3 Java examples across browsers
- [x] **EXMP-02**: E2E test verifies shareable link generation and URL parameter pre-selection
- [x] **EXMP-03**: E2E test verifies invalid shareable link parameters handled gracefully
- [x] **EXMP-04**: E2E test verifies example description display and dropdown reset after load

### Theme & Edge Cases

- [x] **EDGE-01**: E2E test verifies theme toggle (light/dark/system) persists across page navigation
- [x] **EDGE-02**: E2E test verifies 404 page for unknown routes
- [x] **EDGE-03**: E2E test verifies tool switching flow (select tool A, switch to tool B, execute)
- [x] **EDGE-04**: E2E test verifies browser back/forward navigation preserves state

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Testing

- **ADVT-01**: Visual regression testing with screenshot comparison
- **ADVT-02**: Accessibility testing with axe-core integration
- **ADVT-03**: Performance testing (page load time, time to interactive)
- **ADVT-04**: Load testing for concurrent user simulation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Security penetration testing | Requires specialized tools and expertise beyond E2E scope |
| API-level integration tests | Already covered by existing Vitest unit/integration tests |
| Mobile native testing | Web-only portal, responsive design tested via viewports |
| CI/CD pipeline setup | Testing infrastructure only, deployment is separate milestone |
| Test data generation | Existing fixtures sufficient for current tool set |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 11 | Complete |
| INFRA-02 | Phase 11 | Complete |
| INFRA-03 | Phase 11 | Complete |
| INFRA-04 | Phase 11 | Complete |
| LAND-01 | Phase 12 | Complete |
| LAND-02 | Phase 12 | Complete |
| LAND-03 | Phase 12 | Complete |
| LAND-04 | Phase 12 | Complete |
| UPLD-01 | Phase 13 | Complete |
| UPLD-02 | Phase 13 | Complete |
| UPLD-03 | Phase 13 | Complete |
| UPLD-04 | Phase 13 | Complete |
| EXEC-01 | Phase 14 | Complete |
| EXEC-02 | Phase 14 | Complete |
| EXEC-03 | Phase 14 | Complete |
| EXEC-04 | Phase 14 | Complete |
| OUTP-01 | Phase 15 | Complete |
| OUTP-02 | Phase 15 | Complete |
| OUTP-03 | Phase 15 | Complete |
| OUTP-04 | Phase 15 | Complete |
| EXMP-01 | Phase 16 | Complete |
| EXMP-02 | Phase 16 | Complete |
| EXMP-03 | Phase 16 | Complete |
| EXMP-04 | Phase 16 | Complete |
| EDGE-01 | Phase 17 | Complete |
| EDGE-02 | Phase 17 | Complete |
| EDGE-03 | Phase 17 | Complete |
| EDGE-04 | Phase 17 / Phase 19 (debt) | Complete |

**Coverage:**
- v1.2 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0
- Gap closure phases: Phase 18 (doc drift — complete), Phase 19 (tech debt)

✓ 100% requirement coverage achieved
⚡ Gap closure phases 18-19 added after audit — Phase 18 complete, Phase 19 pending

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-19 after Phase 18 documentation drift fix*
