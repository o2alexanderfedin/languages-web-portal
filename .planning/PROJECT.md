# Hapyy Languages Web Portal

## What This Is

A public demo web portal for Hapyy's formal verification tools and transpilers. Users upload source code (as zip files), run CLI-based analysis/transpilation tools, watch execution in a real-time streaming console, preview key results inline, and download full output as a zip. The portal showcases how these tools fit into the bigger picture of autonomous software development — providing comprehensive AI-generated code verification.

## Core Value

Users can try any Hapyy formal verification or transpiler tool directly in the browser — upload code, see it run, get results — with zero local setup.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page with Hapyy branding, mission statement, tool comparison grid, and quick-start flow
- [ ] Individual demo page per tool (8 tools total, some "Coming Soon")
- [ ] Zip file upload on each demo page for input source code
- [ ] Server-side project directory isolation per client session
- [ ] CLI tool execution with real-time stdout/stderr streaming to browser console view
- [ ] Output preview inline (transpiled code diffs, verification results summaries)
- [ ] Downloadable output zip with full results
- [ ] Automatic project directory cleanup (5-15 minutes after output is ready)
- [ ] Sales/narrative content about AI-generated code verification use case
- [ ] Tool status indicators (Available / In Development / Coming Soon)

### Out of Scope

- User accounts / authentication — public access, no logins
- Mobile-native app — web only
- CI/CD integration — this is a demo portal, not a production pipeline
- Persistent project storage — ephemeral by design
- Tool installation management — tools are pre-installed on the server

## Context

**Tools in the Hapyy ecosystem (current state):**

| Tool | Type | Language | Status |
|------|------|----------|--------|
| C++ to C Transpiler | Transpiler (with ACSL inference, Frama-C verification) | C++ → C | In Development |
| C++ to Rust Transpiler | Transpiler (idiomatic) | C++ → Rust | In Development |
| C# Formal Verification Plugin | Verification | C# | Finishing Up |
| Java Formal Verification Plugin | Verification | Java | Finishing Up |
| Rust Formal Verification Plugin | Verification | Rust | Very Beginning |
| Python Formal Verification Linter | Linter/Verification | Python | Planning |
| TypeScript Formal Verification Linter | Linter/Verification | TypeScript | Planning |
| Bash Formal Verification | Verification | Bash | Planning |

All tools are CLI-based: take input directory/files, produce output directory/files.

Tool binary/script locations will be configured later (not yet provided).

**Bigger picture:** These tools serve autonomous software development workflows where AI-generated code needs comprehensive formal verification before deployment. The portal demonstrates this capability to potential users and customers.

**Deployment path:** Local machine first, then Digital Ocean hosting.

**Expected concurrency:** 5-20 simultaneous users at peak.

## Constraints

- **Tech stack**: TypeScript + Node.js (full-stack) — user preference
- **Tool interface**: All tools are CLI programs (stdin/stdout/stderr, input dir → output dir)
- **Hosting**: Local first, Digital Ocean later — must be containerizable
- **Concurrency**: Must handle 5-20 simultaneous tool executions with isolated project directories
- **Cleanup**: Project directories auto-cleaned 5-15 minutes after output is available
- **Public access**: No authentication — anyone with the URL can use it

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript + Node full stack | User preference, consistency with TS linter tool | — Pending |
| Public access, no auth | Demo portal for showcasing tools, minimal friction | — Pending |
| Real-time console streaming | Users need to see tool progress as it happens (WebSocket/SSE) | — Pending |
| Ephemeral project dirs | No persistent storage needed, simplifies deployment | — Pending |
| Show all tools with status badges | Even "Coming Soon" tools demonstrate breadth of ecosystem | — Pending |

---
*Last updated: 2026-02-12 after initialization*
