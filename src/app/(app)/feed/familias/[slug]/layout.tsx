import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { getFamilyBySlug } from '@/features/families/server/families.server';
import { FamilyHeader } from '@/features/families/components/FamilyHeader';
import { FamilyTopTabs } from '@/features/families/components/FamilyTopTabs';
import {
  FamilyInvitationCard,
  type FamilyInvitationViewModel,
} from '@/features/families/components/FamilyInvitationCard';

interface FamilyLayoutProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function FamilyLayout({ params, children }: FamilyLayoutProps) {
  const { slug } = await params;
  const [t, user, family] = await Promise.all([
    getTranslations('familias'),
    getCachedAuthUser(),
    getFamilyBySlug(slug),
  ]);
  if (!user) redirect(`/login?redirect=/feed/familias/${slug}`);
  if (!family) notFound();

  // Member: show tabs + body
  if (family.viewer_role) {
    const isAdmin = family.viewer_role === 'owner' || family.viewer_role === 'admin';
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <FamilyHeader family={family} />
        <FamilyTopTabs slug={slug} isAdmin={isAdmin} />
        <div>{children}</div>
      </div>
    );
  }

  // Pending invite: show header preview + accept/decline banner, no tabs/body
  if (family.has_pending_invite) {
    const client = await getServerClient();
    const { data: invite } = await client
      .from('family_invitations')
      .select('id, invited_by, created_at')
      .eq('family_id', family.id)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    let inviterName = t('layout.fallbackInviter');
    if (invite) {
      const { data: profile } = await client
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', (invite as { invited_by: string }).invited_by)
        .maybeSingle();
      inviterName =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
        (profile?.username as string | undefined) ||
        t('layout.fallbackInviter');
    }

    const vm: FamilyInvitationViewModel | null = invite
      ? {
          id: (invite as { id: string }).id,
          familyName: family.name,
          familySlug: family.slug,
          inviterName,
          createdAt: (invite as { created_at: string }).created_at,
        }
      : null;

    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <FamilyHeader family={family} />
        {vm && <FamilyInvitationCard invite={vm} />}
        <p className="text-sm text-zinc-500">
          {t('layout.pendingInviteHint')}
        </p>
      </div>
    );
  }

  // Not a member and no pending invite — RLS already hides children, but show
  // an explicit 404 so we don't leak that this slug exists.
  notFound();
}
