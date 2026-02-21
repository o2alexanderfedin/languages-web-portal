# Phase 23: E2E Tests - Research

**Researched:** 2026-02-20
**Domain:** Playwright E2E testing for C# FV tool flow (example loading, execution, output, failed-status assertion)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Test file organization:**
- 3 separate spec files with `csharp-` prefix:
  - `csharp-fv-examples.spec.ts` — UI loading verification for all 3 examples
  - `csharp-fv-execution.spec.ts` — End-to-end execution with streaming (all 3 examples run)
  - `csharp-fv-output.spec.ts` — Output file tree + download button verification after successful execution
- Examples spec runs the full 9-project Playwright matrix (3 browsers × 3 viewports)
- Execution and output specs run Chromium desktop only (mirrors Java FV pattern for Docker-dependent tests)
- All 3 files go in `e2e/tests/`

**Example coverage scope:**
- All 3 C# FV examples verified for UI loading in examples spec:
  - `null-safe-repository` (expected: pass)
  - `bank-account-invariant` (expected: fail — known-bad)
  - `calculator-contracts` (expected result: Claude determines from example code)
- All 3 examples executed end-to-end in execution spec — tests assert the correct expected result (pass or fail) per example
- Coverage must include both pass-case and fail-case assertions across the 3 examples

**Streaming & output assertions:**
- Console streaming: Claude decides appropriate assertions by inspecting actual cs-fv output format (avoid hard-coding strings that could change)
- Output file tree: assert non-empty after successful execution — no specific file name assertions
- Output spec also asserts download button is visible after successful execution

**Failed-status test design:**
- For `bank-account-invariant` (known-bad), assert:
  1. Portal status badge shows `failed`
  2. Streaming console contains error/diagnostic content (Roslyn error text)
  3. Output file tree is empty or not visible (no output when execution fails)
- Invalid input error testing (no .csproj zip): Claude checks `execution-errors.spec.ts` — if not already covered for C# FV, add it; otherwise skip

### Claude's Discretion
- Specific console assertion strings/regexes for C# FV output (inspect actual tool output)
- Whether `calculator-contracts` should assert pass or fail (read the example code)
- Whether the wrapper error case (no .csproj) is already covered in execution-errors.spec.ts
- Loading skeleton and timeout values (follow Java FV execution test patterns)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| E2E-01 | E2E tests cover C# tool selection and example loading in ExampleSelector UI | Examples spec (csharp-fv-examples.spec.ts) — navigate with `tool=csharp-verification`, use `ExecutionPage.loadExample()`, assert `executeButton` enabled |
| E2E-02 | E2E tests cover C# FV execution with Docker streaming and progress display | Execution spec (csharp-fv-execution.spec.ts) — `exec.execute()`, `waitForExecutionComplete()`, assert console non-empty, status badge COMPLETED/FAILED |
| E2E-03 | E2E tests cover C# FV output file tree and results display | Output spec (csharp-fv-output.spec.ts) — `OutputPage.treeItems`, `downloadButton` — only visible when `status === 'completed'` |
| E2E-04 | E2E test covers the known-bad example (verifies tool correctly surfaces FV violations) | `bank-account-invariant` execution — assert FAILED status badge (red CSS), console contains Roslyn diagnostic text, output section hidden |
</phase_requirements>

## Summary

Phase 23 adds three Playwright E2E spec files for the C# FV user flow. The project already has a mature E2E testing infrastructure with Page Object Models (`ExecutionPage`, `OutputPage`, `DemoPage`), established serial/timeout patterns for Docker-dependent tests, and 9-project Playwright matrix configuration. The new specs mirror the Java FV test patterns precisely — same POM classes, same timeout (180s), same `isMobile` skip guard for Docker-dependent specs.

The key new information is the status badge behavior: the UI renders `executionResult.status.toUpperCase()` with red CSS (`bg-red-100 text-red-800`) for `'failed'` status. Critically, the **Output Files section only renders when `status === 'completed'`** (line 274 of ExecutionPanel.tsx), so for `bank-account-invariant` the output panel will be absent — not empty. The existing `ExecutionPage.statusBadge` locator only matches COMPLETED (green); C# FV tests need a new FAILED badge locator or need to assert via the red CSS class.

