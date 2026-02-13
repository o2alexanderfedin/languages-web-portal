# Phase 6: Landing Page & Examples - Research

**Researched:** 2026-02-12
**Domain:** React landing pages, shareable links, marketing copy
**Confidence:** HIGH

## Summary

Phase 6 creates a compelling landing page showcasing all 8 tools (2 available, 3 in-development, 3 coming-soon) with a tool comparison grid, mission statement about formal verification for AI-generated code, shareable demo links, and one-click quick-start flow.

The current stack (React 18.3 + Vite, React Router v7, Tailwind v4, shadcn/ui, RTK Query) already provides all necessary primitives. No new major dependencies required—React Router's `useSearchParams` handles shareable links, shadcn/ui provides table/badge/card components, and existing tool data structure supports everything needed.

**Primary recommendation:** Build a single-page landing experience using shadcn/ui components (hero, comparison table, CTAs), implement shareable links via React Router's `useSearchParams` for tool selection and configuration, use navigator.clipboard API for copy-to-clipboard, and craft marketing narrative around "vericoding" (verified code generation) positioning for autonomous AI development context.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router | v7.1.1 | URL state management via `useSearchParams` | Already in use; handles shareable links natively |
| shadcn/ui | Latest | UI components (Table, Badge, Card, Button) | Already in use; provides accessible landing page components |
| Tailwind CSS | v4.0.0 | Responsive grid layouts, mobile-first design | Already in use; handles responsive comparison grids |
| Navigator Clipboard API | Browser native | Copy-to-clipboard for shareable links | Modern standard; no library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-helmet-async | ^2.x | SEO meta tags for landing page | If SEO optimization needed (recommended for landing pages) |
| clsx | ^2.1.1 | Conditional CSS classes | Already in use; helpful for dynamic badge/card styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-helmet-async | Next.js SSR | Next.js provides built-in meta tag management but requires full migration |
| URLSearchParams | nuqs library | nuqs adds type-safety and throttling but adds dependency; use if hitting browser rate limits |
| Custom comparison table | @tanstack/react-table | TanStack Table is overkill for static comparison; use only if adding sorting/filtering |

**Installation:**
```bash
# Only if adding SEO meta tags (recommended)
npm install react-helmet-async
```

## Architecture Patterns

### Recommended Project Structure
```
packages/client/src/
├── pages/
│   ├── Home.tsx              # Existing execution flow page
│   └── Landing.tsx            # NEW: Landing/marketing page
├── features/
│   ├── landing/
│   │   ├── HeroSection.tsx         # Hero with mission statement
│   │   ├── ToolComparisonGrid.tsx  # 8-tool comparison table
│   │   ├── QuickStartCTA.tsx       # One-click demo flow
│   │   └── ShareableLink.tsx       # Copy-to-clipboard shareable link
│   ├── execution/              # Existing
│   └── ...
└── App.tsx                     # Add route for Landing page
```

### Pattern 1: URL State for Shareable Links
**What:** Store tool selection and configuration in URL query parameters, enabling shareable links like `/demo?tool=cpp-to-c-transpiler&example=hello-world`

**When to use:** When users need to share specific tool configurations

**Example:**
```typescript
// Source: React Router v7 docs + LogRocket useSearchParams guide
import { useSearchParams, useNavigate } from 'react-router';

function ShareableLink() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read state from URL
  const selectedTool = searchParams.get('tool');
  const selectedExample = searchParams.get('example');

  // Update URL state (creates shareable link)
  const selectTool = (toolId: string, exampleId?: string) => {
    const params = new URLSearchParams();
    params.set('tool', toolId);
    if (exampleId) params.set('example', exampleId);
    setSearchParams(params);
  };

  // Generate shareable link
  const shareableUrl = `${window.location.origin}/demo?${searchParams.toString()}`;

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareableUrl);
    }
  };

  return (
    <div>
      <button onClick={copyToClipboard}>Copy Shareable Link</button>
      <a href={shareableUrl}>{shareableUrl}</a>
    </div>
  );
}
```

### Pattern 2: Responsive Comparison Grid
**What:** Display 8 tools in responsive grid that adapts from table to stacked cards on mobile

**When to use:** Showing tool comparison with multiple attributes (language, type, status, capabilities)

