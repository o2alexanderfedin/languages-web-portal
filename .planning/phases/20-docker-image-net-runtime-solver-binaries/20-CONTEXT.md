# Phase 20: Docker Image — .NET Runtime + Solver Binaries - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the existing 4-stage Dockerfile to add a `dotnet-builder` stage that builds and publishes the cs-fv CLI DLL from source (monorepo at `../cs-fv`), install .NET runtime in the production stage, add CVC5 and Z3 solver binaries as system PATH executables, and pre-seed the NuGet package cache so no network calls occur at request time.

Wrapper scripts, tool registry activation, and example projects are out of scope (Phases 21–22).

</domain>

<decisions>
## Implementation Decisions

### Solver binary sourcing
- Both CVC5 and Z3 sourced from GitHub releases (not apt-get) — pinned to latest stable releases at build time
- A dedicated solver-builder stage downloads and extracts the binaries; production stage COPYs only the final executables — no download tooling in production
- Use `TARGETARCH` BuildKit ARG to select the correct release asset per platform (amd64 vs arm64)
- If a pre-built ARM64 release is unavailable for either solver, build from source in the solver-builder stage
- Solver binaries must be on PATH in the production stage (success criterion: `which cvc5 && which z3` succeeds)

### cs-fv build context
- Claude decides build context approach (likely COPY from monorepo root `cs-fv/` into dotnet-builder stage)
- Target the latest .NET LTS version — Claude checks the current latest LTS online and uses that
- Published as framework-dependent (not self-contained) — production stage installs the matching .NET runtime
- DLL destination path: Claude decides (consistent with existing tool placement, e.g., `/usr/local/lib/cs-fv/cs-fv.dll` as named in success criteria)

### NuGet cache seeding
- Run `dotnet restore` on the actual example C# projects in the dotnet-builder stage
- Since example projects don't exist yet (Phase 22), Claude decides the minimal set of packages to pre-seed that satisfies DOCKER-04 (offline restore at request time) without depending on Phase 22 content
- COPY the restored package cache from dotnet-builder into the production stage — no dotnet SDK in production, keeping the image lean
- NuGet cache path and `NUGET_PACKAGES` env var: Claude decides, ensuring the `nodejs` non-root user can write to it with no permission denied errors

### Multi-platform build
- Build targets both `linux/amd64` AND `linux/arm64` (Apple Silicon dev support)
- Single Dockerfile using `ARG TARGETARCH` (Docker BuildKit) — no separate per-platform Dockerfiles
- ARM64 fallback: if a solver has no pre-built ARM64 GitHub release, compile it from source in the solver-builder stage
- 800 MB image size limit applies to BOTH platforms — ARM64 source builds must stay within this threshold
- CI should use `docker buildx` to produce multi-arch manifests

### Claude's Discretion
- Exact Docker build context setup (monorepo root vs subdirectory) for accessing `cs-fv/`
- .NET LTS version selection (Claude checks current latest)
- cs-fv DLL install path (must match the `dotnet /usr/local/lib/cs-fv/cs-fv.dll` pattern from success criteria)
- NuGet global packages path and ownership strategy for the `nodejs` user
- NuGet seed package list (minimal set that satisfies offline restore without Phase 22 examples)
- Whether to squash solver source build into a scratch-based copy or use multi-stage COPY to minimize production layer size

</decisions>

<specifics>
## Specific Ideas

- Success criterion wording locks in paths: `dotnet /usr/local/lib/cs-fv/cs-fv.dll` for DLL invocation, `which cvc5 && which z3` for solver check
- `docker run --network=none dotnet build <cs-project>` must succeed — this is the hard requirement driving the NuGet pre-seeding
- The `nodejs` non-root user (uid 1001) must be able to write to its home directory and NuGet package paths — matches existing `nodejs` user setup in current Dockerfile
- Existing production stage base: `eclipse-temurin:25-jre-noble` (Ubuntu Noble) — .NET runtime install and solver binaries must be compatible with this base

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-docker-image-net-runtime-solver-binaries*
*Context gathered: 2026-02-20*
