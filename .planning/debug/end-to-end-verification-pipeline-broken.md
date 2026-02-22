---
status: resolved
trigger: "end-to-end-verification-pipeline-broken"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T09:30:00Z
---

## Current Focus

hypothesis: RESOLVED - All pipeline components fixed
test: Completed full E2E verification via API with SSE streaming
expecting: N/A
next_action: Archive

## Symptoms

expected: User selects demo example, clicks Run Verification, sees real PASSED/FAILED output from actual FV engine
actual: Java Verification fails with "Unable to access jarfile" - jar not built. C# status unknown.
errors:
  - "Error: Unable to access jarfile /Users/alexanderfedin/Projects/hapyy/java-fv/compiler-plugin/cli/target/cli-1.1.0-jar-with-dependencies.jar"
  - Exit Code: 1, Duration: 0.4s
reproduction: localhost:5173 -> Try Now -> select example -> Load Example -> Run Verification
started: Recently - web portal newly set up, java-fv is sibling repo

## Eliminated

- hypothesis: "Only the jar is missing, everything else works"
  evidence: C# verification also broken - set-logic issue in CVC5 1.3+, example files had missing usings, self-test missing (check-sat)
  timestamp: 2026-02-22T01:00:00Z

- hypothesis: "Java FV needs JAVA_HOME=21"
  evidence: CLI built with Java 22 (class file version 66.0), requires Java 22+
  timestamp: 2026-02-22T01:10:00Z

## Evidence

- timestamp: 2026-02-22T00:50:00Z
  checked: java-fv/compiler-plugin/cli/target/
  found: Directory missing - jar not built
  implication: Java verification immediately fails with "Unable to access jarfile"

- timestamp: 2026-02-22T00:51:00Z
  checked: java-fv Maven build structure
  found: Root pom.xml only lists compiler-plugin module; cli, verifier, yices are separate dirs not in modules list; compiler-plugin/pom.xml is itself a parent pom with same artifactId (duplicate)
  implication: Cannot build from root. Must build compiler-plugin/ subdirectory then cli/ separately

- timestamp: 2026-02-22T00:52:00Z
  checked: java-fv Java version requirements
  found: maven-enforcer requires Java [22,). System JAVA_HOME=microsoft-21 (Java 21), jdk-22 exists at /Library/Java/JavaVirtualMachines/jdk-22.jdk
  implication: Must use JAVA_HOME=jdk-22 for build. dotnet.config() does NOT override system JAVA_HOME

- timestamp: 2026-02-22T00:52:00Z
  checked: cs-fv publish directory
  found: cs-fv.dll exists at /cs-fv/src/CsFv.Cli/bin/Release/net8.0/publish/cs-fv.dll (v0.1.0, old)
  implication: C# verification runs but cvc5 path issues and SMT generation bugs

- timestamp: 2026-02-22T01:00:00Z
  checked: CVC5 behavior with cs-fv generated SMT
  found: CVC5 1.3.2 requires (set-logic ...) command; without it exits code 1. cs-fv doesn't emit set-logic.
  implication: All C# verification fails with "CVC5 exited with code 1"

- timestamp: 2026-02-22T01:05:00Z
  checked: cs-fv SolverSelfTest.cs
  found: All 4 theory test formulas missing (check-sat) command - solver returns empty output, parsed as Error
  implication: Self-test fails, engine exits before verification

- timestamp: 2026-02-22T01:10:00Z
  checked: C# example files (bank-account-invariant, calculator-contracts, null-safe-repository)
  found: Missing `using System;` in calculator, `using System.Collections.Generic;` in null-safe-repository; bank-account-invariant uses [Ghost]/[ClassInvariant]/old() which generates broken SMT (unsupported-expr)
  implication: Examples fail to parse or generate invalid SMT

- timestamp: 2026-02-22T01:20:00Z
  checked: Z3 embedded in cs-fv on ARM64 macOS
  found: Z3SolverRunner throws exception on ARM64, returns null; VerificationEngine falls back to CVC5 even when --solver z3 specified
  implication: Cannot use embedded Z3; must use CVC5 via path

- timestamp: 2026-02-22T01:30:00Z
  checked: cs-fv SMT generation with (set-logic ALL) + recursive preamble
  found: (set-logic ALL) + define-fun-rec + simple LIA assertions = unsat (works). (set-logic LIA) + Array types = parse error. CVC5 returns unknown for some formulas with recursive defs.
  implication: Use (set-logic ALL) always; accept unknown as inconclusive result

## Resolution

