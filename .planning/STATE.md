# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** v1.4 Local Development Experience — Phase 24

## Current Position

Milestone v1.4 Local Development Experience — IN PROGRESS
Phase: 24 (Local Dev Setup & C# FV Configuration) — Plan 02 complete
Status: Plan 24-02 executed — root npm run dev starts server and client concurrently via concurrently ^9.2.1
Last activity: 2026-02-21 — Phase 24 Plan 02 completed (concurrently dev script, labeled [server]/[client] output)

Progress: [--------------------] 0% (v1.4 phases pending)

## Performance Metrics

**Velocity:**
- Total plans completed: 34 (through v1.3)
- Average duration: ~35 min per plan
- Total execution time: ~20 hours

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
| 20-23. C# FV v1.3 | 10 | ~5h | ~30min |
| Phase 24 P01 | 57s | 2 tasks | 2 files |
| Phase 24 P02 | 2min | 1 tasks | 1 files |

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.
- [Phase 24]: CSHARP_FV_CMD env var with nullish coalescing fallback mirrors java-verification pattern
- [Phase 24]: Use concurrently with --kill-others-on-fail to prevent zombie processes when one service crashes

### Pending Todos

- [ ] Plan and execute Phase 24: Local Dev Setup & C# FV Configuration
- [ ] Plan and execute Phase 25: Developer README

### Blockers/Concerns

**Active:**
- CVC5/Yices/Bitwuzla not available on linux-aarch64 in Docker — Z3 only (acceptable for current tools)
- java-builder uses pre-built jar (FormulaAdapter.adaptForIncremental() undefined in source) — maintenance risk if java-fv source diverges
- Docker image 1546 MB vs 800 MB target (NuGet/Roslyn cache primary driver) — acceptable for demo portal

**v1.4 specific:**
- Local `.env` must set `CSHARP_FV_CMD`, `CS_FV_DLL`, `JAVA_HOME`, `CVC5_PATH` to machine-specific paths — verify current `.env` state before Phase 24 planning

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 24-02-PLAN.md
Resume file: None
Next step: Execute Phase 24 Plan 03 (if exists) or Phase 25

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-21 — Phase 24 Plan 02 complete (concurrently root dev script, one-command local stack startup)*
