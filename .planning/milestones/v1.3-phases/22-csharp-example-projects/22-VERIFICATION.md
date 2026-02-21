---
phase: 22-csharp-example-projects
verified: 2026-02-20T00:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 22: C# Example Projects Verification Report

**Phase Goal:** Three ready-to-run C# example projects are available in the portal ExampleSelector, each with proper `.csproj` files referencing the Hupyy C# FV analyzer, FV contract annotations, and progressive complexity from simple null safety to an intentional invariant violation
**Verified:** 2026-02-20
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                          | Status     | Evidence                                                                                                        |
|----|-----------------------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------------|
| 1  | ExampleSelector dropdown lists exactly three C# FV examples                                   | VERIFIED   | `ls packages/server/examples/csharp-verification/` shows exactly: bank-account-invariant, calculator-contracts, null-safe-repository |
| 2  | Each example directory has a `.csproj` file (wrapper pre-flight passes)                       | VERIFIED   | `find` returns 3 `.csproj` files, one per directory: `Example.csproj` in each                                   |
| 3  | All three `.csproj` files include `TreatWarningsAsErrors=true`                                | VERIFIED   | `grep -r "TreatWarningsAsErrors"` returns 3 matches, one per `.csproj`                                          |
| 4  | The `bank-account-invariant` example contains an intentional FV contract violation            | VERIFIED   | `BankAccount.cs` line 35: `[Ensures("balance > 0")]` on `Withdraw` — SMT counterexample: `amount == balance → balance == 0` |
| 5  | All three examples use modern C# features                                                     | VERIFIED   | null-safe-repository: `record User`, nullable `?`, switch expression; bank-account-invariant: primary constructor `BankAccount(decimal initialBalance)`; calculator-contracts: abstract records discriminated union, switch expression |
| 6  | Old placeholder directories (null-check, array-bounds, division-safety) are removed          | VERIFIED   | `ls packages/server/examples/csharp-verification/` confirms only 3 new directories exist                        |
| 7  | Examples are loadable via ExampleSelector UI with name + description                          | VERIFIED   | ExampleService.getToolExamples() reads directory listing then parses README.md first non-heading line; all 3 README.md files have substantive description lines; server test at line 66-78 asserts all 3 names returned for csharp-verification |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/server/examples/csharp-verification/null-safe-repository/Example.csproj` | Project file with TreatWarningsAsErrors | VERIFIED | Present, 21 lines, contains `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` and `<Reference HintPath="/usr/local/lib/cs-fv/CsFv.Contracts.dll">` |
| `packages/server/examples/csharp-verification/null-safe-repository/NullSafeRepository.cs` | C# source with nullable types, records, FV contracts | VERIFIED | Present, 43 lines; `public record User`, nullable `?`, switch expression, `[Requires]`/`[Ensures]`/`[Pure]` attributes |
| `packages/server/examples/csharp-verification/null-safe-repository/README.md` | Description for ExampleSelector | VERIFIED | Present; first non-heading line: "Demonstrates nullable reference type safety with formal verification..." |
| `packages/server/examples/csharp-verification/bank-account-invariant/Example.csproj` | Project file with TreatWarningsAsErrors | VERIFIED | Present, 21 lines, identical structure with `TreatWarningsAsErrors=true` |
| `packages/server/examples/csharp-verification/bank-account-invariant/BankAccount.cs` | C# source with intentional invariant violation | VERIFIED | Present, 41 lines; `[ClassInvariant("balance >= 0")]`, primary constructor (C# 12), `[Ensures("balance > 0")]` on Withdraw — intentional violation documented |
| `packages/server/examples/csharp-verification/bank-account-invariant/README.md` | Description for ExampleSelector | VERIFIED | Present; first non-heading line: "A bank account class with a class invariant..." |
| `packages/server/examples/csharp-verification/calculator-contracts/Example.csproj` | Project file with TreatWarningsAsErrors | VERIFIED | Present, 21 lines, identical structure with `TreatWarningsAsErrors=true` |
| `packages/server/examples/csharp-verification/calculator-contracts/Calculator.cs` | C# source with pattern matching, discriminated unions | VERIFIED | Present, 42 lines; `abstract record Operation`, switch expression pattern matching |
| `packages/server/examples/csharp-verification/calculator-contracts/README.md` | Description for ExampleSelector | VERIFIED | Present; first non-heading line: "A calculator using C# discriminated unions (abstract records)..." |
| `.planning/REQUIREMENTS.md` | CSFV-04 and EXAMPLE-01..04 marked [x] | VERIFIED | All 5 requirements show `[x]` and traceability table shows Complete |
| `e2e/tests/landing-content.spec.ts` | csharp-verification expected status 'Available' | VERIFIED | Line 55: `'csharp-verification': 'Available'` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| README.md first non-heading line | ExampleSelector description field | `ExampleService.getToolExamples()` reads README, extracts first non-heading line | WIRED | `exampleService.ts` lines 45-57: reads README.md, iterates lines, returns first non-empty non-heading line as `description`; all 3 READMEs have substantive first non-heading lines |
| `Example.csproj <TreatWarningsAsErrors>` | cs-fv exit code 1 on verification failures | MSBuild Roslyn Warning-to-error conversion | WIRED | All 3 `.csproj` files contain `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`; 22-01-SUMMARY confirmed cs-fv wrapper reads `.csproj` for pre-flight, cs-fv resolves contracts internally |
| `bank-account-invariant Withdraw [Ensures("balance > 0")]` | cs-fv failure output | SMT solver counterexample: amount == balance → balance == 0 | WIRED | `BankAccount.cs` line 35: `[Ensures("balance > 0")]` with `[Requires("amount <= balance")]`; the invariant violation is mathematically provable (amount == balance case) |
| `ExampleSelector` client component | `/api/examples/:toolId` | `useGetExamplesQuery` from `executionApi` | WIRED | `ExampleSelector.tsx` line 2 imports `useGetExamplesQuery`; `executionApi.ts` line 25-27 maps `getExamples` to `GET /examples/${toolId}`; route mounted in `examples.ts` at `GET /examples/:toolId` |
| Directory listing `packages/server/examples/csharp-verification/` | ExampleSelector dropdown items | `ExampleService.getToolExamples()` reads directory | WIRED | `exampleService.ts` lines 36-44: reads the tool directory, iterates `withFileTypes`, pushes each subdirectory as an example; the 3 new directories will be returned |
| `csharp-verification` tool registry `available: true` | ExampleSelector rendered in UI | Tool availability check in ExecutionPanel | WIRED | `toolRegistry.ts` line 21-26: `id: 'csharp-verification'`, `available: true` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EXAMPLE-01 | 22-02-PLAN.md | Three C# example projects with `.csproj` files referencing the Hupyy FV analyzer | SATISFIED | 3 `.csproj` files present, each with `<Reference HintPath="/usr/local/lib/cs-fv/CsFv.Contracts.dll">`. Note: requirement says "NuGet package" but confirmed implementation uses local DLL HintPath — functionally equivalent and documented as correct approach in 22-01-SUMMARY.md |
| EXAMPLE-02 | 22-02-PLAN.md | Examples demonstrate modern C# features with FV contracts/invariants (progressive complexity) | SATISFIED | null-safe-repository: records + nullable + switch pattern; bank-account-invariant: ClassInvariant + primary constructor + Ghost/Modifies; calculator-contracts: abstract records + switch expressions. Progressive complexity confirmed |
| EXAMPLE-03 | 22-02-PLAN.md | At least one example contains intentional FV contract violations | SATISFIED | `bank-account-invariant/BankAccount.cs` line 35: `[Ensures("balance > 0")]` on Withdraw — with `[Requires("amount <= balance")]`, the case `amount == balance → balance == 0` violates the postcondition |
| EXAMPLE-04 | 22-02-PLAN.md | Examples visible and loadable via ExampleSelector UI with name + description | SATISFIED | ExampleService reads directory + README.md; ExampleSelector renders dropdown with names and description text; server integration tests at lines 66-78 and 162-176 confirm the GET and POST endpoints work correctly for csharp-verification examples |
| CSFV-04 | 22-02-PLAN.md, 22-03-PLAN.md | Wrapper handles Roslyn Warning exit code via TreatWarningsAsErrors in example `.csproj` files | SATISFIED | All 3 `.csproj` files contain `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`; REQUIREMENTS.md line 22 shows `[x]` with correct description noting split delivery across Phase 21 + 22 |

**Orphaned requirements check:** No REQUIREMENTS.md requirements mapped to Phase 22 are absent from plans. All 4 EXAMPLE requirements and CSFV-04 are claimed by 22-02-PLAN.md and 22-03-PLAN.md.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

All three `.cs` source files were scanned for TODO/FIXME/PLACEHOLDER/empty returns — none found. The `BankAccount.cs` intentional violation comment (`// BUG: should be "balance >= 0" — intentional violation for demo`) is design intent, not an anti-pattern.

