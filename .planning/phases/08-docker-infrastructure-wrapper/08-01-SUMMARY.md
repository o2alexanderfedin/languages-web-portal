---
phase: 08-docker-infrastructure-wrapper
plan: 01
status: complete
started: 2026-02-16
completed: 2026-02-16
---

## One-Liner

Updated Dockerfile to 3-stage build with JDK 25, Maven, and pre-compiled Java FV CLI jar (68MB).

## What Was Built

- **3-stage Docker build**: node-builder (TypeScript portal) + java-builder (Maven/JDK 25 compiles Java FV from source) + production (JRE 25 + Node.js 22)
- **Maven POM fix**: Added `mvn install -N` to install root POM to local repo, resolving parent POM hierarchy mismatch between `java-fv-parent` and `compiler-plugin-parent`
- **Ubuntu Noble compatibility**: Fixed user creation from Alpine `addgroup -S`/`adduser -S` to Ubuntu `groupadd`/`useradd`

## Key Files

### Created
- None (modified existing Dockerfile)

### Modified
- `Dockerfile` — 3-stage build with JDK 25, Maven parent POM fix, Ubuntu user creation

## Verification Results

- Docker build completes successfully
- `java -version` → OpenJDK 25.0.2 (Eclipse Temurin)
- `node --version` → v22.22.0
- `/usr/local/lib/java-fv-cli.jar` exists (68MB)
- `java -jar java-fv-cli.jar --help` displays CLI usage with `generate` and `verify` commands
- Z3 solver bundled via z3-turnkey (no separate installation)

## Deviations

- **Maven POM resolution**: Plan assumed `COPY java-fv/pom.xml` + `COPY java-fv/compiler-plugin` would be sufficient. Sub-modules declare `java-fv-parent` as parent but relativePath resolves to `compiler-plugin-parent`. Fixed by adding `mvn install -N` to install root POM to local Maven repo before building.
- **User creation commands**: Plan didn't account for Ubuntu Noble base (not Alpine). Fixed `addgroup`/`adduser` to `groupadd`/`useradd`.

## Requirements Satisfied

- DOCK-01: JDK 25 with Java FV CLI jar pre-installed
- DOCK-03: Docker build compiles java-fv from source via Maven
- DOCK-04: Java FV execution works with proper JDK paths and Z3

## Self-Check: PASSED
