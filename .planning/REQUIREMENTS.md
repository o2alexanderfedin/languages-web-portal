# Requirements: Hupyy Languages Web Portal

**Defined:** 2026-02-21
**Core Value:** Users can try any Hupyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## v1.4 Requirements

Requirements for v1.4 Local Development Experience milestone. Each maps to roadmap phases.

### Startup

- [x] **START-01**: `npm run dev` at project root starts both server (port 3000) and client dev server (port 5173) with a single command
- [x] **START-02**: Server and client output is shown concurrently in the same terminal with labeled prefixes ([server]/[client])

### Tool Configuration

- [x] **CONF-01**: C# FV command is configurable via `CSHARP_FV_CMD` env var in toolRegistry (falls back to `/usr/local/bin/hupyy-csharp-verify` when unset — preserves Docker behavior)
- [x] **CONF-02**: Local `.env` sets `CSHARP_FV_CMD` to the local wrapper script path and `CS_FV_DLL` to the local cs-fv publish output path
- [x] **CONF-03**: Local `.env` sets `JAVA_HOME` to the installed JDK path (jdk-21, not the stale jdk-22 reference)
- [x] **CONF-04**: Local `.env` sets `CVC5_PATH` to `~/bin/cvc5` so the C# FV wrapper can find the solver

### End-to-End

- [x] **E2E-01**: C# Formal Verification tool shows "Available" in the portal UI when running locally with `npm run dev`
- [x] **E2E-02**: Uploading a C# zip (e.g. null-safe-repository) and clicking Execute produces real-time streaming verification output in the browser

### Documentation

- [ ] **DOC-01**: `README.md` at project root documents prerequisites (Node.js, .NET, Java, Z3, CVC5), one-time setup steps, and how to start the portal locally

## Future Requirements

### Next Tools

- Java FV tool working locally (requires building java-fv jar from source)
- Production deployment to Digital Ocean with custom domain

## Out of Scope

| Feature | Reason |
|---------|--------|
| Java FV local execution | java-fv CLI jar not built (FormulaAdapter missing in source) — user handling separately |
| CI/CD pipeline | Not needed for local dev experience |
| Docker optimization | Image size acceptable for demo; not v1.4 scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| START-01 | Phase 24 | Complete |
| START-02 | Phase 24 | Complete |
| CONF-01 | Phase 24 | Complete |
| CONF-02 | Phase 24 | Complete |
| CONF-03 | Phase 24 | Complete |
| CONF-04 | Phase 24 | Complete |
| E2E-01 | Phase 24 | Complete |
| E2E-02 | Phase 24 | Complete |
| DOC-01 | Phase 25 | Pending |

**Coverage:**
- v1.4 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 — initial definition*
