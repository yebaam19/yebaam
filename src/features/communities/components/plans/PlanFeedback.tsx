'use client';

export function PlanFeedback({ error, status }: { error?: string | null; status?: string }) {
  return <>
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    <p role="status" className="mt-2 text-sm text-gray-600 dark:text-gray-300">{status}</p>
  </>;
}
