---
phase: 06-landing-page-examples
plan: 01
subsystem: landing-page
tags: [landing-page, routing, ui-components, marketing]
dependency_graph:
  requires: [phase-05-03]
  provides: [landing-page-ui, demo-route-separation]
  affects: [routing, client-navigation]
tech_stack:
  added: []
  patterns: [responsive-design, component-composition, react-router-navigation]
key_files:
  created:
    - packages/client/src/pages/Landing.tsx
    - packages/client/src/features/landing/HeroSection.tsx
    - packages/client/src/features/landing/ToolComparisonGrid.tsx
    - packages/client/src/features/landing/QuickStartCTA.tsx
  modified:
    - packages/client/src/App.tsx
    - packages/client/src/pages/Home.tsx
    - packages/client/src/__tests__/App.test.tsx
decisions:
  - decision: Landing page as marketing entry point at / route
    rationale: New users need to understand value proposition before diving into demo
    alternatives: Keep execution flow at /, add /about marketing page
    why_chosen: Single cohesive landing experience more effective than split pages
  - decision: Responsive table/card layout for tool comparison grid
    rationale: Desktop users benefit from table density, mobile needs card readability
    alternatives: Table-only with horizontal scroll, card-only on all devices
    why_chosen: Native HTML table with Tailwind classes for semantic markup and accessibility
  - decision: First available tool for quick-start CTA
    rationale: Lowest friction entry point - user clicks once and lands in working demo
    alternatives: Tool picker modal, random tool selection
    why_chosen: Predictable behavior with C++ to C transpiler as flagship demo
metrics:
  duration: 192
  completed: 2026-02-13T07:31:43Z
---

# Phase 6 Plan 1: Landing Page Components and Routing

**One-liner:** Landing page with hero section, 8-tool comparison grid, and quick-start CTA at / route, with demo execution flow moved to /demo.

## What Was Built

Created a marketing-focused landing page as the new entry point for the Hapyy portal:

1. **HeroSection component** - Full-width hero with mission statement about formal verification for AI-generated code, positioning Hapyy tools in the context of autonomous software development and "vericoding" (verified code transformations). References the 96% developer trust gap for AI-generated code. Includes dual CTAs: primary quick-start and secondary "Explore Tools" scroll navigation.

2. **ToolComparisonGrid component** - Responsive 8-tool comparison showing all transpilers, verification tools, and linters with:
   - Desktop: Semantic HTML table with columns for Tool Name, Type, Language, Status, and Action
   - Mobile: Stacked card layout with tool details and inline CTA buttons
   - Status badges: green (available), amber (in-development), gray (coming-soon)
   - "Try Now" buttons navigate to /demo?tool={id}, disabled for coming-soon tools

3. **QuickStartCTA component** - Reusable button component that finds first available tool (C++ to C Transpiler) and navigates to /demo?tool=cpp-to-c-transpiler&quickstart=true. Accepts variant, size, and className props for flexibility.

4. **Landing page** - Composes HeroSection, ToolComparisonGrid, theme toggle in top bar, and footer with "Built by Hapyy" and demo link. Uses min-h-screen layout with footer pushed to bottom.

5. **Routing update** - Split routes: / renders Landing (marketing), /demo renders Home (execution workspace). Updated Home.tsx to remove page-level heading/tagline and add "Back to Home" navigation link.

6. **Test updates** - Updated App.test.tsx to test both routes: / checks for "Formal Verification for AI-Generated Code" text, /demo checks for "Upload Your Code" text.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- **Type checking:** `npx tsc --noEmit -p packages/client/tsconfig.json` - zero errors
- **Tests:** 7 test files, 40 tests passed, 20 todo (expected)
- **Must-haves verified:**
  - Landing page at / displays hero section with mission statement ✓
  - Tool comparison grid shows all 8 tools with name, type, language, status badges ✓
  - QuickStartCTA navigates to /demo?tool=cpp-to-c-transpiler&quickstart=true ✓
  - "Try Now" buttons navigate to /demo?tool={id} ✓
  - /demo route renders existing execution flow (upload + tool picker) ✓
  - "Back to Home" link in demo page navigates to / ✓

