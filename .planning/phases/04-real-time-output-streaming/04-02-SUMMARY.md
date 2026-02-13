---
phase: 04-real-time-output-streaming
plan: 02
subsystem: client
tags: [sse, eventsource, ansi-up, streaming-ui, real-time, console-view]

# Dependency graph
requires:
  - phase: 04-real-time-output-streaming
    plan: 01
    provides: Server-side SSE infrastructure, StreamService, GET /api/stream/:jobId endpoint
  - phase: 03-process-execution-sandboxing
    provides: ExecutionPanel component with synchronous execution flow
provides:
  - useSSE hook for EventSource lifecycle management with connection state tracking
  - ConsoleView component with ANSI-to-HTML conversion and auto-scroll
  - Streaming execution flow in ExecutionPanel (submit job -> connect SSE -> stream output)
  - Updated executionApi mutation type for jobId-only response
  - Comprehensive test suite for streaming UI components
affects: [06-polish-deploy]

# Tech tracking
tech-stack:
  added: [ansi_up, event-source-polyfill]
  patterns: [EventSource lifecycle management, ANSI color rendering, Streaming UI state machine]

key-files:
  created:
    - packages/client/src/hooks/useSSE.ts
    - packages/client/src/features/execution/ConsoleView.tsx
    - packages/client/src/__tests__/useSSE.test.tsx
    - packages/client/src/__tests__/ConsoleView.test.tsx
  modified:
    - packages/client/src/features/execution/ExecutionPanel.tsx
    - packages/client/src/features/execution/executionApi.ts
    - packages/client/src/__tests__/ExecutionPanel.test.tsx
    - packages/client/package.json
    - eslint.config.js

key-decisions:
  - "Use ansi_up library for ANSI-to-HTML conversion with escape_html=true to prevent XSS"
  - "Store callbacks in useRef to avoid EventSource recreation on callback changes (only recreate on jobId change)"
  - "Use queueMicrotask or direct setState in useEffect for managing external EventSource state (legitimate use case)"
  - "Add ESLint ignore for TypeScript-generated .js files in src (composite: true generates artifacts)"
  - "Mock useSSE at module level in ExecutionPanel tests (simpler than mocking global EventSource)"
  - "Use singleton AnsiUp instance at module level for ConsoleView (performance optimization)"
  - "Render streaming cursor indicator only when isStreaming=true AND lines exist"

patterns-established:
  - "useSSE hook pattern: store callbacks in ref, recreate EventSource only on jobId change, manage connection state"
  - "ConsoleView auto-scroll pattern: useRef for container, useEffect to scroll to bottom on lines change"
  - "Streaming execution state machine: idle -> streaming (with connection state badge) -> complete (with metrics)"
  - "Two-phase execution flow: POST /execute returns jobId -> useSSE connects -> stream output -> onComplete displays results"

# Metrics
duration: 7min 33s
completed: 2026-02-13
---

# Phase 04 Plan 02: Client-side SSE Streaming UI Summary

**Client-side SSE streaming UI: useSSE hook for EventSource lifecycle, ConsoleView with ANSI color rendering, and ExecutionPanel transformation from synchronous to streaming execution flow**

## Performance

