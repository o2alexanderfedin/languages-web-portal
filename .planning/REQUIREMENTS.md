# Requirements: Hapyy Languages Web Portal

**Defined:** 2026-02-12
**Core Value:** Users can try any Hapyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### File Processing

- [ ] **FILE-01**: User can upload a zip file via drag-and-drop or file picker
- [ ] **FILE-02**: User sees maximum upload size limit displayed before attempting upload
- [ ] **FILE-03**: Browser validates file type (.zip only) and size before sending to server
- [ ] **FILE-04**: Server extracts uploaded zip into isolated project directory with security validation (path traversal, zip bomb, symlink rejection)
- [ ] **FILE-05**: User can load a pre-built example project per tool (3-5 examples each) with one click

### Tool Execution

- [ ] **EXEC-01**: User can select which tool to run from a clear tool picker showing all 8 tools
- [ ] **EXEC-02**: Each tool displays its status badge (Available / In Development / Coming Soon)
- [ ] **EXEC-03**: User sees real-time progress indicators during tool execution
- [ ] **EXEC-04**: User sees real-time streaming stdout/stderr output in a console view as the tool runs
- [ ] **EXEC-05**: User sees execution metrics after completion (processing time, files processed, exit code)
- [ ] **EXEC-06**: Server enforces per-process resource limits (CPU, memory, timeout) to prevent resource exhaustion
- [ ] **EXEC-07**: Server limits concurrent executions and queues excess requests with queue position feedback

### Output & Download

- [ ] **OUT-01**: User can preview key output files inline with syntax highlighting
- [ ] **OUT-02**: User can browse output files via tree view and select individual files to preview
- [ ] **OUT-03**: User can download full output as a zip file
- [ ] **OUT-04**: Output preview distinguishes between transpiler results (source code) and verification results (reports/logs)

### Infrastructure

- [ ] **INFRA-01**: Each client session gets an isolated project directory on the server
- [ ] **INFRA-02**: Project directories are automatically cleaned up 5-15 minutes after output is available for download
- [ ] **INFRA-03**: Server handles 5-20 simultaneous users without degradation
- [ ] **INFRA-04**: Server provides clear error messages distinguishing user errors from system errors
- [ ] **INFRA-05**: Server implements per-IP rate limiting to prevent abuse
- [ ] **INFRA-06**: Server gracefully degrades under load (queues requests instead of crashing)

### Landing Page & Sharing

- [ ] **LAND-01**: Landing page displays tool comparison grid showing all 8 tools with language, type, status, and capabilities
- [ ] **LAND-02**: Landing page includes mission statement and narrative about formal verification for AI-generated code
- [ ] **LAND-03**: User can generate a shareable link to a specific tool demo with their configuration
- [ ] **LAND-04**: Landing page provides quick-start flow to try a tool immediately

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Output

- **OUT-05**: User can compare outputs from different tools side-by-side
- **OUT-06**: User can see CLI command generation to reproduce locally

### Advanced Onboarding

- **LAND-05**: Tool recommendation wizard ("Which tool should I use?")
- **LAND-06**: Inline documentation per tool with input requirements and output format explanations

### API & Integration

- **API-01**: Public API for programmatic tool execution (for CI/CD integration)
- **API-02**: Batch processing of multiple zip files in one session

### Analytics

- **ANAL-01**: Admin dashboard showing tool usage statistics
- **ANAL-02**: User session history stored in browser local storage

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Public demo portal, zero friction access |
| Persistent cloud storage | Ephemeral by design, users download results immediately |
| Real-time collaboration | Shareable links sufficient, no concurrent editing needed |
| Mobile native app | Desktop is primary use case, responsive web sufficient |
| CI/CD pipeline integration | This is a demo portal, not a production tool (defer to v2 API) |
| Custom tool configuration (compiler flags, versions) | One stable version per tool keeps demo simple |
| Version control integration | Over-engineered for demo, belongs in CLI tools |
| Social features (comments, likes) | Not aligned with professional developer tool positioning |
| Real-time pricing calculator | Demo portal separate from sales/pricing concerns |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILE-01 | Phase 2 | Pending |
| FILE-02 | Phase 2 | Pending |
| FILE-03 | Phase 2 | Pending |
| FILE-04 | Phase 2 | Pending |
| FILE-05 | Phase 2 | Pending |
| EXEC-01 | Phase 3 | Pending |
| EXEC-02 | Phase 3 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| EXEC-05 | Phase 4 | Pending |
| EXEC-06 | Phase 3 | Pending |
| EXEC-07 | Phase 3 | Pending |
| OUT-01 | Phase 5 | Pending |
| OUT-02 | Phase 5 | Pending |
| OUT-03 | Phase 5 | Pending |
| OUT-04 | Phase 5 | Pending |
| INFRA-01 | Phase 2 | Pending |
| INFRA-02 | Phase 5 | Pending |
| INFRA-03 | Phase 3 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 3 | Pending |
| INFRA-06 | Phase 3 | Pending |
| LAND-01 | Phase 6 | Pending |
| LAND-02 | Phase 6 | Pending |
| LAND-03 | Phase 6 | Pending |
| LAND-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after roadmap creation - traceability updated*
