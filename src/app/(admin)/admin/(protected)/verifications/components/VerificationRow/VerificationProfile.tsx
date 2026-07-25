import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Profile {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  birth_place: string | null;
  residence_country: string | null;
  residence_state: string | null;
  residence_city: string | null;
  study_place: string | null;
  work_place: string | null;
}

interface Props {
  profile: Profile | null;
  fullName: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

/** Presentational identity + submitted-details block for a single verification
 *  request. Pure render — no state, no interactivity beyond the profile link. */
export function VerificationProfile({
  profile: p,
  fullName,
  submittedAt,
  reviewedAt,
  rejectionReason,
}: Props) {
  const t = useTranslations('admin.verifications');
  return (
    <div className="flex flex-1 items-start gap-3">
      {p?.avatar_url ? (
        <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" decoding="async" loading="lazy" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-neutral-200" />
      )}
      <div className="flex-1">
        <Link
          href={p?.username ? `/${p.username}` : '#'}
          className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
        >
          {fullName}
        </Link>
        {p?.username && <span className="ml-2 text-sm text-neutral-500">@{p.username}</span>}
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
          <div>
            <dt className="inline font-medium">{t('rowBirth')}</dt>{' '}
            <dd className="inline">
              {p?.birth_date ?? '—'} {p?.birth_place ? `· ${p.birth_place}` : ''}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">{t('rowResidence')}</dt>{' '}
            <dd className="inline">
              {[p?.residence_city, p?.residence_state, p?.residence_country].filter(Boolean).join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">{t('rowStudy')}</dt>{' '}
            <dd className="inline">{p?.study_place ?? '—'}</dd>
          </div>
          <div>
            <dt className="inline font-medium">{t('rowWork')}</dt>{' '}
            <dd className="inline">{p?.work_place ?? '—'}</dd>
          </div>
          <div>
            <dt className="inline font-medium">{t('rowSubmitted')}</dt>{' '}
            <dd className="inline">{new Date(submittedAt).toLocaleString('es-ES')}</dd>
          </div>
          {reviewedAt && (
            <div>
              <dt className="inline font-medium">{t('rowReviewed')}</dt>{' '}
              <dd className="inline">{new Date(reviewedAt).toLocaleString('es-ES')}</dd>
            </div>
          )}
          {rejectionReason && (
            <div className="sm:col-span-2">
              <dt className="inline font-medium text-red-600">{t('rowRejectionReason')}</dt>{' '}
              <dd className="inline">{rejectionReason}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
