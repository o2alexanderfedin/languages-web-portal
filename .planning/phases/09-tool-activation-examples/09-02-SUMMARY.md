---
phase: 09-tool-activation-examples
plan: 02
subsystem: examples
tags: [java-verification, examples, testing, records, pattern-matching, sealed-types]
dependencies:
  requires: [08-02-PLAN.md]
  provides: [java-verification-examples]
  affects: [exampleService, examples-api]
tech_stack:
  added: []
  patterns: [modern-java-features, compact-constructors, pattern-matching-switch, sealed-interfaces]
key_files:
  created:
    - packages/server/examples/java-verification/bank-account-records/README.md
    - packages/server/examples/java-verification/bank-account-records/Account.java
    - packages/server/examples/java-verification/bank-account-records/Transaction.java
    - packages/server/examples/java-verification/shape-matching/README.md
    - packages/server/examples/java-verification/shape-matching/Shape.java
    - packages/server/examples/java-verification/shape-matching/ShapeCalculator.java
    - packages/server/examples/java-verification/shape-matching/NullableShape.java
    - packages/server/examples/java-verification/payment-types/README.md
    - packages/server/examples/java-verification/payment-types/PaymentMethod.java
    - packages/server/examples/java-verification/payment-types/PaymentProcessor.java
    - packages/server/examples/java-verification/payment-types/UnsafeRefund.java
  modified:
    - packages/server/src/__tests__/examples.test.ts
decisions:
  - "Progressive complexity ordering: bank-account (simple invariants) → shape-matching (pattern matching) → payment-types (sealed types + failure)"
  - "Intentional verification failures in UnsafeRefund.java: missing validation, unsafe array access, division by zero, null dereference, integer overflow"
  - "No package declarations in Java files for flat file structure simplicity in portal demo"
  - "README.md first content line serves as example description in dropdown (extracted by ExampleService)"
metrics:
  duration_seconds: 156
  completed_at: "2026-02-16T08:03:02Z"
  tasks_completed: 2
  files_created: 11
  files_modified: 1
  commits: 2
---

# Phase 09 Plan 02: Java Verification Examples Summary

**One-liner:** Three Java verification example projects demonstrating records with invariants, pattern matching with sealed types, and intentional verification failures

## Overview

Created three progressively complex Java verification example projects that showcase modern Java features (records, pattern matching, sealed interfaces) with formal verification properties. Each example includes descriptive README and multiple Java source files demonstrating different verification scenarios. The payment-types example intentionally includes verification-failing code (UnsafeRefund.java) to demonstrate what "VERIFICATION FAILED" looks like in the portal.

## Tasks Completed

### Task 1: Create three Java verification example projects
**Commit:** e78793c
**Files:** 11 created (3 READMEs + 8 .java files)

Created three example directories under `packages/server/examples/java-verification/`:

**1. bank-account-records** (Simple - Records with compact constructor invariants)
- Account.java: Record with non-null owner and non-negative balance validation, deposit/withdraw methods
- Transaction.java: Transfer logic demonstrating balance preservation invariant
- README.md: "Records with compact constructor invariants — automatic verification of value constraints"

**2. shape-matching** (Medium - Pattern matching with type patterns and null safety)
- Shape.java: Sealed interface with Circle, Rectangle, Triangle records, each with geometric validation
- ShapeCalculator.java: Pattern matching switch expressions with type patterns and guards for classification
- NullableShape.java: Null pattern matching demonstrating null-safe operations
- README.md: "Pattern matching with type patterns, guards, and null safety verification"

**3. payment-types** (Complex - Sealed types with exhaustiveness + intentional failure)
- PaymentMethod.java: Sealed interface with CreditCard, BankTransfer, Crypto records
- PaymentProcessor.java: Fee calculation and validation using pattern matching exhaustiveness
- UnsafeRefund.java: **Intentional verification failures** (missing validation, unsafe array access, division by zero, null dereference, integer overflow)
- README.md: "Sealed payment types with exhaustiveness checking — includes a deliberate verification failure"

