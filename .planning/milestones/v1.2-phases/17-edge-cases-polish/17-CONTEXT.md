# Phase 17: Edge Cases & Polish - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

E2E test coverage for 4 edge case scenarios: theme toggle persistence (EDGE-01), 404 routing (EDGE-02), tool switching flow (EDGE-03), and browser back/forward navigation (EDGE-04). All tests use Playwright following established patterns from Phases 11-16.

</domain>

<decisions>
## Implementation Decisions

### Theme Toggle Verification (EDGE-01)
- Verify theme persistence using **CSS class check + localStorage assertion** (`localStorage.getItem('theme')` matches selected theme)
- Cover all three modes: **Light, Dark, and System** (system mode via `prefers-color-scheme` emulation)
- Test **multiple transitions**: landing → tool page navigation AND hard reload (page.reload())
- Run on **Chromium only** — theme behavior is not browser-specific

### 404 Page (EDGE-02)
- Verify **page content** (404 message renders, no JS exceptions) AND **HTTP status** (server returns 404, not 200 SPA fallback)
- Included in same plan as theme toggle (17-01-PLAN.md)

### Tool Switching Flow (EDGE-03)
- Requires **full Docker execution** — upload once, execute with tool A, switch to tool B, verify output clears, execute with tool B, verify tool B output appears
- Tool pair: **Z3 → CVC5** (or CVC5 → Z3 based on what's available in Docker)
- Reuse the **same uploaded file** across both executions (no re-upload needed)
- Assert that **output panel clears** after switching before new execution
- Included in same plan as browser navigation (17-02-PLAN.md)

### Browser Back/Forward Navigation (EDGE-04)
- Full session state should survive navigation: tool selection, upload state, and output panel visibility
- Use **route interception (no Docker)** to simulate execution state — fast and reliable
- Navigation flow: **Claude decides** the most realistic user scenario (e.g., Landing → Tool page → Back)
- Run on **Chromium only**
- Included in 17-02-PLAN.md alongside tool switching

### Plan Structure
- **2 plans:**
  - `17-01-PLAN.md` — Theme toggle (EDGE-01) + 404 routing (EDGE-02): no Docker, Chromium desktop
  - `17-02-PLAN.md` — Tool switching (EDGE-03) + browser navigation (EDGE-04): Docker required for EDGE-03, route interception for EDGE-04

### Claude's Discretion
- Exact navigation flow for back/forward test (Landing → Tool page → Back is the natural choice)
- Specific CSS class names for theme (`html.dark`, `html.light`, `html.system` or similar)
- System theme emulation approach (`page.emulateMedia({ colorScheme: 'dark' })`)
- Which routes to test for 404 (e.g., `/nonexistent`, `/totally-invalid-path`)
- Whether to use a shared ThemePage POM or inline helpers

</decisions>

<specifics>
## Specific Ideas

- Tool switching test follows the same Docker-serial pattern as EXMP-01 (Phase 16-01): `test.describe.serial` with `test.setTimeout`
- 404 HTTP status check: use `page.request.get(url)` or intercept response status rather than checking the HTML response code
- Theme tests should leverage `page.emulateMedia({ colorScheme: 'dark' })` for system preference mode

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-edge-cases-polish*
*Context gathered: 2026-02-17*
