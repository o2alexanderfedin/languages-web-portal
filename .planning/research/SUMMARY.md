# Project Research Summary

**Project:** Hapyy Languages Web Portal — C# Formal Verification Integration (v1.3)
**Domain:** CLI Tool Execution Web Portal — Adding C# FV as the second live tool via Roslyn + dotnet build
**Researched:** 2026-02-20
**Confidence:** HIGH (infrastructure, Docker, wrapper pattern); MEDIUM (C# FV analyzer internals, Hupyy NuGet specifics)

## Executive Summary

This milestone (v1.3) adds C# Formal Verification as the portal's second live tool, following the established Java FV integration pattern from v1.1. The portal already has all necessary infrastructure: SSE streaming, execa subprocess execution, tool registry gating, wrapper script adapter pattern, 3-stage Docker builds, and E2E test fixtures. The work is entirely additive — a new Docker stage for .NET SDK + solver binaries, a new wrapper script, updated tool registry entries, three overhauled C# example projects with formal verification contracts, and E2E tests. No server services, frontend code, or streaming infrastructure needs to change.

The recommended approach mirrors Java FV exactly. The C# FV tool (`cs-fv`) is a pre-built .NET CLI that accepts individual `.cs` files and runs Roslyn analysis backed by CVC5 and Z3 SMT solving. The wrapper script `hupyy-csharp-verify` finds all `.cs` files in the uploaded directory and invokes `dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <files...>`. The Docker image gains a `dotnet-builder` stage that publishes the cs-fv CLI; the production stage installs `dotnet-runtime-8.0`, CVC5 (primary solver), and Z3 (fallback CLI — the `Microsoft.Z3` NuGet package ships no Linux native libraries). NuGet package cache is pre-seeded during Docker build to eliminate network calls at request time.

The dominant risks are Docker-specific. The .NET SDK adds 300-900 MB to the image — mitigated by using Alpine-based SDK in the builder stage and runtime-only in production. NuGet's global package cache has a confirmed concurrency race condition under concurrent builds (NuGet/Home #8129) — mitigated by setting `NUGET_PACKAGES` per-job in the wrapper script. The non-root `nodejs` user needs a writable HOME for dotnet tooling — mitigated in the Dockerfile. A non-obvious correctness risk: Roslyn analyzer diagnostics default to Warning severity, so `dotnet build` exits 0 even on verification failure; the `.csproj` must set `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. Execution timeout must be raised from 60s to 180s for MSBuild cold-start plus CVC5 solving time.

## Key Findings

### Recommended Stack

The new stack additions for v1.3 are exclusively .NET-related. No new npm packages, no frontend changes, no server service changes are required. The existing `executionService.ts` streams any subprocess output without modification; the existing `toolRegistry.ts` already has the `csharp-verification` entry declared with `available: false`.

**Core technologies (new additions only):**
- `.NET SDK 10.0` (`mcr.microsoft.com/dotnet/sdk:10.0-noble`) — builder stage for publishing cs-fv CLI; .NET 10 LTS, EOL Nov 2028 (vs .NET 8/9 both EOL Nov 2026)
- `dotnet-runtime-8.0` — production stage runtime-only install (NOT SDK); reduces image by ~500 MB vs full SDK; cs-fv targets `net8.0` TargetFramework
- `CVC5 binary` — primary SMT solver; cs-fv invokes it as a subprocess via PATH; must be installed as a system binary in production
- `Z3 CLI binary` — fallback SMT solver; `Microsoft.Z3` NuGet 4.12.2 has no Linux native libraries (confirmed from NuGet cache inspection — only `osx-x64` and `win-x64`); `Z3StrategyFactory` falls back to CLI automatically when library load fails
- `hupyy-csharp-verify.sh` bash wrapper — adapts `--input <dir>` portal interface to `dotnet <dll> verify <files...>`; uses `exec` for signal propagation; `--tl:off --verbosity minimal --nologo --no-restore` flags required
- `NUGET_PACKAGES` env var (per-job path) — mandatory to prevent NuGet cache race conditions under concurrent builds

**Critical version/flag requirements:**
- .NET SDK 10.0 to build cs-fv; `net8.0` TargetFramework for the published DLL (runtime compatibility)
- `--tl:off` required for non-TTY subprocess; .NET 8+ emits ANSI escape codes by default that corrupt SSE streaming output
- `--no-restore` in wrapper; packages must be pre-seeded in Docker image layer via a dummy project restore during build
- `CodeAnalysisTreatWarningsAsErrors=true` (or `TreatWarningsAsErrors=true`) in example `.csproj` files to ensure exit code 1 on verification failure
- `maxExecutionTimeMs: 180000` in toolRegistry (not 60000 default; not even 120000 as used by Java FV)

See `.planning/research/STACK.md` for full stack detail including wrapper script, Dockerfile snippets, and alternatives considered.

### Expected Features

The feature scope for v1.3 is tightly bounded by the Java FV integration pattern. All portal infrastructure is in place. New deliverables: Docker integration, wrapper script, three C# example projects with FV contracts, and E2E tests.

**Must have (table stakes):**
- C# FV tool executes via portal — `available: true` in toolRegistry + wrapper script invoking cs-fv CLI
- Wrapper script `hupyy-csharp-verify` with `--input <path>` interface — identical contract to Java FV wrapper
- `.csproj` validation before `dotnet build` invocation — helpful error if absent (C# requires a project file; Java FV does not)
- Three C# FV example projects with `[Requires]`/`[Ensures]` contracts — null-safe repository (pass), order records (pass with diagnostics), bank account invariant violation (fail with exit code 1)
- Verification output streams to real-time console — zero infrastructure change; executionService handles this
- Non-zero exit code on verification failure — requires `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in `.csproj`; Roslyn defaults to Warning severity which exits 0
- E2E tests covering C# verification flow — happy path minimum; known-bad project test required to catch silent exit-code bug

**Should have (differentiators):**
- Intentional failure example (bank account) — users see "VERIFICATION FAILED" output, builds trust in the tool
- Modern C# idioms in examples — records, primary constructors, nullable reference types, pattern matching
- Progressive complexity across 3 examples — simple (null safety) → medium (records + patterns) → complex (invariant violation)
- Multi-file examples (2-3 `.cs` files each) — real C# projects span files; single-file demos feel artificial
- 180s execution timeout — accounts for MSBuild cold-start + CVC5 solving time

**Defer (v2+):**
- SARIF output parsing and structured display
- Side-by-side Java FV vs C# FV comparison view
- Dafny integration
- More than 3 example projects
- In-browser C# code editor (explicitly out of scope per PROJECT.md)

**Anti-features (explicitly avoid):**
- In-browser C# editor — breaks upload-only pattern; requires Monaco integration
- Custom Roslyn rules configuration — scope creep for a demo portal
- NuGet restore inside portal execution — adds 30-120s latency; pre-install packages in Docker instead
- .NET Framework project support — requires Windows SDK; Docker image is Linux

See `.planning/research/FEATURES.md` for full feature detail, dependency graph, and Java FV pattern comparison.

### Architecture Approach

The architecture follows the established Portal Tool Integration Pattern exactly. `toolRegistry.ts` gates availability; `executionService.ts` spawns the wrapper script via execa (no shell, array args); the wrapper adapts the portal's `--input <dir>` interface to the tool's native CLI; output streams through SSE to the browser. The only structural change is Docker: 3-stage becomes 4-stage (node-builder, java-builder, dotnet-builder, production).

**Major components (new/modified for v1.3):**
1. `Dockerfile` — dotnet-builder stage (NEW): `dotnet publish` cs-fv CLI with `--self-contained false`; production stage (MODIFY): install `dotnet-runtime-8.0`, CVC5, Z3, copy cs-fv DLLs and wrapper script
2. `scripts/hupyy-csharp-verify.sh` (NEW) — finds `*.cs` files (excluding bin/obj), validates `.csproj` exists, sets per-job `NUGET_PACKAGES`, `exec`s `dotnet <dll> verify <files...>`
3. `packages/server/src/config/toolRegistry.ts` (MODIFY) — `available: true`, `maxExecutionTimeMs: 180000`, env-variable override for `CSHARP_FV_CMD`
4. `packages/shared/src/constants/tools.ts` (MODIFY) — `status: 'available'` for csharp-verification
5. `packages/server/examples/csharp-verification/*/` (MODIFY) — add `using CsFv.Contracts;`, `[Requires]`/`[Ensures]` attributes, `.csproj` files; existing stubs have no FV contracts
6. E2E tests (NEW) — load-example, execute, assert output, assert `status: 'failed'` for bank account example

**Key architectural constraints:**
- cs-fv CLI `verify` takes individual `.cs` file paths as positional arguments, NOT a directory — wrapper must `find` and enumerate files
- `dotnet build` requires a `.csproj` at the project root — wrapper must validate before invoking, unlike Java FV
- Production stage must NOT install full .NET SDK — use runtime-only (`dotnet-runtime-8.0`) to avoid ~500 MB bloat; cs-fv is published as a framework-dependent DLL
- `exec` replaces bash process in wrapper — SIGTERM from portal timeout propagates directly to cs-fv (same as Java FV pattern)

**Suggested build order (from ARCHITECTURE.md):**

| Phase | Work | Can Parallelize? |
|-------|------|------------------|
| 1 | Docker multi-stage: dotnet-builder + runtime/CVC5/Z3 in production | No — prerequisite for everything |
| 2 | Wrapper script + toolRegistry/tools.ts changes | No — requires Docker image to test |
| 3 | Example projects with FV contracts | Partially — content work, but contract syntax must be confirmed from cs-fv source |
| 4 | E2E tests | No — requires all above to be complete |

See `.planning/research/ARCHITECTURE.md` for full system diagram, data flow, and anti-patterns.

### Critical Pitfalls

Top pitfalls for v1.3, ordered by phase impact and severity:

1. **NuGet cache race condition under concurrent builds** — NuGet's `PluginCacheEntry.UpdateCacheFileAsync` is not concurrency-safe (confirmed bug: NuGet/Home #8129). Under 5+ concurrent `dotnet build` processes, file move operations fail intermittently. Avoid by setting `NUGET_PACKAGES` to a per-job writable temp directory in the wrapper script. Never rely on the global cache for correctness. Test: run 10 concurrent builds, verify zero failures.

2. **Non-root user cannot write to default NuGet directories** — The portal runs as `nodejs` (UID 1001). If `$HOME` is unset or `/`, `dotnet restore` fails with permission denied (dotnet-docker issues #78, #84). Fix in Dockerfile: give `nodejs` user a writable home (`-m -d /home/nodejs`), set `NUGET_PACKAGES` to a path owned by `nodejs`, set `DOTNET_CLI_TELEMETRY_OPTOUT=1`. Verify: run `dotnet build` as `nodejs` user interactively in container.

3. **Roslyn analyzer diagnostics at Warning severity — exit code 0 on verification failure** — `dotnet build` exits 0 when analyzers report Warning-severity diagnostics. The portal interprets exit 0 as `status: 'completed'`, silently hiding verification failures. Fix: add `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` to all example `.csproj` files. Verify with an E2E test that asserts `status: 'failed'` on the bank account intentional-failure example.

4. **MSBuild default verbosity floods SSE console** — Default verbosity emits 50+ lines of MSBuild target evaluation and restore progress before any verification result appears. Fix: always pass `--verbosity minimal --nologo --tl:off` to `dotnet build`. Set these in wrapper script on first implementation; changing output format later breaks E2E assertions.

5. **NuGet restore requires internet access at request time** — Without pre-seeded packages in the Docker image, `dotnet restore` during build requires network access to `api.nuget.org`. In restricted egress environments, every build fails. Fix: run `dotnet restore` on a reference project during Docker image build, copy cache into production stage, use `--no-restore` in wrapper. Test: `docker run --network=none <image> hupyy-csharp-verify --input /example`.

6. **Execution timeout too short** — Current config sets `maxExecutionTimeMs: 60000`; Java FV uses 120000; C# needs 180000 (NuGet cold-start + MSBuild initialization + CVC5 solving). Additionally, `EXECUTION_LIMITS.maxTimeoutMs` constant may cap per-tool overrides at 60000 — verify and raise if needed.

7. **Missing `.csproj` causes cryptic MSBuild error** — Java FV accepts bare `.java` files; `dotnet build` requires a `.csproj`. Without a wrapper-level check, users uploading `.cs`-only zips see `MSB1003: Specify a project or solution file`. Fix: check for `.csproj` existence in the wrapper before invoking dotnet; emit a clear actionable error.

8. **Docker image bloat from full .NET SDK** — Using the SDK image in production adds 600-900 MB. Fix: use a dedicated `dotnet-builder` stage, install only `dotnet-runtime-8.0` in production. Use Alpine-based SDK image in the builder stage for smaller intermediate layers.

See `.planning/research/PITFALLS.md` for the full pitfall list including general portal pitfalls (zip bomb, path traversal, process leaks, WebSocket memory leaks) that apply to all tools, plus the complete `"Looks Done But Isn't"` checklist specific to C# integration.

## Implications for Roadmap

Based on research, four phases map to the v1.3 milestone. The dependency chain is strict: Docker must exist before the wrapper is testable; the wrapper must exist before the registry activation exposes the tool; examples require contract syntax confirmed from cs-fv source; E2E tests come last.

### Phase 1: Docker Image — .NET Runtime + Solver Binaries

**Rationale:** This is the hard infrastructure prerequisite. Nothing else is testable without a working Docker image containing dotnet, CVC5, Z3, and the cs-fv published DLL. Docker architecture decisions (which base image, SDK vs runtime, NuGet pre-seeding strategy, HOME directory for non-root user) are expensive to undo. These must be made and implemented first.

**Delivers:** Working Docker image with `dotnet` binary (runtime, not SDK), CVC5 binary, Z3 binary, cs-fv published DLL at `/usr/local/lib/cs-fv/`, pre-seeded NuGet package cache, `nodejs` user with writable `/home/nodejs`

**Addresses:** Table-stakes feature: C# FV tool can actually execute

**Avoids:** C# Pitfalls 1 (image bloat), 2 (NuGet cache race — pre-seed architecture), 3 (non-root user HOME), 6 (timeout constant raised to 180000), 9 (network-dependent restore)

**Research flag:** SKIP — Docker multi-stage pattern is well-documented; Java FV Dockerfile is a working reference for the pattern. Confirm cs-fv `dotnet publish` command from `cs-fv/global.json` and `CsFv.Cli.csproj` before writing the stage.

---

### Phase 2: Wrapper Script + Tool Registry Activation

**Rationale:** With the Docker image available, the wrapper script can be written and tested interactively inside the container. Flipping `available: true` in the registry exposes the tool through the existing execution pipeline with zero changes to executionService or routes.

**Delivers:** `hupyy-csharp-verify` at `/usr/local/bin/`, `toolRegistry.ts` with `available: true` and `maxExecutionTimeMs: 180000`, `tools.ts` with `status: 'available'`, per-job `NUGET_PACKAGES` isolation, `.csproj` validation with actionable error, `--verbosity minimal --nologo --tl:off --no-restore` flags

**Uses:** Existing execa subprocess pattern, existing SSE streaming — no changes needed to those systems

**Avoids:** C# Pitfalls 4 (MSBuild verbosity), 5 (exit code 0 on Warning severity — `TreatWarningsAsErrors` in `.csproj`), 7 (obj/bin isolation per concurrent job), 8 (missing `.csproj` check)

**Research flag:** SKIP — wrapper script is a direct copy/adaptation of `hupyy-java-verify.sh`; all decision points are documented in PITFALLS.md.

---

### Phase 3: C# FV Example Projects

**Rationale:** Example content development can begin in parallel with Phase 1/2, but the contract attribute syntax (`[Requires]`/`[Ensures]`) must be confirmed against the actual cs-fv source before the examples are finalized. The existing example stubs in `packages/server/examples/csharp-verification/` have no FV contracts — cs-fv produces "No methods with contracts found" output on them as-is.

**Delivers:** Three example directories, each with 2-3 `.cs` files with FV contracts, a `.csproj` referencing the Hupyy C# FV analyzer, and a `README.md`:
- `null-safe-repository/` — passes verification (null safety, nullable reference types)
- `order-processing-records/` — passes with diagnostics (records, pattern matching, switch exhaustiveness)
- `bank-account-invariant/` — fails verification with exit code 1 (UnsafeWithdrawal.cs triggers balance invariant violation)

**Addresses:** Differentiator features: progressive complexity, modern C# idioms (C# 12/13), intentional failure example showing "Build FAILED" output

**Avoids:** ARCHITECTURE anti-pattern 5 (examples without FV contracts produce no interesting output)

**Research flag:** NEEDS VALIDATION — before writing examples, read `cs-fv/USAGE.md` to confirm: (1) exact NuGet package name for `<PackageReference>`, (2) contract attribute namespace (`using CsFv.Contracts;` or different), (3) `[Requires]`/`[Ensures]` attribute syntax, (4) actual diagnostic IDs for E2E assertions on the failure case.

---

### Phase 4: E2E Tests

**Rationale:** E2E tests verify the full integration end-to-end and are the quality gate before v1.3 is declared complete. They depend on all prior phases: Docker image running, wrapper installed, examples loadable. The known-bad project test (bank account) is mandatory — without it, the exit-code 0 on Warning-severity diagnostic bug would go undetected.

**Delivers:** Playwright E2E tests (reusing existing helpers from `e2e/fixtures/helpers.ts`) covering: load C# FV example, execute, verify streaming output appears, `status: 'completed'` on null-safe repository, `status: 'failed'` on bank account example, helpful error on `.cs`-only zip upload (no `.csproj`)

**Avoids:** C# Pitfall 5 (silent verification failure — only caught by E2E test on known-bad project)

**Research flag:** SKIP — E2E test patterns established from Java FV test suite; Playwright helpers already in place.

---

### Phase Ordering Rationale

- Docker (Phase 1) is the hard prerequisite: `dotnet` binary must exist before any wrapper, example, or E2E testing
- Wrapper + registry (Phase 2) closes the execution pipeline; the tool becomes invocable via the portal
- Examples (Phase 3) can be drafted in parallel but contract syntax must be verified against cs-fv source before final implementation
- E2E tests (Phase 4) always come last — they test the assembled stack and serve as the acceptance gate
- The Java FV integration (v1.1) provides a working reference for every phase, reducing uncertainty across all phases

### Research Flags

**Phases needing deeper research (before or during planning):**
- **Phase 3 (Examples):** The Hupyy C# FV NuGet package name, contract attribute namespace and syntax, and diagnostic ID format are not publicly documented. Read `cs-fv/USAGE.md` and inspect `cs-fv/src/CsFv.Contracts/` before writing example projects. This is the primary unresolved gap.

**Phases with standard patterns (skip research during planning):**
- **Phase 1 (Docker):** .NET multi-stage Docker patterns are well-documented; Java FV Dockerfile is a direct reference; `dotnet publish` is standard
- **Phase 2 (Wrapper Script):** Direct adaptation of `hupyy-java-verify.sh`; all decision points documented in PITFALLS.md
- **Phase 4 (E2E Tests):** Established Playwright fixtures from Java FV E2E suite; test patterns are known

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core .NET/Docker facts from official Microsoft docs; .NET 10 LTS confirmed from support policy page; CVC5/Z3 Linux compatibility gap confirmed from NuGet cache inspection of actual installed package; dotnet flags (`--tl:off`, `--no-restore`, `--verbosity minimal`) from official `dotnet build` docs |
| Features | MEDIUM-HIGH | Portal integration pattern (from Java FV v1.1) is HIGH; MSBuild diagnostic output format is HIGH from official docs; Hupyy C# FV NuGet package name, contract attribute syntax, and diagnostic IDs are LOW — not publicly documented, must be obtained from cs-fv source |
| Architecture | HIGH | First-party codebase sources: `toolRegistry.ts`, `executionService.ts`, `hupyy-java-verify.sh`, `Dockerfile`, `cs-fv/src/CsFv.Verification/Z3StrategyFactory.cs`, `RealCvc5Runner.cs`; data flow verified against working Java FV integration |
| Pitfalls | HIGH | C# pitfalls sourced from official bug trackers (NuGet/Home #8129 concurrency bug, dotnet-docker #78/#84 non-root user), official MSBuild docs for verbosity, and direct NuGet cache inspection for Z3 Linux compatibility |

**Overall confidence:** HIGH for infrastructure (Docker, wrapper, registry, timeout); MEDIUM for C# FV-specific example content (depends on cs-fv contract syntax from source)

### Gaps to Address

- **Hupyy C# FV NuGet package name** — `Hupyy.CSharp.Verification` is a placeholder inferred from naming conventions. Confirm the actual published NuGet ID from cs-fv project source or project owner before writing the wrapper script's dummy restore csproj and example `.csproj` files. If not yet published to nuget.org, the Docker pre-seeding strategy needs adjustment (local path feed or bundle the analyzer DLL directly).

- **cs-fv contract attribute namespace and syntax** — `using CsFv.Contracts;` and `[Requires]`/`[Ensures]` are inferred from `cs-fv/USAGE.md` citation in ARCHITECTURE.md and architecture research notes. Confirm against `cs-fv/src/CsFv.Contracts/` directory before writing examples. Wrong namespace or attribute name means examples compile but produce no FV output.

- **cs-fv diagnostic ID format** — The exact diagnostic IDs (e.g., `CSFV001`, `HUPYY001`) matter for E2E assertions on the bank account failure case. Obtain from cs-fv source or USAGE.md. Without these, E2E tests can only assert on exit code, not on specific diagnostic messages.

- **Docker image size measurement** — Research recommends Alpine-based SDK for the builder stage and runtime-only in production. Actual compressed image size should be measured after Phase 1 and compared against the 800 MB warning threshold documented in PITFALLS.md. Adjust if Alpine is not viable for the build.

- **Execution timeout validation** — 180s is a conservative estimate. Measure actual `dotnet build` duration on example projects with pre-seeded NuGet cache in the container (not on the host) after Phase 1. Adjust `maxExecutionTimeMs` based on measured P95 timing with a 2x safety margin.

## Sources

### Primary (HIGH confidence)
- First-party codebase: `scripts/hupyy-java-verify.sh`, `Dockerfile`, `packages/server/src/config/toolRegistry.ts`, `packages/server/src/services/executionService.ts` — Java FV integration reference pattern
- First-party: `cs-fv/src/CsFv.Verification/Z3StrategyFactory.cs`, `cs-fv/src/CsFv.Verification/RealCvc5Runner.cs` — solver invocation pattern (library-first, CLI fallback)
- First-party: `~/.nuget/packages/microsoft.z3/4.12.2/runtimes/` — confirmed no Linux native library (only `osx-x64`, `win-x64`)
- [mcr.microsoft.com/dotnet/sdk — Microsoft Artifact Registry](https://mcr.microsoft.com/en-us/product/dotnet/sdk/about) — .NET 10 Noble image confirmed
- [.NET Support Policy — dotnet.microsoft.com](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core) — LTS EOL dates: .NET 10 EOL Nov 2028, .NET 8/9 EOL Nov 2026
- [dotnet build command — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build) — `--tl:off`, `--verbosity`, `--no-restore`, exit codes
- [NuGet Analyzer Conventions — Microsoft Learn](https://learn.microsoft.com/en-us/nuget/guides/analyzers-conventions) — `IncludeAssets=analyzers`, `PrivateAssets=all` pattern
- [Default .NET container tags now use Ubuntu — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/compatibility/containers/10.0/default-images-use-ubuntu) — Noble as default for .NET 10, Debian discontinued
- [MSBuild Diagnostic Format — Microsoft Learn](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-diagnostic-format-for-tasks) — `File.cs(line,col): severity CODE: message` format
- [Code Analysis in .NET — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview) — Roslyn severity levels, Warning vs Error distinction

### Secondary (MEDIUM confidence)
- [NuGet/Home #8129](https://github.com/NuGet/Home/issues/8129) — NuGet cache concurrency race condition (confirmed open bug)
- [dotnet/dotnet-docker #78](https://github.com/dotnet/dotnet-docker/issues/78), [#84](https://github.com/dotnet/dotnet-docker/issues/84) — non-root user NuGet permission failures in Docker
- [dotnet/roslyn #16535](https://github.com/dotnet/roslyn/issues/16535) — `TreatWarningsAsErrors` vs `CodeAnalysisTreatWarningsAsErrors` behavior difference
- cs-fv project: `cs-fv/USAGE.md`, `cs-fv/global.json`, `cs-fv/src/CsFv.Cli/CsFv.Cli.csproj` — CLI interface, build target, runtime target
- [Roslyn Analyzers Overview — Microsoft Learn](https://learn.microsoft.com/en-us/visualstudio/code-quality/roslyn-analyzers-overview) — NuGet delivery, severity levels, IDE/CA diagnostic ID formats
- [Nullable Reference Types — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references) — C# nullable flow analysis for example design

### Tertiary (LOW confidence — needs validation during Phase 3)
- Hupyy C# FV NuGet package name (`Hupyy.CSharp.Verification`) — inferred from naming conventions, not confirmed
- cs-fv contract attribute syntax (`[Requires]`/`[Ensures]`, `using CsFv.Contracts;`) — inferred from architecture research, must be confirmed from cs-fv source
- Diagnostic ID format (`HFVCS001`) — illustrative placeholder; actual diagnostic IDs emitted by the Hupyy analyzer are unknown

---
*Research completed: 2026-02-20*
*Ready for roadmap: yes*
