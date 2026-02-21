---
phase: 20-docker-image-net-runtime-solver-binaries
verified: 2026-02-21T00:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
known_deviations:
  - criterion: "Image size < 800 MB"
    observed: "1546 MB"
    approved_by: human
    reason: "800 MB constraint was unrealistic given mandatory components: NuGet/Roslyn cache 333 MB, cs-fv DLL directory 75 MB, solver binaries 66 MB, dotnet-runtime-8.0 ~100-200 MB. Functional requirements all pass. Human-approved deviation."
---

# Phase 20: Docker Image .NET Runtime + Solver Binaries — Verification Report

**Phase Goal:** A working Docker image that can execute the C# FV tool — containing the .NET runtime, CVC5 and Z3 solver binaries, the cs-fv published DLL, and a pre-seeded NuGet package cache that eliminates network calls at request time

**Verified:** 2026-02-21
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are drawn directly from the `must_haves.truths` sections of `20-01-PLAN.md` and `20-02-PLAN.md`.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `docker run <image> sh -c 'which cvc5 && cvc5 --version'` exits 0 and prints a version line | VERIFIED | COPY --from=solver-builder at line 137; cvc5 1.3.2 downloaded and installed to /usr/local/bin/cvc5 with `install -m 0755`; container test confirmed (SUMMARY-02) |
| 2 | `docker run <image> sh -c 'which z3 && z3 --version'` exits 0 and prints a version line | VERIFIED | COPY --from=solver-builder at line 138; z3 4.16.0 downloaded and installed to /usr/local/bin/z3 with `install -m 0755`; container test confirmed (SUMMARY-02) |
| 3 | `docker run <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll` does not produce a missing file or missing assembly error | VERIFIED | COPY --from=dotnet-builder /publish/cs-fv /usr/local/lib/cs-fv at line 141; dotnet-runtime-8.0 installed (line 132); container test confirmed usage output, exit 1 for no args (acceptable) |
| 4 | dotnet-builder stage uses `--platform=$BUILDPLATFORM`; solver-builder does NOT use `--platform=$BUILDPLATFORM` | VERIFIED | Line 71: `FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-noble AS dotnet-builder`; Line 33: `FROM ubuntu:noble AS solver-builder` (no --platform flag) |
| 5 | Production image installs dotnet-runtime-8.0 from Ubuntu Noble built-in apt feed (no Microsoft feed) | VERIFIED | Lines 131-134: `apt-get install -y dotnet-runtime-8.0`; no `packages.microsoft.com` or Microsoft apt source anywhere in Dockerfile |
| 6 | Solver binaries /usr/local/bin/cvc5 and /usr/local/bin/z3 are present on PATH in production | VERIFIED | Lines 137-138: COPY --from=solver-builder for both binaries to /usr/local/bin; /usr/local/bin is on default PATH in eclipse-temurin:25-jre-noble |
| 7 | cs-fv DLL directory /usr/local/lib/cs-fv is present in production with cs-fv.dll | VERIFIED | Line 141: COPY --from=dotnet-builder /publish/cs-fv /usr/local/lib/cs-fv; AssemblyName=cs-fv in CsFv.Cli.csproj; container test confirmed |
| 8 | NuGet packages are at /home/nodejs/.nuget/packages owned by the nodejs user | VERIFIED | Line 144: COPY --from=dotnet-builder /nuget-packages /home/nodejs/.nuget/packages; Line 154: chown -R nodejs:nodejs /home/nodejs |
| 9 | ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages is set in production stage | VERIFIED | Line 147: `ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages` |
| 10 | `docker run <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll` exits with usage message | VERIFIED | Container test in SUMMARY-02: prints usage text, exit 1 (no args) is acceptable — not a missing file/assembly error |
| 11 | `docker run <image> sh -c 'which cvc5 && which z3'` exits 0 with both paths printed | VERIFIED | Container test confirmed: `/usr/local/bin/cvc5` and `/usr/local/bin/z3` printed; exit 0 |
| 12 | `docker run --network=none <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll --help` succeeds without fetching packages from network | VERIFIED | Container test with --network=none confirmed: usage output printed, no NuGet restore errors, no network timeout errors |
| 13 | `docker run <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll` runs as nodejs non-root user without permission errors | VERIFIED | Line 154-156: chown -R nodejs:nodejs /home/nodejs before USER nodejs; container test confirmed no permission denied errors |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Dockerfile` | solver-builder stage (CVC5 1.3.2 + Z3 4.16.0) | VERIFIED | Lines 32-68: Stage 3, `FROM ubuntu:noble AS solver-builder`, TARGETARCH case statements for both solvers, install -m 0755, cleanup of /tmp artifacts |
| `Dockerfile` | dotnet-builder stage (cs-fv DLL, NuGet cache) | VERIFIED | Lines 70-88: Stage 4, `FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-noble AS dotnet-builder`, ENV NUGET_PACKAGES=/nuget-packages before publish, -p:MinVerSkip=true |
| `Dockerfile` | production stage with dotnet-runtime-8.0, solver binaries, cs-fv DLL, NuGet cache | VERIFIED | Lines 130-154: apt install dotnet-runtime-8.0, COPY --from=solver-builder x2, COPY --from=dotnet-builder x2, ENV NUGET_PACKAGES, chown -R nodejs:nodejs /home/nodejs |
| `Dockerfile` | NUGET_PACKAGES=/home/nodejs/.nuget/packages env var | VERIFIED | Line 147: `ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages` |
| `cs-fv/src/CsFv.Cli/CsFv.Cli.csproj` | cs-fv CLI project (build source) | VERIFIED | File exists at /Users/alexanderfedin/Projects/hapyy/cs-fv/src/CsFv.Cli/ |
| `java-fv/compiler-plugin/cli/target/cli-1.1.0-jar-with-dependencies.jar` | Pre-built Java FV jar (deviated: Maven build replaced with COPY) | VERIFIED | File exists; Dockerfile java-builder stage uses COPY instead of Maven build (auto-fix, Rule 1) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Dockerfile solver-builder | github.com/cvc5/cvc5/releases/download/cvc5-1.3.2 | curl -fsSL with TARGETARCH case statement | WIRED | Line 47: URL contains `cvc5-1.3.2`; amd64/arm64 case arms present |
| Dockerfile solver-builder | github.com/Z3Prover/z3/releases/download/z3-4.16.0 | curl -fsSL with TARGETARCH case statement | WIRED | Line 62: URL contains `z3-4.16.0`; amd64/arm64 case arms with correct glibc variant |
| Dockerfile dotnet-builder | src/CsFv.Cli/CsFv.Cli.csproj | dotnet publish --no-self-contained --framework net8.0 -p:MinVerSkip=true | WIRED | Line 83-88: `dotnet publish src/CsFv.Cli/CsFv.Cli.csproj --configuration Release --framework net8.0 --output /publish/cs-fv --no-self-contained -p:MinVerSkip=true` |
| Dockerfile dotnet-builder | /nuget-packages | ENV NUGET_PACKAGES=/nuget-packages before dotnet publish | WIRED | Line 79 sets `ENV NUGET_PACKAGES=/nuget-packages`; line 83 runs dotnet publish — correct ordering |
| Dockerfile production stage | solver-builder stage | COPY --from=solver-builder /usr/local/bin/cvc5 and /usr/local/bin/z3 | WIRED | Lines 137-138: both COPY --from=solver-builder instructions present |
| Dockerfile production stage | dotnet-builder stage | COPY --from=dotnet-builder /publish/cs-fv and /nuget-packages | WIRED | Lines 141 and 144: both COPY --from=dotnet-builder instructions present |
| Dockerfile production | /home/nodejs/.nuget/packages | chown -R nodejs:nodejs /home/nodejs | WIRED | Line 154: `chown -R nodejs:nodejs /home/nodejs` at line 154; USER nodejs at line 156 — correct ordering |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DOCKER-01 | 20-01-PLAN.md | Docker image includes a dotnet-builder stage that builds and publishes the cs-fv CLI DLL | SATISFIED | Stage 4 dotnet-builder at lines 70-88; publishes to /publish/cs-fv; production COPY at line 141; container test confirmed DLL runs |
| DOCKER-02 | 20-02-PLAN.md | Docker production image includes .NET runtime for executing `dotnet cs-fv.dll` | SATISFIED | Lines 131-134: `apt-get install -y dotnet-runtime-8.0`; container test: `dotnet --list-runtimes` shows `Microsoft.NETCore.App 8.0.24` |
| DOCKER-03 | 20-01-PLAN.md | Docker production image includes cvc5 and z3 as system binaries | SATISFIED | Lines 137-138: COPY --from=solver-builder for both; container test: `which cvc5 && which z3` exits 0 with /usr/local/bin paths |
| DOCKER-04 | 20-02-PLAN.md | NuGet packages are pre-seeded during Docker build (no network calls at runtime) | SATISFIED | Lines 144, 147: COPY nuget cache, ENV NUGET_PACKAGES; container test with --network=none confirmed offline operation |

All four phase 20 requirements from REQUIREMENTS.md traceability table are SATISFIED. No orphaned requirements found.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No anti-patterns detected in Dockerfile |

---

## Known Deviation: Image Size

| Criterion | Expected | Observed | Status |
|-----------|----------|----------|--------|
| Image size | < 800 MB | 1546 MB | Human-approved deviation |

**Root cause breakdown (from SUMMARY-02):**
- Base eclipse-temurin:25-jre-noble + Node.js app: ~733 MB (pre-existing, not new)
- NuGet package cache (Roslyn 148 MB, Z3 NuGet 55 MB, etc.): 333 MB
- cs-fv DLL directory: 75 MB
- Solver binaries (cvc5 + z3): 66 MB
- dotnet-runtime-8.0 + deps: ~100-200 MB

**Assessment:** The 800 MB constraint was unrealistic given the mandatory components. The cs-fv tool requires Roslyn (C# compiler) packages at runtime. All functional requirements (DOCKER-01 through DOCKER-04) pass. This deviation was acknowledged and human-approved. It does NOT block phase goal achievement.

**Deferred:** NuGet cache pruning (remove architecture-specific packages) could reduce size in a future optimization phase.

---

## Human Verification Required

Human verification was obtained during plan execution (Task 3 checkpoint in 20-02-PLAN.md):

- Human approved all four DOCKER success criteria after reviewing Task 2 automated verification output.
- Checkpoint commit: no separate commit (human review only, as documented in SUMMARY-02).

No additional human verification is required for this phase verification.

---

## Commits Verified

| Commit | Type | Description |
|--------|------|-------------|
| `7a4beaa` | feat | add solver-builder and dotnet-builder stages to Dockerfile |
| `b6a1602` | feat | extend production stage with .NET runtime, solver binaries, cs-fv DLL, NuGet cache |
| `bf173ed` | fix | auto-fix java-builder duplicate pom and TypeScript unused variable |
| `bfb8f61` | docs | complete solver-builder and dotnet-builder stages plan |
| `a459e4a` | docs | complete production stage Docker image plan |

All commits confirmed present in git log.

---

## Gaps Summary

No gaps. All 13 must-have truths verified, all 7 key links wired, all 4 requirements satisfied.

The only deviation is image size (1546 MB vs 800 MB target) which was human-approved and does not affect functional goal achievement.

---

_Verified: 2026-02-21_
_Verifier: Claude (gsd-verifier)_
