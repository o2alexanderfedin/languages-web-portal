# Roadmap: Hupyy Languages Web Portal

## Milestones

- **v1.0 MVP** — Phases 1-7 (shipped 2026-02-14) — [Details](milestones/v1.0-ROADMAP.md)
- **v1.1 Java FV Integration** — Phases 8-10 (shipped 2026-02-16) — [Details](milestones/v1.1-ROADMAP.md)
- **v1.2 Comprehensive E2E Testing** — Phases 11-19 (shipped 2026-02-20) — [Details](milestones/v1.2-ROADMAP.md)
- **v1.3 C# Formal Verification** — Phases 20-23 (in progress)

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

### v1.3 C# Formal Verification (In Progress)

**Milestone Goal:** Add C# Formal Verification as the second live tool — Docker image with .NET runtime + solver binaries, wrapper script bridging dotnet build + Roslyn analyzer to the portal interface, three C# example projects with FV contracts, and E2E test coverage verifying the full user flow.

- [x] **Phase 20: Docker Image — .NET Runtime + Solver Binaries** - Extend Docker build to include .NET runtime, CVC5, Z3, and the cs-fv published DLL with pre-seeded NuGet cache
- [ ] **Phase 21: Wrapper Script + Tool Registry Activation** - Implement `hupyy-csharp-verify` wrapper script and activate C# FV tool in the registry
- [ ] **Phase 22: C# Example Projects** - Three C# example projects with FV contracts demonstrating progressive complexity and intentional failure
- [ ] **Phase 23: E2E Tests** - Playwright E2E tests covering the full C# FV user flow including the known-bad example

## Phase Details

### Phase 20: Docker Image — .NET Runtime + Solver Binaries
**Goal**: A working Docker image that can execute the C# FV tool — containing the .NET runtime, CVC5 and Z3 solver binaries, the cs-fv published DLL, and a pre-seeded NuGet package cache that eliminates network calls at request time
**Depends on**: Phase 19 (existing 4-stage Docker build pattern from v1.1)
**Requirements**: DOCKER-01, DOCKER-02, DOCKER-03, DOCKER-04
**Success Criteria** (what must be TRUE):
  1. Running `docker run <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll` inside the container exits with a usage message (DLL is present and executable)
  2. Running `docker run <image> which cvc5 && which z3` succeeds — both solver binaries are on PATH in production stage
  3. Running `docker run --network=none <image> dotnet build <cs-project>` succeeds without any network calls — NuGet packages are pre-seeded in the image layer
  4. The `nodejs` user (non-root) can write to its home directory and NuGet package paths — no permission denied errors when dotnet tooling runs
  5. Docker image size does not exceed the 800 MB warning threshold (builder stage uses SDK, production stage uses runtime-only)
**Plans**: 2 plans
Plans:
- [x] 20-01-PLAN.md — Add solver-builder and dotnet-builder stages to Dockerfile
- [x] 20-02-PLAN.md — Extend production stage, build and verify Docker image

### Phase 21: Wrapper Script + Tool Registry Activation
**Goal**: The C# FV tool is invocable through the portal — the `hupyy-csharp-verify` wrapper script adapts the portal's `--input <dir>` interface to `dotnet cs-fv.dll verify <files...>`, and the tool registry marks the tool as available with the correct 180s timeout
**Depends on**: Phase 20
**Requirements**: CSFV-01, CSFV-02, CSFV-03, CSFV-04
**Success Criteria** (what must be TRUE):
  1. Selecting "C# Formal Verification" in the portal tool grid shows status "Available" (not "In Development")
  2. Uploading a valid C# project zip and clicking Execute starts real-time streaming output in the browser console — the tool runs end-to-end through the portal
  3. The wrapper script exits non-zero and surfaces an actionable error message when the uploaded zip contains `.cs` files but no `.csproj` file
  4. A C# FV execution that produces verification failures exits with code 1 (not 0), causing the portal to display `status: failed` — Roslyn Warning-severity diagnostics are treated as errors
**Plans**: TBD

### Phase 22: C# Example Projects
**Goal**: Three ready-to-run C# example projects are available in the portal ExampleSelector, each with proper `.csproj` files referencing the Hupyy C# FV analyzer, FV contract annotations, and progressive complexity from simple null safety to an intentional invariant violation
**Depends on**: Phase 21
**Requirements**: EXAMPLE-01, EXAMPLE-02, EXAMPLE-03, EXAMPLE-04
**Success Criteria** (what must be TRUE):
  1. The ExampleSelector dropdown lists three C# FV examples with names and descriptions — selecting and loading any example populates the upload slot without error
  2. Executing the null-safe-repository example completes with `status: completed` and streaming output shows verification passing
  3. Executing the bank-account-invariant example completes with `status: failed` and streaming output contains a diagnostic message identifying the invariant violation — the tool demonstrably finds real issues
  4. All three examples use modern C# features visible in their source (records, pattern matching, nullable reference types, or primary constructors)
**Plans**: TBD

### Phase 23: E2E Tests
**Goal**: Playwright E2E tests verify the complete C# FV user flow end-to-end against a running Docker container, including example loading, execution with streaming, output inspection, and a mandatory test that asserts the known-bad example produces a failed status
**Depends on**: Phase 22
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04
**Success Criteria** (what must be TRUE):
  1. All new C# FV E2E tests pass across the full 9-project Playwright matrix (3 browsers x 3 viewports) with `E2E_BASE_URL` pointing to the Docker container
  2. A test explicitly loads each C# example and verifies the ExampleSelector UI reflects the correct tool selection and example description
  3. A test verifies that executing the bank-account-invariant example produces `status: failed` in the portal UI — this is the quality gate for the exit-code correctness fix
  4. A test verifies that output file tree and streaming console are populated after a successful C# FV execution (null-safe-repository example)
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
| 21. Wrapper Script + Tool Registry Activation | v1.3 | 0/TBD | Not started | - |
| 22. C# Example Projects | v1.3 | 0/TBD | Not started | - |
| 23. E2E Tests | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-21 — Phase 20 complete (2/2 plans done, all four DOCKER requirements verified)*
