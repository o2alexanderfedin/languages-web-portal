# Bank Account Invariant

A bank account class with a class invariant — the balance must always be non-negative. One method contains an intentional contract violation that the SMT solver will detect and report as failed.

This example shows how formal verification catches bugs that tests might miss: a Withdraw method with a postcondition stronger than the invariant allows.
