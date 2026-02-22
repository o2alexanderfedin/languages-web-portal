using System;
using CsFv.Contracts;

// Discriminated union using abstract records (C# 9+)
public abstract record Operation;
public record Add(int X, int Y) : Operation;
public record Multiply(int X, int Y) : Operation;
public record Divide(int Dividend, int Divisor) : Operation;

/// <summary>
/// Calculator with FV contracts on arithmetic operations.
/// Demonstrates pattern matching and precondition verification.
/// </summary>
public class Calculator
{
    /// <summary>
    /// Executes an arithmetic operation using pattern matching.
    /// All branches are covered — this contract should pass.
    /// </summary>
    [Ensures("result >= int.MinValue && result <= int.MaxValue")]
    public int Execute(Operation op)
    {
        return op switch
        {
            Add(var x, var y) => x + y,
            Multiply(var x, var y) => x * y,
            Divide(var d, var r) when r != 0 => d / r,
            Divide => throw new DivideByZeroException(),
            _ => throw new ArgumentException("Unknown operation", nameof(op))
        };
    }

    /// <summary>Increments a non-negative integer. Result is strictly greater.</summary>
    [Requires("x >= 0")]
    [Ensures("result > x")]
    public int Increment(int x) => x + 1;

    /// <summary>Safe integer division with precondition preventing division by zero.</summary>
    [Requires("divisor != 0")]
    [Ensures("result * divisor <= dividend")]
    public int SafeDivide(int dividend, int divisor) => dividend / divisor;
}
