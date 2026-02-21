# Phase 20: Docker Image — .NET Runtime + Solver Binaries - Research

**Researched:** 2026-02-20
**Domain:** Multi-stage Dockerfile, .NET 8/10, CVC5, Z3, NuGet offline cache, Docker BuildKit multi-platform
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Both CVC5 and Z3 sourced from GitHub releases (not apt-get) — pinned to latest stable releases at build time
- A dedicated solver-builder stage downloads and extracts the binaries; production stage COPYs only the final executables — no download tooling in production
- Use `TARGETARCH` BuildKit ARG to select the correct release asset per platform (amd64 vs arm64)
- If a pre-built ARM64 release is unavailable for either solver, build from source in the solver-builder stage
- Solver binaries must be on PATH in the production stage (success criterion: `which cvc5 && which z3` succeeds)
- Claude decides build context approach (likely COPY from monorepo root `cs-fv/` into dotnet-builder stage)
- Target the latest .NET LTS version — Claude checks the current latest LTS online and uses that
- Published as framework-dependent (not self-contained) — production stage installs the matching .NET runtime
- DLL destination path: Claude decides (consistent with `dotnet /usr/local/lib/cs-fv/cs-fv.dll` success criterion)
- Run `dotnet restore` on the actual example C# projects in the dotnet-builder stage
- Since example projects don't exist yet (Phase 22), Claude decides the minimal set of packages to pre-seed
- COPY the restored package cache from dotnet-builder into the production stage — no dotnet SDK in production
- NuGet cache path and `NUGET_PACKAGES` env var: Claude decides, ensuring the `nodejs` non-root user can write to it
- Build targets both `linux/amd64` AND `linux/arm64`
- Single Dockerfile using `ARG TARGETARCH` (Docker BuildKit) — no separate per-platform Dockerfiles
- 800 MB image size limit applies to BOTH platforms
- CI should use `docker buildx` to produce multi-arch manifests

### Claude's Discretion
- Exact Docker build context setup (monorepo root vs subdirectory) for accessing `cs-fv/`
- .NET LTS version selection (Claude checks current latest)
- cs-fv DLL install path (must match the `dotnet /usr/local/lib/cs-fv/cs-fv.dll` pattern from success criteria)
- NuGet global packages path and ownership strategy for the `nodejs` user
- NuGet seed package list (minimal set that satisfies offline restore without Phase 22 examples)
- Whether to squash solver source build into a scratch-based copy or use multi-stage COPY to minimize production layer size

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCKER-01 | Docker image includes a `dotnet-builder` stage that builds and publishes the cs-fv CLI DLL | .NET SDK 10.0 (noble) multi-arch image available; CsFv.Cli project identified at `src/CsFv.Cli/CsFv.Cli.csproj`; `AssemblyName=cs-fv` means output is `cs-fv.dll` |
| DOCKER-02 | Docker production image includes .NET runtime for executing `dotnet cs-fv.dll` | Ubuntu Noble built-in feed provides `dotnet-runtime-8.0` (no Microsoft feed needed, both amd64 and arm64 supported via apt); production base is `eclipse-temurin:25-jre-noble` which is Ubuntu Noble |
| DOCKER-03 | Docker production image includes `cvc5` and `z3` as system binaries | CVC5 1.3.2 has native Linux arm64 + x86_64 binaries; Z3 4.16.0 has arm64-glibc-2.38 + x64-glibc-2.39 binaries; both compatible with Ubuntu Noble (glibc 2.39) |
| DOCKER-04 | NuGet packages are pre-seeded during Docker build (no network calls at runtime) | `NUGET_PACKAGES` env var controls cache location; COPY from dotnet-builder into production; path `/home/nodejs/.nuget/packages` owned by `nodejs` user; seed via `dotnet restore` of CsFv.Cli |
</phase_requirements>

## Summary

