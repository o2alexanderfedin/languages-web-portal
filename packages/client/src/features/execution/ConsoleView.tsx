import { useEffect, useRef } from 'react';
import { AnsiUp } from 'ansi_up';

// Create singleton AnsiUp instance at module level
const ansiUp = new AnsiUp();
ansiUp.escape_html = true; // Enable HTML escaping to prevent XSS

interface ConsoleViewProps {
  lines: string[];
  isStreaming: boolean;
}

/**
 * ANSI-aware streaming console renderer with auto-scroll
 *
 * Renders real-time subprocess output with ANSI color codes converted to colored HTML.
 * Auto-scrolls to bottom as new lines arrive.
 */
export function ConsoleView({ lines, isStreaming }: ConsoleViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  // Convert all lines to HTML with ANSI color codes
  const html = lines.length > 0 ? ansiUp.ansi_to_html(lines.join('\n')) : '';

  return (
    <div className="space-y-2">
      {/* Console Output */}
      <div
        ref={containerRef}
        data-testid="console-output"
        className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-y-auto max-h-[400px] text-xs font-mono leading-relaxed"
      >
        {lines.length === 0 ? (
          <div className="text-zinc-500 italic">Waiting for output...</div>
        ) : (
          <pre
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {/* Streaming cursor indicator */}
        {isStreaming && lines.length > 0 && (
          <span className="inline-block w-2 h-3 bg-zinc-100 ml-1 animate-pulse"></span>
        )}
      </div>

      {/* Footer with line count */}
      {lines.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {lines.length} {lines.length === 1 ? 'line' : 'lines'}
        </div>
      )}
    </div>
  );
}
