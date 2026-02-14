import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/components/ThemeProvider';
import { store } from '@/store';
import { Landing } from '@/pages/Landing';
import { Home } from '@/pages/Home';

describe('App', () => {
  it('renders landing page at / route', () => {
    render(
      <Provider store={store}>
        <ThemeProvider defaultTheme="system" storageKey="hupyy-theme">
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<Landing />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByText(/Formal Verification for AI-Generated Code/i)).toBeDefined();
  });

  it('renders demo page at /demo route', () => {
    render(
      <Provider store={store}>
        <ThemeProvider defaultTheme="system" storageKey="hupyy-theme">
          <MemoryRouter initialEntries={['/demo']}>
            <Routes>
              <Route path="/demo" element={<Home />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByText(/Upload Your Code/i)).toBeDefined();
  });
});
