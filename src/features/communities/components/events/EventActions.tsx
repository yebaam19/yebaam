'use client';
import { useEffect, useRef, useState, useTransition, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { changeCommunityEvent } from '../../actions/events/write.actions';
import type { CommunityEvent } from '../../types/communityEvent.types';
import { PlanFeedback } from '../plans/PlanFeedback';
export function EventActions({ event, slug }: { event: CommunityEvent; slug: string }) {
  const t = useTranslations('communities.events'); const router = useRouter();
  const [operation, setOperation] = useState<'cancel' | 'archive' | null>(null);
  const [pending, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  const editButton = useRef<HTMLButtonElement | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef<HTMLButtonElement | null>(null);
  const confirmButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (operation) confirmButton.current?.focus(); }, [operation]);
  useEffect(() => {
    if (!operation && !pending && restoreFocus.current) {
      restoreFocus.current.focus(); restoreFocus.current = null;
    }
  }, [operation, pending]);
  return <div className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
    <div className="flex flex-wrap gap-2">
      <Button ref={editButton} outline disabled={pending || operation !== null} onClick={() => router.push(`/feed/comunidades/${slug}/eventos/${event.id}/editar` as Route)}>{t('edit')}</Button>
      {!event.is_cancelled && <Button outline disabled={pending || operation !== null} onClick={(e: MouseEvent<HTMLButtonElement>) => { opener.current = e.currentTarget; setOperation('cancel'); }}>{t('cancelEvent')}</Button>}
      <Button plain disabled={pending || operation !== null} onClick={(e: MouseEvent<HTMLButtonElement>) => { opener.current = e.currentTarget; setOperation('archive'); }}>{t('deleteEvent')}</Button>
    </div>
    {operation && <div className="space-y-3">
      <p className="text-sm">{t(operation === 'cancel' ? 'cancelConfirm' : 'deleteConfirm')}</p>
      <div className="flex flex-wrap gap-2"><Button ref={confirmButton} color="brand" disabled={pending} onClick={() => {
        setError(null); startTransition(async () => {
          try {
            const result = await changeCommunityEvent({ communityId: event.community_id, id: event.id, expectedVersion: event.version, operation, confirmed: true });
            if (!result.ok) { setError(result.error); return; }
            if (operation === 'archive') router.push(`/feed/comunidades/${slug}/eventos` as Route);
            if (operation === 'cancel') restoreFocus.current = editButton.current;
            setOperation(null); router.refresh();
          } catch { setError(t('saveError')); }
        });
      }}>{t('confirm')}</Button><Button outline disabled={pending} onClick={() => { restoreFocus.current = opener.current; setOperation(null); }}>{t('back')}</Button></div>
    </div>}
    <PlanFeedback error={error} />
  </div>;
}
