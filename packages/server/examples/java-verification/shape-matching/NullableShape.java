// Demonstrates null pattern matching and null safety
// Java FV verifies null handling is complete and safe

public class NullableShape {
    // Pattern matching with null case
    // Java FV verifies null is explicitly handled
    public static String describe(Shape shape) {
        return switch (shape) {
            case null -> "no shape";
            case Circle c -> "circle with radius " + c.radius();
            case Rectangle r -> "rectangle " + r.width() + "x" + r.height();
            case Triangle t -> "triangle with sides " + t.a() + ", " + t.b() + ", " + t.c();
        };
    }

    // Null-safe area calculation
    // Returns 0.0 for null instead of throwing
    public static double safeArea(Shape shape) {
        return switch (shape) {
            case null -> 0.0;
            case Circle c -> Math.PI * c.radius() * c.radius();
            case Rectangle r -> r.width() * r.height();
            case Triangle t -> {
                double s = (t.a() + t.b() + t.c()) / 2.0;
                yield Math.sqrt(s * (s - t.a()) * (s - t.b()) * (s - t.c()));
            }
        };
    }

    // Compare two shapes (both may be null)
    // Java FV verifies all null combinations are handled
    public static String compare(Shape s1, Shape s2) {
        if (s1 == null && s2 == null) {
            return "both shapes are null";
        }
        if (s1 == null) {
            return "first shape is null";
        }
        if (s2 == null) {
            return "second shape is null";
        }

        double area1 = ShapeCalculator.area(s1);
        double area2 = ShapeCalculator.area(s2);

        if (Math.abs(area1 - area2) < 0.001) {
            return "shapes have equal area";
        }
        return area1 > area2 ? "first shape is larger" : "second shape is larger";
    }
}
