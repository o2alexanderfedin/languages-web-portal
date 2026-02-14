import { Link } from 'react-router';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/features/landing/HeroSection';
import { ToolComparisonGrid } from '@/features/landing/ToolComparisonGrid';

export function Landing() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="landing-page">
      {/* Top bar with theme toggle */}
      <div className="w-full border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-lg font-semibold">Hapyy</div>
          <Button onClick={toggleTheme} variant="outline" size="sm">
            Theme: {getThemeLabel()}
          </Button>
        </div>
      </div>

      {/* Hero section */}
      <HeroSection />

      {/* Spacer */}
      <div className="py-8"></div>

      {/* Tool comparison grid */}
      <ToolComparisonGrid />

      {/* Footer */}
      <footer className="mt-auto border-t py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p className="mb-2">Built by Hapyy</p>
          <Link to="/demo" className="text-primary hover:underline" data-testid="landing-footer-demo-link">
            Try the Demo
          </Link>
        </div>
      </footer>
    </div>
  );
}
