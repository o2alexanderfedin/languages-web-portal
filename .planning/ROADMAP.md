# Roadmap: Hupyy Languages Web Portal

## Milestones

- **v1.0 MVP** — Phases 1-7 (shipped 2026-02-14) — [Details](milestones/v1.0-ROADMAP.md)
- **v1.1 Java FV Integration** — Phases 8-10 (shipped 2026-02-16) — [Details](milestones/v1.1-ROADMAP.md)
- **v1.2 Comprehensive E2E Testing** — Phases 11-19 (shipped 2026-02-20) — [Details](milestones/v1.2-ROADMAP.md)
- **v1.3 C# Formal Verification** — Phases 20-23 (shipped 2026-02-21) — [Details](milestones/v1.3-ROADMAP.md)
- **v1.4 Local Development Experience** — Phases 24-25 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-7) — SHIPPED 2026-02-14</summary>

- [x] Phase 1: Project Setup & Foundation (3/3 plans) — completed 2026-02-12
- [x] Phase 2: File Upload & Validation (2/2 plans) — completed 2026-02-13
- [x] Phase 3: Process Execution & Sandboxing (3/3 plans) — completed 2026-02-13
- [x] Phase 4: Real-Time Output Streaming (2/2 plans) — completed 2026-02-12
- [x] Phase 5: Output Preview & Download (3/3 plans) — completed 2026-02-13
- [x] Phase 6: Landing Page & Examples (2/2 plans) — completed 2026-02-13
- [x] Phase 7: E2E Testing with Playwright (2/2 plans) — completed 2026-02-14

</details>

<details>
<summary>v1.1 Java FV Integration (Phases 8-10) — SHIPPED 2026-02-16</summary>

- [x] Phase 8: Docker Infrastructure & Wrapper (2/2 plans) — completed 2026-02-16
- [x] Phase 9: Tool Activation & Examples (3/3 plans) — completed 2026-02-16
- [x] Phase 10: E2E Testing (2/2 plans) — completed 2026-02-16

</details>

<details>
<summary>v1.2 Comprehensive E2E Testing (Phases 11-19) — SHIPPED 2026-02-20</summary>

- [x] **Phase 11: Test Infrastructure & Configuration** (2/2 plans) — completed 2026-02-16
- [x] **Phase 12: Landing Page E2E Tests** (2/2 plans) — completed 2026-02-17
- [x] **Phase 13: Upload Flow E2E Tests** (2/2 plans) — completed 2026-02-17
- [x] **Phase 14: Execution Flow E2E Tests** (2/2 plans) — completed 2026-02-17
- [x] **Phase 15: Output Flow E2E Tests** (2/2 plans) — completed 2026-02-17
- [x] **Phase 16: Examples & Shareable Links E2E Tests** (2/2 plans) — completed 2026-02-17
- [x] **Phase 17: Edge Cases & Polish** (2/2 plans) — completed 2026-02-18
- [x] **Phase 18: Documentation Drift Fix** (1/1 plans) — completed 2026-02-19
- [x] **Phase 19: Test Infrastructure Cleanup** (2/2 plans) — completed 2026-02-20

</details>

<details>
<summary>✅ v1.3 C# Formal Verification (Phases 20-23) — SHIPPED 2026-02-21</summary>

- [x] Phase 20: Docker Image — .NET Runtime + Solver Binaries (2/2 plans) — completed 2026-02-21
- [x] Phase 21: Wrapper Script + Tool Registry Activation (3/3 plans) — completed 2026-02-21
- [x] Phase 22: C# Example Projects (3/3 plans) — completed 2026-02-21
- [x] Phase 23: E2E Tests (2/2 plans) — completed 2026-02-21

</details>

### v1.4 Local Development Experience

- [x] **Phase 24: Local Dev Setup & C# FV Configuration** — Wire root dev script, env-based tool config, and verify C# FV works end-to-end locally — completed 2026-02-21
- [ ] **Phase 25: Developer README** — Document prerequisites and local setup so any developer can onboard without prior context

## Phase Details

### Phase 24: Local Dev Setup & C# FV Configuration

**Goal**: A developer can clone the repo, set environment variables, run `npm run dev`, and execute C# Formal Verification end-to-end in the browser — all locally without Docker.

**Depends on**: Nothing new (builds on existing codebase)

**Requirements**: START-01, START-02, CONF-01, CONF-02, CONF-03, CONF-04, E2E-01, E2E-02

