import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { store } from "@/store";
import { Home } from "@/pages/Home";
function App() {
    return (_jsx(Provider, { store: store, children: _jsx(ThemeProvider, { defaultTheme: "system", storageKey: "hapyy-theme", children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "*", element: _jsx("div", { className: "min-h-screen flex items-center justify-center text-xl", children: "404 - Page Not Found" }) })] }) }) }) }));
}
export default App;
