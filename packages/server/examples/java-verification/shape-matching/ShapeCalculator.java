// Demonstrates pattern matching with type patterns and guards
// Java FV verifies exhaustiveness of sealed type matching

public class ShapeCalculator {
    // Pattern matching switch expression with type patterns
    // Java FV verifies all Shape subtypes are covered
    public static double area(Shape shape) {
        return switch (shape) {
            case Circle c -> Math.PI * c.radius() * c.radius();
            case Rectangle r -> r.width() * r.height();
            case Triangle t -> {
                double s = (t.a() + t.b() + t.c()) / 2.0;
                yield Math.sqrt(s * (s - t.a()) * (s - t.b()) * (s - t.c()));
            }
        };
    }

    // Pattern matching with guards (when clauses)
    // Java FV verifies exhaustiveness including guard coverage
    public static String classify(Shape shape) {
        return switch (shape) {
            case Circle c when c.radius() > 100 -> "large circle";
            case Circle c when c.radius() > 10 -> "medium circle";
            case Circle c -> "small circle";
            case Rectangle r when r.width() == r.height() -> "square";
            case Rectangle r when r.width() > r.height() -> "wide rectangle";
            case Rectangle r -> "tall rectangle";
            case Triangle t when isEquilateral(t) -> "equilateral triangle";
            case Triangle t when isIsosceles(t) -> "isosceles triangle";
            case Triangle t -> "scalene triangle";
        };
    }

    // Perimeter calculation using pattern matching
    public static double perimeter(Shape shape) {
        return switch (shape) {
            case Circle c -> 2 * Math.PI * c.radius();
            case Rectangle r -> 2 * (r.width() + r.height());
            case Triangle t -> t.a() + t.b() + t.c();
        };
    }

    // Helper methods for triangle classification
    private static boolean isEquilateral(Triangle t) {
        return Math.abs(t.a() - t.b()) < 0.001 && Math.abs(t.b() - t.c()) < 0.001;
    }

    private static boolean isIsosceles(Triangle t) {
        return Math.abs(t.a() - t.b()) < 0.001 ||
               Math.abs(t.b() - t.c()) < 0.001 ||
               Math.abs(t.c() - t.a()) < 0.001;
    }
}
