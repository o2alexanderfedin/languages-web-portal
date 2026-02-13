import { useState } from 'react';
import { useGetHealthQuery } from '@/features/health/api';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/features/upload/UploadZone';
import { ExecutionPanel } from '@/features/execution/ExecutionPanel';

export function Home() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { data: health, isLoading, error } = useGetHealthQuery();
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Hapyy Languages Web Portal</h1>

        <p className="text-lg text-muted-foreground">
          Try formal verification and transpiler tools directly in your browser with zero local
          setup.
        </p>

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

        <div className="pt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Upload Your Code</h2>
          <UploadZone onUploadSuccess={setProjectId} />
        </div>

        <div className="pt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Run a Tool</h2>
          <ExecutionPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
