import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyMembers,
} from '@/features/families/server/families.server';
import { FamilyMembersList } from '@/features/families/components/FamilyMembersList';
import { InviteMemberDialog } from '@/features/families/components/InviteMemberDialog';
import { LeaveFamilyButton } from '@/features/families/components/LeaveFamilyButton';

export const metadata = { title: 'Miembros' };

export default async function FamilyMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const members = await getFamilyMembers(family.id);
  const canInvite = family.viewer_role === 'owner' || family.viewer_role === 'admin';
  const canLeave = family.viewer_role !== 'owner';
  const isOwner = family.viewer_role === 'owner';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Miembros ({members.length})
        </h2>
        {canInvite && <InviteMemberDialog familyId={family.id} />}
      </div>

      <FamilyMembersList members={members} familyId={family.id} showOwnerActions={isOwner} />

      {canLeave && (
        <div className="pt-2">
          <LeaveFamilyButton familyId={family.id} familyName={family.name} />
        </div>
      )}
    </div>
  );
}
