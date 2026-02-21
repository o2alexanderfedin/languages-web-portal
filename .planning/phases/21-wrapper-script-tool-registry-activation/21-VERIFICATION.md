---
phase: 21-wrapper-script-tool-registry-activation
verified: 2026-02-20T20:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 8/9
  gaps_closed:
    - "REQUIREMENTS.md CSFV-04 tracking corrected — now shows [ ] pending at Phase 22, not [x] complete at Phase 21"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Portal UI tool grid shows C# Verification as Available"
    expected: "The csharp-verification card displays an Available badge (not In Development)"
    why_human: "UI badge rendering depends on React component reading status field — cannot verify visual display programmatically"
  - test: "ExecutionService routes csharp-verification requests to /usr/local/bin/hupyy-csharp-verify in Docker"
    expected: "Submitting a C# verification job triggers the wrapper script and streams output back via SSE"
    why_human: "Requires running Docker container with dotnet runtime and cs-fv.dll — cannot execute in this environment"
---

# Phase 21: Wrapper Script + Tool Registry Activation Verification Report

**Phase Goal:** The C# FV tool is invocable through the portal — the `hupyy-csharp-verify` wrapper script adapts the portal's `--input <dir>` interface to `dotnet cs-fv.dll verify <files...>`, and the tool registry marks the tool as available with the correct 180s timeout
**Verified:** 2026-02-20T20:00:00Z
**Status:** passed
**Re-verification:** Yes — gap closure after initial verification (8/9 score)

## Re-Verification Summary

The initial verification (2026-02-20) found one partial gap: CSFV-04 was prematurely marked `[x] Complete` in REQUIREMENTS.md even though the required artifact (example `.csproj` files with `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`) had not been created yet. Plan 21-03 was executed to fix REQUIREMENTS.md tracking. This re-verification confirms:

- Gap closed: CSFV-04 now reads `[ ]` (pending) with an explanatory note in the checklist
- Gap closed: Traceability table now shows `| CSFV-04 | Phase 22 | Pending |`
- No regressions on the 8 previously-passing truths

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Wrapper script accepts `--input <dir>` and exits 2 with clear message when no .csproj found | VERIFIED | Lines 30-37: finds .csproj count, dual-output `Error: No .csproj file found` + `C# verification requires a .csproj project file`, exits 2 |
| 2 | Wrapper script exits 2 with clear message when no .cs files found | VERIFIED | Lines 58-64: checks `CS_FILES[@]` length, dual-output `Error: No .cs files found` + `C# verification requires at least one .cs source file`, exits 2 |
| 3 | Wrapper discovers .cs files scoped per .csproj directory (SDK-style, excluding bin/obj) and invokes `dotnet cs-fv.dll verify <file>` per file, merging stderr | VERIFIED | Lines 44-55: PROJ_DIR scoped discovery with `-not -path */bin/* -not -path */obj/*`; line 70: `"$DOTNET_BIN" "$CS_FV_DLL" verify "$cs_file" 2>&1` |
| 4 | Exit code aggregation: non-zero if any file invocation fails | VERIFIED | Lines 68-71: `OVERALL_EXIT=0` loop with `\|\| OVERALL_EXIT=$?` on each dotnet call; line 73: `exit $OVERALL_EXIT` |
| 5 | Error messages written to both stderr and stdout | VERIFIED | Every pre-flight error uses `echo "$MSG" >&2; echo "$MSG" >&1` dual-output pattern confirmed throughout script |
| 6 | Wrapper installed at `/usr/local/bin/hupyy-csharp-verify` in Docker image with executable permissions | VERIFIED | Dockerfile lines 111-112: `COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify` + `RUN chmod +x /usr/local/bin/hupyy-csharp-verify`; script permissions `-rwxr-xr-x` confirmed |
| 7 | Tool registry marks csharp-verification available=true with maxExecutionTimeMs=180000 | VERIFIED | toolRegistry.ts: `id: 'csharp-verification'`, `maxExecutionTimeMs: 180000`, `available: true` confirmed |
| 8 | Tool registry length guard still passes (TOOLS.length === toolExecutionConfigs.length) | VERIFIED | Both tools.ts and toolRegistry.ts have exactly 8 `id:` entries; runtime guard at toolRegistry.ts line 84 will not throw |
| 9 | REQUIREMENTS.md CSFV-04 tracking is accurate — pending at Phase 22, not prematurely complete | VERIFIED | REQUIREMENTS.md line 22: `- [ ] **CSFV-04**: ..._(Phase 21 delivered wrapper exit-code passthrough; Phase 22 must deliver example .csproj files...)_`; traceability table line 80: `| CSFV-04 | Phase 22 | Pending |` |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/hupyy-csharp-verify.sh` | Bash wrapper, min 40 lines, executable | VERIFIED | 73 lines, `-rwxr-xr-x` permissions, all key patterns present (pipefail, DOTNET_CMD, DLL path, PROJ_DIR scoping, OVERALL_EXIT loop, dual-output, 2>&1 merge) |
| `Dockerfile` | COPY + chmod for hupyy-csharp-verify | VERIFIED | Lines 111-112 present after Java wrapper block (lines 107-108); `grep -c hupyy-csharp-verify Dockerfile` = 2 |
| `packages/shared/src/constants/tools.ts` | status: 'available' for csharp-verification | VERIFIED | `status: 'available'` at line 26; 8 tool entries match registry count |
| `packages/server/src/config/toolRegistry.ts` | available: true, maxExecutionTimeMs: 180000 | VERIFIED | `maxExecutionTimeMs: 180000`, `available: true` confirmed; runtime length guard at line 84 |
| `.planning/REQUIREMENTS.md` | CSFV-04 pending at Phase 22 with note | VERIFIED | `[ ]` checklist entry with split-delivery note; traceability row `CSFV-04 | Phase 22 | Pending` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/hupyy-csharp-verify.sh` | `/usr/local/lib/cs-fv/cs-fv.dll` | `dotnet $CS_FV_DLL verify $cs_file 2>&1` | VERIFIED | Line 70: `"$DOTNET_BIN" "$CS_FV_DLL" verify "$cs_file" 2>&1 \|\| OVERALL_EXIT=$?`; CS_FV_DLL defaults to `/usr/local/lib/cs-fv/cs-fv.dll` (line 9) |
| `Dockerfile` | `scripts/hupyy-csharp-verify.sh` | `COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify` | VERIFIED | Line 111 confirmed; C# block at lines 111-112 after Java block at lines 107-108 |
| `packages/shared/src/constants/tools.ts` | portal UI tool grid | `status: 'available'` drives Available badge | VERIFIED | csharp-verification entry has `status: 'available'`; executionService reads tool status via toolRegistry, not tools.ts, but UI reads tools.ts directly |
| `packages/server/src/config/toolRegistry.ts` | `packages/server/src/services/executionService.ts` | `config.available` check — throws UserError if false | VERIFIED | executionService.ts line 41: `if (!config.available) throw new UserError(...)` — with `available: true` in registry, this gate passes |
| `.planning/REQUIREMENTS.md` | Phase 22 planning context | CSFV-04 pending status signals Phase 22 must include TreatWarningsAsErrors=true | VERIFIED | Pattern `CSFV-04.*Phase 22.*Pending` matches traceability table row; `[ ]` checklist entry with explanatory note |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CSFV-01 | 21-01-PLAN.md | `hupyy-csharp-verify` wrapper accepts `--input <dir>`, enumerates `.cs` files, runs cs-fv, streams output to portal SSE | VERIFIED | Script exists, executable, 73 lines, all pre-flight checks and execution loop implemented; REQUIREMENTS.md `[x] Complete` |
| CSFV-02 | 21-02-PLAN.md | C# FV tool status updated to `available` in tool registry and UI tool grid | VERIFIED | tools.ts `status: 'available'`; toolRegistry.ts `available: true`; REQUIREMENTS.md `[x] Complete` |
| CSFV-03 | 21-02-PLAN.md | C# FV tool timeout set to 180,000ms | VERIFIED | toolRegistry.ts `maxExecutionTimeMs: 180000`; REQUIREMENTS.md `[x] Complete` |
| CSFV-04 | 21-02-PLAN.md, 21-03-PLAN.md | Wrapper handles Roslyn Warning exit code 0 via TreatWarningsAsErrors=true in example .csproj files | PARTIAL (Phase 21 portion VERIFIED; Phase 22 portion PENDING) | Wrapper exit-code passthrough correct (OVERALL_EXIT loop). The .csproj artifact is explicitly deferred to Phase 22. REQUIREMENTS.md correctly shows `[ ]` pending at Phase 22 — tracking is accurate. Phase 21's contribution to CSFV-04 (wrapper passthrough) is complete. |

