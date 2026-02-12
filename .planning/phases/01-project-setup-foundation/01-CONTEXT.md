# Phase 1: Project Setup & Foundation - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Development environment ready with TypeScript, Node.js, and basic Express server configured. Monorepo structure with client, server, and shared packages. Containerized for Digital Ocean deployment. This phase delivers the skeleton — no business logic, no UI beyond a health check proof-of-life.

</domain>

<decisions>
## Implementation Decisions

### Frontend framework
- React with Vite (SPA, no SSR meta-framework)
- React Router for client-side routing
- Redux Toolkit for state management (typed slices, RTK Query for API calls)

### Project structure
- Monorepo with npm workspaces
- Three packages: `packages/client` (React + Vite), `packages/server` (Express), `packages/shared` (types, constants, utils)
- tsx for dev server with watch mode, tsc for production builds (server)
- Vite handles client build

### Styling approach
- Tailwind CSS utility-first
- shadcn/ui component library (Radix + Tailwind, copy-paste components)
- Marketing-forward, polished visual tone (think Stripe/Tailwind site — gradients, vibrant)
- Dark/light mode with system preference detection, user toggle override

### Dev & deploy workflow
- Multi-stage Dockerfile (build stage + production stage, server serves API + static client)
- Express serves Vite in dev mode via middleware (single port, integrated dev experience)
- Vitest for testing (both client and server packages)
- Digital Ocean App Platform auto-deploy from GitHub (DO builds from Dockerfile on push to main)

### Claude's Discretion
- ESLint/Prettier configuration details
- TypeScript strict mode settings
- Express middleware stack ordering
- Vite plugin selection
- Docker base image choice (Node version)
- Port numbers and env var naming conventions

</decisions>

<specifics>
## Specific Ideas

- Visual tone reference: Stripe and Tailwind CSS website — polished, marketing-forward, gradients and vibrant colors
- shadcn/ui for accessible, customizable components without heavy dependency
- Redux Toolkit specifically (not vanilla Redux) — typed slices and RTK Query
- Single-port dev experience: Express serves Vite middleware in development

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-project-setup-foundation*
*Context gathered: 2026-02-12*
