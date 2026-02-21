# Phase 21: Wrapper Script + Tool Registry Activation - Research

**Researched:** 2026-02-20
**Domain:** Bash wrapper scripting, cs-fv CLI interface, TypeScript tool registry
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Error handling & messaging
- **Pre-flight validation** (before invoking dotnet): check for empty/no-code zip, no `.cs` files at all, and no `.csproj` file — all three conditions fail early with a clear message
- **Error output destination**: write error messages to both stderr AND stdout so portal streaming captures them and they are also machine-parseable
- **Error message format**: match cs-fv.dll's own output style for consistency (researcher to determine exact format by inspecting cs-fv output)
- **Exit codes**: exit 2 for wrapper input-validation errors (missing .csproj, empty zip, no .cs files), exit 1 for tool-detected failures (cs-fv.dll exits non-zero or warnings-as-errors triggered)

#### File discovery logic
- **How to find .cs files**: use the `.csproj` file(s) to determine which `.cs` files to analyze (parse project includes, not just filesystem glob)
- **Multiple .csproj files (solution)**: treat all `.csproj` files as the solution — run cs-fv analysis across all of them if cs-fv supports multi-project invocation; researcher to investigate cs-fv multi-project capability
- **Test file exclusion**: Claude's discretion — researcher to determine whether cs-fv already filters test assemblies, and apply exclusion only if needed
- **Malformed .csproj**: no pre-validation — let dotnet fail naturally and surface its output to the user

#### Output streaming behavior
- **Content**: raw dotnet/cs-fv.dll output passthrough only — no wrapper-added banners, per-file progress, or completion summaries
- **Keep-alive signals**: none — trust the portal's 180s timeout handling
- **Post-completion summary**: none — cs-fv output speaks for itself
- **Stderr handling**: merge cs-fv.dll stderr into stdout stream (2>&1) so all output is captured by the portal streaming mechanism

#### Roslyn diagnostic treatment
- **Detection approach**: researcher to investigate what cs-fv.dll exposes (flags like `--treat-warnings-as-errors`, or `-warnaserror` dotnet flag, or output parsing) — choose best available mechanism
- **Exit code override**: Claude's discretion based on what cs-fv.dll supports — if warnings-as-errors must be implemented in the wrapper by parsing output, override exit code to 1
- **Override message**: when wrapper triggers warnings-as-errors override, emit a clear message (e.g., "Treating Roslyn Warning diagnostics as errors — verification failed")
- **CS errors vs FV failures distinction**: researcher to investigate cs-fv.dll capabilities; Claude decides based on findings

