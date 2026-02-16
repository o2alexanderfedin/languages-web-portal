// Demonstrates transaction invariants and balance preservation
// Java FV verifies that transferred amounts maintain total balance

public record Transaction(Account from, Account to, int amount) {
    // Compact constructor validates transaction properties
    public Transaction {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Accounts cannot be null");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }
        if (amount > from.balance()) {
            throw new IllegalArgumentException("Insufficient funds for transfer");
        }
    }

    // Execute transfer and return updated accounts
    // Java FV verifies: totalBefore = totalAfter (balance preservation)
    public static TransferResult transfer(Account from, Account to, int amount) {
        // Java FV can verify: from.balance() + to.balance() is invariant
        int totalBefore = from.balance() + to.balance();

        Account newFrom = from.withdraw(amount);
        Account newTo = to.deposit(amount);

        // Verification checks the total is preserved
        int totalAfter = newFrom.balance() + newTo.balance();
        assert totalBefore == totalAfter : "Balance preservation violated";

        return new TransferResult(newFrom, newTo);
    }

    // Result record for transfer operation
    public record TransferResult(Account from, Account to) {
        public TransferResult {
            if (from == null || to == null) {
                throw new IllegalArgumentException("Accounts cannot be null");
            }
        }
    }
}
