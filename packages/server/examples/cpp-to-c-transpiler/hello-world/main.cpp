#include <iostream>
#include <string>

// Simple class demonstrating RAII and basic OOP
class Greeter {
private:
    std::string name;

public:
    // Constructor with member initialization
    Greeter(const std::string& n) : name(n) {
        std::cout << "Greeter created for " << name << std::endl;
    }

    // Destructor demonstrating RAII
    ~Greeter() {
        std::cout << "Greeter destroyed for " << name << std::endl;
    }

    // Method using string manipulation
    void greet() const {
        std::cout << "Hello, " << name << "!" << std::endl;
    }

    // Method with default parameter
    void farewell(const std::string& message = "Goodbye") const {
        std::cout << message << ", " << name << "!" << std::endl;
    }
};

int main() {
    // Demonstrates automatic object lifecycle management
    Greeter greeter("World");
    greeter.greet();
    greeter.farewell();
    greeter.farewell("See you later");

    return 0;
}