**Example:**
```typescript
// Source: shadcn/ui Table + Tailwind responsive patterns
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TOOLS } from '@repo/shared';

function ToolComparisonGrid() {
  const getStatusVariant = (status: ToolStatus) => {
    switch (status) {
      case 'available': return 'default';
      case 'in-development': return 'secondary';
      case 'coming-soon': return 'outline';
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tool</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TOOLS.map((tool) => (
            <TableRow key={tool.id}>
              <TableCell className="font-medium">{tool.name}</TableCell>
              <TableCell className="capitalize">{tool.category}</TableCell>
              <TableCell>
                {tool.targetLanguage
                  ? `${tool.sourceLanguage} → ${tool.targetLanguage}`
                  : tool.sourceLanguage}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(tool.status)}>
                  {tool.status.replace('-', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  disabled={tool.status === 'coming-soon'}
                  onClick={() => navigate(`/demo?tool=${tool.id}`)}
                >
                  Try Now
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Pattern 3: One-Click Quick Start
**What:** Pre-configure tool selection and navigate directly to demo with minimal friction

**When to use:** Landing page CTA to reduce time-to-demo (1-6 steps optimal per research)

**Example:**
```typescript
// Source: Interactive demo best practices (Navattic, Storylane)
import { useNavigate } from 'react-router';

