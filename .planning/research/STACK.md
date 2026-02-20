# Stack Research

**Domain:** C# Formal Verification tool integration — .NET SDK + Roslyn analyzer added to existing Java FV portal
**Researched:** 2026-02-20
**Confidence:** HIGH (core .NET/Docker facts from official sources); MEDIUM (wrapper script pattern inferred from Java FV analogy + dotnet build docs)

---

## Context: What Already Exists (Do NOT Re-research)

The portal already has a proven integration pattern from Java FV (v1.1):

| Existing Capability | File | Notes |
|---------------------|------|-------|
| 3-stage Docker build | `Dockerfile` | Stage 1: node-builder, Stage 2: java-builder, Stage 3: eclipse-temurin:25-jre-noble production |
| Wrapper script pattern | `scripts/hupyy-java-verify.sh` | `exec` replaces shell; `--input <path>` interface; validates inputs; collects files |
| Tool registry entry | `packages/server/src/config/toolRegistry.ts` | `csharp-verification` entry already declared with `available: false` |
| execa subprocess + SSE streaming | `packages/server/src/services/executionService.ts` | No changes needed; works with any CLI that writes to stdout/stderr |

This research covers ONLY the new additions required for v1.3.

---

## Recommended Stack — New Additions Only

### Core Technologies (New)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| .NET SDK | **10.0** (`mcr.microsoft.com/dotnet/sdk:10.0-noble`) | `dotnet build` runtime that triggers Roslyn analyzers | .NET 10 is the current LTS (released Nov/Dec 2025, supported until Nov 2028). .NET 8 EOL Nov 2026 — only 9 months away. .NET 9 STS also EOL Nov 2026. .NET 10 gives maximum runway. Ubuntu Noble is the new default for .NET 10 Docker images (Debian dropped). The existing production stage uses `eclipse-temurin:25-jre-noble` (Ubuntu Noble) — same OS, so COPY of `/usr/share/dotnet` between stages is safe. |
| `dotnet build` CLI | Built into .NET 10 SDK | Trigger Roslyn analyzer execution against user-uploaded C# source | Roslyn analyzers run automatically as part of `dotnet build`. No separate invocation needed. Exits with code 1 when analyzer reports error-severity diagnostics. `--nologo`, `--tl:off`, `--verbosity minimal` flags clean up output for SSE streaming. |
| NuGet `PackageReference` (csproj) | SDK-included | Reference the Hupyy C# FV analyzer package inside the generated temp `.csproj` | Standard Roslyn analyzer distribution mechanism. With `IncludeAssets=analyzers` and `PrivateAssets=all`, the package activates during build without becoming a runtime output dependency. |

### Supporting Environment Variables and Flags

| Addition | Value | Purpose | When Required |
|----------|-------|---------|---------------|
| `DOTNET_NOLOGO` env var | `1` | Suppress .NET welcome banner in streaming output | Always — keeps SSE console output clean for users |
| `DOTNET_CLI_TELEMETRY_OPTOUT` env var | `1` | Prevent network calls to Microsoft telemetry during `dotnet build` | Always in Docker — avoids latency and DNS failures in isolated containers |
| `NUGET_PACKAGES` env var | `/usr/local/share/nuget/packages` | Pin global NuGet cache to a known path for Docker layer pre-warming | Set at Docker build time so `dotnet restore` caches the analyzer package into an image layer; not a per-user home directory |
| `--tl:off` dotnet flag | (flag) | Disable Terminal Logger (fancy ANSI progress bars emitted by .NET 8+) | Required in non-TTY contexts. Without it, .NET 8+ emits ANSI escape codes that corrupt SSE text output in the browser console. |
| `--verbosity minimal` dotnet flag | (flag) | Reduce MSBuild output to warnings and errors only | Default `normal` verbosity emits dozens of target evaluation lines irrelevant to verification results |
| `--no-restore` dotnet flag | (flag) | Skip NuGet restore (use pre-warmed cache from image layer) | Use in the wrapper script — avoids network calls at user-request time; packages must be pre-warmed during `docker build` |
| `CodeAnalysisTreatWarningsAsErrors=true` csproj property | (MSBuild property) | Analyzer-reported diagnostics cause exit code 1; ordinary compiler warnings do not | Use this instead of `TreatWarningsAsErrors=true` — the latter also escalates unrelated compiler warnings in user code, causing false failures |

### Development Tools (No New npm Packages Needed)

