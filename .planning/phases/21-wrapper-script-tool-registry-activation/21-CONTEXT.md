# Phase 21: Wrapper Script + Tool Registry Activation - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

The C# FV tool is invocable through the portal — the `hupyy-csharp-verify` wrapper script adapts the portal's `--input <dir>` interface to `dotnet cs-fv.dll verify <files...>`, and the tool registry marks C# FV as "Available" with a 180s timeout. This phase wires up the existing cs-fv.dll (installed in the Docker image from Phase 20) to the portal's execution pipeline. Building the example projects and E2E tests are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Error handling & messaging

- **Pre-flight validation** (before invoking dotnet): check for empty/no-code zip, no `.cs` files at all, and no `.csproj` file — all three conditions fail early with a clear message
- **Error output destination**: write error messages to both stderr AND stdout so portal streaming captures them and they are also machine-parseable
- **Error message format**: match cs-fv.dll's own output style for consistency (researcher to determine exact format by inspecting cs-fv output)
- **Exit codes**: exit 2 for wrapper input-validation errors (missing .csproj, empty zip, no .cs files), exit 1 for tool-detected failures (cs-fv.dll exits non-zero or warnings-as-errors triggered)

### File discovery logic

- **How to find .cs files**: use the `.csproj` file(s) to determine which `.cs` files to analyze (parse project includes, not just filesystem glob)
- **Multiple .csproj files (solution)**: treat all `.csproj` files as the solution — run cs-fv analysis across all of them if cs-fv supports multi-project invocation; researcher to investigate cs-fv multi-project capability
- **Test file exclusion**: Claude's discretion — researcher to determine whether cs-fv already filters test assemblies, and apply exclusion only if needed
- **Malformed .csproj**: no pre-validation — let dotnet fail naturally and surface its output to the user

### Output streaming behavior

- **Content**: raw dotnet/cs-fv.dll output passthrough only — no wrapper-added banners, per-file progress, or completion summaries
- **Keep-alive signals**: none — trust the portal's 180s timeout handling
- **Post-completion summary**: none — cs-fv output speaks for itself
- **Stderr handling**: merge cs-fv.dll stderr into stdout stream (2>&1) so all output is captured by the portal streaming mechanism

### Roslyn diagnostic treatment

- **Detection approach**: researcher to investigate what cs-fv.dll exposes (flags like `--treat-warnings-as-errors`, or `-warnaserror` dotnet flag, or output parsing) — choose best available mechanism
- **Exit code override**: Claude's discretion based on what cs-fv.dll supports — if warnings-as-errors must be implemented in the wrapper by parsing output, override exit code to 1
- **Override message**: when wrapper triggers warnings-as-errors override, emit a clear message (e.g., "Treating Roslyn Warning diagnostics as errors — verification failed")
- **CS errors vs FV failures distinction**: researcher to investigate cs-fv.dll capabilities; Claude decides based on findings

### Claude's Discretion

- Test file filtering (whether and how to exclude test projects/files)
- Exact warnings-as-errors mechanism (flag vs output parsing vs exit code override) — pending cs-fv investigation
- Whether to distinguish build errors from FV failures in output — pending cs-fv investigation
- Exact format of wrapper-emitted error messages (to match cs-fv style, which researcher will document)

</decisions>

<specifics>
## Specific Ideas

- The wrapper must handle multi-project solutions (not just single-project zips) — treating all .csproj files in the zip as one solution is the preferred approach if cs-fv supports it
- Error messages should feel consistent with cs-fv.dll output — researcher should note cs-fv's actual output format to ensure wrapper errors match

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 21-wrapper-script-tool-registry-activation*
*Context gathered: 2026-02-20*
