/// Bank account with balance invariant: balance >= 0 after every operation.

pub struct BankAccount {
    balance: i64,
}

impl BankAccount {
    /// Creates a new account. Requires initial_balance >= 0.
    #[doc = "rust_fv::requires::initial_balance >= 0"]
    #[doc = "rust_fv::ensures::result.balance >= 0"]
    pub fn new(initial_balance: i64) -> Self {
        assert!(initial_balance >= 0, "initial balance must be non-negative");
        BankAccount { balance: initial_balance }
    }

    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::ensures::result >= 0"]
    pub fn balance(&self) -> i64 {
        self.balance
    }

    /// Deposit: balance increases by amount.
    /// Requires amount > 0.
    /// Postcondition: new balance == old balance + amount
    #[doc = "rust_fv::requires::amount > 0"]
    pub fn deposit(&mut self, amount: i64) {
        assert!(amount > 0, "deposit amount must be positive");
        self.balance += amount;
    }

    /// Withdraw: safe path — requires sufficient funds.
    /// Postcondition: balance decreases by amount, stays >= 0.
    #[doc = "rust_fv::requires::amount > 0"]
    #[doc = "rust_fv::requires::amount <= self.balance"]
    #[doc = "rust_fv::ensures::self.balance >= 0"]
    pub fn withdraw(&mut self, amount: i64) {
        assert!(amount > 0, "withdrawal amount must be positive");
        assert!(amount <= self.balance, "insufficient funds");
        self.balance -= amount;
    }

    /// Intentional bug: missing guard — allows balance to go negative.
    /// The verifier detects the violated postcondition: self.balance >= 0
    #[doc = "rust_fv::requires::amount > 0"]
    #[doc = "rust_fv::ensures::self.balance >= 0"]
    pub fn withdraw_buggy(&mut self, amount: i64) {
        // BUG: no bounds check — balance can go negative
        self.balance -= amount;
    }

    /// Safe division of balance by divisor.
    #[doc = "rust_fv::pure"]
    #[doc = "rust_fv::requires::divisor != 0"]
    #[doc = "rust_fv::ensures::result == self.balance / divisor"]
    pub fn balance_share(&self, divisor: i64) -> i64 {
        assert!(divisor != 0, "divisor must not be zero");
        self.balance / divisor
    }
}
