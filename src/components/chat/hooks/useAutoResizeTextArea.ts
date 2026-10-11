import { useLayoutEffect, useRef } from 'react';

/** Auto-resize helper for multiline textarea. */
export function useAutoResizeTextArea(value: string, maxPx: number, minRows = 1) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lh = Number.parseFloat(getComputedStyle(ta).lineHeight) || 18;
    const minH = minRows * lh + 14;
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, minH), maxPx)}px`;
  }, [value, maxPx, minRows]);

  return ref;
}

