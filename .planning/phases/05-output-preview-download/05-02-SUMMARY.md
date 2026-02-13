---
phase: 05-output-preview-download
plan: 02
subsystem: ui
tags: [react, react-complex-tree, react-syntax-highlighter, prism, file-browser, syntax-highlighting]

# Dependency graph
requires:
  - phase: 05-01
    provides: RTK Query outputApi, FileNode types, backend output endpoints
  - phase: 04-realtime-output-streaming
    provides: Redux store configuration and RTK Query patterns
provides:
  - FileTree component for browsing output files with react-complex-tree
  - FilePreview component with Prism syntax highlighting (light build)
  - DownloadButton component for ZIP download
  - OutputPanel composite component with responsive layout
  - Language detection utility for file extension to Prism language mapping
  - Output type labeling to distinguish transpiler source from verification reports
affects: [05-03-integration, home-page-integration]

# Tech tracking
tech-stack:
  added: [react-complex-tree@2.6.1, react-syntax-highlighter@16.1.0]
  patterns: [Light build for Prism to minimize bundle size, Static tree data provider for read-only file trees, Output type badges for visual distinction between transpiler and verification output]

key-files:
  created:
    - packages/client/src/utils/languageMap.ts
    - packages/client/src/features/output/FileTree.tsx
    - packages/client/src/features/output/FilePreview.tsx
    - packages/client/src/features/output/DownloadButton.tsx
    - packages/client/src/features/output/OutputPanel.tsx
  modified:
    - packages/client/src/features/output/outputApi.ts (pre-existing from prior run)

key-decisions:
  - "Use react-syntax-highlighter light build with manual language registration to minimize bundle size (~50KB vs 500KB+)"
  - "Use StaticTreeDataProvider from react-complex-tree for read-only file tree (simpler than custom provider)"
  - "Direct anchor link for download instead of RTK Query endpoint (simpler, no blob handling needed)"
  - "Output type badges use color coding: blue for transpiled source, green for verification reports, gray for logs"
  - "Binary files show download-to-view message instead of attempting to render garbled content"
  - "Truncation indicator shows as yellow banner for files over 500KB preview limit"
  - "Two-column responsive layout: tree + download on left (1/3), preview on right (2/3), stacked on mobile"

patterns-established:
  - "Pattern 1: File size formatting helper function (bytes → KB → MB with proper units)"
  - "Pattern 2: Badge color helper function for consistent output type visual distinction"
  - "Pattern 3: Prism language registration at module level for light build efficiency"
  - "Pattern 4: Placeholder state with helpful icon and text when no file selected"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Phase 5 Plan 2: Client Output UI Summary

**React file browser with syntax-highlighted preview using Prism light build, interactive tree navigation, and direct ZIP download**

## Performance

- **Duration:** 2 min 59s
- **Started:** 2026-02-13T06:36:29Z
- **Completed:** 2026-02-13T06:39:28Z
- **Tasks:** 2
- **Files modified:** 4 new components + language map utility

## Accomplishments

- FileTree renders interactive file browser with react-complex-tree, showing file sizes and directory hierarchy
- FilePreview displays syntax-highlighted code with Prism (13 languages registered), handles binary files and truncation
- OutputPanel composes tree, preview, and download in responsive two-column layout with info banner
- Output type badges distinguish transpiler source (blue) from verification reports (green)
- Language detection utility maps 20+ file extensions to Prism language identifiers
- Bundle size optimized via Prism light build (~50KB vs 500KB+ for full build)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create language map utility** - Dependencies already installed from prior run; languageMap.ts pre-existing
2. **Task 2: FileTree, FilePreview, DownloadButton, and OutputPanel components** - `234d4a3` (feat)

_Note: Task 1 artifacts (languageMap.ts, outputApi.ts) existed from previous execution; Task 2 created the four UI components_

## Files Created/Modified

- `packages/client/src/utils/languageMap.ts` - Extension to Prism language mapping with 20+ extensions, detectLanguage() and getOutputTypeLabel() helpers (pre-existing)
- `packages/client/src/features/output/FileTree.tsx` - Interactive file tree using react-complex-tree StaticTreeDataProvider, file size annotations, read-only configuration
- `packages/client/src/features/output/FilePreview.tsx` - Syntax-highlighted preview with Prism light build, 13 registered languages, binary file handling, truncation warning banner
- `packages/client/src/features/output/DownloadButton.tsx` - Direct anchor link styled as button for ZIP download
- `packages/client/src/features/output/OutputPanel.tsx` - Composite panel with two-column layout (tree + download left, preview right), info banner about auto-cleanup, placeholder state

## Decisions Made

**Light build optimization:** Used react-syntax-highlighter/dist/esm/light with manual language registration instead of full Prism bundle, reducing bundle size from 500KB+ to ~50KB while covering all Hapyy tool output languages.

**Static tree provider:** Used StaticTreeDataProvider from react-complex-tree for read-only file browsing (simpler than implementing custom TreeDataProvider, perfect for output viewing use case).

**Direct download link:** Implemented download as direct `<a href="/api/projects/:id/download">` instead of RTK Query endpoint to avoid blob handling complexity and leverage browser native download behavior.

**Fixed FileTree TypeScript errors:** Resolved undefined access errors on fileTree map and unused variable in renderItemTitle (removed unused `title` parameter, added optional chaining for path checks).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in FileTree component**
- **Found during:** Task 2 (Build verification)
- **Issue:** TypeScript errors: `fileTree[id]` possibly undefined at lines 53, unused `title` parameter at line 78, `rootId` possibly undefined at line 93
- **Fix:** Added optional chaining for `fileTree[id]?.path` checks, removed unused `title` parameter from renderItemTitle, added fallback `|| 'root'` for rootId
- **Files modified:** packages/client/src/features/output/FileTree.tsx
- **Verification:** Build passes without TypeScript errors
- **Committed in:** 234d4a3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** TypeScript error fixes necessary for compilation. No scope creep. All components work as specified.

## Issues Encountered

None - implementation proceeded smoothly. All components compile and lint clean.

## User Setup Required

None - no external service configuration required. All functionality uses installed npm packages.

## Next Phase Readiness

- Client output UI complete with file browsing, preview, and download
- Output type badges distinguish transpiler vs verification output (OUT-04 requirement met)
- Binary file handling prevents garbled content rendering
- Truncation indicator informs users about large file preview limits
- Ready for Phase 5 Plan 3: Integration testing and Home page connection
- Components ready to be integrated into Home.js execution flow

## Self-Check

Verifying all claimed artifacts exist:

- ✓ packages/client/src/utils/languageMap.ts
- ✓ packages/client/src/features/output/FileTree.tsx
- ✓ packages/client/src/features/output/FilePreview.tsx
- ✓ packages/client/src/features/output/DownloadButton.tsx
- ✓ packages/client/src/features/output/OutputPanel.tsx
- ✓ Commit 234d4a3

**Self-Check: PASSED**

---
*Phase: 05-output-preview-download*
*Completed: 2026-02-13*
