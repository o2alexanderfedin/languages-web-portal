---
phase: 24-local-dev-setup-and-csharp-fv-configuration
plan: 01
subsystem: toolRegistry / server config
tags: [config, env-vars, csharp-fv, local-dev]
dependency_graph:
  requires: []
  provides: [env-driven csharp-verification command, local .env with all C# FV paths]
  affects: [packages/server/src/config/toolRegistry.ts, packages/server/.env]
tech_stack:
  added: []
  patterns: [env-var with nullish coalescing fallback (process.env.X ?? default)]
key_files:
  created: []
  modified:
    - packages/server/src/config/toolRegistry.ts
    - packages/server/.env (gitignored, updated on disk only)
decisions:
  - "CSHARP_FV_CMD env var with nullish coalescing fallback matches existing java-verification JAVA_FV_CMD pattern"
  - "packages/server/.env is gitignored — updated on disk only, not committed (correct for machine-local secrets)"
metrics:
  duration: "57 seconds"
  completed: "2026-02-21"
  tasks_completed: 2
  files_modified: 2
---

# Phase 24 Plan 01: Local Dev Setup and C# FV Configuration Summary

**One-liner:** Env-driven csharp-verification command via `CSHARP_FV_CMD ?? '/usr/local/bin/hupyy-csharp-verify'` with local `.env` pointing to jdk-21, local wrapper script, published DLL, and cvc5 binary.

## What Was Built

Updated `packages/server/src/config/toolRegistry.ts` to read `CSHARP_FV_CMD` from the environment (with fallback to the Docker path), mirroring the existing `JAVA_FV_CMD` pattern. Updated `packages/server/.env` (machine-local, gitignored) to set all four C# FV variables so developers can run C# FV locally without Docker.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Make csharp-verification command env-configurable in toolRegistry | 21d3d15 | packages/server/src/config/toolRegistry.ts |
| 2 | Update packages/server/.env with correct local tool paths | (gitignored — on disk only) | packages/server/.env |

## Verification Results

- `grep CSHARP_FV_CMD packages/server/src/config/toolRegistry.ts` — shows `process.env.CSHARP_FV_CMD ?? '/usr/local/bin/hupyy-csharp-verify'`
- `grep jdk-21 packages/server/.env` — shows corrected `JAVA_HOME`
- `npx tsc --noEmit -p packages/server/tsconfig.json` — passes with no errors
- All referenced paths verified to exist on disk: jdk-21 OK, DLL OK, cvc5 OK, wrapper script OK

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

**Task 2 commit:** `packages/server/.env` is gitignored (correct — contains machine-local paths). The plan specifies updating the file on disk, which was done. No commit for `.env` is possible or appropriate. This is expected behavior, not a deviation.

**Pre-existing typecheck issue:** The root-level `npm run typecheck` produces a pre-existing `TS6310` error about the shared package tsconfig. This existed before this plan and is unrelated to changes made. The server package's own `tsc --noEmit` runs cleanly.

## Success Criteria Met

- [x] CSHARP_FV_CMD env var controls which command toolRegistry uses for csharp-verification; unset = fallback to /usr/local/bin/hupyy-csharp-verify
- [x] packages/server/.env has all four vars: CSHARP_FV_CMD, CS_FV_DLL, JAVA_HOME (jdk-21), CVC5_PATH
- [x] TypeScript compilation (server package) succeeds

## Self-Check: PASSED

- FOUND: packages/server/src/config/toolRegistry.ts
- FOUND: packages/server/.env (on disk, gitignored)
- FOUND: 24-01-SUMMARY.md
- FOUND: commit 21d3d15
