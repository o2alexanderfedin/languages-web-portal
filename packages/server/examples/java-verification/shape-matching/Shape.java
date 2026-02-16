// Sealed interface with record implementations
// Java FV verifies exhaustiveness and geometric constraints

public sealed interface Shape permits Circle, Rectangle, Triangle {
    // Area calculation delegated to implementations
    double area();
}

// Circle validates radius > 0
record Circle(double radius) implements Shape {
    public Circle {
        if (radius <= 0) {
            throw new IllegalArgumentException("Radius must be positive");
        }
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

// Rectangle validates positive dimensions
record Rectangle(double width, double height) implements Shape {
    public Rectangle {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Dimensions must be positive");
        }
    }

    @Override
    public double area() {
        return width * height;
    }
}

// Triangle validates triangle inequality theorem
// Java FV verifies: a + b > c, b + c > a, c + a > b
record Triangle(double a, double b, double c) implements Shape {
    public Triangle {
        if (a <= 0 || b <= 0 || c <= 0) {
            throw new IllegalArgumentException("Side lengths must be positive");
        }
        // Triangle inequality: sum of any two sides > third side
        if (a + b <= c || b + c <= a || c + a <= b) {
            throw new IllegalArgumentException("Invalid triangle: violates triangle inequality");
        }
    }

    @Override
    public double area() {
        // Heron's formula
        double s = (a + b + c) / 2.0;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }
}