**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` at project root starts both server (port 3000) and client (port 5173) in one terminal with labeled `[server]` and `[client]` prefixes
  2. The C# FV tool shows "Available" status in the portal UI when accessed at `http://localhost:5173` with local env vars set
  3. Uploading a C# zip (e.g. `null-safe-repository`) and clicking Execute produces real-time streaming verification output in the browser console — no Docker required
  4. Changing `CSHARP_FV_CMD` in `.env` changes which command the tool registry invokes; removing it falls back to `/usr/local/bin/hupyy-csharp-verify`
  5. The `.env` file documents and sets `CSHARP_FV_CMD`, `CS_FV_DLL`, `JAVA_HOME`, and `CVC5_PATH` to correct local paths

**Plans**: 3 plans
Plans:
- [x] 24-01-PLAN.md — Make C# FV command env-configurable in toolRegistry; fix .env local paths
- [x] 24-02-PLAN.md — Add root npm run dev script with concurrently for server + client
- [x] 24-03-PLAN.md — Pre-flight checks + human E2E verification of local C# FV execution

### Phase 25: Developer README

**Goal**: Any developer can read `README.md` at project root and go from zero to a running local portal without asking questions.

**Depends on**: Phase 24 (local setup must be working before it can be accurately documented)

**Requirements**: DOC-01

**Success Criteria** (what must be TRUE):
  1. `README.md` exists at project root and lists all prerequisites (Node.js version, .NET version, Java version, CVC5, Z3) with installation hints
  2. A developer following only the README steps (clone, install prerequisites, set env vars, `npm run dev`) can reach the running portal in their browser
  3. The README covers both the one-time setup and the daily start command — no supplemental knowledge required

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Setup & Foundation | v1.0 | 3/3 | Complete | 2026-02-12 |
| 2. File Upload & Validation | v1.0 | 2/2 | Complete | 2026-02-13 |
| 3. Process Execution & Sandboxing | v1.0 | 3/3 | Complete | 2026-02-13 |
| 4. Real-Time Output Streaming | v1.0 | 2/2 | Complete | 2026-02-12 |
| 5. Output Preview & Download | v1.0 | 3/3 | Complete | 2026-02-13 |
| 6. Landing Page & Examples | v1.0 | 2/2 | Complete | 2026-02-13 |
| 7. E2E Testing with Playwright | v1.0 | 2/2 | Complete | 2026-02-14 |
| 8. Docker Infrastructure & Wrapper | v1.1 | 2/2 | Complete | 2026-02-16 |
| 9. Tool Activation & Examples | v1.1 | 3/3 | Complete | 2026-02-16 |
| 10. E2E Testing | v1.1 | 2/2 | Complete | 2026-02-16 |
| 11. Test Infrastructure & Configuration | v1.2 | 2/2 | Complete | 2026-02-16 |
| 12. Landing Page E2E Tests | v1.2 | 2/2 | Complete | 2026-02-17 |
| 13. Upload Flow E2E Tests | v1.2 | 2/2 | Complete | 2026-02-17 |
| 14. Execution Flow E2E Tests | v1.2 | 2/2 | Complete | 2026-02-17 |
| 15. Output Flow E2E Tests | v1.2 | 2/2 | Complete | 2026-02-17 |
| 16. Examples & Shareable Links E2E Tests | v1.2 | 2/2 | Complete | 2026-02-17 |
| 17. Edge Cases & Polish | v1.2 | 2/2 | Complete | 2026-02-18 |
| 18. Documentation Drift Fix | v1.2 | 1/1 | Complete | 2026-02-19 |
| 19. Test Infrastructure Cleanup | v1.2 | 2/2 | Complete | 2026-02-20 |
| 20. Docker Image — .NET Runtime + Solver Binaries | v1.3 | 2/2 | Complete | 2026-02-21 |
| 21. Wrapper Script + Tool Registry Activation | v1.3 | 3/3 | Complete | 2026-02-21 |
| 22. C# Example Projects | v1.3 | 3/3 | Complete | 2026-02-21 |
| 23. E2E Tests | v1.3 | 2/2 | Complete | 2026-02-21 |
| 24. Local Dev Setup & C# FV Configuration | 2/3 | Complete    | 2026-02-21 | - |
| 25. Developer README | v1.4 | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-21 — Phase 24 planned (3 plans: toolRegistry config, concurrently dev script, E2E verification)*
