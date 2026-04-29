import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { getServerClient } from '@/utils/supabase/server';
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server';
import CredentialRequestRow from './components/CredentialRequestRow';

export const metadata = { title: 'Admin · Credenciales Profesionales' };

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

function cfUrl(hash: string, id: string) {
  return `https://imagedelivery.net/${hash}/${id}/public`;
}

function isStatus(v: string | undefined): v is Status {
  return v === 'pending' || v === 'review_needed' || v === 'approved' || v === 'rejected';
}

export default async function AdminProfessionalCredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isPlatformAdmin())) redirect('/admin' as Route);

  const sp = await searchParams;
  const status: Status = isStatus(sp.status) ? sp.status : 'pending';

  const sb = await getServerClient();
  const { data: requests, error } = await sb
    .from('professional_credential_requests')
    .select(
      'id, user_id, target_kind, title_id, study_id, evidence_cf_image_id, submitted_snapshot, status, submitted_at, reviewed_at, admin_notes, rejection_reason',
    )
    .eq('status', status)
    .order('submitted_at', { ascending: false })
    .limit(100);

  const cfHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

  let rows: Array<{
    request: RequestRow;
    profile: ProfileRow | null;
    title: TargetTitleRow | null;
    study: TargetStudyRow | null;
    evidenceUrl: string;
  }> = [];

  if (requests && requests.length > 0) {
    const list = requests as RequestRow[];
    const userIds = Array.from(new Set(list.map((r) => r.user_id)));
    const titleIds = list.filter((r) => r.target_kind === 'title' && r.title_id).map((r) => r.title_id!);
    const studyIds = list.filter((r) => r.target_kind === 'study' && r.study_id).map((r) => r.study_id!);

    const [{ data: profiles }, { data: titles }, { data: studies }] = await Promise.all([
      sb
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url')
        .in('id', userIds),
      titleIds.length
        ? sb
            .from('professional_profile_titles')
            .select('id, name, category, distinction, institution, year, focuses, credential_status')
            .in('id', titleIds)
        : Promise.resolve({ data: [] as TargetTitleRow[] }),
      studyIds.length
        ? sb
            .from('professional_profile_studies')
            .select('id, name, study_type, institution, year, focuses, credential_status')
            .in('id', studyIds)
        : Promise.resolve({ data: [] as TargetStudyRow[] }),
    ]);

    const profileById = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));
    const titleById = new Map(((titles ?? []) as TargetTitleRow[]).map((t) => [t.id, t]));
    const studyById = new Map(((studies ?? []) as TargetStudyRow[]).map((s) => [s.id, s]));

    rows = list.map((r) => ({
      request: r,
      profile: profileById.get(r.user_id) ?? null,
      title: r.target_kind === 'title' && r.title_id ? titleById.get(r.title_id) ?? null : null,
      study: r.target_kind === 'study' && r.study_id ? studyById.get(r.study_id) ?? null : null,
      evidenceUrl: cfHash ? cfUrl(cfHash, r.evidence_cf_image_id) : '',
    }));
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Credenciales profesionales
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Revisa los diplomas de títulos y estudios y aprueba, rechaza o decide ediciones materiales.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1 text-sm">
          {(['pending', 'review_needed', 'approved', 'rejected'] as const).map((s) => (
            <a
              key={s}
              href={`/admin/professional-credentials?status=${s}`}
              className={`rounded-md px-3 py-1.5 ${
                s === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {s === 'pending'
                ? 'Pendientes'
                : s === 'review_needed'
                  ? 'Revisión por edición'
                  : s === 'approved'
                    ? 'Aprobadas'
                    : 'Rechazadas'}
            </a>
          ))}
        </nav>
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          No hay solicitudes en estado &ldquo;{status}&rdquo;.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <CredentialRequestRow
              key={r.request.id}
              request={r.request}
              profile={r.profile}
              title={r.title}
              study={r.study}
              evidenceUrl={r.evidenceUrl}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
