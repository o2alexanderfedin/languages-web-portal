# Architecture Research

**Domain:** CLI Tool Execution Web Portal — C# Formal Verification Integration
**Researched:** 2026-02-20
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │   Upload    │  │  Terminal   │  │   Download   │            │
│  │  Component  │  │  Component  │  │   Component  │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘            │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          │                                      │
│                    RTK Query (API calls)                        │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP/SSE
┌──────────────────────────┼──────────────────────────────────────┐
│                    Express Server (Node.js 22)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ /upload  │  │ /execute │  │ /stream  │  │  /examples   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │             │             │               │             │
│  ┌────▼─────────────▼─────────────▼───────────────▼──────┐     │
│  │   Services: executionService, queueService,            │     │
│  │   streamService, projectService, exampleService        │     │
│  └────────────────────────┬───────────────────────────────┘     │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────┐     │
│  │              toolRegistry (config/toolRegistry.ts)      │     │
│  │  id → { command, defaultArgs, maxExecutionTimeMs,       │     │
│  │          available }                                     │     │
│  └────────────────────────┬───────────────────────────────┘     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ execa (subprocess, no shell)
┌───────────────────────────┼─────────────────────────────────────┐
│                    Container (Docker)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              /usr/local/bin/ wrapper scripts              │   │
│  │  hupyy-java-verify (bash)  │  hupyy-csharp-verify (bash) │   │
│  └───────────┬────────────────┴──────────────┬──────────────┘   │
│              │                               │                  │
│  ┌───────────▼──────────┐    ┌───────────────▼──────────────┐   │
│  │  java -jar           │    │  dotnet /usr/local/lib/       │   │
│  │  java-fv-cli.jar     │    │  cs-fv/cs-fv.dll verify       │   │
│  │  verify *.java       │    │  <file.cs>                    │   │
│  └──────────────────────┘    └───────────────────────────────┘   │
│              │                               │                  │
│  ┌───────────▼──────────┐    ┌───────────────▼──────────────┐   │
│  │  JDK 25 (JRE noble)  │    │  .NET SDK 8.0 runtime +       │   │
│  │  Z3 (z3-turnkey jar) │    │  CVC5 binary (/usr/local/bin) │   │
│  └──────────────────────┘    │  Z3 CLI binary (fallback)     │   │
│                               └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| toolRegistry.ts | Maps tool IDs to CLI commands, timeout, availability flag | TypeScript Map, read by executionService |
| executionService.ts | Runs wrapper script via execa, streams stdout/stderr, returns status | `execa(command, args, { all: true, buffer: false })` |
| hupyy-csharp-verify | Adapts `--input <dir>` to `cs-fv verify <file> [files...]` | Bash script finding *.cs, invoking cs-fv CLI |
| cs-fv CLI | The actual C# FV tool — Roslyn analysis + CVC5/Z3 SMT solving | Pre-built .NET self-contained publish artifact |
| CVC5 binary | SMT solver for contracts — installed system-wide | `/usr/local/bin/cvc5` via apt or manual install |
| Z3 CLI (fallback) | Z3 as CLI process when Microsoft.Z3 library has no Linux native lib | `/usr/local/bin/z3` via apt package |
| examples/csharp-verification/ | 3 C# example projects used in demo dropdown | Directory of .cs files, each with README.md |

## Recommended Project Structure

### New Files (v1.3)

```
languages-web-portal/
└── scripts/
    └── hupyy-csharp-verify.sh       # NEW: C# FV wrapper script

packages/server/examples/
└── csharp-verification/             # MODIFY: Add FV contracts to existing .cs files
    ├── null-check/
    │   ├── Program.cs               # MODIFY: add [Requires]/[Ensures] + using CsFv.Contracts
    │   └── README.md                # Keep as-is
    ├── array-bounds/
    │   ├── Program.cs               # MODIFY: add [Requires]/[Ensures] + using CsFv.Contracts
    │   └── README.md                # Keep as-is
    └── division-safety/
        ├── Program.cs               # MODIFY: add [Requires]/[Ensures] + using CsFv.Contracts
        └── README.md                # Keep as-is

packages/shared/src/constants/
└── tools.ts                         # MODIFY: csharp-verification status → 'available'

packages/server/src/config/
└── toolRegistry.ts                  # MODIFY: csharp-verification available → true, timeout → 120000

Dockerfile                           # MODIFY: add .NET SDK stage + CVC5 install in production stage
```

