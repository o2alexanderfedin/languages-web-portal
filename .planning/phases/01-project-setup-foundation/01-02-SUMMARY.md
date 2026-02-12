---
phase: 01-project-setup-foundation
plan: 02
subsystem: client-foundation
tags: [react, vite, tailwind, redux, rtk-query, shadcn-ui, theme, routing, vitest]
dependency_graph:
  requires:
    - 01-01 (Monorepo skeleton and Express server)
  provides:
    - React client package with Vite build system
    - Tailwind CSS v4 styling
    - shadcn/ui component library integration
    - Redux Toolkit store with typed hooks
    - RTK Query health endpoint
    - Dark/light/system theme support
    - React Router v7 for client-side routing
    - Single-port full-stack development
    - Root Vitest configuration for monorepo testing
  affects:
    - All subsequent client-side features (Phase 2-6)
tech_stack:
  added:
    - React 18.3.1
    - Vite 6.0.11
    - Tailwind CSS 4.0.0
    - shadcn/ui (New York style)
    - Redux Toolkit 2.5.0
    - RTK Query
    - React Router 7.1.1
    - Vitest 3.2.4 with jsdom
  patterns:
    - Vite middleware in Express for single-port dev
    - Redux store with typed hooks pattern
    - ThemeProvider context with localStorage persistence
    - Tailwind CSS v4 with CSS variables for theming
    - shadcn/ui component library setup
    - Monorepo test configuration with workspace projects
key_files:
  created:
    - packages/client/package.json
    - packages/client/vite.config.ts
    - packages/client/vitest.config.ts
    - packages/client/src/App.tsx
    - packages/client/src/main.tsx
    - packages/client/src/store/index.ts
    - packages/client/src/store/hooks.ts
    - packages/client/src/features/health/api.ts
    - packages/client/src/components/ThemeProvider.tsx
    - packages/client/src/components/ui/button.tsx
    - packages/client/src/pages/Home.tsx
    - packages/client/src/lib/utils.ts
    - packages/client/src/index.css
    - packages/client/src/__tests__/App.test.tsx
    - packages/client/src/__tests__/setup.ts
    - vitest.config.ts
  modified:
    - packages/server/src/index.ts
    - packages/server/package.json
    - package.json
decisions:
  - Use React 18.3 (stable) instead of React 19 (still in canary)
  - Use Tailwind CSS v4 with @tailwindcss/vite plugin (new approach)
  - Use shadcn/ui "New York" style for component aesthetic
  - Use Vite appType "spa" for automatic index.html serving in dev mode
  - Simplify tsx dev script to avoid watch conflicts with Vite temp files
  - Use CSS variables for theming (compatible with Tailwind v4)
  - Mock matchMedia and localStorage in test setup for jsdom compatibility
metrics:
  duration_seconds: 508
  tasks_completed: 2
  tests_added: 1
  tests_passing: 8
  files_created: 43
  completed_date: 2026-02-12
---

# Phase 01 Plan 02: React Client with Vite, Tailwind, Redux, and Single-Port Dev Summary

**One-liner:** React 18.3 SPA with Vite build, Tailwind CSS v4, shadcn/ui components, Redux Toolkit store, RTK Query health endpoint, and dark/light theme support - all served through Express on single port 3000

## What Was Built

Created a complete React client package integrated with the Express server for single-port full-stack development. The client features:

**Build & Dev Tools:**
- Vite 6 build system with React plugin and Tailwind CSS v4 plugin
- TypeScript project references linking to shared package
- Vitest test runner with jsdom environment
- Express middleware integration for seamless dev experience

**Styling & UI:**
- Tailwind CSS v4 with CSS variables for dynamic theming
- shadcn/ui component library (New York style) with Button component
- Dark/light/system theme support with localStorage persistence
- Responsive design patterns

**State Management:**
- Redux Toolkit store with typed hooks (useAppDispatch, useAppSelector)
- RTK Query API client with health endpoint
- Automatic API request caching and invalidation

**Routing & Pages:**
- React Router v7 for client-side navigation
- Home page with health status indicator and theme toggle
- 404 fallback route

**Single-Port Development:**
- Vite dev server integrated into Express via middleware
- API routes and React app both served on port 3000
- Production-ready static file serving with SPA fallback
- Root Vitest configuration running all workspace tests

## Tasks Completed

### Task 1: React client with Vite, Tailwind, shadcn/ui, Redux, and Router

**Commit:** c4b6da7

**What was done:**
- Created packages/client with full TypeScript configuration (composite build, project references)
- Set up Vite 6 with React plugin and Tailwind CSS v4 plugin
- Configured Tailwind CSS v4 with CSS custom properties for theming
- Installed and configured shadcn/ui component library (New York style)
- Created Button component as first shadcn/ui component
- Implemented ThemeProvider context with dark/light/system modes
- Set up Redux Toolkit store with typed hooks
- Created RTK Query health API endpoint
- Built Home page with health status indicator and theme toggle
- Set up Vitest with jsdom, matchMedia mock, and localStorage mock
- Created App component with Provider wrapping (Redux, Theme, Router)
- Verified client builds and tests pass

