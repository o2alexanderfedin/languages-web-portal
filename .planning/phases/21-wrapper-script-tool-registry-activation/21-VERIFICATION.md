---
phase: 21-wrapper-script-tool-registry-activation
verified: 2026-02-20T00:00:00Z
status: gaps_found
score: 8/9 must-haves verified
re_verification: false
gaps:
  - truth: "Wrapper script handles Roslyn Warning-severity exit code 0 via TreatWarningsAsErrors in example .csproj files"
    status: partial
    reason: "CSFV-04 requires TreatWarningsAsErrors=true in example .csproj files. The wrapper correctly passes through exit codes (OVERALL_EXIT loop). However, no example .csproj files exist in the repository — they are Phase 22 deliverables. The requirement artifact (example .csproj with TreatWarningsAsErrors=true) is absent. Phase 21 satisfied the wrapper's exit-code-passthrough portion but not the .csproj artifact portion. REQUIREMENTS.md marks CSFV-04 as [x] Complete at Phase 21, which is premature."
    artifacts:
      - path: "packages/examples/csharp/*.csproj"
        issue: "No example .csproj files exist anywhere in the repository — required for CSFV-04 to be fully satisfied"
    missing:
      - "Example .csproj files with <TreatWarningsAsErrors>true</TreatWarningsAsErrors> (Phase 22 must deliver this)"
      - "REQUIREMENTS.md CSFV-04 status should remain pending until Phase 22 creates the .csproj files"
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
**Verified:** 2026-02-20
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Wrapper script accepts `--input <dir>` and exits 2 with clear message when no .csproj found | VERIFIED | Tested: `bash hupyy-csharp-verify.sh --input /tmpdir-no-csproj` exits 2 with dual-output "Error: No .csproj file found" + "C# verification requires a .csproj project file" |
| 2 | Wrapper script exits 2 with clear message when no .cs files found | VERIFIED | Tested: `bash hupyy-csharp-verify.sh --input /tmpdir-with-csproj-no-cs` exits 2 with dual-output "Error: No .cs files found" + "C# verification requires at least one .cs source file" |
| 3 | Wrapper discovers .cs files scoped per .csproj directory (SDK-style, excluding bin/obj) and invokes `dotnet cs-fv.dll verify <file>` per file, merging stderr | VERIFIED | Script uses PROJ_DIR per .csproj, find with -not -path \*/bin/* -not -path \*/obj/*, invokes `$DOTNET_BIN $CS_FV_DLL verify "$cs_file" 2>&1` |
| 4 | Exit code aggregation: non-zero if any file invocation fails | VERIFIED | `OVERALL_EXIT=0` loop with `|| OVERALL_EXIT=$?` on each dotnet call, `exit $OVERALL_EXIT` at end |
| 5 | Error messages written to both stderr and stdout | VERIFIED | Every pre-flight error uses `echo "$MSG" >&2; echo "$MSG" >&1` pattern (dual output confirmed by live test) |
| 6 | Wrapper installed at `/usr/local/bin/hupyy-csharp-verify` in Docker image with executable permissions | VERIFIED | Dockerfile lines 111-112: `COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify` + `RUN chmod +x /usr/local/bin/hupyy-csharp-verify` |
| 7 | Tool registry marks csharp-verification available=true with maxExecutionTimeMs=180000 | VERIFIED | toolRegistry.ts line 21-26: `id: 'csharp-verification', command: '/usr/local/bin/hupyy-csharp-verify', maxExecutionTimeMs: 180000, available: true` |
| 8 | Tool registry length guard still passes (TOOLS.length === toolExecutionConfigs.length) | VERIFIED | Both tools.ts and toolRegistry.ts have exactly 8 entries; TypeScript type-check exits 0 |
| 9 | TreatWarningsAsErrors=true in example .csproj files ensures exit code 1 on Roslyn Warning severity | PARTIAL | CSFV-04 requires this in example .csproj files. No example .csproj files exist yet (Phase 22 deliverable). Wrapper exit-code passthrough is correct, but the .csproj artifact is absent. |

**Score:** 8/9 truths verified (1 partial — CSFV-04 .csproj artifact missing)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/hupyy-csharp-verify.sh` | Bash wrapper, min 40 lines | VERIFIED | 73 lines, executable (rwxr-xr-x), passes shellcheck (exit 0) |
| `Dockerfile` | COPY + chmod for hupyy-csharp-verify | VERIFIED | Lines 111-112 present, after Java wrapper block (lines 107-108), count=2 |
| `packages/shared/src/constants/tools.ts` | status: 'available' for csharp-verification | VERIFIED | Line 26: `status: 'available'` confirmed (was 'in-development') |
| `packages/server/src/config/toolRegistry.ts` | available: true, maxExecutionTimeMs: 180000 | VERIFIED | Lines 24-25: `maxExecutionTimeMs: 180000, available: true` confirmed |
| example .csproj files with TreatWarningsAsErrors | Required by CSFV-04 | MISSING | No example .csproj files exist in the repository — Phase 22 deliverable |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/hupyy-csharp-verify.sh` | `/usr/local/lib/cs-fv/cs-fv.dll` | `dotnet $CS_FV_DLL verify $cs_file 2>&1` | VERIFIED | Line 70: `"$DOTNET_BIN" "$CS_FV_DLL" verify "$cs_file" 2>&1 \|\| OVERALL_EXIT=$?`; CS_FV_DLL defaults to `/usr/local/lib/cs-fv/cs-fv.dll` |
| `Dockerfile` | `scripts/hupyy-csharp-verify.sh` | `COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify` | VERIFIED | Line 111 confirmed; C# block at line 111 is after Java block at line 107 |
| `packages/shared/src/constants/tools.ts` | portal UI tool grid | `status: 'available'` drives Available badge | VERIFIED | csharp-verification entry has `status: 'available'` at line 26 |
| `packages/server/src/config/toolRegistry.ts` | `packages/server/src/services/executionService.ts` | `config.available` check — throws UserError if false | VERIFIED | executionService.ts line 41: `if (!config.available) throw new UserError('Tool is not available', 400)` — with available: true in registry, this gate passes |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CSFV-01 | 21-01-PLAN.md | `hupyy-csharp-verify` wrapper accepts `--input <dir>`, enumerates `.cs` files, runs cs-fv, streams output to portal SSE | VERIFIED (with note) | Script exists, executable, passes shellcheck, all pre-flight checks work. REQUIREMENTS.md text says "exec dotnet" but implementation uses OVERALL_EXIT loop — correctly documented in PLAN and RESEARCH as intentional (exec not possible in a loop) |
| CSFV-02 | 21-02-PLAN.md | C# FV tool status updated to `available` in tool registry and UI tool grid | VERIFIED | tools.ts status: 'available'; toolRegistry.ts available: true |
| CSFV-03 | 21-02-PLAN.md | C# FV tool timeout set to 180,000ms | VERIFIED | toolRegistry.ts maxExecutionTimeMs: 180000 |
| CSFV-04 | 21-02-PLAN.md | Wrapper handles Roslyn Warning exit code 0 via TreatWarningsAsErrors=true in example .csproj files | PARTIAL | Wrapper exit-code passthrough is correct. The .csproj artifact (example files with TreatWarningsAsErrors=true) does not exist — Phase 22 responsibility. REQUIREMENTS.md marks this [x] Complete prematurely. |

**Orphaned requirements:** None — all four CSFV IDs appear in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

The wrapper script has no TODOs, placeholders, or empty implementations. shellcheck passes with exit 0. All implementations are substantive.

### Human Verification Required

#### 1. Portal UI Tool Grid Badge

**Test:** Load the portal in a browser, navigate to the tool selection page
**Expected:** The C# Verification card shows an "Available" badge (not "In Development")
**Why human:** Visual badge rendering depends on React reading the `status` field from `tools.ts` — cannot verify the rendered UI programmatically

#### 2. End-to-End C# Verification Execution in Docker

**Test:** Submit a C# verification job via the portal UI inside a running Docker container
**Expected:** The wrapper is invoked, discovers .cs files, calls `dotnet cs-fv.dll verify`, and streams output back via SSE
**Why human:** Requires a running Docker container with dotnet 8.0 runtime and cs-fv.dll installed at `/usr/local/lib/cs-fv/cs-fv.dll` — cannot execute in the current environment

### Gaps Summary

**One partial gap found:** CSFV-04 is declared complete in REQUIREMENTS.md at Phase 21, but the requirement artifact — example `.csproj` files containing `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` — does not exist. The wrapper correctly passes cs-fv exit codes through unchanged, satisfying the wrapper's contribution to CSFV-04. The `.csproj` files themselves are explicitly deferred to Phase 22 per the research and plan. Phase 22 must create example `.csproj` files with this property to fully close CSFV-04, and REQUIREMENTS.md should not mark CSFV-04 as complete until Phase 22 delivers those files.

This gap does not block the core phase goal — the wrapper is invocable through the portal, the tool registry is correctly activated with 180s timeout, and the Dockerfile wires the script into the production image. The gap is a tracking issue in REQUIREMENTS.md that Phase 22 will resolve when it creates the example projects.

---

_Verified: 2026-02-20_
_Verifier: Claude (gsd-verifier)_