### Modified Files (v1.3)

```
Dockerfile                           # MODIFY: 3 changes (see Docker section below)
scripts/hupyy-csharp-verify.sh       # NEW
packages/server/examples/csharp-verification/*/Program.cs  # MODIFY: add FV contracts
packages/shared/src/constants/tools.ts  # MODIFY: status field
packages/server/src/config/toolRegistry.ts  # MODIFY: available + timeout
```

### Structure Rationale

- **scripts/hupyy-csharp-verify.sh:** Mirrors hupyy-java-verify.sh pattern. Bash adapter script, installed to `/usr/local/bin/hupyy-csharp-verify` in Docker. Translates portal's `--input <dir>` interface into `dotnet /path/cs-fv.dll verify <files...>`.
- **examples/csharp-verification/:** Three existing examples already exist but have no FV contracts. They need `using CsFv.Contracts;` and `[Requires]`/`[Ensures]` attributes added to demonstrate real verification, not just null-safety patterns.
- **toolRegistry.ts:** Single source of truth for availability and timeout. Changing `available: false` to `available: true` and `maxExecutionTimeMs: 60000` to `120000` is the only server-side change beyond the wrapper script.
- **tools.ts (shared):** Status drives the UI badge. `'in-development'` → `'available'` unlocks the tool in the frontend.

## Architectural Patterns

### Pattern 1: Wrapper Script Adapter (Java FV pattern, replicated for C#)

**What:** A bash script at `/usr/local/bin/hupyy-<tool>-verify` adapts the portal's generic `--input <projectPath>` interface to whatever the actual CLI tool requires.

**When to use:** Any time the tool CLI has a different argument shape than `--input <dir>`.

**Trade-offs:** Simple, language-agnostic, easy to test manually. Cannot stream incremental output from the tool itself if the tool buffers; cs-fv CLI outputs incrementally per-method which works well.

**Example (hupyy-csharp-verify.sh):**
```bash
#!/bin/bash
set -euo pipefail

# Wrapper for C# FV CLI - bridges portal interface to cs-fv command
# Interface: hupyy-csharp-verify --input <path>
# Invokes:   dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <file1> [file2...]

CSFV_DLL="${CSFV_DLL:-/usr/local/lib/cs-fv/cs-fv.dll}"
DOTNET_BIN="${DOTNET_HOME:+$DOTNET_HOME/bin/}dotnet"

if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  echo "Usage: hupyy-csharp-verify --input <projectPath>" >&2
  exit 1
fi

PROJECT_PATH="$2"

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Error: Project path does not exist: $PROJECT_PATH" >&2
  exit 1
fi

# Find all .cs files (excluding bin/ obj/ directories)
CS_FILES=()
while IFS= read -r -d '' file; do
  CS_FILES+=("$file")
done < <(find "$PROJECT_PATH" \
  -name "*.cs" -type f \
  -not -path "*/bin/*" \
  -not -path "*/obj/*" \
  -print0)

if [[ ${#CS_FILES[@]} -eq 0 ]]; then
  echo "Error: No .cs files found in $PROJECT_PATH" >&2
  echo "C# verification requires at least one .cs source file" >&2
  exit 1
fi

# Execute cs-fv CLI - output streams naturally to stdout/stderr
exec "$DOTNET_BIN" "$CSFV_DLL" verify "${CS_FILES[@]}"
```

### Pattern 2: Docker Multi-Stage Build for Multiple Runtimes

