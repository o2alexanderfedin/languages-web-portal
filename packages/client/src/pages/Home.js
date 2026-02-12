import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGetHealthQuery } from "@/features/health/api";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
export function Home() {
    const { data: health, isLoading, error } = useGetHealthQuery();
    const { theme, setTheme } = useTheme();
    const toggleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        }
        else if (theme === "dark") {
            setTheme("system");
        }
        else {
            setTheme("light");
        }
    };
    const getThemeLabel = () => {
        if (theme === "system")
            return "System";
        return theme.charAt(0).toUpperCase() + theme.slice(1);
    };
    return (_jsx("div", { className: "min-h-screen flex flex-col items-center justify-center p-6", children: _jsxs("div", { className: "max-w-2xl w-full space-y-8 text-center", children: [_jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "Hapyy Languages Web Portal" }), _jsx("p", { className: "text-lg text-muted-foreground", children: "Try formal verification and transpiler tools directly in your browser with zero local setup." }), _jsxs("div", { className: "flex items-center justify-center gap-4 pt-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-3 w-3 rounded-full ${isLoading
                                        ? "bg-yellow-500"
                                        : error
                                            ? "bg-red-500"
                                            : health?.status === "ok"
                                                ? "bg-green-500"
                                                : "bg-gray-500"}` }), _jsx("span", { className: "text-sm font-medium", children: isLoading
                                        ? "Connecting..."
                                        : error
                                            ? "Disconnected"
                                            : health?.status === "ok"
                                                ? "Connected"
                                                : "Unknown" })] }), _jsxs(Button, { onClick: toggleTheme, variant: "outline", size: "sm", children: ["Theme: ", getThemeLabel()] })] }), health && !isLoading && (_jsxs("div", { className: "text-xs text-muted-foreground", children: ["Environment: ", health.environment, " | Uptime:", " ", Math.floor(health.uptime), "s"] }))] }) }));
}
