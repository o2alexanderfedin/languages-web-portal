---
status: resolved
trigger: "missing-demo-project-picker: The website demo page shows only a file upload zone but no option to choose from pre-built demo projects."
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:02:00Z
---

## Current Focus

hypothesis: RESOLVED
test: TypeScript typecheck passed, ExampleSelector tests all pass (3/3)
expecting: Demo page now shows examples when a tool is selected via URL param
next_action: DONE

## Symptoms

expected: The demo page (/demo) should show a section "Or Try an Example" with clickable demo projects (e.g. a sample C# project) that users can select and run verification on without uploading their own ZIP file.
actual: The demo page only shows a file upload zone and a tool picker. There is a heading "Or Try an Example" visible in the page snapshot but no actual example projects to choose from — the section appears empty or incomplete.
errors: Browser console shows: "Failed to load resource: 404 @ http://localhost:5173/api/examples/csharp-verification" — the API endpoint for fetching examples does not exist on the server.
reproduction: Navigate to http://localhost:5173 → click "Try Now" on C# Verification → observe the demo page
timeline: Feature was agreed upon in prior planning but may never have been implemented, or was partially implemented without the backend endpoint.

## Eliminated

- hypothesis: Server route /api/examples/:toolId is missing
  evidence: packages/server/src/routes/examples.ts and dist/routes/examples.js both exist and are registered in index.ts at line 40
  timestamp: 2026-02-22T00:01:00Z

- hypothesis: Example project files are missing from server
  evidence: packages/server/examples/csharp-verification/ has 3 examples; java-verification has 3 examples; cpp-to-c-transpiler has entries
  timestamp: 2026-02-22T00:01:00Z

- hypothesis: ExampleService cannot find examples directory
  evidence: ExampleService uses resolve(import.meta.dirname, '../../examples') which resolves to packages/server/examples/ - directory exists
  timestamp: 2026-02-22T00:01:00Z

- hypothesis: ExampleSelector component is not rendered in Home.tsx
  evidence: Home.tsx line 118 renders <ExampleSelector toolId={currentToolId} onExampleLoaded={setProjectId} /> inside data-testid="example-section"
  timestamp: 2026-02-22T00:01:00Z

## Evidence

- timestamp: 2026-02-22T00:01:00Z
  checked: Root package.json dev script
  found: "concurrently ... \"npm run dev -w @repo/server\" \"npm run dev -w @repo/client\"" - runs TWO separate processes
  implication: Server runs on port 3000 (Express+Vite middleware), Client Vite dev server runs on port 5173 SEPARATELY

- timestamp: 2026-02-22T00:01:00Z
  checked: packages/client/vite.config.ts
  found: No proxy configuration at all - only plugins, resolve.alias
  implication: When browsing localhost:5173, all /api/* requests go to localhost:5173 (Vite) not localhost:3000 (Express) → 404

- timestamp: 2026-02-22T00:01:00Z
  checked: ExampleSelector.tsx lines 22-26
  found: Returns null when examples.length === 0, which happens because the API call fails
  implication: The "Or Try an Example" heading shows (it's in Home.tsx) but the ExampleSelector content is invisible

- timestamp: 2026-02-22T00:01:00Z
  checked: packages/server/src/config/env.ts
  found: Server port defaults to 3000
  implication: Proxy target should be http://localhost:3000

- timestamp: 2026-02-22T00:02:00Z
  checked: Pre-existing test failures (Landing, ToolPicker, OutputComponents)
  found: 4 failures exist in baseline (before any changes) - confirmed by git stash + rerun
  implication: These failures are not caused by this fix

## Resolution

root_cause: The Vite client dev server (port 5173) had no proxy configured for /api/* routes. When users browse localhost:5173 (which is how dev:client runs standalone), API calls to /api/examples/:toolId hit Vite instead of Express (port 3000), returning 404. The entire API surface (upload, execute, examples) was broken for clients using port 5173.

fix: |
  1. Added Vite dev server proxy in packages/client/vite.config.ts:
     server.proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } }
  2. Improved ExampleSelector UX: instead of returning null (blank) when no tool selected or examples loading, now shows descriptive messages:
     - "Select a tool below to see available examples." (no tool selected)
     - "Loading examples..." (tool selected, API in flight)
     - "No examples available for this tool." (tool selected, zero examples returned)
  3. Updated ExampleSelector test to match new behavior.

verification: |
  - TypeScript typecheck: PASSED (no errors)
  - ExampleSelector tests: 3/3 PASSED
  - Pre-existing failures (Landing, ToolPicker, OutputComponents): confirmed pre-existing, not introduced by this fix

files_changed:
  - packages/client/vite.config.ts
  - packages/client/src/features/execution/ExampleSelector.tsx
  - packages/client/src/__tests__/ExampleSelector.test.tsx