- **Key links verified:**
  - Landing imports and renders HeroSection ✓
  - ToolComparisonGrid imports TOOLS from @repo/shared ✓
  - QuickStartCTA navigates to /demo with tool pre-selected ✓
  - App.tsx Route path="/" renders Landing ✓

- **File requirements:**
  - Landing.tsx: 57 lines (min 20) ✓
  - HeroSection.tsx: 36 lines (min 25) ✓
  - ToolComparisonGrid.tsx: 132 lines (min 40) ✓
  - QuickStartCTA.tsx: 31 lines (min 15) ✓

## Implementation Notes

**Responsive design pattern:** Used Tailwind's `hidden md:block` and `md:hidden` utilities to conditionally render table vs card layouts. This avoids JavaScript complexity and leverages CSS media queries for performance.

**Semantic HTML for accessibility:** Used actual `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements instead of div-based table simulation. This provides better screen reader support and maintains HTML semantics.

**Status badge consistency:** Reused exact badge color patterns from ToolPicker.tsx for visual consistency (bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200, etc.).

**Navigation pattern:** QuickStartCTA uses optional props (variant, size, className) to be reusable in different contexts (hero CTA vs inline CTAs). Currently used in HeroSection with size="lg".

**Theme toggle:** Replicated theme toggle pattern from Home.tsx in Landing top bar for consistent UX. Users can switch themes on landing page before entering demo.

## Technical Decisions

1. **Why native HTML table instead of shadcn Table component?**
   - shadcn Table component not installed in project
   - Native HTML table with Tailwind classes is semantically correct
   - Better accessibility with proper table elements (th, thead, tbody)
   - No additional dependency or bundle size

2. **Why QuickStartCTA as separate component instead of inline in HeroSection?**
   - Reusability: Can be used in multiple locations (hero, footer, inline CTAs)
   - Encapsulation: Handles "find first available tool" logic in one place
   - Flexibility: Accepts variant/size props to adapt to different contexts
   - Future-proof: Can easily add analytics tracking or A/B testing logic

3. **Why smooth scroll to comparison grid instead of anchor jump?**
   - Better UX: Smooth scrolling helps users maintain spatial context
   - Visual continuity: User sees content flowing instead of jarring jump
   - Modern web standard: Smooth scroll is expected behavior in contemporary sites

## Success Criteria Met

- [x] Landing page at / displays all 8 tools in comparison grid with name, type, language, status
- [x] Hero section contains mission statement about formal verification for AI-generated code
- [x] Quick-start CTA navigates to /demo?tool=cpp-to-c-transpiler&quickstart=true
- [x] Existing demo functionality preserved at /demo
- [x] All client tests pass
- [x] TypeScript compiles without errors

## Performance Impact

**Bundle size:** +~3KB for Landing page components (HeroSection, ToolComparisonGrid, QuickStartCTA). Minimal impact.

**Initial render:** Landing page is simpler than previous Home page at / (no API calls, no SSE connections). Faster initial load.

**Route separation:** /demo route now loads execution components only when user navigates to demo, improving landing page performance.

## Next Steps

Phase 06 Plan 02 will add interactive example projects and quick-start flow integration to pre-populate demo workspace when user clicks CTAs.

## Self-Check: PASSED

**Created files verified:**
```bash
[ -f "packages/client/src/pages/Landing.tsx" ] && echo "FOUND: Landing.tsx"
[ -f "packages/client/src/features/landing/HeroSection.tsx" ] && echo "FOUND: HeroSection.tsx"
[ -f "packages/client/src/features/landing/ToolComparisonGrid.tsx" ] && echo "FOUND: ToolComparisonGrid.tsx"
[ -f "packages/client/src/features/landing/QuickStartCTA.tsx" ] && echo "FOUND: QuickStartCTA.tsx"
```
All files exist ✓

**Commits verified:**
```bash
git log --oneline | grep -E "(7458adf|1a8fcc7)"
```
- 7458adf: Task 1 (create landing page components) ✓
- 1a8fcc7: Task 2 (update routing and Home page) ✓

All commits exist ✓
