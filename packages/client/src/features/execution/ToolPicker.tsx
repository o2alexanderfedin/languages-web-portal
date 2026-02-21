import { type Tool } from '@repo/shared';
import { useGetToolsQuery } from './executionApi';
import { clsx } from 'clsx';

interface ToolPickerProps {
  selectedToolId: string | null;
  onSelectTool: (toolId: string) => void;
  disabled?: boolean;
}

export function ToolPicker({ selectedToolId, onSelectTool, disabled }: ToolPickerProps) {
  const { data: tools = [] } = useGetToolsQuery();

  const getStatusBadgeClass = (status: Tool['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-development':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'coming-soon':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusBadgeText = (status: Tool['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in-development':
        return 'In Development';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return 'Unknown';
    }
  };

  const isToolSelectable = (tool: Tool) => {
    return tool.status !== 'coming-soon' && !disabled;
  };

  const handleToolClick = (tool: Tool) => {
    if (isToolSelectable(tool)) {
      onSelectTool(tool.id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="tool-picker">
      {tools.map((tool) => {
        const isSelected = selectedToolId === tool.id;
        const isComingSoon = tool.status === 'coming-soon';
        const isDisabledByPanel = disabled && tool.status !== 'coming-soon';

        return (
          <div
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            data-testid={`tool-option-${tool.id}`}
            title={isComingSoon ? 'Not yet available' : isDisabledByPanel ? 'Unavailable while running' : undefined}
            className={clsx(
              'rounded-lg p-4 transition-all relative',
              // Coming Soon: dashed border, muted background — "not yet available"
              isComingSoon && 'border-2 border-dashed border-muted-foreground/30 bg-muted/20 cursor-not-allowed',
              // Disabled by panel (while streaming): solid border, desaturated
              isDisabledByPanel && !isSelected && 'border-2 border-border/50 saturate-[.4] cursor-not-allowed',
              isDisabledByPanel && isSelected && 'border-2 border-primary/40 bg-primary/5 saturate-[.4] cursor-not-allowed',
              // Interactive states (not coming-soon, not disabled)
              !isComingSoon && !disabled && isSelected && 'border-2 border-primary bg-primary/5',
              !isComingSoon && !disabled && !isSelected && 'border-2 border-border cursor-pointer hover:border-primary/50 hover:bg-muted/40',
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className={clsx('font-bold text-lg', isComingSoon && 'text-muted-foreground')}>
                {tool.name}
              </h3>
              <div className="flex items-center gap-1.5">
                {isComingSoon && (
                  <svg className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                )}
                <span
                  className={clsx(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    getStatusBadgeClass(tool.status),
                  )}
                >
                  {getStatusBadgeText(tool.status)}
                </span>
              </div>
            </div>

            <p className={clsx('text-sm mb-3', isComingSoon ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
              {tool.description}
            </p>

            <div className={clsx('text-xs', isComingSoon ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
              {tool.targetLanguage ? (
                <span>
                  {tool.sourceLanguage} → {tool.targetLanguage}
                </span>
              ) : (
                <span>{tool.sourceLanguage}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
