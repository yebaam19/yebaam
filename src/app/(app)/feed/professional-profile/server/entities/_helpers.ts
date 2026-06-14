import 'server-only';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { revalidateProfile } from '../entities.utils';

/**
 * Internal infrastructure for the professional-profile entity actions: the
 * ActionResult envelope, the owner gate, the generic owned insert/update/delete
 * mutators, and the credential drift-review logic. NOT a `'use server'` module —
 * these are server-only helpers that the per-entity action files import.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Resolve the service-role client IF the authenticated user owns `profileId`.
 * Returns `{ client: null }` for anonymous callers or non-owners — every action
 * below rejects on that with `'No autorizado'`. Exported because
 * `credentials.actions.ts` reuses the same ownership gate.
 */
export async function requireOwner(
  profileId: string,
): Promise<{ client: SupabaseClient | null; userId: string | null }> {
  const authClient = await getServerClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth?.user) return { client: null, userId: null };

  const db = getServiceClient();
  const { data: owner } = await db
    .from('professional_profiles')
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();
  if (!owner || (owner as { user_id: string }).user_id !== auth.user.id) {
    return { client: null, userId: null };
  }
  return { client: db, userId: auth.user.id };
}

export function revalidate() {
  revalidateProfile();
}

export function normFocuses(focuses: string[] | null | undefined): string[] {
  return (focuses ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 12);
}

// ---------------------------------------------------------------------------
// Generic owner-gated mutators. Each child entity's add/update/delete is a thin
// wrapper over these — the only per-entity bits are the table, the column
// payload, and (for add) the row→domain mapper.
// ---------------------------------------------------------------------------

export async function ownedInsert<Row, T>(
  profileId: string,
  table: string,
  values: Record<string, unknown>,
  map: (row: Row) => T,
  errorLabel: string,
): Promise<ActionResult<T>> {
  const { client } = await requireOwner(profileId);
  if (!client) return { ok: false, error: 'No autorizado' };

  const { data: row, error } = await client
    .from(table)
    .insert({ professional_profile_id: profileId, ...values })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? errorLabel };
  revalidate();
  return { ok: true, data: map(row as Row) };
}

export async function ownedUpdate(
  profileId: string,
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<ActionResult> {
  const { client } = await requireOwner(profileId);
  if (!client) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from(table)
    .update(patch)
    .eq('id', id)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function ownedDelete(
  profileId: string,
  table: string,
  id: string,
): Promise<ActionResult> {
  const { client } = await requireOwner(profileId);
  if (!client) return { ok: false, error: 'No autorizado' };

  const { error } = await client
    .from(table)
    .delete()
    .eq('id', id)
    .eq('professional_profile_id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Credential drift (titles + studies only). When a material field changes on an
// already-approved credential, a BEFORE UPDATE trigger flips the row to
// 'review_needed'; we mirror that by opening a review request carrying the prior
// verified snapshot + evidence so admins can compare.
// ---------------------------------------------------------------------------

export function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

export type TitleSnapshotFields = {
  name: string | null;
  category: string | null;
  distinction: string | null;
  institution: string | null;
  year: number | null;
};

export type StudySnapshotFields = {
  name: string | null;
  study_type: string | null;
  institution: string | null;
  year: number | null;
};

export function titleDrifted(prev: TitleSnapshotFields, next: TitleSnapshotFields): boolean {
  return (
    norm(prev.name) !== norm(next.name) ||
    (prev.category ?? '') !== (next.category ?? '') ||
    (prev.distinction ?? '') !== (next.distinction ?? '') ||
    norm(prev.institution) !== norm(next.institution) ||
    (prev.year ?? null) !== (next.year ?? null)
  );
}

export function studyDrifted(prev: StudySnapshotFields, next: StudySnapshotFields): boolean {
  return (
    norm(prev.name) !== norm(next.name) ||
    (prev.study_type ?? '') !== (next.study_type ?? '') ||
    norm(prev.institution) !== norm(next.institution) ||
    (prev.year ?? null) !== (next.year ?? null)
  );
}

export type DriftRow = {
  name: string | null;
  institution: string | null;
  year: number | null;
  credential_status: string;
  verified_snapshot: Record<string, unknown> | null;
  diploma_cf_image_id: string | null;
};
export type TitleDriftRow = DriftRow & { category: string | null; distinction: string | null };
export type StudyDriftRow = DriftRow & { study_type: string | null };

export async function openCredentialDriftReview(
  client: SupabaseClient,
  opts: {
    kind: 'title' | 'study';
    idColumn: 'title_id' | 'study_id';
    rowId: string;
    userId: string;
    diplomaCfImageId: string | null;
    verifiedSnapshot: Record<string, unknown> | null;
    fallbackSnapshot: Record<string, unknown>;
  },
): Promise<void> {
  // No evidence on file → nothing to attach, but the admin queue still needs to
  // know the row drifted, so revalidate below regardless.
  if (opts.diplomaCfImageId) {
    const { data: existing } = await client
      .from('professional_credential_requests')
      .select('id')
      .eq('target_kind', opts.kind)
      .eq(opts.idColumn, opts.rowId)
      .in('status', ['pending', 'review_needed'])
      .maybeSingle();
    if (!existing) {
      await client.from('professional_credential_requests').insert({
        user_id: opts.userId,
        target_kind: opts.kind,
        [opts.idColumn]: opts.rowId,
        evidence_cf_image_id: opts.diplomaCfImageId,
        mime_type: null,
        submitted_snapshot: opts.verifiedSnapshot ?? opts.fallbackSnapshot,
        status: 'review_needed',
      });
    }
  }
  revalidatePath('/admin/professional-credentials');
}