**What:** Each runtime dependency (JDK, .NET) has its own builder stage or is installed in the production stage. Builder stages produce artifacts (jars, published .NET DLLs). Production stage installs only runtimes, not SDKs.

**When to use:** When the container needs multiple language runtimes (Java + .NET + Node.js).

**Trade-offs:** Larger production image than single-runtime. Alternative (separate containers per tool) is over-engineering for 5-20 concurrent users.

**Example Docker stage structure for v1.3:**
```dockerfile
# Stage 1: Node.js Builder (unchanged)
FROM node:22-alpine AS node-builder
# ... build TypeScript + React

# Stage 2: Java Builder (unchanged)
FROM eclipse-temurin:25-jdk AS java-builder
# ... build java-fv-cli.jar with Maven

# Stage 3: .NET Builder (NEW)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-builder
WORKDIR /build
COPY cs-fv/ .
RUN dotnet publish src/CsFv.Cli/CsFv.Cli.csproj \
    -c Release \
    -o /out/cs-fv \
    --self-contained false
# Result: /out/cs-fv/cs-fv.dll + all dependent DLLs

# Stage 4: Production (MODIFY — was Stage 3)
FROM eclipse-temurin:25-jre-noble AS production
# Install Node.js 22 (existing)
# Install .NET 8.0 runtime (NEW — NOT SDK, runtime only)
RUN apt-get update && \
    apt-get install -y dotnet-runtime-8.0 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
# Install CVC5 (NEW — required by cs-fv as primary solver)
# Install Z3 (NEW — required by cs-fv as fallback solver)
RUN apt-get update && \
    apt-get install -y z3 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
# Note: CVC5 may need manual install if not in apt
```

### Pattern 3: Tool Registry as Single Gate for Availability

**What:** `toolRegistry.ts` is the single authoritative place that determines whether a tool responds to execution requests. Setting `available: false` makes the tool unusable regardless of whether the binary exists on disk.

**When to use:** During phased rollout — binary can be deployed but not exposed until `available: true`.

**Trade-offs:** Simple boolean gate. No version-awareness or health-check. Sufficient for this portal's scope.

## Data Flow

### C# Verification Request Flow

```
User selects "C# Verification" tool + example/upload
    ↓
React: POST /api/execute { toolId: 'csharp-verification', projectId }
    ↓
execute.ts route: validates body, resolves projectPath, generates jobId
    ↓
queueService.addJob() → executionService.executeJob()
    ↓
execa('/usr/local/bin/hupyy-csharp-verify', ['--input', projectPath])
    ↓
hupyy-csharp-verify.sh: finds *.cs files, runs:
  dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <files...>
    ↓
cs-fv CLI: Roslyn parses C#, extracts [Requires]/[Ensures] contracts
    ↓
cs-fv: generates SMT-LIB2 formulas → invokes CVC5 binary (primary)
       or Z3 CLI (fallback for array theories)
    ↓
Each method result printed to stdout as it completes (streaming)
    ↓
executionService: onOutput callback → streamService.sendOutput(jobId, line)
    ↓
SSE: GET /api/stream/:jobId → client receives real-time console output
    ↓
cs-fv exits 0 (all verified) or 1 (some failed)
    ↓
executionService: status = 'completed' or 'failed'
    ↓
streamService.sendComplete(jobId, result)
    ↓
React: console shows all output, execution status shown
```

### State Management

```
Redux Store
    ↓ (subscribe)
ToolPicker → selects toolId → URL param pre-selection (shareable links)
ExampleSelector → loads example → POST /api/examples/:toolId/:example → projectId
UploadZone → uploads zip → POST /api/upload → projectId
ExecuteButton → POST /api/execute → jobId
Terminal ← SSE /api/stream/:jobId ← real-time output lines
```

### Key Data Flows

