using System;
using System.Collections.Generic;

namespace NullCheckExample
{
    public class User
    {
        public string Name { get; set; }
        public string? Email { get; set; } // Nullable reference type

        public User(string name)
        {
            // Guard against null input
            Name = name ?? throw new ArgumentNullException(nameof(name));
        }

        // Null-safe method with guard pattern
        public string GetDisplayName()
        {
            // Demonstrating null-coalescing operator
            return Email != null ? $"{Name} ({Email})" : Name;
        }
    }

    public class UserRepository
    {
        private readonly Dictionary<int, User> users = new();

        // Returns nullable to indicate possible absence
        public User? FindById(int id)
        {
            return users.TryGetValue(id, out var user) ? user : null;
        }

        // Null guard at API boundary
        public void AddUser(int id, User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            users[id] = user;
        }
    }

    class Program
    {
        static void Main()
        {
            var repo = new UserRepository();

            // Safe user creation with null guard
            var user1 = new User("Alice") { Email = "alice@example.com" };
            repo.AddUser(1, user1);

            // Null-safe retrieval pattern
            User? foundUser = repo.FindById(1);
            if (foundUser != null)
            {
                Console.WriteLine($"Found: {foundUser.GetDisplayName()}");
            }

            // Safe handling of missing user
            User? missingUser = repo.FindById(999);
            Console.WriteLine(missingUser?.GetDisplayName() ?? "User not found");
        }
    }
}
