# Requirements: Hupyy Languages Web Portal

**Defined:** 2026-02-15
**Core Value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## v1.1 Requirements

Requirements for Java FV Integration milestone. Each maps to roadmap phases.

### Docker & Infrastructure

- [x] **DOCK-01**: Docker production image includes JDK 25 with Java FV CLI jar pre-installed
- [x] **DOCK-02**: Docker image includes wrapper script at `/usr/local/bin/hupyy-java-verify` that bridges Java FV CLI to portal's `--input <projectPath>` interface
- [x] **DOCK-03**: Docker build successfully compiles java-fv from source and bundles the CLI jar
- [x] **DOCK-04**: Java FV execution works in Docker container with proper JDK paths and Z3 bundled solver

### Tool Activation

- [x] **TOOL-01**: Java verification tool status changes from 'in-development' to 'available' in tool definitions
- [x] **TOOL-02**: Java verification tool execution config sets `available: true` in tool registry
- [x] **TOOL-03**: Java verification tool description updated to reflect actual capabilities (ACSL contracts, Z3 verification, Java 17-25)
- [x] **TOOL-04**: User can select Java Verification tool and execute it against uploaded Java source files

### CLI Wrapper

- [x] **WRAP-01**: Wrapper script accepts `--input <projectPath>` and invokes `java -jar java-fv-cli.jar verify <projectPath>`
- [x] **WRAP-02**: Wrapper script streams stdout/stderr for real-time SSE output in portal console
- [x] **WRAP-03**: Wrapper script returns appropriate exit codes (0 = success, non-zero = failure)
- [x] **WRAP-04**: Wrapper script handles missing .java files gracefully with clear error message

### Example Projects

- [x] **EXAM-01**: Records example project with compact constructor invariants (Age, Range, Person)
- [x] **EXAM-02**: Pattern matching example project with type patterns, guards, and null handling
- [x] **EXAM-03**: Sealed types example project with exhaustiveness checking
- [x] **EXAM-04**: Example projects loadable via existing example API endpoint (`GET /api/examples/java-verification`)

### E2E Testing

- [x] **E2E-01**: E2E test verifies Java verification tool appears as 'Available' on landing page
- [x] **E2E-02**: E2E test verifies user can load example Java project and execute verification
- [x] **E2E-03**: E2E test verifies real-time console output shows ACSL contracts and verification results
- [x] **E2E-04**: E2E test verifies output file tree shows generated verification artifacts

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Solver

- **SOLV-01**: User can select verification solver (Z3, CVC5, Yices, All)
- **SOLV-02**: Confidence level display (HIGH/MEDIUM/LOW) based on solver agreement

### Advanced UI

- **ADVU-01**: ACSL contracts displayed in dedicated side panel with syntax highlighting
- **ADVU-02**: SMT-LIB encoding viewable in expandable section
- **ADVU-03**: Verification results summary with per-method pass/fail table

## Out of Scope

| Feature | Reason |
|---------|--------|
| Maven project build | Portal runs pre-built CLI, users don't need Maven |
| javac plugin mode | CLI jar mode is simpler and doesn't require project structure |
| Custom solver configuration | Z3 bundled is sufficient for demo; multi-solver is v2 |
| Java source code editing in browser | Upload-only approach, consistent with v1.0 pattern |
| Incremental verification | Each execution is a fresh run, consistent with ephemeral design |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCK-01 | Phase 8 | Satisfied |
| DOCK-02 | Phase 8 | Satisfied |
| DOCK-03 | Phase 8 | Satisfied |
| DOCK-04 | Phase 8 | Satisfied |
| WRAP-01 | Phase 8 | Satisfied |
| WRAP-02 | Phase 8 | Satisfied |
| WRAP-03 | Phase 8 | Satisfied |
| WRAP-04 | Phase 8 | Satisfied |
| TOOL-01 | Phase 9 | Satisfied |
| TOOL-02 | Phase 9 | Satisfied |
| TOOL-03 | Phase 9 | Satisfied |
| TOOL-04 | Phase 9 | Satisfied |
| EXAM-01 | Phase 9 | Satisfied |
| EXAM-02 | Phase 9 | Satisfied |
| EXAM-03 | Phase 9 | Satisfied |
| EXAM-04 | Phase 9 | Satisfied |
| E2E-01 | Phase 10 | Satisfied |
| E2E-02 | Phase 10 | Satisfied |
| E2E-03 | Phase 10 | Satisfied |
| E2E-04 | Phase 10 | Satisfied |

**Coverage:**
- v1.1 requirements: 20 total
- Mapped to phases: 20/20 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after v1.1 roadmap creation*
