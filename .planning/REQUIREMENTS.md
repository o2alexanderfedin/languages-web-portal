# Requirements: Hupyy Languages Web Portal

**Defined:** 2026-02-20
**Core Value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## v1.3 Requirements

Requirements for v1.3 C# Formal Verification milestone. Each maps to roadmap phases.

### Docker Infrastructure

- [x] **DOCKER-01**: Docker image includes a `dotnet-builder` stage that builds and publishes the cs-fv CLI DLL
- [x] **DOCKER-02**: Docker production image includes .NET runtime for executing `dotnet cs-fv.dll`
- [x] **DOCKER-03**: Docker production image includes `cvc5` and `z3` as system binaries (required by cs-fv on Linux — Z3 NuGet package only ships osx-x64/win-x64 native libs)
- [x] **DOCKER-04**: NuGet packages are pre-seeded during Docker build (no network calls at runtime — prevents 60-90s cold restore latency)

### C# FV Integration

- [x] **CSFV-01**: `hupyy-csharp-verify` wrapper script accepts `--input <dir>`, enumerates `.cs` files, runs cs-fv via `exec dotnet`, streams output to portal SSE
- [x] **CSFV-02**: C# Formal Verification tool status updated to `available` in tool registry and UI tool grid
- [x] **CSFV-03**: C# FV tool timeout set to 180,000ms (MSBuild + dotnet startup needs extra margin vs Java FV's 120s)
- [x] **CSFV-04**: Wrapper script handles Roslyn `Warning`-severity exit code 0 via `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in example `.csproj` files _(Phase 21 delivered wrapper exit-code passthrough; Phase 22 must deliver example `.csproj` files with this property)_

### C# Example Projects

- [x] **EXAMPLE-01**: Three C# example projects with `.csproj` files referencing the Hupyy FV analyzer NuGet package
- [x] **EXAMPLE-02**: Examples demonstrate modern C# features (records, pattern matching, nullable reference types) with FV contracts/invariants (progressive complexity)
- [x] **EXAMPLE-03**: At least one example contains intentional FV contract violations (demonstrates the tool finding real issues — mirrors Java FV pattern)
- [x] **EXAMPLE-04**: Examples visible and loadable via ExampleSelector UI with name + description (same pattern as Java FV examples)

### E2E Testing

- [ ] **E2E-01**: E2E tests cover C# tool selection and example loading in ExampleSelector UI
- [ ] **E2E-02**: E2E tests cover C# FV execution with Docker streaming and progress display
- [ ] **E2E-03**: E2E tests cover C# FV output file tree and results display
- [ ] **E2E-04**: E2E test covers the known-bad example (verifies tool correctly surfaces FV violations)

## Future Requirements

### Additional Tools

- C++ to C Transpiler integration (in development)
- C++ to Rust Transpiler integration (in development)
- Rust FV integration (very beginning)
- Python FV Linter integration (planning)
- TypeScript FV Linter integration (planning)

### Infrastructure

- Digital Ocean deployment with CI/CD pipeline
- Domain + HTTPS setup

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Public access, no logins |
| Persistent project storage | Ephemeral by design |
| CI/CD integration | Demo portal, not production pipeline |
| Visual regression testing | v2 scope |
| Accessibility testing (axe-core) | v2 scope |
| Performance/load testing | v2 scope |
| Java source code editing in browser | Upload-only, consistent with v1 pattern |
| Custom solver configuration | Z3/CVC5 bundled sufficient for demo |
| .NET SDK in production image | Runtime-only for smaller image; build in dotnet-builder stage |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCKER-01 | Phase 20 | Complete |
| DOCKER-02 | Phase 20 | Complete |
| DOCKER-03 | Phase 20 | Complete |
| DOCKER-04 | Phase 20 | Complete |
| CSFV-01 | Phase 21 | Complete |
| CSFV-02 | Phase 21 | Complete |
| CSFV-03 | Phase 21 | Complete |
| CSFV-04 | Phase 22 | Complete |
| EXAMPLE-01 | Phase 22 | Complete |
| EXAMPLE-02 | Phase 22 | Complete |
| EXAMPLE-03 | Phase 22 | Complete |
| EXAMPLE-04 | Phase 22 | Complete |
| E2E-01 | Phase 23 | Pending |
| E2E-02 | Phase 23 | Pending |
| E2E-03 | Phase 23 | Pending |
| E2E-04 | Phase 23 | Pending |

**Coverage:**
- v1.3 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 after initial definition*
