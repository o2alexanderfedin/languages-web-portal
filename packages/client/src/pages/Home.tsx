import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useGetHealthQuery } from '@/features/health/api';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/features/upload/UploadZone';
import { ExecutionPanel } from '@/features/execution/ExecutionPanel';
import { ShareableLink } from '@/features/landing/ShareableLink';

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentToolId, setCurrentToolId] = useState<string | null>(
    () => searchParams.get('tool')
  );
  const { data: health, isLoading, error } = useGetHealthQuery();
  const { theme, setTheme } = useTheme();
  const executionSectionRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Handle URL param changes after initial mount and auto-scroll for quickstart
  useEffect(() => {
    const quickstartParam = searchParams.get('quickstart');

    // Auto-scroll to execution section if quickstart param is present
    if (quickstartParam && executionSectionRef.current) {
      executionSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Mark initial mount complete after processing URL params
    isInitialMount.current = false;
  }, [searchParams]);

  const handleToolChange = (toolId: string) => {
    setCurrentToolId(toolId);

    // Update URL params only when user explicitly changes tool (not on initial load)
    if (!isInitialMount.current) {
      setSearchParams({ tool: toolId });
    }
  };

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6" data-testid="demo-page">
      <div className="max-w-5xl w-full space-y-8 text-center lg:text-left">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-primary hover:underline text-sm" data-testid="back-to-home">
            ← Back to Home
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isLoading
                  ? 'bg-yellow-500'
                  : error
                    ? 'bg-red-500'
                    : health?.status === 'ok'
                      ? 'bg-green-500'
                      : 'bg-gray-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isLoading
                ? 'Connecting...'
                : error
                  ? 'Disconnected'
                  : health?.status === 'ok'
                    ? 'Connected'
                    : 'Unknown'}
            </span>
          </div>

          <Button onClick={toggleTheme} variant="outline" size="sm">
            Theme: {getThemeLabel()}
          </Button>
        </div>

        {health && !isLoading && (
          <div className="text-xs text-muted-foreground">
            Environment: {health.environment} | Uptime: {Math.floor(health.uptime)}s
          </div>
        )}

        <div className="pt-8 space-y-4" data-testid="upload-section">
          <h2 className="text-2xl font-semibold">Upload Your Code</h2>
          <UploadZone onUploadSuccess={setProjectId} />
        </div>

        <div className="pt-8 space-y-4" ref={executionSectionRef} data-testid="execution-section">
          <h2 className="text-2xl font-semibold">Run a Tool</h2>
          <ExecutionPanel
            projectId={projectId}
            initialToolId={currentToolId}
            onToolChange={handleToolChange}
          />
        </div>

        {/* Shareable Link Section */}
        <div className="pt-8 space-y-4" data-testid="share-section">
          <h2 className="text-2xl font-semibold">Share This Demo</h2>
          <ShareableLink toolId={currentToolId} />
        </div>
      </div>
    </div>
  );
}
