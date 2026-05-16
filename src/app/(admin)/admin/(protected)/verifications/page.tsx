import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { getServerClient } from '@/utils/supabase/server';
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server';
import { signImageDeliveryUrl } from '@/lib/cloudflare/images';
import { getTranslations } from 'next-intl/server';
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
  idDocumentCfId: string | null;
  photos: { slot: number; cf_image_id: string }[];
}

// Verification photos and ID documents are uploaded with requireSignedURLs=true,
// so we mint short-lived signed delivery URLs (HMAC-SHA256) for admin viewing.

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
  const t = await getTranslations('admin.verifications');

  const sb = await getServerClient();
  // Two-step fetch: PostgREST embedded resources require an FK in the same
  // schema, and even with the new FK in place we want to be resilient to
  // schema-cache lag. Fetch requests, then load profiles by user_id and merge.
  const { data: requests, error } = await sb
    .from('verification_requests')
    .select('id, user_id, status, submitted_at, reviewed_at, rejection_reason, admin_notes')
    .eq('status', status)
    .order('submitted_at', { ascending: false })
    .limit(100);

  let rows: VerificationListRow[] = [];
  const signedUrls = new Map<string, string>();

  if (requests && requests.length > 0) {
    const requestIds = requests.map((r) => r.id);
    const userIds = Array.from(new Set(requests.map((r) => r.user_id)));

    const [{ data: profiles }, { data: idDocs }, { data: vphotos }] = await Promise.all([
      sb
        .from('profiles')
        .select(
          'id, username, first_name, last_name, avatar_url, birth_date, birth_place, residence_country, residence_state, residence_city, study_place, work_place',
        )
        .in('id', userIds),
      // RLS on id_documents only allows admins to SELECT. We're already admin-gated
      // by the redirect above, so this returns full data.
      sb
        .from('id_documents')
        .select('request_id, cf_image_id, uploaded_at')
        .in('request_id', requestIds)
        .order('uploaded_at', { ascending: false }),
      sb
        .from('verification_photos')
        .select('user_id, slot, cf_image_id')
        .in('user_id', userIds)
        .order('slot', { ascending: true }),
    ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const idDocByRequest = new Map<string, string>();
    (idDocs ?? []).forEach((d: { request_id: string; cf_image_id: string }) => {
      // First seen wins (we ordered by uploaded_at desc, so it's the latest).
      if (!idDocByRequest.has(d.request_id)) idDocByRequest.set(d.request_id, d.cf_image_id);
    });
    const photosByUser = new Map<string, { slot: number; cf_image_id: string }[]>();
    (vphotos ?? []).forEach((p: { user_id: string; slot: number; cf_image_id: string }) => {
      const arr = photosByUser.get(p.user_id) ?? [];
      arr.push({ slot: p.slot, cf_image_id: p.cf_image_id });
      photosByUser.set(p.user_id, arr);
    });

    rows = requests.map((r) => ({
      ...r,
      profiles: (profileById.get(r.user_id) ?? null) as VerificationListRow['profiles'],
      idDocumentCfId: idDocByRequest.get(r.id) ?? null,
      photos: photosByUser.get(r.user_id) ?? [],
    }));

    // Mint signed URLs in parallel (one signing key fetch up front, then HMAC is local).
    const allCfIds = new Set<string>();
    rows.forEach((r) => {
      if (r.idDocumentCfId) allCfIds.add(r.idDocumentCfId);
      r.photos.forEach((p) => allCfIds.add(p.cf_image_id));
    });
    await Promise.all(
      Array.from(allCfIds).map(async (cfId) => {
        try {
          signedUrls.set(cfId, await signImageDeliveryUrl(cfId, { expirySeconds: 60 * 30 }));
        } catch {
          // Skip — admin will see a broken image and can request manual review.
        }
      }),
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('subtitle')}
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
              {s === 'pending' ? t('tabPending') : s === 'approved' ? t('tabApproved') : t('tabRejected')}
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
          {t('emptyNoRequests', { status })}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <VerificationRow
              key={row.id}
              row={row}
              idDocumentUrl={row.idDocumentCfId ? (signedUrls.get(row.idDocumentCfId) ?? null) : null}
              photoUrls={row.photos
                .map((p) => ({ slot: p.slot, url: signedUrls.get(p.cf_image_id) ?? '' }))
                .filter((x) => x.url)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
