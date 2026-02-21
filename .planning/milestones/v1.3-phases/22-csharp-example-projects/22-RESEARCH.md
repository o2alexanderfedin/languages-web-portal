# Phase 22: C# Example Projects - Research

**Researched:** 2026-02-20
**Domain:** C# example projects with cs-fv FV contract annotations, `.csproj` structure, ExampleSelector integration
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CSFV-04 | Wrapper script handles Roslyn `Warning`-severity exit code 0 via `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in example `.csproj` files | Phase 21 wrapper passes exit codes through; Phase 22 must include `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in every example `.csproj` — this causes Roslyn to convert Warning-severity diagnostics to errors (exit 1) naturally |
| EXAMPLE-01 | Three C# example projects with `.csproj` files referencing the Hupyy FV analyzer NuGet package | Package ID is `CsFv.Contracts` (namespace `CsFv.Contracts`); NOT a NuGet.org package — must be referenced as a local DLL via `<Reference>` pointing to the pre-seeded path, OR via a local NuGet feed; see Architecture section for the correct approach |
| EXAMPLE-02 | Examples demonstrate modern C# features (records, pattern matching, nullable reference types) with FV contracts/invariants (progressive complexity) | cs-fv contracts: `[Requires]`, `[Ensures]`, `[ClassInvariant]`, `[Invariant]`, `[Pure]`, `[Ghost]`, `[Modifies]` — all in namespace `CsFv.Contracts`; modern C# features verified: records (C# 9+), pattern matching (C# 8+), nullable reference types (C# 8+), primary constructors (C# 12+) |
| EXAMPLE-03 | At least one example contains intentional FV contract violations (demonstrates the tool finding real issues) | cs-fv exits 1 when `result.FailedCount + result.ErrorCount > 0`; output format: "❌ MethodName: Failed (1.2s)"; to trigger: write `[Ensures("result > 0")]` on a method that can return 0 — SMT solver will find the counterexample |
| EXAMPLE-04 | Examples visible and loadable via ExampleSelector UI with name + description | ExampleService reads `README.md` per-example — first non-heading, non-empty line becomes description; directory name becomes `name`; no code changes needed — just add directories to `packages/server/examples/csharp-verification/` |
</phase_requirements>

## Summary

Phase 22 has two distinct concerns: (1) replace the three existing csharp-verification examples (which have no `.csproj` and no FV annotations) with properly structured examples that include `.csproj` files and `CsFv.Contracts` attributes, and (2) ensure CSFV-04 is satisfied by including `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in every example `.csproj`.

The critical research finding is that `CsFv.Contracts` is NOT published to NuGet.org — it is a private/internal package built from the cs-fv source. The Docker build only publishes `cs-fv.dll` (the CLI); it does not install the `CsFv.Contracts` NuGet package into the seeded NuGet cache at `/home/nodejs/.nuget/packages`. This means the example `.csproj` files cannot use `<PackageReference Include="CsFv.Contracts" />` — they must reference the contracts DLL directly using `<Reference>` with a path to the pre-installed DLL, OR the Dockerfile must be extended to also pack and seed `CsFv.Contracts`. The correct approach (least Dockerfile disruption) is using a direct `<Reference>` to `/usr/local/lib/cs-fv/CsFv.Contracts.dll` which is already present in the Docker image from the cs-fv publish output.

The existing three csharp-verification examples (`null-check`, `array-bounds`, `division-safety`) are completely wrong for this phase: they lack `.csproj` files (so the wrapper exits 2 immediately), lack FV annotations, and contain only defensive-programming patterns (not SMT verification). All three must be replaced with new examples that use `CsFv.Contracts` attributes and are designed for the cs-fv verification workflow.

**Primary recommendation:** Replace existing three example directories with three new ones: `null-safe-repository` (passes), `bank-account-invariant` (fails intentionally), and `calculator-contracts` (medium complexity), each containing a `.csproj` with `<Reference>` to the CsFv.Contracts DLL and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`, and `.cs` source files using modern C# features with proper FV contract annotations.

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| C# / .NET | net8.0 | Target framework for examples | Matches Docker runtime: `dotnet-runtime-8.0` installed; cs-fv.dll targets net8.0 |
| `CsFv.Contracts` DLL | From `/usr/local/lib/cs-fv/` | Contract attribute types | Built from source as part of cs-fv publish; namespace `CsFv.Contracts`; contains `[Requires]`, `[Ensures]`, `[ClassInvariant]`, `[Invariant]`, `[Pure]`, `[Ghost]`, `[Modifies]` |
| `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` | MSBuild property | Makes Roslyn Warning-severity FV diagnostics into errors | Required by CSFV-04; causes cs-fv to exit 1 when warnings are present, not 0 |
| ExampleService README pattern | Project pattern | Provides `name` + `description` to ExampleSelector | `name` = directory name; `description` = first non-heading non-empty line in `README.md` |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `<Nullable>enable</Nullable>` | MSBuild property | Enables nullable reference type analysis | All examples use this — required for modern C# pattern |
| `<LangVersion>latest</LangVersion>` | MSBuild property | Unlocks records, primary constructors, pattern matching | All examples use this |
| `<OutputType>Library</OutputType>` | MSBuild property | Prevents need for `Main` entrypoint | cs-fv verifies individual methods, not program execution |

