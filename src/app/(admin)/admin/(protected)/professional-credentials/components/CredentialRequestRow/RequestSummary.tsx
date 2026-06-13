import Link from 'next/link';
import {
  categoryLabel,
  distinctionLabel,
  studyTypeLabel,
} from '@/features/professional-profile/lib/credentials';
import type {
  StudyType,
  TitleCategory,
  TitleDistinction,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

type Status = 'pending' | 'review_needed' | 'approved' | 'rejected';

interface RequestRow {
  id: string;
  user_id: string;
  target_kind: 'title' | 'study';
  title_id: string | null;
  study_id: string | null;
  evidence_cf_image_id: string;
  submitted_snapshot: Record<string, unknown>;
  status: Status;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface TargetTitleRow {
  id: string;
  name: string;
  category: string | null;
  distinction: string | null;
  institution: string | null;
  year: number | null;
  focuses: string[] | null;
  credential_status: string;
}

interface TargetStudyRow {
  id: string;
  name: string;
  study_type: string | null;
  institution: string | null;
  year: number | null;
  focuses: string[] | null;
  credential_status: string;
}

interface Props {
  request: RequestRow;
  profile: ProfileRow | null;
  title: TargetTitleRow | null;
  study: TargetStudyRow | null;
  fullName: string;
}

export default function RequestSummary({ request, profile, title, study, fullName }: Props) {
  const composedTarget = (() => {
    if (title) {
      const cat = categoryLabel((title.category as TitleCategory | null) ?? null);
      const dist = distinctionLabel((title.distinction as TitleDistinction | null) ?? null);
      const head = cat ? `${cat} en ${title.name}` : title.name;
      const parts = [head];
      if (dist) parts.push(dist);
      if (title.institution) parts.push(title.institution);
      if (title.year != null) parts.push(String(title.year));
      return parts.join(', ');
    }
    if (study) {
      const t = studyTypeLabel((study.study_type as StudyType | null) ?? null);
      const head = t ? `${t}: ${study.name}` : study.name;
      const parts = [head];
      if (study.institution) parts.push(study.institution);
      if (study.year != null) parts.push(String(study.year));
      return parts.join(', ');
    }
    return '(elemento no encontrado)';
  })();

  const focuses = title?.focuses ?? study?.focuses ?? [];

  return (
    <div className="flex flex-1 items-start gap-3">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-neutral-200" />
      )}
      <div className="flex-1">
        <Link
          href={profile?.username ? `/${profile.username}` : '#'}
          className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
        >
          {fullName}
        </Link>
        {profile?.username && (
          <span className="ml-2 text-sm text-neutral-500">@{profile.username}</span>
        )}
        <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
          {request.target_kind === 'title' ? 'Título' : 'Estudio'}
        </p>
        <p className="mt-1 text-sm text-neutral-800 dark:text-neutral-200">{composedTarget}</p>
        {focuses.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {focuses.map((f) => (
              <span
                key={f}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
              >
                {f}
              </span>
            ))}
          </div>
        )}
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
          <div>
            <dt className="inline font-medium">Enviada:</dt>{' '}
            <dd className="inline">{new Date(request.submitted_at).toLocaleString('es-ES')}</dd>
          </div>
          {request.reviewed_at && (
            <div>
              <dt className="inline font-medium">Revisada:</dt>{' '}
              <dd className="inline">{new Date(request.reviewed_at).toLocaleString('es-ES')}</dd>
            </div>
          )}
          {request.rejection_reason && (
            <div className="sm:col-span-2">
              <dt className="inline font-medium text-red-600">Motivo rechazo:</dt>{' '}
              <dd className="inline">{request.rejection_reason}</dd>
            </div>
          )}
          {request.admin_notes && (
            <div className="sm:col-span-2">
              <dt className="inline font-medium">Notas:</dt>{' '}
              <dd className="inline">{request.admin_notes}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
