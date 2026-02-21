using CsFv.Contracts;

/// <summary>
/// Bank account with a class invariant: balance is always non-negative.
/// Demonstrates intentional contract violation — cs-fv should report FAILED
/// for Withdraw because the Ensures postcondition is provably wrong.
/// </summary>
[ClassInvariant("balance >= 0")]
public class BankAccount(decimal initialBalance)  // Primary constructor (C# 12)
{
    [Ghost]
    private decimal balance = initialBalance;

    [Pure]
    [Ensures("result == balance")]
    public decimal GetBalance() => balance;

    [Requires("amount > 0")]
    [Modifies("balance")]
    [Ensures("balance == old(balance) + amount")]
    public void Deposit(decimal amount)
    {
        balance += amount;
    }

    // INTENTIONAL INVARIANT VIOLATION:
    // The postcondition claims balance > 0 after withdrawal.
    // But if amount == balance, then balance becomes exactly 0.
    // The SMT solver will find this counterexample:
    //   balance = 100, amount = 100 → balance = 0, violates Ensures("balance > 0")
    // cs-fv will output: ❌ Withdraw: Failed
    [Requires("amount > 0")]
    [Requires("amount <= balance")]
    [Modifies("balance")]
    [Ensures("balance > 0")]  // BUG: should be "balance >= 0" — intentional violation for demo
    public void Withdraw(decimal amount)
    {
        balance -= amount;
    }
}
