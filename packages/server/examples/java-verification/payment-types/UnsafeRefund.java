// WARNING: This file intentionally contains verification failures
// Used to demonstrate what "VERIFICATION FAILED" looks like in the portal

public class UnsafeRefund {
    // WARNING: This method intentionally lacks proper validation
    // Java FV should detect that refundAmount can exceed originalAmount
    public static double processRefund(double originalAmount, double refundAmount) {
        // MISSING VALIDATION: Should check refundAmount <= originalAmount
        // This allows negative final balance - verification failure expected
        double finalBalance = originalAmount - refundAmount;
        return finalBalance;  // Can be negative!
    }

    // Unsafe array access without bounds checking
    // Java FV should detect potential ArrayIndexOutOfBoundsException
    public static String getPaymentStatus(String[] statuses, int index) {
        // MISSING VALIDATION: No bounds check
        // Java FV should flag this as unsafe
        return statuses[index];
    }

    // Division by zero risk
    // Java FV should detect potential ArithmeticException
    public static double calculateRefundPercentage(double refunded, double total) {
        // MISSING VALIDATION: total could be zero
        return (refunded / total) * 100.0;
    }

    // Null dereference risk
    // Java FV should detect potential NullPointerException
    public static int getRefundYear(PaymentMethod method) {
        // MISSING VALIDATION: method could be null, or not be CreditCard
        // This will fail at runtime if method is null or not a CreditCard
        CreditCard card = (CreditCard) method;
        return card.expiryYear();  // Unsafe cast and dereference
    }

    // Integer overflow risk
    // Java FV should detect potential overflow in multiplication
    public static long calculateTotalRefunds(int numberOfRefunds, int averageRefundAmount) {
        // MISSING VALIDATION: multiplication can overflow
        return numberOfRefunds * averageRefundAmount;
    }
}
