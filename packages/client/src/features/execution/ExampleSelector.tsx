import { useState } from 'react';
import { useGetExamplesQuery, useLoadExampleMutation } from './executionApi';
import { Button } from '@/components/ui/button';

interface ExampleSelectorProps {
  toolId: string | null;
  onExampleLoaded: (projectId: string) => void;
  disabled?: boolean;
}

export function ExampleSelector({ toolId, onExampleLoaded, disabled = false }: ExampleSelectorProps) {
  const [selectedExampleName, setSelectedExampleName] = useState<string>('');

  // Skip query when toolId is null
  const { data: examplesData, isLoading: isLoadingExamples } = useGetExamplesQuery(toolId ?? '', {
    skip: !toolId,
  });

  const [loadExample, { isLoading: isLoadingExample, error: loadError }] = useLoadExampleMutation();

  const examples = examplesData?.examples ?? [];

  // No tool selected yet - show prompt
  if (!toolId) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="example-selector-no-tool">
        Select a tool below to see available examples.
      </p>
    );
  }

  // Tool selected but still loading
  if (isLoadingExamples) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="example-selector-loading">
        Loading examples...
      </p>
    );
  }

  // Tool selected but no examples available
  if (examples.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="example-selector-empty">
        No examples available for this tool.
      </p>
    );
  }

  const selectedExample = examples.find((ex) => ex.name === selectedExampleName);

  const handleLoadExample = async () => {
    if (!selectedExampleName || !toolId) return;

    try {
      const response = await loadExample({ toolId, exampleName: selectedExampleName }).unwrap();
      onExampleLoaded(response.projectId);
      // Reset selection after successful load
      setSelectedExampleName('');
    } catch {
      // Error is handled by RTK Query and displayed below via loadError
    }
  };

  return (
    <div className="space-y-4" data-testid="example-selector">
      <div className="space-y-2">
        <select
          className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedExampleName}
          onChange={(e) => setSelectedExampleName(e.target.value)}
          disabled={disabled || isLoadingExamples}
          data-testid="example-dropdown"
        >
          <option value="">-- Load an example --</option>
          {examples.map((example) => (
            <option key={example.name} value={example.name}>
              {example.name}
            </option>
          ))}
        </select>

        {selectedExample && (
          <p className="text-sm text-muted-foreground">{selectedExample.description}</p>
        )}
      </div>

      <Button
        onClick={handleLoadExample}
        disabled={!selectedExampleName || disabled || isLoadingExample}
        data-testid="load-example-button"
      >
        {isLoadingExample ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Loading...
          </>
        ) : (
          'Load Example'
        )}
      </Button>

      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400 font-medium">
          Error loading example. Please try again.
        </div>
      )}
    </div>
  );
}