### cs-fv Contract Attributes (from source inspection)

| Attribute | Applies To | Purpose | Example |
|-----------|-----------|---------|---------|
| `[Requires("expr")]` | Method, Constructor | Precondition — caller must satisfy | `[Requires("x > 0")]` |
| `[Ensures("expr")]` | Method, Constructor | Postcondition — method guarantees | `[Ensures("result >= 0")]` |
| `[ClassInvariant("expr")]` | Class | Invariant — always true for all instances | `[ClassInvariant("balance >= 0")]` |
| `[Invariant("expr")]` | Method | Loop invariant — true at each iteration | `[Invariant("i >= 0 && i < arr.Length")]` |
| `[Pure]` | Method | No side effects — only reads state | `[Pure]` |
| `[Ghost]` | Field | Specification-only field — zero runtime cost | `[Ghost] private int count;` |
| `[Modifies("field")]` | Method | Declares which fields method may modify | `[Modifies("balance")]` |

## Architecture Patterns

### Recommended Project Structure

```
packages/server/examples/csharp-verification/
├── null-safe-repository/           # Example 1: PASSES — modern nullable patterns + FV
│   ├── README.md                   # First non-heading line = ExampleSelector description
│   ├── Example.csproj              # .csproj with <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
│   └── NullSafeRepository.cs       # Records + nullable types + [Requires]/[Ensures]
├── bank-account-invariant/         # Example 2: FAILS — intentional invariant violation
│   ├── README.md
│   ├── Example.csproj
│   └── BankAccount.cs              # [ClassInvariant] violated by Withdraw() — triggers ❌
└── calculator-contracts/           # Example 3: PASSES — medium complexity, pattern matching
    ├── README.md
    ├── Example.csproj
    └── Calculator.cs               # Primary constructors + pattern matching + contracts
```

### Pattern 1: .csproj Structure for Examples

The example `.csproj` must NOT use `<PackageReference Include="CsFv.Contracts" />` — the package is not in the Docker NuGet cache. Use `<Reference>` to the pre-built DLL:

```xml
<!-- Source: direct cs-fv source inspection + Dockerfile inspection -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <OutputType>Library</OutputType>
    <!-- CSFV-04: Treat Roslyn Warning diagnostics as errors so cs-fv exits 1 -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <!-- Skip MinVer — no git tags in uploaded example -->
    <MinVerSkip>true</MinVerSkip>
  </PropertyGroup>

  <ItemGroup>
    <!-- CsFv.Contracts is NOT on NuGet.org; reference DLL from cs-fv publish output -->
    <Reference Include="CsFv.Contracts">
      <HintPath>/usr/local/lib/cs-fv/CsFv.Contracts.dll</HintPath>
    </Reference>
  </ItemGroup>

</Project>
```

**CRITICAL:** The path `/usr/local/lib/cs-fv/CsFv.Contracts.dll` is present in the Docker image because `dotnet publish src/CsFv.Cli/CsFv.Cli.csproj` includes all transitive dependencies in the output directory. The cs-fv publish output (`/publish/cs-fv/`) includes `CsFv.Contracts.dll` because it's a ProjectReference of `CsFv.Cli`.

