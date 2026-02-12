import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { store } from "@/store";
import { Home } from "@/pages/Home";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="system" storageKey="hapyy-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-xl">404 - Page Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