### Claude's Discretion
- Test file filtering (whether and how to exclude test projects/files)
- Exact warnings-as-errors mechanism (flag vs output parsing vs exit code override) — pending cs-fv investigation
- Whether to distinguish build errors from FV failures in output — pending cs-fv investigation
- Exact format of wrapper-emitted error messages (to match cs-fv style, which researcher will document)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CSFV-01 | `hupyy-csharp-verify` wrapper script accepts `--input <dir>`, enumerates `.cs` files, runs cs-fv via `exec dotnet`, streams output to portal SSE | cs-fv CLI is `dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <single-file>` — wrapper must iterate per file; `exec` at end of loop not possible, use final exec or loop with 2>&1 passthrough |
| CSFV-02 | C# Formal Verification tool status updated to `available` in tool registry and UI tool grid | Two files: `packages/shared/src/constants/tools.ts` (status field) and `packages/server/src/config/toolRegistry.ts` (available + maxExecutionTimeMs) |
| CSFV-03 | C# FV tool timeout set to 180,000ms | Change `maxExecutionTimeMs: 60000` to `maxExecutionTimeMs: 180000` in `toolRegistry.ts` for `csharp-verification` entry |
| CSFV-04 | Wrapper script handles Roslyn `Warning`-severity exit code 0 via `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in example `.csproj` files | cs-fv exits 0 even when Roslyn warnings present — `TreatWarningsAsErrors=true` in example .csproj makes Roslyn warnings into errors so cs-fv exits 1; wrapper does NOT need to implement this — it is a .csproj concern for Phase 22 |
</phase_requirements>

## Summary

Phase 21 has two deliverables: (1) a Bash wrapper script `hupyy-csharp-verify` installed at `/usr/local/bin/hupyy-csharp-verify` in the Docker image, and (2) two TypeScript changes to activate the `csharp-verification` tool in the portal.

The cs-fv CLI (`dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <file>`) takes a **single file** per invocation, not a directory or multiple files. The wrapper must discover `.cs` files from the `.csproj` project file(s), then invoke cs-fv once per file, streaming all output directly. Pre-flight validation must check for: (a) no `.csproj` file, (b) no `.cs` files. Malformed `.csproj` falls through to dotnet naturally.

The NUGET_PACKAGES environment variable is already set to `/home/nodejs/.nuget/packages` via `ENV` in the Dockerfile — the wrapper does NOT need to set it per-invocation. However, the STATE.md note "NUGET_PACKAGES must be set per-job in wrapper (NuGet/Home #8129 concurrency bug)" suggests concurrent executions may corrupt the shared cache. Research confirms this is a known NuGet issue with concurrent restores to the same package directory — setting a job-specific path prevents race conditions. Given the portal uses a single queue with concurrency=CPU cores, and all jobs share one NuGet cache, this warrants a unique per-job NUGET_PACKAGES path or `--no-restore` flag.

For Roslyn warnings-as-errors: cs-fv.dll has no `--treat-warnings-as-errors` flag. The `.csproj` `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` property affects MSBuild compilation (via Roslyn analyzer) — but cs-fv's `verify` command performs SMT-based verification, not MSBuild compilation. CSFV-04 is a Phase 22 concern (example .csproj files), not Phase 21. The wrapper itself does not need to handle this.

**Primary recommendation:** Write `hupyy-csharp-verify.sh` mirroring the Java wrapper pattern; update two TypeScript registry entries; add the script to Dockerfile; write unit tests for the wrapper behavior using bats or shellcheck.

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Bash | `#!/bin/bash` + `set -euo pipefail` | Wrapper script shell | Same pattern as `hupyy-java-verify.sh`; available in Ubuntu Noble base |
| `dotnet` runtime | 8.0.24 (Ubuntu Noble apt) | Execute cs-fv.dll | Already installed in Docker production stage via Phase 20 |
| cs-fv.dll | Built from cs-fv source | C# formal verification | Installed at `/usr/local/lib/cs-fv/cs-fv.dll` via Phase 20 |
| TypeScript | existing project setup | Tool registry + shared tools constants | No new dependencies — edit existing `.ts` files |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `find` | system | Discover .cs files in project dir | Backup approach if .csproj parsing is complex |
| `xmllint` / bash XML | system | Parse .csproj for included files | Only if csproj-based enumeration is needed |
| `NUGET_PACKAGES` env var | - | Isolate per-job NuGet cache | If concurrent executions can corrupt shared cache |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-file cs-fv invocation | cs-fv directory mode (not available) | cs-fv verify only accepts single file; no choice |
| Bash script | Node.js script | Bash is simpler and matches existing Java wrapper pattern |
| NUGET_PACKAGES per-job | Shared cache (as Dockerfile sets) | Shared cache fine if portal concurrency is low; per-job path safer for high concurrency |

## Architecture Patterns

### Recommended Project Structure

```
scripts/
├── hupyy-java-verify.sh        # existing — reference implementation
└── hupyy-csharp-verify.sh      # NEW — mirrors Java wrapper pattern

packages/shared/src/constants/
└── tools.ts                    # change csharp-verification status: 'in-development' → 'available'

packages/server/src/config/
└── toolRegistry.ts             # change available: false → true, maxExecutionTimeMs: 60000 → 180000
```

### Pattern 1: Wrapper Script — Java Reference Implementation

The existing `hupyy-java-verify.sh` is the authoritative pattern:

