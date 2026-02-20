# Feature Research

**Domain:** C# Formal Verification Tool Integration — Demo Portal Second Live Tool
**Researched:** 2026-02-20
**Confidence:** MEDIUM-HIGH

---

## Scope

This document covers NEW features only for v1.3 (C# FV milestone). All existing portal
infrastructure (file upload, SSE streaming, output preview, download, tool comparison grid,
example picker, E2E tests) is ALREADY BUILT and out of scope here.

Existing pattern to follow: Java FV integration (v1.1) — Docker + wrapper script +
example projects + E2E test coverage.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist when they select "C# Verification" in the portal. Missing = tool
feels unfinished or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| C# FV tool executes via portal (dotnet build + analyzer) | Tool shows "Available" badge — users expect it to actually run | MEDIUM | Wrapper script bridges `--input` interface to `dotnet build` invocation in project dir |
| Wrapper script `hupyy-csharp-verify` with `--input <path>` interface | All portal tools follow identical `--input <path>` CLI interface (established in v1.1) | LOW | Must match java wrapper pattern exactly: parse `--input`, validate `.cs` files exist, exec `dotnet build` |
| C# FV example projects loadable in example picker | Java FV has 3 examples; C# FV users expect the same or similar | MEDIUM | 3 examples minimum, matching the established dropdown pattern (name + subtitle) |
| Verification output streams to real-time console | SSE streaming is core UX; established with Java FV | LOW (infra exists) | `dotnet build` output goes to stdout/stderr naturally; wrapper just exec's, infra handles streaming |
| Non-zero exit code on verification failure | Java FV examples include intentional failures to show "VERIFICATION FAILED" clearly | LOW | `dotnet build` exits non-zero on error/warning-as-error; wrapper propagates exit code |
| C# FV tool status flipped to "Available" in UI | Badge and tool picker both updated | LOW | Single line change in `tools.ts` + `toolRegistry.ts`, same as Java FV activation |
| E2E tests covering C# verification flow | Java FV has E2E coverage; C# FV must too (quality gate) | MEDIUM | Reuse existing Playwright helpers; cover load-example → execute → see-output flow |
| `.cs` file validation in wrapper | Wrapper must reject uploads with no `.cs` files with clear error message | LOW | Mirror Java wrapper: `find "$PROJECT_PATH" -name "*.cs"` check |
| Benefit-focused tool description in UI | Java FV: "Prove your Java code is correct — automated formal verification for modern Java" | LOW | C# needs equivalent: "Prove your C# code is correct — automated formal verification for modern C#" |

### Differentiators (Competitive Advantage)

Features that make the C# FV demo notable relative to just "another tool activated."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Examples demonstrate intentional failure (visible verification fail) | Users understand what "VERIFICATION FAILED" means; builds trust in tool | LOW | One example or one file within an example should produce non-zero exit with clear diagnostic output; mirrors Java FV pattern |
| C# modern language features in examples | Shows tool works with current C# (12/13 features) not legacy code | MEDIUM | Records, primary constructors, nullable reference types, pattern matching — covers modern idioms developers actually write |
| Progressive complexity across 3 examples | Simple → complex progression helps users understand what the tool detects | MEDIUM | Example 1: minimal null safety; Example 2: type-safe domain modeling with records; Example 3: complex invariants with intentional failure |
| Roslyn diagnostic output clearly displayed | `dotnet build` produces structured MSBuild diagnostic lines — users read them in the console | LOW (infra exists) | Format: `File.cs(line,col): warning CAXXXX: message` — already readable in streaming console |
| Multi-file C# examples (2-3 files each) | Real C# projects span files; single-file demos feel artificial | MEDIUM | Each example zip should contain 2-3 `.cs` files + a `.csproj` referencing the Roslyn analyzer NuGet |
| Timeout tuned for C# FV execution | `dotnet build` with analyzer can take 15-60 seconds on first cold run | LOW | Set 120s timeout matching Java FV; `dotnet` cold start + NuGet restore can be slow |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-browser C# code editor | Seems easier to try; avoids zip upload friction | Out-of-scope per PROJECT.md; breaks upload-only pattern established in v1.0; requires Monaco editor integration | Upload-only with high-quality examples — examples load instantly and demonstrate tool well |
| Custom Roslyn rules configuration | Advanced users want to tune severity levels | Scope creep; demo portal, not a CI/CD pipeline; config via `.editorconfig` not surfaced in UI | Bake sensible default rules into the example `.csproj`; document what rules run in README |
| Multi-solver or alternative analyzer backends | Users familiar with Dafny/CBMC may ask | Hupyy C# FV is specifically a Roslyn analyzer — not a Dafny or CBMC wrapper | Label it clearly as Roslyn-based; Dafny comparison is future scope |
| SARIF output display | Structured JSON output exists via ErrorLog option | SARIF is verbose JSON; users benefit more from the raw human-readable `dotnet build` output already streamed | Stream raw `dotnet build` stdout/stderr as-is; no output file tree needed for C# FV |
| Output file download (zip) for C# FV | Follows Java FV pattern which also streams-only | Java FV also produces no output files (console-only); C# FV is same | Console output is the result; no file tree or download needed, consistent with Java FV |
| NuGet restore inside portal execution | Users may expect full project lifecycle | NuGet restore adds 30-120s latency on first run; complicates Docker layer caching | Pre-install the Hupyy C# FV NuGet package in Docker image; examples reference it as a local/pre-installed package |
| Support for .NET Framework projects | Legacy C# codebases use .csproj with `<TargetFramework>net48` | .NET Framework requires Windows SDK; Docker image uses Linux .NET SDK | Examples target `net8.0` or `net9.0` only; document in tool description |

---

## Feature Dependencies

```
C# FV Tool Activation (tools.ts + toolRegistry.ts)
    └──requires──> Wrapper Script (hupyy-csharp-verify)
                       └──requires──> Docker image with .NET SDK
                                          └──requires──> Hupyy C# FV NuGet pre-installed in image

C# FV Example Projects
    └──requires──> C# FV Tool Activation (tool must be available to load examples)
    └──requires──> .csproj in each example referencing the analyzer
    └──enhances──> Demo narrative (intentional failure example shows verifier works)

E2E Tests for C# FV
    └──requires──> C# FV Tool Activation
    └──requires──> C# FV Example Projects (tests load examples by name)
    └──reuses──> Existing Playwright helpers (e2e/fixtures/helpers.ts)

Wrapper Script
    └──follows-pattern-of──> hupyy-java-verify.sh
    └──executes──> dotnet build <project_dir>
    └──propagates──> exit code (non-zero on verification failure)

Docker Image (.NET SDK layer)
    └──extends──> Existing Docker 3-stage build (JDK 25 + Node.js 22)
    └──adds──> .NET SDK stage (dotnet 8/9 SDK)
    └──pre-installs──> Hupyy C# FV NuGet analyzer package
```

### Dependency Notes

- **Docker image must be updated before wrapper script is meaningful:** The wrapper calls `dotnet build` which must exist in the Docker image. This is the hardest dependency — .NET SDK adds ~300MB to the image.
- **Example `.csproj` files must reference the analyzer:** Without the `<PackageReference>` to the Hupyy C# FV analyzer NuGet in each example's `.csproj`, `dotnet build` runs but produces no verification diagnostics. This is the key difference from generic C# projects.
- **NuGet pre-installation in Docker:** If the analyzer NuGet is pre-installed in Docker (via global tools or pre-restored packages), examples won't need network access during execution — consistent with Java FV which bundles the jar.
- **E2E tests depend on tool being live in Docker:** Same guard as Java FV — E2E must run against the Docker production image with `E2E_BASE_URL` set.

---

## C# FV Example Projects — Recommended Design

### Design Principles (from Java FV pattern analysis)

1. Progressive complexity: simple → complex
2. Multi-file projects (2-3 `.cs` files each, not single-file)
3. Mix of passing and failing verification
4. Domain-themed names (not "Hello World"), matching existing Java FV pattern
5. Each example zip contains: 2-3 `.cs` files + 1 `.csproj` + 1 `README.md`
6. Verification infers from code structure AND from explicit annotations where the tool supports them

### Recommended 3 Examples

#### Example 1: "Null-Safe User Repository" (simple — already partially stubbed)

**Theme:** Null safety with nullable reference types
**C# features:** `string?`, null-coalescing operators, `ArgumentNullException.ThrowIfNull`, nullable flow analysis
**Files:** `User.cs`, `UserRepository.cs`, `Program.cs`
**Verification target:** Null reference safety analysis — compiler flow analysis + analyzer checks null guards
**Outcome:** PASSES verification (all null paths guarded correctly)
**Complexity:** LOW — demonstrates "green" verification, good first example
**Note:** Existing `null-check/Program.cs` stub is a starting point but needs splitting into multi-file and needs a `.csproj`

#### Example 2: "Order Processing with Records" (medium — uses modern C# features)

**Theme:** Type-safe domain modeling with records and pattern matching
**C# features:** `record`, primary constructors, `switch` expression pattern matching, discriminated unions via sealed classes/interfaces, `required` properties
**Files:** `Order.cs`, `OrderProcessor.cs`, `Program.cs`
**Verification target:** Exhaustive pattern matching (compiler warns on non-exhaustive switch), null safety in record properties, type contracts
**Outcome:** PASSES verification with informational diagnostics showing what was checked
**Complexity:** MEDIUM — shows verifier working with modern C# idioms developers actually write

#### Example 3: "Bank Account with Invariant Violation" (complex — intentional failure)

**Theme:** Financial invariants — demonstrates what happens when code violates contracts
**C# features:** Records, numeric types, generic constraints, `IComparable`, nullable analysis
**Files:** `BankAccount.cs`, `Transaction.cs`, `UnsafeWithdrawal.cs`
**Verification target:** Negative balance invariant, overflow safety, null preconditions
**Outcome:** FAILS verification on `UnsafeWithdrawal.cs` — produces visible error diagnostics (non-zero exit)
**Complexity:** HIGH — mirrors Java FV's `UnsafeRefund.java` pattern; users see "VERIFICATION FAILED" output
**Note:** "bank-account" theme mirrors Java FV's `bank-account-records` example — intentional parallel for comparison

### .csproj Structure for Examples

Each example must have a `.csproj` that:
- Targets `net8.0` or `net9.0` (Linux Docker compatible)
- Has `<Nullable>enable</Nullable>` to activate nullable reference types
- References the Hupyy C# FV analyzer via `<PackageReference>`
- Has `<TreatWarningsAsErrors>false</TreatWarningsAsErrors>` so warnings still surface without failing exit on warnings (only errors fail)
- Does NOT include `<Sdk>Microsoft.NET.Sdk.Web</Sdk>` — console app only

### Verification Output Format to Expect

The portal streaming console will show `dotnet build` output in this format:

```
MSBuild version 17.x.x [/usr/share/dotnet/sdk]
  Determining projects to restore...
  Restored /tmp/project/ExampleProject.csproj
  ExampleProject -> /tmp/project/bin/Debug/net8.0/ExampleProject.dll

Build succeeded.
    0 Warning(s)
    0 Error(s)
```

On verification failure:

```
MSBuild version 17.x.x [/usr/share/dotnet/sdk]
  BankAccount.cs(42,13): error HFVCS001: Balance invariant violation: balance may be negative [/tmp/project/ExampleProject.csproj]
  UnsafeWithdrawal.cs(18,5): warning HFVCS002: Unchecked arithmetic operation on monetary value [/tmp/project/ExampleProject.csproj]

Build FAILED.

Error(s):
  BankAccount.cs(42,13): error HFVCS001: Balance invariant violation: balance may be negative
```

Key format elements users see in the streaming console:
- `File.cs(line,col): severity DIAGID: human-readable message` — MSBuild standard format (MEDIUM confidence — from official MSBuild docs)
- `Build succeeded.` / `Build FAILED.` — clear terminal signal
- Summary count `N Warning(s)` / `N Error(s)` — gives users a summary at the end
- Non-zero exit code on `Build FAILED` — portal shows execution as failed (red status)

Confidence: MEDIUM — diagnostic ID format (`HFVCS001`) depends on the actual Hupyy C# FV analyzer implementation. The surrounding MSBuild output format is HIGH confidence from official docs.

---

## MVP Definition

### Launch With (v1.3)

- [x] **Docker image updated with .NET SDK** — Without this, nothing runs. Hardest infra change.
- [x] **`hupyy-csharp-verify` wrapper script** — Bridges `--input <path>` to `dotnet build`; mirrors java wrapper
- [x] **3 C# FV example projects with `.csproj`** — Null-safe repository, Order records, Bank account invariant (with failure)
- [x] **Tool status → Available in `tools.ts` + `toolRegistry.ts`** — Flips badge and enables execution
- [x] **Benefit-focused tool description** — "Prove your C# code is correct — automated formal verification for modern C#"
- [x] **120s execution timeout** — Matches Java FV; `dotnet` cold start can be slow
- [x] **E2E tests for C# FV flow** — Load example → execute → see output (at minimum 1 happy path test)

### Add After Validation (v1.x)

- [ ] **More C# examples** — Add when users ask for more patterns (LINQ verification, async/await safety, generics constraints)
- [ ] **Execution timeout tuning** — Adjust if 120s proves too short or too long after real-world data
- [ ] **C# FV documentation inline** — Add when users ask "what rules does this check?"

### Future Consideration (v2+)

- [ ] **SARIF output parsing and display** — Complex; adds value for CI/CD users but not demo portal users
- [ ] **Side-by-side Java FV vs C# FV comparison** — Interesting for polyglot teams; not core to v1.3
- [ ] **Dafny integration** — Different tool class entirely; separate milestone

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Docker .NET SDK layer | HIGH (nothing works without it) | HIGH | P1 |
| Wrapper script `hupyy-csharp-verify` | HIGH | LOW | P1 |
| 3 C# example projects with `.csproj` | HIGH | MEDIUM | P1 |
| Tool activation (status + registry) | HIGH | LOW | P1 |
| Benefit-focused description | MEDIUM | LOW | P1 |
| 120s timeout | MEDIUM | LOW | P1 |
| E2E tests (happy path) | HIGH (quality gate) | MEDIUM | P1 |
| Intentional failure example | MEDIUM (trust-building) | LOW | P1 |
| Full E2E test suite (edge cases) | MEDIUM | MEDIUM | P2 |
| More than 3 examples | LOW | MEDIUM | P2 |
| Inline documentation | LOW | LOW | P2 |

---

## Comparison with Java FV Pattern

| Aspect | Java FV (v1.1) | C# FV (v1.3) | Notes |
|--------|----------------|---------------|-------|
| Wrapper script name | `hupyy-java-verify.sh` | `hupyy-csharp-verify` | Same `--input <path>` interface |
| CLI invocation | `java -jar java-fv-cli.jar verify <files>` | `dotnet build <project_dir>` | C# needs project dir (`.csproj`), not individual files |
| File detection | Find `*.java` files | Find `*.cs` files + validate `.csproj` exists | `.csproj` required for `dotnet build` |
| Docker addition | JDK 25 + Java FV jar | .NET SDK 8/9 + pre-installed NuGet analyzer | .NET SDK is larger (~300MB vs JDK ~200MB) |
| Example count | 3 examples, 3-4 files each | 3 examples, 3-4 files each (`.cs` + `.csproj`) | Same structure |
| Example themes | Records, Pattern Matching, Sealed Types | Null Safety, Records+Patterns, Invariant Violation | C# themes mirror C# idioms |
| Failure example | `UnsafeRefund.java` (sealed types example) | `UnsafeWithdrawal.cs` (bank account example) | Same "unsafe" naming pattern |
| Execution timeout | 120s | 120s | Same — both tools can be slow |
| Output type | Console only (no file tree) | Console only (no file tree) | Same |
| Diagnostic format | Java FV CLI output (tool-specific) | MSBuild format: `File.cs(line,col): severity ID: message` | C# output is more structured (MSBuild standard) |

---

## Sources

### Official Documentation
- [MSBuild Diagnostic Format](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-diagnostic-format-for-tasks?view=vs-2022) — Authoritative source for `File.cs(line,col): severity CODE: message` format (HIGH confidence)
- [Code Analysis in .NET](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview) — Roslyn analyzer severity levels: Error, Warning, Suggestion, Silent, None (HIGH confidence)
- [Roslyn Analyzers Overview](https://learn.microsoft.com/en-us/visualstudio/code-quality/roslyn-analyzers-overview?view=visualstudio) — IDE/CA diagnostic ID formats, NuGet package delivery (HIGH confidence)
- [Nullable Reference Types](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references) — C# nullable flow analysis for example design (HIGH confidence)
- [Code Contracts (.NET Framework)](https://learn.microsoft.com/en-us/dotnet/framework/debug-trace-profile/code-contracts) — Confirmed NOT supported in .NET 5+; use nullable types instead (HIGH confidence)
- [dotnet build command](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build) — CLI interface reference (HIGH confidence)

### Project Pattern Sources
- `packages/server/examples/java-verification/` — Established example structure to replicate
- `scripts/hupyy-java-verify.sh` — Wrapper script pattern to follow
- `.planning/phases/09-tool-activation-examples/09-CONTEXT.md` — Java FV activation decisions
- `packages/shared/src/constants/tools.ts` — Tool metadata structure
- `packages/server/src/config/toolRegistry.ts` — Tool execution config structure

### Existing C# Stubs (to validate/replace)
- `packages/server/examples/csharp-verification/null-check/Program.cs` — Stub exists; needs multi-file split + `.csproj`
- `packages/server/examples/csharp-verification/division-safety/Program.cs` — Stub exists; uses `Debug.Assert` (not analyzer contracts); replace with records example
- `packages/server/examples/csharp-verification/array-bounds/Program.cs` — Stub exists; good but needs `.csproj` and multi-file expansion

### Web Research (MEDIUM confidence — WebSearch verified)
- [Roslyn Analyzer Customize Rules](https://learn.microsoft.com/en-us/visualstudio/code-quality/use-roslyn-analyzers?view=visualstudio) — Severity levels (Error/Warning/Suggestion)
- [Building a Code Analyzer for .NET](https://timheuer.com/blog/building-a-code-analyzer-for-net/) — NuGet delivery, `dotnet build` integration
- [Roslyn GitHub Analyzer Format](https://github.com/dotnet/roslyn/blob/main/docs/analyzers/Report%20Analyzer%20Format.md) — Performance reporting format (distinct from diagnostic format)

---

## Gaps and Open Questions

1. **Hupyy C# FV NuGet package name and installation method** — The actual NuGet package ID for the Hupyy C# FV analyzer is not publicly discoverable (tool is "Finishing Up" per PROJECT.md). The wrapper script and example `.csproj` files depend on this. **Mitigation:** Confirm package name with project owner before writing wrapper; examples should reference the pre-installed local path if NuGet not published yet.

2. **Exact diagnostic IDs produced by the analyzer** — Roslyn analyzer diagnostic IDs are tool-defined (e.g., `HFVCS001`). The actual IDs matter for example design — examples should trigger specific known diagnostics. **Mitigation:** Obtain from Hupyy C# FV source or documentation before finalizing examples.

3. **`dotnet build` cold start in Docker** — First run after Docker container starts requires NuGet restore. If packages aren't pre-cached in the image, this adds 30-120s of latency before verification starts. **Mitigation:** Pre-restore packages in Docker build step; explore `dotnet build --no-restore` for subsequent runs.

4. **Docker image size impact** — Adding .NET SDK to the existing JDK 25 + Node.js 22 image adds ~300-500MB. **Mitigation:** Consider multi-stage build where .NET SDK is a separate stage; investigate `dotnet/sdk:8.0-alpine` as base.

5. **Example design depends on actual analyzer rules** — The three example themes (null safety, records, invariant violation) are appropriate for a Roslyn FV tool, but the specific patterns that trigger diagnostics depend on what the Hupyy C# FV analyzer actually checks. **Mitigation:** Design examples to use common Roslyn analyzer patterns (nullable, CA rules) as fallback if Hupyy-specific rules aren't documented.

---

*Feature research for: C# Formal Verification — v1.3 milestone*
*Researched: 2026-02-20*
*Researcher: GSD Project Researcher (Phase 6)*
*Confidence: MEDIUM-HIGH (portal pattern from existing Java FV is HIGH; C# FV output format from MSBuild docs is HIGH; Hupyy-specific analyzer internals are LOW — gaps noted above)*
