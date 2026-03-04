# Safe Arithmetic

Integer arithmetic functions with overflow and division-by-zero safety contracts. The verifier checks that all operations stay within bounds and never produce undefined behaviour.

One function contains a deliberate overflow path that the SMT solver flags, demonstrating how formal verification finds arithmetic bugs before they reach production.
