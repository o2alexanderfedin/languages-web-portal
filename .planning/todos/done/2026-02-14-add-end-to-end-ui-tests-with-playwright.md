---
created: 2026-02-14T01:56:23.784Z
title: Add end-to-end UI tests with Playwright
area: testing
files:
  - packages/client/src/pages/Landing.tsx
  - packages/client/src/pages/Home.tsx
  - packages/client/src/App.tsx
---

## Problem

The project currently has unit/component tests (vitest + testing-library) but lacks end-to-end UI tests that verify full user flows across the browser. Critical user journeys that need E2E coverage:

1. Landing page loads, user clicks "Try Now" on a tool, arrives at /demo with tool pre-selected
2. Upload a zip file, select a tool, execute it, see streaming output, view results, download output
3. Shareable links: copy link from /demo, open in new tab, tool is pre-selected
4. Quick-start CTA from landing page navigates correctly with quickstart param
5. Responsive layout behavior (desktop table vs mobile cards on landing page)

Chrome DevTools MCP server is already available in the workspace (.playwright-mcp/ directory exists). Playwright or Chrome DevTools automation can be used to drive browser interactions.

## Solution

Use Playwright for E2E tests (industry standard for React SPAs). Key steps:

1. Install @playwright/test as dev dependency in packages/client
2. Create playwright.config.ts with baseURL pointing to dev server (localhost:3000)
3. Write E2E test suites covering the critical user flows listed above
4. Optionally integrate with Chrome DevTools MCP for debugging/inspection during test development
5. Add npm script for running E2E tests separately from unit tests