All Java files use modern Java syntax (records, sealed interfaces, pattern matching switch) without package declarations for portal demo simplicity. Files are 30-60 lines each for readability in console.

### Task 2: Add Java verification example tests
**Commit:** aaad911
**Files:** 1 modified

Added 3 new test cases to `packages/server/src/__tests__/examples.test.ts`:

1. **GET test:** Verifies `/api/examples/java-verification` returns 3 examples (bank-account-records, shape-matching, payment-types) with name and description properties
2. **POST test (bank-account-records):** Verifies example loads successfully with 2+ files including Account.java
3. **POST test (payment-types):** Verifies example loads with 3+ files including UnsafeRefund.java (the intentional failure file)

All 14 tests pass (11 existing + 3 new Java verification tests).

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

1. **Progressive complexity ordering:** Examples naturally order simple to complex alphabetically (bank-account-records < payment-types < shape-matching), aligning with learning progression
2. **Intentional verification failures:** UnsafeRefund.java includes 5 different failure modes to comprehensively demonstrate verification detection capabilities
3. **No package declarations:** Flat file structure for portal demo simplicity (users don't need to understand package hierarchies)
4. **README.md first line pattern:** First non-heading line serves as example description, extracted by ExampleService for dropdown display

## Verification

All success criteria met:

- ✅ 3 example directories with 11 total files (3 READMEs + 8 .java files)
- ✅ Each example has descriptive README.md with one-line subtitle
- ✅ Examples progress from no contracts (bank-account) to pattern matching (shape) to sealed types + failure (payment)
- ✅ UnsafeRefund.java contains code that intentionally fails verification
- ✅ All example API tests pass (14/14)

Manual verification:
```bash
find packages/server/examples/java-verification -type f | sort
# Returns 11 files across 3 directories as expected

cd packages/server && npx vitest run src/__tests__/examples.test.ts
# All 14 tests pass
```

## Impact

**User Experience:**
- Users can now select "Bank Account Records", "Shape Matching", or "Payment Types" from Java verification example dropdown
- Examples demonstrate real Java FV capabilities: invariant checking, pattern matching exhaustiveness, sealed type coverage
- UnsafeRefund.java provides clear demonstration of verification failure (users see what errors look like)

**Technical:**
- ExampleService automatically discovers examples via filesystem scan
- Examples API returns 3 java-verification examples with descriptive names extracted from README
- Example loading creates project with all Java files ready for verification

**Next Steps:**
- Phase 09 Plan 03: Update tool registry status from 'in-development' to 'available'
- Phase 10: E2E tests with actual Java FV verification runs

## Files Modified/Created

**Created (11):**
- packages/server/examples/java-verification/bank-account-records/README.md
- packages/server/examples/java-verification/bank-account-records/Account.java
- packages/server/examples/java-verification/bank-account-records/Transaction.java
- packages/server/examples/java-verification/shape-matching/README.md
- packages/server/examples/java-verification/shape-matching/Shape.java
- packages/server/examples/java-verification/shape-matching/ShapeCalculator.java
- packages/server/examples/java-verification/shape-matching/NullableShape.java
- packages/server/examples/java-verification/payment-types/README.md
- packages/server/examples/java-verification/payment-types/PaymentMethod.java
- packages/server/examples/java-verification/payment-types/PaymentProcessor.java
- packages/server/examples/java-verification/payment-types/UnsafeRefund.java

**Modified (1):**
- packages/server/src/__tests__/examples.test.ts

## Commits

1. **e78793c** - feat(09-02): create three Java verification example projects
2. **aaad911** - test(09-02): add Java verification example tests

## Self-Check: PASSED

All files verified to exist:
```bash
[ -f "packages/server/examples/java-verification/bank-account-records/Account.java" ] && echo "FOUND"
[ -f "packages/server/examples/java-verification/payment-types/UnsafeRefund.java" ] && echo "FOUND"
```

All commits verified:
```bash
git log --oneline --all | grep -q "e78793c" && echo "FOUND: e78793c"
git log --oneline --all | grep -q "aaad911" && echo "FOUND: aaad911"
```

All claims verified ✓