| Tool | Purpose | Notes |
|------|---------|-------|
| `bash` wrapper script `hupyy-csharp-verify.sh` | Bridge `--input <path>` portal interface to `dotnet build` | Same pattern as `hupyy-java-verify.sh`; generates temp `.csproj`, invokes `dotnet build`, cleans up |
| `mktemp -d` | Create isolated temp build directory per invocation | Prevents cross-contamination between concurrent portal users; each build gets its own `.csproj` + output dir |
| `trap 'rm -rf "$TEMP_DIR"' EXIT` | Guarantee temp directory cleanup on script exit (success or failure) | Critical — portal sessions are ephemeral; DigitalOcean disk space is finite |

---

## Docker Integration Design

The existing 3-stage Dockerfile becomes **4-stage**. A new `.NET SDK pre-warmer` stage downloads the SDK and pre-warms the analyzer NuGet package into a named cache layer. Only the dotnet binary and the package cache are COPY'd into the production stage — not the full SDK (~800MB).

### New Stage: `dotnet-warmer`

```dockerfile
# Stage 3: .NET SDK NuGet pre-warmer (new for v1.3)
# Purpose: Download the Hupyy C# FV analyzer NuGet package into a named
# Docker layer so dotnet build never makes network calls at request time.
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS dotnet-warmer

ENV DOTNET_NOLOGO=1
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
ENV NUGET_PACKAGES=/usr/local/share/nuget/packages

# Generate a minimal dummy project referencing the analyzer,
# restore it (downloads the package into $NUGET_PACKAGES),
# discard the project. Only the package cache layer is retained.
RUN mkdir /tmp/dummy-csharp && \
    cat > /tmp/dummy-csharp/dummy.csproj <<'EOF'
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <OutputType>Library</OutputType>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Hupyy.CSharp.Verification" Version="*">
      <IncludeAssets>analyzers</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>
</Project>
EOF
RUN echo '<cs />' > /tmp/dummy-csharp/dummy.cs && \
    dotnet restore /tmp/dummy-csharp/dummy.csproj && \
    rm -rf /tmp/dummy-csharp
```

### Changes to Existing Production Stage

Add after the Java FV jar COPY, before the Node.js install:

```dockerfile
# Copy .NET runtime from dotnet-warmer (not the full SDK — runtime only)
COPY --from=dotnet-warmer /usr/share/dotnet /usr/share/dotnet
RUN ln -sf /usr/share/dotnet/dotnet /usr/local/bin/dotnet

# Copy pre-warmed NuGet package cache (analyzer package already downloaded)
COPY --from=dotnet-warmer /usr/local/share/nuget/packages /usr/local/share/nuget/packages

# Install C# FV wrapper script
COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify
RUN chmod +x /usr/local/bin/hupyy-csharp-verify
```

**Why COPY the full dotnet from SDK image rather than installing the runtime package?**
The production stage is Ubuntu Noble (same as `dotnet/sdk:10.0-noble`). COPY from the SDK image gives both the runtime and the `dotnet` host binary needed to invoke `dotnet build`. Installing `dotnet-runtime-10.0` via apt requires configuring Microsoft's apt feed — extra curl/gpg steps that add image-build complexity and a dependency on Microsoft's apt infrastructure.

---

## Wrapper Script Pattern

The `hupyy-csharp-verify` script follows the identical structure as `hupyy-java-verify.sh`:

```bash
#!/bin/bash
set -euo pipefail

# Wrapper for C# FV — bridges portal interface to dotnet build + Roslyn analyzer
# Interface: hupyy-csharp-verify --input <projectPath>
# Invokes:   dotnet build <temp-project> (with Hupyy.CSharp.Verification analyzer)

DOTNET_BIN="${DOTNET_CMD:-/usr/local/bin/dotnet}"
ANALYZER_PKG="${CSHARP_FV_PACKAGE:-Hupyy.CSharp.Verification}"
ANALYZER_VER="${CSHARP_FV_VERSION:-*}"

export DOTNET_NOLOGO=1
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export NUGET_PACKAGES="${NUGET_PACKAGES:-/usr/local/share/nuget/packages}"

# Parse arguments (same contract as hupyy-java-verify)
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  echo "Usage: hupyy-csharp-verify --input <projectPath>" >&2
  exit 1
fi

PROJECT_PATH="$2"

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Error: Project path does not exist: $PROJECT_PATH" >&2
  exit 1
fi

if ! find "$PROJECT_PATH" -name "*.cs" -type f | grep -q .; then
  echo "Error: No .cs files found in $PROJECT_PATH" >&2
  echo "C# verification requires at least one .cs source file" >&2
  exit 1
fi

# Create isolated temp dir; always clean up on exit
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

# Generate .csproj that compiles user's .cs files with the analyzer
cat > "$TEMP_DIR/verify.csproj" <<EOF
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <OutputType>Library</OutputType>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="$PROJECT_PATH/**/*.cs" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="$ANALYZER_PKG" Version="$ANALYZER_VER">
      <IncludeAssets>analyzers</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>
</Project>
EOF

# Execute dotnet build — stdout/stderr stream automatically via execa (SSE picks it up)
# exec replaces the shell process for clean signal propagation (same as Java FV wrapper)
exec "$DOTNET_BIN" build "$TEMP_DIR/verify.csproj" \
  --tl:off \
  --verbosity minimal \
  --no-restore \
  --output "$TEMP_DIR/out"
```