This phase extends the existing 4-stage Dockerfile (node-builder → java-builder → production) to add a `dotnet-builder` stage and a `solver-builder` stage, producing a 5- or 6-stage build. The `dotnet-builder` stage uses the official `mcr.microsoft.com/dotnet/sdk:10.0-noble` multi-arch image to build and publish the cs-fv CLI as a framework-dependent DLL. The `solver-builder` stage downloads and extracts CVC5 1.3.2 and Z3 4.16.0 from GitHub releases using `TARGETARCH` to select the correct binary per platform. The production stage installs `dotnet-runtime-8.0` from Ubuntu's built-in apt feed (no Microsoft feed required for Noble), copies the CVC5/Z3 binaries into `/usr/local/bin/`, and pre-seeds the NuGet package cache at `/home/nodejs/.nuget/packages` owned by the `nodejs` user.

The most critical research finding is that the **Microsoft package feed does not support ARM64** — only the Ubuntu Noble built-in apt feed can provide `dotnet-runtime-8.0` for both architectures with a single `apt install` command. Both CVC5 and Z3 have native ARM64 Linux binaries in their latest releases (CVC5 1.3.2 ARM64 is a true native binary; Z3 4.16.0 ARM64 fixed the previous bug where ARM64 release actually contained x86-64 code). The NuGet global packages path defaults to `~/.nuget/packages` and is overridable via `NUGET_PACKAGES` — setting it to `/home/nodejs/.nuget/packages` with correct ownership allows the `nodejs` user to write without permission errors.

**Primary recommendation:** Add a `solver-builder` stage and a `dotnet-builder` stage to the existing Dockerfile; install `.NET runtime 8.0` from the Ubuntu Noble apt feed in the production stage; copy solver binaries to `/usr/local/bin/`; and pre-seed NuGet at `/home/nodejs/.nuget/packages` set via `ENV NUGET_PACKAGES`.

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `mcr.microsoft.com/dotnet/sdk` | `10.0-noble` | Builder stage for compiling cs-fv CLI | Official multi-arch image; Noble base matches production; arm64 native |
| `dotnet-runtime-8.0` | via Ubuntu Noble apt | .NET runtime in production stage | cs-fv targets `net8.0` per `Directory.Build.props`; Noble built-in feed supports both amd64 and arm64 |
| CVC5 | `1.3.2` (latest stable, 2025-12-12) | SMT solver binary | cs-fv requires CVC5 as system binary on Linux; pre-built arm64 + x86_64 static binaries available |
| Z3 | `4.16.0` (latest stable, 2026-02-19) | SMT solver binary | cs-fv uses Microsoft.Z3 NuGet for native libs (osx/win only); Linux needs system binary on PATH |
| Docker BuildKit | `--platform` + `ARG TARGETARCH` | Multi-platform build | BuildKit automatically provides `TARGETARCH` (value: `amd64` or `arm64`) |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `unzip` / `curl` | system | Download + extract solver zips in solver-builder | Available in ubuntu:noble base |
| `NUGET_PACKAGES` env var | - | Override NuGet global packages path | Required to place cache where `nodejs` user owns it |
| `--platform=$BUILDPLATFORM` | BuildKit | Run SDK on native build machine architecture | Prevents QEMU emulation slowdown on Apple Silicon |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Ubuntu Noble apt for dotnet-runtime | Microsoft feed + apt | Microsoft feed does NOT support ARM64; Ubuntu feed handles both architectures automatically |
| Static solver binaries from GitHub | apt-get install cvc5 z3 | Ubuntu Noble apt has older solver versions; GitHub releases provide latest stable |
| Pre-seeded NuGet via `dotnet restore` | Mount cache at build time | Mount cache not persisted in image layer; COPY approach works offline at runtime |
| Separate solver-builder stage | Inline download in production | Solver-builder prevents `curl`/`unzip` tools from appearing in production layer |

## Architecture Patterns

### Recommended Stage Structure

```
Stage 1: node-builder         (existing — Node.js TypeScript build)
Stage 2: java-builder         (existing — Java FV CLI jar)
Stage 3: solver-builder       (NEW — download CVC5 + Z3 binaries)
Stage 4: dotnet-builder       (NEW — build + publish cs-fv CLI DLL, restore NuGet)
Stage 5: production           (existing — extended with .NET runtime + solver binaries + NuGet cache)
```

