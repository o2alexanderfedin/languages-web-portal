---
status: resolved
trigger: "Investigate and fix memory leaks in the Hupyy Languages Web Portal"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: Two confirmed leaks — (1) outputLines unbounded in ExecutionPanel, (2) file descriptor leak in outputService large-file path
test: Read all server and client source files
expecting: Apply targeted fixes to both
next_action: Apply fixes

## Symptoms

expected: Memory usage stays stable over time during normal use
actual: Memory leaks somewhere in the application — exact location unknown
errors: None reported explicitly
reproduction: Navigate to demo page, load examples, run verifications, navigate back and forth
started: Unknown — could be architectural

## Eliminated

- hypothesis: executionService holds subprocess references after completion
  evidence: Uses for-await loop + await subprocess — fully awaited and GC'd. cleanup:true prevents zombies. Output capped by EXECUTION_LIMITS.maxOutputLines.
  timestamp: 2026-02-23

- hypothesis: queueService jobDurations grows unbounded
  evidence: Trimmed to QUEUE_CONFIG.maxDurationHistory via shift(). Bounded.
  timestamp: 2026-02-23

- hypothesis: cleanupService timers leak
  evidence: timers Map properly cleared on cancel and shutdown. SIGTERM/SIGINT handlers registered once (non-test).
  timestamp: 2026-02-23

- hypothesis: useSSE hook leaks EventSource connections
  evidence: Cleanup function closes EventSource on unmount or jobId change. complete/error events also call close(). Properly cleaned up.
  timestamp: 2026-02-23

- hypothesis: streamService SSE sessions leak (main path)
  evidence: sendComplete and sendError both delete from sessions Map. req 'close' event calls unregisterSession. Clean.
  timestamp: 2026-02-23

- hypothesis: projectService leaks project directories
  evidence: cleanupService schedules TTL-based deletion. projectService.cleanupProjectDir exists. No leak.
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: ExecutionPanel.tsx outputLines state
  found: setOutputLines((prev) => [...prev, line]) — array grows unbounded per execution run. No cap. Long-running tools with verbose output can produce thousands of lines held in React state indefinitely.
  implication: PRIMARY LEAK — outputLines can grow very large without bound.

- timestamp: 2026-02-23
  checked: outputService.ts readFileContent large-file path (lines 144-151)
  found: Opens fd, calls fd.read(), then fd.close(). If fd.read() throws, fd.close() is never called — file descriptor leaks.
  implication: SECONDARY LEAK — file descriptor leak on read error for large files.

## Resolution

root_cause: |
  1. PRIMARY: outputLines array in ExecutionPanel grows unbounded. Each SSE output line appends to React state with no cap. For verbose tools this can be thousands of strings.
  2. SECONDARY: File descriptor leak in outputService.readFileContent — if fd.read() throws for large files, fd.close() is never called.

fix: |
  1. Cap outputLines at MAX_OUTPUT_LINES (2000) in ExecutionPanel, trimming oldest lines when exceeded.
  2. Wrap fd.read() + fd.close() in try/finally in outputService.ts.

verification: TypeScript typecheck passes on both client and server with zero errors. Logic review confirms fixes are correct and targeted.
files_changed:
  - packages/client/src/features/execution/ExecutionPanel.tsx
  - packages/server/src/services/outputService.ts
