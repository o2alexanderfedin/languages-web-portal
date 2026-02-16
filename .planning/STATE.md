# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.
**Current focus:** v1.1 Java FV Integration — making Java verification the first live tool

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-15 — Milestone v1.1 started

## Accumulated Context

### Decisions

All v1.0 decisions documented in PROJECT.md Key Decisions table.

### Java FV Integration Notes

- Java FV CLI: `java -jar java-fv-cli.jar verify src/`
- Also usable as javac plugin: `javac -Xplugin:JavaFV MyClass.java`
- Requires JDK 25 (Microsoft OpenJDK or equivalent)
- Z3 bundled via z3-turnkey 4.14.1 (no separate install)
- CVC5 optional but recommended for multi-solver
- Maven 3.9+ for build
- Source at ~/Projects/hapyy/java-fv/
- 6 example files in examples/modern-java/
- Tool already listed as `java-verification` in portal (status: in-development)

### Pending Todos

None.

### Blockers/Concerns

- Docker image size: JDK 25 adds significant size to Alpine image
- Need wrapper script to bridge Java FV CLI to portal's `--input <projectPath>` interface

## Session Continuity

Last session: 2026-02-15 (milestone start)
Stopped at: Defining requirements
Resume file: None

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-15 after v1.1 milestone start*
