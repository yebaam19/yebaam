'use client';

import { CheckBadgeIcon, ShieldCheckIcon } from '@/components/icons/heroicons-shim';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/utils/supabase/client';
import VerifyProfileDialog from './VerifyProfileDialog';
import type { VerificationStatus } from '../types';

interface Props {
  ownerUserId: string;
}

interface State {
  status: VerificationStatus;
  isVerified: boolean;
  uniqueIdCode: string | null;
  pioneerNumber: number | null;
  rejectionReason: string | null;
  checklist: { requiredInfo: boolean; photos: number; terms: boolean; pending: boolean };
}

export default function CompleteAuthenticationBanner({ ownerUserId }: Props) {
  const t = useTranslations('verification.banner');
  const [state, setState] = useState<State | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [profileRes, photosRes, pendingRes, rejectedRes] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'verification_status, is_verified, unique_id_code, pioneer_number, terms_accepted_at, birth_place, birth_date, residence_country, residence_state, residence_city, study_place, work_place, first_name, last_name',
        )
        .eq('id', ownerUserId)
        .maybeSingle(),
      supabase
        .from('verification_photos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ownerUserId),
      supabase
        .from('verification_requests')
        .select('id')
        .eq('user_id', ownerUserId)
        .eq('status', 'pending')
        .maybeSingle(),
      supabase
        .from('verification_requests')
        .select('rejection_reason')
        .eq('user_id', ownerUserId)
        .eq('status', 'rejected')
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const profile = profileRes.data;
    if (!profile) return;
    const requiredInfo = Boolean(
      profile.first_name &&
        profile.last_name &&
        profile.birth_date &&
        profile.birth_place &&
        profile.residence_country &&
        profile.residence_state &&
        profile.residence_city &&
        profile.study_place &&
        profile.work_place,
    );
    setState({
      status: (profile.verification_status as VerificationStatus) ?? 'unstarted',
      isVerified: profile.is_verified ?? false,
      uniqueIdCode: profile.unique_id_code,
      pioneerNumber: profile.pioneer_number,
      rejectionReason: rejectedRes.data?.rejection_reason ?? null,
      checklist: {
        requiredInfo,
        photos: photosRes.count ?? 0,
        terms: Boolean(profile.terms_accepted_at),
        pending: Boolean(pendingRes.data),
      },
    });
  }, [ownerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!state) return null;
  if (state.isVerified) {
    // Once verified, this banner is celebratory; don't camp on the profile forever.
    // Dismissed state is keyed per user so multiple users on the same device don't
    // see each other's "already dismissed" state.
    const dismissKey = `yebaam.verifBanner.dismissed.${ownerUserId}`;
    if (typeof window !== 'undefined' && window.localStorage.getItem(dismissKey) === '1') {
      return null;
    }
    return (
      <div className="mx-auto mt-3 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 pr-10 text-emerald-900 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          <button
            type="button"
            aria-label={t('dismissAria')}
            title={t('dismissAria')}
            onClick={() => {
              if (typeof window !== 'undefined') window.localStorage.setItem(dismissKey, '1');
              setState(null);
            }}
            className="absolute top-2 right-2 rounded-full p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <CheckBadgeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-semibold">{t('verifiedTitle')}</div>
              <div className="text-sm">
                {state.pioneerNumber
                  ? t('verifiedWithPioneer', { n: state.pioneerNumber })
                  : ''}
                {t('verifiedUniqueId')} <span className="font-mono">{state.uniqueIdCode ?? '—'}</span>
              </div>
            </div>
          </div>
          {state.uniqueIdCode && (
            <a
              href={`/verification/certificate/${state.uniqueIdCode}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('downloadId')}
            </a>
          )}
        </div>
        <p className="mt-1 text-right text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
          {t('reopenHint')}
        </p>
      </div>
    );
  }

  const c = state.checklist;
  const items: { key: string; label: string; done: boolean }[] = [
    { key: 'info', label: t('checklistInfo'), done: c.requiredInfo },
    { key: 'photos', label: t('checklistPhotos', { current: Math.min(c.photos, 5) }), done: c.photos >= 5 },
    { key: 'terms', label: t('checklistTerms'), done: c.terms },
    { key: 'doc', label: t('checklistDocument'), done: c.pending },
  ];

  return (
    <>
      <div className="mx-auto mt-3 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-6 w-6 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  {state.status === 'pending'
                    ? t('statusPending')
                    : state.status === 'rejected'
                    ? t('statusRejected')
                    : t('statusUnstarted')}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-yellow-700"
                >
                  {state.status === 'pending'
                    ? t('actionPending')
                    : state.status === 'rejected'
                    ? t('actionRejected')
                    : t('actionUnstarted')}
                </button>
              </div>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                {t('intro')}
              </p>
              {state.status === 'rejected' && state.rejectionReason && (
                <p className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {t('rejectionReason', { reason: state.rejectionReason })}
                </p>
              )}
              <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {items.map((it) => (
                  <li
                    key={it.key}
                    className={`flex items-center gap-2 text-xs ${it.done ? 'text-emerald-700 dark:text-emerald-400' : 'text-yellow-900 dark:text-yellow-200'}`}
                  >
                    <span
                      aria-hidden
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${it.done ? 'bg-emerald-500 text-white' : 'border border-yellow-400 bg-white text-yellow-700'}`}
                    >
                      {it.done ? '✓' : ''}
                    </span>
                    {it.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <VerifyProfileDialog
        open={open}
        onClose={() => {
          setOpen(false);
          void refresh();
        }}
        ownerUserId={ownerUserId}
      />
    </>
  );
}
