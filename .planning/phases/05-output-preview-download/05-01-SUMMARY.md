---
phase: 05-output-preview-download
plan: 01
subsystem: api
tags: [archiver, express, file-tree, zip-streaming, ttl-cleanup, path-security]

# Dependency graph
requires:
  - phase: 02-file-upload-validation
    provides: ProjectService for path resolution, pathSecurity utils for validation
  - phase: 03-process-execution
    provides: Project directory structure for output files
  - phase: 04-realtime-output-streaming
    provides: Server infrastructure and middleware patterns
provides:
  - FileNode, FileTreeResponse, FilePreviewResponse types in @repo/shared
  - OutputService for recursive file tree building and file content reading
  - DownloadService for streaming ZIP downloads via archiver
  - CleanupService for TTL-based directory deletion with graceful shutdown
  - Three API endpoints: GET /projects/:projectId/output, preview/:filePath, download
affects: [05-02-client-file-browser, 05-03-download-integration]

# Tech tracking
tech-stack:
  added: [archiver for ZIP streaming]
  patterns: [Lazy service initialization for test compatibility, Singleton service exports, Path validation before streaming, Binary file detection via null bytes, File truncation for large files (500KB limit)]

key-files:
  created:
    - packages/shared/src/types/output.ts
    - packages/server/src/services/outputService.ts
    - packages/server/src/services/downloadService.ts
    - packages/server/src/services/cleanupService.ts
    - packages/server/src/routes/output.ts
    - packages/server/src/__tests__/outputService.test.ts
    - packages/server/src/__tests__/downloadService.test.ts
    - packages/server/src/__tests__/cleanupService.test.ts
    - packages/server/src/__tests__/output.test.ts
  modified:
    - packages/shared/src/types/index.ts

key-decisions:
  - "Use archiver library (already installed) for streaming ZIP creation with compression level 6"
  - "Truncate file previews at 500KB to prevent memory issues with large output files"
  - "Detect binary files via null byte check in first 8KB, return empty content with language='binary'"
  - "Normalize file tree paths to forward slashes for web compatibility across platforms"
  - "Use lazy projectService initialization pattern for test environment variable support"
  - "Sort file tree children: directories first, then alphabetically by name"
  - "CleanupService defaults to 10-minute TTL for automatic directory cleanup"
  - "Signal handlers (SIGTERM/SIGINT) excluded in test environment to avoid test runner interference"
  - "Verify directory exists before streaming ZIP to return proper 404 for missing projects"
  - "Use encoded path traversal in tests (..%2F..%2F) to avoid Express normalization"

patterns-established:
  - "Pattern 1: Singleton service exports (e.g., export const outputService = new OutputService())"
  - "Pattern 2: File tree normalized structure with node IDs as keys for efficient client-side rendering"
  - "Pattern 3: Language detection from file extension for syntax highlighting support"
  - "Pattern 4: Binary file detection via null byte scanning before text processing"

# Metrics
duration: 6min
completed: 2026-02-13
---

# Phase 5 Plan 1: Output Infrastructure Summary

**Three backend services with streaming ZIP downloads, recursive file trees, and TTL-based cleanup for project output files**

## Performance

- **Duration:** 6 min 2s
- **Started:** 2026-02-13T06:17:25Z
- **Completed:** 2026-02-13T06:23:27Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- OutputService builds recursive file trees with path validation, binary detection, and 500KB truncation
- DownloadService streams ZIP archives via archiver with compression level 6
- CleanupService schedules TTL-based directory deletion with graceful shutdown handling
- Three API endpoints working: file tree listing, file preview, and ZIP download
- Comprehensive test coverage with 33 new tests across 4 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared output types and three core services** - `6a4a6e7` (feat)
2. **Task 2: API routes and comprehensive tests** - `204db25` (feat)

_Note: Task 1 was previously committed; Task 2 included test fixes for proper binary response handling and path traversal validation_

## Files Created/Modified