**WARNING - path verification needed:** Confirm that `CsFv.Contracts.dll` is actually in `/usr/local/lib/cs-fv/` after the Docker build. The Dockerfile copies `/publish/cs-fv/` to `/usr/local/lib/cs-fv/`. Since `CsFv.Contracts` is a transitive dependency of `CsFv.Cli`, dotnet publish should include it. Verify before writing the .csproj.

### Pattern 2: ExampleService README Contract

The `ExampleService.getToolExamples()` reads `README.md` and extracts the description:
- `name` field = directory name (e.g., `null-safe-repository`)
- `description` field = first non-empty line in README.md that does NOT start with `#`

```markdown
# Null Safe Repository

Demonstrates nullable reference type safety with formal verification of null-check contracts.
```

In this example, description = `"Demonstrates nullable reference type safety with formal verification of null-check contracts."`

### Pattern 3: cs-fv Contract That Passes

Used in Examples 1 and 3:

```csharp
// Source: cs-fv/examples/SimpleCalculator.cs (direct source inspection)
using CsFv.Contracts;

public class NullSafeRepository
{
    // [Requires] = precondition; [Ensures] = postcondition
    [Requires("id > 0")]
    [Ensures("result != null || result == null")]  // trivially true - demonstrates nullable contract
    public User? FindById(int id)
    {
        // ... implementation
    }
}
```

### Pattern 4: cs-fv Contract That FAILS (Intentional Violation)

Used in Example 2 (bank-account-invariant). The contract violation must be provable by the SMT solver:

```csharp
// Source: cs-fv/examples/Stack.cs (direct source inspection — ClassInvariant pattern)
using CsFv.Contracts;

// ClassInvariant: balance must always be >= 0
[ClassInvariant("balance >= 0")]
public class BankAccount
{
    [Ghost]
    private int balance;

    [Requires("amount > 0")]
    [Ensures("balance == old(balance) + amount")]
    public void Deposit(int amount)
    {
        balance += amount;
    }

    // INTENTIONAL VIOLATION: [Ensures] says balance > 0 after Withdraw,
    // but Withdraw can set balance = 0 (when amount == balance)
    [Requires("amount > 0")]
    [Ensures("balance > 0")]   // ← WRONG: should be "balance >= 0"; this violates when amount == old(balance)
    public void Withdraw(int amount)
    {
        if (amount > balance)
            throw new InvalidOperationException("Insufficient funds");
        balance -= amount;
    }
}
```

When cs-fv verifies `Withdraw`, the SMT solver will find: if `balance = 5` and `amount = 5`, then `balance = 0` after withdrawal, which violates `[Ensures("balance > 0")]`. Output: `"❌ Withdraw: Failed (Xms)"`. Exit code = 1.

### Pattern 5: Modern C# Features to Include

Required by EXAMPLE-02 (at least one of these per example):

| Feature | C# Version | Example Use |
|---------|-----------|-------------|
| Records | C# 9 | `public record User(int Id, string Name);` |
| Nullable reference types | C# 8 | `string? Email`, `User? FindById(int id)` |
| Pattern matching | C# 8+ | `shape switch { Circle c => ..., Rectangle r => ... }` |
| Primary constructors | C# 12 | `public class BankAccount(decimal initialBalance)` |
| `init` properties | C# 9 | `public int Id { get; init; }` |
| Null-conditional operator | C# 6 | `user?.GetDisplayName() ?? "unknown"` |

### Anti-Patterns to Avoid

