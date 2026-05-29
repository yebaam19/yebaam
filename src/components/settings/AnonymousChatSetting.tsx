'use client';

import { Switch } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { anonymousChatService } from '@/features/anonymous-chat/services/anonymous-chat.service';
import { isUnder13, resolveAnonChatEnabled } from '@/lib/age';

/**
 * "Permitir conversaciones anónimas" toggle.
 *
 * Default ON for 13+, locked OFF for under-13 (and unknown birth dates). The
 * switch IS the minor's unlock action — flipping it on records an explicit
 * `allow_anonymous_chats = true`. The server re-checks this on every invite, so
 * the toggle is convenience, not the security boundary.
 */
export default function AnonymousChatSetting() {
  const t = useTranslations('chat.anonymous.settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allow, setAllow] = useState<boolean | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    anonymousChatService
      .getMySetting()
      .then((s) => {
        if (cancelled) return;
        setAllow(s.allow);
        setBirthDate(s.birthDate);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const minor = isUnder13(birthDate);
  const enabled = resolveAnonChatEnabled(allow, birthDate);

  const handleToggle = async (next: boolean) => {
    const prev = allow;
    setAllow(next); // optimistic
    setSaving(true);
    try {
      await anonymousChatService.setMySetting(next);
      toast.success(t('saved'));
    } catch {
      setAllow(prev);
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('label')}</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{t('description')}</p>
          {minor && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">{t('lockedMinor')}</p>
          )}
        </div>
        <Switch
          checked={enabled}
          onChange={handleToggle}
          disabled={loading || saving}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
            enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700',
            (loading || saving) && 'opacity-50',
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </Switch>
      </header>
    </section>
  );
}
