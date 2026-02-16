# Phase 9: Tool Activation & Examples - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable Java verification tool in the portal (flip from 'in-development' to 'available') and create three example projects users can load and run. Infrastructure (Docker, JDK, wrapper script) is already in place from Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Example Content
- 3 example projects, each with 2-3 Java files (multi-file projects, not single files)
- Write fresh examples designed for the portal demo experience (don't reuse java-fv/examples/)
- Examples range from no ACSL contracts to some contracts — verification infers SMT from code
- Include a mix of pass and fail: at least one example or file that intentionally fails verification
- Failing examples should produce visible failure (non-zero exit code, clear "VERIFICATION FAILED")
- Three themes: Records, Pattern Matching, Sealed Types (per roadmap)

### Tool Description & Badge
- Benefit-focused description: "Prove your Java code is correct — automated formal verification"
- Say "modern Java" without specific version numbers
- High-level description on the card — details on the execution page
- Badge text: just "Available" (no beta, no version)

### Example Loading UX
- Descriptive, domain-themed names (e.g., "Bank Account Records", "Shape Matching", "Payment Types")
- Dropdown shows name + one-line subtitle describing what each example demonstrates
- All files shown immediately when example is loaded (no collapsing)
- Ordered simple to complex in the dropdown

### Verification Output
- Raw CLI output — stream exactly what the Java FV CLI produces, no filtering
- Console output only — no output files in the file tree
- Custom timeout: 120 seconds for Java FV execution

### Claude's Discretion
- Exact domain themes for example names (as long as they're descriptive)
- Specific Java code in examples (as long as it demonstrates the right features)
- Subtitle text for each example in the dropdown
- How to structure multi-file examples internally

</decisions>

<specifics>
## Specific Ideas

- Verification should infer SMT from code rather than relying on explicit ACSL contracts in all examples
- The progression should show that Java FV works even without annotations, then becomes more powerful with them
- Failure case should be clearly visible to users — they should understand what "verification failed" means

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-tool-activation-examples*
*Context gathered: 2026-02-15*
