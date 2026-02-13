import { useNavigate } from 'react-router';
import { TOOLS, type Tool } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';

export function ToolComparisonGrid() {
  const navigate = useNavigate();

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

  const getLanguageDisplay = (tool: Tool) => {
    if (tool.targetLanguage) {
      return `${tool.sourceLanguage} → ${tool.targetLanguage}`;
    }
    return tool.sourceLanguage;
  };

  const handleTryNow = (toolId: string) => {
    navigate(`/demo?tool=${toolId}`);
  };

  return (
    <section id="comparison" className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Available Tools</h2>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium p-3">Tool Name</th>
                <th className="text-left font-medium p-3">Type</th>
                <th className="text-left font-medium p-3">Language</th>
                <th className="text-left font-medium p-3">Status</th>
                <th className="text-left font-medium p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((tool) => (
                <tr key={tool.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-medium">{tool.name}</td>
                  <td className="p-3 capitalize">{tool.category}</td>
                  <td className="p-3">{getLanguageDisplay(tool)}</td>
                  <td className="p-3">
                    <span
                      className={clsx(
                        'text-xs font-medium px-2 py-1 rounded-full inline-block',
                        getStatusBadgeClass(tool.status)
                      )}
                    >
                      {getStatusBadgeText(tool.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant={tool.status === 'coming-soon' ? 'outline' : 'default'}
                      disabled={tool.status === 'coming-soon'}
                      onClick={() => handleTryNow(tool.id)}
                    >
                      Try Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
          {TOOLS.map((tool) => (
            <div key={tool.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-lg">{tool.name}</h3>
                <span
                  className={clsx(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    getStatusBadgeClass(tool.status)
                  )}
                >
                  {getStatusBadgeText(tool.status)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">{tool.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {getLanguageDisplay(tool)} • {tool.category}
                </span>
                <Button
                  size="sm"
                  variant={tool.status === 'coming-soon' ? 'outline' : 'default'}
                  disabled={tool.status === 'coming-soon'}
                  onClick={() => handleTryNow(tool.id)}
                >
                  Try Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
