# Phase 13: Upload Flow E2E Tests - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify file upload functionality (drag-drop, click-to-upload, validation, error handling, success flow) across all browser/viewport combinations. This phase tests existing upload behavior — no new features. Execution flow testing is Phase 14.

</domain>

<decisions>
## Implementation Decisions

### Drag-drop testing
- Test BOTH drag-and-drop AND click-to-upload file dialog paths
- Verify visual feedback: drop zone highlighting, hover state changes, AND successful upload result
- On mobile/tablet viewports: use click-to-upload path (drag-drop impractical on touch)
- On desktop viewports: test drag-and-drop as primary method
- Use real fixture ZIP files from e2e/fixtures/ (not synthetic/mocked data)

### Validation coverage
- Test ALL edge cases: wrong file type (.txt, .jpg), oversized files, empty files, corrupted ZIP, no extension
- Test error + recovery flow: verify error display, then re-upload valid file and confirm success
- Create fixture files for each invalid scenario in e2e/fixtures/

### Upload success flow
- Full state check after upload: success indicator, project ID display, file name shown, execute button enabled
- Verify UI state AND intercept/verify actual upload API request (network-level assertion)
- Test file replacement: upload file A, then upload file B — verify B replaces A cleanly

### Cross-browser strategy
- ALL upload tests run on all 9 browser/viewport combinations (3 browsers x 3 viewports)
- Handle known browser quirks: add browser-specific handling where Playwright has limitations (e.g., WebKit drag-drop)
- Shared fixture files in e2e/fixtures/ reused across all browser tests
- Extend existing POM (Page Object Model) pattern — create UploadPage object

### Claude's Discretion
- Error message assertion level: exact text vs visible error (pick appropriate level per scenario)
- Error persistence behavior: test based on actual app behavior (auto-dismiss vs manual dismiss)
- Tool pre-selection strategy: decide based on whether upload requires a tool selected first

</decisions>

<specifics>
## Specific Ideas

- Follow the established pattern from phases 11-12 (cross-browser config, shared helpers, POM)
- Real fixture files over mocks — closer to actual user experience
- Network interception to verify uploads actually reach the server, not just UI optimism

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-upload-flow-e2e-tests*
*Context gathered: 2026-02-16*
