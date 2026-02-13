#include <iostream>
#include <array>

// Template function for compile-time computation
template<typename T>
constexpr T fibonacci(T n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Constexpr function for compile-time array initialization
constexpr std::array<int, 10> generateFibSequence() {
    std::array<int, 10> result{};
    for (int i = 0; i < 10; ++i) {
        result[i] = fibonacci(i);
    }
    return result;
}

// Class template demonstrating generic programming
template<typename T, size_t N>
class FibonacciSequence {
private:
    std::array<T, N> sequence;

public:
    constexpr FibonacciSequence() : sequence{} {
        for (size_t i = 0; i < N; ++i) {
            sequence[i] = fibonacci(static_cast<T>(i));
        }
    }

    void print() const {
        std::cout << "Fibonacci sequence: ";
        for (const auto& num : sequence) {
            std::cout << num << " ";
        }
        std::cout << std::endl;
    }
};

int main() {
    // Compile-time generation
    constexpr auto fibSeq = generateFibSequence();

    std::cout << "First 10 Fibonacci numbers: ";
    for (const auto& num : fibSeq) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // Template class usage
    FibonacciSequence<int, 15> fib15;
    fib15.print();

    return 0;
}
