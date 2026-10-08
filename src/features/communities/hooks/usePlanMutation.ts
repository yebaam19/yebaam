'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ActionResult } from '../actions/_shared';
import { usePlanInteraction } from '../components/plans/PlanInteractionProvider';

export function usePlanMutation(editorId?: string) {
  const router = useRouter();
  const t = useTranslations('communities.plans');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const interaction = usePlanInteraction();
  const ownsMutation = useRef(false);
  const { endMutation } = interaction;
  useEffect(() => {
    if (!pending && ownsMutation.current) { ownsMutation.current = false; endMutation(); }
  }, [pending, endMutation]);

  function run<T>(action: () => Promise<ActionResult<T>>, onSuccess?: (data: T) => void) {
    if (!interaction.beginMutation(editorId)) return;
    ownsMutation.current = true;
    setError(null);
    setStatus('');
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) { setError(result.error); return; }
        setStatus(t('saved'));
        onSuccess?.(result.data);
        router.refresh();
      } catch {
        setError(t('requestError'));
      }
    });
  }

  const blocked = pending || interaction.busy || (!!interaction.editor && interaction.editor !== editorId);
  return { run, pending, blocked, error, status };
}
