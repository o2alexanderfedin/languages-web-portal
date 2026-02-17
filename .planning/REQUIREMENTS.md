# Requirements: Hupyy Languages Web Portal

**Defined:** 2026-02-16
**Core Value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## v1.2 Requirements

Requirements for Comprehensive E2E Testing milestone. Each maps to roadmap phases.

### Test Infrastructure

- [ ] **INFRA-01**: Playwright config includes Chromium, Firefox, and WebKit browser projects
- [ ] **INFRA-02**: Playwright config includes desktop (1280x720), tablet (768x1024), and mobile (375x812) viewports
- [ ] **INFRA-03**: E2E tests run against Docker production container (not dev server)
- [ ] **INFRA-04**: Shared test fixtures extracted into reusable utilities (DRY helpers for common patterns)

### Landing Page Tests

- [ ] **LAND-01**: E2E test verifies hero section, mission statement, and CTA across all browsers and viewports
- [ ] **LAND-02**: E2E test verifies tool comparison grid shows all 8 tools with correct status badges
- [ ] **LAND-03**: E2E test verifies responsive layout switches between table (desktop) and cards (mobile/tablet)
- [ ] **LAND-04**: E2E test verifies Try Now navigation for available tools and disabled state for Coming Soon tools

### Upload Flow Tests

- [ ] **UPLD-01**: E2E test verifies ZIP file upload via drag-and-drop zone across all browsers
- [ ] **UPLD-02**: E2E test verifies upload rejection for invalid file types with user-visible error message
- [ ] **UPLD-03**: E2E test verifies upload success indicator and project ID assignment
- [ ] **UPLD-04**: E2E test verifies oversized file rejection with appropriate error message

### Execution Flow Tests

- [ ] **EXEC-01**: E2E test verifies real-time SSE streaming output in console view across all browsers
- [ ] **EXEC-02**: E2E test verifies execution progress indicators (button state, loading, connection badge)
- [ ] **EXEC-03**: E2E test verifies execution error handling (timeout, server error) with user-visible messages
- [ ] **EXEC-04**: E2E test verifies execute button disabled until both file uploaded and tool selected

### Output Flow Tests

- [ ] **OUTP-01**: E2E test verifies output file tree displays generated files after execution
- [ ] **OUTP-02**: E2E test verifies file preview with syntax highlighting for source files
- [ ] **OUTP-03**: E2E test verifies ZIP download button triggers file download
- [ ] **OUTP-04**: E2E test verifies empty output state message when no files generated

### Example & Shareable Tests

- [ ] **EXMP-01**: E2E test verifies example loading flow for all 3 Java examples across browsers
- [ ] **EXMP-02**: E2E test verifies shareable link generation and URL parameter pre-selection
- [ ] **EXMP-03**: E2E test verifies invalid shareable link parameters handled gracefully
- [ ] **EXMP-04**: E2E test verifies example description display and dropdown reset after load

### Theme & Edge Cases

- [ ] **EDGE-01**: E2E test verifies theme toggle (light/dark/system) persists across page navigation
- [ ] **EDGE-02**: E2E test verifies 404 page for unknown routes
- [ ] **EDGE-03**: E2E test verifies tool switching flow (select tool A, switch to tool B, execute)
- [ ] **EDGE-04**: E2E test verifies browser back/forward navigation preserves state

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
| INFRA-01 | Pending | Pending |
| INFRA-02 | Pending | Pending |
| INFRA-03 | Pending | Pending |
| INFRA-04 | Pending | Pending |
| LAND-01 | Pending | Pending |
| LAND-02 | Pending | Pending |
| LAND-03 | Pending | Pending |
| LAND-04 | Pending | Pending |
| UPLD-01 | Pending | Pending |
| UPLD-02 | Pending | Pending |
| UPLD-03 | Pending | Pending |
| UPLD-04 | Pending | Pending |
| EXEC-01 | Pending | Pending |
| EXEC-02 | Pending | Pending |
| EXEC-03 | Pending | Pending |
| EXEC-04 | Pending | Pending |
| OUTP-01 | Pending | Pending |
| OUTP-02 | Pending | Pending |
| OUTP-03 | Pending | Pending |
| OUTP-04 | Pending | Pending |
| EXMP-01 | Pending | Pending |
| EXMP-02 | Pending | Pending |
| EXMP-03 | Pending | Pending |
| EXMP-04 | Pending | Pending |
| EDGE-01 | Pending | Pending |
| EDGE-02 | Pending | Pending |
| EDGE-03 | Pending | Pending |
| EDGE-04 | Pending | Pending |

**Coverage:**
- v1.2 requirements: 28 total
- Mapped to phases: 0
- Unmapped: 28

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after initial definition*
