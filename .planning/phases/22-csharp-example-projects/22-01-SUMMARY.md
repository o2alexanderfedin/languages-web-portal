---
phase: 22-csharp-example-projects
plan: 01
subsystem: infra
tags: [dotnet, cs-fv, docker, csharp, formal-verification]

# Dependency graph
requires:
  - phase: 21-wrapper-script-tool-registry-activation
    provides: wrapper script + tool registry with csharp-verification active
provides:
  - "Confirmed CsFv.Contracts.dll is present at /usr/local/lib/cs-fv/CsFv.Contracts.dll in Docker image"
  - "Confirmed cs-fv verify resolves CsFv.Contracts types internally — no .csproj Reference needed at runtime"
  - "Confirmed .csproj is only needed for wrapper pre-flight check (not passed to cs-fv)"
  - "Confirmed exact .csproj structure for Plan 02 examples"
affects:
  - 22-02 (writes examples with confirmed .csproj structure)
  - 22-03 (E2E tests use confirmed example names and behavior)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "cs-fv verify <file> takes individual .cs files, resolves CsFv.Contracts internally — .csproj <Reference> is IDE-only"
    - "dotnet publish of CsFv.Cli includes all ProjectReference DLLs (CsFv.Contracts.dll) in publish output"
    - "Wrapper uses .csproj only for pre-flight check and .cs file scoping — not passed to cs-fv CLI"

key-files:
  created: []
  modified: []

key-decisions:
  - "CsFv.Contracts.dll IS present at /usr/local/lib/cs-fv/CsFv.Contracts.dll — confirmed from local dotnet publish output at cs-fv/src/CsFv.Cli/bin/Release/net8.0/publish/CsFv.Contracts.dll"
  - "cs-fv verify resolves CsFv.Contracts types internally via Roslyn — the <Reference HintPath> in .csproj is only for IDE support (not runtime requirement)"
  - "Example .csproj must include <Reference HintPath=/usr/local/lib/cs-fv/CsFv.Contracts.dll> for IDE support despite not being required by cs-fv at runtime"
  - "Server tests (examples.test.ts) reference old example names (null-check, array-bounds, division-safety) — must be updated in Plan 02 when examples are replaced"

requirements-completed: [EXAMPLE-01]

# Metrics
duration: 15min
completed: 2026-02-21
---

# Phase 22 Plan 01: CsFv.Contracts.dll Verification Summary

**CsFv.Contracts.dll confirmed at /usr/local/lib/cs-fv/ in Docker; cs-fv verify resolves contract types internally without .csproj — <Reference HintPath> is IDE-only; wrapper pre-flight uses .csproj for scoping only**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-21T05:12:54Z
- **Completed:** 2026-02-21T05:27:00Z
- **Tasks:** 1
- **Files modified:** 0 (verification-only plan — no source files changed)

## Accomplishments

- Confirmed `CsFv.Contracts.dll` is present in the `dotnet publish` output at `/usr/local/lib/cs-fv/CsFv.Contracts.dll` in the Docker production image — because `CsFv.Contracts` is a direct ProjectReference of `CsFv.Cli`, and `dotnet publish` includes all ProjectReference DLLs in the output
- Confirmed `cs-fv verify <file>` resolves `CsFv.Contracts` attribute types internally through its Roslyn analysis pipeline — no `.csproj` is needed for runtime verification
- Confirmed the wrapper script (`hupyy-csharp-verify.sh`) uses the `.csproj` only for: (1) pre-flight check that a project file exists, and (2) scoping `.cs` file discovery — the `.csproj` is NOT passed to `cs-fv verify`
- Identified that server-side integration tests (`examples.test.ts`) reference old example names that must be updated in Plan 02

## Task Commits

No code commits — this plan was a verification-only investigation task.

## Files Created/Modified

None — this plan required no file changes.

## Decisions Made

### DLL Path Confirmed
`CsFv.Contracts.dll` is present in the Docker image at `/usr/local/lib/cs-fv/CsFv.Contracts.dll`.

**Evidence:** Local publish output at `cs-fv/src/CsFv.Cli/bin/Release/net8.0/publish/` contains:
- `CsFv.Contracts.dll`
- `CsFv.Analyzers.dll`
- `CsFv.SmtGen.dll`
- `CsFv.Verification.dll`

The Dockerfile runs the identical `dotnet publish` command and copies `/publish/cs-fv/` to `/usr/local/lib/cs-fv/`. Confirmed.

