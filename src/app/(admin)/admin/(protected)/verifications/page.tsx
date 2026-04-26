import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { getServerClient } from '@/utils/supabase/server';
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server';
import VerificationRow from './components/VerificationRow';

export const metadata = { title: 'Admin · Verificaciones' };

interface VerificationListRow {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  profiles: {
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
  } | null;
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Verification queue contains PII (DOB, residence, work, study) and signed
  // links to ID documents. The parent layout admits forum-global moderators,
  // who must NOT see this. Restrict to platform_admins specifically.
  if (!(await isPlatformAdmin())) redirect('/admin' as Route);

  const sp = await searchParams;
  const status = sp.status === 'approved' || sp.status === 'rejected' ? sp.status : 'pending';

  const sb = await getServerClient();
  const { data, error } = await sb
    .from('verification_requests')
    .select(
      'id, user_id, status, submitted_at, reviewed_at, rejection_reason, admin_notes, profiles!inner(username, first_name, last_name, avatar_url, birth_date, birth_place, residence_country, residence_state, residence_city, study_place, work_place)',
    )
    .eq('status', status)
    .order('submitted_at', { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as VerificationListRow[];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Verificaciones de perfil
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Revisa los documentos de identidad y aprueba o rechaza las solicitudes.
          </p>
        </div>
        <nav className="flex gap-1 text-sm">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <a
              key={s}
              href={`/admin/verifications?status=${s}`}
              className={`rounded-md px-3 py-1.5 ${
                s === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}
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
          No hay solicitudes en estado “{status}”.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <VerificationRow key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
