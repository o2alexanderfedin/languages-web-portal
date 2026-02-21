---
phase: 20-docker-image-net-runtime-solver-binaries
plan: 01
subsystem: infra
tags: [docker, dockerfile, cvc5, z3, dotnet, nuget, multi-arch, buildkit]

# Dependency graph
requires:
  - phase: 08-docker
    provides: existing 3-stage Dockerfile (node-builder, java-builder, production)
provides:
  - solver-builder stage in Dockerfile (CVC5 1.3.2 + Z3 4.16.0 TARGETARCH-aware downloads)
  - dotnet-builder stage in Dockerfile (cs-fv CLI DLL published to /publish/cs-fv, NuGet cache at /nuget-packages)
affects:
  - phase 20-02 (production stage extensions - installs .NET runtime, copies solver binaries and DLL)
  - phase 21 (C# FV backend integration tests using these binaries)
  - phase 22 (C# FV examples - uses cs-fv.dll on PATH)

# Tech tracking
tech-stack:
  added:
    - ubuntu:noble (solver-builder base image)
    - mcr.microsoft.com/dotnet/sdk:10.0-noble (dotnet-builder base image)
    - CVC5 1.3.2 (static binary, GitHub releases)
    - Z3 4.16.0 (dynamic binary, GitHub releases, glibc-2.38/2.39)
  patterns:
    - TARGETARCH case statement for multi-arch binary URL selection (amd64/arm64)
    - --platform=$BUILDPLATFORM on SDK compile stages to avoid QEMU emulation
    - ENV NUGET_PACKAGES before dotnet publish to redirect NuGet cache
    - install -m 0755 for atomic binary installation from extracted archives

key-files:
  created: []
  modified:
    - Dockerfile

key-decisions:
  - "solver-builder uses ubuntu:noble WITHOUT --platform (curl/unzip are arch-independent; TARGETARCH selects URL only)"
  - "dotnet-builder uses --platform=$BUILDPLATFORM (prevents QEMU emulation of .NET SDK on Apple Silicon)"
  - "CVC5 pinned at 1.3.2 (latest stable 2025-12-12 with native arm64 + x86_64 static binaries)"
  - "Z3 pinned at 4.16.0 (latest stable 2026-02-19; 4.13.2+ fixed ARM64 binary mislabeling issue)"
  - "NuGet cache redirected to /nuget-packages in dotnet-builder for COPY to production"
  - "-p:MinVerSkip=true required because Docker COPY does not preserve .git history"

patterns-established:
  - "Pattern: TARGETARCH case statement for GitHub release asset selection (CVC5/Z3 naming conventions)"
  - "Pattern: Separate solver-builder stage keeps curl/unzip out of production image"
  - "Pattern: dotnet-builder with --platform=$BUILDPLATFORM for SDK stages (performance on Apple Silicon)"

requirements-completed: [DOCKER-01, DOCKER-03]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 20 Plan 01: Solver Builder and .NET Builder Stages Summary

**5-stage Dockerfile with CVC5 1.3.2 + Z3 4.16.0 TARGETARCH-aware solver-builder and --platform=$BUILDPLATFORM dotnet-builder publishing cs-fv.dll via net8.0 framework-dependent publish**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T00:37:52Z
- **Completed:** 2026-02-21T00:40:10Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added Stage 3 solver-builder stage downloading CVC5 1.3.2 and Z3 4.16.0 from GitHub releases using TARGETARCH case statements (no --platform flag; arch-independent curl/unzip tools)
- Added Stage 4 dotnet-builder stage using mcr.microsoft.com/dotnet/sdk:10.0-noble with --platform=$BUILDPLATFORM, publishing cs-fv CLI DLL to /publish/cs-fv with NuGet cache pre-seeded at /nuget-packages
- Renumbered production to Stage 5, maintaining correct 5-stage build order: node-builder, java-builder, solver-builder, dotnet-builder, production

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Add solver-builder and dotnet-builder stages** - `7a4beaa` (feat) — both stages inserted together in a single atomic edit to maintain correct stage ordering

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `Dockerfile` - Extended from 3-stage to 5-stage build; added solver-builder (CVC5 1.3.2, Z3 4.16.0) and dotnet-builder (sdk:10.0-noble, cs-fv.dll publish with MinVerSkip)

## Decisions Made

- Tasks 1 and 2 were committed together since they are both Dockerfile modifications and must be inserted in order (solver-builder before dotnet-builder before production)
- solver-builder uses `FROM ubuntu:noble AS solver-builder` without `--platform` — curl and unzip are arch-independent, TARGETARCH ARG selects the download URL only
- dotnet-builder uses `FROM --platform=$BUILDPLATFORM` — prevents QEMU emulation of the .NET SDK on Apple Silicon (significant performance benefit for arm64 target builds)
- Both solver versions pinned (CVC5 1.3.2, Z3 4.16.0) for reproducible builds as required by plan
- `install -m 0755` used for atomic binary placement (plan requirement)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- solver-builder stage is ready; production stage (Phase 20-02) can now COPY /usr/local/bin/cvc5 and /usr/local/bin/z3
- dotnet-builder stage is ready; production stage (Phase 20-02) can now COPY /publish/cs-fv to /usr/local/lib/cs-fv and /nuget-packages to /home/nodejs/.nuget/packages
- Production stage still needs: dotnet-runtime-8.0 apt install, COPY instructions for solver binaries and cs-fv DLL, NuGet env var, and chown for nodejs user

## Self-Check: PASSED

- FOUND: Dockerfile (modified with solver-builder + dotnet-builder stages)
- FOUND: 20-01-SUMMARY.md (this file)
- FOUND commit: 7a4beaa (feat(20-01): add solver-builder and dotnet-builder stages to Dockerfile)

---
*Phase: 20-docker-image-net-runtime-solver-binaries*
*Completed: 2026-02-21*