**Key files:**
- packages/client/vite.config.ts (Vite + Tailwind setup)
- packages/client/src/store/index.ts (Redux store)
- packages/client/src/features/health/api.ts (RTK Query)
- packages/client/src/components/ThemeProvider.tsx (Theme context)
- packages/client/src/pages/Home.tsx (Landing page)
- packages/client/src/__tests__/setup.ts (Test mocks)

**Deviations applied:**
- Fixed tailwind-merge version from ^2.7.0 to ^3.4.0 (Rule 3 - blocking dependency issue)
- Added @testing-library/dom dependency (Rule 3 - missing peer dependency)
- Fixed test Router nesting issue by removing duplicate MemoryRouter (Rule 1 - bug)
- Added matchMedia and localStorage mocks in test setup (Rule 2 - missing test infrastructure)
- Added type assertion for Vite plugins to resolve monorepo type conflict (Rule 3 - TypeScript compilation blocker)
- Updated Tailwind CSS syntax from @apply to direct CSS for v4 compatibility (Rule 1 - incorrect syntax)

### Task 2: Vite-Express dev integration and root Vitest config

**Commit:** 143dfae

**What was done:**
- Updated packages/server/src/index.ts to integrate Vite middleware in development mode
- Configured Vite with appType "spa" for automatic index.html serving
- Added production mode static file serving with SPA fallback route
- Added vite as devDependency to server package
- Created root vitest.config.ts with workspace projects configuration
- Updated root package.json dev script to start server only (single command)
- Updated root package.json test scripts to use Vitest
- Verified single-port development works (http://localhost:3000 serves both API and React app)
- Verified all tests pass from root npm test command

**Key files:**
- packages/server/src/index.ts (Vite middleware integration)
- vitest.config.ts (Root test config)
- package.json (Updated dev and test scripts)

**Deviations applied:**
- Changed Vite appType from "custom" to "spa" for automatic index.html serving (Rule 1 - incorrect configuration)
- Simplified dev script from "tsx watch" to "tsx" to avoid conflicts with Vite temp files (Rule 3 - blocking development issue)

## Verification Results

**Build verification:**
```
npm run build → SUCCESS
- All packages compile (shared, server, client)
- Vite production build succeeds
- Output: packages/client/dist/index.html (0.47 kB), CSS (11.38 kB), JS (287.35 kB)
```

**Test verification:**
```
npm test → 8/8 tests passing (7 server + 1 client)
✓ Client: App renders without crashing
✓ Server: Health endpoint returns correct JSON
✓ Server: Error handling for UserError, SystemError, NotFoundError, ValidationError, unknown errors
```

**Runtime verification:**
```
npm run dev → Server starts on port 3000
curl http://localhost:3000/api/health → {"status":"ok",...}
curl http://localhost:3000/ → <!DOCTYPE html>...<title>Hapyy Languages Web Portal</title>...
```

**Success criteria met:**
- [x] React SPA renders via Vite middleware in Express (single port dev)
- [x] Tailwind CSS classes apply correctly (visible styling in index.css)
- [x] shadcn/ui Button component renders (proves component pipeline works)
- [x] Redux store created with typed hooks (useAppDispatch, useAppSelector)
- [x] RTK Query health endpoint fetches and displays server health
- [x] Dark/light theme toggle persists to localStorage and applies CSS class
- [x] React Router handles / route and 404 fallback
- [x] All client and server tests pass from root npm test

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed tailwind-merge version**
- **Found during:** Task 1, npm install
- **Issue:** Package.json specified tailwind-merge@^2.7.0 but only @^3.4.0 exists
- **Fix:** Updated to tailwind-merge@^3.4.0
- **Files modified:** packages/client/package.json

**2. [Rule 3 - Blocking] Added @testing-library/dom dependency**
- **Found during:** Task 1, running client tests
- **Issue:** @testing-library/react requires @testing-library/dom peer dependency
- **Fix:** Added @testing-library/dom@^10.4.0 to devDependencies
- **Files modified:** packages/client/package.json

**3. [Rule 1 - Bug] Fixed Router nesting in test**
- **Found during:** Task 1, running client tests
- **Issue:** Test wrapped App in MemoryRouter but App already contains BrowserRouter
- **Fix:** Removed MemoryRouter wrapper and render App directly (already has all providers)
- **Files modified:** packages/client/src/__tests__/App.test.tsx

**4. [Rule 2 - Missing Test Infrastructure] Added test mocks**
- **Found during:** Task 1, running client tests
- **Issue:** jsdom doesn't provide window.matchMedia or localStorage
- **Fix:** Created test setup file with matchMedia and localStorage mocks
- **Files modified:** packages/client/src/__tests__/setup.ts, packages/client/vitest.config.ts

**5. [Rule 3 - Blocking] Type assertion for Vite plugins**
- **Found during:** Task 1, Vite build
- **Issue:** TypeScript type conflict between root and client workspace Vite installations
- **Fix:** Added `as any` type assertion to plugins array
- **Files modified:** packages/client/vite.config.ts

**6. [Rule 1 - Bug] Updated Tailwind CSS v4 syntax**
- **Found during:** Task 1, Vite build
- **Issue:** Tailwind v4 doesn't support `@apply border-border` syntax
- **Fix:** Changed to direct CSS: `border-color: hsl(var(--border))`
- **Files modified:** packages/client/src/index.css

**7. [Rule 1 - Bug] Fixed Vite appType configuration**
- **Found during:** Task 2, testing dev server
- **Issue:** Vite with appType "custom" doesn't serve index.html automatically
- **Fix:** Changed to appType "spa" for automatic SPA index serving
- **Files modified:** packages/server/src/index.ts

**8. [Rule 3 - Blocking] Simplified dev script**
- **Found during:** Task 2, running dev server
- **Issue:** tsx watch triggers infinite restart loop due to Vite temp config files
- **Fix:** Changed from "tsx watch" to "tsx" (manual restart for now)
- **Files modified:** packages/server/package.json
- **Note:** Watch mode can be re-enabled with proper ignore patterns in future if needed

## Technical Decisions

1. **React 18.3 (stable) over React 19**
   - React 19 still in canary/RC status
   - 18.3 is latest stable with full ecosystem support
   - Per research recommendation in 01-RESEARCH.md

2. **Tailwind CSS v4 with @tailwindcss/vite plugin**
   - New Vite-first approach (no tailwind.config.js needed)
   - Uses CSS @import "tailwindcss" syntax
   - Requires CSS variables instead of @apply for dynamic values
   - Vibrant blue primary color (hsl(221 83% 53%)) for polished look

3. **shadcn/ui New York style**
   - More polished aesthetic than default style
   - Component library pattern (copy components to src, not npm package)
   - Enables customization while maintaining design consistency

4. **Vite appType "spa"**
   - Automatically serves index.html for non-API routes
   - Simpler than "custom" appType which requires manual HTML middleware
   - Perfect for React SPA with client-side routing

5. **Single-port development**
   - Vite middleware mounted in Express after API routes
   - API routes take precedence (mounted first)
   - Eliminates CORS issues during development
   - Production uses static file serving with same pattern

6. **Test setup with mocks**
   - matchMedia mock for ThemeProvider system theme detection
   - localStorage mock for theme persistence
   - Required for jsdom environment which doesn't include browser APIs

7. **Simplified dev script (no watch mode)**
   - tsx watch conflicts with Vite's temp config file generation
   - Trade-off: manual restart for stable development
   - Can be improved later with nodemon or better ignore patterns

## Dependencies Graph

**Phase 01 Plan 02 provides:**
- React client build system
- Tailwind CSS styling foundation
- Redux Toolkit state management
- RTK Query API client pattern
- Theme system with dark/light modes
- Component library integration (shadcn/ui)
- Single-port full-stack development
- Monorepo test infrastructure

**Required by:**
- 01-03 (Production build and deployment)
- 02-01, 02-02 (File upload UI components)
- 03-01, 03-02 (Process execution UI, console streaming)
- 04-01, 04-02 (Tool selection UI)
- 05-01, 05-02 (Result display components)
- 06-01, 06-02 (Landing page, documentation)

## Self-Check: PASSED

**Created files verification:**
- FOUND: packages/client/package.json
- FOUND: packages/client/vite.config.ts
- FOUND: packages/client/src/App.tsx
- FOUND: packages/client/src/main.tsx
- FOUND: packages/client/src/store/index.ts
- FOUND: packages/client/src/features/health/api.ts
- FOUND: packages/client/src/components/ThemeProvider.tsx
- FOUND: packages/client/src/components/ui/button.tsx
- FOUND: packages/client/src/pages/Home.tsx
- FOUND: packages/client/src/__tests__/App.test.tsx
- FOUND: packages/client/src/__tests__/setup.ts
- FOUND: vitest.config.ts

**Commits verification:**
- FOUND: c4b6da7 (Task 1 - React client)
- FOUND: 143dfae (Task 2 - Vite-Express integration)

**Build verification:**
- SUCCESS: npm run build compiles all packages
- SUCCESS: npm run build -w @repo/client produces dist/

**Test verification:**
- SUCCESS: npm test runs 8 tests, all pass
- SUCCESS: Client test verifies App renders
- SUCCESS: Server tests verify health and error handling

**Runtime verification:**
- SUCCESS: npm run dev starts server on port 3000
- SUCCESS: http://localhost:3000/api/health returns JSON
- SUCCESS: http://localhost:3000/ serves React app with correct title
