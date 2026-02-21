---
phase: 22-csharp-example-projects
plan: 02
subsystem: examples
tags: [dotnet, cs-fv, csharp, formal-verification, examples, tdd]

# Dependency graph
requires:
  - phase: 22-01
    provides: CsFv.Contracts.dll path confirmed, cs-fv verify behavior confirmed, .csproj structure confirmed
provides:
  - "Three complete C# FV example directories ready for ExampleSelector discovery"
  - "null-safe-repository: records + nullable types + passing FV contracts"
  - "bank-account-invariant: ClassInvariant + intentional Withdraw Ensures violation"
  - "calculator-contracts: abstract records (discriminated union) + switch expressions + passing FV contracts"
  - "examples.test.ts updated to reference new example names"
affects:
  - 22-03 (E2E tests use these three example names)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "C# primary constructors (C# 12) used in BankAccount"
    - "Abstract records for discriminated unions (C# 9+) used in Calculator"
    - "Nullable reference types (C# 8+) used in NullSafeRepository"
    - "CsFv.Contracts [Requires]/[Ensures]/[Pure]/[Ghost]/[Modifies]/[ClassInvariant] attributes"
    - "Example .csproj: TreatWarningsAsErrors=true + Reference HintPath=/usr/local/lib/cs-fv/CsFv.Contracts.dll"

key-files:
  created:
    - packages/server/examples/csharp-verification/null-safe-repository/Example.csproj
    - packages/server/examples/csharp-verification/null-safe-repository/NullSafeRepository.cs
    - packages/server/examples/csharp-verification/null-safe-repository/README.md
    - packages/server/examples/csharp-verification/bank-account-invariant/Example.csproj
    - packages/server/examples/csharp-verification/bank-account-invariant/BankAccount.cs
    - packages/server/examples/csharp-verification/bank-account-invariant/README.md
    - packages/server/examples/csharp-verification/calculator-contracts/Example.csproj
    - packages/server/examples/csharp-verification/calculator-contracts/Calculator.cs
    - packages/server/examples/csharp-verification/calculator-contracts/README.md
  modified:
    - packages/server/src/__tests__/examples.test.ts

key-decisions:
  - "bank-account-invariant intentional violation: Withdraw with Ensures(balance > 0) when amount == balance yields balance == 0 — SMT-provable counterexample"
  - "Used confirmed .csproj structure from 22-01: TreatWarningsAsErrors=true + Reference HintPath for IDE support, no MinVerSkip needed"
  - "examples.test.ts updated in Task 2 (Rule 2 auto-fix) — tests referenced deleted old example directories, causing test failures"
  - "Deleted old non-functional placeholders: null-check, array-bounds, division-safety (had Program.cs but no .csproj — wrapper exit 2)"

requirements-completed: [EXAMPLE-01, EXAMPLE-02, EXAMPLE-03, EXAMPLE-04, CSFV-04]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 22 Plan 02: C# Example Projects Summary

**Three C# FV examples created (null-safe-repository/bank-account-invariant/calculator-contracts) with .csproj TreatWarningsAsErrors=true, CsFv.Contracts annotations, and modern C# features — replacing non-functional placeholders**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-21T05:17:20Z
- **Completed:** 2026-02-21T05:19:29Z
- **Tasks:** 2
- **Files modified:** 10 (9 created, 1 updated)

## Accomplishments