### Human Verification Required

The following items require live Docker execution to fully verify; they cannot be confirmed from static code analysis alone:

#### 1. null-safe-repository Passes Verification

**Test:** Load the `null-safe-repository` example via ExampleSelector, execute with csharp-verification tool against the running Docker container
**Expected:** Execution completes with `status: completed`, streaming output shows all contracts passing (no failed contracts)
**Why human:** Requires Docker container running with cs-fv + CVC5/Z3 binaries; cannot execute the SMT solver from static analysis

#### 2. bank-account-invariant Fails Verification

**Test:** Load the `bank-account-invariant` example via ExampleSelector, execute with csharp-verification tool against the running Docker container
**Expected:** Execution completes with `status: failed`, streaming output contains diagnostic message identifying the Withdraw postcondition violation
**Why human:** Requires Docker container running with cs-fv + CVC5/Z3 SMT solver to actually find the counterexample

#### 3. calculator-contracts Passes Verification

**Test:** Load the `calculator-contracts` example via ExampleSelector, execute with csharp-verification tool
**Expected:** Execution completes with `status: completed`, all contracts verified
**Why human:** Requires Docker + SMT solver execution

#### 4. ExampleSelector Dropdown Renders Correctly

**Test:** Navigate to portal, select "C# Formal Verification" tool, observe ExampleSelector dropdown
**Expected:** Dropdown shows exactly three options: `null-safe-repository`, `bank-account-invariant`, `calculator-contracts`, each with description text from README.md
**Why human:** Requires running portal UI; server integration tests confirm backend behavior but UI rendering needs visual confirmation

---

## Gaps Summary

No gaps. All 7 observable truths verified. All 11 artifacts are present with substantive content. All 6 key links are wired. All 5 requirements (EXAMPLE-01..04, CSFV-04) are satisfied with evidence.

The only nuance worth noting: EXAMPLE-01 in REQUIREMENTS.md says "referencing the Hupyy FV analyzer NuGet package" but the implementation correctly uses `<Reference HintPath="/usr/local/lib/cs-fv/CsFv.Contracts.dll">` — a local DLL reference. This is the confirmed correct approach documented in 22-01-SUMMARY.md (CsFv.Contracts is not on NuGet.org; the HintPath approach is the right pattern for this use case). The requirement wording is imprecise but the implementation is correct.

4 human-verification items are flagged because they require Docker + SMT solver execution. These are runtime behavior tests that cannot be confirmed from static code analysis alone.

---

_Verified: 2026-02-20_
_Verifier: Claude (gsd-verifier)_
