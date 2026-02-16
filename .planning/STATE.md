# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** v1.1 Java FV Integration — making Java verification the first live tool

## Current Position

**Milestone:** v1.1 Java FV Integration
**Phase:** 9 - Tool Activation & Examples
**Plan:** 09-01 complete, 09-02 pending
**Status:** In progress
**Last activity:** 2026-02-16 — Plan 09-01 (Tool Activation) complete

**Progress:**
[██████████] 95%
v1.1 Milestone Progress: [████████           ] 1.5/3 phases (50%)
  Phase 8: Docker Infrastructure & Wrapper   [██████████] Complete (2/2 plans)
  Phase 9: Tool Activation & Examples        [█████     ] In progress (1/2 plans)
  Phase 10: E2E Testing                      [          ] Not started
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

**v1.1 Phase 9 Progress (1/2 plans):**
- Plan 09-01: Tool Activation - Complete (66 seconds, 1 task, 2 files, commit: 9a682ed)
- Java Verification tool activated with 'available' status and 120s timeout

## Accumulated Context

### Decisions

All v1.0 decisions documented in PROJECT.md Key Decisions table.

**v1.1 Phase 8 Decisions:**
- **Wrapper script process handling**: Use `exec` instead of direct invocation to replace shell process with Java process (cleaner process tree, direct signal handling)
- **Input validation strategy**: Validate .java file presence in wrapper before invoking CLI (fail fast with clear error instead of Java FV generic error)
- **Wrapper PATH naming**: Install at `/usr/local/bin/hupyy-java-verify` without .sh extension for cleaner toolRegistry interface
- [Phase 09]: 120-second timeout for Java FV (vs default 60s) to accommodate complex verification tasks

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

**Example projects planned:**
1. Records with compact constructor invariants (Age, Range, Person)
2. Pattern matching with type patterns, guards, null handling
3. Sealed types with exhaustiveness checking

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

**Last session:** 2026-02-16T08:02:28.684Z
**Stopped at:** Completed 09-01-PLAN.md
**Resume file:** None

**Next steps:**
1. Execute Plan 09-02 (Example Projects)
2. Complete Phase 9 verification
3. Plan and execute Phase 10 (E2E tests)

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-16 after Phase 8 completion*