- Removed three non-functional placeholder example directories (null-check, array-bounds, division-safety) — they had `Program.cs` and `README.md` but no `.csproj`, causing wrapper pre-flight exit 2
- Created `null-safe-repository` with records (C# 9+), nullable reference types, and passing FV contracts ([Requires], [Ensures], [Pure])
- Created `bank-account-invariant` with ClassInvariant, primary constructor (C# 12), [Ghost]/[Modifies] annotations, and intentional Withdraw violation (`Ensures("balance > 0")` — SMT counterexample: `amount == balance → balance == 0`)
- Created `calculator-contracts` with abstract records discriminated union (C# 9+), switch expressions for pattern matching, and passing FV contracts
- Updated `examples.test.ts` to reference new example names and files (auto-fix Rule 2 — old names caused test failures)
- All 131 server tests pass after update

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Remove old examples, create null-safe-repository | `ad3121b` |
| 2 | Create bank-account-invariant, calculator-contracts, update tests | `615d7ec` |

## Files Created/Modified

**Created:**
- `packages/server/examples/csharp-verification/null-safe-repository/Example.csproj`
- `packages/server/examples/csharp-verification/null-safe-repository/NullSafeRepository.cs`
- `packages/server/examples/csharp-verification/null-safe-repository/README.md`
- `packages/server/examples/csharp-verification/bank-account-invariant/Example.csproj`
- `packages/server/examples/csharp-verification/bank-account-invariant/BankAccount.cs`
- `packages/server/examples/csharp-verification/bank-account-invariant/README.md`
- `packages/server/examples/csharp-verification/calculator-contracts/Example.csproj`
- `packages/server/examples/csharp-verification/calculator-contracts/Calculator.cs`
- `packages/server/examples/csharp-verification/calculator-contracts/README.md`

**Modified:**
- `packages/server/src/__tests__/examples.test.ts` — updated csharp-verification example names and POST test

## Decisions Made

### .csproj Structure
Used the exact structure confirmed in 22-01-SUMMARY.md:
- `TreatWarningsAsErrors=true` (CSFV-04 requirement — Roslyn emits contract violations as Warnings by default)
- `<Reference Include="CsFv.Contracts"><HintPath>/usr/local/lib/cs-fv/CsFv.Contracts.dll</HintPath></Reference>` (IDE IntelliSense only — cs-fv resolves types internally)
- No `<MinVerSkip>` needed (wrapper does not run `dotnet build`)

### Intentional Violation Mechanism
`BankAccount.Withdraw` with `[Ensures("balance > 0")]`:
- Precondition: `amount > 0` and `amount <= balance`
- Counterexample: `balance = 100, amount = 100` → `balance - amount = 0` which violates `balance > 0`
- Fix would be: `[Ensures("balance >= 0")]` (matching the ClassInvariant)
- This demonstrates cs-fv's ability to find edge-case contract violations that unit tests often miss

### Old Examples Deletion
Old placeholders (null-check, array-bounds, division-safety) had hand-written Program.cs with no FV contracts and no .csproj. They caused wrapper exit 2 (pre-flight failure). Replacing all three was the correct approach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Correctness] Updated examples.test.ts with new example names**
- **Found during:** Task 2
- **Issue:** `examples.test.ts` contained hardcoded references to old example names (`null-check`, `array-bounds`, `division-safety`) — noted in 22-01-SUMMARY as "Plan 02 must update these tests"
- **Fix:** Updated GET test to check for new names; updated POST test for `null-check` → `null-safe-repository` with new expected files (`NullSafeRepository.cs`, `Example.csproj`, `README.md`)
- **Files modified:** `packages/server/src/__tests__/examples.test.ts`
- **Commit:** `615d7ec`

## Verification Results

```
ls packages/server/examples/csharp-verification/
  bank-account-invariant  calculator-contracts  null-safe-repository  ✓

find ... -name "*.csproj" | sort  →  3 files (one per example)  ✓
grep -r "TreatWarningsAsErrors.*true" ... | wc -l  →  3  ✓
grep "using CsFv.Contracts" .../*/*.cs  →  3 matches  ✓
grep "ClassInvariant" bank-account-invariant/BankAccount.cs  →  [ClassInvariant("balance >= 0")]  ✓
grep 'balance > 0' bank-account-invariant/BankAccount.cs  →  [Ensures("balance > 0")] intentional violation  ✓
All 131 server tests pass  ✓
```

## Next Phase Readiness

Plan 03 (E2E tests) can proceed with:
- Example names: `null-safe-repository`, `bank-account-invariant`, `calculator-contracts`
- `bank-account-invariant` is the failing example (Withdraw contract violation)
- `null-safe-repository` and `calculator-contracts` should pass verification
- All examples have `.csproj` so wrapper pre-flight will pass (exit 0, not 2)

---
*Phase: 22-csharp-example-projects*
*Completed: 2026-02-21*