1. **Example loading for C#:** `GET /api/examples/csharp-verification` → lists null-check/array-bounds/division-safety → user picks one → `POST /api/examples/csharp-verification/null-check` → copies files to temp dir → returns projectId.
2. **CVC5 solver invocation:** cs-fv CLI writes SMT-LIB2 to temp file or stdin → spawns `cvc5 --lang=smt2 <file>` subprocess → parses "sat"/"unsat" from stdout → maps to Verified/Failed/Counterexample.
3. **Z3 fallback invocation:** cs-fv CLI detects array theories → uses Z3CliStrategy → spawns `z3 -smt2 -in` subprocess with SMT piped to stdin.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-20 users (current) | Single container, p-queue concurrency, 120s timeout — no changes needed |
| 20-100 users | Increase p-queue concurrency limit, add memory monitoring, possibly queue visible to users |
| 100+ users | Horizontal scaling requires shared session storage; current ephemeral /app/uploads is per-container |

### Scaling Priorities

1. **First bottleneck:** CVC5 CPU saturation. Each verification is CPU-intensive; concurrent verifications compete. Mitigation: p-queue concurrency capped at CPU cores, queue status visible to users.
2. **Second bottleneck:** Docker image size. Adding .NET SDK + CVC5 + Z3 increases image. Mitigation: use `dotnet-runtime` (not SDK) in production; `--self-contained false` publish for cs-fv.

## Integration Points

### New vs Modified Components (v1.3)

| Component | Status | Change |
|-----------|--------|--------|
| `scripts/hupyy-csharp-verify.sh` | NEW | Create wrapper script following hupyy-java-verify.sh pattern |
| `Dockerfile` Stage 3 (.NET builder) | NEW | Add `dotnet-builder` stage before production |
| `Dockerfile` production stage: .NET runtime install | NEW | `apt-get install -y dotnet-runtime-8.0` |
| `Dockerfile` production stage: CVC5 + Z3 install | NEW | Install solver binaries |
| `Dockerfile` production: copy cs-fv publish | NEW | `COPY --from=dotnet-builder /out/cs-fv /usr/local/lib/cs-fv` |
| `Dockerfile` production: install wrapper script | NEW | `COPY scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify` |
| `packages/server/src/config/toolRegistry.ts` | MODIFY | `available: true`, `maxExecutionTimeMs: 120000` for csharp-verification |
| `packages/shared/src/constants/tools.ts` | MODIFY | `status: 'available'` for csharp-verification |
| `packages/server/examples/csharp-verification/*/Program.cs` | MODIFY | Add `using CsFv.Contracts;` + `[Requires]`/`[Ensures]` attributes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| executionService ↔ wrapper script | execa subprocess, `--input <path>` | No shell injection; args passed as array |
| wrapper script ↔ cs-fv CLI | `dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <files>` | Not `dotnet run` (requires SDK); uses pre-published DLL |
| cs-fv CLI ↔ CVC5 | subprocess via `ProcessStartInfo`, SMT-LIB2 via file/stdin | CVC5 must be in PATH or CSFV_CVC5_PATH env var |
| cs-fv CLI ↔ Z3 | subprocess via `ProcessStartInfo`, `-smt2 -in` flags | Z3StrategyFactory tries library first (fails on Linux), falls back to CLI |
| Docker COPY ↔ cs-fv repo | `COPY cs-fv/ .` in dotnet-builder stage | Requires cs-fv to be sibling directory in Docker build context |

## Critical Architecture Decisions

### Decision 1: .NET Runtime vs SDK in Production Image

Use `dotnet-runtime-8.0` (not `dotnet-sdk-8.0`) in the production Docker stage.

**Rationale:** SDK includes compiler, NuGet, MSBuild — none needed at runtime. Runtime-only reduces image size by ~500MB. The cs-fv CLI is published as a framework-dependent DLL (`--self-contained false`), so the runtime must be installed separately.

**Consequence:** The `dotnet-builder` stage must produce a complete published output with all DLL dependencies included (`dotnet publish -o /out/cs-fv`).