- **Duration:** 7min 33s (453 seconds)
- **Started:** 2026-02-13T05:15:52Z
- **Completed:** 2026-02-13T05:23:25Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- useSSE hook manages EventSource lifecycle with connection state tracking and callback ref optimization
- ConsoleView component renders ANSI-colored output with auto-scroll and streaming indicator
- ExecutionPanel transformed from synchronous request-response to streaming flow (submit job → connect SSE → stream output)
- Comprehensive test suite with 33 passing client tests (11 useSSE, 9 ConsoleView, 3 ExecutionPanel, 10 existing)
- All 94 server tests still pass (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: useSSE hook, ConsoleView component with ANSI support, and ExecutionPanel streaming integration** - `ee6dd4b` (feat)
2. **Task 2: Tests for useSSE hook, ConsoleView, and updated ExecutionPanel** - `b1cc6ab` (test)

**Plan metadata:** (to be committed after SUMMARY.md creation)

## Files Created/Modified

**Created:**
- `packages/client/src/hooks/useSSE.ts` - Custom hook for EventSource lifecycle with connection state tracking
- `packages/client/src/features/execution/ConsoleView.tsx` - ANSI-aware streaming console renderer with auto-scroll
- `packages/client/src/__tests__/useSSE.test.tsx` - useSSE hook tests (11 tests: idle state, connection lifecycle, events, cleanup)
- `packages/client/src/__tests__/ConsoleView.test.tsx` - ConsoleView tests (9 tests: rendering, ANSI conversion, streaming indicator)

**Modified:**
- `packages/client/src/features/execution/ExecutionPanel.tsx` - Updated for streaming flow with useSSE hook integration
- `packages/client/src/features/execution/executionApi.ts` - Changed executeTool mutation type from ExecutionResponse to { jobId: string }
- `packages/client/src/__tests__/ExecutionPanel.test.tsx` - Added useSSE mock for streaming flow tests
- `packages/client/package.json` - Added ansi_up and event-source-polyfill dependencies
- `eslint.config.js` - Added ignore for TypeScript-generated .js files in src

## Decisions Made

**1. Use ansi_up library for ANSI-to-HTML conversion**
- Rationale: Mature library with XSS protection via escape_html=true, clean API, small footprint

**2. Store callbacks in useRef to avoid EventSource recreation**
- Rationale: Callbacks change frequently in React. Only recreate EventSource when jobId changes to avoid unnecessary reconnections
- Pattern: `useEffect(() => { callbacksRef.current = callbacks; }, [callbacks])`

**3. Use direct setState in useEffect for external system state**
- Rationale: Legitimate use case for managing EventSource state (external system synchronization)
- Added ESLint disable comment for react-hooks/set-state-in-effect rule

**4. Add ESLint ignore for TypeScript-generated .js files**
- Rationale: TypeScript composite: true generates .js files in src. ESLint should only check source .ts/.tsx files
- Pattern: `ignores: ['packages/*/src/**/*.js']`

**5. Mock useSSE at module level in tests**
- Rationale: Simpler than creating complex EventSource mocks in every test. Module mock isolates streaming logic
- Pattern: `vi.mock('@/hooks/useSSE', () => ({ useSSE: vi.fn(() => ({ connectionState: 'idle' })) }))`

**6. Use singleton AnsiUp instance**
- Rationale: AnsiUp is stateless for our use case. Module-level singleton avoids recreation on every render
- Pattern: `const ansiUp = new AnsiUp();` at module level

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 05 (Backend Tool Integration):
- Client displays real-time streaming output from server
- User sees ANSI-colored console output line-by-line
- Connection state badges show streaming status (connecting/connected/error)
- Execution metrics displayed after completion (status, exit code, duration)
- EventSource properly cleaned up on unmount/completion
- All tests pass (33 client, 94 server)

Next phase can integrate actual tool execution with confidence that streaming UI works correctly.

## Self-Check: PASSED

All claimed files verified:
- FOUND: packages/client/src/hooks/useSSE.ts
- FOUND: packages/client/src/features/execution/ConsoleView.tsx
- FOUND: packages/client/src/__tests__/useSSE.test.tsx
- FOUND: packages/client/src/__tests__/ConsoleView.test.tsx

All claimed commits verified:
- FOUND: ee6dd4b (Task 1)
- FOUND: b1cc6ab (Task 2)

Build status: PASSED (npm run build)
Test status: PASSED (33 client tests, 94 server tests)
Lint status: PASSED (ESLint clean)

---
*Phase: 04-real-time-output-streaming*
*Completed: 2026-02-13*
