# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** v1.1 Java FV Integration — making Java verification the first live tool

## Current Position

**Milestone:** v1.1 Java FV Integration
**Phase:** 10 - E2E Testing
**Plan:** 01 of 02
**Status:** In progress
**Last activity:** 2026-02-16 — Plan 10-01 complete (Java FV E2E tests)

**Progress:**
[██████████] 96%
v1.1 Milestone Progress: [████████████████   ] 2.5/3 phases (83%)
  Phase 8: Docker Infrastructure & Wrapper   [██████████] Complete (2/2 plans)
  Phase 9: Tool Activation & Examples        [██████████] Complete (3/3 plans)
  Phase 10: E2E Testing                      [█████     ] In progress (1/2 plans)
```

## Performance Metrics

**v1.0 Delivered:**
- 7 phases, 17 plans
- 2 days (2026-02-12 → 2026-02-14)
- 82 commits, 198 files, 8,239 LOC TypeScript/React
- 187 unit tests + 36 E2E tests

**v1.1 Target:**
- 3 phases (Docker + Activation + Testing)
- 20 requirements (DOCK: 4, TOOL: 4, WRAP: 4, EXAM: 4, E2E: 4)
- First live tool integration (Java FV)

**v1.1 Phase 8 Delivered:**
- 2 plans completed (08-01: Dockerfile, 08-02: Wrapper script)
- Duration: ~6 minutes (374 seconds for 08-02)
- 3 commits, 2 files modified/created
- Docker 3-stage build with JDK 25 + wrapper script integration
- 4 requirements satisfied (DOCK-01 through DOCK-04, WRAP-01 through WRAP-03)

**v1.1 Phase 9 Delivered (3/3 plans):**
- Plan 09-01: Tool Activation - Complete (66 seconds, 1 task, 2 files, commit: 9a682ed)
- Plan 09-02: Example Projects - Complete (156 seconds, 2 tasks, 12 files, commits: e78793c, aaad911)
- Plan 09-03: Example Selector UI - Complete (305 seconds, 2 tasks, 5 files, commits: b930da4, 6c25ef3)
- Java Verification tool activated with 'available' status and 120s timeout
- 3 Java verification example projects created (bank-account-records, shape-matching, payment-types)
- Frontend UI for loading examples via dropdown (ExampleSelector component)
- 11 Java files demonstrating modern Java features with formal verification
- 3 new integration tests for Java examples API + 3 unit tests for ExampleSelector

**v1.1 Phase 10 In Progress (1/2 plans):**
- Plan 10-01: Java FV E2E Tests - Complete (244 seconds, 2 tasks, 3 files, commits: 16a6735, 3f00f34)
- Extended DemoPage POM with ExampleSelector locators and helpers
- 4 landing page test scenarios (8 tests with desktop+mobile) verify Java FV availability
- 7 example loading test scenarios verify all 3 examples can be loaded
- Total 15 new E2E tests added (47 passed, 7 skipped on mobile)

## Accumulated Context

### Decisions

All v1.0 decisions documented in PROJECT.md Key Decisions table.

**v1.1 Phase 8 Decisions:**
- **Wrapper script process handling**: Use `exec` instead of direct invocation to replace shell process with Java process (cleaner process tree, direct signal handling)
- **Input validation strategy**: Validate .java file presence in wrapper before invoking CLI (fail fast with clear error instead of Java FV generic error)
- **Wrapper PATH naming**: Install at `/usr/local/bin/hupyy-java-verify` without .sh extension for cleaner toolRegistry interface

**v1.1 Phase 9 Decisions:**
- **Tool timeout**: 120-second timeout for Java FV (vs default 60s) to accommodate complex verification tasks
- **Example complexity progression**: Progressive ordering from simple (bank-account-records) to medium (shape-matching) to complex (payment-types)
- **Intentional failure demonstration**: UnsafeRefund.java includes 5 different verification failure modes (missing validation, unsafe array access, division by zero, null dereference, integer overflow)
- **No package declarations**: Flat file structure in examples for portal demo simplicity (users don't need to understand package hierarchies)
- **README.md pattern**: First non-heading line serves as example description extracted by ExampleService for dropdown display
- **Simple dropdown UI**: Native select element for example picker (no complex dropdown library needed)
- **Description display**: Show example description below dropdown when selected (not in option text)
- **Reset on load**: Clear dropdown selection after successful load (better UX for trying multiple examples)

**v1.1 Phase 10 Decisions:**
- **Skip mobile tests for example loading**: ExampleSelector UI identical on mobile and desktop - no responsive behavior differences to test (saves ~7 test executions)
- **Desktop/mobile branching in landing page tests**: ToolComparisonGrid has different DOM structure (table vs cards) requiring different locators for comprehensive responsive coverage
- **loadExample helper in DemoPage POM**: DRY principle for common pattern across 4 tests - encapsulates async wait logic for execute button to enable after example load

### v1.1 Java FV Integration Notes

**Java FV CLI details:**
- Command: `java -jar java-fv-cli.jar verify <src-dir>`
- Also usable as javac plugin: `javac -Xplugin:JavaFV MyClass.java`
- Requires JDK 25 (Microsoft OpenJDK or equivalent)
- Z3 bundled via z3-turnkey 4.14.1 (no separate install)
- CVC5 optional but recommended for multi-solver (v2 feature)
- Maven 3.9+ for build
- Source at ~/Projects/hapyy/java-fv/
- 6 example files in examples/modern-java/

**Tool registry status:**
- Java Verification tool now ACTIVATED (status: 'available')
- Execution timeout: 120 seconds (120000ms)
- Available for landing page display and demo execution

**Example projects created:**
1. **bank-account-records**: Records with compact constructor invariants (Account.java, Transaction.java)
2. **shape-matching**: Pattern matching with type patterns, guards, null handling (Shape.java, ShapeCalculator.java, NullableShape.java)
3. **payment-types**: Sealed types with exhaustiveness checking + intentional failures (PaymentMethod.java, PaymentProcessor.java, UnsafeRefund.java)

**Example loading flow:**
- User visits /demo?tool=java-verification
- ExampleSelector dropdown appears with 3 examples
- User selects example → description appears below dropdown
- User clicks "Load Example" → projectId is set → "Run" button enables
- Full integration between backend API and frontend UI complete

**E2E test coverage:**
- Landing page: Java FV shows "Available" badge (verified desktop table + mobile card)
- Navigation: Try Now button navigates to /demo?tool=java-verification with tool pre-selected
- Example loading: All 3 examples (bank-account-records, shape-matching, payment-types) load successfully
- UI state: Description appears on selection, button disabled without selection, dropdown resets after load
- Total: 15 new E2E tests (8 landing page, 7 example loading)

### Pending Todos

None. Awaiting phase planning.

### Blockers/Concerns

**Resolved:**
- Docker image size: JDK 25 adds ~200MB but acceptable for demo portal
- Wrapper script design: Simple shell script invoking `java -jar` with args passthrough

**Active:**
- Java FV CLI `verify` command expects individual file paths, not directories (wrapper handles this)
- CVC5/Yices/Bitwuzla not available on linux-aarch64 in Docker — Z3 only for v1.1 (acceptable)

## Session Continuity

**Last session:** 2026-02-16T21:50:35Z
**Stopped at:** Completed 10-01-PLAN.md
**Resume file:** .planning/phases/10-e2e-testing/10-01-SUMMARY.md

**Next steps:**
1. Execute Plan 10-02 (Java example execution E2E tests)
2. Complete Phase 10 and v1.1 Java FV Integration milestone
3. Deliver v1.1 milestone

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-16 after Phase 10 Plan 01 completion*
