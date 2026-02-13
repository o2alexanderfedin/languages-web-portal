import { useGetQueueStatusQuery } from './executionApi';

export function QueueStatus() {
  const { data } = useGetQueueStatusQuery(undefined, { pollingInterval: 3000 });

  // Only render if there are jobs in the queue or running
  if (!data?.data) {
    return null;
  }

  const { position, pending, concurrency, estimatedWaitSec } = data.data;

  // Don't show if queue is empty
  if (position === 0 && pending < concurrency) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
      Queue: {position} waiting | {pending} running | Est. wait: {estimatedWaitSec}s
    </div>
  );
}
