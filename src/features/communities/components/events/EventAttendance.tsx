'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { setEventAttendance } from '../../actions/events/read-attendance.actions';
import { PlanFeedback } from '../plans/PlanFeedback';
export function EventAttendance({ eventId, signedIn, initialAttending, allowed }: { eventId: string; signedIn: boolean; initialAttending: boolean; allowed: boolean }) {
  const t = useTranslations('communities.events'); const [attending, setAttending] = useState(initialAttending);
  const [pending, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  if (!signedIn) return <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('signIn')}</p>;
  return <div className="space-y-2">
    {attending && <p role="status" className="text-sm font-medium text-primary-800 dark:text-primary-300">{t('attending')}</p>}
    {(allowed || attending) ? <Button color="brand" disabled={pending} onClick={() => {
      setError(null); startTransition(async () => {
        try { const result = await setEventAttendance({ eventId, attending: !attending });
          if (!result.ok) { setError(result.error); return; } setAttending(result.data.attending);
        } catch { setError(t('attendanceError')); }
      });
    }}>{t(pending ? 'saving' : attending ? 'withdraw' : 'attend')}</Button> : <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('attendanceClosed')}</p>}
    <PlanFeedback error={error} />
  </div>;
}