### Pattern 1: TARGETARCH-Based Binary Selection

**What:** Use BuildKit's auto-injected `TARGETARCH` ARG (values: `amd64`, `arm64`) in a shell `case` statement to select the correct download URL and archive name.

**When to use:** Whenever a GitHub release names assets differently per architecture.

**CVC5 naming convention:**
- amd64: `cvc5-Linux-x86_64-static.zip` → binary at `cvc5-Linux-x86_64-static/bin/cvc5`
- arm64: `cvc5-Linux-arm64-static.zip` → binary at `cvc5-Linux-arm64-static/bin/cvc5`

**Z3 naming convention:**
- amd64: `z3-4.16.0-x64-glibc-2.39.zip` → binary at `z3-4.16.0-x64-glibc-2.39/bin/z3`
- arm64: `z3-4.16.0-arm64-glibc-2.38.zip` → binary at `z3-4.16.0-arm64-glibc-2.38/bin/z3`

**Example:**
```dockerfile
# Source: GitHub API verified 2026-02-20
FROM --platform=$BUILDPLATFORM ubuntu:noble AS solver-builder
ARG TARGETARCH

RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Download CVC5
RUN case "$TARGETARCH" in \
      amd64) CVC5_ARCH=x86_64 ;; \
      arm64) CVC5_ARCH=arm64  ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/cvc5/cvc5/releases/download/cvc5-1.3.2/cvc5-Linux-${CVC5_ARCH}-static.zip" \
      -o /tmp/cvc5.zip && \
    unzip /tmp/cvc5.zip -d /tmp/cvc5 && \
    cp /tmp/cvc5/cvc5-Linux-${CVC5_ARCH}-static/bin/cvc5 /usr/local/bin/cvc5 && \
    chmod +x /usr/local/bin/cvc5

# Download Z3
RUN case "$TARGETARCH" in \
      amd64) Z3_ARCH=x64; Z3_GLIBC=glibc-2.39 ;; \
      arm64) Z3_ARCH=arm64; Z3_GLIBC=glibc-2.38 ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/Z3Prover/z3/releases/download/z3-4.16.0/z3-4.16.0-${Z3_ARCH}-${Z3_GLIBC}.zip" \
      -o /tmp/z3.zip && \
    unzip /tmp/z3.zip -d /tmp/z3 && \
    cp /tmp/z3/z3-4.16.0-${Z3_ARCH}-${Z3_GLIBC}/bin/z3 /usr/local/bin/z3 && \
    chmod +x /usr/local/bin/z3
```

### Pattern 2: dotnet-builder Stage with NuGet Pre-seeding

**What:** Use `mcr.microsoft.com/dotnet/sdk:10.0-noble` to build cs-fv CLI, then run `dotnet restore` on a minimal seed project to populate the NuGet global packages cache, which is then COPYed to production.

**Key facts verified:**
- `cs-fv` project: `src/CsFv.Cli/CsFv.Cli.csproj` in the `cs-fv` repository
- `AssemblyName` in CsFv.Cli.csproj is `cs-fv` — published DLL will be named `cs-fv.dll`
- Target framework: `net8.0` (from `Directory.Build.props`)
- The project requires these NuGet packages:
  - `System.CommandLine 2.0.0-beta4.22272.1`
  - `Microsoft.CodeAnalysis.CSharp 5.3.0-2.final` (+ transitive Roslyn packages)
  - `Microsoft.Z3 4.12.2` (via CsFv.Verification dependency)
  - `Microsoft.Data.Sqlite 8.0.0` (via CsFv.Core dependency)
  - `MinVer 7.0.0` (from Directory.Build.props, PrivateAssets=all)
  - `Microsoft.SourceLink.GitHub 8.0.0` (from Directory.Build.props, PrivateAssets=all)

