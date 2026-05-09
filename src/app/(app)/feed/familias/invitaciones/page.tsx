import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeftIcon, EnvelopeIcon } from '@/components/icons/heroicons-shim';
import { getServerClient } from '@/utils/supabase/server';
import { listMyPendingFamilyInvitations } from '@/features/families/server/families.server';
import {
  FamilyInvitationCard,
  type FamilyInvitationViewModel,
} from '@/features/families/components/FamilyInvitationCard';

export const metadata = { title: 'Invitaciones a familias' };

export default async function FamilyInvitationsPage() {
  const client = await getServerClient();
  const { data: userRes } = await client.auth.getUser();
  if (!userRes.user) redirect('/login?redirect=/feed/familias/invitaciones');

  const pending = await listMyPendingFamilyInvitations();

  let vms: FamilyInvitationViewModel[] = [];
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
        [p.first_name, p.last_name].filter(Boolean).join(' ') || (p.username as string) || 'Alguien',
      ]),
    );
    vms = pending.map((p) => ({
      id: p.id,
      familyName: familyById.get(p.family_id)?.name ?? 'Una familia',
      familySlug: familyById.get(p.family_id)?.slug ?? '',
      inviterName: profileById.get(p.invited_by) ?? 'Alguien',
      createdAt: p.created_at,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/feed/familias"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a Familias
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Invitaciones a familias
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Acepta o rechaza las invitaciones que has recibido.
      </p>

      {vms.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <EnvelopeIcon className="h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-base font-semibold text-zinc-800 dark:text-zinc-100">
            No tienes invitaciones pendientes
          </h3>
          <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Cuando alguien te invite a su familia aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {vms.map((vm) => (
            <FamilyInvitationCard key={vm.id} invite={vm} />
          ))}
        </div>
      )}
    </div>
  );
}