**Orphaned requirements:** None — all four CSFV IDs (CSFV-01 through CSFV-04) appear in plan frontmatter across 21-01, 21-02, and 21-03.

**Note on CSFV-04:** CSFV-04 spans two phases by design. Phase 21 delivers the wrapper's exit-code passthrough. Phase 22 must deliver the example `.csproj` files with `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. Phase 21's deliverable for CSFV-04 is verified complete. Phase 22 remains responsible for the artifact portion.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

The wrapper script has no TODOs, placeholders, empty implementations, or console.log stubs. All three source files (wrapper script, tools.ts, toolRegistry.ts) are substantive implementations.

### Human Verification Required

#### 1. Portal UI Tool Grid Badge

**Test:** Load the portal in a browser and navigate to the tool selection page.
**Expected:** The C# Verification card shows an "Available" badge (not "In Development").
**Why human:** Visual badge rendering depends on React reading the `status` field from `tools.ts` and rendering the appropriate CSS class — the programmatic check confirms the data source is correct but cannot verify the visual output.

#### 2. End-to-End C# Verification Execution in Docker

**Test:** Submit a C# verification job via the portal UI inside a running Docker container with a valid `.cs` file.
**Expected:** The wrapper is invoked at `/usr/local/bin/hupyy-csharp-verify`, discovers `.cs` files, calls `dotnet cs-fv.dll verify <file>`, and streams output back via SSE within the 180s timeout.
**Why human:** Requires a running Docker container with dotnet 8.0 runtime and cs-fv.dll installed at `/usr/local/lib/cs-fv/cs-fv.dll` — cannot execute in the current environment.

### Gaps Summary

No blocking gaps. The single partial gap from the initial verification has been closed by plan 21-03:

- Initial gap: REQUIREMENTS.md prematurely marked CSFV-04 as `[x] Complete` at Phase 21 when the required `.csproj` artifact did not exist.
- Gap closure (21-03): REQUIREMENTS.md updated to `[ ]` pending with a split-delivery note, and the traceability table updated to `CSFV-04 | Phase 22 | Pending`.

The core phase goal is fully achieved: the `hupyy-csharp-verify` wrapper is invocable through the portal (wired via Dockerfile), the tool registry is activated with `available: true` and `maxExecutionTimeMs: 180000`, and requirement tracking accurately reflects what Phase 22 must still deliver.

---

_Verified: 2026-02-20T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: initial score 8/9, gap-closure score 9/9_