**NuGet cache path strategy:**
- Default path for non-root users: `~/.nuget/packages` (i.e., `/home/nodejs/.nuget/packages` for the `nodejs` user)
- Set `ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages` in production stage
- In dotnet-builder: restore with `NUGET_PACKAGES=/nuget-cache` then COPY to production
- Ensure `chown -R nodejs:nodejs /home/nodejs/.nuget` in production stage (before `USER nodejs`)

**Example:**
```dockerfile
# Source: Official .NET docs + verified patterns
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-noble AS dotnet-builder

WORKDIR /build
ARG TARGETARCH

# Copy cs-fv source (build context must be monorepo root)
COPY cs-fv/ ./cs-fv/

# Build context: monorepo root; cs-fv/ at root of context
WORKDIR /build/cs-fv

# Set NuGet package cache to a known location we will COPY to production
ENV NUGET_PACKAGES=/nuget-packages

# Restore + publish cs-fv CLI (framework-dependent, net8.0)
RUN dotnet publish src/CsFv.Cli/CsFv.Cli.csproj \
      --configuration Release \
      --framework net8.0 \
      --output /publish/cs-fv \
      --no-self-contained

# NuGet cache is now at /nuget-packages (populated by restore during publish)
```

### Pattern 3: Production Stage Integration

**What:** Extend the existing production stage to install .NET runtime, copy solver binaries, copy NuGet cache, and configure paths.

**Key:** `dotnet-runtime-8.0` is available in Ubuntu Noble's built-in apt feed for BOTH amd64 and arm64. No Microsoft feed registration needed. The `eclipse-temurin:25-jre-noble` base is Ubuntu Noble (24.04), so `apt-get install -y dotnet-runtime-8.0` works directly.

**Example:**
```dockerfile
# In the existing production stage (eclipse-temurin:25-jre-noble)

# Install .NET 8 runtime (Ubuntu Noble built-in feed — supports both amd64 and arm64)
RUN apt-get update && \
    apt-get install -y dotnet-runtime-8.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy solver binaries from solver-builder stage
COPY --from=solver-builder /usr/local/bin/cvc5 /usr/local/bin/cvc5
COPY --from=solver-builder /usr/local/bin/z3   /usr/local/bin/z3

# Copy cs-fv DLL from dotnet-builder stage
COPY --from=dotnet-builder /publish/cs-fv /usr/local/lib/cs-fv

# Copy NuGet package cache from dotnet-builder
COPY --from=dotnet-builder /nuget-packages /home/nodejs/.nuget/packages

# Configure NuGet packages path (nodejs user reads from here at runtime)
ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages

# Fix ownership (must run before USER nodejs)
RUN chown -R nodejs:nodejs /home/nodejs/.nuget
```

### Anti-Patterns to Avoid

- **Using Microsoft apt feed for .NET ARM64:** The Microsoft package feed explicitly does not support ARM64; it only works for x64. Always use Ubuntu's built-in feed on Noble.
- **Running solver downloads in production stage:** Leaves `curl` and `unzip` in the final image. Use a dedicated `solver-builder` stage.
- **Using `--self-contained` for cs-fv publish:** Bundles the entire .NET runtime, adding ~100 MB per architecture. Use `--no-self-contained` and install `dotnet-runtime-8.0` separately.
- **Setting NUGET_PACKAGES without chown:** The `nodejs` user (uid 1001) cannot write to paths owned by root. Must `chown -R nodejs:nodejs` before switching to `USER nodejs`.
- **Omitting `--platform=$BUILDPLATFORM` on SDK stage:** Without this, Docker will QEMU-emulate the SDK for the target arch — extremely slow on Apple Silicon. Always use native build platform for compile stages.
- **Not pinning solver versions:** Using `latest` tag creates non-reproducible builds. Pin to `cvc5-1.3.2` and `z3-4.16.0`.
- **Using Z3 pre-4.13.2 ARM64 binaries:** Early ARM64 releases (e.g., 4.13.0) shipped x86-64 binaries mislabeled as ARM64. Issue was fixed in 4.13.2+. Version 4.16.0 is correct.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-arch binary selection | Custom platform detection scripts | `ARG TARGETARCH` from BuildKit | BuildKit injects `amd64`/`arm64` automatically; no custom logic needed |
| .NET runtime install | Compile from source, manual tarball | `apt-get install dotnet-runtime-8.0` | Ubuntu Noble built-in feed handles both arches; no extra apt sources needed |
| NuGet offline seeding | Copy individual .nupkg files | `dotnet restore`/`dotnet publish` populates the global cache naturally | NuGet's PackageReference format expands packages fully; the cache directory is the correct format |
| Solver binary PATH setup | Runtime path scripts | `COPY ... /usr/local/bin/` | `/usr/local/bin` is already on PATH in the base image |

