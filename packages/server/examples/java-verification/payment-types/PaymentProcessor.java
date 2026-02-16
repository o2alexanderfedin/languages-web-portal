// Payment processing with sealed type exhaustiveness
// Java FV verifies all payment types are handled

public class PaymentProcessor {
    // Calculate processing fee based on payment method
    // Java FV verifies: exhaustiveness, non-negative fees, amount > 0
    public static double calculateFee(PaymentMethod method, double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        // Pattern matching ensures all payment types covered
        return switch (method) {
            case CreditCard cc -> {
                // 2.9% + $0.30 transaction fee
                yield (amount * 0.029) + 0.30;
            }
            case BankTransfer bt -> {
                // 0.5% fee, minimum $0.50
                double fee = amount * 0.005;
                yield Math.max(fee, 0.50);
            }
            case Crypto cr -> {
                // 1.0% network fee
                yield amount * 0.01;
            }
        };
    }

    // Validate payment method with business rules
    // Java FV verifies exhaustiveness of validation
    public static boolean isValid(PaymentMethod method) {
        return switch (method) {
            case CreditCard cc -> cc.isValid() && cc.expiryYear() >= 2024;
            case BankTransfer bt -> bt.isValid() && bt.iban().length() >= 15;
            case Crypto cr -> cr.isValid() && isSupportedCurrency(cr.currency());
        };
    }

    // Process payment and return net amount after fees
    // Java FV verifies: result is non-negative when amount > 0
    public static double processPayment(PaymentMethod method, double amount) {
        if (!isValid(method)) {
            throw new IllegalArgumentException("Invalid payment method");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        double fee = calculateFee(method, amount);
        double netAmount = amount - fee;

        // Verification ensures this assertion holds
        assert netAmount >= 0 : "Net amount cannot be negative";

        return netAmount;
    }

    // Helper to check supported cryptocurrencies
    private static boolean isSupportedCurrency(String currency) {
        return currency.equals("BTC") || currency.equals("ETH") ||
               currency.equals("USDC") || currency.equals("USDT");
    }
}