Calculator.cs has provably correct contracts: `Ensures("result >= int.MinValue && result <= int.MaxValue")` is trivially satisfiable for int return, `Increment` has correct `result > x`, and `SafeDivide` has `result * divisor <= dividend`. All should pass. NullSafeRepository.cs also has satisfiable contracts. Both should produce `status: completed`. Only `bank-account-invariant` should produce `status: failed` (Withdraw's `Ensures("balance > 0")` fails when `amount == balance`).

**Primary recommendation:** Extend `ExecutionPage` with a `failedStatusBadge` locator targeting the red badge, and add a `waitForExecutionComplete(timeout)` overload that also catches exit-code patterns from the C# wrapper. Reuse all existing POM methods unchanged — only add C# FV-specific helpers if needed.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | (existing in project) | Test runner, assertions, browser automation | Already installed, all existing specs use it |
| TypeScript | (existing in project) | Type-safe spec files | Project-wide TypeScript, tsconfig in e2e/ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ExecutionPage (POM) | local | All execution-panel interactions | Already covers `loadExample`, `execute`, `waitForExecutionComplete`, `getConsoleText`, `statusBadge` |
| OutputPage (POM) | local | Output panel, tree items, download button | `treeItems`, `downloadButton`, `emptyStateMessage` |
| DemoPage (POM) | local | Generic demo interactions | Use for `selectExample` + description tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending ExecutionPage | New CSharpExecutionPage | CONTEXT.md says "likely reuse ExecutionPage with tool parameter" — adding a `failedStatusBadge` property to ExecutionPage is simpler and avoids duplication |

**Installation:** No new packages needed — all dependencies already present.

## Architecture Patterns

### Recommended Project Structure
```
e2e/
├── pages/
│   └── ExecutionPage.ts        # Add failedStatusBadge locator here
├── tests/
│   ├── csharp-fv-examples.spec.ts    # NEW: E2E-01 — 9-matrix, no Docker
│   ├── csharp-fv-execution.spec.ts   # NEW: E2E-02, E2E-04 — Chromium desktop, Docker, serial
│   └── csharp-fv-output.spec.ts      # NEW: E2E-03 — Chromium desktop, Docker, serial
```

### Pattern 1: C# Tool Navigation
**What:** Navigate to demo with C# FV pre-selected, identical to Java FV pattern.
**When to use:** All three spec files.
**Example:**
```typescript
// Source: existing e2e/tests/example-loading.spec.ts
const exec = new ExecutionPage(page);
await exec.goto('tool=csharp-verification');  // tool ID from toolRegistry.ts
await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });
```

### Pattern 2: Examples Spec — Full 9-Browser Matrix
**What:** No `isMobile` skip, no Docker, serial mode. Mirrors Java FV `example-loading.spec.ts` exactly but uses `csharp-verification` tool and its 3 example names.
**When to use:** `csharp-fv-examples.spec.ts`
**Example:**
```typescript
// Source: e2e/tests/example-loading.spec.ts (lines 17-71)
test.describe('C# FV Example Loading — All 3 Examples (E2E-01)', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  test.skip(({ isMobile }) => isMobile, 'Example loading tests run on desktop only');

  test('null-safe-repository example loads and enables execute button', async ({ page }) => {
    const exec = new ExecutionPage(page);
    await exec.goto('tool=csharp-verification');
    await exec.exampleSelector.waitFor({ state: 'visible', timeout: 10_000 });
    await exec.loadExample('null-safe-repository');
    await expect(exec.executeButton).toBeEnabled({ timeout: 10_000 });
  });
  // ... bank-account-invariant, calculator-contracts
});
```

### Pattern 3: Execution Spec — COMPLETED Status Assertion
**What:** Load pass-case example, execute, wait for complete, assert COMPLETED badge and console content.
**When to use:** `csharp-fv-execution.spec.ts` for `null-safe-repository` and `calculator-contracts`.
**Example:**
```typescript
// Source: e2e/tests/execution-flow.spec.ts (lines 26-53)
test.setTimeout(180_000);
test.describe.configure({ mode: 'serial' });
test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');

test('null-safe-repository executes and shows COMPLETED status', async ({ page }) => {
  const exec = new ExecutionPage(page);
  await exec.goto('tool=csharp-verification');
  await exec.loadExample('null-safe-repository');
  await exec.execute();
  await exec.waitForExecutionComplete();

  // Assert console contains C# FV verification keywords
  const consoleText = await exec.getConsoleText();
  expect(consoleText).toBeTruthy();
  const hasVerificationContent = /verified|passed|Passed|✓|OK|method/i.test(consoleText);
  expect(hasVerificationContent).toBe(true);

  // Assert COMPLETED status badge visible (green)
  await expect(exec.statusBadge).toBeVisible({ timeout: 5_000 });
});
```

### Pattern 4: Execution Spec — FAILED Status Assertion (E2E-04, the quality gate)
**What:** Load bank-account-invariant, execute, assert FAILED badge (red), console has diagnostic content, output section absent.
**When to use:** `csharp-fv-execution.spec.ts` for the `bank-account-invariant` test.
**Example:**
```typescript
// Source: ExecutionPanel.tsx line 114-121 (status badge CSS) + line 274 (output gate)
test('bank-account-invariant produces FAILED status (E2E-04)', async ({ page }) => {
  const exec = new ExecutionPage(page);
  await exec.goto('tool=csharp-verification');
  await exec.loadExample('bank-account-invariant');
  await exec.execute();
  await exec.waitForExecutionComplete();

  // Assert FAILED status badge visible (red CSS: bg-red-100 text-red-800)
  const failedBadge = page
    .locator('.bg-red-100.text-red-800, .dark\\:bg-red-900')
    .filter({ hasText: /FAILED/i });
  await expect(failedBadge).toBeVisible({ timeout: 5_000 });

  // Assert console contains FV diagnostic content
  const consoleText = await exec.getConsoleText();
  expect(consoleText).toBeTruthy();
  const hasDiagnostic = /failed|Failed|error|Error|Withdraw|violation|❌/i.test(consoleText);
  expect(hasDiagnostic).toBe(true);

  // Assert output files section is NOT visible (only shown for 'completed' status)
  await expect(exec.outputPanel).not.toBeVisible();
});
```

### Pattern 5: Output Spec — File Tree + Download Button
**What:** Run pass-case example, assert output panel visible, tree items present, download button visible.
**When to use:** `csharp-fv-output.spec.ts`
**Example:**
```typescript
// Source: e2e/tests/output-file-tree.spec.ts + output-download.spec.ts
test('null-safe-repository output file tree is non-empty after execution', async ({ page }) => {
  const exec = new ExecutionPage(page);
  const output = new OutputPage(page);

  await exec.goto('tool=csharp-verification');
  await exec.loadExample('null-safe-repository');
  await exec.execute();
  await exec.waitForExecutionComplete();

  // Output section only appears for 'completed' status
  await expect(output.outputPanel).toBeVisible({ timeout: 10_000 });
  const count = await output.treeItems.count();
  expect(count).toBeGreaterThan(0);

  // Download button must be visible after successful execution
  await expect(output.downloadButton).toBeVisible({ timeout: 5_000 });
});
```

### Anti-Patterns to Avoid
- **Hard-coding C# FV output strings:** cs-fv output format may change. Use flexible regex like `/failed|Failed|❌|error/i` rather than exact strings.
- **Creating a new CSharpExecutionPage POM:** Existing `ExecutionPage` covers all needed methods. Add `failedStatusBadge` property to the existing class; don't duplicate.
- **Asserting output panel for failed executions:** ExecutionPanel.tsx line 274 — output files section ONLY renders when `status === 'completed'`. For `bank-account-invariant`, assert `not.toBeVisible()` on `outputPanel`.
- **Using the existing `statusBadge` locator for FAILED:** It matches `.bg-green-100` only. For FAILED, use `.bg-red-100.text-red-800` filtered to `FAILED` text.
- **Skipping the isMobile guard in execution/output specs:** Docker execution tests MUST have `test.skip(({ isMobile }) => isMobile)` — Chromium desktop only.
- **Forgetting tool ID is `csharp-verification` (hyphenated):** URL param is `tool=csharp-verification` per toolRegistry.ts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Example loading flow | Custom navigation + load logic | `ExecutionPage.loadExample(name)` | Already handles selectOption + click + waitFor enabled |
| Console polling | Custom `page.waitForFunction` | `ExecutionPage.waitForExecutionComplete()` | Polls `[data-testid="console-output"]` for `completed\|exit code` — works for C# FV too |
| Console text retrieval | `page.locator(...).textContent()` directly | `ExecutionPage.getConsoleText()` | Encapsulated, null-safe |
| Tree item enumeration | Raw `page.locator('[role="treeitem"]')` | `OutputPage.treeItems` | Pre-configured locator |
| Output panel visibility | Raw `page.getByTestId('output-panel')` | `OutputPage.outputPanel` | Pre-configured locator |

**Key insight:** The existing POM layer covers all needed interactions. The only addition is a `failedStatusBadge` locator in `ExecutionPage` (to complement the existing `statusBadge` which only covers COMPLETED).

## Common Pitfalls

### Pitfall 1: Output Panel Absent for Failed Executions
**What goes wrong:** Test asserts `outputPanel` is visible or tree items exist after `bank-account-invariant` execution — test fails because the panel never renders.
**Why it happens:** `ExecutionPanel.tsx` line 274: `executionResult?.status === 'completed'` gates the entire Output Files section. When status is `'failed'`, the section is not mounted at all.
**How to avoid:** For `bank-account-invariant`, assert `await expect(exec.outputPanel).not.toBeVisible()` — this is the correct assertion and part of E2E-04.
**Warning signs:** `toBeVisible()` timeout on `output-panel` after a known-fail execution.

### Pitfall 2: Wrong Status Badge Locator for FAILED
**What goes wrong:** Using `exec.statusBadge` (which targets `.bg-green-100`) to check for FAILED — returns nothing.
**Why it happens:** `ExecutionPage.statusBadge` was written only for COMPLETED. FAILED uses `bg-red-100 text-red-800`.
**How to avoid:** Add `failedStatusBadge` to `ExecutionPage`:
```typescript
this.failedStatusBadge = page
  .locator('.bg-red-100.text-red-800, .dark\\:bg-red-900')
  .filter({ hasText: /FAILED/i });
```
**Warning signs:** `toBeVisible()` timeout when asserting FAILED badge on `bank-account-invariant`.

### Pitfall 3: `waitForExecutionComplete()` Timeout for Failed Runs
**What goes wrong:** `waitForExecutionComplete()` polls for `/completed|exit code/i` in console — if C# FV wrapper outputs differently for failures, the poll never resolves.
**Why it happens:** The wrapper exits with non-zero code on failure; the portal SSE sends an `ExitCode` event. The console output includes "exit code" from the portal's completion event.
**How to avoid:** The existing pattern `/completed|exit code/i` should work — the portal appends exit code info to console on all outcomes. If it doesn't, expand the regex to `/completed|exit code|failed|error/i`.
**Warning signs:** Test hangs at `waitForExecutionComplete()` for 3 minutes then times out.

### Pitfall 4: Examples Spec Matrix Coverage Gap
**What goes wrong:** Accidentally adding `test.skip(({ isMobile }) => isMobile)` to `csharp-fv-examples.spec.ts` — tests skip on mobile/tablet browsers.
**Why it happens:** Mistakenly copying the execution spec's skip guard.
**How to avoid:** The examples spec is for UI loading only (no Docker) — it MUST run on all 9 matrix projects. Only add `isMobile` skip to the execution/output specs that require Docker.
**Warning signs:** Matrix shows only 3 results instead of 9 for the examples spec.

### Pitfall 5: Wrong Example Count Assertion
**What goes wrong:** Asserting `optionCount` is 4 (3 examples + 1 placeholder) for C# FV but getting a different number.
**Why it happens:** Copy-paste from Java FV examples spec without updating the tool and count.
**How to avoid:** Verify C# FV has exactly 3 examples (null-safe-repository, bank-account-invariant, calculator-contracts) — confirmed from `examples.test.ts` and `packages/server/examples/csharp-verification/`. Count = 4 options total.
**Warning signs:** `expect(optionCount).toBe(4)` fails with actual count.

### Pitfall 6: execution-errors.spec.ts Already Covers Generic Error Cases
**What goes wrong:** Adding C# FV-specific wrapper error tests (no .csproj) to a new spec — duplicates coverage that may already exist.
**Why it happens:** CONTEXT.md says: "check execution-errors.spec.ts — if not already covered for C# FV, add it; otherwise skip."
**How to avoid:** Review `execution-errors.spec.ts` — it uses `java-verification` with route interception (HTTP 500, abort, timeout). The wrapper validation error (no .csproj) would require running `tool=csharp-verification` and uploading a zip without a `.csproj`. The existing spec does NOT cover C# FV no-.csproj case, but the test uses route interception not real Docker — so a new test with `tool=csharp-verification` and a bare zip file would be needed. Given CONTEXT.md says "if not already covered... add it", this IS new coverage. The planner should include this as a LOW-priority add to `execution-errors.spec.ts`.
**Warning signs:** N/A — this is a coverage decision, not a failure mode.

## Code Examples

Verified patterns from official sources:

### Adding failedStatusBadge to ExecutionPage
```typescript
// Source: e2e/pages/ExecutionPage.ts + ExecutionPanel.tsx line 118-119
// Add to constructor:
this.failedStatusBadge = page
  .locator('.bg-red-100.text-red-800, .dark\\:bg-red-900')
  .filter({ hasText: /FAILED/i });
```

### Asserting COMPLETED status (pass-case examples)
```typescript
// Source: e2e/tests/execution-flow.spec.ts lines 51-53
await expect(exec.statusBadge).toBeVisible({ timeout: 5_000 });
```

### Asserting FAILED status (bank-account-invariant)
```typescript
// Source: ExecutionPanel.tsx line 114-121
await expect(exec.failedStatusBadge).toBeVisible({ timeout: 5_000 });
// OR inline if not added to POM:
const failedBadge = page
  .locator('.bg-red-100.text-red-800, .dark\\:bg-red-900')
  .filter({ hasText: /FAILED/i });
await expect(failedBadge).toBeVisible({ timeout: 5_000 });
```

### Asserting output panel absent for failed execution
```typescript
// Source: ExecutionPanel.tsx line 274 — output section gated on status === 'completed'
await expect(exec.outputPanel).not.toBeVisible();
```

### C# FV console keyword assertion (flexible regex)
```typescript
// Based on wrapper output format (dotnet cs-fv.dll verify <file>)
// cs-fv produces per-method pass/fail output
const consoleText = await exec.getConsoleText();
expect(consoleText).toBeTruthy();

// For pass-case (null-safe-repository, calculator-contracts):
const hasPassContent = /verified|passed|Passed|✓|method|OK/i.test(consoleText);
expect(hasPassContent).toBe(true);

// For fail-case (bank-account-invariant):
const hasFailContent = /failed|Failed|❌|error|Error|Withdraw|violation/i.test(consoleText);
expect(hasFailContent).toBe(true);
```

### Full describe block template for execution spec
```typescript
// Source: e2e/tests/execution-flow.spec.ts lines 14-20
test.describe('C# FV Execution Flow (E2E-02, E2E-04)', () => {
  test.setTimeout(180_000);
  test.describe.configure({ mode: 'serial' });
  test.skip(({ isMobile }) => isMobile, 'Execution tests run on desktop only');
  // ... tests
});
```

### Tool URL parameter
```typescript
// Source: packages/server/src/config/toolRegistry.ts line 22
// Tool ID is 'csharp-verification'
await exec.goto('tool=csharp-verification');
```

### Example names (confirmed from packages/server/examples/csharp-verification/)
```
null-safe-repository       → expects: COMPLETED (all contracts satisfiable)
bank-account-invariant     → expects: FAILED (Withdraw Ensures("balance > 0") violated when amount==balance)
calculator-contracts       → expects: COMPLETED (all contracts trivially satisfiable)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom waitForFunction polling | `ExecutionPage.waitForExecutionComplete()` | Phase 7 E2E | Use existing helper, don't inline |
| Per-tool Page Objects | Shared `ExecutionPage` with tool parameter | Phase 10 E2E | Reuse `ExecutionPage` for C# FV, extend if needed |
| Route interception for all tests | Real Docker for execution tests, interception for error tests | Phase 19-01 | Docker-dependent tests use `E2E_BASE_URL` guard |

**Deprecated/outdated:**
- Archive specs (e2e/archive/): Legacy Java FV specs retired via `git mv` to archive — do NOT copy patterns from these files.
- `DemoPage.waitForExecutionComplete()` uses 30s timeout — use `ExecutionPage.waitForExecutionComplete()` with 180s default.

## Open Questions

1. **C# FV exact console output format**
   - What we know: The wrapper calls `dotnet cs-fv.dll verify <cs-file>` per file; bank-account-invariant Withdraw violation is known; the `.cs-fv/self-test.json` shows cs-fv is locally unavailable (Z3/CVC5 "unavailable" locally)
   - What's unclear: Exact output strings from cs-fv when run in Docker (the portal is tested against the Docker container via E2E_BASE_URL). We know it produces "Withdraw: Failed" style output based on BankAccount.cs comment: "cs-fv will output: ❌ Withdraw: Failed"
   - Recommendation: Use flexible regex (`/failed|Failed|❌|Withdraw/i`) rather than exact strings. The console assertion strings are Claude's discretion per CONTEXT.md.

2. **Whether `waitForExecutionComplete()` terminates for FAILED runs**
   - What we know: The poll checks for `/completed|exit code/i` — the portal SSE `complete` event sends the exit code; "exit code" appears in the console for all terminal states
   - What's unclear: Whether the C# FV portal SSE includes "exit code" text in the console stream or only in the metadata
   - Recommendation: Test against Docker container first. If the poll hangs, expand the regex. The pattern works for Java FV (payment-types also fails and the existing test completes).

3. **execution-errors.spec.ts: Add C# FV no-.csproj test?**
   - What we know: The existing spec covers Java FV with route interception only; the wrapper exits 2 for no-.csproj. CONTEXT.md says to check and add if not covered.
   - What's unclear: Whether planner should add it to csharp-fv-execution.spec.ts or execution-errors.spec.ts
   - Recommendation: Add to `execution-errors.spec.ts` as a new `describe` block for C# FV error scenarios. It uses route interception (no Docker needed) — upload a zip without `.csproj`, execute, assert error message visible.

## Sources

### Primary (HIGH confidence)
- `e2e/pages/ExecutionPage.ts` — All POM locators and methods verified by direct read
- `e2e/pages/OutputPage.ts` — POM for output assertions verified by direct read
- `packages/client/src/features/execution/ExecutionPanel.tsx` — Status badge CSS classes and output-section gate condition verified (lines 113-121, 274)
- `e2e/tests/execution-flow.spec.ts` — Java FV execution spec — mirror pattern for C# FV execution spec
- `e2e/tests/example-loading.spec.ts` — Java FV examples spec — mirror pattern for C# FV examples spec
- `e2e/tests/output-file-tree.spec.ts` + `output-download.spec.ts` — Output spec patterns
- `e2e/tests/execution-errors.spec.ts` — Error scenario patterns
- `playwright.config.ts` — 9 Playwright projects (3 browsers × 3 viewports), `E2E_BASE_URL` guard
- `packages/server/src/config/toolRegistry.ts` — Tool ID `csharp-verification`, `maxExecutionTimeMs: 180000`
- `packages/server/examples/csharp-verification/bank-account-invariant/BankAccount.cs` — Confirmed intentional violation on Withdraw
- `packages/server/examples/csharp-verification/calculator-contracts/Calculator.cs` — Confirmed all contracts satisfiable
- `packages/server/examples/csharp-verification/null-safe-repository/NullSafeRepository.cs` — Confirmed all contracts satisfiable
- `scripts/hupyy-csharp-verify.sh` — Wrapper output: per-file `dotnet cs-fv.dll verify`, exit 2 for no-.csproj, OVERALL_EXIT from loop

### Secondary (MEDIUM confidence)
- `.cs-fv/self-test.json` — Z3/CVC5 unavailable locally; tests rely on Docker container which has both solvers
- `packages/server/src/__tests__/examples.test.ts` — Confirms 3 C# FV example names (null-safe-repository, bank-account-invariant, calculator-contracts)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing packages, no new dependencies
- Architecture: HIGH — patterns directly confirmed from existing spec files and POM source
- Pitfalls: HIGH — derived from source code analysis (ExecutionPanel.tsx gate condition, CSS class mapping, POM limitations)
- Console assertion strings: MEDIUM — based on BankAccount.cs comments + cs-fv behavior knowledge; exact strings need validation against running Docker container

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable pattern; valid until portal UI or cs-fv output format changes)