**Key insight:** Docker BuildKit's `TARGETARCH` + `--platform=$BUILDPLATFORM` pattern handles everything needed for multi-arch builds without manual platform detection. Resist adding complexity.

## Common Pitfalls

### Pitfall 1: Microsoft .NET apt feed does not support ARM64

**What goes wrong:** Adding the Microsoft package repository and running `apt-get install dotnet-runtime-8.0` fails on ARM64 with "Package not found" or silently installs nothing.
**Why it happens:** Microsoft explicitly states only x64 is supported by their feed. ARM64 packages are not published there.
**How to avoid:** On Ubuntu Noble (24.04), simply run `apt-get install dotnet-runtime-8.0` — no extra apt sources needed. The Ubuntu built-in feed includes .NET 8.0 and .NET 10.0 for all supported architectures.
**Warning signs:** APT install step failing only in arm64 build, or "Package 'dotnet-runtime-8.0' has no installation candidate" error.

### Pitfall 2: NuGet cache owned by root, nodejs user gets EPERM

**What goes wrong:** At request time, `dotnet build` attempts to write to the NuGet cache (for temp files, lock files) and gets "Permission denied" because the cache was COPYed as root.
**Why it happens:** `COPY --from=builder` in Docker preserves source ownership but the COPY instruction runs as root. The `nodejs` user (uid 1001) cannot write to root-owned directories.
**How to avoid:** After COPY, run `chown -R nodejs:nodejs /home/nodejs/.nuget` before the `USER nodejs` instruction. Also set `ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages` so dotnet writes to this user-owned location at runtime.
**Warning signs:** `Permission denied` errors on NuGet cache path during `dotnet build` in the container.

### Pitfall 3: MinVer fails in Docker builder (no git history)

**What goes wrong:** `dotnet build/publish` fails in the Docker builder stage with a MinVer error because there is no `.git` directory in the Docker build context.
**Why it happens:** `Directory.Build.props` references MinVer 7.0.0 which derives version from git tags. Without git history, MinVer cannot determine the version.
**How to avoid:** Set `MINVER_SKIP=1` environment variable during the build, or set `<MinVerSkip>true</MinVerSkip>` MSBuild property. Alternatively, pass `-p:MinVerSkip=true` to the `dotnet publish` command.
**Warning signs:** Build failure mentioning "Could not find a .git directory" or MinVer version errors.

### Pitfall 4: Build context must include cs-fv directory

**What goes wrong:** `COPY cs-fv/ ./cs-fv/` fails with "COPY failed: file not found in build context" if Docker build context is set to the `languages-web-portal/` subdirectory.
**Why it happens:** Current Dockerfile uses `languages-web-portal/` as context prefix path. The monorepo root must be the Docker build context for cs-fv to be accessible.
**How to avoid:** Build with context at monorepo root (`/Users/alexanderfedin/Projects/hapyy/`). The existing Dockerfile already uses `COPY languages-web-portal/...` paths which confirms it is built from monorepo root.
**Warning signs:** "COPY failed: file not found in build context or excluded by .dockerignore" for any `cs-fv/` path.

### Pitfall 5: dotnet publish outputs apphost in addition to DLL