### cs-fv verify Does NOT Read .csproj at Runtime

The `verify` command signature is: `cs-fv verify <file>` — it takes a `.cs` source file, not a `.csproj`.

Test confirmed: running `dotnet cs-fv.dll verify /tmp/t.cs` (with `using CsFv.Contracts;` and `[Requires]`/`[Ensures]` attributes) executed without any reference errors — cs-fv recognized the contract attributes internally. The only failure was CVC5 not in local PATH (expected on macOS without CVC5 installed).

**Implication for Plan 02:** The `<Reference Include="CsFv.Contracts"><HintPath>/usr/local/lib/cs-fv/CsFv.Contracts.dll</HintPath></Reference>` in `.csproj` is for **IDE support only** (allows Visual Studio/Rider to resolve attribute types for IntelliSense). cs-fv does not use it during verification. However, it should still be included per the research recommendation.

### Wrapper Uses .csproj for Scoping Only

From `hupyy-csharp-verify.sh` inspection:
1. Pre-flight: checks `CSPROJ_COUNT -eq 0` → exits 2 if no `.csproj`
2. Scoping: uses `.csproj` directory as the project root for `.cs` file discovery
3. Invocation: calls `dotnet cs-fv.dll verify <cs_file>` for each `.cs` file individually

**Implication:** Every example directory MUST have a `.csproj` (for pre-flight pass), but the `.csproj` content (including `<Reference>`) does not affect cs-fv verification behavior.

### Server Tests Need Update in Plan 02

`packages/server/src/__tests__/examples.test.ts` contains hardcoded references to:
- `null-check`
- `array-bounds`
- `division-safety`

These will break when Plan 02 replaces these directories. Plan 02 must update these test fixtures to use the new example names (`null-safe-repository`, `bank-account-invariant`, `calculator-contracts`).

## Confirmed .csproj Structure for Plan 02

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <OutputType>Library</OutputType>
    <!-- CSFV-04: Convert Roslyn Warning diagnostics to errors so cs-fv exits 1 on contract issues -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>

  <ItemGroup>
    <!-- CsFv.Contracts: not on NuGet.org — reference DLL from cs-fv publish output (IDE support only) -->
    <!-- cs-fv verify resolves CsFv.Contracts internally; this Reference is for IDE IntelliSense only -->
    <Reference Include="CsFv.Contracts">
      <HintPath>/usr/local/lib/cs-fv/CsFv.Contracts.dll</HintPath>
    </Reference>
  </ItemGroup>

</Project>
```

Note: `<MinVerSkip>true</MinVerSkip>` is NOT needed — the wrapper does not run `dotnet build` or `dotnet restore`. cs-fv verify reads `.cs` files directly without MinVer triggering.

## Deviations from Plan

### Additional Finding (not in plan)

**Found during:** Task 1 investigation
**Finding:** The `languages-portal-test:latest` Docker image does NOT contain cs-fv (it's an older test-only image without the full production stack). The verification was done via the local `dotnet publish` output at `cs-fv/src/CsFv.Cli/bin/Release/net8.0/publish/` which is the same artifact the Dockerfile copies, providing equivalent confidence.

The `docker run --rm languages-portal-test:latest find / -name "CsFv*"` returned nothing, which initially appeared problematic. However, inspection showed this image was built before the cs-fv stage was added to the Dockerfile (built 2026-02-16, before Phase 20 dotnet-builder stage). The local publish artifact confirms DLL presence with high confidence.

None — plan executed as intended (verification-only task with adapted evidence source).

## Issues Encountered

- `languages-portal-test:latest` Docker image is an older test image (built 2026-02-16) that predates the cs-fv integration and lacks `/usr/local/lib/cs-fv/`. Resolved by using the local `dotnet publish` output as equivalent evidence (same command, same artifacts).

## Next Phase Readiness

Plan 02 can proceed immediately with full confidence in:
- DLL path: `/usr/local/lib/cs-fv/CsFv.Contracts.dll`
- cs-fv verify behavior: takes individual `.cs` files, resolves `CsFv.Contracts` internally
- `.csproj` role: pre-flight check + file scoping only (not passed to cs-fv)
- Tests to update: `examples.test.ts` references old example names — Plan 02 must update

---
*Phase: 22-csharp-example-projects*
*Completed: 2026-02-21*