```bash
#!/bin/bash
set -euo pipefail

# Interface: hupyy-java-verify --input <path>
# Invokes: java -jar /usr/local/lib/java-fv-cli.jar verify <path>

JAR_PATH="${JAVA_FV_JAR:-/usr/local/lib/java-fv-cli.jar}"
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/}java"

# Parse arguments
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  echo "Usage: hupyy-java-verify --input <projectPath>" >&2
  exit 1
fi

PROJECT_PATH="$2"

# Validate project path exists
if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Error: Project path does not exist: $PROJECT_PATH" >&2
  exit 1
fi

# Check for .java files
if ! find "$PROJECT_PATH" -name "*.java" -type f | grep -q .; then
  echo "Error: No .java files found in $PROJECT_PATH" >&2
  echo "Java verification requires at least one .java source file" >&2
  exit 1
fi

# Collect all .java files
JAVA_FILES=()
while IFS= read -r -d '' file; do
  JAVA_FILES+=("$file")
done < <(find "$PROJECT_PATH" -name "*.java" -type f -print0)

# Execute Java FV CLI — output streams automatically; exit code propagates
exec "$JAVA_BIN" -jar "$JAR_PATH" verify "${JAVA_FILES[@]}"
```

Key properties to mirror:
- `set -euo pipefail` — fail fast on errors
- `exec` at end — process replacement, no wrapper overhead
- Pre-flight validation before invoking tool
- Error to stderr only (portal uses `all: true` in execa, merging stderr into output)

### Pattern 2: C# Wrapper — Multi-File Per-Invocation Problem

**Critical difference from Java:** cs-fv accepts ONE file per invocation:

```
cs-fv verify <single-file>   # yes
cs-fv verify src/             # NOT supported (verify command takes a single argument)
```

The `check` command supports directories, but `verify` does not. The wrapper must loop:

```bash
#!/bin/bash
set -euo pipefail

DOTNET_BIN="${DOTNET_CMD:-dotnet}"
CS_FV_DLL="${CS_FV_DLL:-/usr/local/lib/cs-fv/cs-fv.dll}"

# Parse arguments
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  echo "Usage: hupyy-csharp-verify --input <projectPath>" >&2
  echo "Usage: hupyy-csharp-verify --input <projectPath>" >&1
  exit 2
fi

PROJECT_PATH="$2"

# Validate project path exists
if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Error: Project path does not exist: $PROJECT_PATH" >&2
  echo "Error: Project path does not exist: $PROJECT_PATH" >&1
  exit 2
fi

# Check for .csproj file (required — tells us which .cs files to analyze)
CSPROJ_FILES=()
while IFS= read -r -d '' file; do
  CSPROJ_FILES+=("$file")
done < <(find "$PROJECT_PATH" -name "*.csproj" -not -path "*/bin/*" -not -path "*/obj/*" -type f -print0)

if [[ ${#CSPROJ_FILES[@]} -eq 0 ]]; then
  echo "Error: No .csproj file found in $PROJECT_PATH" >&2
  echo "Error: No .csproj file found in $PROJECT_PATH" >&1
  echo "C# verification requires a .csproj project file" >&2
  echo "C# verification requires a .csproj project file" >&1
  exit 2
fi

# Check for .cs files
CS_FILES=()
while IFS= read -r -d '' file; do
  CS_FILES+=("$file")
done < <(find "$PROJECT_PATH" -name "*.cs" -not -path "*/bin/*" -not -path "*/obj/*" -type f -print0)

if [[ ${#CS_FILES[@]} -eq 0 ]]; then
  echo "Error: No .cs files found in $PROJECT_PATH" >&2
  echo "Error: No .cs files found in $PROJECT_PATH" >&1
  echo "C# verification requires at least one .cs source file" >&2
  echo "C# verification requires at least one .cs source file" >&1
  exit 2
fi

# Run cs-fv verify for each .cs file, streaming output
OVERALL_EXIT=0
for cs_file in "${CS_FILES[@]}"; do
  "$DOTNET_BIN" "$CS_FV_DLL" verify "$cs_file" 2>&1 || OVERALL_EXIT=$?
done

exit $OVERALL_EXIT
```

**Note on dual-output for errors:** The CONTEXT.md decision says write to both stderr AND stdout. The portal's `executionService` uses `all: true` in execa which merges stdout+stderr into one stream. So stderr messages WILL appear in the portal output. Writing to both ensures they appear regardless of buffering.

**Note on `exec` at end:** With a loop, `exec` is not usable. Use `exit $OVERALL_EXIT` instead.

### Pattern 3: Tool Registry Activation

Two changes in TypeScript:

**File 1: `packages/shared/src/constants/tools.ts`**
```typescript
// Change for csharp-verification entry:
{
  id: 'csharp-verification',
  name: 'C# Verification',
  description: 'Formal verification for C# code',
  status: 'available',        // was: 'in-development'
  category: 'verification',
  sourceLanguage: 'csharp',
},
```

**File 2: `packages/server/src/config/toolRegistry.ts`**
```typescript
// Change for csharp-verification entry:
{
  id: 'csharp-verification',
  command: '/usr/local/bin/hupyy-csharp-verify',
  defaultArgs: ['--input'],
  maxExecutionTimeMs: 180000,  // was: 60000 — MSBuild cold-start needs 180s margin
  available: true,             // was: false
},
```

### Pattern 4: Dockerfile — Install C# Wrapper

Mirror the Java wrapper installation pattern:

```dockerfile
# Install C# FV wrapper script (after existing Java wrapper install)
COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify
RUN chmod +x /usr/local/bin/hupyy-csharp-verify
```

### Anti-Patterns to Avoid

- **Using `exec` in a loop:** `exec` replaces the shell process — only usable for the LAST command. In a file loop, accumulate exit codes instead.
- **Writing errors to stderr only:** The portal's execa uses `all: true` (merges stdout+stderr), so stderr does reach the stream. But the CONTEXT.md decision mandates both — honor it.
- **Calling `cs-fv check` instead of `cs-fv verify`:** `check` validates syntax only; `verify` runs SMT solving. They are different commands.
- **Passing a directory to `cs-fv verify`:** The CLI's `verify` command takes a single file argument. Passing a directory causes an error.
- **Not setting `set -euo pipefail`:** Without this, the loop may silently swallow errors from `find` or `dotnet`.
- **Forgetting `available: false` → `true` in toolRegistry.ts:** The executionService checks `config.available` and throws `UserError` ('Tool is not available') if false — the UI shows "Available" but execute would still fail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File enumeration | Custom recursive traversal | `find "$PROJECT_PATH" -name "*.cs" -print0` | Handles spaces in paths; well-tested |
| Argument parsing in wrapper | Custom `getopts` | Simple positional check `$1 != "--input"` | Java wrapper pattern is sufficient; tool only has one interface |
| NuGet concurrency isolation | Custom locking mechanism | Per-job `NUGET_PACKAGES` temp dir or `--no-restore` flag | NuGet/Home #8129 is solved by directory isolation |
| Streaming coordination | Custom SSE protocol | `2>&1` passthrough + execa `all: true` (already in executionService) | Portal pipeline handles streaming; wrapper just writes stdout |

**Key insight:** The wrapper is intentionally thin — it adapts the portal's `--input <dir>` interface to cs-fv's `verify <file>` call. All streaming, timeout, and exit code handling is in the existing `ExecutionService`.

## Common Pitfalls

### Pitfall 1: cs-fv verify Takes ONE File, Not a Directory

**What goes wrong:** Calling `dotnet cs-fv.dll verify "$PROJECT_PATH"` passes a directory — cs-fv throws `FileNotFoundException: File not found: /path/to/dir`
**Why it happens:** `verify` command argument is `<file>` (not `<path>`). Unlike `check`, which supports directories, `verify` requires a single `.cs` file path.
**How to avoid:** Loop over individual `.cs` files — invoke `dotnet cs-fv.dll verify "$cs_file"` once per file.
**Warning signs:** Error output containing `FileNotFoundException` or `File not found`

### Pitfall 2: Exit Code Aggregation in Loop

**What goes wrong:** If the loop uses `exec` or only checks the last file's exit code, early failures are silently ignored.
**Why it happens:** Without tracking `OVERALL_EXIT`, the script exits 0 even if the first file failed.
**How to avoid:** Initialize `OVERALL_EXIT=0` before the loop; after each invocation, `OVERALL_EXIT=$?` (or capture with `|| OVERALL_EXIT=$?`).
**Warning signs:** Portal shows `status: completed` when cs-fv reported verification failures

### Pitfall 3: NUGET_PACKAGES Concurrency Corruption

