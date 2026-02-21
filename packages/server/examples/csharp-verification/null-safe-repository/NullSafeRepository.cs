using CsFv.Contracts;

// Modern C# record for domain modeling (C# 9+)
public record User(int Id, string Name, string? Email = null);

/// <summary>
/// Null-safe repository demonstrating FV precondition/postcondition contracts.
/// All contracts are satisfiable — this example should pass verification.
/// </summary>
public class NullSafeRepository
{
    private readonly Dictionary<int, User> _users = new();

    /// <summary>Finds a user by ID. Requires positive ID.</summary>
    [Requires("id > 0")]
    [Ensures("result == null || result.Id == id")]
    public User? FindById(int id)
    {
        return _users.TryGetValue(id, out var user) ? user : null;
    }

    /// <summary>Adds a user to the repository. Requires non-null user with positive ID.</summary>
    [Requires("user != null")]
    [Requires("user.Id > 0")]
    public void AddUser(User user)
    {
        _users[user.Id] = user;
    }

    /// <summary>Returns a display name. Uses C# pattern matching on nullable.</summary>
    [Pure]
    [Ensures("result != null")]
    public string GetDisplayName(User? user)
    {
        return user switch
        {
            { Email: not null } u => $"{u.Name} <{u.Email}>",
            { Name: var n } => n,
            null => "Unknown"
        };
    }
}