**What goes wrong:** The `dotnet publish` output for a console app includes both `cs-fv` (native executable) and `cs-fv.dll`. The DLL must be executed with `dotnet cs-fv.dll`; the native executable may not work if it was compiled for the wrong architecture.
**Why it happens:** `UseAppHost=true` by default creates a native wrapper executable. The success criterion uses `dotnet /usr/local/lib/cs-fv/cs-fv.dll` which is the correct invocation.
**How to avoid:** COPY the entire publish directory (not just the .dll) to `/usr/local/lib/cs-fv/` — all files are needed. Invoke with `dotnet /usr/local/lib/cs-fv/cs-fv.dll`.
**Warning signs:** `dotnet: Unable to find a matching assembly` if only the .dll is copied without its runtime dependencies.

### Pitfall 6: Z3 glibc version mismatch

**What goes wrong:** Z3 binary crashes at startup with "GLIBC_2.39 not found" or similar error on the arm64 platform.
**Why it happens:** Z3 4.16.0 x64 binary requires glibc 2.39; arm64 binary requires glibc 2.38. Ubuntu Noble has glibc 2.39 for both architectures, so both requirements are satisfied.
**How to avoid:** Ubuntu Noble (24.04) ships glibc 2.39 for all architectures. No action needed — the production base `eclipse-temurin:25-jre-noble` is Ubuntu Noble.
**Warning signs:** `GLIBC_X.XX not found` in z3 execution; verify with `ldd /usr/local/bin/z3`.

## Code Examples

Verified patterns from official sources:

### Complete solver-builder Stage

```dockerfile
# Source: GitHub API verified assets 2026-02-20 — cvc5/cvc5 tag cvc5-1.3.2, Z3Prover/z3 tag z3-4.16.0
FROM ubuntu:noble AS solver-builder
ARG TARGETARCH

RUN apt-get update && \
    apt-get install -y curl unzip && \
    rm -rf /var/lib/apt/lists/*

# CVC5 1.3.2 — static binary, no dynamic deps
RUN case "$TARGETARCH" in \
      amd64) CVC5_ARCH=x86_64 ;; \
      arm64) CVC5_ARCH=arm64  ;; \
      *) echo "Unsupported arch: $TARGETARCH" && exit 1 ;; \
    esac && \
    curl -fsSL \
      "https://github.com/cvc5/cvc5/releases/download/cvc5-1.3.2/cvc5-Linux-${CVC5_ARCH}-static.zip" \
      -o /tmp/cvc5.zip && \
    unzip -q /tmp/cvc5.zip -d /tmp/cvc5 && \
    install -m 0755 \
      "/tmp/cvc5/cvc5-Linux-${CVC5_ARCH}-static/bin/cvc5" \
      /usr/local/bin/cvc5 && \
    rm -rf /tmp/cvc5.zip /tmp/cvc5

# Z3 4.16.0 — dynamic binary; glibc 2.38 (arm64) / 2.39 (x64) — both satisfied by Noble
RUN case "$TARGETARCH" in \
      amd64) Z3_ARCH=x64;   Z3_GLIBC=glibc-2.39 ;; \
      arm64) Z3_ARCH=arm64; Z3_GLIBC=glibc-2.38  ;; \
      *) echo "Unsupported arch: $TARGETARCH" && exit 1 ;; \
    esac && \
    curl -fsSL \
      "https://github.com/Z3Prover/z3/releases/download/z3-4.16.0/z3-4.16.0-${Z3_ARCH}-${Z3_GLIBC}.zip" \
      -o /tmp/z3.zip && \
    unzip -q /tmp/z3.zip -d /tmp/z3 && \
    install -m 0755 \
      "/tmp/z3/z3-4.16.0-${Z3_ARCH}-${Z3_GLIBC}/bin/z3" \
      /usr/local/bin/z3 && \
    rm -rf /tmp/z3.zip /tmp/z3
```

### dotnet-builder Stage

