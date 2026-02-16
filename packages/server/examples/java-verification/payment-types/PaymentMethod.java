// Sealed interface for payment methods
// Java FV verifies exhaustiveness and validation constraints

public sealed interface PaymentMethod permits CreditCard, BankTransfer, Crypto {
    // Each payment method must implement validation
    boolean isValid();
}

// Credit card with expiry validation
record CreditCard(String number, int expiryMonth, int expiryYear) implements PaymentMethod {
    public CreditCard {
        if (number == null || number.isEmpty()) {
            throw new IllegalArgumentException("Card number cannot be empty");
        }
        // Verify month in valid range
        if (expiryMonth < 1 || expiryMonth > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
        // Verify year is reasonable (current or future)
        if (expiryYear < 2024) {
            throw new IllegalArgumentException("Expiry year must be 2024 or later");
        }
    }

    @Override
    public boolean isValid() {
        // Simplified validation - real world would check Luhn algorithm
        return number.length() >= 13 && number.length() <= 19;
    }
}

// Bank transfer with IBAN validation
record BankTransfer(String iban, String bic) implements PaymentMethod {
    public BankTransfer {
        if (iban == null || iban.isEmpty()) {
            throw new IllegalArgumentException("IBAN cannot be empty");
        }
        if (bic == null || bic.isEmpty()) {
            throw new IllegalArgumentException("BIC cannot be empty");
        }
    }

    @Override
    public boolean isValid() {
        // Simplified - real IBAN validation is complex
        return iban.length() >= 15 && iban.length() <= 34 && bic.length() >= 8;
    }
}

// Cryptocurrency payment
record Crypto(String walletAddress, String currency) implements PaymentMethod {
    public Crypto {
        if (walletAddress == null || walletAddress.isEmpty()) {
            throw new IllegalArgumentException("Wallet address cannot be empty");
        }
        if (currency == null || currency.isEmpty()) {
            throw new IllegalArgumentException("Currency cannot be empty");
        }
    }

    @Override
    public boolean isValid() {
        // Simplified - real validation depends on currency
        return walletAddress.length() >= 26;
    }
}
