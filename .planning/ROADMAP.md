# Roadmap: Hupyy Languages Web Portal

## Milestones

- **v1.0 MVP** — Phases 1-7 (shipped 2026-02-14) — [Details](milestones/v1.0-ROADMAP.md)
- **v1.1 Java FV Integration** — Phases 8-10 (active)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-7) — SHIPPED 2026-02-14</summary>

- [x] Phase 1: Project Setup & Foundation (3/3 plans) — completed 2026-02-12
- [x] Phase 2: File Upload & Validation (2/2 plans) — completed 2026-02-13
- [x] Phase 3: Process Execution & Sandboxing (3/3 plans) — completed 2026-02-13
- [x] Phase 4: Real-Time Output Streaming (2/2 plans) — completed 2026-02-12
- [x] Phase 5: Output Preview & Download (3/3 plans) — completed 2026-02-13
- [x] Phase 6: Landing Page & Examples (2/2 plans) — completed 2026-02-13
- [x] Phase 7: E2E Testing with Playwright (2/2 plans) — completed 2026-02-14

</details>

### v1.1 Java FV Integration (Phases 8-10)

- [ ] **Phase 8: Docker Infrastructure & Wrapper** - Build Docker image with JDK 25, Java FV CLI jar, and wrapper script
- [ ] **Phase 9: Tool Activation & Examples** - Enable Java verification tool and add example projects
- [ ] **Phase 10: E2E Testing** - Verify Java verification workflow end-to-end

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Setup & Foundation | v1.0 | 3/3 | Complete | 2026-02-12 |
| 2. File Upload & Validation | v1.0 | 2/2 | Complete | 2026-02-13 |
| 3. Process Execution & Sandboxing | v1.0 | 3/3 | Complete | 2026-02-13 |
| 4. Real-Time Output Streaming | v1.0 | 2/2 | Complete | 2026-02-12 |
| 5. Output Preview & Download | v1.0 | 3/3 | Complete | 2026-02-13 |
| 6. Landing Page & Examples | v1.0 | 2/2 | Complete | 2026-02-13 |
| 7. E2E Testing with Playwright | v1.0 | 2/2 | Complete | 2026-02-14 |
| 8. Docker Infrastructure & Wrapper | v1.1 | 0/0 | Not started | - |
| 9. Tool Activation & Examples | v1.1 | 0/0 | Not started | - |
| 10. E2E Testing | v1.1 | 0/0 | Not started | - |

## Phase Details

<details>
<summary>v1.0 MVP Phases (1-7) — See milestones/v1.0-ROADMAP.md</summary>

Shipped 2026-02-14. Details archived in milestones/v1.0-ROADMAP.md.

</details>

### Phase 8: Docker Infrastructure & Wrapper

**Goal**: Docker production image runs Java FV with proper JDK, CLI jar, and wrapper script

**Depends on**: Nothing (first phase of v1.1)

**Requirements**: DOCK-01, DOCK-02, DOCK-03, DOCK-04, WRAP-01, WRAP-02, WRAP-03, WRAP-04

**Success Criteria** (what must be TRUE):
1. Docker image successfully builds with JDK 25 and Java FV CLI jar at `/usr/local/lib/java-fv-cli.jar`
2. Wrapper script at `/usr/local/bin/hupyy-java-verify` accepts `--input <path>` and invokes Java FV CLI jar
3. Wrapper script streams stdout/stderr in real-time and returns appropriate exit codes
4. User can run `docker run <image> hupyy-java-verify --input /path/to/java/src` and see verification output

**Plans**: TBD

---

### Phase 9: Tool Activation & Examples

**Goal**: Java verification tool is available in portal with working example projects

**Depends on**: Phase 8 (needs infrastructure to test tool activation)

**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, EXAM-01, EXAM-02, EXAM-03, EXAM-04

**Success Criteria** (what must be TRUE):
1. Landing page shows Java Verification with 'Available' badge instead of 'In Development'
2. User can select Java Verification tool from tool grid and reach the execution page
3. User can load one of three example projects (records, pattern matching, sealed types) via example dropdown
4. User can execute Java verification on uploaded or example Java files and see real-time output

**Plans**: TBD

---

### Phase 10: E2E Testing

**Goal**: Automated tests verify Java verification workflow from landing page to output download

**Depends on**: Phase 9 (needs functional tool + examples to test)

**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04

**Success Criteria** (what must be TRUE):
1. Automated test verifies Java Verification appears as 'Available' on landing page
2. Automated test loads example Java project and executes verification successfully
3. Automated test captures real-time console output showing ACSL contracts and Z3 results
4. Automated test verifies output file tree displays generated verification artifacts

**Plans**: TBD

---

*Roadmap created: 2026-02-12*
*Last updated: 2026-02-15 after v1.1 roadmap creation*
