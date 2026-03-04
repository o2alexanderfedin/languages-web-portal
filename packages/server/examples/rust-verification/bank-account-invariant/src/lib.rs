/// Bank account with balance invariant: balance >= 0 after every operation.

pub struct BankAccount {
    balance: i64,
}

impl BankAccount {
    /// Creates a new account. Requires initial_balance >= 0.
    pub fn new(initial_balance: i64) -> Self {
        assert!(initial_balance >= 0, "initial balance must be non-negative");
        BankAccount { balance: initial_balance }
    }

    pub fn balance(&self) -> i64 {
        self.balance
    }

    /// Deposit: balance increases by amount. Requires amount > 0.
    /// Postcondition: self.balance == old(self.balance) + amount
    pub fn deposit(&mut self, amount: i64) {
        assert!(amount > 0, "deposit amount must be positive");
        self.balance += amount;
    }

    /// Withdraw: balance decreases by amount. Requires amount > 0 && amount <= balance.
    /// Postcondition: self.balance == old(self.balance) - amount && self.balance >= 0
    pub fn withdraw(&mut self, amount: i64) {
        assert!(amount > 0, "withdrawal amount must be positive");
        assert!(amount <= self.balance, "insufficient funds");
        self.balance -= amount;
    }

    /// Intentional bug: missing guard — allows balance to go negative.
    /// The verifier will detect the violated postcondition: self.balance >= 0
    pub fn withdraw_buggy(&mut self, amount: i64) {
        self.balance -= amount;
    }

    /// Safe division of balance by divisor.
    /// Postcondition: divisor != 0 ==> result == self.balance / divisor
    pub fn balance_share(&self, divisor: i64) -> i64 {
        assert!(divisor != 0, "divisor must not be zero");
        self.balance / divisor
    }
}
