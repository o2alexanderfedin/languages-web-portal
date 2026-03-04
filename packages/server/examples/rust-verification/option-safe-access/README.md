# Option Safe Access

A collection wrapper that models null-safe element access using Rust's `Option<T>` type. The verifier proves that `get` never panics and that `insert` and `remove` maintain the length invariant.

Shows how formal verification of idiomatic Rust `Option` usage eliminates a whole class of runtime panics by proof rather than by testing.
