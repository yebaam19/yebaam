import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlusIcon, UserGroupIcon } from '@/components/icons/heroicons-shim';
import { getServerClient } from '@/utils/supabase/server';
import {
  listMyFamilies,
  listMyPendingFamilyInvitations,
} from '@/features/families/server/families.server';
import { FamilyCard } from '@/features/families/components/FamilyCard';
import {
  FamilyInvitationCard,
  type FamilyInvitationViewModel,
} from '@/features/families/components/FamilyInvitationCard';

export async function generateMetadata() {
  const t = await getTranslations('familias');
  return { title: t('metadata.listTitle') };
}

export default async function FamiliasPage() {
  const t = await getTranslations('familias');
  const client = await getServerClient();
  const { data: userRes } = await client.auth.getUser();
  if (!userRes.user) redirect('/login?redirect=/feed/familias');

  const [families, pending] = await Promise.all([
    listMyFamilies(),
    listMyPendingFamilyInvitations(),
  ]);

  let inviteVms: FamilyInvitationViewModel[] = [];
  if (pending.length > 0) {
    const familyIds = pending.map((p) => p.family_id);
    const inviterIds = pending.map((p) => p.invited_by);
    const [familiesRes, profilesRes] = await Promise.all([
      client.from('families').select('id, name, slug').in('id', familyIds),
      client.from('profiles').select('id, username, first_name, last_name').in('id', inviterIds),
    ]);
    const familyById = new Map(
      (familiesRes.data ?? []).map((f) => [
        f.id as string,
        { name: f.name as string, slug: f.slug as string },
      ]),
    );
    const profileById = new Map(
      (profilesRes.data ?? []).map((p) => [
        p.id as string,
        [p.first_name, p.last_name].filter(Boolean).join(' ') || (p.username as string) || t('invitation.fallbackInviter'),
      ]),
    );
    inviteVms = pending.map((p) => ({
      id: p.id,
      familyName: familyById.get(p.family_id)?.name ?? t('invitation.fallbackFamily'),
      familySlug: familyById.get(p.family_id)?.slug ?? '',
      inviterName: profileById.get(p.invited_by) ?? t('invitation.fallbackInviter'),
      createdAt: p.created_at,
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('list.title')}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t('list.subtitle')}
          </p>
        </div>
        <Link
          href="/feed/familias/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('list.createCta')}
        </Link>
      </div>

      {inviteVms.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t('list.pendingInvitations')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {inviteVms.map((inv) => (
              <FamilyInvitationCard key={inv.id} invite={inv} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t('list.myFamilies')}
        </h2>
        {families.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <UserGroupIcon className="h-12 w-12 text-zinc-400" />
            <h3 className="mt-4 text-base font-semibold text-zinc-800 dark:text-zinc-100">
              {t('list.empty.title')}
            </h3>
            <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              {t('list.empty.subtitle')}
            </p>
            <Link
              href="/feed/familias/nueva"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <PlusIcon className="h-4 w-4" />
              {t('list.empty.cta')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((f) => (
              <FamilyCard key={f.id} family={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