- `packages/shared/src/types/output.ts` - FileNode, FileTreeResponse, FilePreviewResponse, OutputType types with classifyOutputType helper
- `packages/shared/src/types/index.ts` - Added export for output types
- `packages/server/src/services/outputService.ts` - Recursive file tree building, file content reading with truncation and binary detection
- `packages/server/src/services/downloadService.ts` - Streaming ZIP downloads via archiver, directory existence check before streaming
- `packages/server/src/services/cleanupService.ts` - TTL-based cleanup with configurable delay, graceful shutdown, signal handlers
- `packages/server/src/routes/output.ts` - Three GET endpoints for output, preview, download with lazy projectService pattern
- `packages/server/src/__tests__/outputService.test.ts` - 12 tests for file tree building, content reading, path security
- `packages/server/src/__tests__/downloadService.test.ts` - 2 tests for ZIP streaming
- `packages/server/src/__tests__/cleanupService.test.ts` - 11 tests for scheduling, cancellation, shutdown
- `packages/server/src/__tests__/output.test.ts` - 9 tests for all three API endpoints with security validation

## Decisions Made

- **Directory existence check:** Added `stat()` call in downloadService.streamZipDownload() before streaming to ensure proper 404 response for missing projects (prevents archiver from silently streaming empty ZIP)
- **Encoded path traversal in tests:** Used `..%2F..%2F` encoding in path traversal test to bypass Express path normalization and verify security validation
- **Binary response handling:** Used `.responseType('blob')` in supertest for download endpoint test to properly handle binary ZIP data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added directory existence check before ZIP streaming**
- **Found during:** Task 2 (Download endpoint testing)
- **Issue:** downloadService.streamZipDownload() would stream even when directory didn't exist, causing archiver to create empty ZIP and return 200 instead of 404
- **Fix:** Added `await stat(projectPath)` before creating archiver instance to throw ENOENT error if directory doesn't exist
- **Files modified:** packages/server/src/services/downloadService.ts
- **Verification:** Download endpoint test "should return 404 for non-existent project" now passes
- **Committed in:** 204db25 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed path traversal test to avoid Express normalization**
- **Found during:** Task 2 (Preview endpoint testing)
- **Issue:** Test using `../../../etc/passwd` was being normalized by Express to `etc/passwd` before reaching our code, causing 404 instead of expected 403
- **Fix:** Changed test to use encoded path traversal `..%2F..%2F..%2Fetc%2Fpasswd` which Express doesn't normalize, properly testing our path validation logic
- **Files modified:** packages/server/src/__tests__/output.test.ts
- **Verification:** Path traversal test now correctly receives 403 from validatePathSafety
- **Committed in:** 204db25 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed download endpoint test binary response handling**
- **Found during:** Task 2 (Download endpoint testing)
- **Issue:** Test was trying to access `response.body.length` but body wasn't being parsed as Buffer, causing "undefined" error
- **Fix:** Added `.responseType('blob')` to supertest request to properly handle binary ZIP response data
- **Files modified:** packages/server/src/__tests__/output.test.ts
- **Verification:** Download test now correctly validates response has content
- **Committed in:** 204db25 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All auto-fixes necessary for correctness and proper error handling. No scope creep. Tests now properly validate security and binary response handling.

## Issues Encountered

None - implementation proceeded smoothly. All services and endpoints work as specified in plan.

## User Setup Required

None - no external service configuration required. All functionality uses built-in Node.js APIs and archiver library.

## Next Phase Readiness

- Backend output infrastructure complete and tested
- Three API endpoints ready for client integration
- File tree structure optimized for efficient client-side rendering
- Binary file detection prevents client from attempting to render non-text files
- Path security validation prevents traversal attacks
- Ready for Phase 5 Plan 2: Client-side file browser UI

## Self-Check

Verifying all claimed artifacts exist:

- ✓ packages/shared/src/types/output.ts exists
- ✓ packages/server/src/services/outputService.ts exists
- ✓ packages/server/src/services/downloadService.ts exists
- ✓ packages/server/src/services/cleanupService.ts exists
- ✓ packages/server/src/routes/output.ts exists
- ✓ All 4 test files exist
- ✓ Commit 6a4a6e7 exists (Task 1)
- ✓ Commit 204db25 exists (Task 2)

**Self-Check: PASSED**

---
*Phase: 05-output-preview-download*
*Completed: 2026-02-13*