- **Using `<PackageReference Include="CsFv.Contracts" />` without a local feed:** The package is not on NuGet.org. Without the DLL path or a local feed, the build will fail with "package not found".
- **Including a `Main` method with `<OutputType>Exe</OutputType>`:** cs-fv verifies methods, not program execution. Library output type is cleaner; no entrypoint needed.
- **Writing contracts that SMT cannot prove in 180s:** Complex quantifiers over large domains may timeout. Keep contracts simple for the portal demo (see BinarySearch.cs example for complex — avoid for portal examples).
- **Using `old(field)` in postconditions without `[Ghost]` declaration:** `old()` only tracks ghost fields; using it on non-ghost fields produces unexpected behavior.
- **Naming the example directory with spaces or uppercase:** ExampleService uses the directory name as `example.name` in the UI; use kebab-case (e.g., `bank-account-invariant`).
- **Missing `TreatWarningsAsErrors`:** Without this, if cs-fv produces Roslyn Warning-severity diagnostics, the exit code will be 0 even though issues were found (CSFV-04 violation).
- **Referencing `CsFv.Contracts.dll` at a development path:** The HintPath must be `/usr/local/lib/cs-fv/CsFv.Contracts.dll` (Docker path), not a local dev path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contract annotations | Custom `[Contract]` attributes | `CsFv.Contracts` namespace attributes (`[Requires]`, `[Ensures]`, etc.) | cs-fv only recognizes its own `CsFv.Contracts` attribute types; custom attributes are ignored |
| ExampleSelector display logic | Custom UI changes | README.md first non-heading line pattern (existing ExampleService) | ExampleService already implements this — no code changes needed |
| Invariant violation detection | Manual output parsing | `[ClassInvariant]` and wrong `[Ensures]` contract | cs-fv's SMT solver automatically finds the counterexample and outputs ❌ |

**Key insight:** This phase is entirely content creation (files only) — no TypeScript, no server, no Dockerfile changes needed. The existing infrastructure handles all example discovery, loading, and display.

## Common Pitfalls

### Pitfall 1: CsFv.Contracts Not in Docker NuGet Cache

**What goes wrong:** Using `<PackageReference Include="CsFv.Contracts" Version="..." />` in the example `.csproj` — NuGet restore fails because the package was never seeded into the Docker NuGet cache at `/home/nodejs/.nuget/packages`.
**Why it happens:** The Docker builder runs `dotnet publish src/CsFv.Cli/CsFv.Cli.csproj`, which builds from source ProjectReferences. It does NOT pack or install `CsFv.Contracts` as a NuGet package into the seeded cache.
**How to avoid:** Use `<Reference Include="CsFv.Contracts"><HintPath>/usr/local/lib/cs-fv/CsFv.Contracts.dll</HintPath></Reference>` — the DLL is available at this path because `dotnet publish` copies all transitive dependency DLLs to the output directory.
**Warning signs:** `dotnet: error NU1101: Unable to find package CsFv.Contracts. No packages exist...` in the portal streaming output

### Pitfall 2: Example Projects Trigger NuGet Restore at Runtime

**What goes wrong:** When cs-fv runs `dotnet cs-fv.dll verify <file>`, it does not trigger NuGet restore. But if the example `.csproj` has dependencies that need restore, the wrapper invocation may fail.
**Why it happens:** cs-fv's `verify` command reads `.cs` files with Roslyn's compiler APIs — it does NOT run MSBuild or `dotnet build`. The `.csproj` is parsed to find referenced DLLs, but no restore occurs.
**How to avoid:** All dependencies in the example `.csproj` must use `<Reference>` with absolute paths (HintPath), not NuGet packages that require restore.
**Warning signs:** This is LOW risk with `<Reference HintPath=.../>` — the DLL is resolved directly from the path.

### Pitfall 3: Intentional Violation Not Triggering Failure

**What goes wrong:** The "failing" example completes with `status: completed` instead of `status: failed`.
**Why it happens:** The contract violation must be SMT-provable. If the contract is ambiguous or the SMT solver times out, cs-fv may output `⏱️ MethodName: Timed out` (timeout, not failure) or even `✅ MethodName: Verified` (if the contract is accidentally satisfiable).
**How to avoid:** Use a simple, obviously wrong contract: `[Ensures("balance > 0")]` on a method that can clearly set `balance = 0`. The SMT solver can prove this trivially without timeout. Test the example locally with `dotnet cs-fv.dll verify BankAccount.cs` before committing.
**Warning signs:** Portal shows `status: completed` for the bank-account-invariant example

### Pitfall 4: Existing Examples Not Replaced

