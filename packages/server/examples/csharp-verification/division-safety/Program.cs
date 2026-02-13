using System;
using System.Diagnostics;

namespace DivisionSafetyExample
{
    public class SafeMath
    {
        // Division with explicit zero check
        public static int Divide(int dividend, int divisor)
        {
            if (divisor == 0)
                throw new DivideByZeroException("Cannot divide by zero");

            return dividend / divisor;
        }

        // Division with default value for zero divisor
        public static int DivideOrDefault(int dividend, int divisor, int defaultValue = 0)
        {
            return divisor == 0 ? defaultValue : dividend / divisor;
        }

        // Safe division returning nullable
        public static int? TryDivide(int dividend, int divisor)
        {
            return divisor == 0 ? null : dividend / divisor;
        }

        // Division with contract verification
        public static int DivideWithContract(int dividend, int divisor)
        {
            // Pre-condition: divisor must not be zero
            Debug.Assert(divisor != 0, "Divisor cannot be zero");

            int result = dividend / divisor;

            // Post-condition: result * divisor should equal dividend (accounting for integer division)
            Debug.Assert(Math.Abs(dividend - (result * divisor)) < Math.Abs(divisor),
                "Division result verification failed");

            return result;
        }

        // Modulo operation with safety check
        public static int SafeModulo(int dividend, int divisor)
        {
            if (divisor == 0)
                throw new DivideByZeroException("Cannot perform modulo with zero divisor");

            return dividend % divisor;
        }
    }

    class Program
    {
        static void Main()
        {
            // Safe division with exception
            try
            {
                int result1 = SafeMath.Divide(10, 2);
                Console.WriteLine($"10 / 2 = {result1}");

                int result2 = SafeMath.Divide(10, 0); // Will throw
            }
            catch (DivideByZeroException e)
            {
                Console.WriteLine($"Caught: {e.Message}");
            }

            // Division with default value
            int result3 = SafeMath.DivideOrDefault(10, 0, -1);
            Console.WriteLine($"10 / 0 with default = {result3}");

            // Nullable division
            int? result4 = SafeMath.TryDivide(15, 3);
            int? result5 = SafeMath.TryDivide(15, 0);
            Console.WriteLine($"15 / 3 = {result4}, 15 / 0 = {result5?.ToString() ?? "null"}");

            // Division with contract
            int result6 = SafeMath.DivideWithContract(20, 4);
            Console.WriteLine($"20 / 4 with contract = {result6}");
        }
    }
}
