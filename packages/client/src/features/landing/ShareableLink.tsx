import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';

interface ShareableLinkProps {
  toolId: string | null;
}

export function ShareableLink({ toolId }: ShareableLinkProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const shareableUrl = toolId
    ? `${window.location.origin}/demo?tool=${toolId}`
    : '';

  const handleCopy = async () => {
    if (!shareableUrl) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
        setCopyStatus('copied');
      } else {
        // Fallback for older browsers
        const input = document.getElementById('shareable-url-input') as HTMLInputElement;
        if (input) {
          input.select();
          const success = document.execCommand('copy');
          if (success) {
            setCopyStatus('copied');
          } else {
            console.error('Fallback copy failed');
          }
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Reset "Copied!" status after 2 seconds
  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const isDisabled = !toolId;

  return (
    <div
      className={clsx(
        'flex flex-row items-center gap-3 border rounded-lg p-3',
        isDisabled
          ? 'bg-muted/50 border-muted'
          : 'bg-card border-border',
      )}
    >
      <input
        id="shareable-url-input"
        type="text"
        readOnly
        value={shareableUrl}
        placeholder="Select a tool to generate a shareable link"
        className={clsx(
          'flex-1 px-3 py-2 text-sm rounded-md border bg-background',
          isDisabled
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-input',
        )}
        disabled={isDisabled}
      />
      <Button
        onClick={handleCopy}
        disabled={isDisabled}
        variant="outline"
        size="sm"
        className="min-w-[100px]"
      >
        {copyStatus === 'copied' ? 'Copied!' : 'Copy Link'}
      </Button>
    </div>
  );
}
