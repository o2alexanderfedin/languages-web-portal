import { useState } from 'react';
import { useExecuteToolMutation, useGetToolsQuery } from './executionApi';
import { ToolPicker } from './ToolPicker';
import { QueueStatus } from './QueueStatus';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';
import type { ExecutionResponse } from '@repo/shared';

interface ExecutionPanelProps {
  projectId: string | null;
}

type ExecutionState = 'idle' | 'executing' | 'complete';

export function ExecutionPanel({ projectId }: ExecutionPanelProps) {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [executeTool, { isLoading }] = useExecuteToolMutation();
  const { data: tools = [] } = useGetToolsQuery();

  const selectedTool = tools.find((tool) => tool.id === selectedToolId);

  const handleRun = async () => {
    if (!projectId || !selectedToolId) return;

    setExecutionState('executing');
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const response = await executeTool({ toolId: selectedToolId, projectId }).unwrap();
      setExecutionResult(response.data);
      setExecutionState('complete');
    } catch (error: unknown) {
      setExecutionState('complete');

      // Handle RTK Query error format
      if (error && typeof error === 'object' && 'status' in error) {
        const rtkError = error as { status: number; data?: { error?: string } };
        if (rtkError.status === 429) {
          setExecutionError('Rate limit exceeded. Please wait before trying again.');
        } else if (rtkError.data && rtkError.data.error) {
          setExecutionError(rtkError.data.error);
        } else {
          setExecutionError('An error occurred during execution');
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const err = error as { message: string };
        setExecutionError(err.message);
      } else {
        setExecutionError('Connection failed. Please check your connection.');
      }
    }
  };

  const handleReset = () => {
    setExecutionState('idle');
    setExecutionResult(null);
    setExecutionError(null);
  };

  const getRunButtonDisabledReason = (): string | null => {
    if (!projectId) return 'Upload a project first';
    if (!selectedToolId) return 'Select a tool';
    return null;
  };

  const runButtonDisabledReason = getRunButtonDisabledReason();
  const isRunButtonDisabled = runButtonDisabledReason !== null || isLoading;

  const getStatusBadgeClass = (status: ExecutionResponse['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'timeout':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDuration = (durationMs: number | undefined): string => {
    if (durationMs === undefined) return 'N/A';
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Tool Selection Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Select a Tool</h3>
        <ToolPicker
          selectedToolId={selectedToolId}
          onSelectTool={setSelectedToolId}
          disabled={executionState === 'executing'}
        />
      </div>

      {/* Run Button Section */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleRun}
          disabled={isRunButtonDisabled}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Running...
            </>
          ) : (
            `Run ${selectedTool ? selectedTool.name : 'Tool'}`
          )}
        </Button>

        {runButtonDisabledReason && (
          <span className="text-sm text-muted-foreground">{runButtonDisabledReason}</span>
        )}
      </div>

      {/* Queue Status Section */}
      {executionState === 'executing' && <QueueStatus />}

      {/* Execution Status Message */}
      {executionState === 'executing' && selectedTool && (
        <div className="text-sm text-muted-foreground">
          Running {selectedTool.name}...
        </div>
      )}

      {/* Execution Results Section */}
      {executionState === 'complete' && (executionResult || executionError) && (
        <div className="space-y-4 border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Execution Results</h3>
            <Button onClick={handleReset} variant="outline" size="sm">
              {executionResult ? 'Run Again' : 'Reset'}
            </Button>
          </div>

          {/* Error Message */}
          {executionError && (
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              Error: {executionError}
            </div>
          )}

          {/* Results Display */}
          {executionResult && (
            <div className="space-y-3">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    'text-xs font-medium px-3 py-1 rounded-full',
                    getStatusBadgeClass(executionResult.status),
                  )}
                >
                  {executionResult.status.toUpperCase()}
                </span>

                {executionResult.exitCode !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    Exit Code: {executionResult.exitCode}
                  </span>
                )}

                {executionResult.durationMs !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    Duration: {formatDuration(executionResult.durationMs)}
                  </span>
                )}
              </div>

              {/* Error Message from Result */}
              {executionResult.error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {executionResult.error}
                </div>
              )}

              {/* Console Output */}
              {executionResult.output && executionResult.output.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Output:</h4>
                  <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-y-auto max-h-[400px] text-xs font-mono">
                    {executionResult.output.join('\n')}
                  </pre>
                </div>
              )}

              {/* No Output Message */}
              {(!executionResult.output || executionResult.output.length === 0) && (
                <div className="text-sm text-muted-foreground italic">No output generated</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
