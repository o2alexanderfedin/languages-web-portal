# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** v1.3 C# Formal Verification — Phase 21: C# FV API Endpoint

## Current Position

Phase: 21 of 23 (Wrapper Script + Tool Registry Activation)
Plan: 2 of 2 in current phase (phase complete)
Status: Complete
Last activity: 2026-02-21 — Phase 21 Plan 02 complete (csharp-verification activated: status available, 180s timeout)

Progress: [████████████████░░░░] 87% (20/23 phases complete across all milestones)

## Performance Metrics

**Velocity:**
- Total plans completed: 26
- Average duration: ~35 min per plan
- Total execution time: ~14.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Project Setup | 3 | ~3h | ~60min |
| 2. Upload | 2 | ~1.5h | ~45min |
| 3. Execution | 3 | ~2h | ~40min |
| 4. Streaming | 2 | ~1h | ~30min |
| 5. Output | 3 | ~2h | ~40min |
| 6. Landing | 2 | ~1.5h | ~45min |
| 7. E2E v1.0 | 2 | ~1h | ~30min |
| 8. Docker | 2 | ~1.5h | ~45min |
| 9. Tool Activation | 3 | ~2h | ~40min |
| 10. E2E v1.1 | 2 | ~1h | ~30min |
| 11-19. E2E v1.2 | 17 | ~1.5h total | ~5min |

**Recent Trend:**
- Last 5 plans: 1-14min range
- Trend: Stable (fast execution)

*Updated after v1.3 roadmap creation*
| Phase 21-wrapper-script-tool-registry-activation P03 | 1 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 8: Docker 3-stage build with JDK 25 — v1.3 extends to 4-stage (adds dotnet-builder)
- Phase 19-01: Docker guard pattern, E2E_BASE_URL required — applies to C# FV E2E tests
- Phase 19-02: Archive pattern (git mv to e2e/archive/) for legacy spec retirement
- v1.3 research: .NET SDK 10 (Noble) for builder stage, dotnet-runtime-8.0 for production (cs-fv targets net8.0)
- v1.3 research: NUGET_PACKAGES must be set per-job in wrapper (NuGet/Home #8129 concurrency bug)
- v1.3 research: TreatWarningsAsErrors=true required in .csproj — Roslyn defaults Warning severity (exit 0)
- v1.3 research: maxExecutionTimeMs: 180000 — MSBuild cold-start + CVC5 solving needs extra margin
- Phase 20-01: solver-builder uses ubuntu:noble WITHOUT --platform (TARGETARCH selects URL only); dotnet-builder uses --platform=$BUILDPLATFORM (prevents QEMU on Apple Silicon)
- Phase 20-01: CVC5 1.3.2 (static, native arm64+x86_64) and Z3 4.16.0 (dynamic, glibc-2.38/2.39) pinned; both from GitHub releases
- Phase 20-01: -p:MinVerSkip=true required in Docker dotnet publish (no .git history in build context)
- Phase 20-02: Ubuntu Noble built-in apt feed for dotnet-runtime-8.0 (no Microsoft feed — supports amd64+arm64); image size 1546MB accepted (800MB estimate was unrealistic given dotnet-runtime + NuGet cache)
- Phase 20-02: java-builder uses pre-built jar (java-fv Maven source has FormulaAdapter.adaptForIncremental() undefined — cannot compile from scratch)
- Phase 20-02: dotnet --version is SDK-only command; runtime verification uses dotnet --list-runtimes (shows 8.0.24)
- Phase 21-02: csharp-verification maxExecutionTimeMs set to 180000 (3 min) — MSBuild cold-start + NuGet restore + CVC5 solving requires extra margin over default 60s
- [Phase 21-wrapper-script-tool-registry-activation]: Dual-output error messages (stderr+stdout) for portal SSE capture; exit 2 for wrapper validation; OVERALL_EXIT aggregation loop; 2>&1 merge for cs-fv output; file discovery scoped per .csproj via PROJ_DIR
- [Phase 21-03]: CSFV-04 split delivery: Phase 21 wrapper exit-code passthrough complete; Phase 22 must deliver example .csproj with TreatWarningsAsErrors=true
- [Phase 21-03]: Accurate requirement tracking: premature [x] marking causes downstream phases to miss deliverables — REQUIREMENTS.md must reflect actual split

### Pending Todos

None yet.

### Blockers/Concerns

**Active:**
- Phase 22 (Examples): Hupyy C# FV NuGet package name, contract attribute namespace (`using CsFv.Contracts;`?), and diagnostic ID format are not publicly documented — must be confirmed from cs-fv source before writing examples
- CVC5/Yices/Bitwuzla not available on linux-aarch64 in Docker — Z3 only (acceptable for current tools)

## Session Continuity

Last session: 2026-02-21
Stopped at: Phase 21 Plan 02 complete — csharp-verification activated in tool registry and shared constants
Resume file: None
Next step: /gsd:execute-phase 22 — C# FV examples (blocker: confirm NuGet package name and contract attribute namespace from cs-fv source)

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-20 — v1.3 roadmap created, position set to Phase 20*