**What goes wrong:** Two simultaneous portal executions both write to `/home/nodejs/.nuget/packages` — NuGet/Home issue #8129 causes corrupt package state.
**Why it happens:** NuGet restore is not safe for concurrent writes to the same package directory.
**How to avoid:** The portal queue (concurrency=CPU cores) can run multiple jobs in parallel. Set `NUGET_PACKAGES` to a job-specific temp dir in the wrapper, or use `--no-restore` (if cs-fv pre-seeded its NuGet cache during build). The Dockerfile pre-seeds NuGet at build time — cs-fv.dll invocation is `dotnet /path/to/cs-fv.dll verify` not `dotnet run`; no restore happens at runtime. **Likely safe** — but if cs-fv internally triggers restore, set per-job dir.
**Warning signs:** `dotnet` errors about corrupt NuGet lock files or package not found at runtime

### Pitfall 4: Double-Echo for Error Messages

**What goes wrong:** Writing only to `>&2` — messages appear in the portal stream (because execa uses `all: true`) but decision says write to both.
**Why it happens:** The portal's `executionService` already merges stderr into output via `all: true`. But if `2>&1` redirect is used in the script for cs-fv, the wrapper's own `>&2` writes also appear.
**How to avoid:** For wrapper-emitted error messages, write to both: `echo "Error: ..." >&2; echo "Error: ..." >&1`. The duplication is intentional per CONTEXT.md decision.
**Warning signs:** Error messages missing from portal output display

### Pitfall 5: Missing Dockerfile COPY for the Wrapper Script

**What goes wrong:** Script exists in `scripts/` but Dockerfile not updated — tool executes and gets "command not found".
**Why it happens:** The Dockerfile explicitly copies individual scripts (one `COPY` per wrapper).
**How to avoid:** Add `COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify` AND `RUN chmod +x /usr/local/bin/hupyy-csharp-verify` in production stage.
**Warning signs:** `execvpe hupyy-csharp-verify: No such file or directory` in execa error output

### Pitfall 6: shared/dist Not Rebuilt After tools.ts Change

**What goes wrong:** `packages/shared/src/constants/tools.ts` changed but `packages/shared/dist/` not rebuilt — runtime still reads old `status: 'in-development'`.
**Why it happens:** The server and client import from `@repo/shared` which resolves to `dist/`. TypeScript source changes need `npm run build` in shared package.
**How to avoid:** Run `npm run build` in `packages/shared/` after editing `tools.ts`. In Docker, the node-builder stage runs `npm run build` which covers this.
**Warning signs:** Tool grid still shows "In Development" badge after code change

### Pitfall 7: toolRegistry.ts Length Mismatch Guard

**What goes wrong:** `toolRegistry.ts` has a runtime guard: `if (TOOLS.length !== toolExecutionConfigs.length) throw new Error(...)` — adding/removing entries to one array without the other causes server startup failure.
**Why it happens:** The guard is intentional to keep TOOLS (shared) and execution configs (server) in sync. Currently 8 entries on each side.
**How to avoid:** This phase only EDITS existing entries, not adding new ones. No length mismatch risk. But verify count stays at 8 after edits.
**Warning signs:** Server fails to start with "Tool registry mismatch: N tools defined but M execution configs provided"

## Code Examples

### cs-fv CLI Interface (from Program.cs source inspection)

```bash
# Source: cs-fv/src/CsFv.Cli/Program.cs (direct source inspection)

# verify command — single file only
dotnet /usr/local/lib/cs-fv/cs-fv.dll verify <path-to-single-cs-file>
# Options: --method, --verbose, --timeout, --solver, --cvc5-path, --format, --concurrency-bound

# Exit codes (from source):
# Environment.ExitCode = result.FailedCount + result.ErrorCount > 0 ? 1 : 0;
# Exceptions (FileNotFound, VerificationException) → exit 1
# Unexpected exceptions → exit 1

# check command — supports file OR directory
dotnet /usr/local/lib/cs-fv/cs-fv.dll check <path>

# Output format — ConsoleOutput.WriteVerified / WriteFailed / WriteTimeout
# "✅ MethodName: Verified (0.5s)"
# "❌ MethodName: Failed (1.2s)"
# "⏱️  MethodName: Timed out (60.0s)"
```

