# Bank Account Invariant

A bank account struct with balance invariants — the balance must always remain non-negative after every operation. One method contains an intentional contract violation that the SMT solver will detect and report as failed.

This example shows how formal verification catches bugs that tests might miss: a `withdraw_buggy` method that can produce a negative balance despite the invariant.