### Decision 2: CVC5 as Primary Solver (not Z3 Library)

Install CVC5 as a system binary in the production Docker image.

**Rationale:** The Microsoft.Z3 NuGet package 4.12.2 ships native libraries only for `osx-x64` and `win-x64` — no Linux runtime. Z3 library mode will silently fail on Docker/Linux, causing fallback to Z3 CLI mode. CVC5 is cs-fv's proven default solver and must be available as a binary. Installing both CVC5 and Z3 CLI covers all solver paths.

**Consequence:** Production image must install `cvc5` package (or download binary) and `z3` (apt) during build.

### Decision 3: cs-fv Invokes Files Individually, Not by Directory

The wrapper script finds `*.cs` files and passes them as individual arguments to `cs-fv verify <file1> [file2...]`.

**Rationale:** The cs-fv CLI `verify` command takes individual `.cs` file paths, not directory paths. This mirrors the Java FV wrapper which similarly collects `.java` files via `find` and passes them individually to `java -jar ... verify <files>`.

**Consequence:** The wrapper script must exclude `bin/` and `obj/` directories to avoid passing compiled artifacts as source files.

### Decision 4: wrapper script uses `exec` for clean signal handling

The final invocation uses `exec "$DOTNET_BIN" "$CSFV_DLL" verify ...` (not a subshell).

**Rationale:** `exec` replaces the bash process with the dotnet process, ensuring SIGTERM from the portal's timeout mechanism propagates directly to cs-fv. This is the same pattern used in hupyy-java-verify.sh.

### Decision 5: Timeout set to 120s (matching Java FV)

`maxExecutionTimeMs: 120000` in toolRegistry for csharp-verification.

**Rationale:** CVC5 verification of complex SMT formulas can take 10-60+ seconds per method. Three example files with multiple methods may approach 60-90 seconds total. The Java FV was given 120s for the same reason. 60s (the default for other tools) is too low.

## Anti-Patterns

### Anti-Pattern 1: Using `dotnet run` in the wrapper script

**What people do:** `dotnet run --project /path/to/CsFv.Cli -- verify <files>`

**Why it's wrong:** `dotnet run` requires the .NET SDK (not just runtime). It rebuilds the project on first run. It is 3-10x slower to start than invoking a published DLL. Docker production should not have SDK installed.

**Do this instead:** `dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <files>` — invoke the pre-published DLL directly with the runtime.

### Anti-Pattern 2: Installing .NET SDK in production Docker stage

**What people do:** `apt-get install dotnet-sdk-8.0` in the production stage to avoid a separate builder stage.

**Why it's wrong:** Adds ~500MB to the image. SDK is not needed at runtime. Violates minimal-image principle.

**Do this instead:** Add a dedicated `dotnet-builder` stage. Production stage installs only `dotnet-runtime-8.0`.

### Anti-Pattern 3: Relying on Microsoft.Z3 library for Linux

**What people do:** Assume `Microsoft.Z3` NuGet package works cross-platform.

**Why it's wrong:** Version 4.12.2 ships only `osx-x64` and `win-x64` native libraries. On Linux/Docker, `libz3.so` is not found → `DllNotFoundException` at runtime → cs-fv silently falls back to Z3 CLI mode (if available) or fails.

**Do this instead:** Install `z3` via apt in the production Docker stage. The cs-fv `Z3StrategyFactory` tries library first (fails on Linux), falls back to CLI automatically. Having `z3` in PATH ensures CLI fallback works.

### Anti-Pattern 4: Passing a directory to `cs-fv verify`

**What people do:** `cs-fv verify /app/uploads/<projectId>` (the whole directory)

**Why it's wrong:** The cs-fv CLI `verify` command takes individual `.cs` file paths as positional arguments, not directories. Passing a directory path is not supported.

**Do this instead:** Use `find` in the wrapper script to enumerate `*.cs` files, then pass them individually.