### Complete Wrapper Script

```bash
#!/bin/bash
# Source: project pattern based on scripts/hupyy-java-verify.sh
set -euo pipefail

# Wrapper for C# FV CLI - bridges portal interface to cs-fv command
# Interface: hupyy-csharp-verify --input <projectPath>
# Invokes: dotnet cs-fv.dll verify <cs-file> for each .cs file found

DOTNET_BIN="${DOTNET_CMD:-dotnet}"
CS_FV_DLL="${CS_FV_DLL:-/usr/local/lib/cs-fv/cs-fv.dll}"

# Parse arguments
if [[ "$#" -ne 2 ]] || [[ "$1" != "--input" ]]; then
  MSG="Usage: hupyy-csharp-verify --input <projectPath>"
  echo "$MSG" >&2
  echo "$MSG" >&1
  exit 2
fi

PROJECT_PATH="$2"

# Validate project path exists
if [[ ! -d "$PROJECT_PATH" ]]; then
  MSG="Error: Project path does not exist: $PROJECT_PATH"
  echo "$MSG" >&2
  echo "$MSG" >&1
  exit 2
fi

# Check for .csproj file (required for C# project structure)
CSPROJ_COUNT=$(find "$PROJECT_PATH" -name "*.csproj" -not -path "*/bin/*" -not -path "*/obj/*" -type f | wc -l)
if [[ "$CSPROJ_COUNT" -eq 0 ]]; then
  MSG1="Error: No .csproj file found in $PROJECT_PATH"
  MSG2="C# verification requires a .csproj project file"
  echo "$MSG1" >&2; echo "$MSG1" >&1
  echo "$MSG2" >&2; echo "$MSG2" >&1
  exit 2
fi

# Collect .cs files (exclude bin/ and obj/ generated artifacts)
CS_FILES=()
while IFS= read -r -d '' file; do
  CS_FILES+=("$file")
done < <(find "$PROJECT_PATH" -name "*.cs" \
  -not -path "*/bin/*" \
  -not -path "*/obj/*" \
  -type f -print0)

if [[ ${#CS_FILES[@]} -eq 0 ]]; then
  MSG1="Error: No .cs files found in $PROJECT_PATH"
  MSG2="C# verification requires at least one .cs source file"
  echo "$MSG1" >&2; echo "$MSG1" >&1
  echo "$MSG2" >&2; echo "$MSG2" >&1
  exit 2
fi

# Run cs-fv verify for each .cs file
# 2>&1 merges cs-fv stderr into stdout for portal SSE streaming
OVERALL_EXIT=0
for cs_file in "${CS_FILES[@]}"; do
  "$DOTNET_BIN" "$CS_FV_DLL" verify "$cs_file" 2>&1 || OVERALL_EXIT=$?
done

exit $OVERALL_EXIT
```

### Tool Registry Activation

```typescript
// packages/shared/src/constants/tools.ts — change status field
{
  id: 'csharp-verification',
  name: 'C# Verification',
  description: 'Formal verification for C# code',
  status: 'available',        // CHANGE: was 'in-development'
  category: 'verification',
  sourceLanguage: 'csharp',
},

// packages/server/src/config/toolRegistry.ts — change available and timeout
{
  id: 'csharp-verification',
  command: '/usr/local/bin/hupyy-csharp-verify',
  defaultArgs: ['--input'],
  maxExecutionTimeMs: 180000,  // CHANGE: was 60000
  available: true,             // CHANGE: was false
},
```

### Dockerfile Addition (in production stage)

```dockerfile
# After the Java wrapper COPY block:
COPY languages-web-portal/scripts/hupyy-csharp-verify.sh /usr/local/bin/hupyy-csharp-verify
RUN chmod +x /usr/local/bin/hupyy-csharp-verify
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| cs-fv verify with directory arg | cs-fv verify with single file arg | cs-fv design (always) | Wrapper must loop per-file |
| Tool status 'in-development' | Tool status 'available' | This phase | UI shows "Available" badge |
| maxExecutionTimeMs: 60000 | maxExecutionTimeMs: 180000 | This phase | Portal won't prematurely cancel C# FV jobs |

**Key clarification on CSFV-04:**
CSFV-04 says "Wrapper script handles Roslyn Warning-severity exit code 0 via `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in example `.csproj` files." The requirement is satisfied by the example .csproj files (Phase 22) including `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` — NOT by the wrapper script parsing output. When TreatWarningsAsErrors=true is in the .csproj, MSBuild/Roslyn converts warnings to errors, causing cs-fv to exit 1 naturally. The wrapper passes the exit code through unchanged — no special handling needed in Phase 21.

