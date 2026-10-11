'use client';

import { useResolvedViewer } from '@/features/auth/hooks/useResolvedViewer';
import { coalescePending } from '@/lib/coalesce-pending';
import { useEffect,useState } from 'react';

type PreviewState<T> = T | null | 'loading' | 'error';

/** Coalesce concurrent reads without sharing completed private previews across viewers. */
export function useLinkPreview<T>(key: string, load: () => Promise<T | null>): PreviewState<T> {
  const { viewerId, isReady } = useResolvedViewer();
  const requestKey = JSON.stringify([key, viewerId]);
  const [result, setResult] = useState<{ key: string; data: PreviewState<T> } | null>(null);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    coalescePending(requestKey, load).then(
      (data) => { if (!cancelled) setResult({ key: requestKey, data }); },
      () => { if (!cancelled) setResult({ key: requestKey, data: 'error' }); },
    );
    return () => { cancelled = true; };
  }, [requestKey, isReady, load]);

  return isReady && result?.key === requestKey ? result.data : 'loading';
}
