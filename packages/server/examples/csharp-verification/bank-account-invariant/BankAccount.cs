using System;
using CsFv.Contracts;

/// <summary>
/// Bank account operations as pure functions — demonstrates formal verification
/// with [Requires] and [Ensures] contracts verified by CVC5/Z3.
///
/// Key demo behavior:
///   - Deposit, Withdraw, Transfer — all PASS (contracts are correct)
///   - WithdrawBuggy — INTENTIONALLY FAILS: claims result > 0
///     but amount == balance gives result == 0, violating "result > 0"
/// </summary>
public static class BankAccount
{
    /// <summary>Deposit: balance increases by amount. Requires amount positive.</summary>
    [Requires("balance >= 0")]
    [Requires("amount > 0")]
    [Ensures("result == balance + amount")]
    public static int Deposit(int balance, int amount) => balance + amount;

    /// <summary>Withdraw: balance decreases. Requires sufficient funds.</summary>
    [Requires("balance >= 0")]
    [Requires("amount > 0")]
    [Requires("amount <= balance")]
    [Ensures("result >= 0")]
    public static int Withdraw(int balance, int amount) => balance - amount;

    /// <summary>
    /// INTENTIONAL BUG for demo: claims result > 0 after withdrawal.
    /// Counterexample: balance=100, amount=100 → result=0, violates "result > 0".
    /// cs-fv will report this method as FAILED.
    /// </summary>
    [Requires("balance >= 0")]
    [Requires("amount > 0")]
    [Requires("amount <= balance")]
    [Ensures("result > 0")]
    public static int WithdrawBuggy(int balance, int amount) => balance - amount;

    /// <summary>Safe divide with precondition.</summary>
    [Requires("divisor != 0")]
    [Ensures("result * divisor <= dividend")]
    public static int SafeDivide(int dividend, int divisor) => dividend / divisor;
}