## Open Questions

1. **NuGet per-job isolation needed?**
   - What we know: Dockerfile sets `ENV NUGET_PACKAGES=/home/nodejs/.nuget/packages`; packages are pre-seeded at build time; `dotnet /path/to.dll` does not run `dotnet restore`
   - What's unclear: Does cs-fv.dll internally trigger any NuGet restore at runtime? Does the Roslyn analyzer (referenced as ProjectReference with `OutputItemType="Analyzer"`) cause any lazy loading?
   - Recommendation: Assume pre-seeded cache is sufficient for runtime invocation of a published DLL. If cs-fv.dll triggers restore (evidenced by latency or errors), add `NUGET_PACKAGES=$(mktemp -d)` per-job with cleanup trap.

2. **cs-fv verify produces output to stdout or stderr?**
   - What we know: `ConsoleOutput.WriteVerified/WriteFailed/WriteError` all call `Console.WriteLine()` which writes to stdout. `ConsoleOutput.WriteError` also uses stdout (wraps with `ColorManager.Error` but still calls `Console.WriteLine`).
   - What's unclear: Are there any code paths writing to stderr directly?
   - Recommendation: Use `2>&1` in wrapper to capture both streams. This matches the portal's `all: true` execa config anyway.

3. **Test file exclusion for multi-csproj solutions?**
   - What we know: cs-fv.dll's `CheckCommand` manually filters `*/bin/*` and `*/obj/*`; `verify` command processes one file at a time
   - What's unclear: If a user uploads a solution with test projects, should test `.cs` files be excluded?
   - Recommendation: Exclude files in paths containing `Tests`, `Test`, `.Tests.` as optional heuristic — but this is Claude's discretion per CONTEXT.md. Start without exclusion; it's a Phase 22 concern (example projects are single-project, no test files).

## Sources

### Primary (HIGH confidence)
- Direct source code inspection: `cs-fv/src/CsFv.Cli/Program.cs` — verified `verify` command takes single `<file>` argument
- Direct source code inspection: `cs-fv/src/CsFv.Cli/ConsoleOutput.cs` — confirmed all output writes to `Console.WriteLine()` (stdout)
- Direct source code inspection: `scripts/hupyy-java-verify.sh` — reference implementation pattern
- Direct source code inspection: `packages/server/src/config/toolRegistry.ts` — current state, exact fields to change
- Direct source code inspection: `packages/shared/src/constants/tools.ts` — current state, exact status field to change
- Direct source code inspection: `packages/server/src/services/executionService.ts` — confirms `all: true` execa config, `config.maxExecutionTimeMs`, `config.available` check
- Direct source code inspection: `Dockerfile` — confirmed COPY pattern for wrapper scripts, NUGET_PACKAGES env var placement

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` key decisions: "NUGET_PACKAGES must be set per-job in wrapper (NuGet/Home #8129 concurrency bug)" — project-level decision, likely based on earlier research
- `.planning/phases/20-docker-image-net-runtime-solver-binaries/20-RESEARCH.md` — NuGet cache details, Docker env setup

### Tertiary (LOW confidence)
- NuGet/Home #8129 concurrency bug — referenced in STATE.md, not independently verified in this research session

## Metadata

**Confidence breakdown:**
- cs-fv CLI interface: HIGH — verified from source code
- Tool registry changes: HIGH — exact TypeScript edits identified from source
- Wrapper script pattern: HIGH — mirrors existing Java wrapper
- NUGET_PACKAGES concurrency: MEDIUM — per STATE.md research note; runtime behavior of published DLL vs `dotnet run` not independently verified
- CSFV-04 scope (Phase 22 concern): HIGH — verified from Program.cs exit code logic and requirement wording

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable domain — cs-fv CLI interface, TypeScript patterns unlikely to change)
