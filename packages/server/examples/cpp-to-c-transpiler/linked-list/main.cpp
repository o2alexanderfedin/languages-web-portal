#include <iostream>
#include <memory>
#include <string>

// Node structure using unique_ptr for automatic memory management
template<typename T>
struct Node {
    T data;
    std::unique_ptr<Node<T>> next;

    // Constructor
    Node(const T& value) : data(value), next(nullptr) {}
};

// Linked list class demonstrating smart pointer usage
template<typename T>
class LinkedList {
private:
    std::unique_ptr<Node<T>> head;
    size_t size;

public:
    LinkedList() : head(nullptr), size(0) {}

    // No need for destructor - unique_ptr handles cleanup automatically

    // Add element to front
    void pushFront(const T& value) {
        auto newNode = std::make_unique<Node<T>>(value);
        newNode->next = std::move(head);
        head = std::move(newNode);
        ++size;
    }

    // Add element to back
    void pushBack(const T& value) {
        auto newNode = std::make_unique<Node<T>>(value);

        if (!head) {
            head = std::move(newNode);
        } else {
            Node<T>* current = head.get();
            while (current->next) {
                current = current->next.get();
            }
            current->next = std::move(newNode);
        }
        ++size;
    }

    // Print all elements
    void print() const {
        Node<T>* current = head.get();
        std::cout << "LinkedList [" << size << " elements]: ";
        while (current) {
            std::cout << current->data << " -> ";
            current = current->next.get();
        }
        std::cout << "null" << std::endl;
    }

    size_t getSize() const { return size; }
};

int main() {
    LinkedList<std::string> list;

    list.pushBack("First");
    list.pushBack("Second");
    list.pushFront("Zero");
    list.pushBack("Third");

    list.print();
    std::cout << "Total size: " << list.getSize() << std::endl;

    // Automatic cleanup on scope exit - no manual delete needed
    return 0;
}
