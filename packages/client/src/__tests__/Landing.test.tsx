import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/components/ThemeProvider';
import { store } from '@/store';
import { Landing } from '@/pages/Landing';
import { HeroSection } from '@/features/landing/HeroSection';
import { ToolComparisonGrid } from '@/features/landing/ToolComparisonGrid';
import { QuickStartCTA } from '@/features/landing/QuickStartCTA';
import { TOOLS } from '@repo/shared';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <ThemeProvider defaultTheme="system" storageKey="hapyy-theme-test">
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('HeroSection', () => {
  it('renders mission statement heading', () => {
    renderWithProviders(<HeroSection />);
    expect(screen.getByText(/Formal Verification for AI-Generated Code/i)).toBeDefined();
  });

  it('renders sub-heading with narrative text about AI-generated code verification', () => {
    renderWithProviders(<HeroSection />);
    expect(screen.getByText(/In autonomous software development/i)).toBeDefined();
    expect(screen.getByText(/96% of developers/i)).toBeDefined();
    expect(screen.getByText(/vericoding/i)).toBeDefined();
  });

  it('renders Explore Tools button', () => {
    renderWithProviders(<HeroSection />);
    expect(screen.getByRole('button', { name: /Explore Tools/i })).toBeDefined();
  });

  it('renders QuickStartCTA component', () => {
    renderWithProviders(<HeroSection />);
    // QuickStartCTA renders "Try {firstAvailableTool.name} Now"
    const firstAvailable = TOOLS.find(t => t.status === 'available');
    if (firstAvailable) {
      // Escape special regex characters in tool name
      const escapedName = firstAvailable.name.replace(/[+]/g, '\\+');
      expect(screen.getByRole('button', { name: new RegExp(escapedName, 'i') })).toBeDefined();
    }
  });
});

describe('ToolComparisonGrid', () => {
  it('renders all 8 tool names from TOOLS constant', () => {
    renderWithProviders(<ToolComparisonGrid />);

    TOOLS.forEach((tool) => {
      // Tool names appear in both desktop table and mobile cards
      const elements = screen.getAllByText(tool.name);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('shows correct status badges (Available, In Development, Coming Soon)', () => {
    renderWithProviders(<ToolComparisonGrid />);

    // Check that each status type appears
    const availableTools = TOOLS.filter(t => t.status === 'available');
    const inDevTools = TOOLS.filter(t => t.status === 'in-development');
    const comingSoonTools = TOOLS.filter(t => t.status === 'coming-soon');

    if (availableTools.length > 0) {
      expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
    }
    if (inDevTools.length > 0) {
      expect(screen.getAllByText('In Development').length).toBeGreaterThan(0);
    }
    if (comingSoonTools.length > 0) {
      expect(screen.getAllByText('Coming Soon').length).toBeGreaterThan(0);
    }
  });

  it('Try Now buttons are disabled for coming-soon tools', () => {
    renderWithProviders(<ToolComparisonGrid />);

    const buttons = screen.getAllByRole('button', { name: /Try Now/i });
    const comingSoonCount = TOOLS.filter(t => t.status === 'coming-soon').length;

    // Count disabled buttons
    const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'));

    // Each coming-soon tool appears twice (desktop + mobile), so we expect comingSoonCount * 2 disabled buttons
    expect(disabledButtons.length).toBe(comingSoonCount * 2);
  });

  it('Try Now buttons navigate to /demo?tool={id} for available tools', async () => {
    const user = userEvent.setup();
    mockNavigate.mockClear();

    renderWithProviders(<ToolComparisonGrid />);

    const availableTool = TOOLS.find(t => t.status === 'available');
    if (availableTool) {
      const buttons = screen.getAllByRole('button', { name: /Try Now/i });
      // Find first enabled button (should be for available tool)
      const enabledButton = buttons.find(btn => !btn.hasAttribute('disabled'));

      if (enabledButton) {
        await user.click(enabledButton);
        expect(mockNavigate).toHaveBeenCalledWith(`/demo?tool=${availableTool.id}`);
      }
    }
  });
});

describe('QuickStartCTA', () => {
  it('renders button with first available tool name', () => {
    renderWithProviders(<QuickStartCTA />);

    const firstAvailable = TOOLS.find(t => t.status === 'available');
    if (firstAvailable) {
      // Escape special regex characters in tool name
      const escapedName = firstAvailable.name.replace(/[+]/g, '\\+');
      expect(screen.getByRole('button', { name: new RegExp(escapedName, 'i') })).toBeDefined();
    }
  });

  it('navigates to /demo?tool=cpp-to-c-transpiler&quickstart=true on click', async () => {
    const user = userEvent.setup();
    mockNavigate.mockClear();

    renderWithProviders(<QuickStartCTA />);

    const firstAvailable = TOOLS.find(t => t.status === 'available');
    if (firstAvailable) {
      // Escape special regex characters in tool name
      const escapedName = firstAvailable.name.replace(/[+]/g, '\\+');
      const button = screen.getByRole('button', { name: new RegExp(escapedName, 'i') });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(`/demo?tool=${firstAvailable.id}&quickstart=true`);
    }
  });
});

describe('Landing Page', () => {
  it('composes all three sections', () => {
    renderWithProviders(<Landing />);

    // Check hero section
    expect(screen.getByText(/Formal Verification for AI-Generated Code/i)).toBeDefined();

    // Check tool comparison grid
    expect(screen.getByText(/Available Tools/i)).toBeDefined();

    // Check footer
    expect(screen.getByText(/Built by Hapyy/i)).toBeDefined();
  });
});
