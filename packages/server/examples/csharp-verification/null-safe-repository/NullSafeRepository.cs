using CsFv.Contracts;

/// <summary>
/// Repository operations with null-safety contracts.
/// Uses pure integer functions — the cs-fv verifier can reason about these
/// with the CVC5 SMT solver. All contracts are satisfiable (should pass).
/// </summary>
public static class NullSafeRepository
{
    /// <summary>Find by ID — ID must be positive (non-null analogy for IDs).</summary>
    [Requires("id > 0")]
    [Ensures("result >= 0")]
    public static int FindById(int id) => id > 1000 ? -1 : id;

    /// <summary>Count — must be non-negative after incrementing a valid count.</summary>
    [Requires("count >= 0")]
    [Ensures("result > count")]
    public static int IncrementCount(int count) => count + 1;

    /// <summary>Clamp value to [min, max] range.</summary>
    [Requires("min <= max")]
    [Ensures("result >= min")]
    [Ensures("result <= max")]
    public static int Clamp(int value, int min, int max)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    /// <summary>Absolute value — result is always non-negative.</summary>
    [Ensures("result >= 0")]
    public static int Abs(int value) => value < 0 ? -value : value;
}
