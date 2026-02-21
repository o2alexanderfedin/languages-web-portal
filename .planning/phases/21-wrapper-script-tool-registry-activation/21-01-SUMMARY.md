---
phase: 21-wrapper-script-tool-registry-activation
plan: 01
subsystem: csharp-fv-wrapper
tags: [bash, wrapper, csharp, cs-fv, docker, tool-registry]
dependency_graph:
  requires:
    - "20-02: production stage with dotnet-runtime-8.0 and cs-fv.dll"
  provides:
    - "hupyy-csharp-verify wrapper script at /usr/local/bin/hupyy-csharp-verify"
    - "Dockerfile production stage wired for C# FV execution"
  affects:
    - "Dockerfile (production stage)"
    - "scripts/hupyy-csharp-verify.sh"
tech_stack:
  added: []
  patterns:
    - "Bash wrapper bridging portal --input interface to per-file tool CLI"
    - "SDK-style .csproj-scoped file discovery (find per project dir, exclude bin/obj)"
    - "OVERALL_EXIT aggregation loop (cannot use exec in a loop)"
    - "Dual-output error messages (stderr AND stdout) for portal SSE streaming"
key_files:
  created:
    - scripts/hupyy-csharp-verify.sh
  modified:
    - Dockerfile
decisions:
  - "Error messages written to both stderr AND stdout — CONTEXT.md locked decision for portal SSE capture"
  - "Exit code 2 for wrapper validation failures (no .csproj, no .cs files, bad args)"
  - "File discovery scoped per .csproj directory using PROJ_DIR — honors SDK-style implicit glob behavior"
  - "2>&1 on dotnet invocation merges cs-fv stderr into stdout stream"
  - "OVERALL_EXIT aggregation instead of exec — required because dotnet is called in a loop"
  - "C# wrapper block placed directly after Java wrapper block in Dockerfile (matching pattern)"
metrics:
  duration: "64 seconds"
  completed: "2026-02-21"
  tasks_completed: 2
  files_changed: 2
---

# Phase 21 Plan 01: Wrapper Script + Dockerfile Wiring Summary

**One-liner:** Bash wrapper script bridging portal --input interface to cs-fv per-file verify calls, with SDK-style .csproj-scoped discovery and OVERALL_EXIT aggregation.

## What Was Built

Created `scripts/hupyy-csharp-verify.sh` — a Bash wrapper script that adapts the portal's `hupyy-csharp-verify --input <dir>` interface to cs-fv's per-file `dotnet cs-fv.dll verify <file>` API. Wired the script into the Dockerfile production stage directly after the Java wrapper installation block.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write hupyy-csharp-verify.sh wrapper script | 402cec9 | scripts/hupyy-csharp-verify.sh |
| 2 | Add wrapper to Dockerfile production stage | 412e8b7 | Dockerfile |

## Key Implementation Details

### Wrapper Script (`scripts/hupyy-csharp-verify.sh`)

- `set -euo pipefail` for fail-fast behavior
- `DOTNET_CMD` env override for testing without system dotnet
- `CS_FV_DLL` env override for testing with custom DLL path
- **Argument parsing**: exit 2 with dual-output message if not exactly `--input <path>`
- **Project path validation**: exit 2 if directory doesn't exist
- **Pre-flight .csproj check**: exit 2 with two error lines if no .csproj found (excludes bin/obj)
- **SDK-style file discovery**: locate each .csproj, collect .cs files from PROJ_DIR (excludes bin/obj)
- **Pre-flight .cs check**: exit 2 with two error lines if no .cs files found
- **Verification loop**: invoke `dotnet cs-fv.dll verify <file> 2>&1` per file, track `OVERALL_EXIT`
- Passes `shellcheck` with zero warnings or errors

### Dockerfile Production Stage

```dockerfile
# Install C# FV wrapper script
COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify
RUN chmod +x /usr/local/bin/hupyy-csharp-verify
```

Inserted directly after the Java wrapper block (line 109), before the Java FV CLI jar copy.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `scripts/hupyy-csharp-verify.sh` — EXISTS (402cec9)
- `Dockerfile` hupyy-csharp-verify lines — PRESENT (2 occurrences, 412e8b7)
- All verification pattern checks — PASSED
- shellcheck — PASSED (no warnings, no errors)
- Usage dry-run — PASSED (dual-output confirmed)
- Non-existent path dry-run — PASSED (dual-output confirmed)
