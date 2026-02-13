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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tools.map((tool) => {
        const isSelected = selectedToolId === tool.id;
        const isSelectable = isToolSelectable(tool);

        return (
          <div
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className={clsx(
              'border-2 rounded-lg p-4 transition-all',
              isSelected && 'border-primary bg-primary/5',
              !isSelected && 'border-border',
              isSelectable && 'cursor-pointer hover:border-primary/50 hover:bg-primary/5',
              !isSelectable && 'opacity-50 cursor-not-allowed',
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg">{tool.name}</h3>
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  getStatusBadgeClass(tool.status),
                )}
              >
                {getStatusBadgeText(tool.status)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>

            <div className="text-xs text-muted-foreground">
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