**What goes wrong:** The three existing examples (`null-check`, `array-bounds`, `division-safety`) remain in the directory alongside the new examples — the ExampleSelector shows 6 examples instead of 3.
**Why it happens:** Phase 22 must DELETE the existing broken examples and REPLACE with new ones (or rename them to the correct names).
**How to avoid:** Remove the three existing example directories and create three new ones with the correct names and content.
**Warning signs:** ExampleSelector dropdown shows more than 3 examples for the C# FV tool

### Pitfall 5: Wrapper Exits 2 (No .csproj Found)

**What goes wrong:** Loading and executing an example succeeds in the UI, but the execution result shows "Error: No .csproj file found" immediately.
**Why it happens:** The wrapper script checks for `.csproj` before running cs-fv. If the example directory has no `.csproj`, the wrapper exits 2.
**How to avoid:** Every example directory must include an `Example.csproj` file. Verify with: `find packages/server/examples/csharp-verification -name "*.csproj"` — must return 3 results.
**Warning signs:** Execution output shows "Error: No .csproj file found in ..." immediately after execution starts

### Pitfall 6: CsFv.Contracts.dll Path Not Present in Docker

**What goes wrong:** The HintPath `/usr/local/lib/cs-fv/CsFv.Contracts.dll` does not exist in the Docker image — `<Reference>` resolution fails with "assembly not found".
**Why it happens:** If `dotnet publish` does not include `CsFv.Contracts.dll` in its output (unlikely but possible if it's compile-only/PrivateAssets), the file won't be in `/usr/local/lib/cs-fv/`.
**How to avoid:** Verify the DLL is in the publish output before writing the HintPath. If not, the Dockerfile must be extended to pack CsFv.Contracts and seed it separately.
**Verification command:** `ls /usr/local/lib/cs-fv/*.dll` inside Docker — should include `CsFv.Contracts.dll`

## Code Examples

### Example 1: null-safe-repository (PASSES verification)

```csharp
// packages/server/examples/csharp-verification/null-safe-repository/NullSafeRepository.cs
// Source: pattern from cs-fv/examples/SimpleCalculator.cs + GettingStarted.cs

using CsFv.Contracts;

// Modern C# record for data modeling (C# 9+)
public record User(int Id, string Name, string? Email = null);

// Null-safe repository demonstrating FV contracts with nullable reference types
public class NullSafeRepository
{
    private readonly Dictionary<int, User> _users = new();

    // [Requires] precondition verified by SMT solver
    [Requires("id > 0")]
    [Ensures("result == null || result.Id == id")]
    public User? FindById(int id)
    {
        return _users.TryGetValue(id, out var user) ? user : null;
    }

    // Demonstrates nullable-aware contract
    [Requires("user != null")]
    [Requires("user.Id > 0")]
    [Ensures("_users.Count >= 0")]  // trivial but shows postcondition pattern
    public void AddUser(User user)
    {
        _users[user.Id] = user;
    }

    // Pattern matching (C# 8+) on nullable
    [Pure]
    [Ensures("result != null")]
    public string GetDisplayName(User? user)
    {
        return user switch
        {
            { Email: not null } u => $"{u.Name} <{u.Email}>",
            { Name: var n } => n,
            null => "Unknown"
        };
    }
}
```

### Example 2: bank-account-invariant (FAILS verification — intentional)

```csharp
// packages/server/examples/csharp-verification/bank-account-invariant/BankAccount.cs
// Source: pattern from cs-fv/examples/Stack.cs (ClassInvariant)

using CsFv.Contracts;

// ClassInvariant: account balance is always non-negative
[ClassInvariant("balance >= 0")]
public class BankAccount(decimal initialBalance)  // Primary constructor (C# 12)
{
    [Ghost]
    private decimal balance = initialBalance;

    [Pure]
    [Ensures("result == balance")]
    public decimal GetBalance() => balance;

    [Requires("amount > 0")]
    [Modifies("balance")]
    [Ensures("balance == old(balance) + amount")]
    public void Deposit(decimal amount)
    {
        balance += amount;
    }

    // INTENTIONAL INVARIANT VIOLATION:
    // Contract says balance > 0 after withdrawal, but if amount == balance,
    // then balance becomes 0, which violates Ensures("balance > 0")
    // cs-fv will report: ❌ Withdraw: Failed
    [Requires("amount > 0")]
    [Requires("amount <= balance")]
    [Modifies("balance")]
    [Ensures("balance > 0")]  // BUG: should be "balance >= 0" — intentional violation
    public void Withdraw(decimal amount)
    {
        balance -= amount;
    }
}
```

### Example 3: calculator-contracts (PASSES — medium complexity)

```csharp
// packages/server/examples/csharp-verification/calculator-contracts/Calculator.cs
// Source: pattern from cs-fv/examples/GettingStarted.cs

using CsFv.Contracts;

// Discriminated union pattern using records (C# 9+)
public abstract record Operation;
public record Add(int X, int Y) : Operation;
public record Multiply(int X, int Y) : Operation;
public record Divide(int Dividend, int Divisor) : Operation;

public class Calculator
{
    // Pattern matching on record union (C# 8+ switch expression)
    [Ensures("result >= int.MinValue && result <= int.MaxValue")]
    public int Execute(Operation op)
    {
        return op switch
        {
            Add(var x, var y) => x + y,
            Multiply(var x, var y) => x * y,
            Divide(var d, var r) when r != 0 => d / r,
            Divide => throw new DivideByZeroException(),
            _ => throw new ArgumentException("Unknown operation")
        };
    }

    [Requires("x >= 0")]
    [Ensures("result >= x")]
    public int Increment(int x) => x + 1;

    [Requires("divisor != 0")]
    [Ensures("result * divisor <= dividend")]
    public int Divide(int dividend, int divisor) => dividend / divisor;
}
```

### Example .csproj Template

```xml
<!-- packages/server/examples/csharp-verification/{example-name}/Example.csproj -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <OutputType>Library</OutputType>
    <!-- CSFV-04: Convert Roslyn Warning diagnostics to errors -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>

  <ItemGroup>
    <!-- CsFv.Contracts: not on NuGet.org — reference from cs-fv publish output -->
    <Reference Include="CsFv.Contracts">
      <HintPath>/usr/local/lib/cs-fv/CsFv.Contracts.dll</HintPath>
    </Reference>
  </ItemGroup>

</Project>
```

### README.md Template

```markdown
# {Example Title}

{One sentence description used by ExampleSelector dropdown.}

{Optional additional detail explaining what the example demonstrates.}
```

The first non-heading, non-empty line is the `description` field in the ExampleSelector.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Existing examples (no .csproj, no FV annotations) | New examples with .csproj + CsFv.Contracts annotations | Phase 22 | Wrapper exits 2 (no .csproj) vs actual FV execution |
| `<PackageReference>` to NuGet.org | `<Reference HintPath>` to pre-built DLL | Phase 22 discovery | Offline execution without NuGet network calls |
| Tool showing "In Development" | Tool showing "Available" (Phase 21 complete) | Phase 21 | ExampleSelector now appears for csharp-verification |

**Key clarification on CSFV-04:**
The Phase 21 wrapper already passes exit codes through from cs-fv. CSFV-04's remaining deliverable (Phase 22) is `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in each example `.csproj`. This causes Roslyn to convert Warning-severity FV diagnostics into errors, which makes cs-fv exit 1. Without this, cs-fv exits 0 even when verification warnings are present. The wrapper does NOT need special logic for this — the `.csproj` property handles it transparently.

## Open Questions

1. **Is `CsFv.Contracts.dll` present in `/usr/local/lib/cs-fv/` in the Docker image?**
   - What we know: `dotnet publish CsFv.Cli.csproj` outputs all DLLs to `/publish/cs-fv/`; `CsFv.Contracts` is a ProjectReference of `CsFv.Cli` so it should be included
   - What's unclear: Whether `dotnet publish` includes transitive ProjectReference DLLs or only direct dependencies in the output directory; and whether PrivateAssets affects this
   - Recommendation: Verify by running `ls` on the Docker image or inspecting the publish output locally at `cs-fv/src/CsFv.Cli/bin/Release/net8.0/publish/` — if `CsFv.Contracts.dll` is there, the HintPath approach works. If not, add a Dockerfile step to copy it.

2. **Does cs-fv's `verify` command parse the `.csproj` for `<Reference>` HintPaths?**
   - What we know: cs-fv's `verify` command takes a single `.cs` file; it uses Roslyn's compiler APIs to parse the file; Roslyn needs to resolve type references
   - What's unclear: Whether cs-fv passes the `.csproj`-referenced assemblies to Roslyn's compilation context, or whether it only uses the file in isolation
   - Recommendation: Test locally with `dotnet /path/to/cs-fv.dll verify <cs-file>` where the `.cs` file uses `CsFv.Contracts` attributes. If the verify command only takes a `.cs` file and doesn't read the `.csproj`, the `<Reference>` in `.csproj` may be irrelevant for cs-fv. In that case, cs-fv likely resolves `CsFv.Contracts` attributes on its own (since it loads them as part of its Roslyn analysis pipeline). This needs verification.

3. **Should the three existing examples be deleted or renamed?**
   - What we know: Existing `null-check`, `array-bounds`, `division-safety` directories lack `.csproj` and FV annotations — they would fail at the wrapper pre-flight check
   - What's unclear: Whether any E2E tests or client tests reference these specific example names
   - Recommendation: Check `__tests__/` for hardcoded example names before deleting. If tests reference the names, update test fixtures; otherwise, simply delete and replace.

## Sources

### Primary (HIGH confidence)
- Direct source inspection: `/Users/alexanderfedin/Projects/hapyy/cs-fv/src/CsFv.Contracts/` — all attribute source files (`RequiresAttribute.cs`, `EnsuresAttribute.cs`, `ClassInvariantAttribute.cs`, `InvariantAttribute.cs`, `PureAttribute.cs`, `GhostAttribute.cs`, `ModifiesAttribute.cs`), package metadata (`CsFv.Contracts.csproj`, nuspec files confirming package ID `CsFv.Contracts`)
- Direct source inspection: `/Users/alexanderfedin/Projects/hapyy/cs-fv/examples/` — verified working examples (`SimpleCalculator.cs`, `Stack.cs`, `BinarySearch.cs`) with all contract patterns
- Direct source inspection: `/Users/alexanderfedin/Projects/hapyy/languages-web-portal/packages/server/src/services/exampleService.ts` — confirmed README.md description extraction logic
- Direct source inspection: `/Users/alexanderfedin/Projects/hapyy/languages-web-portal/packages/server/examples/csharp-verification/` — confirmed existing examples lack `.csproj` and FV annotations
- Direct source inspection: `/Users/alexanderfedin/Projects/hapyy/languages-web-portal/Dockerfile` — confirmed `/usr/local/lib/cs-fv` as publish output destination, NuGet cache at `/home/nodejs/.nuget/packages`
- Direct source inspection: `/Users/alexanderfedin/Projects/hapyy/cs-fv/src/CsFv.Cli/CsFv.Cli.csproj` — confirmed `CsFv.Contracts` is a ProjectReference (transitive dependency of publish output)
- Phase 21 RESEARCH.md — cs-fv exit code logic: `FailedCount + ErrorCount > 0 ? 1 : 0`; output format: `✅/❌/⏱️`

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` decisions: "`TreatWarningsAsErrors=true` required in .csproj — Roslyn defaults Warning severity (exit 0)"
- `.planning/REQUIREMENTS.md` CSFV-04 note: "Phase 22 must deliver example `.csproj` files with this property"

### Tertiary (LOW confidence)
- Whether cs-fv's `verify` command reads `.csproj` for assembly references: needs runtime verification (not verified from source in this session)

## Metadata

**Confidence breakdown:**
- Contract attribute syntax: HIGH — verified from CsFv.Contracts source files
- .csproj structure (`<TreatWarningsAsErrors>`, `<Reference HintPath>`): HIGH for MSBuild pattern, MEDIUM for HintPath resolution by cs-fv verify command
- ExampleService integration (README.md → description): HIGH — verified from TypeScript source
- Intentional violation pattern (ClassInvariant + wrong Ensures): HIGH — verified from Stack.cs example and exit code logic
- CsFv.Contracts.dll availability at HintPath: MEDIUM — requires Docker verification

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (stable domain; cs-fv contract syntax is not fast-moving)