```dockerfile
# Source: Microsoft .NET docs — https://learn.microsoft.com/en-us/dotnet/core/install/linux-ubuntu-install
# cs-fv project analysis 2026-02-20
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-noble AS dotnet-builder

ARG TARGETARCH

# cs-fv source (build context is monorepo root /hapyy/)
COPY cs-fv/ /build/cs-fv/
WORKDIR /build/cs-fv

# NuGet global packages location (will be COPYed to production)
ENV NUGET_PACKAGES=/nuget-packages

# MinVer requires git tags; skip in Docker context
# Publish framework-dependent net8.0 binary
RUN dotnet publish src/CsFv.Cli/CsFv.Cli.csproj \
      --configuration Release \
      --framework net8.0 \
      --output /publish/cs-fv \
      --no-self-contained \
      -p:MinVerSkip=true
# Note: dotnet restore runs implicitly as part of publish,
# populating /nuget-packages with all transitive dependencies
```

### Production Stage Extensions

```dockerfile
# Source: https://learn.microsoft.com/en-us/dotnet/core/install/linux-ubuntu-install (Ubuntu 24.04 section)
# In the existing production stage (eclipse-temurin:25-jre-noble = Ubuntu Noble):

# .NET 8 runtime — Ubuntu Noble built-in feed (NO Microsoft feed needed; supports amd64 + arm64)
RUN apt-get update && \
    apt-get install -y dotnet-runtime-8.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Solver binaries from dedicated solver-builder stage
COPY --from=solver-builder /usr/local/bin/cvc5 /usr/local/bin/cvc5
COPY --from=solver-builder /usr/local/bin/z3   /usr/local/bin/z3

# cs-fv published DLL from dotnet-builder stage
COPY --from=dotnet-builder /publish/cs-fv /usr/local/lib/cs-fv

# NuGet package cache from dotnet-builder (pre-seeded with all cs-fv dependencies)
COPY --from=dotnet-builder /nuget-packages /home/nodejs/.nuget/packages

# NuGet env var — must match the directory owned by nodejs
ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages

# ... (existing: mkdir /app/uploads, groupadd, useradd) ...

# Fix NuGet cache ownership BEFORE switching to nodejs user
RUN chown -R nodejs:nodejs /home/nodejs
```

### Docker Buildx Multi-Arch Build Command

```bash
# Source: https://docs.docker.com/build/building/multi-platform/
# Build context must be monorepo root
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --file languages-web-portal/Dockerfile \
  --tag hupyy/languages-web-portal:latest \
  --push \
  /Users/alexanderfedin/Projects/hapyy
```

### Verification Commands (success criteria)