**Key design decisions in wrapper:**

| Decision | Rationale |
|----------|-----------|
| `exec` replaces shell | Same clean signal handling as Java FV wrapper; no zombie shell process |
| `--no-restore` | Uses pre-warmed NuGet cache from Docker image layer; no network at request time |
| `CodeAnalysisTreatWarningsAsErrors=true` | Analyzer diagnostics escalate to error/exit-1; ordinary C# compiler warnings in user code do not block build |
| `<Compile Include="$PROJECT_PATH/**/*.cs" />` | Collects all uploaded .cs files; no solution file required from user |
| `--output "$TEMP_DIR/out"` | Build artifacts stay in temp dir; auto-cleaned on exit via `trap` |
| `--tl:off` | Disables ANSI terminal logger (required for non-TTY execa subprocess); .NET 8+ emits ANSI by default |
| `TEMP_DIR` per invocation | Concurrent portal users each get an isolated build context; no cross-contamination |

---

## toolRegistry.ts Change Required

The existing `csharp-verification` entry already exists. Two values change:

```typescript
// Current (available: false, 60s timeout):
{
  id: 'csharp-verification',
  command: '/usr/local/bin/hupyy-csharp-verify',
  defaultArgs: ['--input'],
  maxExecutionTimeMs: 60000,
  available: false,
}

// Required for v1.3 (available: true, 180s timeout):
{
  id: 'csharp-verification',
  command: process.env.CSHARP_FV_CMD ?? '/usr/local/bin/hupyy-csharp-verify',
  defaultArgs: ['--input'],
  maxExecutionTimeMs: 180000,
  available: true,
}
```

**Why 180000ms (3 minutes)?** `dotnet build` with a Roslyn analyzer involves MSBuild startup, C# compilation, and analyzer execution. Even with pre-warmed NuGet packages, first invocation on a cold Docker container typically takes 60-120 seconds due to MSBuild initialization overhead. Java FV uses 120s; dotnet build is heavier. 180s gives a safety margin.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `dotnet/sdk:10.0-noble` | `dotnet/sdk:8.0-noble` (.NET 8 LTS) | .NET 8 EOL Nov 2026 — 9 months away at time of research; .NET 10 LTS gives 3 more years |
| `dotnet/sdk:10.0-noble` | `dotnet/sdk:9.0` (.NET 9 STS) | STS, EOL Nov 2026 — same short runway as .NET 8, no advantage |
| Generate temp `.csproj` in wrapper | Require user-provided `.csproj` | Users upload raw .cs files; requiring a csproj breaks "zero local setup" value proposition |
| `<Compile Include=".../**/*.cs" />` glob in csproj | `dotnet-script` / Roslyn scripting API | `dotnet build` is the canonical Roslyn analyzer trigger; custom host would require reimplementing MSBuild integration without benefit |
| COPY dotnet binary from SDK image | `apt-get install dotnet-runtime-10.0` | Requires Microsoft apt feed configuration in production stage (extra curl/gpg steps); COPY from official MCR image is simpler |
| Pre-warm NuGet in Docker build stage | Download NuGet at request time | Network calls inside `dotnet build` during user requests add 5-30s latency and can fail if nuget.org is unreachable |
| `CodeAnalysisTreatWarningsAsErrors=true` | `TreatWarningsAsErrors=true` | The latter escalates all compiler warnings including unrelated ones in user code, causing false build failures |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `dotnet-sdk` via `apt-get` in production stage | Requires Microsoft apt repo setup (extra complexity); apt feed availability is an external dependency | COPY `/usr/share/dotnet` from `dotnet/sdk:10.0-noble` stage |
| Full `.NET SDK` image as new production base | Would replace `eclipse-temurin:25-jre-noble` — Java FV requires the JRE; can't use both bases | Add dotnet binary into existing Java-based production stage |
| `shell: true` in execa for dotnet invocation | Command injection risk (documented security constraint in `executionService.ts`) | No change needed; dotnet binary path is not user-controlled |
| `dotnet-script` or `csi.exe` | Different execution model from Roslyn analyzer build; inconsistent with how C# FV works | `dotnet build` with generated csproj |
| `Microsoft.Build` / Buildalyzer in Node.js server | Adds significant native dependency surface to the TypeScript server | bash wrapper script — keeps pattern identical to Java FV |
| Separate `dotnet restore` call in wrapper script | Makes wrapper stateful and slower (two child processes) | Pre-warm in Docker image; `--no-restore` in wrapper |
| Roslyn APIs directly via Node.js FFI | No mature FFI binding for Roslyn; Microsoft.CodeAnalysis is .NET-only | `dotnet build` CLI invocation |

