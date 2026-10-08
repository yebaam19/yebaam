'use client';

import { useEffect, useRef } from 'react';
import { usePlanInteraction } from '../components/plans/PlanInteractionProvider';

export function useEditorReturnFocus(editorId: string) {
  const { editor, busy } = usePlanInteraction();
  const opener = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (editor === editorId) wasOpen.current = true;
    else if (wasOpen.current && !busy) {
      opener.current?.focus(); wasOpen.current = false;
    }
  }, [editor, busy, editorId]);
  return opener;
}