function QuickStartCTA() {
  const navigate = useNavigate();

  // Pre-select first available tool
  const firstAvailableTool = TOOLS.find(t => t.status === 'available');

  const startQuickDemo = () => {
    // Navigate directly to demo with tool pre-selected
    navigate(`/demo?tool=${firstAvailableTool.id}&quickstart=true`);
  };

  return (
    <Button size="lg" onClick={startQuickDemo}>
      Try C++ to C Transpiler Now
    </Button>
  );
}
```

### Pattern 4: Hero Section with Mission Statement
**What:** Hero section with headline, sub-headline, visual, and CTA following 2026 landing page patterns

**When to use:** Top of landing page to communicate value proposition immediately

**Example:**
```typescript
// Source: shadcn landing page templates, Launch UI patterns
function HeroSection() {
  return (
    <section className="container mx-auto px-6 py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        Formal Verification for AI-Generated Code
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Verify AI-generated code with mathematical precision.
        Transform probabilistic outputs into provably correct software
        for autonomous development workflows.
      </p>
      <div className="flex gap-4 justify-center">
        <QuickStartCTA />
        <Button variant="outline" size="lg" onClick={() => scrollTo('#comparison')}>
          Explore Tools
        </Button>
      </div>
    </section>
  );
}
```

### Anti-Patterns to Avoid
- **Don't add navigation menu on landing page:** Research shows nav menus distract from primary CTA and reduce conversions
- **Don't bury critical info below fold:** Most visitors won't scroll unless already interested
- **Don't use array indices as React keys:** Use stable unique IDs (tool.id) for tool lists
- **Don't update URL on every keystroke:** Browser rate limiting causes performance issues; debounce or use nuqs
- **Don't store sensitive data in URLs:** URLs are logged everywhere (browser history, server logs, analytics)
- **Don't ask for too much info too soon:** Keep quick-start truly quick (1-6 steps optimal)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state management | Custom query param parser/serializer | React Router `useSearchParams` | Handles encoding/decoding, integrates with browser history, standard API |
| Copy-to-clipboard | Custom clipboard manipulation | `navigator.clipboard.writeText()` | Modern browser API, handles permissions, works on HTTPS/localhost |
| Responsive table → cards | Custom breakpoint logic | CSS Grid + Tailwind utilities | Declarative, accessible, leverages container queries in 2026 |
| Meta tags for SEO | Manual DOM manipulation | react-helmet-async | Handles SSR, updates on route change, supports Open Graph/Twitter Cards |
| Type-safe URL params | Manual string→type conversion | nuqs library (if needed) | Handles type conversion, throttling, browser rate limits |
| Status badges | Custom badge component | shadcn/ui Badge | Accessible, themeable, variant system built-in |

**Key insight:** Landing pages require polish but not custom infrastructure. Use existing primitives (React Router, shadcn/ui, Tailwind) to avoid reinventing URL state management, responsive grids, or accessibility patterns.

## Common Pitfalls

### Pitfall 1: URL State Causing Re-render Storms
**What goes wrong:** Updating URL parameters too frequently (e.g., on every keystroke) causes browser rate limiting and performance degradation

**Why it happens:** `setSearchParams` triggers re-renders and browser history updates; browsers throttle for security

**How to avoid:**
- Debounce URL updates for user input
- Use local state for ephemeral UI state (typing), URL for shareable state (final selection)
- If hitting limits, add nuqs library which handles browser throttling automatically

**Warning signs:** Page stuttering when interacting with controls, browser console warnings about history manipulation

### Pitfall 2: Non-Responsive Comparison Table on Mobile
**What goes wrong:** Wide comparison tables with 5+ columns become unusable on mobile (horizontal scroll, tiny text)

**Why it happens:** Tables don't naturally reflow; default responsive approach is horizontal scroll

**How to avoid:**
- Use Tailwind's responsive utilities to hide less critical columns on mobile
- Transform to stacked cards on small screens using CSS Grid
- Keep mobile-first: design for 4 columns on mobile, expand on desktop

**Warning signs:** Horizontal scroll bar on mobile, text smaller than 14px, users pinching to zoom

### Pitfall 3: Shareable Links Breaking on Page Refresh
**What goes wrong:** User shares link with `?tool=cpp-to-c`, recipient gets blank page or wrong tool selected

**Why it happens:** Component doesn't read URL params on mount, only tracks local state

**How to avoid:**
- Read `useSearchParams` immediately on component mount
- Sync URL params to local state (but URL is source of truth)
- Test shareable links in incognito mode (fresh session)

**Warning signs:** Links work when created but not when shared, state resets on refresh

### Pitfall 4: Missing Accessibility for Comparison Grid
**What goes wrong:** Screen readers can't navigate tool comparison, keyboard users can't tab through tools

**Why it happens:** Custom grid implementations skip semantic HTML, interactive elements not keyboard-accessible

**How to avoid:**
- Use shadcn/ui Table component (semantic `<table>`, `<th>`, `<td>`)
- Ensure "Try Now" buttons are focusable and have visible focus states
- Add ARIA labels for status badges: `aria-label="Status: Available"`

**Warning signs:** Can't tab to "Try Now" buttons, screen reader announces "table" but not column headers

### Pitfall 5: Generic Marketing Copy That Doesn't Differentiate
**What goes wrong:** Landing page uses vague language like "powerful tools" and "modern solutions" without explaining unique value

**Why it happens:** Lack of domain research; copying generic SaaS landing page templates

**How to avoid:**
- Use specific terminology: "vericoding" (verified code generation), "formal verification", "provably correct"
- Cite the problem: 96% of developers don't trust AI-generated code (research-backed)
- Position in context: autonomous software development, AI agent workflows
- Show concrete value: skip human review with mathematical precision

**Warning signs:** Could swap company name and apply to any product, no mention of formal verification or AI code generation

### Pitfall 6: Copy-to-Clipboard Failing Silently
**What goes wrong:** "Copy Link" button doesn't work on HTTP, shows no error, user assumes link copied

**Why it happens:** Clipboard API requires secure context (HTTPS/localhost), falls back to deprecated execCommand which may also fail

**How to avoid:**
- Check `navigator.clipboard` availability before attempting copy
- Show error state if clipboard unavailable: "Copy failed - please use HTTPS"
- Provide fallback: pre-select URL in readonly input for manual copy
- Add visual confirmation: "✓ Copied!" toast notification

**Warning signs:** Button does nothing, no user feedback, works on localhost but not production

## Code Examples

Verified patterns from official sources:

### Reading URL State on Mount
```typescript
// Source: React Router docs - useSearchParams
function DemoPage() {
  const [searchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Sync URL params to local state on mount
  useEffect(() => {
    const toolFromUrl = searchParams.get('tool');
    if (toolFromUrl) {
      setSelectedTool(toolFromUrl);
    }
  }, [searchParams]);

  return <div>Selected tool: {selectedTool}</div>;
}
```

### Copy to Clipboard with Fallback
```typescript
// Source: MDN Clipboard API + LogRocket React clipboard guide
async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API (HTTPS/localhost only)
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard API failed:', error);
      return false;
    }
  }

  // Fallback for older browsers or HTTP
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('execCommand fallback failed:', error);
    return false;
  }
}
```

### Responsive Tool Grid (Table → Cards)
```typescript
// Source: Tailwind CSS v4 responsive patterns + shadcn/ui
function ToolGrid() {
  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table>
          {/* Full comparison table */}
        </Table>
      </div>

      {/* Mobile: Stacked Cards */}
      <div className="md:hidden space-y-4">
        {TOOLS.map((tool) => (
          <div key={tool.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{tool.name}</h3>
              <Badge variant={getStatusVariant(tool.status)}>
                {tool.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {tool.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {tool.sourceLanguage} → {tool.targetLanguage}
              </span>
              <Button
                size="sm"
                disabled={tool.status === 'coming-soon'}
              >
                Try Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

### SEO Meta Tags with react-helmet-async
```typescript
// Source: React Helmet documentation + React SEO best practices
import { Helmet } from 'react-helmet-async';

function LandingPage() {
  const title = "Formal Verification for AI-Generated Code | Hapyy Languages";
  const description = "Verify AI-generated code with mathematical precision. Transform probabilistic LLM outputs into provably correct software for autonomous development.";
  const url = "https://languages.hapyy.com";
  const image = `${url}/og-image.png`;

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Open Graph (Facebook, LinkedIn) */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Helmet>

      {/* Landing page content */}
    </>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom URL parsers | `useSearchParams` hook | React Router v6 (2021) | Native browser URLSearchParams API, no manual encoding |
| `document.execCommand('copy')` | `navigator.clipboard` API | ~2020 (widespread support) | Async, permission-aware, secure context required |
| Viewport-based responsive | Container queries | 2023 (CSS Container Queries) | Components respond to container, not viewport |
| react-helmet | react-helmet-async | 2020 | SSR-safe, Suspense-compatible |
| Generic landing pages | Domain-specific positioning | 2025-2026 | "Vericoding" terminology, AI code verification narrative |
| Manual viewport breakpoints | Tailwind responsive utilities | N/A | Declarative, mobile-first, utility-based |

**Deprecated/outdated:**
- **document.execCommand('copy')**: Deprecated; use navigator.clipboard.writeText() instead
- **Class components for landing pages**: Use functional components with hooks (standard since React 16.8)
- **Separate mobile/desktop sites**: Use responsive design with CSS Grid/Flexbox
- **Custom modal libraries for CTAs**: shadcn/ui Dialog component is standard

## Open Questions

1. **Should landing page be default route?**
   - What we know: Currently `/` shows execution flow (Home.tsx); adding landing page requires routing decision
   - What's unclear: Whether to make landing page default (`/`) and move execution to `/demo`, or keep current `/` and add landing at `/about` or `/features`
   - Recommendation: Make landing page default (`/`), move current Home to `/demo` or `/workspace` - more intuitive for new visitors

2. **How much marketing copy is needed?**
   - What we know: Need mission statement about formal verification for AI-generated code
   - What's unclear: Length (brief paragraph vs. multi-section narrative), depth (technical vs. business-focused), tone (academic vs. startup)
   - Recommendation: Start with brief (2-3 paragraphs) technical positioning using "vericoding" terminology, cite 96% developer skepticism stat, expand if needed

3. **Should we add analytics tracking?**
   - What we know: Landing pages typically track conversions (quick-start clicks, tool selections)
   - What's unclear: Privacy/compliance requirements, which analytics platform (if any)
   - Recommendation: Add event tracking hooks (optional callback props) to CTA components; defer actual analytics integration to user decision

4. **Do we need example projects visible on landing page?**
   - What we know: Backend has exampleService for loading examples per tool
   - What's unclear: Whether to preview examples on landing page or only in demo flow
   - Recommendation: Show count of available examples per tool in comparison grid ("3 examples"), link to demo for full preview

## Sources

### Primary (HIGH confidence)
- [React Router useSearchParams official docs](https://reactrouter.com/api/hooks/useSearchParams)
- [MDN Navigator Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clipboard)
- [shadcn/ui Table component](https://ui.shadcn.com/docs/components/radix/data-table)
- [shadcn/ui Badge component](https://ui.shadcn.com/docs/components/radix/badge)
- [Tailwind CSS v4 responsive design](https://tailwindcss.com)

### Secondary (MEDIUM confidence)
- [React Router Search Params tutorial - Robin Wieruch](https://www.robinwieruch.de/react-router-search-params/)
- [LogRocket: URL state with useSearchParams](https://blog.logrocket.com/url-state-usesearchparams/)
- [LogRocket: Copy to clipboard in React](https://blog.logrocket.com/implementing-copy-clipboard-react-clipboard-api/)
- [Smashing Magazine: Designing Perfect Feature Comparison Table](https://www.smashingmagazine.com/2017/08/designing-perfect-feature-comparison-table/)
- [Martin Kleppmann: AI will make formal verification go mainstream](https://martin.kleppmann.com/2025/12/08/ai-formal-verification.html)
- [MIT Technology Review: Generative Coding (vericoding)](https://www.technologyreview.com/2026/01/12/1130027/generative-coding-ai-software-2026-breakthrough-technology/)

### Tertiary (LOW confidence - verify before using)
- [shadcn landing page templates](https://www.shadcn.io/template/category/landing-page)
- [Launch UI landing page patterns](https://www.launchuicomponents.com/)
- [Interactive demo best practices - Navattic](https://www.navattic.com/blog/interactive-demos)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use except optional react-helmet-async
- Architecture: HIGH - React Router patterns well-documented, shadcn/ui components stable
- Pitfalls: MEDIUM-HIGH - URL state pitfalls verified by multiple sources; landing page pitfalls from general UX research
- Marketing positioning: MEDIUM - "Vericoding" terminology emerging but recent (2025-2026); formal verification for AI code is cutting-edge

**Research date:** 2026-02-12
**Valid until:** 2026-03-31 (45 days - relatively stable domain, though AI code verification narrative evolving rapidly)
