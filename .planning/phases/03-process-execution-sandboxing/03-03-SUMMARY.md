---
phase: 03-process-execution-sandboxing
plan: 03
subsystem: ui
tags: [react, rtk-query, redux, tailwind, vitest, testing-library]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Queue management service with concurrency control and rate limiting"
  - phase: 03-02
    provides: "Execution service with execa subprocess management and Docker security"
  - phase: 02-02
    provides: "Upload UI with drag-and-drop and projectId state flow pattern"
provides:
  - "ToolPicker component showing all 8 tools with status badges (Available/In Development/Coming Soon)"
  - "ExecutionPanel managing full execution workflow: tool selection, run trigger, queue status, results display"
  - "QueueStatus component with 3-second polling for queue position and estimated wait time"
  - "executionApi RTK Query API with executeTool mutation, getQueueStatus and getTools queries"
  - "Home page integration with projectId state flow from upload to execution"
  - "Comprehensive test coverage (13 client tests total: 3 UploadZone, 6 ToolPicker, 3 ExecutionPanel, 1 App)"
affects: [04-real-time-streaming, ui, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RTK Query queryFn for static data (TOOLS constant) without API call"
    - "Conditional component rendering based on data availability (QueueStatus only when queue busy)"
    - "State machine pattern for execution flow (idle -> executing -> complete)"
    - "User-friendly error messages for different error types (429 rate limit, network errors, server errors)"
    - "Disabled button with contextual tooltip text based on missing prerequisites"
    - "waitFor pattern in tests for RTK Query data rendering"

key-files:
  created:
    - "packages/client/src/features/execution/executionApi.ts"
    - "packages/client/src/features/execution/ToolPicker.tsx"
    - "packages/client/src/features/execution/QueueStatus.tsx"
    - "packages/client/src/features/execution/ExecutionPanel.tsx"
    - "packages/client/src/__tests__/ToolPicker.test.tsx"
    - "packages/client/src/__tests__/ExecutionPanel.test.tsx"
  modified:
    - "packages/client/src/store/index.ts"
    - "packages/client/src/pages/Home.tsx"

key-decisions:
  - "Use RTK Query queryFn for static TOOLS data instead of API endpoint (no server round-trip needed)"
  - "Conditional QueueStatus rendering: only show when queue has waiting/running jobs (cleaner UX)"
  - "State machine pattern for execution flow: idle/executing/complete with clear transitions"
  - "Disable coming-soon tools visually (opacity-50, cursor-not-allowed) but render them to show ecosystem breadth"
  - "Run button gated on BOTH projectId AND selectedToolId with contextual disabled reason text"
  - "Scrollable console output with max-height 400px and monospace dark theme for readability"
  - "Use waitFor in tests to handle RTK Query async data loading (queryFn returns synchronously but React needs render cycle)"

patterns-established:
  - "RTK Query API pattern: reducerPath, baseQuery, endpoints (mutation/query), exported hooks"
  - "Tool picker with status-based selection: available/in-development selectable, coming-soon disabled"
  - "Execution panel composition: ToolPicker + Run button + QueueStatus + Results with state-driven visibility"
  - "Error handling: RTK Query error format parsing with user-friendly messages for different error codes"
  - "Test pattern: create test store, wrap in Provider, use waitFor for async data, verify rendering and interactions"

# Metrics
duration: 315s (5.2m)
completed: 2026-02-13
---

# Phase 3 Plan 3: Client Tool Picker and Execution UI Summary

**React execution UI with 8-tool picker showing status badges, gated run button, queue polling, and scrollable console output - all wired into Home page with projectId flow**

## Performance

- **Duration:** 5.2 min (315s)
- **Started:** 2026-02-13T02:42:45Z
- **Completed:** 2026-02-13T02:48:00Z
- **Tasks:** 2
- **Files modified:** 8 files (6 created, 2 modified)

## Accomplishments

- ToolPicker component displays all 8 tools with accurate status badges (2 Available, 3 In Development, 3 Coming Soon) and status-based selection
- ExecutionPanel manages full execution workflow with state machine (idle -> executing -> complete), queue status polling, and rich results display
- Home page integration with projectId state flow from upload to execution
- Run button properly gated on BOTH project upload AND tool selection with contextual disabled reason text
- Comprehensive test coverage: 13 client tests passing (6 ToolPicker, 3 ExecutionPanel, 3 UploadZone, 1 App)
- QueueStatus component with 3-second polling shows position, running jobs, and estimated wait time
- Execution results display status badge (completed/failed/timeout/cancelled), exit code, duration, and scrollable console output in dark monospace theme

## Task Commits

Each task was committed atomically:

1. **Task 1: Execution RTK Query API and ToolPicker component with status badges** - `d36d94a` (feat)
   - executionApi with executeTool mutation, getQueueStatus and getTools queries
   - ToolPicker showing all 8 tools with status badges and selection state
   - QueueStatus with 3s polling
   - Redux store registration

2. **Task 2: ExecutionPanel component, Home page integration, and tests** - `0809361` (feat)
   - ExecutionPanel with state machine and error handling
   - Home page integration with projectId state flow
   - ToolPicker tests (6 tests)
   - ExecutionPanel tests (3 tests)

## Files Created/Modified

**Created:**
- `packages/client/src/features/execution/executionApi.ts` - RTK Query API with executeTool mutation, getQueueStatus/getTools queries, queryFn for static TOOLS data
- `packages/client/src/features/execution/ToolPicker.tsx` - Tool selection UI with status badges and status-based selection logic
- `packages/client/src/features/execution/QueueStatus.tsx` - Queue position and wait time display with 3s polling
- `packages/client/src/features/execution/ExecutionPanel.tsx` - Main execution workflow component with state machine (idle/executing/complete), error handling, results display
- `packages/client/src/__tests__/ToolPicker.test.tsx` - 6 comprehensive tests for tool rendering, status badges, selection, disabled state
- `packages/client/src/__tests__/ExecutionPanel.test.tsx` - 3 tests for disabled states and tool picker integration

**Modified:**
- `packages/client/src/store/index.ts` - Added executionApi reducer and middleware to Redux store
- `packages/client/src/pages/Home.tsx` - Added projectId state, wired UploadZone callback, integrated ExecutionPanel below upload zone

## Decisions Made

**1. Use RTK Query queryFn for static TOOLS data**
- **Rationale:** TOOLS constant is static (defined in @repo/shared), no server round-trip needed. Using queryFn returns data synchronously without network overhead.

**2. Conditional QueueStatus rendering**
- **Rationale:** Only show when queue has waiting/running jobs (position > 0 or pending > 0). Cleaner UX - users don't see "0 waiting" noise.

**3. State machine pattern for execution flow**
- **Rationale:** Clear state transitions (idle -> executing -> complete) make UI logic predictable and testable. Each state has distinct rendering behavior.

**4. Run button gated on BOTH projectId AND selectedToolId**
- **Rationale:** User needs to upload a project AND select a tool before execution makes sense. Contextual disabled reason text ("Upload a project first" vs "Select a tool") guides user to next action.

**5. Scrollable console output with max-height 400px**
- **Rationale:** Tool output can be arbitrarily long (hundreds of lines). Fixed max-height with overflow-y-auto prevents page bloat while keeping full output accessible.

**6. Use waitFor in tests for RTK Query data**
- **Rationale:** RTK Query with queryFn returns data synchronously, but React still needs a render cycle to display it. waitFor ensures tests wait for DOM updates before assertions.

**7. Disable coming-soon tools visually but render them**
- **Rationale:** Shows ecosystem breadth (8 tools) and sets user expectations. Visual styling (opacity-50, cursor-not-allowed) makes disabled state obvious.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. RTK Query queryFn data not immediately rendered in tests**
- **Issue:** Tests failed because tools array was empty immediately after render
- **Root cause:** Even though queryFn returns synchronously, React needs a render cycle to display data
- **Resolution:** Wrapped assertions in waitFor(() => expect(screen.getByText('C++ to C Transpiler')).toBeInTheDocument()) to wait for DOM updates
- **Impact:** Pattern established for testing RTK Query components - always use waitFor for data-dependent assertions

**2. Multiple elements with same text causing test failures**
- **Issue:** getByText('Available') failed because 2 tools have "Available" badge
- **Resolution:** Changed to getAllByText and verified count matches expected (2 Available, 3 In Development, 3 Coming Soon)
- **Impact:** More robust test that verifies correct number of each status type

**3. closest('div') finding wrong parent element**
- **Issue:** Test for border-primary class on selected tool found inner div instead of card div
- **Resolution:** Changed to closest('div.border-2') to specifically target the card div with border classes
- **Impact:** More precise DOM traversal in tests

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 4 (Real-time Output Streaming):**
- ExecutionPanel complete with results display infrastructure
- State machine pattern established (can extend for streaming state)
- Console output display ready (currently shows full output array, can extend for line-by-line streaming)
- Error handling pattern established for different error types

**Foundation complete:**
- Full execution UI workflow: upload -> tool selection -> run -> results
- All 8 tools displayed with accurate status badges
- Queue status polling during execution
- Comprehensive test coverage (13 passing client tests)
- TypeScript build clean, ESLint clean

**No blockers for Phase 4.**

---
*Phase: 03-process-execution-sandboxing*
*Completed: 2026-02-13*

## Self-Check: PASSED

All files verified to exist:
- packages/client/src/features/execution/executionApi.ts
- packages/client/src/features/execution/ToolPicker.tsx
- packages/client/src/features/execution/QueueStatus.tsx
- packages/client/src/features/execution/ExecutionPanel.tsx
- packages/client/src/__tests__/ToolPicker.test.tsx
- packages/client/src/__tests__/ExecutionPanel.test.tsx

All commits verified to exist:
- d36d94a (Task 1)
- 0809361 (Task 2)