### Anti-Pattern 5: Example files without FV contracts

**What people do:** Ship the existing `Program.cs` examples as-is (null checks, bounds checks with `if` guards — no `[Requires]`/`[Ensures]` attributes).

**Why it's wrong:** cs-fv exits with "No methods with contracts found" and produces no verification output. The demo shows nothing interesting.

**Do this instead:** Add `using CsFv.Contracts;` and `[Requires]`/`[Ensures]` attributes to example methods so the verification produces real output (verified / failed / counterexample).

## Example Project Structure for C# FV Demo

### What makes a good C# FV example

Each example needs:
1. `using CsFv.Contracts;` import at the top
2. Methods with `[Requires("precondition")]` and/or `[Ensures("postcondition")]` attributes
3. The contracts should be verifiable (not too complex for CVC5 in ~30s per method)
4. The example should demonstrate something meaningful about safety

### Transformed null-check example (illustrative)

```csharp
using CsFv.Contracts;

public class User
{
    public string Name { get; }

    [Requires("name != null")]
    [Ensures("Name != null")]
    public User(string name)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
    }

    [Requires("Name != null")]
    [Ensures("result != null")]
    public string GetDisplayName()
    {
        return Name;
    }
}
```

### Transformed division-safety example (illustrative)

```csharp
using CsFv.Contracts;

public class SafeMath
{
    [Requires("divisor != 0")]
    [Ensures("result * divisor == dividend")]
    public static int Divide(int dividend, int divisor)
    {
        return dividend / divisor;
    }
}
```

## Suggested Build Order for Phases

| Phase | Work | Dependencies |
|-------|------|-------------|
| 1 | Docker multi-stage: add dotnet-builder stage, install .NET runtime + CVC5 + Z3 in production | None — pure Docker changes |
| 2 | Wrapper script `hupyy-csharp-verify.sh` | Depends on cs-fv CLI being buildable in Docker (Phase 1) |
| 3 | toolRegistry.ts + tools.ts: flip available/status | Depends on wrapper script being in place (Phase 2) |
| 4 | Transform example Program.cs files: add FV contracts | Can be done in parallel with Phase 2; requires understanding cs-fv contract syntax |
| 5 | E2E tests for C# verification flow | Depends on all above — tests against running Docker image |

**Rationale for this order:** Docker changes are infrastructure prerequisites. The wrapper script is the core bridge. Registry/status changes are one-liner modifications. Example transformation is content work that can be parallelized with infrastructure. E2E tests come last as they verify the full stack.

## Sources

- Existing codebase: `packages/server/src/config/toolRegistry.ts` (tool registry pattern)
- Existing codebase: `packages/server/src/services/executionService.ts` (execa subprocess pattern)
- Existing codebase: `scripts/hupyy-java-verify.sh` (wrapper script pattern)
- Existing codebase: `Dockerfile` (multi-stage build pattern)
- cs-fv project: `cs-fv/USAGE.md` (CLI interface: `cs-fv verify <files...>`)
- cs-fv project: `cs-fv/global.json` (requires .NET SDK 10.0.103 to build; net8.0 target framework for runtime)
- cs-fv project: `cs-fv/src/CsFv.Cli/CsFv.Cli.csproj` (PackAsTool, uses System.CommandLine)
- cs-fv project: `cs-fv/src/CsFv.Verification/Z3StrategyFactory.cs` (library → CLI fallback pattern)
- cs-fv project: `cs-fv/src/CsFv.Verification/RealCvc5Runner.cs` (CVC5 invoked as subprocess via PATH)
- NuGet cache: `~/.nuget/packages/microsoft.z3/4.12.2/runtimes/` (only osx-x64 and win-x64 — no linux)
- Existing examples: `packages/server/examples/csharp-verification/` (3 examples exist, need FV contracts added)

---
*Architecture research for: C# Formal Verification integration into Hupyy Languages Web Portal*
*Researched: 2026-02-20*
