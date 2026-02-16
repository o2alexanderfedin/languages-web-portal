// Demonstrates Java records with compact constructor validation
// Java FV infers SMT constraints from runtime checks

public record Account(String owner, int balance) {
    // Compact constructor with invariants
    public Account {
        // Verification checks: owner must be non-null
        if (owner == null) {
            throw new IllegalArgumentException("Owner cannot be null");
        }
        // Verification checks: balance must be non-negative
        if (balance < 0) {
            throw new IllegalArgumentException("Balance cannot be negative");
        }
    }

    // Deposit returns new Account (immutable pattern)
    // Java FV verifies: amount > 0 and resulting balance >= 0
    public Account deposit(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
        return new Account(owner, balance + amount);
    }

    // Withdraw returns new Account
    // Java FV verifies: amount > 0, amount <= balance, resulting balance >= 0
    public Account withdraw(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be positive");
        }
        if (amount > balance) {
            throw new IllegalArgumentException("Insufficient funds");
        }
        return new Account(owner, balance - amount);
    }

    // Query method - no state change
    public boolean canWithdraw(int amount) {
        return amount > 0 && amount <= balance;
    }
}