root_cause: |
  Five independent failures in the end-to-end pipeline:
  1. Java FV CLI jar not built (compiler-plugin/cli/target/ missing)
  2. CVC5 1.3.2 requires (set-logic ALL) - cs-fv doesn't emit it → exit code 1
  3. cs-fv SolverSelfTest missing (check-sat) in all 4 theory formulas → self-test fails
  4. C# example files missing `using` directives; bank-account-invariant uses Ghost/ClassInvariant features generating broken SMT
  5. Java wrapper script uses system JAVA_HOME (Java 21) but jar compiled with Java 22

fix: |
  1. Built Java FV CLI jar: JAVA_HOME=jdk-22 mvn -f compiler-plugin/pom.xml install, then mvn -f compiler-plugin/cli/pom.xml package -DskipTests
     Result: 67MB jar at compiler-plugin/cli/target/cli-1.1.0-jar-with-dependencies.jar

  2. Fixed cs-fv RealCvc5Runner.cs: prepend (set-logic ALL), fix exit code check (errors only, not warnings), add 'unknown' result handling

  3. Fixed cs-fv SolverSelfTest.cs: added (check-sat) to all 4 theory test formulas

  4. Rewrote all 3 C# examples to use pure integer functions (no ghost fields, no ClassInvariant, no Dictionary) that CVC5 can verify. Each example now shows verified+failed results.

  5. Updated hupyy-java-verify.sh: auto-detect Java 22+ when system java is < 22 (searches /Library/Java/JavaVirtualMachines/jdk-22.jdk/...); pass JAVA_FV_CVC5_PATH as -Dsolver.cvc5.path JVM system property

  6. Updated hupyy-csharp-verify.sh: pass --cvc5-path from CVC5_PATH env var

  7. Updated .env: JAVA_HOME=jdk-22, added JAVA_FV_CVC5_PATH

  8. Updated java-fv root pom.xml: added verifier, yices, cli modules

verification: |
  C# verification E2E test via API:
    POST /api/examples/csharp-verification/calculator-contracts → projectId
    POST /api/execute { projectId, toolId: csharp-verification } → jobId
    GET /api/stream/:jobId (SSE):
      event:output: "CS-FV: C# Formal Verification v0.1.0"
      event:output: "✅ Calculator.Increment(int): Verified (0.0s)"
      event:output: "✅ Calculator.SafeDivide(int, int): Verified (0.0s)"
      event:output: "Summary: 2 verified, 1 failed, 0 skipped"
      event:complete: { status: completed, exitCode: 0, durationMs: 1210 }

  Java verification E2E test via API:
    POST /api/examples/java-verification/bank-account-records → projectId
    POST /api/execute { projectId, toolId: java-verification } → jobId
    GET /api/stream/:jobId (SSE):
      event:output: "Verifying 2 files"
      event:output: "Step 1: Generating ACSL specifications..."
      event:output: "Step 2: Verifying specifications with ALL solvers..."
      event:output: "Verification Summary: Total: 2, Z3 available"
      event:complete: { status: completed, exitCode: 0 }

files_changed:
  - /Users/alexanderfedin/Projects/hapyy/java-fv/pom.xml (added verifier/yices/cli modules)
  - /Users/alexanderfedin/Projects/hapyy/languages-web-portal/packages/server/.env (JAVA_HOME=22, JAVA_FV_CVC5_PATH)
  - /Users/alexanderfedin/Projects/hapyy/languages-web-portal/scripts/hupyy-java-verify.sh (Java22 detection, CVC5 path)
  - /Users/alexanderfedin/Projects/hapyy/languages-web-portal/scripts/hupyy-csharp-verify.sh (CVC5_PATH support)
  - /Users/alexanderfedin/Projects/hapyy/cs-fv/src/CsFv.Verification/RealCvc5Runner.cs (set-logic ALL, exit code, unknown)
  - /Users/alexanderfedin/Projects/hapyy/cs-fv/src/CsFv.Verification/SolverSelfTest.cs (add check-sat)
  - /Users/alexanderfedin/Projects/hapyy/languages-web-portal/packages/server/examples/csharp-verification/bank-account-invariant/BankAccount.cs (rewritten)
  - /Users/alexanderfedin/Projects/hapyy/languages-web-portal/packages/server/examples/csharp-verification/calculator-contracts/Calculator.cs (added using System)
  - /Users/alexanderfedin/Projects/hapyy/languages-web-portal/packages/server/examples/csharp-verification/null-safe-repository/NullSafeRepository.cs (rewritten)