```bash
# DOCKER-01: cs-fv DLL present and executable
docker run <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll
# Expected: usage message (exit 0 or exit 1 with help text)

# DOCKER-03: both solvers on PATH
docker run <image> sh -c "which cvc5 && which z3"
# Expected: /usr/local/bin/cvc5 and /usr/local/bin/z3

# DOCKER-04: offline dotnet build (no network)
docker run --network=none <image> dotnet build /tmp/test-project/test.csproj
# Expected: build succeeds using pre-seeded NuGet cache
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Microsoft apt feed for .NET | Ubuntu built-in apt feed (Noble) | Ubuntu 22.04+ | Microsoft feed only supports x64; Ubuntu feed supports both arches |
| Z3 pre-4.13.2 ARM64 "binary" | Z3 4.13.2+ true ARM64 binary | July 2024 (issue #7287 fixed) | Earlier "ARM64" releases were actually x86-64 mislabeled |
| `COPY --from` NuGet cache seeding | Same pattern, still current | - | Standard approach, no deprecation |
| `dotnet publish -r linux-musl-x64` (Alpine) | `dotnet publish --no-self-contained` + `dotnet-runtime-8.0` apt | - | Framework-dependent is smaller; SDK on Noble, runtime on Noble |

## Open Questions

1. **MinVer behavior with git submodules or shallow clone in Docker**
   - What we know: `MinVer` reads git tags; Docker COPY does not preserve `.git/`. Setting `-p:MinVerSkip=true` should bypass it.
   - What's unclear: Whether the `cs-fv/` COPY includes `.git/` if present in the monorepo (it typically would not be).
   - Recommendation: Always pass `-p:MinVerSkip=true` to `dotnet publish` in the Docker builder stage.

2. **NuGet packages needed for Phase 22 example project offline restore**
   - What we know: Phase 22 will create example `.csproj` files referencing the Hupyy FV analyzer NuGet package. These packages are not yet defined.
   - What's unclear: The exact NuGet package name and version for `CsFv.Analyzers` / `CsFv.Contracts` when published.
   - Recommendation: Pre-seed by restoring `CsFv.Cli` itself (which transitively pulls all cs-fv packages including Microsoft.Z3, Microsoft.CodeAnalysis.CSharp, System.CommandLine, Microsoft.Data.Sqlite). Additional packages for example projects will be added in Phase 22 if they are separate NuGet packages.

3. **Z3 dynamic library dependency (`libz3.so`) for Z3 NuGet package**
   - What we know: `Microsoft.Z3 4.12.2` NuGet package only includes native libs for `osx-x64` and `win-x64`. On Linux, cs-fv calls Z3 via the system binary (CLI), not via the NuGet native library.
   - What's unclear: Whether the `Microsoft.Z3` NuGet package attempts to load `libz3.so` on Linux and fails, or gracefully falls back to CLI.
   - Recommendation: Copy only the `z3` executable to `/usr/local/bin/`; the Z3 zip also contains `libz3.so` but it is not needed in PATH. Verify this assumption by running `docker run <image> dotnet /usr/local/lib/cs-fv/cs-fv.dll` and checking for any native library load errors.

## Sources

### Primary (HIGH confidence)

- GitHub API `api.github.com/repos/cvc5/cvc5/releases/latest` — verified CVC5 1.3.2 release assets (2026-02-20): Linux arm64 + x86_64 static zips with binary at `bin/cvc5`
- GitHub API `api.github.com/repos/Z3Prover/z3/releases/latest` — verified Z3 4.16.0 release assets (2026-02-20): `arm64-glibc-2.38.zip` and `x64-glibc-2.39.zip` with binary at `bin/z3`
- [Microsoft .NET Ubuntu install docs](https://learn.microsoft.com/en-us/dotnet/core/install/linux-ubuntu-install) — confirmed Ubuntu Noble built-in feed provides `dotnet-runtime-8.0` for all arches; Microsoft feed is x64-only
- [NuGet global packages docs](https://learn.microsoft.com/en-us/nuget/consume-packages/managing-the-global-packages-and-cache-folders) — confirmed `NUGET_PACKAGES` env var overrides global packages path; default `~/.nuget/packages`
- cs-fv source code — `Directory.Build.props` confirms `net8.0` target; `CsFv.Cli.csproj` confirms `AssemblyName=cs-fv`; all NuGet dependencies enumerated
- MCR tag registry — confirmed `mcr.microsoft.com/dotnet/sdk:10.0-noble` exists with amd64 and arm64v8 support
- [Docker multi-platform docs](https://docs.docker.com/build/building/multi-platform/) — confirmed `TARGETARCH` BuildKit variable and `--platform=$BUILDPLATFORM` pattern

### Secondary (MEDIUM confidence)

- [Z3 ARM64 bug issue #7287](https://github.com/Z3Prover/z3/issues/7287) — confirmed fix landed in 4.13.2+; 4.16.0 contains correct ARM64 binary
- [.NET Docker cross-compilation guide](https://www.docker.com/blog/faster-multi-platform-builds-dockerfile-cross-compilation-guide/) — `TARGETARCH` mapping pattern (`amd64` → needs renaming for CVC5 `x86_64`)

### Tertiary (LOW confidence)

- None. All critical claims verified against official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via GitHub API and official docs
- Architecture patterns: HIGH — extracted from actual asset names and official Microsoft docs
- Pitfalls: HIGH (Microsoft ARM64 gap, Z3 bug history) / MEDIUM (MinVer behavior) — most verified from official sources or confirmed issues

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (solver versions may update; .NET packages are stable)