---

## Version Compatibility

| Component | Requirement | Compatible With | Notes |
|-----------|-------------|-----------------|-------|
| `mcr.microsoft.com/dotnet/sdk:10.0-noble` | Ubuntu 24.04 "Noble Numbat" | `eclipse-temurin:25-jre-noble` production base | Same OS — COPY of `/usr/share/dotnet` is safe; same libc version |
| `net10.0` TargetFramework in temp csproj | .NET 10 SDK | SDK `10.0-noble` image | Must match SDK installed in Docker stage; mismatching causes "framework not found" error |
| `TreatWarningsAsErrors=false` + `CodeAnalysisTreatWarningsAsErrors=true` | .NET 5+ | Any .NET SDK version | `CodeAnalysisTreatWarningsAsErrors` is the analyzer-specific override; available since .NET 5 |
| `--tl:off` flag | .NET 8 SDK+ | `10.0` | Not available in .NET 7 or earlier; required for non-TTY processes to suppress ANSI escape codes |
| `--no-restore` flag | All .NET SDK versions | `10.0` | Works when NUGET_PACKAGES dir already contains the required packages |
| `IncludeAssets=analyzers`, `PrivateAssets=all` | NuGet PackageReference | All .NET SDK versions | Standard convention for analyzer-only packages per NuGet Analyzer Conventions docs |

---

## Sources

- [mcr.microsoft.com/dotnet/sdk — Microsoft Artifact Registry](https://mcr.microsoft.com/en-us/product/dotnet/sdk/about) — Image tag `10.0-noble` confirmed (HIGH confidence)
- [Default .NET container tags now use Ubuntu — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/compatibility/containers/10.0/default-images-use-ubuntu) — Noble as default, Debian discontinued for .NET 10 (HIGH confidence, official docs)
- [dotnet build command — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build) — `--tl:off`, `--nologo`, `--no-restore`, `--verbosity minimal`, exit codes documented (HIGH confidence, updated 2025-12-17)
- [.NET Compiler Platform Analyzer Formats for NuGet — Microsoft Learn](https://learn.microsoft.com/en-us/nuget/guides/analyzers-conventions) — `IncludeAssets=analyzers`, `PrivateAssets=all` pattern (HIGH confidence, official docs)
- [.NET Support Policy — dotnet.microsoft.com](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core) — .NET 10 LTS EOL Nov 2028, .NET 8/9 EOL Nov 2026 (HIGH confidence)
- [.NET 10.0 Container Images Now Available — dotnet/dotnet-docker Discussion #6801](https://github.com/dotnet/dotnet-docker/discussions/6801) — GA confirmed (HIGH confidence)
- [TreatWarningsAsErrors vs CodeAnalysisTreatWarningsAsErrors — dotnet/roslyn Issue #16535](https://github.com/dotnet/roslyn/issues/16535) — Behavior distinction for analyzer diagnostics (MEDIUM confidence, GitHub issue)
- Existing `Dockerfile` and `scripts/hupyy-java-verify.sh` in this repo — wrapper script and Docker stage pattern basis (HIGH confidence, first-party)

---

*Stack research for: C# Formal Verification tool integration (v1.3 milestone)*
*Researched: 2026-02-20*
